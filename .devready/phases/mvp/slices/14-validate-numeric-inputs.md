# Slice 14: Validate Numeric Inputs

## Goal
Enforce client-side and server-side numeric validation across all editable estimate fields (hours, rates, margin) to prevent invalid data entry before persistence or calculation.

## Implementation Steps
1. **Shared Zod Schemas – `lib/validation/schemas.ts`**
   * Export `hoursSchema` (decimal step 0.5, 0–999.9), `rateSchema` (≥0, ≤9999.99, two decimals), `marginSchema` (0–100, two decimals).
   * Used by both client and API handlers.

2. **Client Validation Hook – `hooks/useNumericValidation.ts`**
   * **Signature**: `useNumericValidation(schema: ZodSchema): { value, onChange, error }`
   * Provides value binding with real-time validation feedback.

3. **Input Components Updates**
   * Apply `useNumericValidation` to Task hours, Rate card rate, Margin percent inputs.
   * On invalid state, show red border and disable Save.

4. **API Middleware – `app/api/_middleware/validateNumeric.ts`**
   * Parses numeric fields in request body, validates with shared schemas.
   * Returns 400 `INVALID_INPUT` with `{ field, code, message }` on failure.

## Rules & Flow
| Rule | Description | Constraints | Failure / Retry | Security |
|------|-------------|-------------|-----------------|----------|
| R1 | Hours 0-999.9, step 0.5 | hoursSchema | 400 INVALID_HOURS | N/A |
| R2 | Rate ≥0 ≤9999.99, 2dp | rateSchema | 400 INVALID_RATE | N/A |
| R3 | Margin 0-100, 2dp | marginSchema | 400 INVALID_MARGIN | N/A |
| R4 | Disable save on invalid | Any invalid input disables Save button | User must correct | N/A |
| R5 | Consistent schemas | Same Zod schema shared between client & server | Build fails if mismatch | N/A |

## Acceptance Criteria
* Invalid numeric input instantly shows error state and prevents Save.
* API endpoints reject invalid numeric data with 400 and specific error code.
* Shared schema unit tests pass for boundary values and invalid cases.
* Cypress tests attempt invalid inputs (negative hours, 101% margin) and confirm UI error + disabled Save.
* No uncaught numeric validation errors reach database (verified via integration tests).

**Module:** Input Validation

**Description:** Enforce validation rules across all numeric inputs with immediate feedback.

**Dependencies:** ["Edit Rate Card", "Edit Task Hours", "Edit Margin"]

**User Stories:**
- As a user I cannot enter invalid numeric values
  - Acceptance Criteria: prevents non-numeric input and shows validation errors
