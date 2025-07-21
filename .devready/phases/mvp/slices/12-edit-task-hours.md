# Slice 12: Edit Task Hours

## Goal
Enable users to modify individual task hour estimates inline, with validation and instant roll-up recalculation of module and project totals.

## Implementation Steps
1. **Task Row Component – `components/estimate/TaskRow.tsx`**
   * Input field `[estimateHours]` (type number, step 0.5).
   * On change → `updateTaskHours(taskId, newHours)` mutation.

2. **Update Helper – `lib/estimation/updateTaskHours.ts`**
   * **Signature**: `updateTaskHours(taskId: string, hours: number): Promise<EstimateTotals>`
   * Validates `hours ≥0` and multiple of 0.5.
   * Updates `parsedData` JSON in estimate row, recalculates totals via `calculateTotals`.

3. **API Route – `PUT /api/tasks/[id]/hours`**
   * Body `{ hours }`; header auth & tenant enforced.
   * Returns `{ moduleTotals, projectTotals }` for optimistic UI update.

4. **Optimistic UI & Error Handling**
   * React-query mutation with optimistic row update and totals refresh.
   * On validation error 400 `INVALID_HOURS`, revert and show inline error badge.

## Rules & Flow
| Rule ID | Description | Constraints | Failure / Retry | Security |
|---------|-------------|-------------|-----------------|----------|
| R1 | Hours increment | Multiple of 0.5, ≥0, ≤999.9 | 400 INVALID_HOURS | N/A |
| R2 | Auto-recalc | Row change updates module & project totals ≤200 ms | N/A | N/A |
| R3 | Read-only old versions | Disable editing if estimate not latest | 405 READ_ONLY | N/A |
| R4 | Audit trail | Store `updatedBy`, timestamp in estimate history | Always | N/A |
| R5 | Concurrency guard | Reject if estimate version changed since fetch | 409 VERSION_MISMATCH | N/A |

## Acceptance Criteria
* Editing a task’s hours to valid value updates module and project totals in <200 ms.
* Input rejects non-numeric or non-0.5-step values; shows inline error on blur.
* Negative hours or >999.9 returns 400 with code `INVALID_HOURS`.
* Attempting edit on old version returns 405 `READ_ONLY`; UI shows banner.
* Concurrency conflict returns 409 `VERSION_MISMATCH`; UI prompts reload.
* Jest tests validate helper rounding/validation and totals update.
* Cypress scenario edits three tasks and verifies rolled-up hours & cost update.


**Module:** Estimate Editing

**Description:** Edit individual task hours with inline validation and immediate recalculation.

**Dependencies:** ["Display Estimate"]

**User Stories:**
- As a user I can adjust task hours
  - Acceptance Criteria: updates hours and recalculates totals in real-time
