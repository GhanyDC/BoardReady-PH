create or replace function public.is_active_group_member_for_exam(
  target_group_id uuid,
  target_exam_program_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
    or exists (
      select 1
      from public.profiles p
      join public.groups g
        on g.id = p.current_group_id
      join public.group_members gm
        on gm.group_id = g.id
       and gm.user_id = p.id
      where p.id = auth.uid()
        and p.current_group_id = target_group_id
        and g.exam_program_id = target_exam_program_id
    );
$$;

create or replace function public.is_active_group_admin_for_exam(
  target_group_id uuid,
  target_exam_program_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
    or exists (
      select 1
      from public.profiles p
      join public.groups g
        on g.id = p.current_group_id
      join public.group_members gm
        on gm.group_id = g.id
       and gm.user_id = p.id
      where p.id = auth.uid()
        and p.current_group_id = target_group_id
        and g.exam_program_id = target_exam_program_id
        and gm.role in ('admin', 'super_admin')
    );
$$;

create or replace function public.can_access_active_topic(
  target_subject_id uuid,
  target_group_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
    or exists (
      select 1
      from public.subjects s
      where s.id = target_subject_id
        and s.group_id = target_group_id
        and public.is_active_group_member_for_exam(s.group_id, s.exam_program_id)
    );
$$;

create or replace function public.can_manage_active_topic(
  target_subject_id uuid,
  target_group_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
    or exists (
      select 1
      from public.subjects s
      where s.id = target_subject_id
        and s.group_id = target_group_id
        and public.is_active_group_admin_for_exam(s.group_id, s.exam_program_id)
    );
$$;

drop policy if exists "Group members can read subjects" on public.subjects;
drop policy if exists "Admins can create subjects" on public.subjects;
drop policy if exists "Admins can update subjects" on public.subjects;
drop policy if exists "Admins can delete subjects" on public.subjects;
drop policy if exists "Group members can read topics" on public.topics;
drop policy if exists "Admins can create topics" on public.topics;
drop policy if exists "Admins can update topics" on public.topics;
drop policy if exists "Admins can delete topics" on public.topics;

create policy "Active group members can read subjects"
on public.subjects
for select
to authenticated
using (public.is_active_group_member_for_exam(group_id, exam_program_id));

create policy "Active group admins can create subjects"
on public.subjects
for insert
to authenticated
with check (public.is_active_group_admin_for_exam(group_id, exam_program_id));

create policy "Active group admins can update subjects"
on public.subjects
for update
to authenticated
using (public.is_active_group_admin_for_exam(group_id, exam_program_id))
with check (public.is_active_group_admin_for_exam(group_id, exam_program_id));

create policy "Active group admins can delete subjects"
on public.subjects
for delete
to authenticated
using (public.is_active_group_admin_for_exam(group_id, exam_program_id));

create policy "Active group members can read topics"
on public.topics
for select
to authenticated
using (public.can_access_active_topic(subject_id, group_id));

create policy "Active group admins can create topics"
on public.topics
for insert
to authenticated
with check (public.can_manage_active_topic(subject_id, group_id));

create policy "Active group admins can update topics"
on public.topics
for update
to authenticated
using (public.can_manage_active_topic(subject_id, group_id))
with check (public.can_manage_active_topic(subject_id, group_id));

create policy "Active group admins can delete topics"
on public.topics
for delete
to authenticated
using (public.can_manage_active_topic(subject_id, group_id));

grant execute on function public.is_active_group_member_for_exam(uuid, uuid) to authenticated;
grant execute on function public.is_active_group_admin_for_exam(uuid, uuid) to authenticated;
grant execute on function public.can_access_active_topic(uuid, uuid) to authenticated;
grant execute on function public.can_manage_active_topic(uuid, uuid) to authenticated;
