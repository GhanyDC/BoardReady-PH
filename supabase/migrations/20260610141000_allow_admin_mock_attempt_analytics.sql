create or replace function public.can_read_mock_exam_attempt(
  target_mock_exam_attempt_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.mock_exam_attempts mea
    where mea.id = target_mock_exam_attempt_id
      and (
        mea.user_id = auth.uid()
        or public.is_active_group_admin_for_exam(mea.group_id, mea.exam_program_id)
        or public.is_super_admin()
      )
  );
$$;

grant execute on function public.can_read_mock_exam_attempt(uuid) to authenticated;
