# useSWR Migration Plan

## Overview
This plan migrates the frontend from useEffect-based data fetching to useSWR, providing automatic caching, deduplication, revalidation, and better race condition handling.

---

## Phase 0: Setup

### 0.1 Install Dependencies
```bash
npm install swr
```

### 0.2 Create SWRProvider with Global Config
**File:** `frontend/components/providers/SWRProvider.tsx`

Create a provider that:
- Uses the existing auth token from `useAuth()`
- Configures global SWR options (refreshInterval, error retry, etc.)
- Implements the fetcher using the existing `api.ts` functions
- Handles 401 errors consistently with the existing unauthorizedHandler

**Key Configuration:**
- `refreshInterval`: 30000 (30 seconds for live data)
- `revalidateOnFocus`: true
- `errorRetryCount`: 3
- `dedupingInterval`: 2000 (SWR's built-in deduplication)

### 0.3 Wrap the App
**File:** `frontend/app/layout.tsx`

Add SWRProvider around the application root.

### 0.4 Define Null Key Pattern
Create a convention for conditional fetching:
```typescript
// Use null key when token is not available
const { data } = useSWR(
  token ? ['students', params] : null,
  fetcher
);
```

---

## Phase 1: Highest Priority - Pagination/Filter Components

These components are most vulnerable to race conditions due to rapid state changes (typing, pagination clicks).

### Phase 1.1: app/(org)/sections/page.tsx
**Complexity:** Medium
**Dependencies:** None

**Current Implementation:**
- Uses `usePaginatedData` hook with search, sortBy, sortOrder, page, my filter
- URL state managed via `useSearchParams`
- External store: `sectionsStore`

**Migration Steps:**
1. Replace `usePaginatedData` with `useSWR`
2. SWR Key: `['sections', { page, limit: pageSize, search, sortBy, sortOrder, my }]`
3. Fetcher: `(key) => api.org.getSections(token!, key[1])`
4. Null key condition: `!token`
5. Mutate needed: Yes, after `createSection`, `updateSection`, `deleteSection`

**Notes:**
- Remove `sectionsStore.invalidate()` pattern, use SWR's `mutate()` instead
- Keep URL state management as-is
- Remove manual `refresh()` calls, SWR handles this

---

### Phase 1.2: app/(org)/students/page.tsx
**Complexity:** Medium
**Dependencies:** None

**Current Implementation:**
- Uses `usePaginatedData` with search, sort, page, my filter, sectionId filter
- Secondary fetch for sections list (for filter dropdown)

**Migration Steps:**
1. **Primary fetch (students):**
   - SWR Key: `['students', { page, limit: pageSize, search, sortBy, sortOrder, my, sectionId }]`
   - Fetcher: `(key) => api.org.getStudents(token!, key[1])`
   - Null key: `!token`
   
2. **Secondary fetch (sections for filter):**
   - SWR Key: `token && (user?.role === Role.TEACHER || user?.role === Role.ORG_MANAGER) ? ['teacher-sections', { my: true, limit: 100 }] : null`
   - Fetcher: `(key) => api.org.getSections(token!, key[1])`

**Mutate needed:** After `createStudent`, `updateStudent`, `deleteStudent`

---

### Phase 1.3: app/(org)/teachers/page.tsx
**Complexity:** Low
**Dependencies:** None

**Current Implementation:**
- Uses `usePaginatedData` with search, sort, page
- Role guard redirects in useEffect

**Migration Steps:**
1. SWR Key: `['teachers', { page, limit: pageSize, search, sortBy, sortOrder }]`
2. Fetcher: `(key) => api.org.getTeachers(token!, key[1])`
3. Null key: `!token`
4. Keep role redirect useEffect as-is (not a data fetch)

**Mutate needed:** After `createTeacher`, `updateTeacher`, `deleteTeacher`

---

### Phase 1.4: app/(org)/courses/page.tsx
**Complexity:** Low
**Dependencies:** None

**Current Implementation:**
- Uses `usePaginatedData` with search, sort, page, my filter

**Migration Steps:**
1. SWR Key: `['courses', { page, limit: pageSize, search, sortBy, sortOrder, my }]`
2. Fetcher: `(key) => api.org.getCourses(token!, key[1])`
3. Null key: `!token`

**Mutate needed:** After `createCourse`, `updateCourse`, `deleteCourse`

---

### Phase 1.5: app/admin/organizations/page.tsx
**Complexity:** High
**Dependencies:** None

**Current Implementation:**
- Uses `usePaginatedData` with status, type, search, sort, page filters
- Complex filter UI with status tabs and type dropdown
- Stats refresh after mutations

**Migration Steps:**
1. SWR Key: `['admin-organizations', { page, limit: pageSize, search, sortBy, sortOrder, status, type }]`
2. Fetcher: `(key) => api.admin.getOrganizations(token!, { ...key[1], status: key[1].status === 'ALL' ? undefined : key[1].status })`
3. Null key: `!token`

**Mutate needed:** 
- After `approveOrganization` → mutate organizations + stats
- After `rejectOrganization` → mutate organizations + stats  
- After `suspendOrganization` → mutate organizations + stats

**Notes:**
- Status filter requires mapping 'ALL' to undefined for API
- Stats mutation: `mutate(['admin-stats'])` or use global state dispatch

---

### Phase 1.6: app/admin/platform-admins/page.tsx
**Complexity:** Low
**Dependencies:** None

**Current Implementation:**
- Uses `usePaginatedData` with search, sort, page

**Migration Steps:**
1. SWR Key: `['platform-admins', { page, limit: pageSize, search, sortBy, sortOrder }]`
2. Fetcher: `(key) => api.admin.getPlatformAdmins(token!, key[1])`
3. Null key: `!token`

**Mutate needed:** After `createPlatformAdmin`, `updatePlatformAdmin`, `deletePlatformAdmin`

---

### Phase 1.7: app/(org)/mail/page.tsx
**Complexity:** High
**Dependencies:** Socket integration

**Current Implementation:**
- Custom `useCallback` fetch with search, page, status filter
- Socket-based live updates with debounced refresh
- Global stats sync after fetch

**Migration Steps:**
1. SWR Key: `['mails', { page, limit: pageSize, search, status: statusFilter || undefined }]`
2. Fetcher: `async (key) => {
     const [data, stats] = await Promise.all([
       api.mail.getMails(token!, key[1]),
       api.mail.getUnreadCount(token)
     ]);
     dispatch({ type: 'STATS_SET_MAIL', payload: stats });
     return data;
   }`
3. Null key: `!token`

**Special Considerations:**
- Socket events should call `mutate(['mails'])` instead of custom refresh logic
- Remove debounce timer logic, rely on SWR's deduping
- Stats dispatch should happen in fetcher

---

## Phase 2: Medium Priority - Simple List/Detail Pages

### Phase 2.1: app/(org)/grades/page.tsx
**Complexity:** Low
**Dependencies:** None

**Current Implementation:**
- Simple useCallback fetch for sections
- Search filter on client-side

**Migration Steps:**
1. SWR Key: `token && user ? ['sections-for-grades', { my: user.role === Role.TEACHER }] : null`
2. Fetcher: `(key) => api.org.getSections(token!, key[1])`
3. Null key: `!token || !user`

**Notes:**
- Client-side search stays as-is
- No mutations in this component

---

### Phase 2.2: app/(org)/schedules/page.tsx
**Complexity:** High
**Dependencies:** Chained fetches

**Current Implementation:**
- **CHAINED FETCH PATTERN**: Fetches sections first, then fetches schedules for each section
- Uses `Promise.all` to parallelize dependent fetches

**Migration Steps:**
1. **Primary fetch (sections):**
   - SWR Key: `['sections-for-schedules', { limit: 100 }]`
   - Null key: `!token`

2. **Dependent fetches (schedules per section):**
   - Use SWR's dependent fetching pattern with multiple keys
   - Key: `sectionsData ? ['schedules', sectionId] : null` for each section
   - Or use a single key with array of section IDs

**Alternative Approach:**
Consider creating a new API endpoint `GET /org/sections-with-schedules` to avoid N+1 requests.

**Complexity Reason:** This is a dependent fetch pattern that SWR handles well with conditional keys, but it's more complex than simple useSWR calls.

---

### Phase 2.3: app/(org)/sections/[id]/assessments/[assessmentId]/page.tsx
**Complexity:** Medium
**Dependencies:** Parallel data fetching

**Current Implementation:**
- Parallel fetch of assessment, section, grades, submissions
- Resource validation pattern

**Migration Steps:**
1. Create a composite SWR key for parallel fetching:
   - SWR Key: `token && sectionId && assessmentId ? ['assessment-detail', sectionId, assessmentId] : null`
   
2. Fetcher:
   ```typescript
   async ([, sectionId, assessmentId]) => {
     const [assessment, section, grades, submissions] = await Promise.all([
       api.org.getAssessment(assessmentId, token!),
       api.org.getSection(sectionId, token!),
       api.org.getGrades(assessmentId, token!),
       api.org.getSubmissions(assessmentId, token!)
     ]);
     return { assessment, section, grades, submissions };
   }
   ```

**Mutate needed:** After `createGrade`, `updateGrade`, `createSubmission`

---

### Phase 2.4: app/(org)/students/edit/[id]/page.tsx
**Complexity:** Low
**Dependencies:** None

**Current Implementation:**
- Single student detail fetch on mount
- Role-based access control

**Migration Steps:**
1. SWR Key: `token && studentId ? ['student', studentId] : null`
2. Fetcher: `(key) => api.org.getStudent(key[1], token!)`
3. Null key: `!token || !studentId`

**Notes:**
- Role guard stays as-is (redirect if not authorized)
- No mutations in this component (form submission handled separately)

---

### Phase 2.5: app/(org)/teachers/edit/[id]/page.tsx
**Complexity:** Low
**Dependencies:** None

**Same pattern as 2.4:**
1. SWR Key: `token && teacherId ? ['teacher', teacherId] : null`
2. Fetcher: `(key) => api.org.getTeacher(key[1], token!)`

---

### Phase 2.6: app/(org)/course-materials/[id]/page.tsx
**Complexity:** Low
**Dependencies:** None

**Current Implementation:**
- Single section fetch

**Migration Steps:**
1. SWR Key: `token && sectionId ? ['section-materials', sectionId] : null`
2. Fetcher: `(key) => api.org.getSection(key[1], token!)`

---

### Phase 2.7: app/(org)/sections/[id]/page.tsx
**Complexity:** Low
**Dependencies:** None

**Current Implementation:**
- Single section detail fetch

**Migration Steps:**
1. SWR Key: `token && id ? ['section-detail', id] : null`
2. Fetcher: `(key) => api.org.getSection(key[1], token!)`

---

## Phase 3: Lowest Priority - Dashboards and Complex Pages

### Phase 3.1: app/(org)/overview/page.tsx
**Complexity:** Low
**Dependencies:** None

**Current Implementation:**
- Single insights fetch

**Migration Steps:**
1. SWR Key: `token ? ['insights'] : null`
2. Fetcher: `() => api.org.getInsights(token!)`
3. Consider adding `refreshInterval: 30000` for live dashboard feel

---

### Phase 3.2: app/(org)/students/[userId]/page.tsx
**Complexity:** High
**Dependencies:** Multiple parallel fetches + validation logic

**Current Implementation:**
1. Validation fetch (`getStudentByUserId`) - blocks other fetches
2. Authorization logic with redirects
3. Parallel data fetch (sections, grades, assessments, insights)

**Migration Steps:**

**Step 1: Validation fetch (blocking)**
```typescript
const { data: student, error: studentError } = useSWR(
  token && params.userId ? ['validate-student', params.userId] : null,
  (key) => api.org.getStudentByUserId(key[1], token!),
  { suspense: false }
);
```

**Step 2: Authorization effect (keep as-is, slightly modified)**
```typescript
useEffect(() => {
  if (!student || !user) return;
  // ... authorization logic with router.replace()
}, [student, user]);
```

**Step 3: Data fetches (parallel, conditional on authorization passing)**
```typescript
const shouldFetchData = student && user?.role === Role.STUDENT && user.id === params.userId;

const { data: sectionsData } = useSWR(
  shouldFetchData ? ['student-sections', { my: true }] : null,
  (key) => api.org.getSections(token!, key[1])
);

const { data: grades } = useSWR(
  shouldFetchData ? ['student-grades', user.id] : null,
  (key) => api.org.getStudentFinalGrades(token!, key[1])
);

const { data: assessments } = useSWR(
  shouldFetchData ? ['student-assessments', {}] : null,
  (key) => api.org.getAssessments(token!, key[1])
);

const { data: insights } = useSWR(
  shouldFetchData ? ['student-insights'] : null,
  () => api.org.getInsights(token!)
);
```

**Complexity Reason:** 
- Validation must complete before other fetches
- Authorization can trigger redirect
- Need to coordinate multiple SWR hooks

---

### Phase 3.3: app/(org)/teachers/[userId]/page.tsx
**Complexity:** High
**Dependencies:** Chained fetches (validation → insights)

**Current Implementation:**
1. Validation fetch (`getTeacherByUserId`)
2. Authorization check
3. Insights fetch (only if viewing own profile)

**Migration Steps:**

**Step 1: Validation fetch**
```typescript
const { data: teacher, error: teacherError } = useSWR(
  token && userId ? ['validate-teacher', userId] : null,
  (key) => api.org.getTeacherByUserId(key[1], token!)
);
```

**Step 2: Authorization effect**
Keep existing authorization logic that redirects admins to edit page.

**Step 3: Insights fetch (conditional)**
```typescript
const shouldFetchInsights = teacher && user?.id === userId;

const { data: insights } = useSWR(
  shouldFetchInsights ? ['teacher-insights'] : null,
  () => api.org.getInsights(token!)
);
```

**Complexity Reason:**
- Insights fetch depends on validation result
- Authorization can trigger redirect before insights fetch

---

### Phase 3.4: app/(org)/students/[userId]/_components/Assessments.tsx
**Complexity:** Low
**Dependencies:** None (receives data via props)

**Current Implementation:**
- Client-side filtering only (search, section filter)
- No server fetches

**Migration Decision:**
**SKIP** - This component doesn't make API calls, it only filters props.

---

### Phase 3.5: app/(org)/students/[userId]/_components/Attendance.tsx
**Complexity:** High
**Dependencies:** Chained fetches

**Current Implementation:**
1. Primary fetch: `getStudentAttendance` (for overview cards)
2. **CHAINED FETCH**: `getSectionAttendanceRange` when `selectedSectionId` changes

**Migration Steps:**

**Step 1: Primary fetch**
```typescript
const { data: records, mutate: mutateAttendance } = useSWR(
  token && user?.role === Role.STUDENT ? ['student-attendance', user.id] : null,
  (key) => api.org.getStudentAttendance(key[1], token!)
);
```

**Step 2: Dependent fetch (chained)**
```typescript
const { data: rangeData } = useSWR(
  token && selectedSectionId ? ['section-attendance-range', selectedSectionId] : null,
  async (key) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    return api.org.getSectionAttendanceRange(key[1], start, end, token!);
  }
);
```

**Complexity Reason:**
- Second fetch depends on `selectedSectionId` state
- This is a classic dependent fetch pattern

---

### Phase 3.6: app/(org)/students/[userId]/_components/Courses.tsx
**Complexity:** Medium
**Dependencies:** Props-based iteration

**Current Implementation:**
- Fetches materials count for each section in parallel
- Depends on `sections` prop from parent

**Migration Steps:**

**Option 1: Keep as-is (simple useEffect)**
This is a reasonable use of useEffect - it's triggered by prop changes and makes N parallel calls.

**Option 2: Use SWR with multiple keys**
```typescript
const materialKeys = sections.map(s => ['section-materials-count', s.id, token]);
const { data: materialCounts } = useSWR(
  token && sections.length > 0 ? materialKeys : null,
  async (keys) => {
    const counts: Record<string, number> = {};
    await Promise.all(
      keys.map(async (key) => {
        const sectionId = key[1];
        try {
          const materials = await api.courseMaterials.getMaterials(sectionId, token!);
          counts[sectionId] = materials.length;
        } catch {
          counts[sectionId] = 0;
        }
      })
    );
    return counts;
  }
);
```

**Recommendation:** Option 1 (keep as-is) - The useEffect pattern here is clean and SWR doesn't add significant value for this N+1 query pattern.

---

## Phase 4: Final Cleanup

### 4.1 Remove inFlightRequests from api.ts

**File:** `frontend/lib/api.ts`

**Remove:**
```typescript
// --- FIX 1: In-flight GET request deduplication ---
const inFlightRequests = new Map<string, Promise<unknown>>();
// ... all deduplication logic in request() function
```

**Reason:** SWR provides built-in deduplication with configurable `dedupingInterval`.

---

### 4.2 Remove AbortController signal threading (if not needed elsewhere)

**File:** `frontend/lib/api.ts`

**Decision:** Keep `signal` parameter in `RequestOptions` but remove automatic AbortController creation. SWR manages request cancellation internally.

**Cleanup:**
- Remove any manually created AbortControllers in components
- Keep the `signal` option for cases where components explicitly need cancellation

---

### 4.3 Remove usePaginatedData hook

**File:** `frontend/hooks/usePaginatedData.ts`

**After all migrations complete, delete this file.**

SWR replaces all functionality:
- Caching → SWR's cache
- Pagination → Key array with params
- Refresh → `mutate()`
- Loading states → `isLoading`, `isValidating`

---

### 4.4 Verification Checklist

- [ ] No raw `useEffect` with `async` functions for data fetching
- [ ] All `fetchData` useCallback patterns replaced with `useSWR`
- [ ] All `isLoading` states use SWR's `isLoading` or `isValidating`
- [ ] All `refresh()` calls replaced with `mutate()` from useSWR
- [ ] No components import `usePaginatedData`
- [ ] `inFlightRequests` map removed from api.ts
- [ ] Tests pass (if any exist)
- [ ] No regression in pagination/filter behavior
- [ ] No regression in mutation → list refresh behavior

---

## Appendix: SWR Key Naming Convention

| Resource | Key Pattern |
|----------|-------------|
| Paginated Lists | `['resource-name', { page, limit, search, sortBy, sortOrder, ...filters }]` |
| Single Items | `['resource-name', id]` |
| Validation lookups | `['validate-resource', userId]` |
| Nested data | `['parent-resource', parentId, 'child-resource']` |
| Dashboard/Insights | `['insights']` or `['resource-insights']` |

## Appendix: Common Fetcher Patterns

```typescript
// Standard fetcher with token from context
const fetcher = ([endpoint, params]: [string, object]) => 
  api.org[endpoint](token!, params);

// Composite fetcher for parallel requests
const compositeFetcher = async (keys: string[][]) => {
  const results = await Promise.all(
    keys.map(key => api.org[key[0]](token!, key[1]))
  );
  return results;
};

// Fetcher with error handling
const safeFetcher = async (key: string[]) => {
  try {
    return await api.org[key[0]](token!, key[1]);
  } catch (error) {
    // SWR will handle the error state
    throw error;
  }
};
```

---

## Summary Table

| Phase | Component | Complexity | Has Mutations | Key Pattern |
|-------|-----------|------------|---------------|-------------|
| 1.1 | sections/page.tsx | Medium | Yes | `['sections', params]` |
| 1.2 | students/page.tsx | Medium | Yes | `['students', params]`, `['teacher-sections']` |
| 1.3 | teachers/page.tsx | Low | Yes | `['teachers', params]` |
| 1.4 | courses/page.tsx | Low | Yes | `['courses', params]` |
| 1.5 | admin/organizations/page.tsx | High | Yes | `['admin-organizations', params]` |
| 1.6 | admin/platform-admins/page.tsx | Low | Yes | `['platform-admins', params]` |
| 1.7 | mail/page.tsx | High | Yes | `['mails', params]` |
| 2.1 | grades/page.tsx | Low | No | `['sections-for-grades', params]` |
| 2.2 | schedules/page.tsx | High | No | `['sections-for-schedules']`, N×`['schedules', id]` |
| 2.3 | sections/[id]/assessments/[assessmentId]/page.tsx | Medium | Yes | `['assessment-detail', sectionId, assessmentId]` |
| 2.4 | students/edit/[id]/page.tsx | Low | No | `['student', id]` |
| 2.5 | teachers/edit/[id]/page.tsx | Low | No | `['teacher', id]` |
| 2.6 | course-materials/[id]/page.tsx | Low | No | `['section-materials', id]` |
| 2.7 | sections/[id]/page.tsx | Low | No | `['section-detail', id]` |
| 3.1 | overview/page.tsx | Low | No | `['insights']` |
| 3.2 | students/[userId]/page.tsx | High | No | Multiple dependent keys |
| 3.3 | teachers/[userId]/page.tsx | High | No | Multiple dependent keys |
| 3.5 | students/[userId]/_components/Attendance.tsx | High | No | `['student-attendance', id]`, `['section-attendance-range', id]` |
