# BoardReady PH

Modular exam-prep and board-readiness platform for Philippine board, licensure, and major exam takers. The first supported exam track is the Psychometrician Licensure Exam.

## Sprint 1 Foundation

- Email/password signup and login through Supabase Auth
- Supabase SSR clients using `@supabase/ssr`
- Next.js `proxy.ts` session refresh and protected route redirects
- Invite-only onboarding with full name and group access code
- Role-aware dashboard/admin navigation
- Initial RLS-protected tables: `profiles`, `exam_programs`, `groups`, `group_members`, `subjects`, `topics`
- Seeded first exam program and four Psychometrician Licensure Exam subjects

## Environment

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Supabase Setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and fill in the project URL and anon key.
3. Apply all SQL migrations in order from `supabase/migrations`.
4. For fast local testing, disable email confirmation in Supabase Auth settings. If email confirmation stays enabled, set the site URL to your app URL and add `/auth/callback` as an allowed redirect path.
5. Use the seeded invite code `BOARDREADY-PH` during onboarding.
6. To test `/admin`, promote a joined user after onboarding:

```sql
update public.group_members
set role = 'admin'
where user_id = 'USER_UUID_FROM_AUTH_USERS';
```

Use `super_admin` instead of `admin` to test global admin behavior and exam-program management policies.

## Exam Track Architecture

`exam_programs` is the root exam-track table. Groups and subjects now reference an exam program. Topics remain connected through subjects. Future question-bank, mock-exam, and external-drill tables should include exam-program references as described in `docs/schema-notes.md`.

## Content Boundary

BoardReady PH must not upload, store, scan, OCR, or host review center hardcopy drills. Future external drill logging should store only score, subject, topic, total items, mistakes, and notes.
