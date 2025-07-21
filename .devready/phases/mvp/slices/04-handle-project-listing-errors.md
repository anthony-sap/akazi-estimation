# Slice 04: Handle Project Listing Errors

## Goal
Provide robust error-handling and user-feedback for the Project List feature so that network failures, auth issues, empty lists, and slow responses are surfaced clearly, logged for troubleshooting, and recoverable via retry without page refresh.

## Implementation Steps
1. **API Error Hook – `useApiError.ts`**
   * **Environment Variables**: None
   * **Behavior Details**: Central hook returns `{ status, code, message, retry() }`; maps API error codes to user-friendly copy.
   * **Invocation Points**: Used in `<ProjectList/>`, `<ProjectControls/>` for optimistic retry logic.

2. **Error Boundary Component – `ProjectListErrorBoundary.tsx`**
   * Displays fallback UI with error message, “Retry” button.
   * Auto-retries idempotent GET up to 3 times (exponential back-off 0.5 s → 2 s).

3. **Skeleton & Empty States**
   * `<ProjectListSkeleton/>` – shimmer UI while loading (>120 ms).
   * `<EmptyProjectsState/>` – CT-A to create first project when list empty.

4. **API Handler Enhancements**
   * Add structured JSON errors:
     ```json
     { "error": { "code": "TENANT_CONTEXT_MISSING", "message": "Tenant header missing" } }
     ```
   * Map DB errors to 500; unauthorized to 401; insufficient perms to 403.

5. **Client-side Retry Policy**
   * React-query `retry: 2`, `retryDelay: attempt => 1000 * attempt`.
   * Surfaced via toast “Retrying… (n/2)”.

## Rules & Flow
| Rule | Description | Data / Constraints | Failure / Retry | Security / Throttling |
|------|-------------|--------------------|-----------------|-----------------------|
| R1 | Show skeleton for ≥120 ms load | N/A | Skeleton removed when data/fail | N/A |
| R2 | Map HTTP → UI errors | 401→“Sign in”, 403→“Access denied”, 500→“Server error” | Retry 2× then fail | Rate-limit toast to 1 per 10 s |
| R3 | Auto-retry idempotent GET | Retry 2× with back-off | Give up → error boundary | Abort if offline |
| R4 | Empty list UX | No projects ⇒ “Create Project” CTA | N/A | N/A |
| R5 | Log fatal errors | Send to Vercel logging with `error.code`, requestId | Always | Mask tenantId in logs |

## Acceptance Criteria
* Skeleton loader visible for any fetch taking ≥120 ms.
* 401 triggers redirect to `/login` with `next=/projects`.
* 403 shows toast “You don’t have permission to view projects”.
* Network failure retries automatically up to 2 times; after that, ErrorBoundary with “Retry” button appears.
* Empty tenant returns EmptyProjectsState with “New Project” CTA.
* All fatal errors logged via `pino-http` with masked tenantId.
* Cypress test simulating 500 response shows error boundary; clicking Retry fetches successfully after mock recovery.

**Module:** Error Handling

**Description:** Display appropriate error states and retry options when project listing fails.

**Dependencies:** ["List Projects"]

**User Stories:**
- As a user I understand what went wrong when errors occur
  - Acceptance Criteria: displays clear, actionable error messages
