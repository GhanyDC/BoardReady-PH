# Sprint 5 Verification Checklist

Use this after applying all migrations to a fresh or test Supabase project.

## Database

- Confirm `public.weak_areas` exists.
- Confirm RLS is enabled on `public.weak_areas`.
- Confirm `public.subject_attempt_analytics` exists.
- Confirm `public.topic_attempt_analytics` exists.
- Confirm `public.refresh_user_weak_areas(uuid, uuid)` exists.
- Confirm `public.weak_area_priority(numeric)` exists.
- Confirm `weak_areas` has no image, file, scan, OCR, upload, storage, mock exam, external drill, or readiness-score columns.
- Confirm `weak_areas` includes `user_id`, `group_id`, and `exam_program_id`.
- Confirm the unique context key prevents duplicate weak-area rows for the same user, group, exam track, and topic.

## RLS And Isolation

- As reviewer A, confirm only reviewer A's `weak_areas` rows are selectable.
- As reviewer A, confirm reviewer B's `weak_areas` rows are not selectable.
- As reviewer A, confirm inserting or updating a `weak_areas` row for reviewer B fails.
- As reviewer A, confirm `refresh_user_weak_areas` only refreshes reviewer A's active group and exam track.
- As reviewer A, confirm refreshing another group or exam track fails unless that group is the active accessible context.
- As an active group admin, confirm group summary analytics can be queried only within the active group/exam context.
- As a super admin, confirm global visibility matches the current `is_super_admin()` behavior.

## Weak Area Logic

- Create at least five published-question attempts for one topic with accuracy below 50%; confirm priority is `critical`.
- Create at least five attempts with accuracy from 50% to below 60%; confirm priority is `high`.
- Create at least five attempts with accuracy from 60% to below 70%; confirm priority is `medium`.
- Create at least five attempts with accuracy from 70% to below 80%; confirm priority is `watchlist`.
- Create at least five attempts with accuracy 80% or higher; confirm priority is `cleared`.
- Confirm topics with fewer than five attempts do not appear in `weak_areas`.
- Confirm `accuracy`, `total_attempts`, `correct_attempts`, `wrong_attempts`, `average_confidence`, and `last_attempted_at` update after refresh.
- Confirm only attempts from the active user, active group, and active exam program are included.
- Confirm only attempts tied to currently published questions are included in the analytics views.

## Analytics Helpers

- Confirm subject accuracy equals correct attempts divided by total attempts, multiplied by 100.
- Confirm topic accuracy equals correct attempts divided by total attempts, multiplied by 100.
- Confirm total attempts per subject and topic match saved `question_attempts`.
- Confirm correct/wrong counts match saved attempts.
- Confirm average confidence ignores null confidence values.
- Confirm weakest subject is the attempted subject with the lowest accuracy.
- Confirm weakest topic is the attempted topic with the lowest accuracy.
- Confirm topics below five attempts are treated as insufficient data.

## Pages

- Log in as a reviewer and open `/weak-areas`.
- Confirm weak-area cards show topic, subject, accuracy, total attempts, wrong attempts, average confidence, priority, latest attempt date, and recommended action.
- Confirm `/weak-areas` subject filter works.
- Confirm `/weak-areas` priority filter works.
- Confirm `/weak-areas` minimum-attempts filter works.
- Confirm `/weak-areas` topic search works.
- Confirm `/weak-areas` shows a no-attempts state for users with no attempts.
- Confirm `/weak-areas` shows a not-enough-data state when attempts exist but no topic has five attempts.
- Confirm focused drill links open `/practice` with subject/topic query parameters.
- Confirm missed-question links open `/missed-questions` with subject/topic query parameters.
- Log in as a reviewer and open `/analytics`.
- Confirm `/analytics` shows subject performance cards.
- Confirm `/analytics` shows topic performance grouped by subject.
- Confirm `/analytics` handles subjects/topics with no attempts gracefully.
- Confirm `/analytics` data is scoped to the active user, group, and exam track.
- Confirm `/dashboard` shows Practice Accuracy.
- Confirm `/dashboard` shows total questions answered this week.
- Confirm `/dashboard` shows weakest subject and weakest topic when data exists.
- Confirm `/dashboard` shows top weak areas when topics qualify.
- Confirm `/dashboard` prompts for more practice when data is insufficient.
- Confirm previous study-time cards still work.
- Confirm previous latest-drill activity card still works.

## Navigation And Existing Behavior

- Confirm reviewers see Weak Areas and Analytics navigation links.
- Confirm admins and super admins can see Weak Areas and Analytics navigation links.
- Confirm reviewer navigation does not show admin-only links.
- Confirm logged-out users are redirected away from `/weak-areas` and `/analytics`.
- Confirm auth, onboarding, active group selection, active exam track rendering, study habits, study timer, study logs, practice drills, missed questions, question bank, reviewer question submission, and admin access still work.

## Checks

- Run `npm run lint`.
- Run `npm run typecheck` if the script exists.
- Run `npm run build`.
- Confirm the working tree is clean.
- Confirm Sprint 5 changes are committed as separate logical units.

## Out Of Scope Guardrails

- Confirm no mock exams were implemented.
- Confirm no external drill logs were implemented.
- Confirm no full board readiness scoring was implemented.
- Confirm no AI features were implemented.
- Confirm no payments were implemented.
- Confirm no OCR was implemented.
- Confirm no file/image upload or storage behavior was implemented.
- Confirm no scan/upload fields for hardcopy drills were added.
- Confirm BoardReady PH remains generic for future exam tracks.
