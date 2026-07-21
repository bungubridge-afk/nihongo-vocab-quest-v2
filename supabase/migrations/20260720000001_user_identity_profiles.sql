-- ============================================================================
-- User identity profiles: display_name + username on top of user_profiles
-- ============================================================================
-- Design notes
-- - Two separate identity concepts (see docs/USER_PROFILE_IDENTITY_SPEC.md):
--     display_name — free-form, duplicates allowed, shown as "Anzeigename".
--     username     — unique handle shown as "@handle", case-insensitive unique,
--                    reserved for future search/friends/public profile.
-- - Nullable by design: existing users have neither set yet. A user with both
--   null/empty and profile_completed_at null is "incomplete" (see
--   src/lib/profile/profileValidation.ts -> isProfileComplete()).
-- - The Supabase internal auth.users UUID is never exposed to the client as an
--   identity; user_id stays a foreign key only, never rendered.
-- - All functions pin search_path to '' and use schema-qualified names, matching
--   the paid-foundation migration's conventions.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Phase 2: new nullable columns on user_profiles
-- ----------------------------------------------------------------------------
alter table public.user_profiles
  add column if not exists display_name text,
  add column if not exists username text,
  add column if not exists profile_completed_at timestamptz,
  add column if not exists username_changed_at timestamptz;

comment on column public.user_profiles.display_name is
  'Free-form display name ("Anzeigename"). Duplicates across users are allowed.';
comment on column public.user_profiles.username is
  'Unique handle stored WITHOUT the "@" prefix, always lowercase. Shown as "@" + username.';
comment on column public.user_profiles.profile_completed_at is
  'Set once display_name and username are both chosen for the first time. Null = setup pending.';
comment on column public.user_profiles.username_changed_at is
  'Set whenever username is (re-)assigned; reserved for a future cooldown policy.';

-- ----------------------------------------------------------------------------
-- Phase 6: DB-side validation (defense in depth, mirrors the client-side rules
-- in src/lib/profile/profileValidation.ts)
-- ----------------------------------------------------------------------------
-- NOTE on length checks: Postgres char_length() counts Unicode codepoints, same
-- as JavaScript's [...string].length (spread, NOT .length, which counts UTF-16
-- code units and would over-count astral characters such as many emoji). The
-- app's validators use the spread form specifically so client and server agree;
-- see docs/USERNAME_POLICY.md.
alter table public.user_profiles
  drop constraint if exists user_profiles_username_format_check;
alter table public.user_profiles
  add constraint user_profiles_username_format_check check (
    username is null or (
      username = lower(username)
      and char_length(username) between 3 and 20
      and username ~ '^[a-z0-9][a-z0-9_]{1,18}[a-z0-9]$'
    )
  );

alter table public.user_profiles
  drop constraint if exists user_profiles_display_name_check;
alter table public.user_profiles
  add constraint user_profiles_display_name_check check (
    display_name is null or (
      char_length(display_name) between 1 and 30
      -- btrim() only strips ASCII space; the app additionally rejects
      -- whitespace-only Unicode names client- and RPC-side before this ever runs.
      and btrim(display_name) <> ''
      -- Reject control characters (0x00-0x1F, 0x7F), incl. newlines/tabs, using
      -- the POSIX control-character class rather than a hand-rolled range.
      and display_name !~ '[[:cntrl:]]'
    )
  );

-- ----------------------------------------------------------------------------
-- Phase 5: DB-enforced uniqueness (case-insensitive), survives race conditions
-- ----------------------------------------------------------------------------
-- username is already stored lowercase (format check above), so a plain unique
-- index is sufficient and index-only lookups stay simple; still expressed via
-- lower() to make the case-insensitive intent explicit even if that ever changes.
create unique index if not exists user_profiles_username_unique_idx
  on public.user_profiles (lower(username))
  where username is not null;

-- ----------------------------------------------------------------------------
-- Reserved usernames: a dedicated table so the list can be extended via SQL
-- without a code deploy, and so both RPCs below share one source of truth.
-- ----------------------------------------------------------------------------
create table if not exists public.reserved_usernames (
  username text primary key
);

comment on table public.reserved_usernames is
  'Lowercase usernames that may never be claimed by a user. Mirrors RESERVED_USERNAMES in src/lib/profile/profileValidation.ts -- keep both lists in sync.';

insert into public.reserved_usernames (username) values
  ('admin'),
  ('administrator'),
  ('support'),
  ('help'),
  ('official'),
  ('nihongo'),
  ('nihongoquest'),
  ('moderator'),
  ('system'),
  ('root'),
  ('api'),
  ('account'),
  ('login'),
  ('signup'),
  ('settings'),
  ('profile')
on conflict (username) do nothing;

alter table public.reserved_usernames enable row level security;
-- No policies: RLS enabled with zero policies denies all client access outright
-- (authenticated and anon alike). Only the RPCs below (SECURITY DEFINER on the
-- reserved-word check) may read this table; there is nothing sensitive in it,
-- but there is also no legitimate reason for a client to query it directly.

-- ----------------------------------------------------------------------------
-- Phase 8: is_username_available -- boolean-only availability probe
-- ----------------------------------------------------------------------------
-- SECURITY DEFINER: the function itself never selects any user_profiles column
-- other than a row's existence, and reserved_usernames has no client SELECT
-- policy at all, so invoker rights alone couldn't read it. Only ever returns
-- true/false, never a row, a user_id, or which user holds the name.
create or replace function public.is_username_available(p_username text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_normalized text := lower(btrim(coalesce(p_username, '')));
begin
  if v_normalized !~ '^[a-z0-9][a-z0-9_]{1,18}[a-z0-9]$' then
    return false;
  end if;

  if exists (select 1 from public.reserved_usernames r where r.username = v_normalized) then
    return false;
  end if;

  return not exists (
    select 1 from public.user_profiles up where lower(up.username) = v_normalized
  );
end;
$$;

-- Any signed-in user may probe availability; the function leaks nothing beyond
-- a single boolean, so this is safe for the `authenticated` role.
revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to authenticated;

-- ----------------------------------------------------------------------------
-- Phase 8: complete_user_profile -- first-time display_name + username set
-- ----------------------------------------------------------------------------
-- SECURITY INVOKER: RLS still applies (own row only), consistent with
-- save_user_progress. The reserved-word check delegates to
-- is_username_available() (SECURITY DEFINER) rather than re-querying
-- reserved_usernames directly, since an invoker-rights function has no SELECT
-- policy on that table.
create or replace function public.complete_user_profile(
  p_display_name text,
  p_username text
)
returns public.user_profiles
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_display_name text := btrim(coalesce(p_display_name, ''));
  v_username text := lower(btrim(coalesce(p_username, '')));
  v_row public.user_profiles;
begin
  if v_user_id is null then
    raise exception 'complete_user_profile requires an authenticated user';
  end if;

  if char_length(v_display_name) < 1 or char_length(v_display_name) > 30
     or v_display_name ~ '[[:cntrl:]]' then
    raise exception 'invalid_display_name' using errcode = 'P0101';
  end if;

  if v_username !~ '^[a-z0-9][a-z0-9_]{1,18}[a-z0-9]$' then
    raise exception 'invalid_username' using errcode = 'P0102';
  end if;
  if not public.is_username_available(v_username) then
    -- Covers both "reserved" and "already taken" -- the final authority for
    -- "taken" is the unique index below either way (TOCTOU-safe).
    raise exception 'username_taken' using errcode = 'P0103';
  end if;

  update public.user_profiles up
  set display_name = v_display_name,
      username = v_username,
      profile_completed_at = coalesce(up.profile_completed_at, now()),
      username_changed_at = now()
  where up.user_id = v_user_id
  returning up.* into v_row;

  if not found then
    raise exception 'profile_not_found' using errcode = 'P0104';
  end if;

  return v_row;
exception
  when unique_violation then
    -- Race: someone else claimed the same username between the availability
    -- check above and this UPDATE. The unique index is the final authority.
    raise exception 'username_taken' using errcode = 'P0103';
end;
$$;

revoke all on function public.complete_user_profile(text, text) from public;
grant execute on function public.complete_user_profile(text, text) to authenticated;

-- ----------------------------------------------------------------------------
-- Phase 15: update_display_name -- free, unrestricted display-name change
-- ----------------------------------------------------------------------------
create or replace function public.update_display_name(p_display_name text)
returns public.user_profiles
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_display_name text := btrim(coalesce(p_display_name, ''));
  v_row public.user_profiles;
begin
  if v_user_id is null then
    raise exception 'update_display_name requires an authenticated user';
  end if;

  if char_length(v_display_name) < 1 or char_length(v_display_name) > 30
     or v_display_name ~ '[[:cntrl:]]' then
    raise exception 'invalid_display_name' using errcode = 'P0101';
  end if;

  update public.user_profiles up
  set display_name = v_display_name
  where up.user_id = v_user_id
  returning up.* into v_row;

  if not found then
    raise exception 'profile_not_found' using errcode = 'P0104';
  end if;

  return v_row;
end;
$$;

revoke all on function public.update_display_name(text) from public;
grant execute on function public.update_display_name(text) to authenticated;

-- ----------------------------------------------------------------------------
-- Phase 15: update_username -- separate, explicit username change
-- ----------------------------------------------------------------------------
create or replace function public.update_username(p_username text)
returns public.user_profiles
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_username text := lower(btrim(coalesce(p_username, '')));
  v_row public.user_profiles;
begin
  if v_user_id is null then
    raise exception 'update_username requires an authenticated user';
  end if;

  if v_username !~ '^[a-z0-9][a-z0-9_]{1,18}[a-z0-9]$' then
    raise exception 'invalid_username' using errcode = 'P0102';
  end if;
  if not public.is_username_available(v_username) then
    raise exception 'username_taken' using errcode = 'P0103';
  end if;

  update public.user_profiles up
  set username = v_username,
      username_changed_at = now()
  where up.user_id = v_user_id
  returning up.* into v_row;

  if not found then
    raise exception 'profile_not_found' using errcode = 'P0104';
  end if;

  return v_row;
exception
  when unique_violation then
    raise exception 'username_taken' using errcode = 'P0103';
end;
$$;

revoke all on function public.update_username(text) from public;
grant execute on function public.update_username(text) to authenticated;

-- ----------------------------------------------------------------------------
-- Security audit follow-up: DB-level reserved-username enforcement that is
-- independent of the RPC layer.
--
-- The RLS policy "user_profiles_update_own" (restated below) only restricts
-- *which row* an authenticated user may UPDATE -- own row only -- it places no
-- restriction whatsoever on *which values* they write to that row. A client
-- calling PostgREST/`supabase-js` directly against `user_profiles` (bypassing
-- complete_user_profile/update_username entirely, e.g. `.from('user_profiles')
-- .update({ username: 'admin' })`) would satisfy RLS and the format/uniqueness
-- constraints while still being able to claim a reserved handle. The reserved-
-- word check previously lived only inside is_username_available(), which
-- nothing forces a direct UPDATE to call -- so it was not, in fact, the "final
-- authority" the comments above and docs/USERNAME_POLICY.md claimed.
--
-- This BEFORE trigger closes that gap for every write path against the
-- column (RPC, direct client update, future service-role script) rather than
-- only the two RPCs, matching the request for a DB guarantee that "cannot be
-- bypassed" (回避不能). It duplicates the RPCs' own pre-check, so under normal
-- use it never fires (the RPCs already reject reserved names before reaching
-- their UPDATE) -- it exists purely as the enforcement point for paths that
-- skip the RPCs.
-- ----------------------------------------------------------------------------
create or replace function public.reject_reserved_username()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.username is not null
     and exists (
       select 1 from public.reserved_usernames r
       where r.username = lower(new.username)
     ) then
    -- Same errcode as the RPCs' own reserved/taken rejection, so any caller
    -- (RPC or direct) gets one consistent error to map client-side.
    raise exception 'username_taken' using errcode = 'P0103';
  end if;
  return new;
end;
$$;
revoke all on function public.reject_reserved_username() from public;
revoke all on function public.reject_reserved_username() from anon;
revoke all on function public.reject_reserved_username() from authenticated;
drop trigger if exists reject_reserved_username_trigger on public.user_profiles;
create trigger reject_reserved_username_trigger
  before insert or update of username on public.user_profiles
  for each row execute function public.reject_reserved_username();

-- ----------------------------------------------------------------------------
-- Phase 7: RLS re-confirmation -- unchanged from the paid-foundation migration.
-- Re-stated here (idempotent drop+create) so this migration is self-contained
-- and future readers don't have to cross-reference the earlier file to see the
-- current policy set on user_profiles.
-- ----------------------------------------------------------------------------
drop policy if exists "user_profiles_select_own" on public.user_profiles;
create policy "user_profiles_select_own"
  on public.user_profiles for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "user_profiles_insert_own" on public.user_profiles;
create policy "user_profiles_insert_own"
  on public.user_profiles for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "user_profiles_update_own" on public.user_profiles;
create policy "user_profiles_update_own"
  on public.user_profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- No public/other-user SELECT policy is added. Public profiles are a later
-- phase (see docs/USER_PROFILE_IDENTITY_SPEC.md "Future public profile").
