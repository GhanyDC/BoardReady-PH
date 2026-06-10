# Sprint 9 Verification Checklist

Use this checklist against a live Supabase project with at least one admin, at least two reviewers, an active group, an active exam program, practice attempts, study sessions, mock submissions, external drill logs, weak areas, goals, and announcements where possible.

## Database and RLS

- [ ] Migrations apply cleanly.
- [ ] `group_goals` exists.
- [ ] `group_announcements` exists.
- [ ] `group_goals` rows include `group_id` and `exam_program_id`.
- [ ] `group_announcements` rows include `group_id` and `exam_program_id`.
- [ ] `group_goals` rejects invalid goal types.
- [ ] `group_goals` rejects invalid statuses.
- [ ] `group_goals` rejects non-positive targets.
- [ ] `group_goals` rejects `end_date` before `start_date`.
- [ ] `group_announcements` rejects invalid visibility values.
- [ ] `group_announcements` rejects invalid statuses.
- [ ] RLS is enabled on `group_goals`.
- [ ] RLS is enabled on `group_announcements`.
- [ ] Active reviewers can read active goals for their active group/exam.
- [ ] Active reviewers cannot read draft, completed, or archived goals.
- [ ] Active reviewers can read published reviewer/all announcements.
- [ ] Active reviewers cannot read draft or archived announcements.
- [ ] Active reviewers cannot read admins-only announcements.
- [ ] Active reviewers cannot insert, update, or delete goals.
- [ ] Active reviewers cannot insert, update, or delete announcements.
- [ ] Active admins can manage goals for their active group/exam.
- [ ] Active admins can manage announcements for their active group/exam.
- [ ] Users cannot access goals or announcements from another group/exam.
- [ ] `get_group_progress_summary` returns aggregate values only.
- [ ] `get_group_progress_summary` does not return user ids.
- [ ] `get_group_progress_summary` does not return readiness snapshots.
- [ ] `get_group_progress_summary` does not return study notes.
- [ ] `get_group_progress_summary` does not return external drill notes.
- [ ] `get_group_progress_summary` does not return missed-question details.

## Admin Group Progress

- [ ] Admin can open `/admin/group-progress`.
- [ ] Reviewer is redirected away from `/admin/group-progress`.
- [ ] Unauthenticated user is redirected through existing auth behavior.
- [ ] Admin sees reviewer count.
- [ ] Admin sees active reviewers this week.
- [ ] Admin sees total study minutes this week.
- [ ] Admin sees question count and aggregate practice accuracy.
- [ ] Admin sees submitted mock count.
- [ ] Admin sees average latest readiness estimate.
- [ ] Admin sees external drill count without private drill notes.
- [ ] Admin sees aggregate weak subjects.
- [ ] Admin sees aggregate weak topics.
- [ ] Admin sees reviewer rows with activity summaries.
- [ ] Admin rows are scoped to active group/exam.
- [ ] Admin rows do not show study notes.
- [ ] Admin rows do not show external drill note fields.
- [ ] Admin rows do not show missed-question details.

## Reviewer Group Progress

- [ ] Reviewer can open `/group-progress`.
- [ ] Unauthenticated user is redirected through existing auth behavior.
- [ ] User without active group is redirected through onboarding behavior.
- [ ] Reviewer sees aggregate active reviewer count only.
- [ ] Reviewer sees aggregate study minutes only.
- [ ] Reviewer sees aggregate question count and accuracy only.
- [ ] Reviewer sees aggregate mock submissions only.
- [ ] Reviewer sees aggregate external drill count only.
- [ ] Reviewer sees active days count.
- [ ] Reviewer sees shared weak subjects and topics as aggregate signals.
- [ ] Reviewer does not see individual readiness scores.
- [ ] Reviewer does not see individual reviewer rows.
- [ ] Reviewer does not see inactive reviewer names.
- [ ] Reviewer does not see lowest-score or low-performer rankings.
- [ ] Reviewer does not see external drill notes.
- [ ] Reviewer does not see missed-question details.
- [ ] Privacy boundary text appears.

## Group Goals

- [ ] Admin can open `/admin/group-goals`.
- [ ] Admin can create a study-minutes goal.
- [ ] Admin can create a questions-answered goal.
- [ ] Admin can create a mock-exams-completed goal.
- [ ] Admin can create an external-drills-logged goal.
- [ ] Admin can create a custom checkpoint goal.
- [ ] Admin can create draft goals.
- [ ] Admin can create active goals.
- [ ] Admin can update goal status.
- [ ] Active goals appear on `/group-progress`.
- [ ] Draft goals do not appear to reviewers.
- [ ] Archived goals do not appear to reviewers.
- [ ] Goal progress uses aggregate activity for the goal date window.
- [ ] Custom goals show manual checkpoint messaging.
- [ ] Goal progress does not reveal individual reviewer data.

## Announcements

- [ ] Admin can open `/admin/announcements`.
- [ ] Admin can create a draft announcement.
- [ ] Admin can publish an announcement.
- [ ] Admin can archive an announcement.
- [ ] Admin can set reviewer visibility.
- [ ] Admin can set admin visibility.
- [ ] Admin can set all-member visibility.
- [ ] Published reviewer announcements appear on `/group-progress`.
- [ ] Published all-member announcements appear on `/group-progress`.
- [ ] Draft announcements do not appear to reviewers.
- [ ] Archived announcements do not appear to reviewers.
- [ ] Admin-only announcements do not appear to reviewers.
- [ ] Announcements are scoped to active group/exam.

## Navigation

- [ ] Main navigation shows Group Progress.
- [ ] Admin navigation shows Admin Progress.
- [ ] Admin navigation shows Group Goals.
- [ ] Admin navigation shows Announcements.
- [ ] Admin hub links to mock exams.
- [ ] Admin hub links to group progress.
- [ ] Admin hub links to group goals.
- [ ] Admin hub links to announcements.
- [ ] `/group-progress` is included in auth middleware matching.

## Regression Checks

- [ ] Auth still works.
- [ ] Onboarding still works.
- [ ] Active group context still works.
- [ ] Active exam track context still works.
- [ ] Dashboard still works.
- [ ] Readiness still works.
- [ ] Study timer still works.
- [ ] Study logs still work.
- [ ] Study habits still work.
- [ ] Question bank still works.
- [ ] Reviewer question submission still works.
- [ ] Practice drills still work.
- [ ] Missed questions still work.
- [ ] Weak areas still work.
- [ ] Analytics still works.
- [ ] External drill logs still work.
- [ ] Mock exam list/start/take/submit/results/review still works.
- [ ] Admin subject/topic management still works.
- [ ] Admin mock builder still works.

## Scope and Build Checks

- [ ] `npm run lint` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] No AI features were implemented.
- [ ] No payment features were implemented.
- [ ] No OCR features were implemented.
- [ ] No file/image upload features were implemented.
- [ ] No public marketplace was implemented.
- [ ] No guaranteed passing claims were added.
- [ ] Readiness remains an internal study estimate.
- [ ] Reviewer group progress remains aggregate-only.
