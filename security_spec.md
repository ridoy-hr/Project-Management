# Security Specification

## 1. Data Invariants
- `projects`: Each project must have a valid `id`, `name` (length <= 100), and `color` string.
- `tasks`: Each task must contain `id`, `title` (length <= 256), valid `status` in ['To Do', 'In Progress', 'Review', 'Done'], valid `priority` in ['Low', 'Medium', 'High'], and `projectIds` array.
- `memories`: Each AI memory note must have a valid `id`, `title` (length <= 200), `category` in ['workflow', 'insight', 'decision', 'recommendation'], `content` (length <= 10000), and `createdAt`.

## 2. The Dirty Dozen Payloads
1. Project with empty name.
2. Project with 5000-character name (Denial of Wallet).
3. Task with invalid status ('InvalidStatus').
4. Task with invalid priority ('Extreme').
5. Task without projectIds array.
6. Memory note with invalid category ('random').
7. Memory note without createdAt.
8. Injection attack with invalid document ID ('../../root').
9. Unauthenticated project write when user is null.
10. Task with non-array projectIds.
11. Memory note with oversized content (>20000 chars).
12. Project with invalid fields.
