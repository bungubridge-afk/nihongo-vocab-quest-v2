-- ============================================================================
-- Make user_profiles.locale bilingual-aware: constrain its values and let a
-- freshly-created profile start "unset" so a pre-signup language choice wins.
-- ============================================================================
-- Context: the bilingual (English/German) rollout makes `locale` a value the
-- client writes directly (own row only, via RLS) whenever a signed-in user
-- switches language. `locale` already existed from the paid-foundation migration
-- as `text not null default 'de'` with NO value constraint.
--
-- Two changes, both minimal and scoped to the `locale` column only (user_progress,
-- user_entitlements, XP, revision, RLS and all other columns are untouched):
--
-- 1. CHECK constraint: allow only NULL or the supported locales. The app already
--    reads locale defensively (normalizeLocale falls back), but DB integrity must
--    not depend on every reader remembering to normalize. Existing rows are all
--    'de' (the old default, the only value the pre-i18n app ever wrote), so this
--    validates cleanly against current data.
--
-- 2. Default NULL instead of 'de': the signup trigger `handle_new_user` inserts a
--    profile WITHOUT specifying locale, so it inherits the column default. With
--    the old 'de' default, a brand-new English user who picked "English" before
--    signing up would have their choice overwritten by a 'de' row the moment the
--    account was created. Defaulting to NULL means "not chosen yet": the client
--    LanguageProvider then back-fills the account from the user's actual pre-signup
--    choice (its cookie) instead of adopting a wrong default. Existing rows keep
--    their current 'de' value (this only changes the default for NEW inserts) and
--    are treated as German users, exactly as before.
-- ============================================================================

alter table public.user_profiles
  alter column locale drop not null;

alter table public.user_profiles
  alter column locale set default null;

alter table public.user_profiles
  drop constraint if exists user_profiles_locale_check;

alter table public.user_profiles
  add constraint user_profiles_locale_check check (
    locale is null or locale in ('en', 'de')
  );
