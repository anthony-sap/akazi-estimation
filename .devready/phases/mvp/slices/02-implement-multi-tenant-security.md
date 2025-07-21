# Slice 02: Implement Multi-tenant Security

## Goal
Establish comprehensive multi-tenant security architecture using Kinde Auth and PostgreSQL row-level security to ensure complete data isolation between organizations, preventing cross-tenant data access while maintaining seamless user experience and API performance.

## Implementation Steps

1. **Setup Kinde Authentication Provider**
   - **Environment Variables**: `KINDE_DOMAIN`, `KINDE_CLIENT_ID`, `KINDE_CLIENT_SECRET`, `KINDE_REDIRECT_URI`, `KINDE_LOGOUT_REDIRECT_URI`, `KINDE_AUDIENCE`
   - **Behavior Details**: Configure OAuth 2.0 with OpenID Connect, enable multi-tenant organization support, set up M2M tokens for API access, scope includes `openid profile email offline`
   - **Invocation Points**: Initialize in `app/layout.tsx` with `KindeProvider`, protect all API routes via middleware
   - **File Creation**: `lib/kinde.ts` with configuration, `app/middleware.ts` for route protection

2. **Create Tenant Context Middleware**  
   - **Environment Variables**: Uses Kinde environment variables for session validation
   - **Behavior Details**: Extract `tenantId` from Kinde organization, validate user membership, set request headers `x-tenant-id` and `x-user-id`, cache context for 5 minutes
   - **Invocation Points**: Apply to all `/api/*` routes, execute before any database operations
   - **Endpoint Protection**: All API routes under `/api/` require authentication and valid tenant context

3. **Implement Database Row-Level Security**
   - **Environment Variables**: `DATABASE_URL` for PostgreSQL connection with RLS support
   - **Behavior Details**: Enable RLS on `projects` and `estimates` tables, create policies using `current_setting('app.current_tenant')`, set session variable before queries
   - **Policy Creation**: `CREATE POLICY tenant_isolation ON {table} USING (tenant_id = current_setting('app.current_tenant')::text)`
   - **Session Context**: Execute `SET app.current_tenant = ${tenantId}` before all database operations

4. **Create Tenant-aware Database Client**
   - **Environment Variables**: None required (uses runtime tenant context)
   - **Behavior Details**: Extend Prisma client with automatic tenant context setting, implement connection pooling per tenant, add query logging for security audit
   - **Helper Functions**: `setTenantContext()`, `createTenantClient()`, `validateTenantAccess()`
   - **Invocation Points**: Use in all API routes, server actions, and background jobs

## Rules & Flow

| Rule ID | Description | Data/Schema Constraints | Failure/Retry Behavior | Security/Throttling |
|---------|-------------|------------------------|------------------------|-------------------|
| R1 | Authentication required for all API access | Valid Kinde session with JWT token, organization membership verified | 401 response on invalid auth; redirect to login page; no retry | Rate limit 100 req/min per IP on auth endpoints |
| R2 | Tenant context must be set for all database operations | `x-tenant-id` header matches user's Kinde organization; session variable `app.current_tenant` set | 403 response on missing context; operation rejected; manual retry required | Cross-tenant access attempts logged for security monitoring |
| R3 | Row-level security policies enforce data isolation | All queries automatically filtered by `tenant_id = current_setting('app.current_tenant')` | Empty result set for cross-tenant queries; no error thrown; policy silently filters | Performance monitoring for RLS overhead; alert if >10ms impact |
| R4 | User permissions validated on each request | Role-based permissions checked against Kinde user roles; actions limited by permission matrix | 403 response on insufficient permissions; audit log entry created; no retry | Permission cache TTL 5 minutes; refresh on role changes |
| R5 | Database session context isolated per request | Each request sets unique tenant context; connection pool isolation maintained | Connection leak prevention; timeout after 30s; automatic cleanup | Connection pool limit 10 per tenant; queue additional requests |

## Error Matrix

| HTTP Status | Error Code | Scenario |
|-------------|------------|----------|
| 401 | UNAUTHORIZED | Missing or invalid Kinde authentication token |
| 403 | FORBIDDEN | Valid user but no access to requested tenant |
| 403 | INSUFFICIENT_PERMISSIONS | User role lacks required permissions for action |
| 403 | TENANT_CONTEXT_MISSING | Request missing x-tenant-id header or invalid tenant |
| 429 | RATE_LIMITED | Authentication endpoint rate limit exceeded |
| 500 | RLS_POLICY_ERROR | Database row-level security policy enforcement failed |
| 500 | TENANT_CONTEXT_ERROR | Failed to set database session tenant context |

## Acceptance Criteria

* **Authentication Integration**: Kinde Auth provider configured with multi-tenant organization support and OAuth 2.0 flows working correctly.
* **Tenant Isolation**: Cross-tenant data queries return empty results; users cannot access other organizations' projects or estimates under any circumstances.
* **Middleware Protection**: All API routes under `/api/*` require valid authentication and automatically set tenant context from Kinde organization.
* **Row-Level Security**: PostgreSQL RLS policies active on `projects` and `estimates` tables with tenant-based filtering enforced at database level.
* **Session Context**: Database session variable `app.current_tenant` correctly set for all operations and automatically filtered in queries.
* **Permission Enforcement**: Role-based access control validates user permissions against action requirements with appropriate error responses.
* **Performance Impact**: RLS policies add <10ms overhead to database queries; connection pooling maintains optimal performance.
* **Security Audit**: All authentication failures, cross-tenant access attempts, and permission violations logged with user ID, timestamp, and action details.
* **Error Handling**: Clear error messages for authentication, authorization, and tenant context issues with appropriate HTTP status codes.
* **Test Coverage**: Security test suite validates tenant isolation, prevents data leakage, and confirms proper authentication flows.
