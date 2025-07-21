# Slice 21: Implement Rate Limiting

## Goal
Protect API endpoints against abuse by enforcing per-tenant and per-IP request limits with informative error responses.

## Implementation Steps
1. **Rate-Limit Middleware – `middleware/rateLimit.ts`**
   * **Signature**: `rateLimit(max: number, windowMs: number)`
   * Uses Upstash Redis to store counters `rl:{key}:{window}`.
   * Adds `Retry-After` header on limit breach.

2. **Global Middleware Registration – `app/middleware.ts`**
   * Apply `rateLimit(100, 60_000)` for public routes (`/api/*` default).
   * Override stricter limits:  
     * `POST /api/projects` – 10/min  
     * `POST /api/estimates` – 30/hour

3. **Helper – `lib/rateLimiter.ts`**  
   * Centralizes limit configs.

4. **Error Handler**
   * On breach return `429 RATE_LIMIT` JSON `{ error:{ code:'RATE_LIMIT', resetAt } }`.

## Rules & Flow
| Rule | Route | Limit | Window | Key |
|------|-------|-------|--------|-----|
| R1 | Auth endpoints | 100 req/min | 60 s | IP |
| R2 | Create project | 10 req/min | 60 s | Tenant |
| R3 | Save version | 20 req/day | 24 h | Project |
| R4 | Parse CSV | 5 uploads/hour | 60 min | Tenant |
| R5 | 429 response | Include `Retry-After` | — | — |

## Acceptance Criteria
* Exceeding limits returns 429 with JSON body and `Retry-After` header.
* Counters reset after window; subsequent requests succeed.
* Limits differentiated by route as per table.
* Jest tests mock Redis and assert 429 after threshold.
* Cypress test floods endpoint and verifies rate-limit behaviour.

**Module:** Security

**Description:** Apply rate limits to all API endpoints to prevent abuse.

**Dependencies:** ["Configure Database Schema"]

**User Stories:**
- As a system operator I want to prevent API abuse
  - Acceptance Criteria: limits request frequency and returns 429 errors when exceeded
