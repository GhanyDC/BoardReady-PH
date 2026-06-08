create table public.study_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  exam_program_id uuid not null references public.exam_programs(id) on delete restrict,
  daily_goal_minutes integer not null default 60 check (daily_goal_minutes between 1 and 1440),
  weekly_goal_minutes integer not null default 420 check (weekly_goal_minutes between 1 and 10080),
  preferred_session_length_minutes integer not null default 50 check (preferred_session_length_minutes between 5 and 480),
  preferred_study_time text not null default 'mixed' check (
    preferred_study_time in ('morning', 'afternoon', 'evening', 'night', 'mixed')
  ),
  preferred_study_style text not null default 'mixed' check (
    preferred_study_style in ('drills', 'notes', 'mock_exams', 'flashcards', 'mixed')
  ),
  weakness_strategy text not null default 'balanced_review' check (
    weakness_strategy in ('focus_weak_areas', 'balanced_review', 'maintain_strengths', 'exam_weighted')
  ),
  rest_days text[] not null default '{}'::text[],
  target_exam_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, group_id, exam_program_id),
  foreign key (group_id, exam_program_id)
    references public.groups(id, exam_program_id)
    on update cascade
    on delete cascade
);

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  exam_program_id uuid not null references public.exam_programs(id) on delete restrict,
  subject_id uuid references public.subjects(id) on delete set null,
  topic_id uuid references public.topics(id) on delete set null,
  activity_type text not null check (
    activity_type in (
      'watching_lecture',
      'reading_notes',
      'answering_drills',
      'rationalizing_answers',
      'mock_exam',
      'group_study',
      'other'
    )
  ),
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer not null check (duration_seconds > 0),
  focus_rating integer check (focus_rating is null or focus_rating between 1 and 5),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (group_id, exam_program_id)
    references public.groups(id, exam_program_id)
    on update cascade
    on delete cascade,
  check (ended_at is null or ended_at >= started_at)
);

create trigger set_study_preferences_updated_at
before update on public.study_preferences
for each row execute function public.set_updated_at();

create trigger set_study_sessions_updated_at
before update on public.study_sessions
for each row execute function public.set_updated_at();

create index study_preferences_user_context_idx
on public.study_preferences using btree (user_id, group_id, exam_program_id);

create index study_sessions_user_started_at_idx
on public.study_sessions using btree (user_id, started_at desc);

create index study_sessions_context_started_at_idx
on public.study_sessions using btree (group_id, exam_program_id, started_at desc);

create index study_sessions_subject_id_idx
on public.study_sessions using btree (subject_id);

create index study_sessions_topic_id_idx
on public.study_sessions using btree (topic_id);

create or replace function public.is_active_study_context(
  target_user_id uuid,
  target_group_id uuid,
  target_exam_program_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_user_id = auth.uid()
    and public.is_active_group_member_for_exam(target_group_id, target_exam_program_id);
$$;

create or replace function public.is_valid_study_subject(
  target_subject_id uuid,
  target_group_id uuid,
  target_exam_program_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_subject_id is null
    or exists (
      select 1
      from public.subjects s
      where s.id = target_subject_id
        and s.group_id = target_group_id
        and s.exam_program_id = target_exam_program_id
        and s.is_active = true
    );
$$;

create or replace function public.is_valid_study_topic(
  target_topic_id uuid,
  target_subject_id uuid,
  target_group_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_topic_id is null
    or (
      target_subject_id is not null
      and exists (
        select 1
        from public.topics t
        where t.id = target_topic_id
          and t.subject_id = target_subject_id
          and t.group_id = target_group_id
          and t.is_active = true
      )
    );
$$;

create or replace function public.can_manage_own_study_session(
  target_user_id uuid,
  target_group_id uuid,
  target_exam_program_id uuid,
  target_subject_id uuid,
  target_topic_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_active_study_context(target_user_id, target_group_id, target_exam_program_id)
    and public.is_valid_study_subject(target_subject_id, target_group_id, target_exam_program_id)
    and public.is_valid_study_topic(target_topic_id, target_subject_id, target_group_id);
$$;

alter table public.study_preferences enable row level security;
alter table public.study_sessions enable row level security;

create policy "Users can read own active study preferences"
on public.study_preferences
for select
to authenticated
using (
  public.is_active_study_context(user_id, group_id, exam_program_id)
  or public.is_super_admin()
);

create policy "Users can create own active study preferences"
on public.study_preferences
for insert
to authenticated
with check (public.is_active_study_context(user_id, group_id, exam_program_id));

create policy "Users can update own active study preferences"
on public.study_preferences
for update
to authenticated
using (public.is_active_study_context(user_id, group_id, exam_program_id))
with check (public.is_active_study_context(user_id, group_id, exam_program_id));

create policy "Users can delete own active study preferences"
on public.study_preferences
for delete
to authenticated
using (public.is_active_study_context(user_id, group_id, exam_program_id));

create policy "Users and active group admins can read study sessions"
on public.study_sessions
for select
to authenticated
using (
  public.is_active_study_context(user_id, group_id, exam_program_id)
  or public.is_active_group_admin_for_exam(group_id, exam_program_id)
  or public.is_super_admin()
);

create policy "Users can create own active study sessions"
on public.study_sessions
for insert
to authenticated
with check (
  public.can_manage_own_study_session(
    user_id,
    group_id,
    exam_program_id,
    subject_id,
    topic_id
  )
);

create policy "Users can update own active study sessions"
on public.study_sessions
for update
to authenticated
using (
  public.can_manage_own_study_session(
    user_id,
    group_id,
    exam_program_id,
    subject_id,
    topic_id
  )
)
with check (
  public.can_manage_own_study_session(
    user_id,
    group_id,
    exam_program_id,
    subject_id,
    topic_id
  )
);

create policy "Users can delete own active study sessions"
on public.study_sessions
for delete
to authenticated
using (
  public.can_manage_own_study_session(
    user_id,
    group_id,
    exam_program_id,
    subject_id,
    topic_id
  )
);

grant select, insert, update, delete on public.study_preferences to authenticated;
grant select, insert, update, delete on public.study_sessions to authenticated;
grant execute on function public.is_active_study_context(uuid, uuid, uuid) to authenticated;
grant execute on function public.is_valid_study_subject(uuid, uuid, uuid) to authenticated;
grant execute on function public.is_valid_study_topic(uuid, uuid, uuid) to authenticated;
grant execute on function public.can_manage_own_study_session(uuid, uuid, uuid, uuid, uuid) to authenticated;
