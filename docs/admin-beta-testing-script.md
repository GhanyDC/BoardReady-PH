# Admin Beta Testing Script

Use this script with an admin or super admin before a private beta session. It focuses on content setup, review workflow, and role boundaries.

Record the tester name, role, browser, device, group, exam track, date, and any issue links or screenshots.

## Preconditions

- Admin or super admin account exists.
- Reviewer account exists in the same group.
- Active group and active exam track are set for both accounts.
- Seeded subjects and topics are available.
- Test content is original demo content only.
- No review center hardcopy drill images, scans, OCR output, files, or copied copyrighted materials are used.

## Admin Dashboard

- [ ] Log in as admin.
- [ ] Open `/admin`.
- [ ] Confirm the page shows the active group and exam track.
- [ ] Confirm workflow cards appear for question bank, pending submissions, subjects/topics, mock exams, progress, goals, and announcements.
- [ ] Confirm counts reflect the active group and active exam track.
- [ ] Confirm the suggested review order is understandable.

Expected result: admin can see the content workflow for the active context only.

## Subject And Topic Setup

- [ ] Open `/admin/subjects`.
- [ ] Confirm the four seeded subjects are present with correct board weights.
- [ ] Confirm topic counts appear per subject.
- [ ] Create or edit a safe demo topic if needed.
- [ ] Open `/admin/topics`.
- [ ] Confirm topics are grouped under the correct subject.
- [ ] Confirm inactive subjects or topics are clearly labeled if present.

Expected result: admin can understand coverage by subject and manage topics without confusing inactive content for active content.

## Question Creation

- [ ] Open `/admin/questions/new`.
- [ ] Create a draft question with subject, topic, difficulty, Bloom level, source type, four choices, one correct answer, and rationale.
- [ ] Confirm helper text explains publishing requirements.
- [ ] Save as draft.
- [ ] Reopen the draft from `/admin/questions`.
- [ ] Publish the question only after all required fields are valid.

Expected result: incomplete content remains draft, and only complete verified content can be published.

## Reviewer Submission Review

- [ ] Log in as reviewer.
- [ ] Submit an original demo question from `/submit-question`.
- [ ] Log back in as admin.
- [ ] Open `/admin/questions`.
- [ ] Filter to pending review.
- [ ] Confirm the submitted question is labeled as reviewer-submitted.
- [ ] Review the choices and rationale.
- [ ] Move the item to published, needs revision, or rejected as appropriate.

Expected result: reviewer submissions do not publish automatically and require admin action.

## Question List Workflow

- [ ] Use each status filter: pending review, needs revision, draft, published, archived, and rejected.
- [ ] Confirm status counts match the visible list.
- [ ] Try valid status actions for draft, pending review, published, and archived questions.
- [ ] Confirm invalid publish attempts are rejected with a useful error.

Expected result: admins can triage content from the list without losing track of item status.

## Mock Exam Builder

- [ ] Open `/admin/mock-exams/new`.
- [ ] Confirm published verified question availability appears by subject.
- [ ] Try creating a mock exam distribution that exceeds available published questions.
- [ ] Confirm shortage warnings appear and submit is blocked.
- [ ] Create a valid draft mock exam using available published questions.
- [ ] Edit the draft and confirm saved item counts and availability are shown.

Expected result: mock exams can be planned only from available published verified questions in the active context.

## Reviewer Boundary Check

- [ ] Log in as reviewer.
- [ ] Try to open `/admin`.
- [ ] Try to open `/admin/questions`.
- [ ] Try to open `/admin/mock-exams`.

Expected result: reviewer is redirected away from admin routes and cannot access admin content.

## Content Safety Check

- [ ] Confirm no admin page asks for uploaded files.
- [ ] Confirm no admin page asks for images, scans, photos, OCR, or attachments.
- [ ] Confirm no page encourages copying review center hardcopy drills.
- [ ] Confirm no page claims BoardReady PH guarantees board exam results.

Expected result: content workflows stay within the private study-tool and legal guardrails.

## Admin Exit Criteria

- [ ] Admin can describe how to create, review, publish, archive, and reject questions.
- [ ] Admin can describe when a mock exam can be safely created.
- [ ] Admin can identify content that needs revision before publication.
- [ ] Admin confirms no private reviewer progress is exposed outside intended admin aggregate views.
- [ ] All issues are logged before proceeding to broader beta testing.
