# Slice 19: Handle Version Loading Errors

## Goal
Detect and gracefully handle failures when loading a selected estimate version (network failures, 404 not found, tenant mismatch), providing retry and clear error messaging without crashing the estimation workspace.

## Implementation Steps
1. **Error Boundary – `components/estimate/VersionLoadErrorBoundary.tsx`**
   * Wraps `<EstimateWorkspace/>`.
   * Shows fallback UI with “Retry” and “Back to Latest” buttons.

2. **Version Fetch Hook – `hooks/useVersion.ts`**
   * **Signature**: `useVersion(projectId: string, estimateId: string)`
   * Handles fetching with React Query, timeout 10 s, retry 2×.
   * Throws structured `VersionError`.

3. **API Error Codes (`GET /api/estimates/[id]`)**
   * `404 NOT_FOUND` – version id not in project.
   * `403 FORBIDDEN` – cross-tenant.
   * `500 DB_ERROR` – server failure.

4. **Telemetry & Toast**
   * Log `version_load_failed` event with code.
   * Toast “Version could not be loaded (NOT_FOUND).”

## Rules & Flow
| Rule | Description | Error Code | Retry | Notes |
|------|-------------|------------|-------|-------|
| R1 | Version must belong to project | 404 NOT_FOUND | User “Back to Latest” | N/A |
| R2 | Tenant isolation | 403 FORBIDDEN | No retry | N/A |
| R3 | Network fail | fetch error | Auto 2× | Then show fallback |
| R4 | DB error | 500 DB_ERROR | Auto 2× | Then fallback |
| R5 | Timeout | >10 s | Auto 2× | Abort fetch |

## Acceptance Criteria
* Selecting invalid version shows VersionLoadErrorBoundary with retry/back buttons.
* 404 shows toast “Version not found” and Back to Latest navigates correctly.
* 403 redirects to `/403` error page.
* Network unplug sim shows auto-retry then error UI.
* Jest tests mock 404/500 and verify fallback renders.
* Cypress test selects deleted version and confirms error UI path.


**Module:** Error Handling

**Description:** Gracefully handle and recover from version loading failures.

**Dependencies:** ["Manage Estimate Versions"]

**User Stories:**
- As a user I understand what went wrong when errors occur
  - Acceptance Criteria: displays clear, actionable error messages
