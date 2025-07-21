# Slice 01: Configure Database Schema

## Goal
Establish the foundational PostgreSQL database schema using Prisma ORM to support multi-tenant estimation application with complete data isolation, versioned estimates, and type-safe database operations that enable CSV-based project estimation workflows.

## Implementation Steps

1. **Setup Prisma Configuration**
   - **Environment Variables**: `DATABASE_URL` (PostgreSQL connection string), `DIRECT_URL` (for migrations), `PRISMA_GENERATE_DATAPROXY` (false for local dev)
   - **Behavior Details**: Configure Prisma client with multi-schema support, enable preview features for JSON filtering, set up connection pooling with 10 max connections
   - **Invocation Points**: Initialize in `lib/db.ts`, import in all API routes and server actions
   - **File Creation**: `prisma/schema.prisma` with generator and datasource blocks

2. **Define Core Entity Models**
   - **Environment Variables**: None required
   - **Behavior Details**: Create Tenant, Project, and Estimate models with proper field types (`cuid()` for IDs, `Decimal` for financial data, `Json` for flexible storage, `Text` for CSV content)
   - **Schema Constraints**: Foreign key cascading deletes, unique constraints on `(projectId, version)`, required fields validation
   - **Data Types**: String (cuid), DateTime (ISO 8601), Decimal(10,2) for hours, Decimal(12,2) for money, Json for parsedData/rateCard

3. **Configure Relationships and Indexes**
   - **Environment Variables**: None required  
   - **Behavior Details**: Set up one-to-many relationships (Tenant → Projects → Estimates), create performance indexes for common queries
   - **Index Strategy**: Primary indexes on all IDs, composite index on `(projectId, version DESC)`, tenant filtering index on `tenantId`
   - **Cascade Rules**: DELETE CASCADE from tenant to projects to estimates for complete cleanup

4. **Generate and Apply Migrations**
   - **Environment Variables**: `DATABASE_URL` for migration execution
   - **Behavior Details**: Generate initial migration with `prisma migrate dev --name init`, apply to database, generate TypeScript client
   - **Rollback Strategy**: Maintain migration history, support `prisma migrate reset` for development
   - **Validation**: Verify migration applies cleanly, check generated types match schema

## Rules & Flow

| Rule ID | Description | Data/Schema Constraints | Failure/Retry Behavior | Security/Throttling |
|---------|-------------|------------------------|------------------------|-------------------|
| R1 | Tenant isolation enforcement | All tenant-scoped tables must include `tenantId` field with foreign key constraint | Migration fails if constraint violation detected; manual intervention required | Row-level security policies prevent cross-tenant access |
| R2 | Estimate versioning integrity | `(projectId, version)` must be unique; version auto-increments per project | Unique constraint violation returns DB error; application handles gracefully | No rate limiting at schema level |
| R3 | Financial data precision | All monetary fields use `Decimal(12,2)`, hours use `Decimal(10,2)` to prevent floating-point errors | Invalid precision rejected by database; validation at application layer | Input sanitization prevents malformed decimal values |
| R4 | JSON structure flexibility | `parsedData` and `rateCard` stored as JSON with no schema enforcement at DB level | Invalid JSON rejected by PostgreSQL; application validates structure | JSON size limited to 1MB per field |
| R5 | Cascading delete behavior | Deleting tenant removes all projects and estimates; deleting project removes all estimates | Foreign key constraint prevents orphaned records; cascade executes atomically | Soft delete option available via `deletedAt` timestamp |

## Error Matrix

| HTTP Status | Error Code | Scenario |
|-------------|------------|----------|
| — | MIGRATION_FAILED | Prisma migration cannot be applied due to data conflicts |
| — | SCHEMA_VALIDATION_ERROR | Generated TypeScript types don't match expected schema |
| — | CONSTRAINT_VIOLATION | Unique constraint or foreign key constraint violated |
| — | CONNECTION_ERROR | Database connection fails or times out |
| — | TYPE_GENERATION_FAILED | Prisma client generation fails due to schema errors |

## Acceptance Criteria

* **Schema Definition**: Prisma schema file contains Tenant, Project, and Estimate models with all required fields and proper data types.
* **Relationship Integrity**: Foreign key relationships established with CASCADE delete from Tenant → Project → Estimate.
* **Index Performance**: Composite index `(projectId, version DESC)` created for fast estimate version queries; tenant index on `tenantId` for project filtering.
* **Type Safety**: Prisma generates valid TypeScript types that match schema exactly with no compilation errors.
* **Migration Success**: Initial migration applies cleanly to empty PostgreSQL database and can be rolled back without data loss.
* **Data Precision**: Financial calculations use Decimal types (12,2 for currency, 10,2 for hours) preventing floating-point precision errors.
* **JSON Flexibility**: `parsedData` and `rateCard` fields accept valid JSON objects up to 1MB without schema enforcement.
* **Unique Constraints**: `(projectId, version)` uniqueness enforced preventing duplicate estimate versions within same project.
* **Cascade Behavior**: Deleting a tenant removes all associated projects and estimates; deleting a project removes all estimates.
* **Connection Pooling**: Database connection pool configured with max 10 connections for optimal performance under load.
