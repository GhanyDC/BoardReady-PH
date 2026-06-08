# Supabase Verification Checklist

Use this checklist after applying all migrations to a fresh or existing Supabase project.

## Fresh Migration Setup

- Apply every file in `supabase/migrations` in filename order.
- Confirm RLS is enabled on `profiles`, `exam_programs`, `groups`, `group_members`, `subjects`, and `topics`.
- Confirm `Psychometrician Licensure Exam` exists in `exam_programs`.
- Confirm `BoardReady PH Founding Review Group` exists in `groups`.
- Confirm the founding group uses invite code `BOARDREADY-PH`.
- Confirm `PSYPASS-FOUNDING` is not expected to work unless it was intentionally preserved in a separate environment.
- Confirm the four seeded Psychometrician Licensure Exam subjects exist and point to the same `exam_program_id` as the founding group.

## Signup And Onboarding

- Sign up as a new user.
- Complete onboarding with invite code `BOARDREADY-PH`.
- Confirm a `profiles` row exists for the new user.
- Confirm `profiles.current_group_id` is set to the joined group.
- Confirm a `group_members` row exists for the joined group and user.
- Confirm the joined group points to an active exam program.

## Dashboard Context

- Log in as the onboarded user.
- Open `/dashboard`.
- Confirm the dashboard displays `BoardReady PH`.
- Confirm the active group name is shown.
- Confirm the active exam track name is shown.
- Confirm the role shown matches the user's role in the active group.
- Clear or invalidate `profiles.current_group_id`, then confirm the dashboard falls back to a valid membership or shows the join-group message when no membership exists.

## Admin Access

- With role `reviewer`, confirm `/admin` redirects away or blocks access.
- Promote the user's active group membership to `admin`, then confirm `/admin` loads.
- Create or promote a `super_admin`, then confirm `/admin` loads.
- For a user with multiple memberships, confirm `/admin` access follows the active group role unless the user has global `super_admin`.

## RLS Checks

- Confirm a user cannot select another user's `profiles` row.
- Confirm a user cannot select groups they do not belong to.
- Confirm a user can select only their own `group_members` rows unless they are an admin/super_admin with policy access.
- Confirm a group member can read subjects for their active group's exam program.
- Confirm a group member cannot read subjects for a group/exam program they do not belong to.
- Confirm a group member can read topics only through subjects connected to their group/exam program.
- Confirm an admin can create, update, and delete subjects/topics for their group/exam program.
- Confirm `super_admin` can manage `exam_programs`.

## Active Group Helper

- Call `switchCurrentGroup(groupId)` for a group the user belongs to and confirm `profiles.current_group_id` updates.
- Call `switchCurrentGroup(groupId)` for a group the user does not belong to and confirm it is rejected.
- Confirm the helper returns the active group, active exam program, and active membership.
