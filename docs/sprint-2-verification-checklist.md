# Sprint 2 Verification Checklist

Use this checklist after applying the Sprint 2 migration to a fresh Supabase project or staging database.

## Database and RLS

- Apply all migrations from an empty database and confirm no migration depends on local seed state outside the committed SQL.
- Confirm `study_preferences` exists with `user_id`, `group_id`, `exam_program_id`, goals, preferred style/time, rest days, and target exam date fields.
- Confirm `study_sessions` exists with `user_id`, `group_id`, `exam_program_id`, optional `subject_id` and `topic_id`, activity type, timestamps, duration, focus rating, and notes.
- Confirm both tables have RLS enabled.
- As a reviewer, create and update only your own `study_preferences` row for your active group and exam track.
- As a reviewer, confirm another user's `study_preferences` row is not visible or writable.
- As a reviewer, create only your own `study_sessions` rows for your active group and exam track.
- As a reviewer, confirm another user's `study_sessions` rows are not visible or writable.
- As an active group admin, confirm group study sessions can be read for analytics, while direct reviewer-owned progress editing is still restricted by policy.
- As a super admin, confirm cross-group study preferences and sessions can be read according to the super admin policies.
- Confirm `subject_id` and `topic_id` on `study_sessions` must belong to the same active group and exam track.

## Study Habits

- Visit `/study-habits` while logged out and confirm protected-route handling redirects away from the page.
- Visit `/study-habits` as an onboarded reviewer and confirm the form renders for the active group and exam track.
- Save daily and weekly goals, preferred session length, study time, style, weakness strategy, rest days, and target exam date.
- Reload `/study-habits` and confirm the saved values are prefilled.
- Switch active group, if multiple groups exist, and confirm preferences are scoped to the newly active group and exam track.

## Study Timer

- Visit `/study-timer` while logged out and confirm protected-route handling redirects away from the page.
- Start, pause, resume, and end a session, then confirm paused time is excluded from saved duration.
- Save a session with an activity type, optional subject/topic, focus rating, and notes.
- Confirm zero-duration sessions are rejected before insert.
- Confirm the inserted `study_sessions` row has the current user ID, active group ID, and active exam program ID.
- Confirm a topic cannot be saved without its parent subject.

## Study Logs

- Visit `/study-logs` while logged out and confirm protected-route handling redirects away from the page.
- Confirm saved sessions render newest first.
- Filter logs by date range, subject, and activity type.
- Confirm total visible time updates based on filters.
- Confirm logs do not show sessions from another user, group, or exam track for a reviewer.

## Dashboard

- Visit `/dashboard` as an onboarded user and confirm active group and exam track render in the shell and header.
- Confirm Today's Study Time uses sessions started during the server-local calendar day.
- Confirm Weekly Study Time uses the server-local Monday-start calendar week.
- Confirm progress bars use `study_preferences.daily_goal_minutes` and `study_preferences.weekly_goal_minutes`.
- Confirm the Latest Session card changes after saving a new timer session.
- Confirm the Study Plan card reflects target exam date, preferred study style, and preferred session length from `/study-habits`.
- Confirm the no-preferences state links to Study Habits.
- Confirm the no-sessions state links to Study Timer.

## Navigation and Roles

- Confirm reviewer navigation shows Dashboard, Study Timer, Study Logs, and Study Habits.
- Confirm reviewer navigation does not show Admin.
- Confirm direct reviewer access to `/admin` is denied.
- Confirm admin and super admin access to `/admin` still works.

## Scope Guardrails

- Confirm Sprint 2 did not add AI, payments, OCR, video hosting, file uploads, question bank, drills, mock exams, or external drill log storage.
- Confirm no image, file, scan, OCR, upload, or hosted-material fields were added for external hardcopy drills.

## Known Assumptions

- The timer is page-based and does not persist through refresh or tab close.
- Paused time is excluded from the duration saved by the timer.
- Dashboard day and week calculations use the application server's local timezone.
- Weekly dashboard progress uses a Monday-start calendar week.
- Dedicated timezone preferences are not implemented in Sprint 2.
