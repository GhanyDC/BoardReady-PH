create table public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  exam_program_id uuid not null references public.exam_programs(id) on delete restrict,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_choice_id uuid not null references public.choices(id) on delete restrict,
  is_correct boolean not null default false,
  confidence_rating integer check (
    confidence_rating is null or confidence_rating between 1 and 5
  ),
  time_spent_seconds integer check (
    time_spent_seconds is null or time_spent_seconds >= 0
  ),
  attempt_type text not null default 'practice_drill' check (
    attempt_type in (
      'practice_drill',
      'topic_drill',
      'missed_question_review'
    )
  ),
  created_at timestamptz not null default now(),
  foreign key (group_id, exam_program_id)
    references public.groups(id, exam_program_id)
    on update cascade
    on delete cascade
);

create index question_attempts_user_context_created_idx
on public.question_attempts using btree (
  user_id,
  group_id,
  exam_program_id,
  created_at desc
);

create index question_attempts_question_user_idx
on public.question_attempts using btree (question_id, user_id, created_at desc);

create or replace function public.can_create_question_attempt(
  target_user_id uuid,
  target_group_id uuid,
  target_exam_program_id uuid,
  target_question_id uuid,
  target_selected_choice_id uuid
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
      from public.questions q
      join public.choices c
        on c.question_id = q.id
      where q.id = target_question_id
        and c.id = target_selected_choice_id
        and q.status = 'published'
        and q.group_id = target_group_id
        and q.exam_program_id = target_exam_program_id
    );
$$;

create or replace function public.validate_question_attempt_before_save()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_correct boolean;
begin
  if not public.can_create_question_attempt(
    new.user_id,
    new.group_id,
    new.exam_program_id,
    new.question_id,
    new.selected_choice_id
  ) then
    raise exception 'Question attempt must use the current user, active group, and a published question.';
  end if;

  select c.is_correct
  into selected_correct
  from public.choices c
  where c.id = new.selected_choice_id
    and c.question_id = new.question_id;

  if selected_correct is null then
    raise exception 'Selected choice must belong to the attempted question.';
  end if;

  new.is_correct := selected_correct;

  return new;
end;
$$;

create trigger validate_question_attempt_before_save
before insert on public.question_attempts
for each row execute function public.validate_question_attempt_before_save();

alter table public.question_attempts enable row level security;

create policy "Users and active group admins can read question attempts"
on public.question_attempts
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_active_group_admin_for_exam(group_id, exam_program_id)
  or public.is_super_admin()
);

create policy "Users can create own active question attempts"
on public.question_attempts
for insert
to authenticated
with check (
  public.can_create_question_attempt(
    user_id,
    group_id,
    exam_program_id,
    question_id,
    selected_choice_id
  )
);

grant select, insert on public.question_attempts to authenticated;
grant execute on function public.can_create_question_attempt(uuid, uuid, uuid, uuid, uuid) to authenticated;
