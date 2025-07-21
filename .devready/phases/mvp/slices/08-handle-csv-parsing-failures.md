# Slice 08: Handle CSV Parsing Failures

## Goal
Detect malformed CSV uploads, surface row-level validation errors to the user, and allow retry without page refresh, ensuring that only correctly-structured data proceeds to estimation calculations.

## Implementation Steps
1. **Server-side Row Error Aggregation**
   * **Filename**: `lib/csv/RowErrorCollector.ts`
   * **Function Signature**: `addError(rowNumber: number, code: string, message: string): void`
   * **Behavior Details**: Collects up to 50 errors; after threshold, parsing aborts and returns aggregated array.
   * **Invocation Points**: Inside CSV streaming loop in `/api/csv/parse`.

2. **Error Response Schema**
   * Modify `POST /api/csv/parse` to return `400 INVALID_CSV` with body  
     ```json
     {
       "error": {
         "code": "INVALID_CSV",
         "message": "CSV contained validation errors",
         "rowErrors": [
           { "row": 24, "code": "NEGATIVE_HOURS", "message": "Hours cannot be negative" },
           { "row": 55, "code": "MISSING_MODULE", "message": "Module name missing" }
         ]
       }
     }
     ```
   * **Rate Limits** unchanged (10 MB, 30 req/min).

3. **Client-side Error UI – `components/csv/CsvErrorPanel.tsx`**
   * Displays table of row numbers & messages.
   * “Download Error Report” button exports `.json` of `rowErrors`.
   * “Retry Upload” button resets drop zone state.

4. **Toast & Telemetry**
   * Show toast “CSV failed validation (24 errors). See details below.”
   * Log error summary (`error.count`, `codes[]`) to Vercel analytics.

## Rules & Flow
| Rule ID | Description | Data / Constraints | Failure / Retry | Security / Throttling |
|---------|-------------|--------------------|-----------------|-----------------------|
| R1 | Max error threshold | Abort after 50 collected errors | 400 INVALID_CSV | N/A |
| R2 | Row error detail | Include `row`, `code`, `message` | N/A | N/A |
| R3 | No partial import | Any error ⇒ reject entire upload | User must correct & retry | N/A |
| R4 | Error report size | Row errors array ≤50; rest truncated | 400 but include `"truncated": true` | N/A |
| R5 | Telemetry logging | Send anonymized summary | Always | Mask tenantId |

## Error Matrix
| HTTP | Error Code | Scenario |
|------|------------|----------|
| 400 | INVALID_CSV | One or more row validations failed |
| 413 | PAYLOAD_TOO_LARGE | >10 MB file |
| 401 | UNAUTHORIZED | Missing auth |
| 500 | PARSE_FAILURE | Stream read error |

## Acceptance Criteria
* Malformed CSV returns 400 `INVALID_CSV` with `rowErrors` array (≤50 items) containing row number, code, message.
* UI displays CsvErrorPanel with errors and retry button; toast summarises count.
* “Download Error Report” downloads JSON of `rowErrors`.
* No data written to DB when parse fails.
* Telemetry event `csv_invalid` logged with error count and codes array.
* Jest test feeds CSV with 3 bad rows → API returns 400 with correct row numbers.
* Cypress test uploads bad CSV, shows error panel, fixes file, re-uploads successfully.


**Module:** Error Handling

**Description:** Show detailed validation errors and recovery options when CSV parsing fails.

**Dependencies:** ["Parse CSV Upload"]

**User Stories:**
- As a user I get clear error messages for invalid CSV files
  - Acceptance Criteria: returns 400 with specific validation errors for malformed CSV
