create or replace function public.can_read_mock_exam(target_mock_exam_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.mock_exams me
    where me.id = target_mock_exam_id
      and (
        public.is_active_group_admin_for_exam(me.group_id, me.exam_program_id)
        or (
          me.status = 'published'
          and public.is_active_group_member_for_exam(me.group_id, me.exam_program_id)
        )
        or exists (
          select 1
          from public.mock_exam_attempts mea
          where mea.mock_exam_id = me.id
            and mea.user_id = auth.uid()
        )
      )
  );
$$;

grant execute on function public.can_read_mock_exam(uuid) to authenticated;
