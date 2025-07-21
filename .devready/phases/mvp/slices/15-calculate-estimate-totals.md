# Slice 15: Calculate Estimate Totals

## Goal
Provide a reusable calculation engine that derives total hours, cost, and price for an estimate (and module roll-ups) whenever any data changes, using business formulas defined in the HLD.

## Implementation Steps
1. **Calculation Library – `lib/estimation/calculateTotals.ts`**
   * **Signature**:  
     `calculateTotals(data: ParsedData, rateCard: RateCard, margin: number): Totals`
   * **Behavior**: Implements HLD §10 formulas using Decimal.js; returns:
     ```ts
     interface Totals {
       totalHours: Decimal;
       totalCost: Decimal;
       totalPrice: Decimal;
       modules: { id: string; hours: Decimal; cost: Decimal; price: Decimal }[];
     }
     ```

2. **Unit Tests – `__tests__/calculateTotals.test.ts`**
   * Cover edge cases: zero hours, mixed roles/regions, 0% and 100% margin.
   * Snapshot sample CSV → expected totals.

3. **Integration Hook – `lib/estimation/recalculateTotals.ts`**
   * **Signature**:  
     `recalculateAfterChange(estimateId: string): Promise<EstimateTotals>`
   * Fetch latest estimate, run `calculateTotals`, persist cached totals in DB, return DTO.

4. **Trigger Points**
   * After Task Hours edit, Rate edit, Margin edit (slices 11–13) call `recalculateAfterChange`.
   * On estimate page load, if totals cache missing, run calculation.

## Rules & Flow
| Rule | Description | Data Constraints | Failure / Retry | Security |
|------|-------------|------------------|-----------------|----------|
| R1 | Deterministic | Same input → same output | Unit-test enforced | N/A |
| R2 | Precision | Use Decimal(12,2) money, Decimal(10,2) hours | Throw if overflow | N/A |
| R3 | Performance | 5 k tasks calc <1 s (p95) | Log warn if >1 s | N/A |
| R4 | Cache totals | Store totals on estimate row | Recompute on invalidation | N/A |
| R5 | No side-effects | Pure function, no DB calls | N/A | N/A |

## Acceptance Criteria
* `calculateTotals` passes unit tests with expected values ±0.01.
* Recalculation after any edit updates SummaryBar within 200 ms.
* 5 k-task CSV calculation completes <1 s on CI test run.
* Cached totals written to DB and served on subsequent page loads.
* Decimal precision maintained; sums verified in integration tests.

**Module:** Calculations

**Description:** Perform client-side calculation of all totals when any value changes.

**Dependencies:** ["Edit Rate Card", "Edit Task Hours", "Edit Margin"]

**User Stories:**
- As a user I see instant updates when I change values
  - Acceptance Criteria: totals update immediately without server round-trip
