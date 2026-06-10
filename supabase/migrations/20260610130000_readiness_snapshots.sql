create table if not exists public.readiness_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  exam_program_id uuid not null references public.exam_programs(id) on delete restrict,
  overall_readiness numeric(5,2) not null check (
    overall_readiness >= 0
    and overall_readiness <= 100
  ),
  practice_component numeric(5,2) check (
    practice_component is null
    or (practice_component >= 0 and practice_component <= 100)
  ),
  mock_exam_component numeric(5,2) check (
    mock_exam_component is null
    or (mock_exam_component >= 0 and mock_exam_component <= 100)
  ),
  weak_area_component numeric(5,2) check (
    weak_area_component is null
    or (weak_area_component >= 0 and weak_area_component <= 100)
  ),
  study_consistency_component numeric(5,2) check (
    study_consistency_component is null
    or (study_consistency_component >= 0 and study_consistency_component <= 100)
  ),
  external_drill_component numeric(5,2) check (
    external_drill_component is null
    or (external_drill_component >= 0 and external_drill_component <= 100)
  ),
  subject_breakdown jsonb not null default '[]'::jsonb,
  recommendation_summary jsonb not null default '[]'::jsonb,
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  foreign key (group_id, exam_program_id)
    references public.groups(id, exam_program_id)
    on update cascade
    on delete cascade
);

comment on table public.readiness_snapshots is
  'Rule-based internal study readiness estimates for one user, group, and exam program. These are not guarantees of board exam outcomes.';

create index if not exists readiness_snapshots_user_context_calculated_idx
on public.readiness_snapshots using btree (
  user_id,
  group_id,
  exam_program_id,
  calculated_at desc
);

create index if not exists readiness_snapshots_group_calculated_idx
on public.readiness_snapshots using btree (
  group_id,
  exam_program_id,
  calculated_at desc
);

create or replace function public.save_readiness_snapshot(
  target_user_id uuid,
  target_group_id uuid,
  target_exam_program_id uuid,
  target_overall_readiness numeric,
  target_practice_component numeric,
  target_mock_exam_component numeric,
  target_weak_area_component numeric,
  target_study_consistency_component numeric,
  target_external_drill_component numeric,
  target_subject_breakdown jsonb,
  target_recommendation_summary jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  if target_user_id <> auth.uid() then
    raise exception 'Readiness snapshots can only be saved for the current user.';
  end if;

  if not public.is_active_group_member_for_exam(
    target_group_id,
    target_exam_program_id
  ) then
    raise exception 'Readiness snapshots must use the current active group and exam program.';
  end if;

  insert into public.readiness_snapshots (
    user_id,
    group_id,
    exam_program_id,
    overall_readiness,
    practice_component,
    mock_exam_component,
    weak_area_component,
    study_consistency_component,
    external_drill_component,
    subject_breakdown,
    recommendation_summary,
    calculated_at
  )
  values (
    target_user_id,
    target_group_id,
    target_exam_program_id,
    round(target_overall_readiness, 2),
    round(target_practice_component, 2),
    round(target_mock_exam_component, 2),
    round(target_weak_area_component, 2),
    round(target_study_consistency_component, 2),
    round(target_external_drill_component, 2),
    coalesce(target_subject_breakdown, '[]'::jsonb),
    coalesce(target_recommendation_summary, '[]'::jsonb),
    now()
  )
  returning id into inserted_id;

  return inserted_id;
end;
$$;

alter table public.readiness_snapshots enable row level security;

create policy "Users and active group admins can read readiness snapshots"
on public.readiness_snapshots
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_active_group_admin_for_exam(group_id, exam_program_id)
  or public.is_super_admin()
);

grant select on public.readiness_snapshots to authenticated;
grant execute on function public.save_readiness_snapshot(
  uuid,
  uuid,
  uuid,
  numeric,
  numeric,
  numeric,
  numeric,
  numeric,
  numeric,
  jsonb,
  jsonb
) to authenticated;
