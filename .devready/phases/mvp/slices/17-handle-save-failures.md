# Slice 17: Handle Save Failures

## Goal
Gracefully handle failures when saving a new estimate version (network errors, DB conflicts, validation errors), providing retry, offline backup, and clear user feedback without data loss.

## Implementation Steps
1. **Client Retry Logic – `hooks/useSaveRetry.ts`**
   * Signature: `useSaveRetry(mutateFn, maxRetries = 3)`
   * Exponential back-off (1 s → 4 s) with toast “Retry n/3”.

2. **Local Backup – `lib/localBackup.ts`**
   * Save draft estimate JSON to `localStorage['estimateDraft']` before save request.
   * On save fail & reload, prompt user to restore draft.

3. **API Response Codes**
   * `409 VERSION_MISMATCH` – newest version changed; client fetches latest then re-save.
   * `500 DB_ERROR` – server error; retry via useSaveRetry.
   * `503 TIMEOUT` – service unavailable; auto-retry.

4. **Error Banner Component – `components/estimate/SaveErrorBanner.tsx`**
   * Shows inline banner with error details and “Retry Now” button (calls mutate).

## Rules & Flow
| Rule | Description | Failure Code | Retry | Notes |
|------|-------------|--------------|-------|-------|
| R1 | Network failure | fetch error | Auto 3× | Offline backup retained |
| R2 | DB error | 500 DB_ERROR | Auto 3× | After 3 fails → error banner |
| R3 | Version conflict | 409 VERSION_MISMATCH | Auto fetch latest & retry 1× | Then show banner |
| R4 | Timeout | 503 TIMEOUT (>10 s) | Auto 3× | Back-off |
| R5 | Draft restore | On page load, if `estimateDraft` present | Prompt restore | Clear after save |

## Acceptance Criteria
* Network unplug simulation causes auto-retry 3× then shows SaveErrorBanner.
* Version conflict auto-fetches latest and retries once; if still conflict, shows banner.
* Local draft saved before request and offered to restore on reload.
* Error toast shows retry countdown; cancels when success.
* Jest tests mock 500/timeout and confirm retry logic counts.
* Cypress test simulates offline during save, reloads page, restores draft, saves successfully.


**Module:** Error Handling

**Description:** Provide error handling, retry logic, and local backup for version save failures.

**Dependencies:** ["Save Estimate Version"]

**User Stories:**
- As a user I understand what went wrong when errors occur
  - Acceptance Criteria: displays clear, actionable error messages
