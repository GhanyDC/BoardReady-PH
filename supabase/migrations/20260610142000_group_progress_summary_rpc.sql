create or replace function public.get_group_progress_summary(
  target_group_id uuid,
  target_exam_program_id uuid,
  target_week_start timestamptz,
  target_week_end timestamptz
)
returns table (
  reviewer_count bigint,
  active_reviewer_count bigint,
  total_study_minutes bigint,
  total_questions_answered bigint,
  average_practice_accuracy numeric,
  mock_exams_completed bigint,
  external_drills_logged bigint,
  active_days_count bigint,
  top_weak_subjects jsonb,
  top_weak_topics jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  with allowed as (
    select (
      public.is_active_group_member_for_exam(target_group_id, target_exam_program_id)
      or public.is_active_group_admin_for_exam(target_group_id, target_exam_program_id)
      or public.is_super_admin()
    ) as ok
  ),
  reviewers as (
    select gm.user_id
    from public.group_members gm
    join public.groups g
      on g.id = gm.group_id
     and g.exam_program_id = target_exam_program_id
    where (select ok from allowed)
      and gm.group_id = target_group_id
      and gm.role = 'reviewer'
  ),
  study as (
    select ss.user_id, ss.started_at, ss.duration_seconds
    from public.study_sessions ss
    where (select ok from allowed)
      and ss.group_id = target_group_id
      and ss.exam_program_id = target_exam_program_id
      and ss.started_at >= target_week_start
      and ss.started_at < target_week_end
  ),
  question_activity as (
    select qa.user_id, qa.is_correct, qa.created_at
    from public.question_attempts qa
    where (select ok from allowed)
      and qa.group_id = target_group_id
      and qa.exam_program_id = target_exam_program_id
      and qa.created_at >= target_week_start
      and qa.created_at < target_week_end
  ),
  mock_activity as (
    select mea.user_id, mea.submitted_at
    from public.mock_exam_attempts mea
    where (select ok from allowed)
      and mea.group_id = target_group_id
      and mea.exam_program_id = target_exam_program_id
      and mea.status = 'submitted'
      and mea.submitted_at >= target_week_start
      and mea.submitted_at < target_week_end
  ),
  external_activity as (
    select edl.user_id, edl.created_at
    from public.external_drill_logs edl
    where (select ok from allowed)
      and edl.group_id = target_group_id
      and edl.exam_program_id = target_exam_program_id
      and edl.created_at >= target_week_start
      and edl.created_at < target_week_end
  ),
  activity_users as (
    select user_id from study
    union
    select user_id from question_activity
    union
    select user_id from mock_activity
    union
    select user_id from external_activity
  ),
  active_days as (
    select started_at::date as activity_day from study
    union
    select created_at::date from question_activity
    union
    select submitted_at::date from mock_activity
    union
    select created_at::date from external_activity
  ),
  weak_subject_rows as (
    select
      wa.subject_id,
      s.name,
      count(*) as signal_count,
      avg(wa.accuracy) as average_accuracy
    from public.weak_areas wa
    join public.subjects s
      on s.id = wa.subject_id
     and s.group_id = wa.group_id
     and s.exam_program_id = wa.exam_program_id
    where (select ok from allowed)
      and wa.group_id = target_group_id
      and wa.exam_program_id = target_exam_program_id
      and wa.priority in ('critical', 'high', 'medium')
    group by wa.subject_id, s.name
    order by signal_count desc, average_accuracy asc
    limit 5
  ),
  weak_topic_rows as (
    select
      wa.topic_id,
      t.name,
      count(*) as signal_count,
      avg(wa.accuracy) as average_accuracy
    from public.weak_areas wa
    join public.topics t
      on t.id = wa.topic_id
     and t.group_id = wa.group_id
    where (select ok from allowed)
      and wa.group_id = target_group_id
      and wa.exam_program_id = target_exam_program_id
      and wa.priority in ('critical', 'high', 'medium')
    group by wa.topic_id, t.name
    order by signal_count desc, average_accuracy asc
    limit 5
  )
  select
    (select count(*) from reviewers)::bigint as reviewer_count,
    (
      select count(distinct au.user_id)
      from activity_users au
      join reviewers r on r.user_id = au.user_id
    )::bigint as active_reviewer_count,
    coalesce((select round(sum(duration_seconds)::numeric / 60) from study), 0)::bigint
      as total_study_minutes,
    (select count(*) from question_activity)::bigint as total_questions_answered,
    (
      select
        case
          when count(*) = 0 then null
          else (count(*) filter (where is_correct)::numeric / count(*)) * 100
        end
      from question_activity
    ) as average_practice_accuracy,
    (select count(*) from mock_activity)::bigint as mock_exams_completed,
    (select count(*) from external_activity)::bigint as external_drills_logged,
    (select count(*) from active_days)::bigint as active_days_count,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', subject_id,
            'name', name,
            'count', signal_count,
            'averageAccuracy', average_accuracy
          )
          order by signal_count desc, average_accuracy asc
        )
        from weak_subject_rows
      ),
      '[]'::jsonb
    ) as top_weak_subjects,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', topic_id,
            'name', name,
            'count', signal_count,
            'averageAccuracy', average_accuracy
          )
          order by signal_count desc, average_accuracy asc
        )
        from weak_topic_rows
      ),
      '[]'::jsonb
    ) as top_weak_topics;
$$;

comment on function public.get_group_progress_summary(
  uuid,
  uuid,
  timestamptz,
  timestamptz
) is
  'Returns reviewer-safe aggregate group progress only; no individual readiness, notes, missed-question details, or low-performer rankings.';

grant execute on function public.get_group_progress_summary(
  uuid,
  uuid,
  timestamptz,
  timestamptz
) to authenticated;
