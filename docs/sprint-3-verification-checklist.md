# Sprint 3 Verification Checklist

Use this checklist after applying all migrations to a fresh Supabase project or staging database.

## Database

- Confirm `questions` exists with `exam_program_id`, `group_id`, `subject_id`, `topic_id`, question text, difficulty, Bloom level, rationale, source type, status, creator, verifier, publish/archive timestamps, and timestamps.
- Confirm `choices` exists with `question_id`, labels A-D, choice text, correctness, explanation, order, and timestamps.
- Confirm `question_reports` exists with question, reporter, report type, message, status, resolver, resolved timestamp, and created timestamp.
- Confirm RLS is enabled on `questions`, `choices`, and `question_reports`.
- Confirm no upload, image, file, scan, OCR, or hosted-material columns exist on question-bank tables.
- Confirm fresh migrations apply in timestamp order without manual edits.

## RLS and Isolation

- As a reviewer, confirm published questions in the active group and exam program are readable.
- As a reviewer, confirm unpublished official questions are not readable unless created by that reviewer.
- As a reviewer, confirm questions from another group are not readable.
- As a reviewer, confirm creating a question for another group or exam program is rejected.
- As a reviewer, confirm publishing or archiving a question is rejected.
- As an admin, confirm draft, pending review, needs revision, published, archived, and rejected questions in the active group are readable.
- As an admin, confirm questions from another active group are not shown unless the admin is a global super admin.
- As a super admin, confirm global question-bank management works if global super admin membership is configured.

## Subject and Topic Admin

- Visit `/admin/subjects` as an admin and confirm active exam track context is visible.
- Confirm subjects are scoped to the active group and exam program.
- Update subject board weight, display order, and active state.
- Visit `/admin/topics` as an admin and confirm active exam track context is visible.
- Create a topic under an active subject.
- Edit a topic name, subject, display order, and active state.
- Archive and restore a topic.
- Confirm reviewer access to `/admin/subjects` and `/admin/topics` redirects away.

## Admin Question List

- Visit `/admin/questions` as an admin.
- Confirm only active group and active exam program questions appear.
- Filter by subject, topic, difficulty, status, and source type.
- Search by question text.
- Confirm status badges render clearly.
- Confirm empty state appears when filters match no questions.
- Confirm pending reviewer submissions appear in the list.
- Confirm reviewer access to `/admin/questions` redirects away.

## Admin Create and Publish

- Create a draft question from `/admin/questions/new`.
- Confirm the inserted question uses the current admin as `created_by`.
- Confirm the inserted question uses the active `group_id` and `exam_program_id`.
- Confirm four choices are saved with labels A-D and order 1-4.
- Confirm exactly one choice is saved as correct.
- Publish a valid question with rationale and confirm `status = published`.
- Confirm `verified_by` and `published_at` are set when publishing.
- Attempt to publish without a rationale and confirm it is blocked.
- Attempt to publish without four choices or without one correct answer and confirm the database rejects it.
- Attempt to choose a topic outside the selected subject and confirm it is blocked.

## Admin Edit and Status Workflow

- Edit question text, difficulty, Bloom level, source type, subject, topic, rationale, choices, and correct answer.
- Confirm `draft -> pending_review` works.
- Confirm `draft -> published` works when publish requirements are met.
- Confirm `pending_review -> needs_revision` works.
- Confirm `pending_review -> published` works when publish requirements are met.
- Confirm `needs_revision -> pending_review` works.
- Confirm `pending_review -> rejected` works.
- Confirm `published -> archived` works and sets `archived_at`.
- Confirm `archived -> published` works if allowed for the test case.
- Confirm invalid status transitions are blocked.
- Confirm incomplete questions cannot be published.

## Reviewer Submission

- Visit `/submit-question` as an onboarded reviewer.
- Submit a question with subject, topic, difficulty, text, four choices, one correct answer, rationale, and reviewer source type.
- Confirm the submitted question defaults to `pending_review`.
- Confirm `created_by` is the current reviewer.
- Confirm active `group_id` and `exam_program_id` are set.
- Confirm the reviewer can see their own recent submissions.
- Confirm the reviewer cannot publish or edit official published questions.
- Confirm the submitted question appears in `/admin/questions` for an admin in the same active group.

## Navigation

- Confirm reviewers see Submit Question and do not see admin-only question-bank links.
- Confirm admins and super admins see Question Bank and Subjects/Topics links.
- Confirm admin landing cards link to Question Bank and Subjects/Topics.
- Confirm mobile-width navigation wraps without hiding sign-out.

## Regression Checks

- Confirm signup, login, onboarding, active group, active exam track, dashboard, study habits, study timer, and study logs still work.
- Confirm `npm run lint` passes.
- Confirm `npm run build` passes.
- Confirm no practice drill answering, question attempts, mock exams, weak areas, readiness scoring, external drill logs, AI, payments, OCR, or file uploads were added in Sprint 3.
