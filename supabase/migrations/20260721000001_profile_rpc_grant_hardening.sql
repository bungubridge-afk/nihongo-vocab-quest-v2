-- ============================================================================
-- Harden EXECUTE grants on the profile RPCs (anon must not be able to call
-- them at all) and close off the same hole for every function created after
-- this migration, via a default-privileges rule.
-- ============================================================================
-- Live QA against the already-applied 20260720000001 migration found that,
-- despite that migration's own `revoke all on function ... from public;`
-- statements, the `anon` role could still successfully call all four profile
-- RPCs against the real database:
--   - complete_user_profile / update_display_name / update_username only
--     rejected an anonymous caller because of their OWN internal
--     `if auth.uid() is null then raise exception` check (custom errcode
--     P0001) -- proof the function BODY executed, i.e. EXECUTE was granted.
--     A genuine permission-denied rejection (SQLSTATE 42501) would have
--     stopped the call before the function body ever ran.
--   - is_username_available has no such internal check and returned real
--     true/false availability data to a caller with no session at all.
--
-- Root cause: `revoke all on function ... from public` only revokes the
-- implicit EXECUTE grant Postgres gives the PUBLIC pseudo-role when a
-- function is created. Supabase additionally applies its own default-
-- privilege rule that grants EXECUTE directly to the named `anon` /
-- `authenticated` / `service_role` roles at function-creation time -- a grant
-- "revoke ... from public" does not touch, since it is a direct per-role
-- grant, not something anon merely inherits via PUBLIC. Fix: revoke from
-- `anon` (and `authenticated`, so the state is unambiguous) explicitly, by
-- exact signature, then re-grant only to the role that legitimately needs it.
--
-- All four RPCs are called exclusively by a signed-in user's own browser
-- session (see src/lib/profile/profileRepository.ts) -- none are server-side/
-- internal-only, so none need a service_role grant.
-- ============================================================================

revoke all on function public.is_username_available(text) from public, anon, authenticated;
grant execute on function public.is_username_available(text) to authenticated;

revoke all on function public.complete_user_profile(text, text) from public, anon, authenticated;
grant execute on function public.complete_user_profile(text, text) to authenticated;

revoke all on function public.update_display_name(text) from public, anon, authenticated;
grant execute on function public.update_display_name(text) to authenticated;

revoke all on function public.update_username(text) from public, anon, authenticated;
grant execute on function public.update_username(text) to authenticated;

-- ----------------------------------------------------------------------------
-- Default privileges: stop this class of bug at the source for every future
-- function, not just the four patched above.
-- ----------------------------------------------------------------------------
-- Only affects functions the `postgres` role creates in `public` FROM THIS
-- POINT FORWARD (ALTER DEFAULT PRIVILEGES is forward-looking only -- it never
-- touches privileges already granted on existing objects, so the four
-- revoke/grant pairs above remain necessary and this does not retroactively
-- change anything). Every migration in this project runs as `postgres`, so
-- this covers all future `create function` statements project-wide.
--
-- After this, a newly created SECURITY DEFINER function with no explicit
-- `grant execute ... to <role>` is callable by NOBODY (not even authenticated)
-- until a migration explicitly grants it -- turning "forgot the auth.uid()
-- null-check" from a silent anon-facing hole (as found above) into an
-- obvious, loud "permission denied for function" the first time anyone tries
-- to call it, caught immediately in QA rather than shipped silently.
alter default privileges for role postgres in schema public
  revoke execute on functions
  from public, anon, authenticated, service_role;
