# Private Beta Testing Checklist

Use this checklist with a small review group before opening BoardReady PH more broadly. Each tester should record the account used, role, browser/device, date, and any issue screenshots.

## Tester Setup

- [ ] Tester has the correct app URL.
- [ ] Tester knows whether email confirmation is enabled.
- [ ] Tester has the current invite code.
- [ ] Tester knows their intended role: reviewer or admin.
- [ ] Tester understands BoardReady PH is an internal study tool and does not guarantee board exam results.

## Reviewer Onboarding

- [ ] Sign up with email and password.
- [ ] Confirm email if required.
- [ ] Log in.
- [ ] Enter invite code during onboarding.
- [ ] Land on the dashboard.
- [ ] Confirm the dashboard shows the correct group.
- [ ] Confirm the dashboard shows the correct exam track.
- [ ] Sign out and sign back in.
- [ ] Confirm the account returns to the same active group/exam.
- [ ] Try an invalid invite code and confirm a clear error appears.

## Study Module

- [ ] Open Study Habits.
- [ ] Set daily study goal.
- [ ] Set weekly study goal.
- [ ] Set session length, preferred study time, study style, rest days, and optional target date.
- [ ] Save study habits and confirm success.
- [ ] Open Study Timer.
- [ ] Start, pause, resume, and save a study session.
- [ ] Save a session with subject/topic.
- [ ] Save a general session without subject/topic.
- [ ] Confirm invalid timer data is rejected.
- [ ] Open Study Logs.
- [ ] Confirm saved sessions appear.
- [ ] Filter logs by date, subject, and activity.
- [ ] Confirm private notes appear only to the owning account.

## Question Bank And Practice

- [ ] Admin opens Question Bank.
- [ ] Admin creates a draft question.
- [ ] Admin publishes a question with four choices and one correct answer.
- [ ] Reviewer opens Practice.
- [ ] Reviewer starts a practice drill.
- [ ] Reviewer answers a question.
- [ ] Confirm answer feedback appears.
- [ ] Confirm rationale appears after answering.
- [ ] Confirm the attempt is saved.
- [ ] Confirm incorrect answers appear under Missed Questions.
- [ ] Retry a missed question.
- [ ] Confirm retry saves a new attempt.
- [ ] Reviewer submits a question for review.
- [ ] Admin sees reviewer-submitted question.

## Analytics And Weak Areas

- [ ] Answer enough practice questions to generate analytics.
- [ ] Open Analytics.
- [ ] Confirm subject performance appears.
- [ ] Confirm topic performance appears.
- [ ] Open Weak Areas.
- [ ] Confirm weak areas update from practice attempts.
- [ ] Confirm insufficient-data messaging appears when attempts are too low.
- [ ] Confirm reviewer cannot see another reviewer's weak areas.

## Readiness

- [ ] Open Readiness.
- [ ] Confirm readiness score appears when signals exist.
- [ ] Confirm component scores appear.
- [ ] Confirm subject readiness breakdown appears.
- [ ] Confirm recommendations link to relevant modules.
- [ ] Confirm insufficient-data warnings appear when signals are missing.
- [ ] Confirm the disclaimer is visible: internal study estimate, no guaranteed exam result.
- [ ] Confirm reviewer cannot see another reviewer's readiness score.

## External Drill Logs

- [ ] Open External Drills.
- [ ] Log a hardcopy/offline drill score.
- [ ] Confirm no upload, scan, OCR, photo, or file field exists.
- [ ] Edit the drill log.
- [ ] Delete a drill log.
- [ ] Confirm dashboard external drill summary updates.
- [ ] Confirm private notes are not visible to another reviewer.

## Mock Exams

- [ ] Admin opens Manage Mock Exams.
- [ ] Admin creates a draft mock exam.
- [ ] Admin publishes the mock exam.
- [ ] Reviewer opens Mock Exams.
- [ ] Reviewer starts the mock exam.
- [ ] Reviewer resumes an in-progress mock exam.
- [ ] Reviewer submits the mock exam.
- [ ] Reviewer views results.
- [ ] Reviewer reviews answers and rationales.
- [ ] Confirm reviewer cannot access another reviewer's attempt.
- [ ] Admin archives a mock exam.

## Group Progress, Goals, And Announcements

- [ ] Admin opens Admin Progress.
- [ ] Admin sees group-level activity metrics.
- [ ] Admin sees reviewer rows only in admin view.
- [ ] Admin confirms no study notes, external drill notes, or missed-question details are shown.
- [ ] Reviewer opens Group Progress.
- [ ] Reviewer sees aggregate group progress only.
- [ ] Reviewer does not see individual readiness scores.
- [ ] Reviewer does not see individual weak areas.
- [ ] Reviewer does not see inactive reviewer names or low-performer rankings.
- [ ] Admin creates an active group goal.
- [ ] Reviewer sees active group goal progress.
- [ ] Admin archives the goal.
- [ ] Reviewer no longer sees archived goal.
- [ ] Admin publishes a reviewer announcement.
- [ ] Reviewer sees the announcement.
- [ ] Admin creates an admin-only announcement.
- [ ] Reviewer does not see the admin-only announcement.

## Privacy And Access Checks

- [ ] Logged-out user visiting `/dashboard` redirects to login.
- [ ] Logged-out user visiting `/practice` redirects to login.
- [ ] Logged-out user visiting `/mock-exams` redirects to login.
- [ ] Logged-out user visiting `/admin` redirects to login.
- [ ] Reviewer cannot open `/admin`.
- [ ] Reviewer cannot open `/admin/questions`.
- [ ] Reviewer cannot open `/admin/mock-exams`.
- [ ] Reviewer cannot open `/admin/group-progress`.
- [ ] Reviewer cannot see another reviewer's readiness snapshots.
- [ ] Reviewer cannot see another reviewer's weak areas.
- [ ] Reviewer cannot see another reviewer's study logs.
- [ ] Reviewer cannot see another reviewer's external drill notes.
- [ ] Reviewer cannot see another reviewer's mock exam attempt.
- [ ] Admin cannot manage another group unless assigned there.

## Final Tester Feedback

- [ ] Tester can explain what the app is for.
- [ ] Tester can find the main study workflows without help.
- [ ] Tester understands readiness is a study estimate.
- [ ] Tester did not encounter pass-guarantee language.
- [ ] Tester did not encounter upload/OCR/file-storage prompts.
- [ ] Tester reports confusing labels or dead ends.
- [ ] Tester reports performance or loading issues.
- [ ] Tester reports any privacy concern immediately.
