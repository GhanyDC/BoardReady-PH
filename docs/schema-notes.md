# Future Schema Notes

BoardReady PH now uses `exam_programs` as the root exam-track entity. Future Sprint 2+ tables should keep this shape so new exam tracks can be added without restructuring.

## Questions

Future `questions` rows should include:

- `exam_program_id`
- `group_id`
- `subject_id`
- `topic_id`
- status fields such as `pending_review` and `published`

Only published questions should appear in drills and mock exams.

## Mock Exams

Future `mock_exams` rows should include:

- `exam_program_id`
- `group_id`
- exam metadata and publishing status

Mock exam items should reference published questions from the same exam program.

## External Drill Logs

Future `external_drill_logs` rows should include:

- `exam_program_id`
- `group_id`
- `user_id`
- `subject_id`
- `topic_id`
- score, total items, mistakes, and notes

Do not add image, file, scan, OCR, upload, or hosted-material columns for external hardcopy drills.
