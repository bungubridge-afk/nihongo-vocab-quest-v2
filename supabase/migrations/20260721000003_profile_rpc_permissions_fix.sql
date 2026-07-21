begin;

revoke execute on function public.is_username_available(text)
  from public, anon, authenticated, service_role;

revoke execute on function public.complete_user_profile(text, text)
  from public, anon, authenticated, service_role;

revoke execute on function public.update_display_name(text)
  from public, anon, authenticated, service_role;

revoke execute on function public.update_username(text)
  from public, anon, authenticated, service_role;

grant execute on function public.is_username_available(text)
  to authenticated;

grant execute on function public.complete_user_profile(text, text)
  to authenticated;

grant execute on function public.update_display_name(text)
  to authenticated;

grant execute on function public.update_username(text)
  to authenticated;

alter default privileges for role postgres in schema public
  revoke execute on functions
  from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke execute on functions
  from public;

commit;
