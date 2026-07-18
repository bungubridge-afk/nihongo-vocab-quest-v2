-- ============================================================================
-- Paid foundation: user_profiles, user_progress, user_entitlements
-- ============================================================================
-- Design notes
-- - Email lives only in auth.users; it is never duplicated into public tables.
-- - user_progress.progress mirrors the app's AppProgress type
--   (src/lib/progress/progressTypes.ts); its initial value must stay identical
--   to createInitialProgress().
-- - user_entitlements is read-only for clients (no INSERT/UPDATE/DELETE
--   policies). Writes happen only via service role (future Stripe webhook /
--   admin jobs) or the SQL editor for manual test grants.
-- - All functions pin search_path to '' and use schema-qualified names.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- A. user_profiles — per-account app settings (no email, no payment data)
-- ----------------------------------------------------------------------------
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  locale text not null default 'de',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_profiles is
  'App settings per account. Email stays in auth.users only.';

-- ----------------------------------------------------------------------------
-- B. user_progress — one AppProgress JSON blob per account
-- ----------------------------------------------------------------------------
-- revision 0 means "never written by a client" (only the signup trigger); every
-- successful client save increments it by exactly 1 (see save_user_progress).
create table if not exists public.user_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  progress jsonb not null default '{
    "profile": null,
    "xp": 0,
    "collectedCardIds": [],
    "completedCategories": [],
    "unlockedCategories": ["cafe"],
    "knownWords": [],
    "weakWords": []
  }'::jsonb,
  schema_version integer not null default 1,
  revision bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_progress_revision_nonnegative check (revision >= 0),
  constraint user_progress_schema_version_positive check (schema_version >= 1),
  constraint user_progress_progress_is_object check (jsonb_typeof(progress) = 'object')
);

comment on table public.user_progress is
  'Learner progress (AppProgress JSON). Never stores premium flags, Stripe ids or email.';
comment on column public.user_progress.revision is
  'Optimistic-concurrency counter: 0 = untouched initial row, +1 per client save.';

-- ----------------------------------------------------------------------------
-- C. user_entitlements — paid access rights (client read-only)
-- ----------------------------------------------------------------------------
create table if not exists public.user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_key text not null,
  status text not null,
  source text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint user_entitlements_user_product_unique unique (user_id, product_key),
  constraint user_entitlements_product_key_check check (
    product_key in ('premium_subscription', 'premium_lifetime', 'area2_pack')
  ),
  constraint user_entitlements_status_check check (
    status in ('active', 'trialing', 'past_due', 'canceled', 'expired', 'revoked')
  ),
  constraint user_entitlements_source_check check (
    source in ('manual', 'stripe', 'migration', 'promotion')
  ),
  constraint user_entitlements_metadata_is_object check (jsonb_typeof(metadata) = 'object')
);

create index if not exists user_entitlements_user_id_idx
  on public.user_entitlements (user_id);

comment on table public.user_entitlements is
  'Paid access rights. Written only by trusted server-side actors; clients may only SELECT their own rows. metadata must never contain payment secrets.';

-- ----------------------------------------------------------------------------
-- updated_at maintenance
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_profiles_updated_at on public.user_profiles;
create trigger set_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_user_progress_updated_at on public.user_progress;
create trigger set_user_progress_updated_at
  before update on public.user_progress
  for each row execute function public.set_updated_at();

drop trigger if exists set_user_entitlements_updated_at on public.user_entitlements;
create trigger set_user_entitlements_updated_at
  before update on public.user_entitlements
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Signup trigger: auto-create profile + initial progress for every new user
-- ----------------------------------------------------------------------------
-- SECURITY DEFINER because auth.users inserts run without access to public
-- tables' RLS context; search_path pinned to '' against search-path hijacking.
-- ON CONFLICT DO NOTHING makes it idempotent (no duplicates if re-fired).
-- NOTE: if this trigger raises, the signup itself fails — that is why it only
-- performs two trivially-valid inserts (see docs/AUTH_DB_QA.md).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  -- Initial progress = createInitialProgress() in the app (column default).
  insert into public.user_progress (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Conditional save with revision check (optimistic concurrency)
-- ----------------------------------------------------------------------------
-- SECURITY INVOKER on purpose: RLS still applies, so a user can only ever touch
-- their own row. Returns saved=false plus the current remote row when the
-- expected revision no longer matches — the client then merges and retries
-- instead of blindly overwriting (no last-write-wins data loss).
create or replace function public.save_user_progress(
  p_progress jsonb,
  p_expected_revision bigint,
  p_schema_version integer default 1
)
returns table (
  saved boolean,
  revision bigint,
  progress jsonb,
  schema_version integer
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_rows integer := 0;
begin
  if v_user_id is null then
    raise exception 'save_user_progress requires an authenticated user';
  end if;

  if jsonb_typeof(p_progress) <> 'object' then
    raise exception 'progress must be a JSON object';
  end if;

  -- Self-heal: if the signup trigger ever failed to create the row, the first
  -- save creates it (RLS insert policy: own row only).
  insert into public.user_progress (user_id, progress, schema_version, revision)
  values (v_user_id, p_progress, p_schema_version, 1)
  on conflict (user_id) do nothing;
  if found then
    return query
      select true, up.revision, up.progress, up.schema_version
      from public.user_progress up
      where up.user_id = v_user_id;
    return;
  end if;

  update public.user_progress up
  set progress = p_progress,
      schema_version = p_schema_version,
      revision = up.revision + 1
  where up.user_id = v_user_id
    and up.revision = p_expected_revision;
  get diagnostics v_rows = row_count;

  return query
    select (v_rows = 1), up.revision, up.progress, up.schema_version
    from public.user_progress up
    where up.user_id = v_user_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.user_profiles enable row level security;
alter table public.user_progress enable row level security;
alter table public.user_entitlements enable row level security;

-- user_profiles: own row only (select / insert / update; no delete)
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

-- user_progress: own row only (select / insert / update; no delete)
drop policy if exists "user_progress_select_own" on public.user_progress;
create policy "user_progress_select_own"
  on public.user_progress for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "user_progress_insert_own" on public.user_progress;
create policy "user_progress_insert_own"
  on public.user_progress for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "user_progress_update_own" on public.user_progress;
create policy "user_progress_update_own"
  on public.user_progress for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- user_entitlements: SELECT own rows only. Deliberately NO insert/update/delete
-- policies — with RLS enabled, the absence of a policy denies the operation, so
-- a normal client can never grant itself Premium. The service role (future
-- Stripe webhook) bypasses RLS.
drop policy if exists "user_entitlements_select_own" on public.user_entitlements;
create policy "user_entitlements_select_own"
  on public.user_entitlements for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Defense in depth: drop the default table grants for write operations, so even
-- a future accidentally-permissive policy could not open client writes.
revoke insert, update, delete on public.user_entitlements from anon, authenticated;
