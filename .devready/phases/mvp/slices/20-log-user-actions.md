# Slice 20: Log User Actions

## Goal
Record all significant user actions (create, edit, save, switch version) into an audit log for troubleshooting and analytics, storing logs in database and forwarding to external logging provider.

## Implementation Steps
1. **Log Service – `lib/audit/logAction.ts`**
   * **Signature**:  
     `logAction(userId: string, tenantId: string, action: string, payload: Json): Promise<void>`
   * Inserts row into `audit_logs` table and publishes to `pino-http` logger.

2. **Database Table – `audit_logs` (migration)**
   ```prisma
   model AuditLog {
     id         String   @id @default(cuid())
     tenantId   String
     userId     String
     action     String
     payload    Json
     createdAt  DateTime @default(now())
     @@index([tenantId, createdAt])
   }
   ```

3. **Action Integration Points**
   * After Project create (slice 05) → `PROJECT_CREATED`.
   * After Estimate save (slice 16) → `ESTIMATE_SAVED`.
   * After Rate edit, Task edit, Margin edit (slices 11–13) → `ESTIMATE_EDITED`.
   * After Version switch (slice 18) → `VERSION_VIEWED`.

4. **API Route – `GET /api/audit` (admin only)**
   * Query params `tenantId`, `from`, `to`.
   * Requires role `admin`. Returns paginated JSON.

## Rules & Flow
| Rule | Description | Constraints | Failure / Retry | Security |
|------|-------------|-------------|-----------------|----------|
| R1 | Log write must not block UX | Fire-and-forget (`await logAction` without impacting response) | Retry once on failure | N/A |
| R2 | Payload size | ≤5 KB JSON | Truncate if larger | N/A |
| R3 | Admin access | `role=admin` header verified | 403 FORBIDDEN | Rate limit 30 req/min |
| R4 | Tenant isolation | Admin can only view own tenant logs | 403 if mismatch | DB RLS |
| R5 | Indexing | `tenantId, createdAt` index for queries | Migration includes index | N/A |

## Acceptance Criteria
* Actions listed fire `logAction` with correct action string and payload.
* `audit_logs` table contains row with tenantId, userId, timestamp.
* External pino logger receives structured log entry.
* `/api/audit` returns logs filtered by tenant and date range; non-admin returns 403.
* Jest tests mock logAction and verify calls from service functions.
* Cypress admin flow fetches logs and displays entries.


**Module:** Observability

**Description:** Record all user actions for audit, troubleshooting, and analytics.

**Dependencies:** ["Parse CSV Upload", "Save Estimate Version", "Edit Rate Card", "Edit Task Hours", "Edit Margin"]

**User Stories:**
- As an admin I can track user activity
  - Acceptance Criteria: logs all create, edit, and save actions with timestamps and user IDs
