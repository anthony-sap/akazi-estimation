# Slice 11: Edit Rate Card

## Goal
Allow users to add, edit, or delete role/region rate entries for the current estimate, applying validation and recalculating totals instantly while persisting changes as part of the estimate version.

## Implementation Steps
1. **Rate Card Editor Component – `components/estimate/RateCardEditor.tsx`**
   * Editable table rows with inputs: `role`, `region`, `ratePerHour`.
   * “Add Rate” button inserts blank row; trash icon deletes row.
   * Debounced input updates trigger `updateRateCard()`.

2. **Update Helper – `lib/estimation/updateRateCard.ts`**
   * **Signature**: `updateRateCard(estimateId: string, rateCard: RateCard): Promise<EstimateTotals>`
   * Saves edited `rateCard` JSON, recalculates totals server-side with `calculateTotals`, returns new totals.

3. **API Route – `PUT /api/estimates/[id]/rate-card`**
   * Accepts body `{ rateCard }`, validates each entry: role/region non-empty, rate ≥0.
   * Auth + tenant context required.
   * Returns `{ totalHours, totalCost, totalPrice }`.

4. **Client State & Optimistic UI**
   * React-query mutation with optimistic update of totals.
   * Rollback if API returns error.

## Rules & Flow
| Rule ID | Description | Data / Constraints | Failure / Retry | Security / Throttling |
|---------|-------------|--------------------|-----------------|-----------------------|
| R1 | Rate ≥0 | Decimal(12,2), max 9999.99 | 400 INVALID_RATE | N/A |
| R2 | Role/Region required | Non-empty strings ≤40 chars | 400 INVALID_INPUT | N/A |
| R3 | Duplicate role/region | No duplicates within same estimate | 409 DUPLICATE_RATE | N/A |
| R4 | Auto-recalc totals | Any rate change → recalc in ≤200 ms | N/A | N/A |
| R5 | Read-only old versions | Editing disabled if not latest | 405 READ_ONLY | N/A |

## Acceptance Criteria
* Editing a rate cell updates totals in <200 ms.
* Adding duplicate role/region returns 409 `DUPLICATE_RATE` and UI shows inline error.
* Negative or non-numeric rate returns 400 `INVALID_RATE` and field highlights.
* Deleting a rate row removes it and recalculates totals.
* API route secured by tenant context; cross-tenant attempt returns 403.
* Lighthouse a11y score ≥90 for rate card table.
* Jest tests validate helper rejects invalid rates and recalculates correctly.
* Cypress test edits a rate and verifies updated totals and persistence after reload.

**Module:** Rate Management

**Description:** Edit existing rates and add new role/region combinations with instant recalculation.

**Dependencies:** ["Display Estimate"]

**User Stories:**
- As a user I can adjust hourly rates
  - Acceptance Criteria: updates rates and recalculates totals in real-time
- As a user I can add custom role/region rates
  - Acceptance Criteria: adds new rate entry and applies to matching tasks
- As a user I can easily edit rates in a table format
  - Acceptance Criteria: shows role, region, rate with inline editing
