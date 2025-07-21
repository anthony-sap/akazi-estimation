# Slice 23: Support Admin Operations

## Goal
Enable administrators to impersonate any tenant project for troubleshooting, rerun failed operations (CSV parse, save version), and view diagnostic metadata—all within secure, audited constraints.

## Implementation Steps
1. **Impersonation API – `POST /api/admin/impersonate`**
   * Body `{ tenantId: string }`
   * Sets signed HTTP-only cookie `impersonateTenant={tenantId}` (expires 30 min).
   * Only `role=admin` allowed.  Returns 204.

2. **Admin Toolbar Component – `components/admin/AdminToolbar.tsx`**
   * Visible when `role=admin`.
   * Tenant switcher dropdown (lists tenant names), “Stop Impersonation” button.
   * Shows banner “Impersonating ACME Corp”.

3. **Operation Retry Endpoint – `POST /api/admin/retry-operation`**
   * Body `{ operationId: string }`
   * Fetches failed op from `audit_logs` payload → re-executes corresponding service.
   * Logs `ADMIN_RETRY` action.

4. **Middleware Update**
   * If `impersonateTenant` cookie present AND user is admin, override `x-tenant-id` for request.

## Rules & Flow
| Rule | Description | Constraints | Failure | Security |
|------|-------------|-------------|---------|----------|
| R1 | Admin only | `role=admin` | 403 | Rate-limit 30/min |
| R2 | Impersonation TTL | 30 min cookie | Auto-expires | Cookie signed |
| R3 | Audit | All admin ops logged (`ADMIN_IMPERSONATE`,`ADMIN_RETRY`) | Always | Tenant & user logged |
| R4 | Retry safety | Only idempotent ops (parse, save) | 400 if non-retryable | N/A |
| R5 | Tenant isolation bypass only via impersonate | Other users unaffected | N/A | DB RLS still filters by overridden tenant |

## Acceptance Criteria
* Admin toolbar appears for admin and lists tenants; selecting tenant sets banner and filters data to that tenant.
* Cookie expires after 30 min or when “Stop Impersonation” clicked.
* Non-admin calling impersonate returns 403.
* Retry operation endpoint re-executes failed CSV parse and logs success.
* All admin actions recorded in `audit_logs` with correct codes.
* Jest tests mock impersonation cookie logic.
* Cypress test impersonates Tenant B, views their projects, stops impersonation then sees own tenant projects again.


**Module:** Administration

**Description:** Allow admins to view any project, troubleshoot errors, and retry operations.

**Dependencies:** ["Create Admin Dashboard"]

**User Stories:**
- As an admin I can help users with issues
  - Acceptance Criteria: provides admin override for access, retry, and diagnostics
