# Slice 16: Save Estimate Version

## Goal
Create a new immutable version of an estimate, persisting current parsed data, rate card, margin, and totals, and incrementing the version number with optional note.

## Implementation Steps
1. **Server Action – `app/(protected)/actions/saveEstimateVersion.ts`**
   * **Signature**:  
     `saveEstimateVersion(projectId: string, note?: string): Promise<EstimateDTO>`
   * Copies latest estimate’s `parsedData`, `rateCard`, `marginPercent`; increments `version`; recalculates totals.

2. **API Endpoint – `POST /api/estimates/[id]/versions`**
   * Body `{ note?: string }`.
   * Returns new version DTO with `version`, `createdAt`.

3. **UI Control – “Save” Button in SummaryBar**
   * Opens note modal, optional note entry.
   * Calls endpoint; on success adds version to VersionDropdown and navigates.

4. **Rate Limiting**
   * Max 20 versions per project per day (validate in service).

## Rules & Flow
| Rule | Description | Constraints | Failure / Retry | Security |
|------|-------------|-------------|-----------------|----------|
| R1 | Immutability | Previous versions read-only after save | N/A | N/A |
| R2 | Version auto-increment | Unique `(projectId, version)` | 409 DUPLICATE_VERSION | N/A |
| R3 | Note length | ≤256 chars UTF-8 | 400 INVALID_NOTE | N/A |
| R4 | Rate limit | 20 versions/day/project | 429 RATE_LIMIT | Tenant scoped |
| R5 | Audit | `createdBy`, timestamp stored | Always | N/A |

## Acceptance Criteria
* Clicking Save opens modal, saving with note creates version n+1 and redirects to new URL.
* API returns 409 if version collision (simulated); UI retries with fetch latest then save.
* Note field enforces 256-char limit; error on overflow.
* Project cannot exceed 20 versions in 24 h; API returns 429.
* Version dropdown lists new version immediately after save.
* Jest tests verify version increment logic and rate limit enforcement.
* Cypress test saves new version, checks redirect and version dropdown.


**Module:** Version Management

**Description:** Save current state as new version with incremented number and optional note.

**Dependencies:** ["Calculate Estimate Totals"]

**User Stories:**
- As a user I can save my changes as a new version
  - Acceptance Criteria: creates new version with all current values and optional note
- As a user I can add a note describing what changed
  - Acceptance Criteria: saves note with version for future reference
