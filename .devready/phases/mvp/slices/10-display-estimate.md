# Slice 10: Display Estimate

## Goal
Render a responsive estimation view that shows project totals, editable rate card, collapsible module/story/task hierarchy, and live margin adjustments, updating calculations in real time.

## Implementation Steps
1. **Page Route – `/projects/[projectId]/estimates/[estimateId]/page.tsx`**
   * Fetch Estimate DTO via `getEstimate(projectId, estimateId)` server action.
   * Pass data to `<EstimateWorkspace/>` client component.

2. **Workspace Component – `components/estimate/EstimateWorkspace.tsx`**
   * **Environment Variables**: None
   * **Behavior**: Combines SummaryBar, RateCardEditor, ModuleAccordion; manages client-side state with Context; triggers `recalculateTotals()` on edits.

3. **Summary Bar – `components/estimate/SummaryBar.tsx`**
   * Displays `totalHours`, `totalCost`, `totalPrice`, editable `marginPercent` input.
   * Debounced margin input triggers recalculation.

4. **Module Accordion – `components/estimate/ModuleAccordion.tsx`**
   * Renders each module with rolled-up hours & cost.
   * Nested `<StoryAccordion/>` and `<TaskRow/>`; collapsible via Radix Accordion.

5. **Rate Card Editor – `components/estimate/RateCardEditor.tsx`**
   * Editable table of role/region rates.
   * Inline validation (rate ≥0); on change updates rateCard state and recalculates totals.

## Rules & Flow
| Rule ID | Description | Data/Schema Constraints | Failure / Retry | Security / Throttling |
|---------|-------------|-------------------------|-----------------|-----------------------|
| R1 | Live recalculation | Any change to hours, rate, margin updates totals ≤200 ms | N/A | N/A |
| R2 | Editable margin | 0–100% numeric | Invalid input disables Save | N/A |
| R3 | Accordion state | Open/close persists in URL hash | N/A | N/A |
| R4 | Read-only older versions | If `estimateId` ≠ latest -> disable editing | Editing attempt shows toast | N/A |
| R5 | Accessibility | All interactive elements keyboard navigable | Violations fail a11y test | N/A |

## Acceptance Criteria
* Page displays SummaryBar, RateCardEditor, and ModuleAccordion populated from Estimate DTO.
* Editing margin or rates recalculates totals in <200 ms and updates SummaryBar values.
* Collapsing/expanding modules updates URL hash and restores state on reload.
* Old versions (not latest) render in read-only mode with “View-only” banner.
* Lighthouse accessibility score ≥90; keyboard tab order covers all inputs.
* Jest unit tests verify `recalculateTotals()` correctness with sample data.
* Cypress test edits rate, margin, hours and checks updated totals.

**Module:** Estimate Display

**Description:** Show estimate with summary metrics, module breakdown, and collapsible sections.

**Dependencies:** ["Generate Estimate"]

**User Stories:**
- As a user I can see the estimate summary
  - Acceptance Criteria: displays totals prominently with margin percentage
- As a user I can see the detailed task breakdown
  - Acceptance Criteria: displays hierarchical view of modules, stories, and tasks with hours
- As a user I can expand/collapse modules for easier viewing
  - Acceptance Criteria: toggles module visibility and shows subtotals
- As a user I can see key metrics at a glance
  - Acceptance Criteria: displays hours, cost, price, and editable margin
