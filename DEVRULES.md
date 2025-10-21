# Development Rules & Guidelines - Blinking Events Portal

**Version:** 1.0  
**Last Updated:** October 16, 2025  
**Project:** Blinking Events Admin Portal

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Redux Toolkit & RTK Query Rules](#redux-toolkit--rtk-query-rules)
3. [Firebase Integration](#firebase-integration)
4. [File Structure](#file-structure)
5. [Coding Standards](#coding-standards)
6. [Component Guidelines](#component-guidelines)
7. [State Management Rules](#state-management-rules)
8. [Cloudinary Storage Rules](#cloudinary-storage-rules)
9. [Error Handling](#error-handling)
10. [Testing Guidelines](#testing-guidelines)

---

## Architecture Overview

### Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **State Management:** Redux Toolkit + RTK Query
- **Backend:** Firebase (Firestore, Auth, Analytics) + Cloudinary (File Storage)
- **UI:** Tailwind CSS + Radix UI + shadcn/ui
- **Forms:** React Hook Form + Zod

### Architecture Principles

1. **All Firebase transactions MUST go through Redux RTK Query**
2. **No direct Firebase calls in components**
3. **Use typed hooks for all Redux operations**
4. **Server Components by default, Client Components when needed**
5. **Modular, reusable code structure**

---

## Redux Toolkit & RTK Query Rules

### 1. **NEVER Use Direct Firebase Calls in Components**

```typescript
// ❌ WRONG - Direct Firebase call in component
import { collection, getDocs } from "firebase/firestore";

function MyComponent() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, "events"));
      // ...
    };
    fetchData();
  }, []);
}

// ✅ CORRECT - Use RTK Query hooks
import { useGetEventsQuery } from "@/lib/redux/api/eventsApi";

function MyComponent() {
  const { data, isLoading, error } = useGetEventsQuery({});
}
```

### 2. **Always Use Typed Redux Hooks**

```typescript
// ❌ WRONG
import { useDispatch, useSelector } from "react-redux";

// ✅ CORRECT
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
```

### 3. **RTK Query Endpoint Structure**

Every Firebase collection MUST have its own API file with standard CRUD operations:

- `get[Entity]s` - Get all with optional filters
- `get[Entity]ById` - Get single by ID
- `create[Entity]` - Create new
- `update[Entity]` - Update existing
- `delete[Entity]` - Soft delete (set isActive: false)
- `hardDelete[Entity]` - Permanent delete (use cautiously)

### 4. **Query Naming Convention**

```typescript
// Query hooks
useGet[Entity]Query
useGet[Entity]ByIdQuery

// Mutation hooks
useCreate[Entity]Mutation
useUpdate[Entity]Mutation
useDelete[Entity]Mutation
```

### 5. **Cache Tags & Invalidation**

```typescript
// Always provide tags for caching
providesTags: (result) =>
  result
    ? [
        ...result.map(({ id }) => ({ type: "Events" as const, id })),
        { type: "Events", id: "LIST" },
      ]
    : [{ type: "Events", id: "LIST" }],

// Always invalidate appropriate tags
invalidatesTags: [{ type: "Events", id: "LIST" }],
```

---

## Firebase Integration

### 1. **Firebase Configuration**

- **Location:** `/lib/firebase/config.ts`
- **Exports:** `auth`, `db`, `storage`, `analytics`
- **NEVER** import Firebase services directly elsewhere
- **ALWAYS** import from config file

### 2. **Data Conversion**

All Firestore data MUST be converted using `convertFirestoreData()`:

```typescript
import { convertFirestoreData } from "@/lib/redux/api/firebaseApi";

const data = {
  id: doc.id,
  ...convertFirestoreData(doc.data()),
};
```

### 3. **Timestamps**

Always use `withTimestamp()` helper:

```typescript
// For new documents
const docData = withTimestamp(userData);

// For updates
const updateData = withTimestamp(userData, true);
```

---

## File Structure

```
lib/
├── firebase/
│   ├── config.ts           # Firebase initialization
│   └── storage.ts          # Storage operations
├── redux/
│   ├── api/
│   │   ├── firebaseApi.ts  # Base API setup
│   │   ├── usersApi.ts     # Users CRUD
│   │   ├── eventsApi.ts    # Events CRUD
│   │   ├── servicesApi.ts  # Services CRUD
│   │   ├── staffApi.ts     # Staff CRUD
│   │   ├── ordersApi.ts    # Orders CRUD
│   │   └── ...             # Other collections
│   ├── slices/
│   │   ├── authSlice.ts    # Auth state
│   │   └── ...             # Other slices
│   ├── store.ts            # Redux store config
│   ├── hooks.ts            # Typed hooks
│   └── provider.tsx        # Redux Provider
└── utils.ts                # Utility functions
```

---

## Coding Standards

### 1. **TypeScript**

- **ALWAYS** use TypeScript
- **NO** `any` types (use `unknown` if necessary, then type guard)
- **ALWAYS** define interfaces for data models
- Export interfaces from API files

### 2. **File Naming**

- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- API files: `[entity]Api.ts`
- Slices: `[entity]Slice.ts`

### 3. **Import Order**

```typescript
// 1. External libraries
import React from "react";
import { useQuery } from "@tanstack/react-query";

// 2. Internal absolute imports
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/lib/redux/hooks";

// 3. Relative imports
import { helper } from "./helpers";

// 4. Types
import type { User } from "@/lib/redux/api/usersApi";
```

---

## Component Guidelines

### 1. **Client vs Server Components**

```typescript
// Server Component (default)
async function ServerComponent() {
  // Can fetch data directly
  return <div>...</div>;
}

// Client Component (when needed)
("use client");

function ClientComponent() {
  // Use hooks, state, effects
  const { data } = useGetEventsQuery({});
  return <div>...</div>;
}
```

### 2. **When to Use Client Components**

- Using React hooks (useState, useEffect, etc.)
- Using Redux hooks
- Event handlers (onClick, onChange, etc.)
- Browser-only APIs
- Third-party libraries that require browser

### 3. **Component Structure**

```typescript
"use client"; // If needed

import { ... } from "...";

interface ComponentProps {
  // Props definition
}

export function ComponentName({ props }: ComponentProps) {
  // 1. Hooks
  const { data, isLoading } = useGetEventsQuery({});

  // 2. State
  const [state, setState] = useState();

  // 3. Effects
  useEffect(() => {}, []);

  // 4. Handlers
  const handleClick = () => {};

  // 5. Early returns
  if (isLoading) return <div>Loading...</div>;

  // 6. Render
  return <div>...</div>;
}
```

---

## State Management Rules

### 1. **Global State (Redux)**

Use Redux for:

- Authentication state
- User data
- Firebase data (via RTK Query)
- App-wide settings

### 2. **Local State**

Use `useState` for:

- Form inputs
- UI state (modals, dropdowns)
- Component-specific data

### 3. **Server State (RTK Query)**

Use RTK Query for:

- **ALL Firebase data**
- Remote data fetching
- Cache management
- Real-time updates

---

## Cloudinary Storage Rules

**NOTE:** We use Cloudinary instead of Firebase Storage to avoid upgrade costs and limitations.

### 1. **File Upload Pattern**

```typescript
import {
  uploadFileClient,
  uploadMultipleFilesClient,
  CloudinaryPaths,
} from "@/lib/cloudinary/upload";
import { validateFiles } from "@/lib/cloudinary/config";

// Validate files BEFORE uploading
const validation = validateFiles(files);
if (!validation.isValid) {
  toast.error(validation.errors.join("\n"));
  return;
}

// Upload single file
const result = await uploadFileClient(
  file,
  CloudinaryPaths.events(eventId),
  (progress) => setProgress(progress)
);

// Upload multiple files
const results = await uploadMultipleFilesClient(
  files,
  CloudinaryPaths.events(eventId),
  (progress) => setProgress(progress)
);
```

### 2. **File Deletion Pattern**

```typescript
import {
  deleteFile,
  deleteMultipleFiles,
  getPublicIdFromUrl,
} from "@/lib/cloudinary/upload";

// Delete single file (using public ID)
await deleteFile(publicId, "image");

// Delete single file (using URL)
const publicId = getPublicIdFromUrl(fileUrl);
await deleteFile(publicId, "image");

// Delete multiple files
await deleteMultipleFiles(publicIds, "image");
```

### 3. **Storage Path Convention**

- Events: `blinking-events/events/{eventId}`
- Services: `blinking-events/services/{serviceId}`
- Staff: `blinking-events/staff/{staffId}`
- Media: `blinking-events/media/{mediaId}`
- Users: `blinking-events/users/{userId}`
- Temp: `blinking-events/temp`

### 4. **File Size Limits (Free Plan)**

```typescript
import {
  CLOUDINARY_LIMITS_READABLE,
  getFileSizeLimitMessage,
} from "@/lib/cloudinary/config";

// Display limits to users
const message = getFileSizeLimitMessage("image"); // "Maximum file size: 10 MB"

// All limits:
// - Images: 10 MB
// - Videos: 100 MB
// - Raw files: 10 MB
// - Image transforms: 100 MB
// - Video transforms: 40 MB
// - Max megapixels: 25 MP
```

### 5. **File Validation**

```typescript
import {
  validateFiles,
  validateFileSize,
  validateFileType,
} from "@/lib/cloudinary/config";

// Validate before upload (REQUIRED)
const validation = validateFiles(selectedFiles);
if (!validation.isValid) {
  // Show errors to user
  validation.errors.forEach((error) => toast.error(error));
  return;
}

// Use only valid files
const { validFiles } = validation;
```

### 6. **Supported File Types**

```typescript
import { SUPPORTED_FILE_TYPES, getAcceptString } from "@/lib/cloudinary/upload";

// In file input
<input type="file" accept={getAcceptString(["image", "video"])} multiple />;

// Supported types:
// Images: jpg, jpeg, png, gif, webp, svg
// Videos: mp4, webm, ogg, mov
// Raw: pdf, zip, json
```

---

## Error Handling

### 1. **RTK Query Errors**

```typescript
const { data, error, isLoading } = useGetEventsQuery({});

if (error) {
  // Error is automatically typed
  console.error("Error:", error);
}
```

### 2. **Mutation Errors**

```typescript
const [createEvent, { isLoading, error }] = useCreateEventMutation();

try {
  await createEvent(eventData).unwrap();
  toast.success("Event created!");
} catch (err) {
  toast.error("Failed to create event");
  console.error(err);
}
```

### 3. **Storage Errors**

```typescript
try {
  const url = await uploadFile(file, path);
} catch (error) {
  // Error messages are descriptive
  console.error(error.message);
}
```

---

## Testing Guidelines

### 1. **Before Committing**

- [ ] All TypeScript errors resolved
- [ ] No console errors in browser
- [ ] Components render correctly
- [ ] CRUD operations work
- [ ] File uploads/deletions work
- [ ] Error states handled

### 2. **Redux DevTools**

- Always check Redux DevTools for state changes
- Verify cache invalidation works
- Check for unnecessary re-fetches

### 3. **Firebase & Cloudinary Console**

- Verify Firestore data is saved correctly
- Check Cloudinary files are uploaded
- Verify deletions work from Cloudinary dashboard

---

## Best Practices Summary

### DO ✅

- Use RTK Query for ALL Firebase operations
- Use typed Redux hooks
- Define TypeScript interfaces
- Handle loading and error states
- Use proper cache invalidation
- Follow file structure conventions
- Use Cloudinary helper functions
- Validate files BEFORE uploading
- Convert Firestore data properly
- Add timestamps to all documents

### DON'T ❌

- Make direct Firebase calls in components
- Use untyped Redux hooks
- Use `any` type
- Ignore error handling
- Skip cache invalidation
- Hard-code Cloudinary paths
- Upload files without validation
- Forget to clean up uploaded files
- Skip data conversion
- Exceed Cloudinary free plan limits
- Store files without proper structure

---

## Quick Reference

### Common Patterns

#### 1. Fetch and Display Data

```typescript
"use client";

import { useGetEventsQuery } from "@/lib/redux/api/eventsApi";

export function EventsList() {
  const { data: events, isLoading, error } = useGetEventsQuery({});

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading events</div>;

  return (
    <div>
      {events?.map((event) => (
        <div key={event.id}>{event.title}</div>
      ))}
    </div>
  );
}
```

#### 2. Create New Item

```typescript
"use client";

import { useCreateEventMutation } from "@/lib/redux/api/eventsApi";

export function CreateEventForm() {
  const [createEvent, { isLoading }] = useCreateEventMutation();

  const handleSubmit = async (data) => {
    try {
      await createEvent(data).unwrap();
      toast.success("Event created!");
    } catch (error) {
      toast.error("Failed to create event");
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

#### 3. Upload Files with Data

````typescript
#### 3. Upload Files with Data

```typescript
import { uploadMultipleFilesClient, CloudinaryPaths } from "@/lib/cloudinary/upload";
import { validateFiles } from "@/lib/cloudinary/config";
import { useCreateEventMutation, useUpdateEventMutation } from "@/lib/redux/api/eventsApi";

export function CreateEventWithImages() {
  const [createEvent] = useCreateEventMutation();
  const [updateEvent] = useUpdateEventMutation();

  const handleSubmit = async (data, files) => {
    // 1. Validate files first
    const validation = validateFiles(files);
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    // 2. Create event first to get ID
    const event = await createEvent(data).unwrap();

    // 3. Upload files with event ID
    const results = await uploadMultipleFilesClient(
      validation.validFiles,
      CloudinaryPaths.events(event.id)
    );

    // 4. Update event with image URLs
    await updateEvent({
      id: event.id,
      data: { images: results.map(r => r.url) }
    }).unwrap();
  };
}
````

```

---

## Version History

- **v1.0** (Oct 16, 2025) - Initial documentation

---

**Remember:** When in doubt, refer to this document. All Firebase operations MUST go through Redux RTK Query. No exceptions!
```
