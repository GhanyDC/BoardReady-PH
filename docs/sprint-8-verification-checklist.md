# Sprint 8 Verification Checklist

Use this checklist against a live Supabase project with at least one reviewer, one admin, an active group, an active exam program, active subjects, published questions, practice attempts, mock exam attempts, study preferences/sessions, weak areas, and external drill logs where possible.

## Database and RLS

- [ ] Migrations apply cleanly.
- [ ] `readiness_snapshots` exists.
- [ ] `readiness_snapshots` has `user_id`, `group_id`, and `exam_program_id`.
- [ ] `overall_readiness` and component columns are numeric and constrained to 0-100.
- [ ] `subject_breakdown` is stored as JSONB.
- [ ] `recommendation_summary` is stored as JSONB.
- [ ] RLS is enabled on `readiness_snapshots`.
- [ ] Reviewer can read only their own readiness snapshots.
- [ ] Reviewer cannot read another user's readiness snapshots.
- [ ] Reviewer cannot directly insert readiness snapshots through table access.
- [ ] Reviewer cannot update readiness snapshots.
- [ ] Reviewer cannot delete readiness snapshots.
- [ ] Snapshot refresh/save uses `save_readiness_snapshot`.
- [ ] Snapshot save rejects a `target_user_id` that is not `auth.uid()`.
- [ ] Snapshot save rejects inactive or cross-group/exam context.
- [ ] Admin group-level visibility is limited to active group/exam policies.
- [ ] Schema remains generic for future exam tracks.

## Scoring Engine

- [ ] Scoring uses active group and active exam program.
- [ ] Scoring uses subject weights from the database.
- [ ] Scoring does not hardcode Psychometrician subjects.
- [ ] Overall score uses the component weights: practice 35%, mock exam 35%, weak area 15%, study consistency 10%, external drill 5%.
- [ ] Practice component uses published-question practice attempts only.
- [ ] Practice component uses weighted subject accuracy.
- [ ] Practice component shows insufficient data when attempts are below threshold.
- [ ] Mock exam component uses submitted mock exam results.
- [ ] Mock exam component prefers a recent full mock when available.
- [ ] Mock exam component shows insufficient data when no submitted mock exists.
- [ ] Weak area component penalizes critical/high/medium weak topics.
- [ ] Watchlist weak areas do not heavily penalize readiness.
- [ ] Study consistency component compares current week study time to weekly goal.
- [ ] Study consistency component caps at 100.
- [ ] Study consistency component shows insufficient data when no weekly goal exists.
- [ ] External drill component uses self-reported external drill average.
- [ ] External drill component stays separate from practice accuracy.
- [ ] Insufficient data lowers confidence and appears as a warning.
- [ ] Readiness labels follow the expected ranges.
- [ ] Any subject below 60 forces high-risk labeling.
- [ ] No score text guarantees passing.

## Readiness Page

- [ ] Reviewer can open `/readiness`.
- [ ] Unauthenticated user is redirected through existing auth behavior.
- [ ] User without active group is redirected through onboarding behavior.
- [ ] Overall readiness score appears.
- [ ] Readiness label appears.
- [ ] Disclaimer appears: "This is an internal study estimate and does not guarantee board exam results."
- [ ] Component breakdown appears.
- [ ] Component weights are visible.
- [ ] Insufficient data warnings appear when data is missing.
- [ ] Latest calculated date appears.
- [ ] Improve links appear for Practice, Mock Exams, Weak Areas, Study Timer, and External Drills.
- [ ] Data is scoped to active user/group/exam.
- [ ] A readiness snapshot is saved after calculation.

## Subject Breakdown

- [ ] Subject readiness breakdown appears on `/readiness`.
- [ ] Each subject shows subject name.
- [ ] Each subject shows database subject weight.
- [ ] Each subject shows practice accuracy and attempt count.
- [ ] Each subject shows mock exam accuracy and item count when available.
- [ ] Each subject shows weak topic count.
- [ ] Each subject shows external drill average when available.
- [ ] Each subject shows readiness estimate.
- [ ] Each subject shows priority: urgent, high, medium, or maintenance.
- [ ] Subjects with low data show insufficient data messaging.
- [ ] Weak subjects are visibly identifiable.

## Recommendations

- [ ] Recommendations are generated from actual user data.
- [ ] Critical weak areas produce an urgent recommendation.
- [ ] Low practice volume produces a practice recommendation.
- [ ] Low subject practice accuracy produces a focused drill recommendation.
- [ ] No mock exam produces a mock exam recommendation.
- [ ] Low mock subject accuracy produces a mock review recommendation.
- [ ] Weekly study goal deficit produces a study timer recommendation.
- [ ] No weekly study goal produces a study habits recommendation.
- [ ] No external drills produces an optional external drill logging recommendation.
- [ ] Recommendations link to relevant modules.
- [ ] Recommendations are generic for future exam tracks.
- [ ] Recommendations do not use AI.
- [ ] Recommendations do not include medical or psychological advice.
- [ ] Recommendations do not guarantee passing.

## Dashboard and Navigation

- [ ] Dashboard shows compact readiness score.
- [ ] Dashboard shows readiness label.
- [ ] Dashboard shows top recommendation.
- [ ] Dashboard shows top weak subject.
- [ ] Dashboard links to `/readiness`.
- [ ] Dashboard includes study estimate disclaimer text.
- [ ] Existing study time cards still work.
- [ ] Existing practice activity card still works.
- [ ] Existing learning progress and weak-area card still works.
- [ ] Existing external drill card still works.
- [ ] Existing mock exam card still works.
- [ ] Navigation shows Readiness for active group members.
- [ ] `/readiness` protected route behavior works.

## Regression Checks

- [ ] Auth still works.
- [ ] Onboarding still works.
- [ ] Active group context still works.
- [ ] Active exam track context still works.
- [ ] Study timer still works.
- [ ] Study logs still work.
- [ ] Study habits still work.
- [ ] Question bank still works.
- [ ] Reviewer question submission still works.
- [ ] Practice drills still work.
- [ ] Missed questions still work.
- [ ] Weak areas still work.
- [ ] Analytics still works.
- [ ] External drill logs still work.
- [ ] Mock exam list/start/take/submit/results/review still works.
- [ ] Admin access still works.
- [ ] Admin mock builder still works.

## Scope and Build Checks

- [ ] `npm run lint` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] No AI features were implemented.
- [ ] No payment features were implemented.
- [ ] No OCR features were implemented.
- [ ] No file/image upload features were implemented.
- [ ] No scan/upload fields were added for hardcopy drills.
- [ ] No copied review-center questions are stored.
- [ ] No public multi-exam marketplace was implemented.
- [ ] External drill legal boundary remains unchanged.
- [ ] BoardReady PH remains generic for future exam tracks.
- [ ] Readiness score is presented only as an internal study estimate.
