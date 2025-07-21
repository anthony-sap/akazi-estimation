# Slice 03: List Projects

## Goal
Provide a project-listing feature that shows every project belonging to the authenticated tenant user, including project metadata (name, creation/updated dates), latest-estimate metrics, and basic controls (search, sort, navigation). Listing must enforce tenant isolation and load in < 1 s for up to 100 projects.

## Implementation Steps
1. **API Endpoint – `GET /api/projects`**
   * **Environment Variables**: `DATABASE_URL`, `KINDE_DOMAIN`, `KINDE_AUDIENCE`
   * **Behavior Details**: Returns array  
     ```json
     [{
       "id":"proj_x",
       "name":"ACME Website",
       "createdAt":"2025-07-01T10:00:00Z",
       "updatedAt":"2025-07-18T12:00:00Z",
       "latestEstimate":{"version":4,"totalPrice":12844.0,"createdAt":"2025-07-18T11:59:00Z"},
       "estimateCount":4
     }]
     ```
     Rate-limit 30 req/min per IP.
   * **Invocation Points**: Called by React-query hook in `<ProjectList/>`.

2. **Tenant Context Middleware**
   * Extract `tenantId`,`userId` from Kinde session; set headers `x-tenant-id`,`x-user-id`.
   * Reject 401/403 on invalid context; cache session 5 min.

3. **Database Helper & Query**
   * `setTenantContext(tenantId)` → `SET app.current_tenant = $tenantId`.
   * Prisma query with tenant filter, include latest estimate & count.  
     Indexes: `(tenantId, updatedAt DESC)` and `(projectId, version DESC)`.

4. **React Components**
   * `<ProjectControls/>` – search, sort dropdown, asc/desc toggle.
   * `<ProjectList/>` – data fetch, loading/error/empty states.
   * `<ProjectCard/>` – name, dates, latest estimate (price+version), estimate count, “View Estimates” & “New Estimate” buttons.
   * Responsive grid: `sm:1 lg:2 xl:3` cols.

5. **Caching & Optimistic Updates**
   * React-query options `staleTime: 5 min`; `useOptimisticProjects()` to update cache instantly after create/update.

## Rules & Flow
| Rule | Description | Data / Schema Constraints | Failure / Retry | Security / Throttling |
|------|-------------|---------------------------|-----------------|-----------------------|
| R1 | Auth required | Valid Kinde JWT & org membership | 401 UNAUTHORIZED → login | 100 req/min per IP (auth) |
| R2 | Tenant isolation | Header `x-tenant-id` must match session & DB RLS | 403 FORBIDDEN; audit log | Postgres RLS filters by `app.current_tenant` |
| R3 | Search limits | Query ≤ 64 chars; case-insensitive name LIKE | 400 BAD_REQUEST if too long | Escaped wildcards |
| R4 | Sort params | `sortBy`∈{name,created,updated}; `sortOrder`∈{asc,desc} | Defaults updated desc | Invalid → 400 BAD_REQUEST |
| R5 | Pagination ready | Page size default 20, max 50 (future) | Clamp >50 to 50 | TBD rate-limit for heavy queries |

## Acceptance Criteria
* API `GET /api/projects` returns only projects where `tenantId` equals current tenant; cross-tenant attempt returns empty list.
* Response schema matches sample JSON with fields `id,name,createdAt,updatedAt,latestEstimate,estimateCount`.
* UI shows search, sort, empty, error, and loading states; mobile view renders single-column grid ≤ 375 px.
* Search filters projects case-insensitively and responds in < 200 ms for 100 projects.
* Sort toggle re-queries API and re-renders without full-page reload.
* Unauthorized requests receive 401; missing tenant context receives 403.
* Lighthouse performance score ≥ 90 on `/projects` route.
* Jest integration test validates tenant isolation and correct response schema.

## Overview
Create a comprehensive project listing interface that displays all projects for the authenticated user's tenant. This includes implementing the API endpoint, UI components, and tenant-aware filtering to provide users with a clear overview of their estimation projects.

## Business Context
Users need to quickly see all their estimation projects in one place to navigate between different client projects and estimates. The listing should be fast, secure (tenant-isolated), and provide enough information for users to identify and select the right project.

## Technical Requirements

### API Implementation

#### Project Listing Endpoint
```typescript
// app/api/projects/route.ts
export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id');
  const userId = request.headers.get('x-user-id');
  
  if (!tenantId || !userId) {
    return new Response('Forbidden', { status: 403 });
  }
  
  // Set tenant context
  await setTenantContext(tenantId, prisma);
  
  const projects = await prisma.project.findMany({
    where: {
      tenantId,
      ownerUserId: userId
    },
    include: {
      estimates: {
        select: {
          id: true,
          version: true,
          createdAt: true,
          totalPrice: true
        },
        orderBy: { version: 'desc' },
        take: 1 // Latest estimate only
      },
      _count: {
        select: { estimates: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });
  
  return NextResponse.json(projects);
}
```

#### Query Optimizations
```typescript
// Optimized query with aggregated data
const projectsWithMetrics = await prisma.project.findMany({
  where: { tenantId },
  select: {
    id: true,
    name: true,
    createdAt: true,
    updatedAt: true,
    estimates: {
      select: {
        version: true,
        totalPrice: true,
        createdAt: true
      },
      orderBy: { version: 'desc' },
      take: 1
    },
    _count: {
      select: { estimates: true }
    }
  }
});
```

### Frontend Implementation

#### Project List Component
```typescript
// components/projects/ProjectList.tsx
interface ProjectListProps {
  searchQuery?: string;
  sortBy?: 'name' | 'updated' | 'created';
  sortOrder?: 'asc' | 'desc';
}

export function ProjectList({ 
  searchQuery = '', 
  sortBy = 'updated', 
  sortOrder = 'desc' 
}: ProjectListProps) {
  const { data: projects, error, isLoading } = useQuery({
    queryKey: ['projects', searchQuery, sortBy, sortOrder],
    queryFn: () => fetchProjects({ searchQuery, sortBy, sortOrder })
  });
  
  if (isLoading) return <ProjectListSkeleton />;
  if (error) return <ProjectListError error={error} />;
  if (!projects?.length) return <EmptyProjectsState />;
  
  return (
    <div className="space-y-4">
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
```

#### Project Card Component
```typescript
// components/projects/ProjectCard.tsx
interface ProjectCardProps {
  project: ProjectWithEstimates;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const latestEstimate = project.estimates[0];
  const estimateCount = project._count.estimates;
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">{project.name}</CardTitle>
          <CardDescription>
            Created {formatDistanceToNow(project.createdAt)} ago
          </CardDescription>
        </div>
        <Badge variant="secondary">
          {estimateCount} estimate{estimateCount !== 1 ? 's' : ''}
        </Badge>
      </CardHeader>
      
      <CardContent>
        {latestEstimate && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Latest estimate (v{latestEstimate.version})
            </span>
            <span className="font-medium">
              ${latestEstimate.totalPrice.toLocaleString()}
            </span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex gap-2">
        <Button asChild size="sm">
          <Link href={`/projects/${project.id}`}>
            View Estimates
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/projects/${project.id}/new-estimate`}>
            New Estimate
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### UI Features

#### Search and Filtering
```typescript
// components/projects/ProjectControls.tsx
export function ProjectControls() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'created'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  return (
    <div className="flex gap-4 mb-6">
      <div className="flex-1">
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <Select value={sortBy} onValueChange={setSortBy}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="updated">Last Updated</SelectItem>
          <SelectItem value="created">Date Created</SelectItem>
          <SelectItem value="name">Project Name</SelectItem>
        </SelectContent>
      </Select>
      
      <Button 
        variant="outline" 
        size="icon"
        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
      >
        {sortOrder === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />}
      </Button>
    </div>
  );
}
```

#### Empty State
```typescript
// components/projects/EmptyProjectsState.tsx
export function EmptyProjectsState() {
  return (
    <div className="text-center py-12">
      <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">
        No projects yet
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Create your first estimation project to get started.
      </p>
      <div className="mt-6">
        <Button asChild>
          <Link href="/projects/new">
            <PlusIcon className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>
    </div>
  );
}
```

## Data Flow

### Project List Data Structure
```typescript
interface ProjectWithEstimates {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  estimates: {
    id: string;
    version: number;
    totalPrice: number;
    createdAt: Date;
  }[];
  _count: {
    estimates: number;
  };
}
```

### Caching Strategy
```typescript
// lib/queries/projects.ts
export const projectsQueryOptions = {
  queryKey: ['projects'] as const,
  queryFn: fetchProjects,
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000,   // 10 minutes
};

// Optimistic updates for better UX
export function useOptimisticProjects() {
  const queryClient = useQueryClient();
  
  const updateProject = (projectId: string, updates: Partial<Project>) => {
    queryClient.setQueryData(['projects'], (old: Project[]) => 
      old?.map(p => p.id === projectId ? { ...p, ...updates } : p)
    );
  };
  
  return { updateProject };
}
```

## Implementation Details

### Performance Considerations
- **Pagination** for large project lists (implement when >50 projects)
- **Virtual scrolling** for very large lists
- **Optimistic updates** for immediate feedback
- **Background refetch** to keep data fresh
- **Proper indexing** on database queries

### Mobile Responsiveness
```typescript
// Responsive grid layout
<div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
  {projects.map(project => (
    <ProjectCard key={project.id} project={project} />
  ))}
</div>
```

### Accessibility
- **Keyboard navigation** through project cards
- **Screen reader** friendly labels and descriptions
- **Focus management** for better UX
- **High contrast** mode support

## Acceptance Criteria

### Functional Requirements
- [ ] Display all projects for authenticated user's tenant
- [ ] Show project name, creation date, and last updated
- [ ] Display latest estimate version and total price
- [ ] Show count of total estimates per project
- [ ] Provide search functionality across project names
- [ ] Enable sorting by name, creation date, or last updated
- [ ] Handle empty state with call-to-action

### Technical Requirements
- [ ] API endpoint properly filters by tenant ID
- [ ] Database queries optimized with proper indexes
- [ ] Data properly typed with TypeScript interfaces
- [ ] Error states handled gracefully
- [ ] Loading states provide good UX
- [ ] Responsive design works on all screen sizes

### Security Requirements
- [ ] Tenant isolation enforced at API level
- [ ] No cross-tenant data leakage possible
- [ ] Proper authentication required
- [ ] Input validation and sanitization

### Performance Requirements
- [ ] Page loads in <1 second with cached data
- [ ] Database queries complete in <200ms
- [ ] Smooth animations and transitions
- [ ] Efficient re-renders on data changes

## Dependencies
- Slice 01: Configure Database Schema
- Slice 02: Implement Multi-tenant Security

## Testing Strategy

### Unit Tests
```typescript
describe('ProjectList', () => {
  it('renders projects correctly', () => {
    render(<ProjectList />, { wrapper: QueryWrapper });
    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
  });
  
  it('handles empty state', () => {
    render(<ProjectList />, { 
      wrapper: QueryWrapper,
      initialData: []
    });
    expect(screen.getByText('No projects yet')).toBeInTheDocument();
  });
});
```

### Integration Tests
```typescript
describe('Projects API', () => {
  it('returns tenant-filtered projects', async () => {
    const response = await GET(mockRequest({ tenantId: 'tenant1' }));
    const projects = await response.json();
    
    projects.forEach(project => {
      expect(project.tenantId).toBe('tenant1');
    });
  });
});
```

## Error Handling
- Network errors with retry capability
- Authentication errors with redirect to login
- Authorization errors with proper messaging
- Data validation errors with specific feedback
- Loading timeouts with graceful degradation

## Future Enhancements
- **Bulk operations** (archive, delete multiple projects)
- **Project templates** for common estimation types
- **Advanced filtering** by date ranges, estimate values
- **Export functionality** for project lists
- **Collaborative features** showing team members
