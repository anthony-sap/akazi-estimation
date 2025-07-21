# Slice 09: Generate Estimate

## Goal
Transform validated `parsedData` and selected `rateCard` into a fully-calculated Estimate entity, persist it as version 1 for the project, and return totals (hours, cost, price) for immediate UI display.

## Implementation Steps
1. **Server Action – `app/(protected)/actions/generateEstimate.ts`**
   * **Environment Variables**: `DATABASE_URL`
   * **Signature**:  
     `export async function generateEstimate(projectId: string, title: string, parsedData: ParsedData, rateCard: RateCard): Promise<EstimateDTO>`
   * **Behavior**:  
     * Calculate totals using formula library (see HLD §10).  
     * Insert new row in `estimates` with `version = 1` (or next version if existing).  
     * Return DTO `{ id, version, totalHours, totalCost, totalPrice, marginPercent }`.

2. **Calculation Library – `lib/estimation/calculateTotals.ts`**
   * **Signature**:  
     `calculateTotals(parsedData: ParsedData, rateCard: RateCard, margin: number): Totals`
   * **Behavior Details**: Implements formulas from HLD §10 (buffer, QA splits, cost-of-sale). Uses Decimal.js for precision. Unit-tested separately.

3. **Route Handler – `app/api/estimates/route.ts`**
   * **Endpoint**: `POST /api/estimates`
   * **Request Body**: `{ projectId, title, parsedData, rateCard, marginPercent }`
   * **Auth**: Kinde JWT, tenant context middleware.
   * **Rate Limit**: 30 estimate generations per tenant per hour.

4. **UI Trigger**
   * `New Estimate` wizard calls `POST /api/estimates`.  
   * On success, navigates to `/projects/{projectId}/estimates/{id}` and shows success toast.

## Rules & Flow
| Rule ID | Description | Data Constraints | Failure / Retry | Security / Throttling |
|---------|-------------|------------------|-----------------|-----------------------|
| R1 | Version auto-increment | `version = max(version)+1` per project | DB unique `(projectId,version)` enforces | N/A |
| R2 | Financial precision | Use Decimal(12,2) for money, Decimal(10,2) for hours | ValidationError if >999999.99 | N/A |
| R3 | Immutable versions | No UPDATE after insert; only new rows | Attempted update returns 405 | N/A |
| R4 | Auth + tenant check | `project.tenantId === currentTenant` | 403 FORBIDDEN | 60 req/min per IP |
| R5 | Calculation integrity | Totals ≥0, margin 0-100% | 400 INVALID_TOTALS if invalid | N/A |

## Acceptance Criteria
* `POST /api/estimates` with valid body returns 201 with DTO containing id and computed totals.
* Totals match unit-tested calculation library within 0.01 tolerance.
* Duplicate call creates version 2 (auto-increment) without overwriting v1.
* Unauthorized or cross-tenant access returns 403.
* Attempt to update existing estimate returns 405.
* UI displays new estimate page with totals immediately after creation.
* Jest tests cover calculation edge cases (0 hrs, large hrs, 0/100% margin).
* Cypress e2e uploads CSV, generates estimate, verifies version 1 saved.


**Module:** Estimate Creation

**Description:** Create initial estimate version from CSV with default rate card and calculations.

**Dependencies:** ["Parse CSV Upload"]

**User Stories:**
- As a user I can upload a CSV to create an initial estimate
  - Acceptance Criteria: creates estimate v1 with parsed data and default rate card
- As a user I get default rates applied to my estimate
  - Acceptance Criteria: extracts unique role/region pairs and assigns default rates
- As a user I can see calculated totals immediately after upload
  - Acceptance Criteria: displays accurate total hours, cost, and price with default margin
