create table public.weak_areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  exam_program_id uuid not null references public.exam_programs(id) on delete restrict,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  accuracy numeric(5, 2) not null check (accuracy >= 0 and accuracy <= 100),
  total_attempts integer not null check (total_attempts >= 0),
  correct_attempts integer not null check (correct_attempts >= 0),
  wrong_attempts integer not null check (wrong_attempts >= 0),
  average_confidence numeric(4, 2) check (
    average_confidence is null
    or average_confidence between 1 and 5
  ),
  priority text not null check (
    priority in ('critical', 'high', 'medium', 'watchlist', 'cleared')
  ),
  last_attempted_at timestamptz not null,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (correct_attempts + wrong_attempts = total_attempts),
  foreign key (group_id, exam_program_id)
    references public.groups(id, exam_program_id)
    on update cascade
    on delete cascade,
  unique (user_id, group_id, exam_program_id, topic_id)
);

create index weak_areas_user_context_priority_idx
on public.weak_areas using btree (
  user_id,
  group_id,
  exam_program_id,
  priority,
  accuracy
);

create index weak_areas_topic_context_idx
on public.weak_areas using btree (
  group_id,
  exam_program_id,
  subject_id,
  topic_id
);

create or replace function public.weak_area_priority(target_accuracy numeric)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when target_accuracy < 50 then 'critical'
    when target_accuracy >= 50 and target_accuracy < 60 then 'high'
    when target_accuracy >= 60 and target_accuracy < 70 then 'medium'
    when target_accuracy >= 70 and target_accuracy < 80 then 'watchlist'
    else 'cleared'
  end;
$$;

create or replace function public.validate_weak_area_before_save()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.topics t
    join public.subjects s
      on s.id = t.subject_id
     and s.group_id = t.group_id
    where t.id = new.topic_id
      and t.subject_id = new.subject_id
      and t.group_id = new.group_id
      and s.exam_program_id = new.exam_program_id
  ) then
    raise exception 'Weak area topic must belong to the subject, group, and exam program.';
  end if;

  new.last_updated := now();

  return new;
end;
$$;

create trigger validate_weak_area_before_save
before insert or update on public.weak_areas
for each row execute function public.validate_weak_area_before_save();

create or replace view public.subject_attempt_analytics
with (security_invoker = true)
as
select
  qa.user_id,
  qa.group_id,
  qa.exam_program_id,
  q.subject_id,
  s.name as subject_name,
  s.board_weight,
  count(*)::integer as total_attempts,
  count(*) filter (where qa.is_correct)::integer as correct_attempts,
  count(*) filter (where not qa.is_correct)::integer as wrong_attempts,
  round(
    (count(*) filter (where qa.is_correct))::numeric * 100
    / nullif(count(*), 0),
    2
  ) as accuracy,
  count(qa.confidence_rating)::integer as confidence_attempts,
  round(avg(qa.confidence_rating)::numeric, 2) as average_confidence,
  max(qa.created_at) as latest_attempted_at
from public.question_attempts qa
join public.questions q
  on q.id = qa.question_id
 and q.group_id = qa.group_id
 and q.exam_program_id = qa.exam_program_id
 and q.status = 'published'
join public.subjects s
  on s.id = q.subject_id
 and s.group_id = qa.group_id
 and s.exam_program_id = qa.exam_program_id
group by
  qa.user_id,
  qa.group_id,
  qa.exam_program_id,
  q.subject_id,
  s.name,
  s.board_weight;

create or replace view public.topic_attempt_analytics
with (security_invoker = true)
as
select
  qa.user_id,
  qa.group_id,
  qa.exam_program_id,
  q.subject_id,
  s.name as subject_name,
  q.topic_id,
  t.name as topic_name,
  count(*)::integer as total_attempts,
  count(*) filter (where qa.is_correct)::integer as correct_attempts,
  count(*) filter (where not qa.is_correct)::integer as wrong_attempts,
  round(
    (count(*) filter (where qa.is_correct))::numeric * 100
    / nullif(count(*), 0),
    2
  ) as accuracy,
  count(qa.confidence_rating)::integer as confidence_attempts,
  round(avg(qa.confidence_rating)::numeric, 2) as average_confidence,
  max(qa.created_at) as latest_attempted_at
from public.question_attempts qa
join public.questions q
  on q.id = qa.question_id
 and q.group_id = qa.group_id
 and q.exam_program_id = qa.exam_program_id
 and q.status = 'published'
join public.subjects s
  on s.id = q.subject_id
 and s.group_id = qa.group_id
 and s.exam_program_id = qa.exam_program_id
join public.topics t
  on t.id = q.topic_id
 and t.subject_id = q.subject_id
 and t.group_id = qa.group_id
group by
  qa.user_id,
  qa.group_id,
  qa.exam_program_id,
  q.subject_id,
  s.name,
  q.topic_id,
  t.name;

create or replace function public.refresh_user_weak_areas(
  target_group_id uuid,
  target_exam_program_id uuid
)
returns setof public.weak_areas
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if not public.is_active_group_member_for_exam(
    target_group_id,
    target_exam_program_id
  ) then
    raise exception 'Weak areas can only be refreshed for the active group and exam program.';
  end if;

  delete from public.weak_areas wa
  where wa.user_id = current_user_id
    and wa.group_id = target_group_id
    and wa.exam_program_id = target_exam_program_id;

  insert into public.weak_areas (
    user_id,
    group_id,
    exam_program_id,
    subject_id,
    topic_id,
    accuracy,
    total_attempts,
    correct_attempts,
    wrong_attempts,
    average_confidence,
    priority,
    last_attempted_at
  )
  select
    current_user_id,
    target_group_id,
    target_exam_program_id,
    q.subject_id,
    q.topic_id,
    round(
      (count(*) filter (where qa.is_correct))::numeric * 100
      / nullif(count(*), 0),
      2
    ) as accuracy,
    count(*)::integer as total_attempts,
    count(*) filter (where qa.is_correct)::integer as correct_attempts,
    count(*) filter (where not qa.is_correct)::integer as wrong_attempts,
    round(avg(qa.confidence_rating)::numeric, 2) as average_confidence,
    public.weak_area_priority(
      round(
        (count(*) filter (where qa.is_correct))::numeric * 100
        / nullif(count(*), 0),
        2
      )
    ) as priority,
    max(qa.created_at) as last_attempted_at
  from public.question_attempts qa
  join public.questions q
    on q.id = qa.question_id
   and q.group_id = qa.group_id
   and q.exam_program_id = qa.exam_program_id
   and q.status = 'published'
  where qa.user_id = current_user_id
    and qa.group_id = target_group_id
    and qa.exam_program_id = target_exam_program_id
  group by q.subject_id, q.topic_id
  having count(*) >= 5;

  return query
  select *
  from public.weak_areas wa
  where wa.user_id = current_user_id
    and wa.group_id = target_group_id
    and wa.exam_program_id = target_exam_program_id
  order by
    case wa.priority
      when 'critical' then 1
      when 'high' then 2
      when 'medium' then 3
      when 'watchlist' then 4
      else 5
    end,
    wa.accuracy asc,
    wa.last_attempted_at desc;
end;
$$;

alter table public.weak_areas enable row level security;

create policy "Users and active group admins can read weak areas"
on public.weak_areas
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_active_group_admin_for_exam(group_id, exam_program_id)
  or public.is_super_admin()
);

create policy "Users can create own active weak areas"
on public.weak_areas
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_active_group_member_for_exam(group_id, exam_program_id)
);

create policy "Users can update own active weak areas"
on public.weak_areas
for update
to authenticated
using (
  user_id = auth.uid()
  and public.is_active_group_member_for_exam(group_id, exam_program_id)
)
with check (
  user_id = auth.uid()
  and public.is_active_group_member_for_exam(group_id, exam_program_id)
);

create policy "Users can delete own active weak areas"
on public.weak_areas
for delete
to authenticated
using (
  user_id = auth.uid()
  and public.is_active_group_member_for_exam(group_id, exam_program_id)
);

grant select, insert, update, delete on public.weak_areas to authenticated;
grant select on public.subject_attempt_analytics to authenticated;
grant select on public.topic_attempt_analytics to authenticated;
grant execute on function public.weak_area_priority(numeric) to authenticated;
grant execute on function public.refresh_user_weak_areas(uuid, uuid) to authenticated;
