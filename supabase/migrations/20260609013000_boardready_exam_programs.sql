-- This migration assumes no non-Psychometrician groups or subjects existed
-- before the exam_programs refactor. Existing groups and subjects are
-- backfilled to Psychometrician Licensure Exam.

create table if not exists public.exam_programs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 160),
  slug text not null unique check (
    slug = lower(slug)
    and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  description text,
  exam_type text not null check (char_length(btrim(exam_type)) between 2 and 80),
  country text not null check (char_length(btrim(country)) between 2 and 80),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.exam_programs is
  'Exam tracks supported by BoardReady PH, such as licensure or major exams.';

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_exam_programs_updated_at'
  ) then
    create trigger set_exam_programs_updated_at
    before update on public.exam_programs
    for each row execute function public.set_updated_at();
  end if;
end
$$;

insert into public.exam_programs (
  id,
  name,
  slug,
  description,
  exam_type,
  country,
  is_active
)
values (
  '00000000-0000-0000-0000-000000000201',
  'Psychometrician Licensure Exam',
  'psychometrician-licensure-exam',
  'First supported exam track for BoardReady PH.',
  'licensure',
  'Philippines',
  true
)
on conflict (id) do update
set name = excluded.name,
    slug = excluded.slug,
    description = excluded.description,
    exam_type = excluded.exam_type,
    country = excluded.country,
    is_active = excluded.is_active,
    updated_at = now();

alter table public.groups
add column if not exists exam_program_id uuid;

alter table public.subjects
add column if not exists exam_program_id uuid;

update public.groups
set exam_program_id = '00000000-0000-0000-0000-000000000201'
where exam_program_id is null;

update public.subjects s
set exam_program_id = coalesce(
  g.exam_program_id,
  '00000000-0000-0000-0000-000000000201'
)
from public.groups g
where s.group_id = g.id
  and s.exam_program_id is null;

alter table public.groups
alter column exam_program_id set not null;

alter table public.subjects
alter column exam_program_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'groups_exam_program_id_fkey'
  ) then
    alter table public.groups
    add constraint groups_exam_program_id_fkey
    foreign key (exam_program_id)
    references public.exam_programs(id)
    on update cascade
    on delete restrict;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'groups_id_exam_program_id_key'
  ) then
    alter table public.groups
    add constraint groups_id_exam_program_id_key
    unique (id, exam_program_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'subjects_exam_program_id_fkey'
  ) then
    alter table public.subjects
    add constraint subjects_exam_program_id_fkey
    foreign key (exam_program_id)
    references public.exam_programs(id)
    on update cascade
    on delete restrict;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'subjects_group_exam_program_fkey'
  ) then
    alter table public.subjects
    add constraint subjects_group_exam_program_fkey
    foreign key (group_id, exam_program_id)
    references public.groups(id, exam_program_id)
    on update cascade
    on delete cascade;
  end if;
end
$$;

comment on column public.groups.exam_program_id is
  'Exam track assigned to this group.';

comment on column public.subjects.exam_program_id is
  'Exam track this subject belongs to. Must match the subject group exam track.';

create index if not exists groups_exam_program_id_idx
on public.groups using btree (exam_program_id);

create index if not exists subjects_exam_program_id_idx
on public.subjects using btree (exam_program_id);

insert into public.groups (id, name, invite_code, exam_program_id)
values (
  '00000000-0000-0000-0000-000000000001',
  'BoardReady PH Founding Review Group',
  'BOARDREADY-PH',
  '00000000-0000-0000-0000-000000000201'
)
on conflict (id) do update
set name = excluded.name,
    invite_code = excluded.invite_code,
    exam_program_id = excluded.exam_program_id,
    updated_at = now();

insert into public.subjects (
  id,
  group_id,
  exam_program_id,
  name,
  board_weight,
  sort_order
)
values
  (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000201',
    'Psychological Assessment',
    40,
    1
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000201',
    'Developmental Psychology',
    20,
    2
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000201',
    'Abnormal Psychology',
    20,
    3
  ),
  (
    '00000000-0000-0000-0000-000000000104',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000201',
    'Industrial-Organizational Psychology',
    20,
    4
  )
on conflict (id) do update
set group_id = excluded.group_id,
    exam_program_id = excluded.exam_program_id,
    name = excluded.name,
    board_weight = excluded.board_weight,
    sort_order = excluded.sort_order,
    updated_at = now();

create or replace function public.can_access_exam_program(target_exam_program_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
    or exists (
      select 1
      from public.groups g
      join public.group_members gm
        on gm.group_id = g.id
      where g.exam_program_id = target_exam_program_id
        and gm.user_id = auth.uid()
    );
$$;

create or replace function public.is_group_member_for_exam(
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
      from public.groups g
      join public.group_members gm
        on gm.group_id = g.id
      where g.id = target_group_id
        and g.exam_program_id = target_exam_program_id
        and gm.user_id = auth.uid()
    );
$$;

create or replace function public.is_group_admin_for_exam(
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
      from public.groups g
      join public.group_members gm
        on gm.group_id = g.id
      where g.id = target_group_id
        and g.exam_program_id = target_exam_program_id
        and gm.user_id = auth.uid()
        and gm.role in ('admin', 'super_admin')
    );
$$;

create or replace function public.can_access_topic(
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
      join public.groups g
        on g.id = s.group_id
       and g.exam_program_id = s.exam_program_id
      join public.group_members gm
        on gm.group_id = g.id
      where s.id = target_subject_id
        and s.group_id = target_group_id
        and gm.user_id = auth.uid()
    );
$$;

create or replace function public.can_manage_topic(
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
      join public.groups g
        on g.id = s.group_id
       and g.exam_program_id = s.exam_program_id
      join public.group_members gm
        on gm.group_id = g.id
      where s.id = target_subject_id
        and s.group_id = target_group_id
        and gm.user_id = auth.uid()
        and gm.role in ('admin', 'super_admin')
    );
$$;

drop function if exists public.join_group_with_invite(text, text);

create function public.join_group_with_invite(
  p_invite_code text,
  p_full_name text
)
returns table (
  group_id uuid,
  group_name text,
  exam_program_id uuid,
  exam_program_name text,
  role public.app_role
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_code text;
  normalized_name text;
  target_group public.groups%rowtype;
  target_exam_program public.exam_programs%rowtype;
  member_role public.app_role;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  normalized_code := upper(btrim(coalesce(p_invite_code, '')));
  normalized_name := regexp_replace(btrim(coalesce(p_full_name, '')), '\s+', ' ', 'g');

  if char_length(normalized_name) < 2 then
    raise exception 'Full name is required.';
  end if;

  select *
  into target_group
  from public.groups g
  where g.invite_code = normalized_code;

  if target_group.id is null then
    raise exception 'Invalid group invite code.';
  end if;

  select *
  into target_exam_program
  from public.exam_programs ep
  where ep.id = target_group.exam_program_id
    and ep.is_active = true;

  if target_exam_program.id is null then
    raise exception 'This group is not connected to an active exam track.';
  end if;

  insert into public.profiles (id, full_name, onboarding_completed)
  values (auth.uid(), normalized_name, true)
  on conflict (id) do update
  set full_name = excluded.full_name,
      onboarding_completed = true,
      updated_at = now();

  insert into public.group_members (group_id, user_id, role)
  values (target_group.id, auth.uid(), 'reviewer')
  on conflict (group_id, user_id) do nothing;

  select gm.role
  into member_role
  from public.group_members gm
  where gm.group_id = target_group.id
    and gm.user_id = auth.uid();

  return query
  select
    target_group.id,
    target_group.name,
    target_exam_program.id,
    target_exam_program.name,
    member_role;
end;
$$;

alter table public.exam_programs enable row level security;

create policy "Members can read their exam programs"
on public.exam_programs
for select
to authenticated
using (public.can_access_exam_program(id));

create policy "Super admins can create exam programs"
on public.exam_programs
for insert
to authenticated
with check (public.is_super_admin());

create policy "Super admins can update exam programs"
on public.exam_programs
for update
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "Super admins can delete exam programs"
on public.exam_programs
for delete
to authenticated
using (public.is_super_admin());

drop policy if exists "Group members can read subjects" on public.subjects;
drop policy if exists "Admins can create subjects" on public.subjects;
drop policy if exists "Admins can update subjects" on public.subjects;
drop policy if exists "Admins can delete subjects" on public.subjects;
drop policy if exists "Group members can read topics" on public.topics;
drop policy if exists "Admins can create topics" on public.topics;
drop policy if exists "Admins can update topics" on public.topics;
drop policy if exists "Admins can delete topics" on public.topics;

create policy "Group members can read subjects"
on public.subjects
for select
to authenticated
using (public.is_group_member_for_exam(group_id, exam_program_id));

create policy "Admins can create subjects"
on public.subjects
for insert
to authenticated
with check (public.is_group_admin_for_exam(group_id, exam_program_id));

create policy "Admins can update subjects"
on public.subjects
for update
to authenticated
using (public.is_group_admin_for_exam(group_id, exam_program_id))
with check (public.is_group_admin_for_exam(group_id, exam_program_id));

create policy "Admins can delete subjects"
on public.subjects
for delete
to authenticated
using (public.is_group_admin_for_exam(group_id, exam_program_id));

create policy "Group members can read topics"
on public.topics
for select
to authenticated
using (public.can_access_topic(subject_id, group_id));

create policy "Admins can create topics"
on public.topics
for insert
to authenticated
with check (public.can_manage_topic(subject_id, group_id));

create policy "Admins can update topics"
on public.topics
for update
to authenticated
using (public.can_manage_topic(subject_id, group_id))
with check (public.can_manage_topic(subject_id, group_id));

create policy "Admins can delete topics"
on public.topics
for delete
to authenticated
using (public.can_manage_topic(subject_id, group_id));

grant select, insert, update, delete on public.exam_programs to authenticated;
grant execute on function public.can_access_exam_program(uuid) to authenticated;
grant execute on function public.is_group_member_for_exam(uuid, uuid) to authenticated;
grant execute on function public.is_group_admin_for_exam(uuid, uuid) to authenticated;
grant execute on function public.can_access_topic(uuid, uuid) to authenticated;
grant execute on function public.can_manage_topic(uuid, uuid) to authenticated;
grant execute on function public.join_group_with_invite(text, text) to authenticated;
