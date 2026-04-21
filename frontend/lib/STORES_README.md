# Per-Resource Stores Documentation

This document explains how to use the per-resource stores (organizationsStore, studentsStore, teachersStore, coursesStore, sectionsStore) with `usePaginatedData.ts`.

## Overview

The stores provide a caching layer on top of `usePaginatedData.ts` to improve performance and reduce redundant API calls. All stores are created using the `createResourceStore` factory function with different configurations:

- **organizationsStore**: 3-minute TTL auto-invalidation, no mutation-based invalidation (admin portal)
- **studentsStore**: Mutation-based invalidation (INSERT/UPDATE/DELETE)
- **teachersStore**: Mutation-based invalidation (INSERT/UPDATE/DELETE)
- **coursesStore**: Mutation-based invalidation (INSERT/UPDATE/DELETE)
- **sectionsStore**: Mutation-based invalidation (INSERT/UPDATE/DELETE)

## Store Implementation

All stores are created using the `createResourceStore` factory function:

```typescript
import { createResourceStore } from './createResourceStore';
import { Student } from '@/types';

export const studentsStore = createResourceStore<Student>("students", {
  invalidateOnMutation: true
});

export const teachersStore = createResourceStore<Teacher>("teachers", {
  invalidateOnMutation: true
});

export const coursesStore = createResourceStore<Course>("courses", {
  invalidateOnMutation: true
});

export const sectionsStore = createResourceStore<Section>("sections", {
  invalidateOnMutation: true
});

export const organizationsStore = createResourceStore<Organization>("organizations", {
  ttl: 180000, // 3 minutes
  invalidateOnMutation: false
});
```

## Integration with usePaginatedData.ts

The stores are integrated with `usePaginatedData.ts` through the optional `store` parameter:

```typescript
import { usePaginatedData } from '@/hooks/usePaginatedData';
import { studentsStore } from '@/lib/studentsStore';
import { api } from '@/lib/api';

// In your component
const { data, loading, updateParams, refresh, invalidate } = usePaginatedData(
    (params) => api.org.getStudents(token, params),
    { page: 1, limit: 10 },
    'students',
    { 
        enabled: !!token,
        store: studentsStore  // Pass the store to enable caching
    }
);
```

## Store Configuration Options

The `createResourceStore` factory accepts the following options:

```typescript
interface ResourceStoreOptions {
    ttl?: number; // Time-to-live in milliseconds for auto-invalidation
    invalidateOnMutation?: boolean; // Whether to invalidate on mutations (default: true)
}
```

### organizationsStore (Special Case)

- **TTL**: 3 minutes (180,000 ms)
- **Auto-invalidation**: Data older than 3 minutes is automatically refetched
- **Manual invalidation**: Only required when explicitly forced (e.g., refresh button or admin action)
- **Use case**: Admin portal where data needs to stay relatively fresh but not real-time

```typescript
import { organizationsStore } from '@/lib/organizationsStore';

// Usage in admin component
const { data, loading, updateParams, refresh } = usePaginatedData(
    (params) => api.admin.getOrganizations(token, params),
    { page: 1, limit: 10, status: 'PENDING' },
    'organizations',
    { 
        enabled: !!token,
        store: organizationsStore
    }
);

// Force refresh (e.g., after manual approval/rejection)
const handleForceRefresh = () => {
    organizationsStore.invalidate();
    refresh();
};
```

### studentsStore, teachersStore, coursesStore, sectionsStore

- **TTL**: None (data persists until invalidated)
- **Invalidation**: Entire store is invalidated on INSERT/UPDATE/DELETE operations
- **Pagination**: Stores multiple pages separately
- **Use case**: Organization data that should reflect latest changes after mutations

```typescript
import { studentsStore } from '@/lib/studentsStore';

// Usage in students list component
const { data, loading, updateParams, refresh, invalidate } = usePaginatedData(
    (params) => api.org.getStudents(token, params),
    { page: 1, limit: 10 },
    'students',
    { 
        enabled: !!token,
        store: studentsStore
    }
);

// After creating a student - invalidate the entire store
const handleCreateStudent = async (studentData: CreateStudentRequest) => {
    await api.org.createStudent(studentData, token);
    studentsStore.invalidate();  // Invalidate entire store
    refresh();  // Force refetch
};

// After updating a student - invalidate the entire store
const handleUpdateStudent = async (id: string, studentData: UpdateStudentRequest) => {
    await api.org.updateStudent(id, studentData, token);
    studentsStore.invalidate();  // Invalidate entire store
    refresh();  // Force refetch
};

// After deleting a student - invalidate the entire store
const handleDeleteStudent = async (id: string) => {
    await api.org.deleteStudent(id, token);
    studentsStore.invalidate();  // Invalidate entire store
    refresh();  // Force refetch
};
```

## Store Methods

All stores provide the following methods:

### `get(params: BasePaginationParams): PaginatedResponse<T> | null`
Retrieves cached data for specific parameters. Returns `null` if not cached.

### `set(params: BasePaginationParams, data: PaginatedResponse<T>): void`
Stores data for specific parameters. Stores multiple pages separately without overwriting.

### `hasData(params: BasePaginationParams): boolean` (students/teachers/courses/sections)
Checks if data is cached for given parameters.

### `hasFreshData(params: BasePaginationParams): boolean` (organizations only)
Checks if data is cached and not expired (within 3-minute TTL).

### `invalidate(): void`
Invalidates the entire store cache. Called on INSERT/UPDATE/DELETE operations for mutation-based stores.

### `invalidateParams(params: BasePaginationParams): void`
Invalidates a specific cache entry by parameters.

### `subscribe(fn: () => void): () => void`
Subscribe to store changes. Returns an unsubscribe function.

### `clear(): void`
Clears all cached data (e.g., on logout).

### `getAllCachedPages(): Record<CacheKey, PaginatedResponse<T>>`
Returns all cached pages (for debugging/inspection).

### `getCacheSize(): number`
Returns the number of cached pages.

## Pagination Behavior

The stores are designed to work seamlessly with pagination:

1. **Multiple pages**: Each page is cached separately by its parameters
2. **No overwriting**: Previous pages are not overwritten when navigating to new pages
3. **Instant navigation**: Switching between cached pages is instant
4. **Selective fetching**: Only missing pages are fetched from the API

```typescript
// Page 1 is fetched and cached
updateParams({ page: 1 });

// Navigate to page 2 - fetched and cached
updateParams({ page: 2 });

// Navigate back to page 1 - instant (from cache)
updateParams({ page: 1 });

// Navigate to page 3 - fetched and cached
updateParams({ page: 3 });

// All three pages are now cached and can be navigated instantly
```

## Complete Example: Students Management

```typescript
'use client';

import { usePaginatedData } from '@/hooks/usePaginatedData';
import { studentsStore } from '@/lib/studentsStore';
import { api } from '@/lib/api';
import { useState } from 'react';

export default function StudentsList({ token }: { token: string }) {
    const [searchTerm, setSearchTerm] = useState('');

    const { data, loading, updateParams, refresh, invalidate } = usePaginatedData(
        (params) => api.org.getStudents(token, params),
        { page: 1, limit: 10, search: searchTerm },
        'students',
        { 
            enabled: !!token,
            store: studentsStore
        }
    );

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        updateParams({ search: term, page: 1 });  // Reset to page 1 on search
    };

    const handleCreateStudent = async (studentData: CreateStudentRequest) => {
        try {
            await api.org.createStudent(studentData, token);
            studentsStore.invalidate();  // Invalidate entire store
            refresh();  // Force refetch
        } catch (error) {
            console.error('Failed to create student:', error);
        }
    };

    const handleUpdateStudent = async (id: string, studentData: UpdateStudentRequest) => {
        try {
            await api.org.updateStudent(id, studentData, token);
            studentsStore.invalidate();  // Invalidate entire store
            refresh();  // Force refetch
        } catch (error) {
            console.error('Failed to update student:', error);
        }
    };

    const handleDeleteStudent = async (id: string) => {
        try {
            await api.org.deleteStudent(id, token);
            studentsStore.invalidate();  // Invalidate entire store
            refresh();  // Force refetch
        } catch (error) {
            console.error('Failed to delete student:', error);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <input 
                type="text" 
                placeholder="Search students..."
                onChange={(e) => handleSearch(e.target.value)}
                value={searchTerm}
            />
            
            <ul>
                {data?.data.map((student) => (
                    <li key={student.id}>
                        {student.user.name}
                        <button onClick={() => handleUpdateStudent(student.id, {})}>
                            Edit
                        </button>
                        <button onClick={() => handleDeleteStudent(student.id)}>
                            Delete
                        </button>
                    </li>
                ))}
            </ul>

            <button 
                onClick={() => updateParams({ page: (data?.currentPage || 1) - 1 })}
                disabled={!data || data.currentPage <= 1}
            >
                Previous
            </button>
            <span>Page {data?.currentPage} of {data?.totalPages}</span>
            <button 
                onClick={() => updateParams({ page: (data?.currentPage || 1) + 1 })}
                disabled={!data || data.currentPage >= data.totalPages}
            >
                Next
            </button>
        </div>
    );
}
```

## Migration Guide

### Before (without store)
```typescript
const { data, loading, updateParams, refresh } = usePaginatedData(
    (params) => api.org.getStudents(token, params),
    { page: 1, limit: 10 },
    'students',
    { enabled: !!token }
);
```

### After (with store)
```typescript
import { studentsStore } from '@/lib/studentsStore';

const { data, loading, updateParams, refresh, invalidate } = usePaginatedData(
    (params) => api.org.getStudents(token, params),
    { page: 1, limit: 10 },
    'students',
    { 
        enabled: !!token,
        store: studentsStore  // Add store parameter
    }
);

// After mutations, invalidate the store
await api.org.createStudent(studentData, token);
studentsStore.invalidate();
refresh();
```

## Creating Custom Stores

You can create additional resource stores using the `createResourceStore` factory function:

```typescript
import { createResourceStore } from './createResourceStore';
import { YourEntityType } from '@/types';

// Mutation-based invalidation (default)
export const yourStore = createResourceStore<YourEntityType>("your-resource", {
  invalidateOnMutation: true
});

// TTL-based auto-invalidation
export const yourStore = createResourceStore<YourEntityType>("your-resource", {
  ttl: 300000, // 5 minutes
  invalidateOnMutation: false
});

// No invalidation (persistent cache)
export const yourStore = createResourceStore<YourEntityType>("your-resource", {
  invalidateOnMutation: false
});
```

## Important Rules

1. **usePaginatedData.ts remains the ONLY fetching engine** - Stores do not fetch data directly
2. **Stores act as caching + state layer ONLY** - They cache results from usePaginatedData.ts
3. **Do NOT duplicate fetch logic inside stores** - All fetching must go through usePaginatedData.ts
4. **Invalidate on mutations** - Call `store.invalidate()` after INSERT/UPDATE/DELETE operations (for stores with `invalidateOnMutation: true`)
5. **Organizations auto-invalidate** - organizationsStore automatically refetches after 3 minutes
6. **Backward compatible** - Existing code without stores continues to work unchanged

## Performance Benefits

- **Reduced API calls**: Cached pages are served instantly
- **Faster navigation**: Switching between previously visited pages is instant
- **Optimal freshness**: Organizations update every 3 minutes automatically
- **Mutation-aware**: Other stores invalidate immediately on data changes
- **Session-scoped**: Cache persists during the session for better UX
