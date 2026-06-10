# Supabase RLS Verification Suite

Sprint 10 production hardening suite for manually verifying BoardReady PH row level security after applying migrations to a Supabase project.

This suite is intentionally broader than sprint-specific checklists. It verifies cross-user, cross-group, admin, and super_admin behavior for every major table.

## Test Identities

Create or identify these users before running the suite:

| Alias | Role | Group | Exam program | Purpose |
| --- | --- | --- | --- | --- |
| `reviewer_a` | reviewer | group 1 | exam program 1 | Own-data positive tests. |
| `reviewer_b` | reviewer | group 1 | exam program 1 | Same-group cross-user negative tests. |
| `reviewer_c` | reviewer | group 2 | exam program 2 | Cross-group negative tests. |
| `admin_1` | admin | group 1 | exam program 1 | Group-scoped admin positive tests. |
| `admin_2` | admin | group 2 | exam program 2 | Admin cross-group negative tests. |
| `super_admin` | super_admin | any seeded/admin group | any | Super admin positive tests where supported. |

Recommended fixture data:

- At least one active group for each exam program.
- Active subjects and topics in both groups.
- Draft, submitted, published, archived, and reported content where applicable.
- Study sessions, practice attempts, weak areas, external drills, mock attempts, readiness snapshots, goals, and announcements for `reviewer_a`, `reviewer_b`, and `reviewer_c`.

## How To Execute

Supabase SQL editor normally runs as an owner role that bypasses RLS. To test RLS, run test queries inside a transaction after switching to `authenticated` and setting JWT claims:

```sql
begin;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'REPLACE_WITH_USER_UUID', true);

-- Run one group of checks.

rollback;
```

Repeat the block for each test identity. Replace UUID placeholders in `supabase/tests/rls-verification.sql` before running. If a query is marked "should fail", it should either return zero rows or raise a permission/RLS error, depending on the operation.

Do not run the destructive insert/update/delete checks against production data unless the values are disposable and the transaction is rolled back.

## Global Expectations

- Reviewers can read and mutate their own active-context data only where the product allows it.
- Reviewers cannot read another user's private data, even inside the same group.
- Reviewers cannot read or mutate another group/exam's data.
- Admins can manage group-scoped content for their active group/exam only.
- Admins cannot manage another active group's content unless they are also an admin there.
- Super admins have elevated access only where policies explicitly support it.
- Server code should still derive `user_id`, `group_id`, and `exam_program_id` from server context. RLS is the final defense, not the first one.

## Table Matrix

| Table | Reviewer own-data access | Reviewer cross-user blocked | Reviewer cross-group blocked | Admin group-scoped access | Super admin access | Insert/update/delete restrictions | Expected failure cases |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `profiles` | Can read/update own profile fields allowed by policies. | Cannot select another user's profile. | Cannot use another user's current group context. | Admin should not get broad profile browsing unless explicitly policy-backed. | Supported by helper policies where applicable. | Profile creation/update limited to own user and allowed onboarding flows. | Reviewer selecting `reviewer_b` profile returns zero rows. |
| `groups` | Can read groups they belong to. | Cannot read unrelated groups through another user. | Cannot read group 2 as group 1 reviewer. | Can read/manage group-scoped records only where policies allow. | Can read/manage supported global setup. | Group mutations limited by admin/super_admin policy. | Reviewer A selecting group 2 returns zero rows. |
| `group_members` | Can read own membership rows. | Cannot read other reviewers' membership rows unless policy/admin allows. | Cannot read group 2 memberships. | Admin can inspect memberships for active group if policy allows. | Can inspect all supported memberships. | Inserts/updates are restricted to invite/admin flows. | Reviewer A cannot promote self or another user. |
| `exam_programs` | Can read active exam program through active group. | Cannot infer other users' exam programs through private rows. | Cannot access unrelated inactive/private exam programs. | Admin can access active exam program for group. | Can manage where policy allows. | Mutations limited to super_admin/admin setup policy. | Reviewer cannot insert/update exam programs. |
| `subjects` | Can read active subjects for active group/exam. | Not user-owned; no private user data. | Cannot read group 2 subjects. | Admin can create/update/delete active group subjects. | Can manage where policy allows. | Reviewer cannot mutate subjects. | Reviewer insert/update/delete is rejected. |
| `topics` | Can read topics through active group subjects. | Not user-owned; no private user data. | Cannot read group 2 topics. | Admin can create/update/delete topics for active group subjects. | Can manage where policy allows. | Reviewer cannot mutate topics. | Reviewer cannot create topic under another subject. |
| `study_preferences` | Can read/create/update/delete own active preferences. | Cannot read reviewer B preferences. | Cannot read group 2 preferences. | Admin should not read private preferences unless policy allows. | Can read where policy allows. | User id/group/exam must match active context. | Reviewer A inserting as reviewer B is rejected. |
| `study_sessions` | Can read/create/update/delete own sessions. | Cannot read reviewer B sessions. | Cannot read group 2 sessions. | Admin can read active group sessions for analytics. | Can read where policy allows. | Mutations limited to own active sessions and valid subject/topic. | Reviewer A cannot update reviewer B session notes. |
| `questions` | Can read published questions and own submitted questions. | Cannot read another reviewer's draft submission unless admin/published policy allows. | Cannot read group 2 private questions. | Admin can manage active group/exam questions. | Can manage where policy allows. | Reviewer submissions limited to active group/exam; admin publish requires validation. | Reviewer cannot publish or update admin question. |
| `choices` | Can read choices for readable questions. | Cannot read choices for unreadable private questions. | Cannot read group 2 private question choices. | Admin can manage choices for active group/exam questions. | Can manage where policy allows. | Choice inserts/updates require parent question management. | Reviewer cannot insert choices directly for published/admin question. |
| `question_reports` | Can create/manage own report where question is readable. | Cannot read/manage another user's private reports unless admin policy allows. | Cannot report unreadable group 2 questions. | Admin can review reports for active group/exam questions. | Can manage where policy allows. | Reviewer report mutations limited to allowed report lifecycle. | Reviewer cannot resolve report as admin. |
| `question_attempts` | Can read/create own attempts. | Cannot read reviewer B attempts. | Cannot read group 2 attempts. | Admin can read active group attempts for analytics. | Can read where policy allows. | Inserts require current user, active context, readable question, valid choice. | Reviewer A insert with reviewer B `user_id` is rejected. |
| `weak_areas` | Can read own derived weak areas. | Cannot read reviewer B weak areas. | Cannot read group 2 weak areas. | Admin can read active group weak areas for analytics. | Can read where policy allows. | Direct client writes are revoked/restricted; refresh function is the path. | Reviewer direct insert/update/delete is rejected. |
| `external_drill_logs` | Can read/create/update/delete own logs. | Cannot read reviewer B logs or notes. | Cannot read group 2 logs. | Admin can read active group log metadata for analytics; private note exposure must be reviewed before UI use. | Can read where policy allows. | Mutations limited to own active context and valid subject/topic. | Reviewer A cannot update reviewer B log. |
| `mock_exams` | Can read published active group mocks. | Not user-owned; draft visibility limited. | Cannot read group 2 private mocks. | Admin can manage active group/exam mocks. | Can manage where policy allows. | Reviewer cannot create/update/publish/archive mocks. | Reviewer cannot read draft mock. |
| `mock_exam_items` | Can read items for readable published mocks or own attempts. | Cannot read items for unrelated private mocks. | Cannot read group 2 private mock items. | Admin can manage items for active group/exam mocks. | Can manage where policy allows. | Mutations limited to admin-managed mocks and valid questions. | Reviewer cannot insert/delete mock items. |
| `mock_exam_attempts` | Can read/start/update/submit own attempts. | Cannot read reviewer B attempts. | Cannot read group 2 attempts. | Admin can read active group submitted attempts for analytics. | Can read where policy allows. | Inserts/updates limited to own active attempt lifecycle. | Reviewer A cannot submit reviewer B attempt. |
| `mock_exam_answers` | Can read own answers through readable attempt. | Cannot read reviewer B answers. | Cannot read group 2 answers. | Admin access should remain limited to approved analytics/review use. | Can read where policy allows. | Inserts require own active attempt, valid question, valid choice. | Reviewer cannot insert answers for another attempt. |
| `readiness_snapshots` | Can read own snapshots saved by function. | Cannot read reviewer B snapshots. | Cannot read group 2 snapshots. | Admin can read active group readiness snapshots for group analytics. | Can read where policy allows. | Direct client writes blocked; `save_readiness_snapshot` validates owner and context. | Reviewer A cannot save snapshot for reviewer B. |
| `group_goals` | Can read active goals for active group/exam. | Not user-owned; no private user data. | Cannot read group 2 goals. | Admin can create/update/delete goals for active group/exam. | Can manage where policy allows. | Reviewer cannot mutate goals. | Reviewer cannot read draft/completed/archived goals. |
| `group_announcements` | Can read published reviewer/all announcements for active group/exam. | Not user-owned; no private user data. | Cannot read group 2 announcements. | Admin can create/update/delete announcements for active group/exam, including drafts/admin-only. | Can manage where policy allows. | Reviewer cannot mutate announcements. | Reviewer cannot read draft/admin-only/archived announcements. |

## Cross-User Tests

Run as `reviewer_a`:

- Select own `profiles`, `study_preferences`, `study_sessions`, `question_attempts`, `weak_areas`, `external_drill_logs`, `mock_exam_attempts`, `mock_exam_answers`, and `readiness_snapshots`; expect own rows only.
- Select rows owned by `reviewer_b`; expect zero rows.
- Attempt update/delete of `reviewer_b` rows; expect zero affected rows or an RLS error.
- Attempt insert with `user_id = reviewer_b`; expect rejection.

## Cross-Group Tests

Run as `reviewer_a` in group 1:

- Select group 2 `groups`, `subjects`, `topics`, `questions`, `mock_exams`, `group_goals`, and `group_announcements`; expect zero private/unpublished rows.
- Attempt to create study sessions, attempts, external logs, snapshots, or submitted questions for group 2; expect rejection.
- Confirm aggregate group progress RPC does not return group 2 data.

## Admin Tests

Run as `admin_1`:

- Manage group 1 subjects/topics/questions/mock exams/goals/announcements; expect success.
- Read group 1 analytics inputs where policies allow admin visibility.
- Attempt to manage group 2 subjects/topics/questions/mock exams/goals/announcements; expect rejection or zero affected rows.
- Confirm reviewer-only pages still render only the admin user's own reviewer data when admin uses reviewer routes.

Run as `admin_2`:

- Repeat with group 2 and verify group 1 is blocked.

## Super Admin Tests

Run as `super_admin`:

- Verify global setup tables and supported management policies work.
- Verify super_admin behavior does not bypass UI privacy expectations for reviewer-facing routes.
- Verify any super_admin broad access is intentional and documented by policy.

## RPC and Security-Definer Function Tests

Test these functions directly:

- `join_group_with_invite`
- `refresh_user_weak_areas`
- `submit_mock_exam_attempt`
- `save_readiness_snapshot`
- `get_group_progress_summary`

Expected behavior:

- Functions validate active user, group, exam, and ownership inputs.
- Functions reject cross-user and cross-group attempts.
- `get_group_progress_summary` returns aggregate values only and no user ids, notes, missed-question details, or individual readiness scores.

## Sign-Off Checklist

- [ ] Reviewer A cannot read reviewer B private rows in same group.
- [ ] Reviewer A cannot read reviewer C private rows in another group.
- [ ] Reviewer A cannot mutate admin-only content.
- [ ] Admin 1 cannot manage group 2 content.
- [ ] Super admin behavior matches documented policy intent.
- [ ] Reviewer-facing group progress remains aggregate-only.
- [ ] No policy exposes external drill private notes to other reviewers.
- [ ] No policy exposes readiness snapshots to other reviewers.
- [ ] No policy enables direct client writes to derived snapshots that should be function-managed.
