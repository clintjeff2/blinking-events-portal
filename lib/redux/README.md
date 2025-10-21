# Redux Toolkit Setup for Blinking Events Portal

This directory contains the complete Redux Toolkit and RTK Query setup for managing all Firebase transactions in the Blinking Events Admin Portal.

## Structure

```
lib/redux/
├── api/
│   ├── firebaseApi.ts      # Base RTK Query API configuration
│   ├── usersApi.ts         # Users CRUD operations
│   ├── eventsApi.ts        # Events CRUD operations
│   ├── servicesApi.ts      # Services CRUD operations
│   └── index.ts            # Export all APIs
├── slices/
│   └── authSlice.ts        # Authentication state management
├── store.ts                # Redux store configuration
├── hooks.ts                # Typed Redux hooks
├── provider.tsx            # Redux Provider component
└── README.md               # This file
```

## Quick Start

### 1. Using Queries (Read Data)

```typescript
"use client";

import { useGetEventsQuery } from "@/lib/redux/api/eventsApi";

function EventsList() {
  const {
    data: events,
    isLoading,
    error,
  } = useGetEventsQuery({
    status: "upcoming", // Optional filters
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {events?.map((event) => (
        <div key={event.id}>{event.title}</div>
      ))}
    </div>
  );
}
```

### 2. Using Mutations (Create/Update/Delete)

```typescript
"use client";

import { useCreateEventMutation } from "@/lib/redux/api/eventsApi";
import { toast } from "sonner";

function CreateEventForm() {
  const [createEvent, { isLoading }] = useCreateEventMutation();

  const handleSubmit = async (data) => {
    try {
      const newEvent = await createEvent(data).unwrap();
      toast.success("Event created successfully!");
    } catch (error) {
      toast.error("Failed to create event");
      console.error(error);
    }
  };

  return <form onSubmit={handleSubmit}>{/* Form fields */}</form>;
}
```

### 3. File Uploads with Data

```typescript
import { uploadMultipleFiles } from "@/lib/firebase/storage";
import {
  useCreateEventMutation,
  useUpdateEventMutation,
} from "@/lib/redux/api/eventsApi";

function CreateEventWithImages() {
  const [createEvent] = useCreateEventMutation();
  const [updateEvent] = useUpdateEventMutation();

  const handleSubmit = async (formData, files) => {
    try {
      // 1. Create the event first
      const event = await createEvent(formData).unwrap();

      // 2. Upload images
      const imageUrls = await uploadMultipleFiles(files, `events/${event.id}`);

      // 3. Update event with image URLs
      await updateEvent({
        id: event.id,
        data: { images: imageUrls },
      }).unwrap();

      toast.success("Event created with images!");
    } catch (error) {
      toast.error("Failed to create event");
    }
  };
}
```

## Available APIs

### Users API

- `useGetUsersQuery({ role?, isActive? })`
- `useGetUserByIdQuery(userId)`
- `useGetUserByUidQuery(firebaseUid)`
- `useCreateUserMutation()`
- `useUpdateUserMutation()`
- `useDeleteUserMutation()`
- `useHardDeleteUserMutation()`

### Events API

- `useGetEventsQuery({ status?, eventType? })`
- `useGetEventByIdQuery(eventId)`
- `useGetEventsByClientQuery(clientId)`
- `useCreateEventMutation()`
- `useUpdateEventMutation()`
- `useDeleteEventMutation()`

### Services API

- `useGetServicesQuery({ category?, featured? })`
- `useGetServiceByIdQuery(serviceId)`
- `useCreateServiceMutation()`
- `useUpdateServiceMutation()`
- `useDeleteServiceMutation()`

## TypeScript Types

All API endpoints are fully typed. Import types from the API files:

```typescript
import type { User } from "@/lib/redux/api/usersApi";
import type { Event } from "@/lib/redux/api/eventsApi";
import type { Service } from "@/lib/redux/api/servicesApi";
```

## Best Practices

1. **Always use typed hooks**

   ```typescript
   import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
   ```

2. **Handle loading and error states**

   ```typescript
   const { data, isLoading, error } = useGetEventsQuery({});
   ```

3. **Unwrap mutations for error handling**

   ```typescript
   try {
     await createEvent(data).unwrap();
   } catch (error) {
     // Handle error
   }
   ```

4. **Use cache invalidation properly**
   - Queries automatically refetch when their tags are invalidated
   - Mutations automatically invalidate appropriate tags

## Adding New APIs

To add a new API for a Firebase collection:

1. Create a new file in `lib/redux/api/[collection]Api.ts`
2. Define the TypeScript interface for the data model
3. Use `firebaseApi.injectEndpoints()` to add endpoints
4. Export the hooks
5. Add the collection to `tagTypes` in `firebaseApi.ts`
6. Export from `index.ts`

Example template:

```typescript
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  firebaseApi,
  convertFirestoreData,
  withTimestamp,
} from "./firebaseApi";

export interface YourModel {
  id: string;
  // ... other fields
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
}

export const yourApi = firebaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getYourModels: builder.query<YourModel[], void>({
      async queryFn() {
        // Implementation
      },
      providesTags: [{ type: "YourModels", id: "LIST" }],
    }),
    // ... other endpoints
  }),
});

export const {
  useGetYourModelsQuery,
  // ... export other hooks
} = yourApi;
```

## Firebase Storage

For file uploads, use the storage utilities:

```typescript
import {
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  deleteMultipleFiles,
  StoragePaths,
} from "@/lib/firebase/storage";

// Upload single file
const url = await uploadFile(file, StoragePaths.events(eventId, file.name));

// Upload multiple files with progress
const urls = await uploadMultipleFiles(files, `events/${eventId}`, (progress) =>
  setProgress(progress)
);

// Delete file
await deleteFile(url);
```

## Redux DevTools

The Redux DevTools extension is automatically configured. Use it to:

- Inspect state changes
- View query cache
- Debug mutations
- Time-travel debugging

## Testing

Before committing:

1. Verify all TypeScript errors are resolved
2. Test CRUD operations work correctly
3. Check cache invalidation
4. Verify error handling works
5. Test file uploads/deletions

## Resources

- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- [RTK Query Docs](https://redux-toolkit.js.org/rtk-query/overview)
- [Firebase Docs](https://firebase.google.com/docs)
- [DEVRULES.md](../../DEVRULES.md) - Complete development guidelines
