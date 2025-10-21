# Media Gallery Debug Guide

**Date:** October 20, 2025  
**Issue:** "Failed to load media" error on /media page

## Changes Made

### 1. Added Comprehensive Logging

#### `app/media/page.tsx`

- Added query state logging showing: isLoading, isError, error details, data length
- Enhanced error display to show actual error message
- Added console prompt for users to check F12 console

#### `lib/redux/api/mediaApi.ts`

- Added step-by-step logging in getMedia query:
  - Query start with filters
  - Database connection check
  - Collection reference creation
  - Query building process
  - Document fetching
  - Success/error results
- Simplified query logic:
  - Removed isActive filter requirement (may not exist on all docs)
  - Made query more flexible to handle empty collection
  - Better error handling with detailed error info

#### `lib/firebase/config.ts`

- Added Firebase config validation logging
- Shows which env variables are present/missing
- Logs successful initialization

### 2. Query Improvements

**Before:**

```typescript
// Required isActive field and orderBy
query(mediaRef, where("isActive", "==", true), orderBy("uploadedAt", "desc"));
```

**After:**

```typescript
// Simple query first, add filters only if needed
query(mediaRef); // Get all documents
// Then optionally add: category, isFeatured filters
```

## How to Debug

### Step 1: Open Browser Console (F12)

Look for logs in this order:

```
[Firebase Config] Environment check: {...}
[Firebase] App initialized, apps count: 1
[MediaPage] Query state: {...}
[MediaAPI] Starting getMedia query with filters: {...}
[MediaAPI] Checking db connection: true
[MediaAPI] Created collection reference
[MediaAPI] Created simple query (no filters)
[MediaAPI] Executing getDocs...
[MediaAPI] Got snapshot, docs count: X
[MediaAPI] Successfully fetched media items: X
```

### Step 2: Check for Errors

#### Common Error 1: Missing Firebase Config

```
[Firebase Config] Environment check: { allConfigPresent: false }
```

**Fix:** Check `.env.local` file has all NEXT*PUBLIC_FIREBASE*\* variables

#### Common Error 2: Permission Denied

```
[MediaAPI] Error in getMedia: { message: "Missing or insufficient permissions" }
```

**Fix:** Update Firestore Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### Common Error 3: Collection Empty

```
[MediaAPI] Got snapshot, docs count: 0
```

**This is OK!** Means query works but no media uploaded yet.

- Page should show empty state
- Upload button should work

#### Common Error 4: Query Index Required

```
Error: The query requires an index
```

**Fix:** Click the link in error message to create index in Firebase Console

### Step 3: Verify Firestore Setup

1. Go to Firebase Console → Firestore Database
2. Check if `media` collection exists
3. If empty, that's OK - try uploading media
4. If has documents, check they have these fields:
   - `title` (string)
   - `url` (array)
   - `thumbnailUrl` (string)
   - `category` (string)
   - `uploadedAt` (timestamp)
   - `uploadedBy` (string)

### Step 4: Test Upload

1. Click "Upload Media" button
2. Select files
3. Fill in form
4. Click Upload
5. Check console for:
   ```
   [MediaAPI] Successfully created media
   ```

## Expected Console Output (Success)

```
[Firebase Config] Environment check: {
  hasApiKey: true,
  hasAuthDomain: true,
  hasProjectId: true,
  projectId: "your-project-id",
  allConfigPresent: true
}

[Firebase] App initialized, apps count: 1

[MediaPage] Query state: {
  isLoading: true,
  isError: false,
  error: undefined,
  dataLength: undefined,
  hasData: false
}

[MediaAPI] Starting getMedia query with filters: { category: undefined, isFeatured: undefined }
[MediaAPI] Checking db connection: true
[MediaAPI] Created collection reference
[MediaAPI] Created simple query (no filters)
[MediaAPI] Executing getDocs...
[MediaAPI] Got snapshot, docs count: 3
[MediaAPI] Successfully fetched media items: 3
[MediaAPI] First item: { id: "...", title: "...", url: [...], ... }

[MediaPage] Query state: {
  isLoading: false,
  isError: false,
  error: undefined,
  dataLength: 3,
  hasData: true
}
```

## Expected Console Output (Empty Collection)

```
[All Firebase logs same as above...]

[MediaAPI] Got snapshot, docs count: 0
[MediaAPI] Successfully fetched media items: 0
[MediaAPI] First item: undefined

[MediaPage] Query state: {
  isLoading: false,
  isError: false,
  error: undefined,
  dataLength: 0,
  hasData: true
}
```

**UI Should show:** "No media found" empty state with upload button

## Expected Console Output (Error)

```
[MediaAPI] Error in getMedia: {
  message: "Missing or insufficient permissions.",
  code: "permission-denied",
  name: "FirebaseError",
  stack: "..."
}

[MediaPage] Query state: {
  isLoading: false,
  isError: true,
  error: "Missing or insufficient permissions.",
  dataLength: 0,
  hasData: false
}
```

**UI Should show:** Error card with message and retry button

## Quick Fixes

### Issue: No logs appear

**Problem:** Dev server not running  
**Fix:** Run `npm run dev`

### Issue: Firebase config shows false values

**Problem:** Environment variables not loaded  
**Fix:**

1. Check `.env.local` exists
2. Restart dev server
3. Clear Next.js cache: `rm -rf .next`

### Issue: Permission denied error persists

**Problem:** Firestore rules not updated  
**Fix:**

1. Firebase Console → Firestore → Rules
2. Paste the allow-all rule
3. Click Publish
4. Wait 1-2 minutes for propagation

### Issue: Query works but shows error

**Problem:** Data format mismatch  
**Fix:** Check document structure matches MediaItem interface

## Testing Checklist

- [ ] Open /media page
- [ ] Check console for Firebase init logs
- [ ] Check console for MediaAPI logs
- [ ] Verify error OR success message
- [ ] If empty, try uploading media
- [ ] Check upload logs
- [ ] Refresh and verify media appears

## Need More Help?

Copy ALL console logs and share them. Look for:

- Red error messages
- Yellow warnings
- Any "[Firebase...]" or "[MediaAPI...]" or "[MediaPage]" logs

---

**Status:** Debugging tools added, awaiting console output from user
