drop policy if exists "Users can create own active weak areas"
on public.weak_areas;

drop policy if exists "Users can update own active weak areas"
on public.weak_areas;

drop policy if exists "Users can delete own active weak areas"
on public.weak_areas;

revoke insert, update, delete on public.weak_areas from authenticated;
grant select on public.weak_areas to authenticated;

comment on table public.weak_areas is
  'Derived topic learning-status snapshot refreshed by refresh_user_weak_areas; clients should not directly mutate rows.';

comment on function public.refresh_user_weak_areas(uuid, uuid) is
  'Security-definer refresh path for the current user active group and exam program weak_areas snapshot.';
