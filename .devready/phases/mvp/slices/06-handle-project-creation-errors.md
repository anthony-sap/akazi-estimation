# Slice 06: Handle Project Creation Errors

## Goal
Provide robust validation, error handling, and user feedback for the “Create Project” flow so that invalid input, duplicate names, auth issues, and rate-limit violations are surfaced clearly, logged, and recoverable via retry without page refresh.

## Implementation Steps
1. **Validation Utility Enhancement – `lib/validateProject.ts`**
   * **Filename/Location**: `lib/validateProject.ts`
   * **Function Signature**:  
     `validateProjectInput(input: unknown): { name: string; description?: string }`
   * **Behavior Details**:  
     * Zod schema: `name` 3-80 printable chars, no leading/trailing spaces; `description` ≤256 chars.  
     * Returns sanitized object; throws `ValidationError` (`code: INVALID_INPUT`) on fail.
   * **Invocation Points**: API `/api/projects` before DB insert; UI pre-submit to disable button.

2. **API Error Mapping – `app/api/projects/route.ts`**
   * **Filename/Location**: same route file.
   * **Environment Variables**: none new.
   * **Behavior Details**:  
     * Catch Prisma `P2002` (unique constraint) → 409 `NAME_TAKEN`.  
     * Catch rate-limit exceed → 429 `RATE_LIMIT`.  
     * Catch validation error → 400 `INVALID_INPUT`.  
     * Return JSON `{ error: { code, message } }`.
   * **Retry Logic**: Idempotent POST not auto-retried; client shows inline errors.

3. **Error Hook – `useApiError.ts`**
   * **Filename**: `hooks/useApiError.ts`
   * **Signature**: `useApiError(): { parse(error: unknown): ParsedError }`
   * **Behavior**: Maps API error codes to UI copy, determines retry ability.
   * **Invocation Points**: `CreateProjectModal` on submit catch.

4. **CreateProjectModal Updates**
   * Disable submit until name valid (shows helper text).  
   * On error, show inline message under field; for 409 duplicate, suggest a different name.
   * Toast “Rate-limit exceeded” for 429, disable button 60 s.

## Rules & Flow
| Rule ID | Description | Data / Constraints | Failure / Retry | Security / Throttling |
|---------|-------------|--------------------|-----------------|-----------------------|
| R1 | Name validation | 3-80 printable, unique per tenant | 400 INVALID_INPUT → inline msg | N/A |
| R2 | Duplicate name | Prisma unique `(tenantId,name)` | 409 NAME_TAKEN → prompt rename | N/A |
| R3 | Rate limit | ≤10 projects/min per tenant | 429 RATE_LIMIT → toast, disable 60 s | IP + tenant tracked |
| R4 | Auth required | Valid Kinde JWT | 401 UNAUTHORIZED → redirect login | 100 req/min auth |
| R5 | Unknown error fallback | Any unhandled error → 500 SERVER_ERROR | Show generic toast, log with `errorId` | Log to Vercel | 

## Error Matrix
| HTTP | Error Code | Scenario |
|------|------------|----------|
| 400 | INVALID_INPUT | Name too short/long, description >256 |
| 401 | UNAUTHORIZED | Missing/expired JWT |
| 403 | FORBIDDEN | Tenant mismatch | 
| 409 | NAME_TAKEN | Duplicate project name in tenant |
| 429 | RATE_LIMIT | Exceeded 10 projects/min |
| 500 | SERVER_ERROR | Unexpected DB failure |

## Acceptance Criteria
* Invalid name or description triggers 400 with `INVALID_INPUT`; modal shows inline error.
* Duplicate name returns 409 `NAME_TAKEN`; UI prompts user to choose another name.
* Rate-limit exceeded returns 429; button disabled and toast shown for 60 s.
* Unauthenticated request returns 401 and redirects to `/login?next=/projects`.
* All error responses use schema `{ error: { code, message } }`.
* Jest tests cover validation utility and API error responses.
* Cypress test simulates duplicate name and verifies inline error message appears.

**Module:** Error Handling

**Description:** Validate project inputs and display clear error messages when creation fails.

**Dependencies:** ["Create Project"]

**User Stories:**
- As a user I understand what went wrong when errors occur
  - Acceptance Criteria: displays clear, actionable error messages
