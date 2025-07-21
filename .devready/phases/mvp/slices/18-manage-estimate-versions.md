# Slice 18: Manage Estimate Versions

## Goal
Provide a version selector UI and supporting API that lists, loads, and switches between all versions of an estimate, ensuring accurate data retrieval and state sync without full page reload.

## Implementation Steps
1. **API Endpoint – `GET /api/estimates/[projectId]/versions`**
   * Returns array `[ { id, version, createdAt, createdBy, note } ]` ordered desc.
   * Auth + tenant enforced.

2. **VersionDropdown Component – `components/estimate/VersionDropdown.tsx`**
   * Fetches versions via SWR; shows current version highlighted.
   * Selecting version triggers `router.push` to new estimateId route.

3. **VersionProvider Context – `contexts/VersionContext.tsx`**
   * Holds `currentVersion`, `isLatest`, `versions`.
   * Provides helper `isReadOnly()`.

4. **Read-only Banner – `components/estimate/ReadOnlyBanner.tsx`**
   * If `!isLatest`, show banner “Viewing vN (read-only).”

## Rules & Flow
| Rule | Description | Constraints | Failure / Retry | Security |
|------|-------------|-------------|-----------------|----------|
| R1 | Version list | Max 100 versions returned | Pagination future | N/A |
| R2 | Latest detection | `version == max(versions)` | N/A | N/A |
| R3 | Read-only old | Disable editing UI when not latest | Attempt edit → toast | N/A |
| R4 | Tenant isolation | Only versions for tenant | 403 FORBIDDEN | RLS |
| R5 | Performance | Version list API <150 ms | Cache 60 s | N/A |

## Acceptance Criteria
* Version dropdown lists all versions with timestamp & note; newest first.
* Selecting older version navigates and UI becomes read-only.
* Latest version allows full editing; banner hidden.
* API returns 403 for cross-tenant access.
* Lighthouse perf ≤150 ms for versions API on 100 versions.
* Jest tests mock version list and ensure dropdown renders.
* Cypress flow switches between v1 and latest verifying read-only state.


**Module:** Version Management

**Description:** List, select, and load previous estimate versions with complete history.

**Dependencies:** ["Save Estimate Version"]

**User Stories:**
- As a user I can see all versions of an estimate
  - Acceptance Criteria: shows version number, date, creator, and note in dropdown
- As a user I can switch to view any previous version
  - Acceptance Criteria: loads complete estimate state including rates and values
- As a user I can navigate between projects and versions
  - Acceptance Criteria: shows current project, version dropdown, save button
