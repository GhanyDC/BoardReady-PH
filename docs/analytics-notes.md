# Analytics Notes

BoardReady PH analytics are scoped to the active user, group, and exam program.
Sprint 5 analytics use existing practice `question_attempts` from published
questions only.

## Weak Areas Snapshot

The `weak_areas` table currently behaves as a topic learning-status snapshot.
It stores one row per user, group, exam program, and topic when that topic has
enough attempt data.

Despite the table name, it does not store only topics below 70% accuracy.
Rows can have any of these priority values:

- `critical`: accuracy below 50%
- `high`: accuracy from 50% to below 60%
- `medium`: accuracy from 60% to below 70%
- `watchlist`: accuracy from 70% to below 80%
- `cleared`: accuracy 80% or higher

Only `critical`, `high`, and `medium` are true weak areas. `watchlist` and
`cleared` rows are included so the dashboard can show continuity as a learner
moves from weak performance into stable performance.

`weak_areas` is derived data. Client code should not directly insert, update,
or delete rows. The supported write path is `refresh_user_weak_areas`, which
rebuilds the current user's snapshot for the active group and exam program.

TODO: If BoardReady PH expands analytics beyond the Sprint 5 shape, consider
renaming this table to `topic_learning_status` or `topic_mastery_snapshots`.
