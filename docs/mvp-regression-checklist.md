# MVP Regression Checklist

Run this checklist before every production deployment. Each module includes the critical happy path, failure path, role/access check, and data isolation check.

## Auth And Onboarding

- [ ] Happy path: new user signs up, confirms email if required, logs in, enters invite code, and reaches dashboard.
- [ ] Failure path: invalid invite code shows a clear error and does not create membership.
- [ ] Role/access: logged-in user visiting `/login` or `/signup` redirects to dashboard.
- [ ] Data isolation: user cannot see another user's profile or memberships.

## Active Group And Exam Context

- [ ] Happy path: dashboard displays active group and exam track.
- [ ] Failure path: user without membership is sent to onboarding or shown join-group guidance.
- [ ] Role/access: admin role follows active group membership.
- [ ] Data isolation: user cannot query another group's subjects, topics, or private rows.

## Study Module

- [ ] Happy path: reviewer saves study habits, logs a timer session, and sees it in study logs.
- [ ] Failure path: invalid target date, impossible timer times, or invalid subject/topic is rejected.
- [ ] Role/access: logged-out user cannot access study habits, timer, or logs.
- [ ] Data isolation: reviewer cannot see or edit another reviewer's study preferences, sessions, or notes.

## Question Bank

- [ ] Happy path: admin creates a draft question, saves choices, and publishes it.
- [ ] Failure path: publish without rationale or invalid choices is rejected.
- [ ] Role/access: reviewer cannot access admin question bank routes.
- [ ] Data isolation: admin can manage only active group/exam questions unless super_admin policy applies.

## Reviewer Question Submission

- [ ] Happy path: reviewer submits a question with four choices and rationale.
- [ ] Failure path: invalid subject/topic, missing choice, or missing rationale is rejected.
- [ ] Role/access: logged-out user cannot access submit-question route.
- [ ] Data isolation: submitted question is scoped to current reviewer, group, and exam.

## Practice Drills

- [ ] Happy path: reviewer starts a drill, answers questions, and sees feedback/rationale.
- [ ] Failure path: invalid question, invalid choice, or bad attempt payload is rejected.
- [ ] Role/access: logged-out user cannot access practice routes.
- [ ] Data isolation: reviewer sees and creates only own attempts.

## Missed Questions

- [ ] Happy path: missed question appears after incorrect attempt and can be retried.
- [ ] Failure path: no missed questions shows a clear empty state.
- [ ] Role/access: logged-out user cannot access missed questions.
- [ ] Data isolation: reviewer cannot see another reviewer's missed-question history.

## Weak Areas

- [ ] Happy path: weak areas refresh from practice attempts.
- [ ] Failure path: insufficient attempts shows insufficient-data messaging.
- [ ] Role/access: logged-out user cannot access weak areas.
- [ ] Data isolation: reviewer cannot read another reviewer's weak areas.

## Analytics

- [ ] Happy path: subject/topic performance and external drill summaries render.
- [ ] Failure path: no attempts or logs shows useful empty/insufficient states.
- [ ] Role/access: logged-out user cannot access analytics.
- [ ] Data isolation: reviewer analytics are scoped to current user, group, and exam.

## External Drill Logs

- [ ] Happy path: reviewer creates, views, edits, and deletes an external drill log.
- [ ] Failure path: score greater than total items, invalid date, or invalid topic is rejected.
- [ ] Role/access: logged-out user cannot access external drill routes.
- [ ] Data isolation: reviewer cannot see or edit another reviewer's drill logs or notes.
- [ ] Boundary: no upload, file, scan, OCR, or photo field exists.

## Mock Exams

- [ ] Happy path: admin creates/publishes mock, reviewer starts/resumes/submits, then views results and review.
- [ ] Failure path: incomplete mock cannot publish; invalid attempt cannot submit.
- [ ] Role/access: reviewer cannot access admin mock builder routes.
- [ ] Data isolation: reviewer cannot read or submit another reviewer's mock attempt.

## Readiness

- [ ] Happy path: readiness page shows score, label, components, subject breakdown, and recommendations.
- [ ] Failure path: missing signals show insufficient-data warnings.
- [ ] Role/access: logged-out user cannot access readiness.
- [ ] Data isolation: reviewer cannot read another reviewer's readiness snapshots.
- [ ] Boundary: disclaimer says readiness is an internal study estimate and does not guarantee board exam results.

## Group Progress

- [ ] Happy path: reviewer sees aggregate group progress, active goals, and published announcements.
- [ ] Failure path: no goals, no announcements, or no weak signals shows clear empty states.
- [ ] Role/access: logged-out user cannot access group progress.
- [ ] Data isolation: reviewer does not see individual readiness scores, weak areas, notes, inactive names, or low-performer rankings.

## Admin Analytics

- [ ] Happy path: admin opens admin group progress and sees reviewer activity summaries.
- [ ] Failure path: no reviewers or no activity shows clear empty states.
- [ ] Role/access: reviewer cannot access admin group progress.
- [ ] Data isolation: admin data is scoped to active group/exam and excludes private notes/missed-question details from the UI.

## Group Goals

- [ ] Happy path: admin creates active goal and reviewer sees aggregate progress.
- [ ] Failure path: invalid date range or invalid target is rejected.
- [ ] Role/access: reviewer cannot create/update/delete goals.
- [ ] Data isolation: goal progress is aggregate-only for reviewers.

## Announcements

- [ ] Happy path: admin publishes reviewer/all announcement and reviewer sees it.
- [ ] Failure path: draft, archived, or admin-only announcement is hidden from reviewers.
- [ ] Role/access: reviewer cannot create/update/delete announcements.
- [ ] Data isolation: announcements are scoped to active group/exam.

## Navigation

- [ ] Happy path: primary nav links open expected pages for reviewer.
- [ ] Happy path: admin nav links appear for admin.
- [ ] Failure path: reviewer entering admin URLs redirects away.
- [ ] Role/access: submit-question link is hidden for admins as intended.
- [ ] Data isolation: nav visibility is not treated as the only security layer.

## Privacy And Security

- [ ] Logged-out protected routes redirect to login.
- [ ] Reviewers cannot access admin pages.
- [ ] Reviewers cannot see other reviewers' study logs.
- [ ] Reviewers cannot see other reviewers' weak areas.
- [ ] Reviewers cannot see other reviewers' readiness scores.
- [ ] Reviewers cannot see other reviewers' external drill notes.
- [ ] Reviewers cannot see other reviewers' mock attempts.
- [ ] Admins cannot manage another group unless assigned or super_admin policy supports it.
- [ ] No AI feature exists.
- [ ] No payment feature exists.
- [ ] No OCR feature exists.
- [ ] No file/image upload feature exists.
- [ ] No pass guarantee language exists.

## Build And Deployment

- [ ] `npm run lint` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] Production environment variables are configured.
- [ ] Supabase migrations are applied.
- [ ] RLS verification suite passes.
- [ ] Private beta checklist is complete.
- [ ] Production environment checklist is complete.
- [ ] Latest deployment smoke test passes.
