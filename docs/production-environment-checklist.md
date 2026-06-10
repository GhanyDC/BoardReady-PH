# Production Environment Checklist

Use this checklist before deploying BoardReady PH to a production Supabase and Vercel environment.

## Supabase Project

- [ ] Production Supabase project is created.
- [ ] Production project URL is recorded in the deployment notes.
- [ ] All migrations in `supabase/migrations` are applied in filename order.
- [ ] Migration application is verified from a fresh database where possible.
- [ ] RLS is enabled on all app tables.
- [ ] Seed data exists for the intended first exam program and founding group.
- [ ] Current invite code is tested.
- [ ] Auth email confirmation setting is intentional.
- [ ] Auth site URL points to the production app URL.
- [ ] Auth redirect URLs include `/auth/callback`.
- [ ] Email templates and sender settings are reviewed.
- [ ] Backup/export plan is documented.
- [ ] Database backups are enabled if available for the selected Supabase plan.
- [ ] Production data retention expectations are documented.
- [ ] Service role key is not used in browser code.
- [ ] Service role key is not committed.
- [ ] Anon key is the only Supabase key exposed to client-side code.
- [ ] Storage buckets are not enabled for hardcopy drills.
- [ ] No upload, OCR, scan, or file-storage feature is enabled.

## Supabase Security Verification

- [ ] Run `docs/supabase-rls-verification-suite.md`.
- [ ] Use `supabase/tests/rls-verification.sql` as the manual SQL template.
- [ ] Confirm reviewer A cannot read reviewer B private rows.
- [ ] Confirm reviewer A cannot read group 2 private rows.
- [ ] Confirm reviewer cannot access admin-only tables/actions.
- [ ] Confirm admin 1 cannot manage group 2 content.
- [ ] Confirm group progress RPC returns aggregate-only data.
- [ ] Confirm readiness snapshots are not visible to other reviewers.
- [ ] Confirm external drill private notes are not visible to other reviewers.
- [ ] Confirm direct writes to derived tables are blocked where expected.

## Environment Variables

- [ ] `.env.local` is not committed.
- [ ] `.env*` files remain ignored by Git.
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set in Vercel production.
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set in Vercel production.
- [ ] No service role key is configured as a public variable.
- [ ] Any future server-only secret uses a non-public variable name.
- [ ] Preview and production environment variables are separated intentionally.
- [ ] Local development `.env.local` points to non-production unless deliberately testing production.

## Vercel Deployment

- [ ] Vercel project is connected to the repository.
- [ ] Production branch is selected.
- [ ] Build command is `npm run build`.
- [ ] Install command is the default or `npm install`.
- [ ] Framework preset recognizes Next.js.
- [ ] Environment variables are configured for production.
- [ ] Preview deployments are enabled or disabled intentionally.
- [ ] Domain is configured if ready.
- [ ] HTTPS is active for the deployment URL.
- [ ] First production build completes successfully.
- [ ] Vercel build logs contain no secret values.

## App Smoke Checks

- [ ] Open the production URL.
- [ ] Confirm BoardReady PH branding appears.
- [ ] Sign up as a reviewer.
- [ ] Complete onboarding with the production invite code.
- [ ] Confirm dashboard loads.
- [ ] Confirm active group and exam track display correctly.
- [ ] Confirm study habits save.
- [ ] Confirm study timer saves a session.
- [ ] Confirm practice drill can be started when questions exist.
- [ ] Confirm external drill log can be created without upload/OCR fields.
- [ ] Confirm mock exams list loads.
- [ ] Confirm readiness page displays disclaimer.
- [ ] Confirm group progress is aggregate-only for reviewers.
- [ ] Promote one test account to admin.
- [ ] Confirm admin routes load for admin.
- [ ] Confirm admin routes block reviewer accounts.

## Route Protection Checks

- [ ] Logged-out `/dashboard` redirects to `/login`.
- [ ] Logged-out `/study-habits` redirects to `/login`.
- [ ] Logged-out `/study-timer` redirects to `/login`.
- [ ] Logged-out `/study-logs` redirects to `/login`.
- [ ] Logged-out `/practice` redirects to `/login`.
- [ ] Logged-out `/missed-questions` redirects to `/login`.
- [ ] Logged-out `/weak-areas` redirects to `/login`.
- [ ] Logged-out `/analytics` redirects to `/login`.
- [ ] Logged-out `/external-drills` redirects to `/login`.
- [ ] Logged-out `/mock-exams` redirects to `/login`.
- [ ] Logged-out `/readiness` redirects to `/login`.
- [ ] Logged-out `/group-progress` redirects to `/login`.
- [ ] Logged-out `/submit-question` redirects to `/login`.
- [ ] Logged-out `/admin` redirects to `/login`.
- [ ] Reviewer `/admin` redirects to `/dashboard`.
- [ ] Reviewer `/admin/group-progress` redirects to `/dashboard`.

## Security Boundary Checks

- [ ] No AI feature is enabled.
- [ ] No payment feature is enabled.
- [ ] No OCR feature is enabled.
- [ ] No image/file upload feature is enabled.
- [ ] No scan/upload field exists for hardcopy drills.
- [ ] No copied review-center hardcopy content is stored.
- [ ] No public multi-exam marketplace is enabled.
- [ ] No guaranteed passing language appears.
- [ ] Readiness wording says internal study estimate.
- [ ] External drill copy says not to upload copyrighted materials.

## Operational Readiness

- [ ] Admin contact is documented for beta users.
- [ ] Known support channel is documented.
- [ ] Procedure exists for removing a beta tester from a group.
- [ ] Procedure exists for rotating the invite code if needed.
- [ ] Procedure exists for promoting/demoting admin users.
- [ ] Procedure exists for exporting production data if needed.
- [ ] Rollback process is documented.
- [ ] Last known good commit is recorded before deployment.
- [ ] Production deployment timestamp is recorded.
- [ ] Post-deploy smoke test owner is assigned.

## Final Production Sign-Off

- [ ] `npm run lint` passes locally before deployment.
- [ ] `npm run typecheck` passes locally before deployment.
- [ ] `npm run build` passes locally before deployment.
- [ ] Production build passes on Vercel.
- [ ] RLS verification suite is complete.
- [ ] Private beta checklist is complete for at least one reviewer and one admin.
- [ ] MVP regression checklist is complete.
- [ ] Product owner approves private beta launch.
