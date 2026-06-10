create table public.mock_exams (
  id uuid primary key default gen_random_uuid(),
  exam_program_id uuid not null references public.exam_programs(id) on delete restrict,
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 180),
  description text check (
    description is null
    or char_length(btrim(description)) <= 2000
  ),
  mock_type text not null default 'quick' check (
    mock_type in ('quick', 'half', 'full', 'custom')
  ),
  item_count integer not null check (item_count > 0),
  time_limit_minutes integer not null check (time_limit_minutes > 0),
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

create table public.mock_exam_items (
  id uuid primary key default gen_random_uuid(),
  mock_exam_id uuid not null references public.mock_exams(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  order_index integer not null check (order_index > 0),
  created_at timestamptz not null default now(),
  unique (mock_exam_id, question_id),
  unique (mock_exam_id, order_index)
);

create table public.mock_exam_attempts (
  id uuid primary key default gen_random_uuid(),
  mock_exam_id uuid not null references public.mock_exams(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  exam_program_id uuid not null references public.exam_programs(id) on delete restrict,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  time_spent_seconds integer check (
    time_spent_seconds is null
    or time_spent_seconds >= 0
  ),
  score integer check (score is null or score >= 0),
  total_items integer not null check (total_items > 0),
  percentage numeric(5,2) check (
    percentage is null
    or (percentage >= 0 and percentage <= 100)
  ),
  status text not null default 'in_progress' check (
    status in ('in_progress', 'submitted', 'abandoned')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (group_id, exam_program_id)
    references public.groups(id, exam_program_id)
    on update cascade
    on delete cascade
);

create table public.mock_exam_answers (
  id uuid primary key default gen_random_uuid(),
  mock_exam_attempt_id uuid not null references public.mock_exam_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  selected_choice_id uuid not null references public.choices(id) on delete restrict,
  is_correct boolean not null default false,
  time_spent_seconds integer check (
    time_spent_seconds is null
    or time_spent_seconds >= 0
  ),
  created_at timestamptz not null default now(),
  unique (mock_exam_attempt_id, question_id)
);

comment on table public.mock_exams is
  'Admin-created mock exam templates built from published verified questions for one group and exam program.';

comment on table public.mock_exam_attempts is
  'User-owned mock exam sessions and final basic scores. These are intentionally separate from practice drill attempts and readiness scoring.';

create trigger set_mock_exams_updated_at
before update on public.mock_exams
for each row execute function public.set_updated_at();

create trigger set_mock_exam_attempts_updated_at
before update on public.mock_exam_attempts
for each row execute function public.set_updated_at();

create index mock_exams_context_status_idx
on public.mock_exams using btree (
  group_id,
  exam_program_id,
  status,
  updated_at desc
);

create index mock_exam_items_mock_order_idx
on public.mock_exam_items using btree (mock_exam_id, order_index);

create index mock_exam_items_question_idx
on public.mock_exam_items using btree (question_id);

create index mock_exam_attempts_user_context_idx
on public.mock_exam_attempts using btree (
  user_id,
  group_id,
  exam_program_id,
  created_at desc
);

create unique index mock_exam_attempts_one_in_progress_idx
on public.mock_exam_attempts (mock_exam_id, user_id)
where status = 'in_progress';

create index mock_exam_answers_attempt_idx
on public.mock_exam_answers using btree (mock_exam_attempt_id, created_at);

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
      )
  );
$$;

create or replace function public.can_manage_mock_exam(target_mock_exam_id uuid)
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
      and public.is_active_group_admin_for_exam(me.group_id, me.exam_program_id)
  );
$$;

create or replace function public.can_create_mock_exam_item(
  target_mock_exam_id uuid,
  target_question_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.mock_exams me
    join public.questions q
      on q.id = target_question_id
     and q.group_id = me.group_id
     and q.exam_program_id = me.exam_program_id
    where me.id = target_mock_exam_id
      and me.status = 'draft'
      and public.is_active_group_admin_for_exam(me.group_id, me.exam_program_id)
      and q.status = 'published'
      and q.verified_by is not null
  );
$$;

create or replace function public.can_start_mock_exam_attempt(
  target_user_id uuid,
  target_mock_exam_id uuid,
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
    and exists (
      select 1
      from public.mock_exams me
      where me.id = target_mock_exam_id
        and me.group_id = target_group_id
        and me.exam_program_id = target_exam_program_id
        and me.status = 'published'
        and public.is_active_group_member_for_exam(me.group_id, me.exam_program_id)
    );
$$;

create or replace function public.can_update_own_mock_exam_attempt(
  target_user_id uuid,
  target_mock_exam_id uuid,
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
    and public.is_active_group_member_for_exam(target_group_id, target_exam_program_id)
    and exists (
      select 1
      from public.mock_exams me
      where me.id = target_mock_exam_id
        and me.group_id = target_group_id
        and me.exam_program_id = target_exam_program_id
    );
$$;

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
        or public.is_super_admin()
      )
  );
$$;

create or replace function public.can_create_mock_exam_answer(
  target_mock_exam_attempt_id uuid,
  target_question_id uuid,
  target_selected_choice_id uuid
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
    join public.mock_exam_items mei
      on mei.mock_exam_id = mea.mock_exam_id
     and mei.question_id = target_question_id
    join public.choices c
      on c.id = target_selected_choice_id
     and c.question_id = target_question_id
    where mea.id = target_mock_exam_attempt_id
      and mea.user_id = auth.uid()
      and mea.status = 'in_progress'
      and public.is_active_group_member_for_exam(mea.group_id, mea.exam_program_id)
  );
$$;

create or replace function public.validate_mock_exam_before_save()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_count integer;
begin
  new.title := regexp_replace(btrim(new.title), '\s+', ' ', 'g');
  new.description := nullif(btrim(coalesce(new.description, '')), '');

  if new.status = 'published' then
    select count(*)
    into selected_count
    from public.mock_exam_items mei
    where mei.mock_exam_id = new.id;

    if selected_count <> new.item_count then
      raise exception 'Mock exam must have exactly item_count selected questions before publishing.';
    end if;

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

create or replace function public.validate_mock_exam_item_before_save()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_create_mock_exam_item(new.mock_exam_id, new.question_id) then
    raise exception 'Mock exam items must use published verified questions from a draft mock exam in the active group and exam program.';
  end if;

  return new;
end;
$$;

create or replace function public.validate_mock_exam_attempt_before_save()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_mock public.mock_exams%rowtype;
begin
  select *
  into target_mock
  from public.mock_exams me
  where me.id = new.mock_exam_id;

  if target_mock.id is null then
    raise exception 'Mock exam attempt must reference an existing mock exam.';
  end if;

  if tg_op = 'INSERT' then
    if not public.can_start_mock_exam_attempt(
      new.user_id,
      new.mock_exam_id,
      new.group_id,
      new.exam_program_id
    ) then
      raise exception 'Mock exam attempt must use the current user, active group, active exam program, and a published mock exam.';
    end if;
  else
    if old.status <> 'in_progress' then
      raise exception 'Only in-progress mock exam attempts can be updated.';
    end if;

    if not public.can_update_own_mock_exam_attempt(
      new.user_id,
      new.mock_exam_id,
      new.group_id,
      new.exam_program_id
    ) then
      raise exception 'Mock exam attempt updates must stay in the current user, active group, and active exam program.';
    end if;
  end if;

  if new.group_id <> target_mock.group_id
    or new.exam_program_id <> target_mock.exam_program_id then
    raise exception 'Mock exam attempt group and exam program must match the mock exam.';
  end if;

  new.total_items := target_mock.item_count;

  if new.status = 'submitted' then
    if new.score is null then
      raise exception 'Submitted mock exam attempts require a score.';
    end if;

    if new.score > target_mock.item_count then
      raise exception 'Mock exam score cannot exceed total items.';
    end if;

    new.submitted_at := coalesce(new.submitted_at, now());
    new.percentage := round((new.score::numeric * 100) / target_mock.item_count, 2);
  elsif new.status = 'in_progress' then
    new.submitted_at := null;
    new.score := null;
    new.percentage := null;
  elsif new.status = 'abandoned' and new.submitted_at is null then
    new.submitted_at := now();
  end if;

  return new;
end;
$$;

create or replace function public.validate_mock_exam_answer_before_save()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_correct boolean;
begin
  if not public.can_create_mock_exam_answer(
    new.mock_exam_attempt_id,
    new.question_id,
    new.selected_choice_id
  ) then
    raise exception 'Mock exam answers must belong to the current user''s in-progress attempt and selected mock exam question.';
  end if;

  select c.is_correct
  into selected_correct
  from public.choices c
  where c.id = new.selected_choice_id
    and c.question_id = new.question_id;

  if selected_correct is null then
    raise exception 'Selected choice must belong to the answered question.';
  end if;

  new.is_correct := selected_correct;

  return new;
end;
$$;

create trigger validate_mock_exam_before_save
before insert or update on public.mock_exams
for each row execute function public.validate_mock_exam_before_save();

create trigger validate_mock_exam_item_before_save
before insert or update on public.mock_exam_items
for each row execute function public.validate_mock_exam_item_before_save();

create trigger validate_mock_exam_attempt_before_save
before insert or update on public.mock_exam_attempts
for each row execute function public.validate_mock_exam_attempt_before_save();

create trigger validate_mock_exam_answer_before_save
before insert on public.mock_exam_answers
for each row execute function public.validate_mock_exam_answer_before_save();

alter table public.mock_exams enable row level security;
alter table public.mock_exam_items enable row level security;
alter table public.mock_exam_attempts enable row level security;
alter table public.mock_exam_answers enable row level security;

create policy "Members can read visible mock exams"
on public.mock_exams
for select
to authenticated
using (public.can_read_mock_exam(id));

create policy "Active group admins can create mock exams"
on public.mock_exams
for insert
to authenticated
with check (public.is_active_group_admin_for_exam(group_id, exam_program_id));

create policy "Active group admins can update mock exams"
on public.mock_exams
for update
to authenticated
using (public.is_active_group_admin_for_exam(group_id, exam_program_id))
with check (public.is_active_group_admin_for_exam(group_id, exam_program_id));

create policy "Active group admins can delete mock exams"
on public.mock_exams
for delete
to authenticated
using (public.is_active_group_admin_for_exam(group_id, exam_program_id));

create policy "Members can read visible mock exam items"
on public.mock_exam_items
for select
to authenticated
using (public.can_read_mock_exam(mock_exam_id));

create policy "Active group admins can create mock exam items"
on public.mock_exam_items
for insert
to authenticated
with check (public.can_create_mock_exam_item(mock_exam_id, question_id));

create policy "Active group admins can update mock exam items"
on public.mock_exam_items
for update
to authenticated
using (public.can_manage_mock_exam(mock_exam_id))
with check (public.can_create_mock_exam_item(mock_exam_id, question_id));

create policy "Active group admins can delete mock exam items"
on public.mock_exam_items
for delete
to authenticated
using (public.can_manage_mock_exam(mock_exam_id));

create policy "Users can read own mock exam attempts"
on public.mock_exam_attempts
for select
to authenticated
using (public.can_read_mock_exam_attempt(id));

create policy "Users can create own active mock exam attempts"
on public.mock_exam_attempts
for insert
to authenticated
with check (
  status = 'in_progress'
  and public.can_start_mock_exam_attempt(
    user_id,
    mock_exam_id,
    group_id,
    exam_program_id
  )
);

create policy "Users can update own in-progress mock exam attempts"
on public.mock_exam_attempts
for update
to authenticated
using (
  status = 'in_progress'
  and public.can_update_own_mock_exam_attempt(
    user_id,
    mock_exam_id,
    group_id,
    exam_program_id
  )
)
with check (
  public.can_update_own_mock_exam_attempt(
    user_id,
    mock_exam_id,
    group_id,
    exam_program_id
  )
);

create policy "Users can read own mock exam answers"
on public.mock_exam_answers
for select
to authenticated
using (public.can_read_mock_exam_attempt(mock_exam_attempt_id));

create policy "Users can create own mock exam answers"
on public.mock_exam_answers
for insert
to authenticated
with check (
  public.can_create_mock_exam_answer(
    mock_exam_attempt_id,
    question_id,
    selected_choice_id
  )
);

grant select, insert, update, delete on public.mock_exams to authenticated;
grant select, insert, update, delete on public.mock_exam_items to authenticated;
grant select, insert, update on public.mock_exam_attempts to authenticated;
grant select, insert on public.mock_exam_answers to authenticated;
grant execute on function public.can_read_mock_exam(uuid) to authenticated;
grant execute on function public.can_manage_mock_exam(uuid) to authenticated;
grant execute on function public.can_create_mock_exam_item(uuid, uuid) to authenticated;
grant execute on function public.can_start_mock_exam_attempt(uuid, uuid, uuid, uuid) to authenticated;
grant execute on function public.can_update_own_mock_exam_attempt(uuid, uuid, uuid, uuid) to authenticated;
grant execute on function public.can_read_mock_exam_attempt(uuid) to authenticated;
grant execute on function public.can_create_mock_exam_answer(uuid, uuid, uuid) to authenticated;
