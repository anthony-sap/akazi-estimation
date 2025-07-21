# Slice 07: Parse CSV Upload

## Goal
Enable users to upload a DevReady-exported CSV (≤ 10 MB) and transform it into validated, structured JSON (`parsedData`) for immediate estimation calculations—all with clear progress feedback and error reporting.

## Implementation Steps
1. **Client-side Uploader – `components/csv/CSVDropZone.tsx`**
   * **Environment Variables**: `MAX_CSV_SIZE_MB=10`
   * **Behavior Details**: Drag-and-drop/paste file input, streams file via `FileReader`, shows progress bar (bytes read / total), validates size before upload.
   * **Invocation Points**: Shown on “New Estimate” page when no CSV yet.
   * **Retry Policy**: Allows re-selecting file after error; resets progress UI.

2. **API Endpoint – `POST /api/csv/parse`**
   * **Filename/Location**: `app/api/csv/parse/route.ts`
   * **Function Signature**: `POST(request: NextRequest): Promise<NextResponse>`
   * **Environment Variables**: `DATABASE_URL`
   * **Behavior Details**: Accepts multipart/form-data field `file` (CSV). Streams rows with `fast-csv`, validates headers, escapes quotes/commas, builds hierarchical JSON (`modules → userStories → tasks`).
   * **Response Shape**:  
     ```json
     { "parsedData": { ... }, "summary": { "totalHours": 120.5 } }
     ```
   * **Auth / Limits**: Auth required, body size limited to 10 MB, timeout 30 s.

3. **Validation Utility – `lib/validateCsvRow.ts`**
   * **Signature**: `validateRow(row: string[]): ParsedTaskRow`
   * **Behavior**: Ensures required columns present, hours numeric ≥0, returns typed object or throws `ValidationError(code: MALFORMED_ROW)`.

4. **Error Handling & Progress Events**
   * **Client**: Uses `AbortSignal` to cancel oversized uploads; displays inline errors with row numbers.
   * **Server**: Aggregates row errors, returns `400 INVALID_CSV` with `{ errors: [{ row, code, message }] }`.

## Rules & Flow
| Rule | Description | Data / Constraints | Failure / Retry | Security / Throttling |
|------|-------------|--------------------|-----------------|-----------------------|
| R1 | File size limit | ≤10 MB | 413 PAYLOAD_TOO_LARGE | N/A |
| R2 | Required headers present | moduleId,module,userStoryId,… | 400 INVALID_HEADERS | N/A |
| R3 | Row validation | Hours numeric, ≥0 | Collect up to 50 errors; reject if any | N/A |
| R4 | Auth required | Valid Kinde JWT | 401 UNAUTHORIZED | 30 req/min per IP |
| R5 | Progress feedback | Emit `progress` % every 100 KB | N/A | N/A |

## Acceptance Criteria
* Drag-and-drop zone blocks files >10 MB and shows “File too large” toast.
* `POST /api/csv/parse` streams CSV and returns JSON with `parsedData` and `summary.totalHours`.
* Invalid headers return 400 `INVALID_HEADERS`; UI shows inline error.
* Malformed rows (non-numeric hours) return 400 `INVALID_CSV` with error array listing row numbers.
* Progress bar updates ≥5× during 10 MB upload and hides on completion.
* Auth failure returns 401; user redirected to login.
* Jest unit tests validate `validateCsvRow` with good/bad rows.
* Cypress test uploads sample CSV and verifies parsed tree appears in UI.

**Module:** CSV Processing

**Description:** Upload, validate, and parse CSV files into structured JSON with progress indication.

**Dependencies:** ["Create Project"]

**User Stories:**
- As a user I can upload a CSV file from DevReady
  - Acceptance Criteria: parses CSV and returns structured JSON with modules, stories, and tasks
- As a user I get clear error messages for invalid CSV files
  - Acceptance Criteria: returns 400 with specific validation errors for malformed CSV
- As a user I get feedback when uploading large files
  - Acceptance Criteria: shows progress bar and enforces 10MB file size limit
