# Sprint 6 Verification Checklist

Use this after applying all migrations to a fresh or test Supabase project.

## Database

- Confirm `public.external_drill_logs` exists.
- Confirm RLS is enabled on `public.external_drill_logs`.
- Confirm `external_drill_logs` includes `user_id`, `group_id`, `exam_program_id`, `subject_id`, and optional `topic_id`.
- Confirm `percentage` is generated or otherwise calculated from `score / total_items * 100`.
- Confirm `total_items` must be greater than 0.
- Confirm `score` must be greater than or equal to 0.
- Confirm `score` cannot exceed `total_items`.
- Confirm `date_taken` is required or defaults to the current date.
- Confirm the table has no image, file, scan, OCR, upload, attachment, storage, hosted-material, or photo-capture columns.
- Confirm `public.can_manage_external_drill_log(uuid, uuid, uuid, uuid, uuid)` exists.
- Confirm the save trigger rejects logs outside the current user, active group, active exam track, and matching subject/topic context.

## RLS And Isolation

- As reviewer A, confirm reviewer A can create an external drill log for reviewer A's active group and exam track.
- As reviewer A, confirm reviewer A can read only reviewer A's external drill logs.
- As reviewer A, confirm reviewer B's external drill logs are not selectable.
- As reviewer A, confirm reviewer A can update reviewer A's own external drill log.
- As reviewer A, confirm reviewer A cannot update reviewer B's external drill log.
- As reviewer A, confirm reviewer A can delete reviewer A's own external drill log.
- As reviewer A, confirm reviewer A cannot delete reviewer B's external drill log.
- As reviewer A, confirm creating a log for another group fails.
- As reviewer A, confirm creating a log for another exam program fails.
- As reviewer A, confirm choosing a topic from a different subject fails.
- As an active group admin, confirm group-scoped summary visibility matches the current admin RLS behavior.
- As a super admin, confirm global visibility matches the current `is_super_admin()` behavior.

## App Flows

- Log in as a reviewer and open `/external-drills/new`.
- Confirm the form shows the helper text: "Log your score from a hardcopy/offline drill. Do not upload photos, scans, or copyrighted materials."
- Confirm the form includes drill title, source label, subject, topic, total items, score, date taken, weak topics, and mistakes/notes.
- Confirm the form has no file, image, scan, OCR, upload, attachment, or photo field.
- Confirm saving a valid log redirects to `/external-drills`.
- Confirm invalid score and total combinations show validation errors.
- Confirm the saved row has the authenticated `user_id`.
- Confirm the saved row has the active `group_id`.
- Confirm the saved row has the active `exam_program_id`.
- Confirm `/external-drills` lists saved logs.
- Confirm `/external-drills` filters by subject.
- Confirm `/external-drills` filters by topic.
- Confirm `/external-drills` filters by date range.
- Confirm `/external-drills` filters by performance category.
- Confirm performance categories are: critical below 50%, high risk 50-59%, needs work 60-69%, acceptable 70-79%, and strong 80%+.
- Confirm the detail page shows full weak-topic notes and mistake notes.
- Confirm edit updates recalculate percentage.
- Confirm delete asks for confirmation before removing a log.
- Confirm empty states are clear for users with no external drill logs.

## Analytics And Dashboard

- Confirm `/analytics` shows external drill summaries separately from practice accuracy.
- Confirm `/analytics` shows total external drills logged.
- Confirm `/analytics` shows average external drill percentage.
- Confirm `/analytics` shows total external items.
- Confirm `/analytics` shows the latest external drill when available.
- Confirm `/analytics` shows weakest external subject when available.
- Confirm `/analytics` shows weakest external topic when topic data exists.
- Confirm external drill summaries use only the active user, group, and exam program.
- Confirm external drill data is not mixed into `subject_attempt_analytics`.
- Confirm external drill data is not mixed into `topic_attempt_analytics`.
- Confirm external drill data is not mixed into `weak_areas` refresh logic.
- Confirm `/dashboard` shows the external drill performance card.
- Confirm `/dashboard` shows latest external drill score, average external percentage, total drills logged, and weakest external subject when available.
- Confirm `/dashboard` prompts users to log an external drill when none exist.
- Confirm dashboard practice accuracy remains based only on published-question attempts.

## Navigation And Existing Behavior

- Confirm reviewers see External Drills and Log External Drill navigation links.
- Confirm admins and super admins can also access external drill pages if appropriate.
- Confirm admin-only links remain hidden from reviewers.
- Confirm logged-out users are redirected away from `/external-drills`, `/external-drills/new`, detail pages, and edit pages.
- Confirm auth, onboarding, active group selection, active exam track rendering, study habits, study timer, study logs, practice drills, missed questions, question bank, weak areas, analytics, and admin access still work.

## Checks

- Run `npm run lint`.
- Run `npm run typecheck`.
- Run `npm run build`.
- Confirm the working tree is clean.
- Confirm Sprint 6 changes are committed as separate logical units.

## Out Of Scope Guardrails

- Confirm no mock exams were implemented.
- Confirm no full readiness scoring was implemented.
- Confirm no AI features were implemented.
- Confirm no payments were implemented.
- Confirm no OCR was implemented.
- Confirm no file/image upload or storage behavior was implemented.
- Confirm no scan/upload fields for hardcopy drills were added.
- Confirm no copied review-center questions are stored.
- Confirm BoardReady PH remains generic for future exam tracks.
