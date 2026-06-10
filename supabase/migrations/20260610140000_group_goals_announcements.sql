create table if not exists public.group_goals (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  exam_program_id uuid not null references public.exam_programs(id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 2 and 180),
  description text check (
    description is null
    or char_length(btrim(description)) <= 2000
  ),
  goal_type text not null default 'custom' check (
    goal_type in (
      'study_minutes',
      'questions_answered',
      'mock_exams_completed',
      'external_drills_logged',
      'custom'
    )
  ),
  target_value integer not null check (target_value > 0),
  start_date date not null default current_date,
  end_date date not null check (end_date >= start_date),
  status text not null default 'draft' check (
    status in ('draft', 'active', 'completed', 'archived')
  ),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (group_id, exam_program_id)
    references public.groups(id, exam_program_id)
    on update cascade
    on delete cascade
);

create table if not exists public.group_announcements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  exam_program_id uuid not null references public.exam_programs(id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 2 and 180),
  body text not null check (char_length(btrim(body)) between 2 and 4000),
  visibility text not null default 'all' check (
    visibility in ('reviewers', 'admins', 'all')
  ),
  status text not null default 'draft' check (
    status in ('draft', 'published', 'archived')
  ),
  created_by uuid not null references auth.users(id) on delete restrict,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (group_id, exam_program_id)
    references public.groups(id, exam_program_id)
    on update cascade
    on delete cascade
);

comment on table public.group_goals is
  'Group-scoped aggregate accountability goals. These do not store individual private notes or weakness rankings.';

comment on table public.group_announcements is
  'Group-scoped admin announcements for reviewers, admins, or all group members.';

drop trigger if exists set_group_goals_updated_at on public.group_goals;
create trigger set_group_goals_updated_at
before update on public.group_goals
for each row execute function public.set_updated_at();

drop trigger if exists set_group_announcements_updated_at on public.group_announcements;
create trigger set_group_announcements_updated_at
before update on public.group_announcements
for each row execute function public.set_updated_at();

create index if not exists group_goals_context_status_idx
on public.group_goals using btree (
  group_id,
  exam_program_id,
  status,
  end_date desc
);

create index if not exists group_announcements_context_status_idx
on public.group_announcements using btree (
  group_id,
  exam_program_id,
  status,
  published_at desc
);

create or replace function public.can_read_group_goal(target_group_goal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_goals gg
    where gg.id = target_group_goal_id
      and (
        public.is_active_group_admin_for_exam(gg.group_id, gg.exam_program_id)
        or (
          gg.status = 'active'
          and public.is_active_group_member_for_exam(gg.group_id, gg.exam_program_id)
        )
      )
  );
$$;

create or replace function public.can_manage_group_goal(target_group_goal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_goals gg
    where gg.id = target_group_goal_id
      and public.is_active_group_admin_for_exam(gg.group_id, gg.exam_program_id)
  );
$$;

create or replace function public.can_read_group_announcement(
  target_group_announcement_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_announcements ga
    where ga.id = target_group_announcement_id
      and (
        public.is_active_group_admin_for_exam(ga.group_id, ga.exam_program_id)
        or (
          ga.status = 'published'
          and ga.visibility in ('reviewers', 'all')
          and public.is_active_group_member_for_exam(ga.group_id, ga.exam_program_id)
        )
      )
  );
$$;

create or replace function public.can_manage_group_announcement(
  target_group_announcement_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_announcements ga
    where ga.id = target_group_announcement_id
      and public.is_active_group_admin_for_exam(ga.group_id, ga.exam_program_id)
  );
$$;

create or replace function public.validate_group_goal_before_save()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.title := regexp_replace(btrim(new.title), '\s+', ' ', 'g');
  new.description := nullif(btrim(coalesce(new.description, '')), '');

  if not public.is_active_group_admin_for_exam(
    new.group_id,
    new.exam_program_id
  ) then
    raise exception 'Group goals can only be managed by active group admins.';
  end if;

  return new;
end;
$$;

create or replace function public.validate_group_announcement_before_save()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.title := regexp_replace(btrim(new.title), '\s+', ' ', 'g');
  new.body := btrim(new.body);

  if not public.is_active_group_admin_for_exam(
    new.group_id,
    new.exam_program_id
  ) then
    raise exception 'Group announcements can only be managed by active group admins.';
  end if;

  if new.status = 'published' then
    if tg_op = 'INSERT' or old.status is distinct from 'published' then
      new.published_at := coalesce(new.published_at, now());
    end if;
  end if;

  if new.status = 'archived' and (tg_op = 'INSERT' or old.status is distinct from 'archived') then
    new.archived_at := coalesce(new.archived_at, now());
  end if;

  return new;
end;
$$;

drop trigger if exists validate_group_goal_before_save on public.group_goals;
create trigger validate_group_goal_before_save
before insert or update on public.group_goals
for each row execute function public.validate_group_goal_before_save();

drop trigger if exists validate_group_announcement_before_save
on public.group_announcements;
create trigger validate_group_announcement_before_save
before insert or update on public.group_announcements
for each row execute function public.validate_group_announcement_before_save();

alter table public.group_goals enable row level security;
alter table public.group_announcements enable row level security;

create policy "Members can read visible group goals"
on public.group_goals
for select
to authenticated
using (public.can_read_group_goal(id));

create policy "Active group admins can create group goals"
on public.group_goals
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.is_active_group_admin_for_exam(group_id, exam_program_id)
);

create policy "Active group admins can update group goals"
on public.group_goals
for update
to authenticated
using (public.is_active_group_admin_for_exam(group_id, exam_program_id))
with check (public.is_active_group_admin_for_exam(group_id, exam_program_id));

create policy "Active group admins can delete group goals"
on public.group_goals
for delete
to authenticated
using (public.is_active_group_admin_for_exam(group_id, exam_program_id));

create policy "Members can read visible group announcements"
on public.group_announcements
for select
to authenticated
using (public.can_read_group_announcement(id));

create policy "Active group admins can create group announcements"
on public.group_announcements
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.is_active_group_admin_for_exam(group_id, exam_program_id)
);

create policy "Active group admins can update group announcements"
on public.group_announcements
for update
to authenticated
using (public.is_active_group_admin_for_exam(group_id, exam_program_id))
with check (public.is_active_group_admin_for_exam(group_id, exam_program_id));

create policy "Active group admins can delete group announcements"
on public.group_announcements
for delete
to authenticated
using (public.is_active_group_admin_for_exam(group_id, exam_program_id));

grant select, insert, update, delete on public.group_goals to authenticated;
grant select, insert, update, delete on public.group_announcements to authenticated;
grant execute on function public.can_read_group_goal(uuid) to authenticated;
grant execute on function public.can_manage_group_goal(uuid) to authenticated;
grant execute on function public.can_read_group_announcement(uuid) to authenticated;
grant execute on function public.can_manage_group_announcement(uuid) to authenticated;
