create table public.questions (
  id uuid primary key default gen_random_uuid(),
  exam_program_id uuid not null references public.exam_programs(id) on delete restrict,
  group_id uuid not null references public.groups(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  topic_id uuid not null references public.topics(id) on delete restrict,
  question_text text not null check (char_length(btrim(question_text)) between 10 and 8000),
  difficulty text not null check (difficulty in ('easy', 'moderate', 'difficult')),
  bloom_level text not null default 'understanding' check (
    bloom_level in (
      'remembering',
      'understanding',
      'applying',
      'analyzing',
      'evaluating',
      'creating'
    )
  ),
  rationale text,
  source_type text not null default 'reviewer_submitted' check (
    source_type in (
      'self_made',
      'personal_notes',
      'textbook_based',
      'public_reference',
      'reviewer_submitted'
    )
  ),
  status text not null default 'pending_review' check (
    status in (
      'draft',
      'pending_review',
      'needs_revision',
      'published',
      'archived',
      'rejected'
    )
  ),
  created_by uuid not null references auth.users(id) on delete restrict,
  verified_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (group_id, exam_program_id)
    references public.groups(id, exam_program_id)
    on update cascade
    on delete cascade
);

create table public.choices (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  choice_label text not null check (choice_label in ('A', 'B', 'C', 'D')),
  choice_text text not null check (char_length(btrim(choice_text)) between 1 and 4000),
  is_correct boolean not null default false,
  explanation text,
  order_index integer not null check (order_index between 1 and 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_id, choice_label),
  unique (question_id, order_index)
);

create table public.question_reports (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  reported_by uuid not null references auth.users(id) on delete cascade,
  report_type text not null check (
    report_type in (
      'wrong_answer',
      'unclear_question',
      'wrong_rationale',
      'duplicate',
      'typo',
      'wrong_topic',
      'outdated',
      'other'
    )
  ),
  message text not null check (char_length(btrim(message)) between 5 and 2000),
  status text not null default 'open' check (
    status in ('open', 'reviewing', 'resolved', 'dismissed')
  ),
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create trigger set_questions_updated_at
before update on public.questions
for each row execute function public.set_updated_at();

create trigger set_choices_updated_at
before update on public.choices
for each row execute function public.set_updated_at();

create index questions_context_status_idx
on public.questions using btree (group_id, exam_program_id, status, updated_at desc);

create index questions_subject_topic_idx
on public.questions using btree (subject_id, topic_id);

create index questions_created_by_idx
on public.questions using btree (created_by, updated_at desc);

create index choices_question_id_idx
on public.choices using btree (question_id, order_index);

create index question_reports_question_status_idx
on public.question_reports using btree (question_id, status, created_at desc);

create or replace function public.is_valid_question_context(
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
  select exists (
    select 1
    from public.groups g
    join public.subjects s
      on s.group_id = g.id
     and s.exam_program_id = g.exam_program_id
    join public.topics t
      on t.subject_id = s.id
     and t.group_id = g.id
    where g.id = target_group_id
      and g.exam_program_id = target_exam_program_id
      and s.id = target_subject_id
      and s.is_active = true
      and t.id = target_topic_id
      and t.is_active = true
  );
$$;

create or replace function public.can_read_question(target_question_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.questions q
    where q.id = target_question_id
      and (
        public.is_active_group_admin_for_exam(q.group_id, q.exam_program_id)
        or (
          q.status = 'published'
          and public.is_active_group_member_for_exam(q.group_id, q.exam_program_id)
        )
        or (
          q.created_by = auth.uid()
          and public.is_active_group_member_for_exam(q.group_id, q.exam_program_id)
        )
      )
  );
$$;

create or replace function public.can_insert_question_choice(target_question_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.questions q
    where q.id = target_question_id
      and (
        public.is_active_group_admin_for_exam(q.group_id, q.exam_program_id)
        or (
          q.created_by = auth.uid()
          and q.status in ('draft', 'pending_review', 'needs_revision')
          and q.source_type in ('reviewer_submitted', 'personal_notes')
          and public.is_active_group_member_for_exam(q.group_id, q.exam_program_id)
        )
      )
  );
$$;

create or replace function public.can_manage_question_report(target_question_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.questions q
    where q.id = target_question_id
      and public.is_active_group_admin_for_exam(q.group_id, q.exam_program_id)
  );
$$;

create or replace function public.assert_question_publishable(target_question_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_question public.questions%rowtype;
  choice_count integer;
  correct_count integer;
begin
  select *
  into target_question
  from public.questions q
  where q.id = target_question_id;

  if target_question.id is null or target_question.status <> 'published' then
    return;
  end if;

  if not public.is_valid_question_context(
    target_question.group_id,
    target_question.exam_program_id,
    target_question.subject_id,
    target_question.topic_id
  ) then
    raise exception 'Published questions must use a valid active subject and topic.';
  end if;

  if target_question.rationale is null or char_length(btrim(target_question.rationale)) < 5 then
    raise exception 'Published questions require a rationale.';
  end if;

  select count(*), count(*) filter (where is_correct)
  into choice_count, correct_count
  from public.choices c
  where c.question_id = target_question_id;

  if choice_count <> 4 then
    raise exception 'Published questions require exactly 4 choices.';
  end if;

  if correct_count <> 1 then
    raise exception 'Published questions require exactly 1 correct choice.';
  end if;
end;
$$;

create or replace function public.validate_question_before_save()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_valid_question_context(
    new.group_id,
    new.exam_program_id,
    new.subject_id,
    new.topic_id
  ) then
    raise exception 'Question subject and topic must belong to the active group exam program.';
  end if;

  if new.status = 'published' then
    if tg_op = 'INSERT' or old.status is distinct from 'published' then
      new.published_at := coalesce(new.published_at, now());
      new.verified_by := coalesce(new.verified_by, auth.uid());
    end if;

    if new.rationale is null or char_length(btrim(new.rationale)) < 5 then
      raise exception 'Published questions require a rationale.';
    end if;
  end if;

  if new.status = 'archived' and (tg_op = 'INSERT' or old.status is distinct from 'archived') then
    new.archived_at := coalesce(new.archived_at, now());
  end if;

  return new;
end;
$$;

create or replace function public.validate_question_after_save()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_question_publishable(new.id);
  return null;
end;
$$;

create or replace function public.validate_published_question_choices()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_question_publishable(coalesce(new.question_id, old.question_id));
  return null;
end;
$$;

create trigger validate_question_before_save
before insert or update on public.questions
for each row execute function public.validate_question_before_save();

create constraint trigger validate_question_after_save
after insert or update on public.questions
deferrable initially deferred
for each row execute function public.validate_question_after_save();

create constraint trigger validate_published_question_choices
after insert or update or delete on public.choices
deferrable initially deferred
for each row execute function public.validate_published_question_choices();

alter table public.questions enable row level security;
alter table public.choices enable row level security;
alter table public.question_reports enable row level security;

create policy "Members can read visible questions"
on public.questions
for select
to authenticated
using (public.can_read_question(id));

create policy "Admins and reviewers can create scoped questions"
on public.questions
for insert
to authenticated
with check (
  public.is_valid_question_context(group_id, exam_program_id, subject_id, topic_id)
  and (
    public.is_active_group_admin_for_exam(group_id, exam_program_id)
    or (
      created_by = auth.uid()
      and status = 'pending_review'
      and source_type in ('reviewer_submitted', 'personal_notes')
      and public.is_active_group_member_for_exam(group_id, exam_program_id)
    )
  )
);

create policy "Admins can update questions"
on public.questions
for update
to authenticated
using (public.is_active_group_admin_for_exam(group_id, exam_program_id))
with check (
  public.is_active_group_admin_for_exam(group_id, exam_program_id)
  and public.is_valid_question_context(group_id, exam_program_id, subject_id, topic_id)
);

create policy "Admins can delete questions"
on public.questions
for delete
to authenticated
using (public.is_active_group_admin_for_exam(group_id, exam_program_id));

create policy "Members can read visible choices"
on public.choices
for select
to authenticated
using (public.can_read_question(question_id));

create policy "Admins and submitters can create choices"
on public.choices
for insert
to authenticated
with check (public.can_insert_question_choice(question_id));

create policy "Admins can update choices"
on public.choices
for update
to authenticated
using (public.can_manage_question_report(question_id))
with check (public.can_manage_question_report(question_id));

create policy "Admins can delete choices"
on public.choices
for delete
to authenticated
using (public.can_manage_question_report(question_id));

create policy "Users can read relevant question reports"
on public.question_reports
for select
to authenticated
using (
  reported_by = auth.uid()
  or public.can_manage_question_report(question_id)
);

create policy "Members can create reports for visible questions"
on public.question_reports
for insert
to authenticated
with check (
  reported_by = auth.uid()
  and status = 'open'
  and public.can_read_question(question_id)
);

create policy "Admins can update question reports"
on public.question_reports
for update
to authenticated
using (public.can_manage_question_report(question_id))
with check (public.can_manage_question_report(question_id));

create policy "Admins can delete question reports"
on public.question_reports
for delete
to authenticated
using (public.can_manage_question_report(question_id));

grant select, insert, update, delete on public.questions to authenticated;
grant select, insert, update, delete on public.choices to authenticated;
grant select, insert, update, delete on public.question_reports to authenticated;
grant execute on function public.is_valid_question_context(uuid, uuid, uuid, uuid) to authenticated;
grant execute on function public.can_read_question(uuid) to authenticated;
grant execute on function public.can_insert_question_choice(uuid) to authenticated;
grant execute on function public.can_manage_question_report(uuid) to authenticated;
grant execute on function public.assert_question_publishable(uuid) to authenticated;
