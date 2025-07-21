# Slice 13: Edit Margin

## Goal
Allow users to adjust the margin percentage for the active estimate, immediately recalculating total price, and persisting the new margin percent to the estimate version.

## Implementation Steps
1. **Margin Input – already in `components/estimate/SummaryBar.tsx`**
   * Numeric input `marginPercent` (0–100, step 0.1).
   * Debounced onChange calls `updateMargin(marginPercent)` mutation.

2. **Update Helper – `lib/estimation/updateMargin.ts`**
   * **Signature**: `updateMargin(estimateId: string, margin: number): Promise<EstimateTotals>`
   * Validates `0 ≤ margin ≤ 100`.
   * Writes `marginPercent` to estimate row, recalculates totals (`calculateTotals`).

3. **API Route – `PUT /api/estimates/[id]/margin`**
   * Body `{ marginPercent }`.
   * Auth + tenant + latest-version check.
   * Returns `{ totalPrice }` for optimistic update.

4. **Optimistic UI / Error Handling**
   * React-query mutation with optimistic total price update.
   * On validation error revert and highlight input.

## Rules & Flow
| Rule ID | Description | Constraints | Failure / Retry | Security |
|---------|-------------|-------------|-----------------|----------|
| R1 | Margin range | 0–100 inclusive, decimal max 2dp | 400 INVALID_MARGIN | N/A |
| R2 | Auto-total recalculation | Any margin change recalculates totalPrice ≤200 ms | N/A | N/A |
| R3 | Read-only old versions | Editing disabled if not latest | 405 READ_ONLY | N/A |
| R4 | Rate limit | ≤30 margin edits/min per estimate | 429 RATE_LIMIT | IP+estimate keyed |
| R5 | Precision | Stored as Decimal(5,2) | DB rejects >100.00 | N/A |

## Acceptance Criteria
* Margin input accepts values 0–100 (two decimals); invalid shows inline error.
* Changing margin updates totalPrice in SummaryBar within 200 ms.
* API returns 400 `INVALID_MARGIN` for out-of-range values.
* Editing margin on archived/old version returns 405 `READ_ONLY`; banner shown.
* Rapid edits >30/min return 429 `RATE_LIMIT`; toast shows wait message.
* Jest tests validate margin helper calculation and range enforcement.
* Cypress test adjusts margin, sees updated price, reloads page and confirms persistence.

**Module:** Estimate Editing

**Description:** Change margin percentage with validation and immediate price recalculation.

**Dependencies:** ["Display Estimate"]

**User Stories:**
- As a user I can adjust the margin percentage
  - Acceptance Criteria: updates margin and recalculates total price in real-time
