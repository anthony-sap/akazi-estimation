# Slice 22: Create Admin Dashboard

## Goal
Provide an admin-only dashboard that displays aggregate system metrics (project counts, version counts, recent user actions) and offers quick links to audit logs and rate-limit stats for operational monitoring.

## Implementation Steps
1. **API Endpoint – `GET /api/admin/metrics`**
   * Returns JSON:
     ```json
     {
       "projectCount": 42,
       "estimateCount": 138,
       "userCount": 27,
       "latestActions": [
         { "id":"log_1","action":"PROJECT_CREATED","user":"alice","ts":"2025-07-21T01:00:00Z" }
       ]
     }
     ```
   * Aggregates counts via Prisma; latestActions from `audit_logs` (limit 10).
   * Requires `role=admin`.

2. **Admin Dashboard Page – `/admin`**
   * Server component fetches metrics; renders `MetricCard` components.
   * Links:
     * “View Audit Logs” → `/admin/logs`
     * “Rate-Limit Stats” → `/admin/rate-limits`

3. **MetricCard Component – `components/admin/MetricCard.tsx`**
   * Props `{ label, value, icon }`.

4. **Route Guard – `middleware/adminGuard.ts`**
   * Redirect non-admin users to `/403`.

## Rules & Flow
| Rule | Description | Constraints | Failure / Retry | Security |
|------|-------------|-------------|-----------------|----------|
| R1 | Admin role required | `role=admin` from Kinde | 403 FORBIDDEN | Rate limit 30 req/min |
| R2 | Metrics cache | Response cached 60 s in-memory | Stale data acceptable | N/A |
| R3 | Latest actions limit | 10 rows, tenant scoped | N/A | DB RLS |
| R4 | Perf target | Metrics API <200 ms | Log warn if slower | N/A |
| R5 | Accessibility | Dashboard cards contrast ratio ≥4.5:1 | Fail Lighthouse a11y if lower | N/A |

## Acceptance Criteria
* Visiting `/admin` as admin shows metric cards with project, estimate, user counts, latest actions list.
* Non-admin redirected to `/403`.
* Metrics API responds <200 ms in performance test.
* Lighthouse a11y score ≥90 for admin page.
* Jest tests mock metrics API and render dashboard.
* Cypress admin flow navigates to dashboard, verifies counts, clicks audit log link.


**Module:** Administration

**Description:** Build admin view showing all projects, versions, and system metrics.

**Dependencies:** ["Log User Actions", "List Projects"]

**User Stories:**
- As an admin I can monitor system usage
  - Acceptance Criteria: displays project counts, version counts, and user activity
