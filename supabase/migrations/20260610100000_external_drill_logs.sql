create table public.external_drill_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  exam_program_id uuid not null references public.exam_programs(id) on delete restrict,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  topic_id uuid references public.topics(id) on delete set null,
  drill_title text not null check (char_length(btrim(drill_title)) between 2 and 180),
  source_label text check (
    source_label is null
    or char_length(btrim(source_label)) between 1 and 160
  ),
  total_items integer not null check (total_items > 0),
  score integer not null check (score >= 0 and score <= total_items),
  percentage numeric(5,2) generated always as (
    round((score::numeric * 100) / nullif(total_items, 0), 2)
  ) stored,
  mistake_notes text check (
    mistake_notes is null
    or char_length(mistake_notes) <= 4000
  ),
  weak_topic_notes text check (
    weak_topic_notes is null
    or char_length(weak_topic_notes) <= 4000
  ),
  date_taken date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (group_id, exam_program_id)
    references public.groups(id, exam_program_id)
    on update cascade
    on delete cascade
);

comment on table public.external_drill_logs is
  'User-entered score metadata for hardcopy or offline drills. Does not store uploads, scans, OCR output, hosted files, photos, or copied drill questions.';

comment on column public.external_drill_logs.source_label is
  'Optional source label such as notebook, handout, or review-center drill name; not a file or hosted material reference.';

create trigger set_external_drill_logs_updated_at
before update on public.external_drill_logs
for each row execute function public.set_updated_at();

create index external_drill_logs_user_context_date_idx
on public.external_drill_logs using btree (
  user_id,
  group_id,
  exam_program_id,
  date_taken desc
);

create index external_drill_logs_subject_idx
on public.external_drill_logs using btree (subject_id);

create index external_drill_logs_topic_idx
on public.external_drill_logs using btree (topic_id);

create or replace function public.can_manage_external_drill_log(
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
  select target_user_id = auth.uid()
    and exists (
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
    )
    and exists (
      select 1
      from public.subjects s
      where s.id = target_subject_id
        and s.group_id = target_group_id
        and s.exam_program_id = target_exam_program_id
        and s.is_active = true
    )
    and (
      target_topic_id is null
      or exists (
        select 1
        from public.topics t
        where t.id = target_topic_id
          and t.group_id = target_group_id
          and t.subject_id = target_subject_id
          and t.is_active = true
      )
    );
$$;

create or replace function public.validate_external_drill_log_before_save()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.drill_title := regexp_replace(btrim(new.drill_title), '\s+', ' ', 'g');
  new.source_label := nullif(regexp_replace(btrim(coalesce(new.source_label, '')), '\s+', ' ', 'g'), '');
  new.mistake_notes := nullif(btrim(coalesce(new.mistake_notes, '')), '');
  new.weak_topic_notes := nullif(btrim(coalesce(new.weak_topic_notes, '')), '');

  if not public.can_manage_external_drill_log(
    new.user_id,
    new.group_id,
    new.exam_program_id,
    new.subject_id,
    new.topic_id
  ) then
    raise exception 'External drill log must use the current user, active group, active exam program, and matching subject/topic.';
  end if;

  return new;
end;
$$;

create trigger validate_external_drill_log_before_save
before insert or update on public.external_drill_logs
for each row execute function public.validate_external_drill_log_before_save();

alter table public.external_drill_logs enable row level security;

create policy "Users and active group admins can read external drill logs"
on public.external_drill_logs
for select
to authenticated
using (
  public.can_manage_external_drill_log(
    user_id,
    group_id,
    exam_program_id,
    subject_id,
    topic_id
  )
  or public.is_active_group_admin_for_exam(group_id, exam_program_id)
  or public.is_super_admin()
);

create policy "Users can create own active external drill logs"
on public.external_drill_logs
for insert
to authenticated
with check (
  public.can_manage_external_drill_log(
    user_id,
    group_id,
    exam_program_id,
    subject_id,
    topic_id
  )
);

create policy "Users can update own active external drill logs"
on public.external_drill_logs
for update
to authenticated
using (
  public.can_manage_external_drill_log(
    user_id,
    group_id,
    exam_program_id,
    subject_id,
    topic_id
  )
)
with check (
  public.can_manage_external_drill_log(
    user_id,
    group_id,
    exam_program_id,
    subject_id,
    topic_id
  )
);

create policy "Users can delete own active external drill logs"
on public.external_drill_logs
for delete
to authenticated
using (
  public.can_manage_external_drill_log(
    user_id,
    group_id,
    exam_program_id,
    subject_id,
    topic_id
  )
);

grant select, insert, update, delete on public.external_drill_logs to authenticated;
grant execute on function public.can_manage_external_drill_log(uuid, uuid, uuid, uuid, uuid) to authenticated;
