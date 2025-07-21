### Context

You are a senior engineer tasked with authoring a “Feature Slice” specification. Each slice must include exactly four sections—Goal, Implementation Steps, Rules & Flow, and Acceptance Criteria—so that an automated code‐generation tool (or another engineer) can build and test the feature without ambiguity.

### Inputs

1. **Feature Title**: A short name for this slice (e.g. “Outbound Webhook & Status API”).
2. **Goal**: A one‐ or two‐sentence statement of what this slice must accomplish.
3. **Implementation Details**: A numbered list of subcomponents or tasks. Each item typically describes:
   * A utility module or helper function (filename, function signature, environment-variable behavior, retry logic, etc.).
   * One or more “triggers” or places where that utility must be invoked (e.g. on status transitions or HTTP handlers).
   * If relevant, a new HTTP endpoint or API route (path, HTTP method, request/response shape, auth/limits).
   * Any documentation or example usage (e.g. sample GitHub Action snippet).
4. **Rules & Flow**: A table (or bullet list) of all business‐logic rules, each with:
   * A rule code (e.g. R1, R2).
   * A one‐line description of the rule.
   * Any schema or data‐shape requirements (payload shape, header format, rate limits, caching behavior, security).
   * Failure modes or fallbacks (e.g. retry counts, no-op behavior in dev, cron-job retry for undelivered items).
5. **Error Matrix (if applicable)**: A small table mapping:
   * HTTP status codes → error codes (e.g. 404 → NOT\_FOUND, 429 → RATE\_LIMIT) → when they occur.
6. **Acceptance Criteria**: A bullet list stating exactly what must be true for this slice to be considered complete (e.g. “Webhook POST matches schema and signature is valid,” “Duplicate events suppressed within 60 s,” “Status endpoint returns CLIENT\_APPROVED when ready,” etc.).

### Deliverable

Generate a Markdown document for this slice containing these sections **in this exact order**:

1. **Goal**\
   A single paragraph describing what feature this slice delivers and why (machine-readable if possible).
2. **Implementation Steps**\
   A numbered list. For each step include:      
   * **Environment Variables** (e.g. `OUTBOUND_WEBHOOK_URL`, `WEBHOOK_SECRET`).
   * **Behavior Details**: JSON payload shape, HMAC-SHA256 signature header, retry policy (back-off intervals), in-memory caching, log/fallback behavior.
   * **Invocation Points**: Where to call each utility (e.g. on `SuiteStatus → FAILED`, on `ReleaseStatus → UAT_PASSED`, etc.).
   * **Endpoint Definition** (if any): HTTP method, path, request/response shape, auth or rate limits.
3. **Rules & Flow**\
   A table (or well-formatted bullets) with columns/fields:
   * **Rule ID** (e.g. R1, R2, …).
   * **Description** (plain-English summary).
   * **Data/Schema Constraints** (payload fields, timestamp format, headers, caching window, environment-default behavior).
   * **Failure/Retry Behavior** (how to handle errors or missing variables).
   * **Security or Throttling** (e.g. HMAC validation, rate limit 30 req/min per IP, suppress duplicates for 60 s).
4. **Error Matrix**\
   A compact table mapping:
   * **HTTP Status** → **Error Code** → **Scenario**\
     For example:

HTTP 200 → — → { status: "CLIENT\_APPROVED" }
HTTP 404 → NOT\_FOUND → Unknown project/release
HTTP 429 → RATE\_LIMIT → Too many requests to status endpoint

(If no status‐API errors are needed, omit this table.)
 
 
5. **Acceptance Criteria**\
   A bullet list of pass/fail conditions. Each criterion must be verifiable via tests or manual steps. For example:

* “Webhook POST payload matches schema `{ event, timestamp, projectId, releaseId, status, url }`.”
* “Receiver can validate `X-Signature` HMAC‐SHA256 header correctly.”
* “Duplicate events for the same release within 60 s are suppressed.”
* “Failed deliveries after 3 retries are recorded for nightly cron retry.”
* “Status endpoint returns correct `ReleaseStatus` enum; polling example passes when `CLIENT_APPROVED`.”



### Your Input

```text
#### HLD
{{ paste full HLD here }}

#### Feature Slice ( taken from the file content)


If we are making a UI Specific slice then provide appropriate detail omitting the components that are not relevant to the UI slice.