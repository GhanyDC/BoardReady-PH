# Sprint 4 Verification Checklist

Use this checklist after applying all migrations to a fresh Supabase project or staging database.

## Database and RLS

- Confirm `question_attempts` exists with `user_id`, `group_id`, `exam_program_id`, `question_id`, `selected_choice_id`, `is_correct`, `confidence_rating`, `time_spent_seconds`, `attempt_type`, and `created_at`.
- Confirm RLS is enabled on `question_attempts`.
- Confirm users can read only their own attempts.
- Confirm users cannot create attempts for another `user_id`.
- Confirm users cannot create attempts for unpublished questions.
- Confirm users cannot create attempts for questions in another group or exam program.
- Confirm `selected_choice_id` must belong to the attempted question.
- Confirm `is_correct` is calculated from the selected choice by the database.
- Confirm `confidence_rating` accepts null or values 1-5 only.
- Confirm `time_spent_seconds` accepts null or values greater than or equal to 0 only.

## Practice Setup

- Visit `/practice` while logged out and confirm middleware redirects to login with the `next` path.
- Visit `/practice` as an onboarded reviewer.
- Confirm subject options are scoped to the active group and exam program.
- Confirm topic options depend on the selected subject.
- Confirm only published questions are counted.
- Confirm draft, pending review, needs revision, archived, and rejected questions are not counted.
- Confirm zero-question setups show a clear message and cannot start.
- Confirm requested item count does not exceed matching published questions.

## Drill Session

- Start a practice session from `/practice`.
- Confirm the session loads randomized published questions from the active group and exam program.
- Confirm only one question appears at a time.
- Confirm choices A-D render in order.
- Confirm answer submission is blocked until a choice is selected.
- Confirm duplicate submission for the same displayed question is prevented.
- Confirm an attempt row is saved after answer submission.
- Confirm the attempt uses the active `user_id`, `group_id`, and `exam_program_id`.
- Confirm session progress such as `3/20` updates.
- Confirm the session ends with a simple summary.
- Refresh during a session and confirm Sprint 4 does not promise session persistence.

## Feedback and Confidence

- Confirm correctness feedback appears only after answer submission.
- Confirm the correct answer is shown after submission.
- Confirm the question rationale is shown after submission.
- Confirm selected and other choice explanations appear after submission.
- Confirm rationale and correctness are not revealed before submission.
- Confirm confidence rating is saved with the attempt.
- Confirm Next question is available only after feedback appears.

## Missed Questions

- Create at least one incorrect practice attempt.
- Visit `/missed-questions` as the same user and confirm the missed question appears.
- Confirm another user's wrong attempts do not appear.
- Filter missed questions by subject, topic, difficulty, and date range.
- Confirm latest wrong attempt date, wrong-attempt count, and latest confidence rating render.
- Use Retry question and confirm it opens a one-question practice session.
- Submit the retry and confirm a new `question_attempts` row is created with `attempt_type = missed_question_review`.
- Confirm only active group and active exam program data appears.

## Dashboard

- Confirm Dashboard Practice Activity shows latest drill attempt.
- Confirm Dashboard shows today's answered question count.
- Confirm Dashboard shows today's correct count.
- Confirm Dashboard shows today's accuracy when attempts exist.
- Confirm Dashboard handles no attempts gracefully and links to `/practice`.
- Confirm existing study-time cards still render.

## Navigation

- Confirm reviewers see Practice and Missed Questions.
- Confirm admins and super admins can also access Practice and Missed Questions if needed.
- Confirm reviewers still do not see admin-only question bank links.
- Confirm admin question bank links remain protected.

## Regression and Scope

- Confirm signup, login, onboarding, active group, active exam track, dashboard, study habits, study timer, study logs, question bank, reviewer submission, and admin access still work.
- Confirm `npm run lint` passes.
- Confirm `npm run build` passes.
- Confirm no mock exams, weak area tracker, readiness scoring, external drill logs, AI, payments, OCR, or file/image uploads were added in Sprint 4.
- Confirm no scan/upload fields for hardcopy drills were added.
