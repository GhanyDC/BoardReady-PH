# Sprint 7 Verification Checklist

Use this checklist against a live Supabase project with at least one admin, one reviewer, an active group, an active exam program, active subjects/topics, and enough published verified questions for the requested mock exam distribution.

## Database and RLS

- [ ] Migrations apply cleanly.
- [ ] `mock_exams` exists.
- [ ] `mock_exam_items` exists.
- [ ] `mock_exam_attempts` exists.
- [ ] `mock_exam_answers` exists.
- [ ] RLS is enabled on all four mock exam tables.
- [ ] Mock exam templates are separate from user attempts.
- [ ] User attempts are separate from practice drill attempts.
- [ ] Admin can manage mock exam templates only for the active group and exam program.
- [ ] Reviewer cannot create, update, publish, archive, or delete mock exam templates.
- [ ] Reviewer can read only published mock exams for the active group and exam program.
- [ ] Reviewer cannot read draft or archived mocks from the mock exam list.
- [ ] Reviewer cannot access mock exams from another group.
- [ ] Reviewer cannot access another user's mock attempts, results, answers, or review pages.
- [ ] `mock_exam_items.question_id` rejects unpublished questions.
- [ ] `mock_exam_items.question_id` rejects questions from another group or exam program.
- [ ] `mock_exam_attempts` rejects mismatched group or exam program values.
- [ ] `mock_exam_answers` rejects choices that do not belong to the answered question.
- [ ] `mock_exam_answers` rejects questions that are not in the selected mock exam item set.
- [ ] Duplicate submission is prevented.

## Admin Mock Builder

- [ ] Admin can open `/admin/mock-exams`.
- [ ] Reviewer cannot open `/admin/mock-exams`.
- [ ] Admin can open `/admin/mock-exams/new`.
- [ ] Title is required.
- [ ] Item count must be greater than 0.
- [ ] Time limit must be greater than 0.
- [ ] Weighted subject distribution preview uses active subject weights.
- [ ] A 50-item Psychometrician mock allocates 20 items to Psychological Assessment and 10 items to each 20% subject when using 40/20/20/20 weights.
- [ ] A 100-item Psychometrician mock allocates 40 items to Psychological Assessment and 20 items to each 20% subject when using 40/20/20/20 weights.
- [ ] A 200-item Psychometrician mock allocates 80 items to Psychological Assessment and 40 items to each 20% subject when using 40/20/20/20 weights.
- [ ] Admin sees a clear error when a subject lacks enough published verified questions.
- [ ] Admin can create a draft mock exam.
- [ ] Draft contains exactly `item_count` saved mock exam items.
- [ ] Admin can edit and regenerate a draft.
- [ ] Admin can publish a valid mock exam.
- [ ] Admin cannot publish an incomplete mock exam.
- [ ] Admin can archive a published mock exam.

## Reviewer Mock Exams

- [ ] Reviewer can open `/mock-exams`.
- [ ] Published mock exams appear for the active group and exam program.
- [ ] Draft mock exams do not appear.
- [ ] Archived mock exams do not appear.
- [ ] Cross-group mock exams do not appear.
- [ ] Empty state appears when no published mocks exist.
- [ ] Start creates a `mock_exam_attempt` with `in_progress` status.
- [ ] Starting an exam with an existing in-progress attempt resumes that attempt.
- [ ] Attempt uses the fixed `mock_exam_items` question set.
- [ ] Attempt is tied to the active user, group, and exam program.

## Timed Taking Flow

- [ ] `/mock-exams/[attemptId]/take` opens for the attempt owner.
- [ ] Another user cannot open the attempt.
- [ ] Timer appears.
- [ ] Timer uses `time_limit_minutes` from the mock exam.
- [ ] Timer is client-side and should be treated as MVP enforcement only.
- [ ] Question progress appears.
- [ ] User can navigate between questions.
- [ ] User can select answers.
- [ ] Answers are locally persisted for the attempt in the browser.
- [ ] Remaining unanswered count updates.
- [ ] Correct answer is hidden during the exam.
- [ ] Rationale is hidden during the exam.
- [ ] Choice explanations are hidden during the exam.
- [ ] If time expires, the expired state appears and the user can submit saved answers.
- [ ] Submit is disabled while submission is pending.

## Submission and Results

- [ ] Submission saves selected answers into `mock_exam_answers`.
- [ ] Unanswered items are counted as unanswered.
- [ ] `is_correct` is calculated from the selected choice.
- [ ] Score is calculated correctly.
- [ ] Percentage is calculated correctly.
- [ ] `submitted_at` is set.
- [ ] `time_spent_seconds` is set.
- [ ] Attempt status becomes `submitted`.
- [ ] User is redirected to `/mock-exams/[attemptId]/results`.
- [ ] Result page shows score and total items.
- [ ] Result page shows percentage.
- [ ] Result page shows time spent.
- [ ] Result page shows correct count.
- [ ] Result page shows wrong count.
- [ ] Result page shows unanswered count.
- [ ] Subject breakdown shows subject name, items, correct count, and percentage.
- [ ] Topic breakdown shows topic name, items, correct count, and percentage.
- [ ] Another user cannot view the result.

## Answer Review

- [ ] Submitted attempt can open `/mock-exams/[attemptId]/review`.
- [ ] In-progress attempt cannot show answer review.
- [ ] Another user cannot open the review page.
- [ ] Each item shows the question text.
- [ ] Each item shows selected answer.
- [ ] Each item shows correct answer.
- [ ] Each item shows correct, incorrect, or unanswered state.
- [ ] Rationale appears only after submission.
- [ ] Choice explanations appear only after submission.
- [ ] Subject and topic appear for each item.

## Dashboard and Navigation

- [ ] Dashboard shows latest mock exam card.
- [ ] Dashboard shows latest mock exam title when available.
- [ ] Dashboard shows latest score and percentage for submitted attempts.
- [ ] Dashboard shows in-progress status and resume link.
- [ ] Dashboard prompts to take a mock exam when published mocks exist but no attempts exist.
- [ ] Dashboard handles no published mock exams gracefully.
- [ ] Practice accuracy remains separate from mock exam score.
- [ ] External drill average remains separate from mock exam score.
- [ ] Reviewer navigation shows Mock Exams.
- [ ] Admin and super admin navigation shows Manage Mock Exams.
- [ ] Reviewer navigation does not show Manage Mock Exams.

## Regression Checks

- [ ] Auth still works.
- [ ] Onboarding still works.
- [ ] Active group selection behavior still works.
- [ ] Active exam track scoping still works.
- [ ] Study timer still works.
- [ ] Study logs still work.
- [ ] Study habits still work.
- [ ] Question bank still works.
- [ ] Reviewer question submission still works.
- [ ] Practice drills still work.
- [ ] Missed questions still work.
- [ ] Weak areas still work.
- [ ] Analytics still work.
- [ ] External drill logging, editing, deleting, and listing still work.
- [ ] Admin question management still works.
- [ ] Admin subject/topic management still works.

## Build Checks

- [ ] `npm run lint` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] No final board-readiness scoring was implemented.
- [ ] No mock exam score is mixed into practice accuracy.
- [ ] No mock exam score is mixed into external drill averages.
- [ ] No AI, payments, OCR, upload, scan, or hardcopy question-storage features were added.
