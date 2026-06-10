-- BoardReady PH RLS verification template.
--
-- This file is a manual Supabase SQL editor template. Replace every
-- REPLACE_WITH_* value before running a block.
--
-- Important:
-- - Run each block inside a transaction and rollback.
-- - Supabase SQL editor runs as a privileged role by default. The `set local
--   role authenticated` and JWT claim settings below simulate an authenticated
--   user so RLS policies are evaluated.
-- - "Expected 0" means the row should be hidden by RLS.
-- - "Expected error or 0 affected" means the write should be blocked.

-- ---------------------------------------------------------------------------
-- Identity placeholders to prepare before running:
--
-- reviewer_a: reviewer in group 1
-- reviewer_b: reviewer in group 1
-- reviewer_c: reviewer in group 2
-- admin_1: admin in group 1
-- admin_2: admin in group 2
-- super_admin: super_admin membership
-- group_1, group_2
-- exam_program_1, exam_program_2
-- subject_1, subject_2
-- topic_1, topic_2
-- question_1, question_2
-- mock_exam_1, mock_exam_2
-- mock_attempt_a, mock_attempt_b
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Reviewer A: own data positive checks and cross-user negative checks.
-- ---------------------------------------------------------------------------
begin;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'REPLACE_WITH_REVIEWER_A_UUID', true);

-- Expected 1: own profile is readable.
select count(*) as own_profile_count
from public.profiles
where id = 'REPLACE_WITH_REVIEWER_A_UUID';

-- Expected 0: another user's profile is hidden.
select count(*) as other_profile_count
from public.profiles
where id = 'REPLACE_WITH_REVIEWER_B_UUID';

-- Expected only reviewer A rows.
select 'study_preferences' as table_name, count(*) as visible_rows
from public.study_preferences
where user_id = 'REPLACE_WITH_REVIEWER_A_UUID'
union all
select 'study_sessions', count(*)
from public.study_sessions
where user_id = 'REPLACE_WITH_REVIEWER_A_UUID'
union all
select 'question_attempts', count(*)
from public.question_attempts
where user_id = 'REPLACE_WITH_REVIEWER_A_UUID'
union all
select 'weak_areas', count(*)
from public.weak_areas
where user_id = 'REPLACE_WITH_REVIEWER_A_UUID'
union all
select 'external_drill_logs', count(*)
from public.external_drill_logs
where user_id = 'REPLACE_WITH_REVIEWER_A_UUID'
union all
select 'mock_exam_attempts', count(*)
from public.mock_exam_attempts
where user_id = 'REPLACE_WITH_REVIEWER_A_UUID'
union all
select 'readiness_snapshots', count(*)
from public.readiness_snapshots
where user_id = 'REPLACE_WITH_REVIEWER_A_UUID';

-- Expected 0 for every row below: same-group cross-user private rows are hidden.
select 'study_sessions_cross_user' as check_name, count(*) as visible_rows
from public.study_sessions
where user_id = 'REPLACE_WITH_REVIEWER_B_UUID'
union all
select 'question_attempts_cross_user', count(*)
from public.question_attempts
where user_id = 'REPLACE_WITH_REVIEWER_B_UUID'
union all
select 'weak_areas_cross_user', count(*)
from public.weak_areas
where user_id = 'REPLACE_WITH_REVIEWER_B_UUID'
union all
select 'external_drill_logs_cross_user', count(*)
from public.external_drill_logs
where user_id = 'REPLACE_WITH_REVIEWER_B_UUID'
union all
select 'mock_exam_attempts_cross_user', count(*)
from public.mock_exam_attempts
where user_id = 'REPLACE_WITH_REVIEWER_B_UUID'
union all
select 'readiness_snapshots_cross_user', count(*)
from public.readiness_snapshots
where user_id = 'REPLACE_WITH_REVIEWER_B_UUID';

-- Expected 0: group 2 content is hidden from reviewer A.
select 'subjects_cross_group' as check_name, count(*) as visible_rows
from public.subjects
where group_id = 'REPLACE_WITH_GROUP_2_UUID'
union all
select 'topics_cross_group', count(*)
from public.topics
where group_id = 'REPLACE_WITH_GROUP_2_UUID'
union all
select 'group_goals_cross_group', count(*)
from public.group_goals
where group_id = 'REPLACE_WITH_GROUP_2_UUID'
union all
select 'group_announcements_cross_group', count(*)
from public.group_announcements
where group_id = 'REPLACE_WITH_GROUP_2_UUID';

-- Expected error or 0 affected: reviewer cannot update another user's session.
update public.study_sessions
set notes = 'RLS SHOULD BLOCK THIS'
where user_id = 'REPLACE_WITH_REVIEWER_B_UUID';

-- Expected error: reviewer cannot insert an attempt for another user.
insert into public.question_attempts (
  user_id,
  group_id,
  exam_program_id,
  question_id,
  selected_choice_id
)
values (
  'REPLACE_WITH_REVIEWER_B_UUID',
  'REPLACE_WITH_GROUP_1_UUID',
  'REPLACE_WITH_EXAM_PROGRAM_1_UUID',
  'REPLACE_WITH_QUESTION_1_UUID',
  'REPLACE_WITH_CHOICE_FOR_QUESTION_1_UUID'
);

rollback;

-- ---------------------------------------------------------------------------
-- Reviewer A: aggregate group progress RPC should return aggregate data only.
-- ---------------------------------------------------------------------------
begin;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'REPLACE_WITH_REVIEWER_A_UUID', true);

-- Expected one aggregate row for group 1. Result should contain no user ids,
-- no notes, no missed-question details, and no individual readiness scores.
select *
from public.get_group_progress_summary(
  'REPLACE_WITH_GROUP_1_UUID',
  'REPLACE_WITH_EXAM_PROGRAM_1_UUID',
  now() - interval '7 days',
  now()
);

-- Expected zero aggregate values or denial for group 2, depending on policy.
select *
from public.get_group_progress_summary(
  'REPLACE_WITH_GROUP_2_UUID',
  'REPLACE_WITH_EXAM_PROGRAM_2_UUID',
  now() - interval '7 days',
  now()
);

rollback;

-- ---------------------------------------------------------------------------
-- Admin 1: group-scoped positive checks and cross-group negative checks.
-- ---------------------------------------------------------------------------
begin;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'REPLACE_WITH_ADMIN_1_UUID', true);

-- Expected visible/manageable for group 1.
select 'group_1_subjects' as check_name, count(*) as visible_rows
from public.subjects
where group_id = 'REPLACE_WITH_GROUP_1_UUID'
union all
select 'group_1_topics', count(*)
from public.topics
where group_id = 'REPLACE_WITH_GROUP_1_UUID'
union all
select 'group_1_questions', count(*)
from public.questions
where group_id = 'REPLACE_WITH_GROUP_1_UUID'
union all
select 'group_1_mock_exams', count(*)
from public.mock_exams
where group_id = 'REPLACE_WITH_GROUP_1_UUID'
union all
select 'group_1_goals', count(*)
from public.group_goals
where group_id = 'REPLACE_WITH_GROUP_1_UUID'
union all
select 'group_1_announcements', count(*)
from public.group_announcements
where group_id = 'REPLACE_WITH_GROUP_1_UUID';

-- Expected 0: admin 1 cannot manage group 2.
select 'group_2_subjects_admin_1' as check_name, count(*) as visible_rows
from public.subjects
where group_id = 'REPLACE_WITH_GROUP_2_UUID'
union all
select 'group_2_topics_admin_1', count(*)
from public.topics
where group_id = 'REPLACE_WITH_GROUP_2_UUID'
union all
select 'group_2_questions_admin_1', count(*)
from public.questions
where group_id = 'REPLACE_WITH_GROUP_2_UUID'
union all
select 'group_2_mock_exams_admin_1', count(*)
from public.mock_exams
where group_id = 'REPLACE_WITH_GROUP_2_UUID';

-- Expected error or 0 affected: admin 1 cannot update group 2 subject.
update public.subjects
set name = name
where group_id = 'REPLACE_WITH_GROUP_2_UUID';

rollback;

-- ---------------------------------------------------------------------------
-- Reviewer A: admin-only mutation checks.
-- ---------------------------------------------------------------------------
begin;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'REPLACE_WITH_REVIEWER_A_UUID', true);

-- Expected error: reviewer cannot create subjects.
insert into public.subjects (
  group_id,
  exam_program_id,
  name,
  board_weight,
  sort_order,
  created_by
)
values (
  'REPLACE_WITH_GROUP_1_UUID',
  'REPLACE_WITH_EXAM_PROGRAM_1_UUID',
  'RLS SHOULD BLOCK SUBJECT',
  1,
  999,
  'REPLACE_WITH_REVIEWER_A_UUID'
);

-- Expected error: reviewer cannot create group goal.
insert into public.group_goals (
  group_id,
  exam_program_id,
  title,
  goal_type,
  target_value,
  start_date,
  end_date,
  status,
  created_by
)
values (
  'REPLACE_WITH_GROUP_1_UUID',
  'REPLACE_WITH_EXAM_PROGRAM_1_UUID',
  'RLS SHOULD BLOCK GOAL',
  'study_minutes',
  60,
  current_date,
  current_date + 7,
  'active',
  'REPLACE_WITH_REVIEWER_A_UUID'
);

-- Expected error: reviewer cannot create group announcement.
insert into public.group_announcements (
  group_id,
  exam_program_id,
  title,
  body,
  visibility,
  status,
  created_by
)
values (
  'REPLACE_WITH_GROUP_1_UUID',
  'REPLACE_WITH_EXAM_PROGRAM_1_UUID',
  'RLS SHOULD BLOCK ANNOUNCEMENT',
  'This insert should fail.',
  'reviewers',
  'published',
  'REPLACE_WITH_REVIEWER_A_UUID'
);

rollback;

-- ---------------------------------------------------------------------------
-- Function ownership checks.
-- ---------------------------------------------------------------------------
begin;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'REPLACE_WITH_REVIEWER_A_UUID', true);

-- Expected error: cannot save readiness snapshot for another user.
select public.save_readiness_snapshot(
  'REPLACE_WITH_REVIEWER_B_UUID',
  'REPLACE_WITH_GROUP_1_UUID',
  'REPLACE_WITH_EXAM_PROGRAM_1_UUID',
  50,
  null,
  null,
  null,
  null,
  null,
  '[]'::jsonb,
  '[]'::jsonb
);

-- Expected error: cannot refresh weak areas for inactive/cross-group context.
select public.refresh_user_weak_areas(
  'REPLACE_WITH_GROUP_2_UUID',
  'REPLACE_WITH_EXAM_PROGRAM_2_UUID'
);

rollback;
