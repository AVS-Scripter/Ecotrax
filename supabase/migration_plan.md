# Supabase Migration Plan for Ecotrax

## Purpose
This plan converts the existing Firestore community model into a Supabase relational schema with zero data loss, strong transactional consistency, and RLS-based authorization.

## Table Mapping

| Firestore path | Supabase table | Notes |
|---|---|---|
| `users/{userId}` | `users` | `id` becomes UUID/Supabase auth UID; preserve `name`, `email`, `rank`, `points`, `createdAt`.
| `communities/{communityId}` | `communities` | preserve `name`, `icon`, `createdBy`, `isDeleted`, `memberCount`, `createdAt`.
| `communities/{communityId}/members/{userId}` | `memberships` | normalized join table with `role`, `displayName`, `joinedAt`.
| `invites/{inviteId}` | `invites` | `code` as primary key, preserve `communityId`, `communityName`, `createdBy`, `maxUses`, `usedCount`, `expiresAt`, `createdAt`.
| `reports/{reportId}` | `reports` | preserve all report fields and link to `community_id` + `user_id`.
| `global_stats/singleton_stats` | `global_stats` | preserve counters and monthly breakdown.

## Key Conversion Rules

- Subcollections become relational join tables.
- Array-based values like `hasJoinedCommunity` are derived using `memberships`.
- `created_by` references the `users` table and is enforced with foreign keys.
- `member_count` is maintained in `communities` and validated by transaction logic.
- Admin existence is enforced by a trigger on `memberships`.

## Transaction Logic

1. `create_community(...)`
   - Create `communities` row
   - Add creator to `memberships` as `admin`
   - Create a default invite row
   - Return `community_id`

2. `join_via_invite(...)`
   - Validate invite existence, expiry, and max uses
   - Verify the community exists and is not deleted
   - Prevent duplicate membership and cross-community ownership
   - Increment `invites.used_count`
   - Increment `communities.member_count`
   - Insert `memberships`

3. `leave_community(...)`
   - Check membership exists
   - Prevent leaving if user is the last admin
   - Delete membership
   - Decrement `communities.member_count`

4. `soft_delete_community(...)`
   - Ensure caller is admin
   - Set `communities.is_deleted = TRUE`
   - Leave cleanup of dependent rows to cascade rules and async jobs if required

## RLS Policy Summary

- `users`: read/update own row only
- `communities`: members can read, admins can update, authenticated users can create
- `memberships`: members can read; insert allowed only through server-controlled flow; admins can update/delete
- `invites`: authenticated can read; admins can create; authenticated can update for usage counting
- `reports`: members can read/create; owner/moderator/admin can update
- `global_stats`: authenticated read/write for analytics increments

## Migration Steps

1. Export Firestore data using Admin SDK or export tool.
2. Normalize exported data:
   - Flatten `communities/*/members/*` into `memberships` rows.
   - Convert Firestore timestamps into `TIMESTAMPTZ`.
   - Keep `inviteId` as `code` and preserve all invite metadata.
   - Map `userId` and `communityId` to UUIDs and validate auth user mappings.
3. Create Supabase schema from `supabase/schema.sql`.
4. Disable RLS temporarily for import if needed.
5. Load data in this order:
   1. `users`
   2. `communities`
   3. `memberships`
   4. `invites`
   5. `reports`
   6. `global_stats`
6. Re-enable RLS and verify policies with representative queries.
7. Run integrity checks:
   - row counts for each collection/table
   - membership counts vs `communities.member_count`
   - no community without an admin
   - valid invite usage and expiry values

## Verification Checklist

- `SELECT COUNT(*) FROM users;`
- `SELECT COUNT(*) FROM communities WHERE NOT is_deleted;`
- `SELECT COUNT(*) FROM memberships;`
- `SELECT community_id, COUNT(*) FROM memberships GROUP BY community_id;`
- `SELECT * FROM communities WHERE member_count <> (SELECT COUNT(*) FROM memberships m WHERE m.community_id = communities.id);`
- `SELECT community_id FROM memberships GROUP BY community_id HAVING SUM((role = 'admin')::INT) = 0;`
- `SELECT * FROM invites WHERE used_count < 0 OR (max_uses IS NOT NULL AND used_count > max_uses);`

## Tradeoffs

- Using relational tables reduces redundancy and eliminates Firestore subcollection complexity.
- Triggers enforce admin preservation, which is stricter than client-side role checks.
- RLS policies replace Firestore security rules and remove client-side trust.
- The schema is intentionally normalized, so joins are required for derived values like `joinedCommunities`, but indexes and a dedicated view minimize N+1 query risk.
