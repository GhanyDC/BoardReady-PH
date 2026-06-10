# Route and Permission Inventory

Sprint 10 audit snapshot. This inventory documents intended access, server-side guards, middleware coverage, sensitive data exposure, and known route-protection gaps.

## Guard Legend

- `public`: no authenticated session required.
- `auth redirect`: middleware redirects authenticated users away from auth pages.
- `requireCurrentUser`: page/action requires a logged-in user and redirects unauthenticated users to `/login`.
- `requireMembership`: page/action requires a logged-in user with an active group/exam context and redirects users without membership to `/onboarding`.
- `requireAdminContext`: page/action requires admin or super_admin role for the active group/exam and redirects reviewers to `/dashboard`.
- `RLS`: Supabase row level security remains the final data isolation boundary.

## Current Middleware Gap

Before Sprint 10 auth hardening, `src/lib/supabase/proxy.ts` lists more protected prefixes than `src/proxy.ts` actually matches. The helper protects these prefixes when invoked: `/analytics`, `/dashboard`, `/admin`, `/external-drills`, `/group-progress`, `/missed-questions`, `/onboarding`, `/practice`, `/readiness`, `/submit-question`, `/study-habits`, `/study-logs`, `/study-timer`, and `/weak-areas`.

However, `src/proxy.ts` currently invokes proxy only for `/dashboard`, `/admin`, `/group-progress`, `/onboarding`, `/readiness`, `/login`, and `/signup`. Routes marked `Gap before Sprint 10 fix` below rely on server-side guards and RLS but do not receive early middleware redirects until the matcher is aligned.

## Public and Auth Routes

| Route | Intended access | Server-side guard | Middleware coverage | Sensitive data shown | Reviewer allowed | Admin-only | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Public | `public` | Not required | Public marketing copy only | Yes | No | Landing page only. |
| `/login` | Public for logged-out users | `auth redirect` through middleware | Covered | Auth form only | Yes | No | Logged-in users redirect to `/dashboard`. |
| `/signup` | Public for logged-out users | `auth redirect` through middleware | Covered | Auth form only | Yes | No | Logged-in users redirect to `/dashboard`. |

## Authenticated Reviewer Routes

| Route | Intended access | Server-side guard | Middleware coverage | Sensitive data shown | Reviewer allowed | Admin-only | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/dashboard` | Active user; membership-dependent content | `requireCurrentUser`; active group empty state | Covered | Current user's study, practice, mock, readiness, external drill summary | Yes | No | User without active group sees onboarding prompt. |
| `/study-habits` | Active group member | `requireMembership` | Gap before Sprint 10 fix | Current user's study preferences | Yes | No | Server action derives user/group/exam from context. |
| `/study-timer` | Active group member | `requireMembership` | Gap before Sprint 10 fix | Current user's study session form and subjects/topics | Yes | No | Server action derives user/group/exam from context. |
| `/study-logs` | Active group member | `requireMembership` | Gap before Sprint 10 fix | Current user's study sessions and notes | Yes | No | Notes are private to owner/admin by RLS. |
| `/practice` | Active group member | `requireMembership` | Gap before Sprint 10 fix | Available published question counts | Yes | No | Starts drills from active group/exam. |
| `/practice/session` | Active group member | `requireMembership`; save action requires membership | Gap before Sprint 10 fix | Published question text, choices, rationale after answer | Yes | No | Saves attempts for current user only. |
| `/missed-questions` | Active group member | `requireMembership` | Gap before Sprint 10 fix | Current user's missed question history | Yes | No | Cross-user attempts blocked by query and RLS. |
| `/weak-areas` | Active group member | `requireMembership` | Gap before Sprint 10 fix | Current user's weak area snapshot | Yes | No | Reviewer must not see other reviewers' weak areas. |
| `/analytics` | Active group member | `requireMembership` | Gap before Sprint 10 fix | Current user's subject/topic analytics and external drill summary | Yes | No | Reviewer-scoped analytics only. |
| `/external-drills` | Active group member | `requireMembership`; actions require membership | Gap before Sprint 10 fix | Current user's external drill scores and notes | Yes | No | No upload/OCR/file storage. |
| `/external-drills/new` | Active group member | `requireMembership`; create action requires membership | Gap before Sprint 10 fix | External drill entry form | Yes | No | Server derives user/group/exam from context. |
| `/external-drills/[logId]` | Active group member | `requireMembership` | Gap before Sprint 10 fix | Current user's selected drill details and notes | Yes | No | Query filters by `id`, `user_id`, group, and exam. |
| `/external-drills/[logId]/edit` | Active group member | `requireMembership`; update/delete actions require membership | Gap before Sprint 10 fix | Current user's drill edit form | Yes | No | Query filters by `id`, `user_id`, group, and exam. |
| `/mock-exams` | Active group member | `requireMembership`; actions require membership | Not in protected prefix or matcher before Sprint 10 fix | Published mocks and current user's attempts | Yes | No | Needs middleware prefix added. |
| `/mock-exams/[attemptId]/take` | Active group member | `requireMembership`; submit action requires membership | Not in protected prefix or matcher before Sprint 10 fix | Current user's in-progress attempt and published questions | Yes | No | Attempt query includes current user and active context. |
| `/mock-exams/[attemptId]/results` | Active group member | `requireMembership` | Not in protected prefix or matcher before Sprint 10 fix | Current user's submitted attempt results | Yes | No | Attempt query includes current user and active context. |
| `/mock-exams/[attemptId]/review` | Active group member | `requireMembership` | Not in protected prefix or matcher before Sprint 10 fix | Current user's answer review and rationales | Yes | No | Attempt query includes current user and active context. |
| `/readiness` | Active group member | `requireMembership` | Covered | Current user's readiness score, components, subject breakdown, recommendations | Yes | No | Disclaimer states estimate does not guarantee board exam results. |
| `/group-progress` | Active group member | `requireMembership` | Covered | Aggregate group progress, active goals, published announcements | Yes | No | Does not show individual readiness, weak areas, notes, or low-performer rankings. |
| `/submit-question` | Active group reviewer | `requireMembership`; action requires membership | Gap before Sprint 10 fix | Reviewer question submission form and own submitted questions | Yes | No | Hidden from admin nav, but server guard allows active members. |
| `/onboarding` | Authenticated user without membership or changing setup | `requireCurrentUser` | Covered | Invite-code onboarding form | Yes | No | Logged-out users redirect to `/login`. |

## Admin Routes

| Route | Intended access | Server-side guard | Middleware coverage | Sensitive data shown | Reviewer allowed | Admin-only | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/admin` | Active group admin or super_admin | `requireMembership` plus role check | Covered | Admin hub only | No | Yes | Reviewers redirect to `/dashboard`. |
| `/admin/questions` | Active group admin or super_admin | `requireAdminContext`; actions require admin | Covered | Group question bank, reports, statuses | No | Yes | Admin can view reviewer submissions for active group/exam. |
| `/admin/questions/new` | Active group admin or super_admin | `requireAdminContext`; create action requires admin | Covered | Question authoring form | No | Yes | Question context is validated server-side. |
| `/admin/questions/[questionId]/edit` | Active group admin or super_admin | `requireAdminContext`; update action requires admin | Covered | Question edit form and choices | No | Yes | Query filters by active group/exam. |
| `/admin/subjects` | Active group admin or super_admin | `requireAdminContext`; action requires admin | Covered | Subject weights and topic list | No | Yes | Generic for future exam tracks. |
| `/admin/topics` | Active group admin or super_admin | `requireAdminContext`; actions require admin | Covered | Topic management | No | Yes | Subject context is verified before create/update. |
| `/admin/mock-exams` | Active group admin or super_admin | `requireAdminContext`; actions require admin | Covered | Mock exam drafts, published exams, item counts | No | Yes | Reviewer attempts are not shown here. |
| `/admin/mock-exams/new` | Active group admin or super_admin | `requireAdminContext`; create action requires admin | Covered | Mock exam builder | No | Yes | Uses active group/exam question pool. |
| `/admin/mock-exams/[mockExamId]/edit` | Active group admin or super_admin | `requireAdminContext`; update/publish/archive actions require admin | Covered | Mock exam edit and selected items | No | Yes | Query filters by active group/exam. |
| `/admin/group-progress` | Active group admin or super_admin | `requireAdminContext` | Covered | User-level activity summaries, average latest readiness, weak signals | No | Yes | Does not show private study notes, external drill notes, or missed-question details. |
| `/admin/group-goals` | Active group admin or super_admin | `requireAdminContext`; actions require admin | Covered | Group goals and aggregate progress | No | Yes | Implemented in Sprint 9. |
| `/admin/announcements` | Active group admin or super_admin | `requireAdminContext`; actions require admin | Covered | Group announcements, including drafts and admin-only announcements | No | Yes | Implemented in Sprint 9. |

## Route Protection TODOs

- Align `src/proxy.ts` matcher with every protected route family listed in `src/lib/supabase/proxy.ts`.
- Add `/mock-exams` to `protectedPrefixes` and `src/proxy.ts` matcher.
- Keep server-side guards in place after middleware alignment.
- Continue relying on Supabase RLS for row-level isolation.
