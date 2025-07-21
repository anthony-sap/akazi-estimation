# Slice 05: Create Project

## Goal
Allow authenticated tenant users to create a new project container with a unique name and optional description, persisting it to the database and redirecting them to the project dashboard upon success.

## Implementation Steps
1. **API Endpoint – `POST /api/projects`**
   * **Filename/Location**: `app/api/projects/route.ts`
   * **Function Signature**: `POST(request: NextRequest): Promise<NextResponse>`
   * **Environment Variables**: `DATABASE_URL`
   * **Behavior Details**: Accepts JSON `{ name: string; description?: string }`; validates name (3-80 chars, slug-safe); inserts row into `projects`; returns `{ id }` with 201 status.
   * **Invocation Points**: Called by “Create Project” modal form on `/projects`.
   * **Auth / Limits**: Requires Kinde session; rate-limit 10 creations per tenant per minute.

2. **Validation Utility – `lib/validateProject.ts`**
   * **Filename**: `lib/validateProject.ts`
   * **Signature**: `validateProjectInput(input: unknown): { name: string; description?: string }`
   * **Behavior**: Uses Zod schema; throws `ValidationError` on failure; sanitizes description length to 256 chars max.

3. **Prisma Insert Helper**
   * **Filename**: `lib/projectService.ts`
   * **Function**: `createProject(tenantId: string, ownerId: string, data: { name: string; description?: string }): Promise<Project>`
   * **Behavior**: Sets tenant context, inserts project, returns full instance.

4. **UI Modal – `components/projects/CreateProjectModal.tsx`**
   * Collects `name`, optional `description`; calls `/api/projects`.
   * Shows loading spinner, success toast “Project created”, navigates to `/projects/{id}`.
   * Displays inline error messages from API.

## Rules & Flow
| Rule ID | Description | Data / Schema Constraints | Failure / Retry Behavior | Security/Throttling |
|---------|-------------|---------------------------|--------------------------|---------------------|
| R1 | Auth required | Valid Kinde JWT + tenant org | 401 UNAUTHORIZED | Rate-limit 100 req/min per IP |
| R2 | Unique project name per tenant | DB unique index `(tenantId,name)` | 409 CONFLICT → show “Name taken”; retry allowed | Index enforced |
| R3 | Name validation | 3-80 printable chars; no leading/trailing spaces | 400 BAD_REQUEST on invalid | Input sanitized |
| R4 | Description length | ≤256 chars UTF-8 | Truncate client-side; DB constraint | N/A |
| R5 | Creation rate limit | ≤10 projects/min per tenant | 429 RATE_LIMIT | Lockout 1 min after limit |

## Acceptance Criteria
* `POST /api/projects` returns 201 with `{ id }` JSON when valid input sent.
* Duplicate name in same tenant returns 409 with error code `NAME_TAKEN`.
* Validation errors return 400 with code `INVALID_INPUT`.
* Unauthenticated request returns 401; cross-tenant attempt returns 403.
* After creation, UI redirects to `/projects/{id}` and shows success toast.
* Project appears in listing within 1 s and passes tenant isolation tests.
* Jest unit tests cover validation utility and API handler happy/error paths.
* Cypress test creates project end-to-end and verifies redirect + listing update.
