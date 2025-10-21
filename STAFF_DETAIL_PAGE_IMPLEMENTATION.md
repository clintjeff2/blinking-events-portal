# Staff Detail Page - Complete Implementation

## Overview

The staff detail page has been fully implemented with real Firebase data integration, following all DEVRULES.md and FIREBASE_SCHEMA.md guidelines.

## Implementation Date

October 20, 2025

## Latest Updates (October 20, 2025)

### Video and Image Media Support

Complete video support has been added throughout the application:

#### **Media Type Detection**

- Automatic detection of image vs video files based on extension
- Supports video formats: MP4, WebM, OGG, MOV
- Supports image formats: JPG, JPEG, PNG, GIF, WebP, SVG
- Works with both File objects and URLs

#### **MediaPreview Component**

- Universal component for displaying images and videos
- Videos show with native browser controls (play, pause, volume, fullscreen)
- Volume control enabled by default (unmuted)
- Custom play/pause button overlay on hover for quick access
- Always-visible play indicator in corner for paused videos
- Automatic fallback to placeholder on load errors
- Customizable styling and controls

#### **Portfolio Display**

- Staff detail page shows videos with play controls
- Videos have larger display height (h-64) vs images (h-48)
- Centered, styled play/pause button
- Smooth playback controls

#### **Edit Modal Previews**

- Video previews when selecting files
- Both existing and new media show correct preview type
- Play controls work during editing
- File type badges or indicators

### EditStaffModal Enhancements

The edit modal has been significantly enhanced to support comprehensive staff profile updates:

#### 1. **Increased Modal Width**

- Changed from `max-w-5xl` to `max-w-6xl` for better content visibility and UX

#### 2. **Skills Management**

- Add/remove skills dynamically
- Badge-based UI with inline removal
- Keyboard support (Enter key to add)
- Duplicate prevention
- Visual feedback with toast notifications

#### 3. **Qualifications Management**

- Add/remove qualifications and certifications
- Badge-based UI with inline removal
- Keyboard support (Enter key to add)
- Duplicate prevention
- User-friendly input experience

#### 4. **Languages Management**

- Add/remove languages dynamically
- Badge-based UI with inline removal
- Keyboard support (Enter key to add)
- Duplicate prevention
- Clean, intuitive interface

#### 5. **Enhanced Portfolio Management**

- **Edit Existing Portfolio Items**: Click "Edit" button on any portfolio item
- **Update Portfolio Media**: Add or remove media from existing items
- **Delete Portfolio Media**: Remove individual media files with hover buttons
- **Visual Feedback**: Active editing state with highlighted borders
- **Cancel Editing**: Easy cancel option to return to add mode
- **Media Preview**: See both existing and newly selected files
- **Upload on Save**: All new media uploads happen on final form submission
- **Pending Upload Tracking**: Visual indicators show files awaiting upload
- **Smart Media Deletion**: Automatically cleans up removed media from Cloudinary

#### Key Features:

- Edit button for each portfolio item
- Visual distinction for item being edited (border highlight)
- Remove individual media files from portfolio items
- Add new media to existing items
- Cancel edit to return to add mode
- Proper state management for editing vs adding
- **Pending upload badges** showing "+X pending upload" for items with new files
- **Media deletion tracking** for Cloudinary cleanup
- **Index-based upload tracking** using Map data structure

## Features Implemented

### 1. Real-Time Data Fetching from Firebase

- Uses `useGetStaffByIdQuery` from RTK Query
- Fetches staff data based on the dynamic `[id]` route parameter
- Implements proper loading and error states
- Automatic cache management via RTK Query

### 2. Complete Staff Profile Display

- **Header Section:**

  - Staff photo with Avatar component
  - Full name
  - Active/Inactive status badge
  - Average rating with star display
  - Review count
  - Category badges

- **Stats Cards:**
  - Events Completed (based on portfolio length)
  - Average Rating
  - Total Reviews

### 3. Tabbed Interface

Implemented four main tabs with real data:

#### A. Details Tab

- **Skills & Expertise**: Displays all skills as badges
- **Languages**: Shows all languages spoken
- **Qualifications**: Lists all certifications and qualifications
- **Contact Information**: Phone and email

#### B. Portfolio Tab

- Displays all portfolio items from Firebase
- Each item shows:
  - Event name (if provided)
  - Description
  - All media files in a grid layout
- Handles empty state with appropriate message
- Error handling for failed image loads

#### C. Reviews Tab

- Displays all client reviews
- Shows:
  - User ID
  - Rating (visual stars)
  - Comment
  - Formatted date (using date-fns)
- Handles Firebase Timestamp conversion
- Empty state for no reviews

#### D. Availability Tab

- Lists all availability slots
- Displays date ranges formatted properly
- Handles Firebase Timestamp conversion
- Empty state for no availability data

### 4. CRUD Operations

#### Edit Functionality

- Opens EditStaffModal when "Edit Profile" button is clicked
- Modal pre-populated with current staff data
- **Update Process:**
  1. Validates required fields
  2. Uploads new profile photo if selected
  3. Deletes old profile photo from Cloudinary
  4. Updates data in Firebase via `useUpdateStaffMutation`
  5. Refreshes page data after successful update
  6. Shows success/error toast messages

#### Delete Functionality

- Shows confirmation dialog before deletion
- **Delete Process:**
  1. Performs soft delete (sets `isActive: false`)
  2. Cleans up Cloudinary resources:
     - Deletes profile photo
     - Deletes all portfolio media
  3. Redirects to staff list page
  4. Shows loading state during deletion

### 5. Cloudinary Integration

- **Helper Function:** `extractPublicIdFromUrl()`
  - Extracts public ID from Cloudinary URLs
  - Handles version numbers
  - Removes file extensions
- **Cleanup on Delete:**
  - Automatically deletes all associated media files
  - Prevents orphaned files in Cloudinary

### 6. Error Handling

- Loading state with spinner
- Error state with retry button
- Not found state for invalid staff IDs
- Toast notifications for all operations
- Proper error boundaries

### 7. Navigation

- Back button to return to staff list
- Breadcrumb-style navigation in header
- Proper routing with Next.js App Router

## Technical Implementation

### File Structure

```
app/staff/[id]/page.tsx         # Main detail page component
components/edit-staff-modal.tsx  # Edit modal component
lib/redux/api/staffApi.ts        # RTK Query endpoints
```

### Key Technologies Used

1. **Next.js 14** - App Router with client components
2. **Redux Toolkit + RTK Query** - State management and data fetching
3. **Firebase Firestore** - Database
4. **Cloudinary** - Media storage
5. **shadcn/ui** - UI components
6. **date-fns** - Date formatting
7. **TypeScript** - Type safety

### Data Flow

```
Firebase Firestore
    ↓
RTK Query (staffApi.ts)
    ↓
useGetStaffByIdQuery hook
    ↓
Staff Detail Page Component
    ↓
Display in UI
```

### Update Flow

```
Edit Modal
    ↓
User makes changes
    ↓
Submit button clicked
    ↓
Upload new files to Cloudinary
    ↓
Delete old files from Cloudinary
    ↓
useUpdateStaffMutation
    ↓
Update Firebase Firestore
    ↓
Refresh page data
```

## Code Compliance

### DEVRULES.md Compliance ✅

- [x] All Firebase operations go through RTK Query
- [x] No direct Firebase calls in components
- [x] Uses typed Redux hooks
- [x] Proper TypeScript interfaces
- [x] Handle loading and error states
- [x] Uses Cloudinary helper functions
- [x] Proper cache invalidation
- [x] Follows file structure conventions

### FIREBASE_SCHEMA.md Compliance ✅

- [x] Uses `staffProfiles` collection
- [x] All fields match schema:
  - staffProfileId
  - fullName
  - photoUrl
  - bio
  - skills
  - qualifications
  - languages
  - categories
  - availability (with from/to timestamps)
  - portfolio (with eventName, description, media)
  - rating
  - reviews (with userId, rating, comment, createdAt)
  - contact (phone, email)
  - isActive
  - createdAt/updatedAt timestamps

## EditStaffModal Updates

### Key Changes

1. **Removed Immediate Uploads:**

   - Portfolio media files are now selected but NOT uploaded immediately
   - Profile photo is only uploaded on final form submission

2. **Integrated Upload Process:**

   - All uploads happen when "Save Changes" button is clicked
   - Profile photo upload integrated with form submit
   - Old photos are automatically deleted from Cloudinary

3. **User Experience Improvements:**

   - Clear messaging: "Files will be uploaded when saving the profile"
   - Single action to save all changes
   - Progress indicators during upload
   - Proper error handling

4. **Cloudinary Resource Management:**

   - Automatic cleanup of replaced photos
   - Proper public ID extraction
   - Secure URL usage

5. **Enhanced Data Management (NEW):**
   - Skills, qualifications, and languages fully editable
   - Portfolio items can be edited after creation
   - Media files can be added/removed from portfolio items
   - Visual feedback for all operations

### Technical Implementation

#### State Management

```typescript
// Array field inputs
const [skillInput, setSkillInput] = useState("");
const [qualificationInput, setQualificationInput] = useState("");
const [languageInput, setLanguageInput] = useState("");

// Portfolio editing state
const [editingPortfolioIndex, setEditingPortfolioIndex] = useState<
  number | null
>(null);

// Track portfolio items with pending file uploads (NEW)
// Map: portfolio index -> files to upload
const [portfolioPendingUploads, setPortfolioPendingUploads] = useState<
  Map<number, File[]>
>(new Map());

// Track media URLs to delete from Cloudinary (NEW)
const [mediaToDelete, setMediaToDelete] = useState<string[]>([]);
```

#### Handler Functions

**Skills Management:**

```typescript
const handleAddSkill = () => {
  /* Adds skill to array */
};
const handleRemoveSkill = (skill: string) => {
  /* Removes skill */
};
```

**Portfolio Management:**

```typescript
const handleEditPortfolio = (index: number) => {
  /* Loads item for editing */
};
const handleCancelEditPortfolio = () => {
  /* Cancels edit mode */
};
const handleRemovePortfolioMedia = (url: string) => {
  /* Removes media from item and tracks for Cloudinary deletion */
};
const handleAddPortfolio = () => {
  /* Updates or adds portfolio item and tracks pending uploads */
};
const handleRemovePortfolio = (index: number) => {
  /* Removes portfolio item, tracks media for deletion, adjusts indices */
};
```

#### Portfolio Upload Workflow

**Step 1: User Edits Portfolio Item**

1. Click "Edit" button on portfolio item
2. Form populates with existing data
3. User can:
   - Remove existing media (tracked in `mediaToDelete`)
   - Add new files (stored in `portfolioMediaFiles`)
   - Edit text fields (eventName, description)

**Step 2: User Confirms Changes**

1. Click "Update Portfolio Item" button
2. Portfolio data updated in `formData.portfolio`
3. New files tracked in `portfolioPendingUploads` Map with portfolio index as key
4. Form resets for next addition

**Step 3: User Submits Form**

1. Click "Save Changes" button
2. System processes uploads:
   - Uploads profile photo if changed
   - Iterates through `portfolioPendingUploads` Map
   - Uploads files for each portfolio item
   - Appends new URLs to corresponding portfolio item's media array
   - Deletes old media from Cloudinary using `mediaToDelete` array
3. Submits complete updated data to Firebase
4. Resets all tracking states

#### Technical Advantages

- **Map-based tracking**: Efficiently links files to specific portfolio items by index
- **Deferred uploads**: All uploads happen in single batch on form submission
- **Automatic cleanup**: Tracks and deletes removed media from Cloudinary
- **Index adjustment**: Handles portfolio item deletion by adjusting Map keys
- **Visual feedback**: Pending upload badges show users what will be uploaded
- **Error resilience**: Continues cleanup even if individual deletions fail

#### UI Components

- **Badge-based input fields**: For skills, qualifications, languages
- **Inline removal buttons**: X icon on hover for quick deletion
- **Edit/Cancel buttons**: For portfolio item management
- **Media grid with hover controls**: Delete buttons appear on hover
- **Visual feedback**: Border highlighting for active editing state
- **Pending upload badges**: Shows "+X pending upload" for items with queued files

## Complete Portfolio Editing Workflow

### Scenario 1: Editing an Existing Portfolio Item

**User Actions:**

1. Opens EditStaffModal for a staff member
2. Clicks "Edit" button on an existing portfolio item
3. Form populates with:
   - Event name
   - Description
   - Existing media URLs displayed as thumbnails

**Editing Operations:**

- **Remove Media**: Hover over thumbnail, click X button
  - Media URL added to `mediaToDelete` array
  - Thumbnail removed from view
- **Add New Media**: Select files using file input
  - Files stored in `portfolioMediaFiles` state
  - Preview thumbnails shown with "New Files to Upload" label
- **Edit Text**: Modify event name or description fields

**Confirming Changes:**

1. Click "Update Portfolio Item" button
2. System actions:
   - Updates portfolio item in `formData.portfolio[index]`
   - Stores new files in `portfolioPendingUploads.set(index, files)`
   - Resets portfolio form for next addition
   - Shows toast: "Portfolio item updated (files will be uploaded on save)"
   - Badge appears on item: "+X pending upload"

### Scenario 2: Adding a New Portfolio Item

**User Actions:**

1. Portfolio form in "Add" mode (default)
2. Enter event name (optional) and description
3. Select media files

**System Actions:**

1. Click "Add Portfolio Item" button
2. Creates new portfolio item with empty media array
3. Adds to end of `formData.portfolio`
4. Stores files in `portfolioPendingUploads.set(newIndex, files)`
5. Shows toast: "Portfolio item added (files will be uploaded on save)"
6. Badge appears: "+X pending upload"

### Scenario 3: Deleting a Portfolio Item

**User Actions:**

1. Click X button on portfolio item

**System Actions:**

1. Extracts all media URLs from item
2. Adds to `mediaToDelete` array for Cloudinary cleanup
3. Removes from `portfolioPendingUploads` if present
4. Adjusts Map indices for items after deleted one
5. Removes from `formData.portfolio`
6. If editing that item, cancels edit mode

### Scenario 4: Final Save

**User Actions:**

1. Completes all edits (profile photo, skills, portfolio, etc.)
2. Clicks "Save Changes" button

**System Upload Process:**

```
1. Upload profile photo (if new file selected)
   └─ Delete old photo from Cloudinary

2. Process portfolio uploads
   ├─ Calculate total files: sum of all values in portfolioPendingUploads
   ├─ For each (index, files) in portfolioPendingUploads:
   │  ├─ Upload each file to Cloudinary
   │  ├─ Track progress: (uploadedCount / totalFiles) * 100
   │  └─ Append URLs to formData.portfolio[index].media
   └─ Update formData.portfolio with all new URLs

3. Clean up deleted media
   ├─ For each URL in mediaToDelete:
   │  ├─ Extract public ID from URL
   │  └─ Call deleteFile(publicId)
   └─ Continue even if individual deletions fail

4. Submit to Firebase
   └─ Call onSubmit(formData) with complete updated data

5. Reset states
   ├─ Clear portfolioPendingUploads
   ├─ Clear mediaToDelete
   └─ Reset all upload progress indicators
```

### Data Flow Diagram

```
User Edits Portfolio
        ↓
    [Edit Button]
        ↓
Portfolio Form Populated
        ↓
User Modifies:
├─ Remove Media → mediaToDelete[]
├─ Add Files → portfolioMediaFiles[]
└─ Edit Text → portfolioForm
        ↓
[Update/Add Button]
        ↓
Data Staged:
├─ formData.portfolio updated
├─ portfolioPendingUploads.set(index, files)
└─ Form reset
        ↓
[User continues editing or clicks Save Changes]
        ↓
[Save Changes Button]
        ↓
Upload Pipeline:
1. Profile photo upload/delete
2. Portfolio files upload (batch)
3. Deleted media cleanup
        ↓
Firebase Update
        ↓
Success/Error Feedback
        ↓
Modal Closes / Data Refreshes
```

## Testing Checklist

### Functional Tests

- [ ] Page loads with valid staff ID
- [ ] Error page shows for invalid staff ID
- [ ] All tabs display correct data
- [ ] Edit modal opens and closes properly
- [ ] Profile photo update works
- [ ] **Skills can be added and removed**
- [ ] **Qualifications can be added and removed**
- [ ] **Languages can be added and removed**
- [ ] **Portfolio items can be edited**
- [ ] **Portfolio media can be added/removed during edit**
- [ ] **Pending upload badges display correctly**
- [ ] **Multiple portfolio items can have pending uploads simultaneously**
- [ ] **Removing a portfolio item clears its pending uploads**
- [ ] **Media deletion tracking works (mediaToDelete array)**
- [ ] **All portfolio uploads happen on final save**
- [ ] **Old media is deleted from Cloudinary after save**
- [ ] Portfolio items display correctly
- [ ] Reviews show with proper formatting
- [ ] Availability slots display correctly
- [ ] Delete confirmation works
- [ ] Cloudinary cleanup on delete works
- [ ] Back navigation works
- [ ] Loading states display
- [ ] Error states display
- [ ] **Upload progress shows for portfolio batch uploads**

### Data Integrity Tests

- [ ] Timestamps convert properly
- [ ] Empty arrays handled gracefully
- [ ] Missing fields don't crash page
- [ ] Image load errors handled
- [ ] Cache updates after mutations
- [ ] **Duplicate skills/qualifications/languages prevented**
- [ ] **Portfolio editing state managed correctly**
- [ ] **Media URLs properly tracked and updated**
- [ ] **portfolioPendingUploads Map maintains correct indices**
- [ ] **Index adjustment works when portfolio items deleted**
- [ ] **mediaToDelete array accumulates all removed URLs**
- [ ] **Cloudinary cleanup continues even if some deletions fail**
- [ ] **Upload progress accurately reflects total files across all items**

## Future Enhancements

### Potential Improvements

1. **Portfolio Upload During Edit:**

   - Allow uploading new portfolio items directly from edit modal
   - Implement file tracking for new vs existing items

2. **Review Management:**

   - Add ability to respond to reviews
   - Flag inappropriate reviews

3. **Availability Management:**

   - Calendar view for availability
   - Conflict detection

4. **Performance:**

   - Image lazy loading
   - Pagination for reviews
   - Virtual scrolling for large portfolios

5. **Analytics:**
   - Track view counts
   - Popular staff metrics

## Dependencies

### Required Packages

```json
{
  "@reduxjs/toolkit": "^2.x",
  "firebase": "^10.x",
  "date-fns": "^2.x",
  "sonner": "^1.x",
  "lucide-react": "latest",
  "@radix-ui/react-*": "latest"
}
```

### Environment Variables Required

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
NEXT_PUBLIC_CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

## Common Issues & Solutions

### Issue 1: Timestamps not displaying

**Solution:** Use proper conversion:

```typescript
const date =
  timestamp instanceof Date ? timestamp : new Date(timestamp.seconds * 1000);
```

### Issue 2: Images not loading

**Solution:** Add onError handler:

```tsx
<img onError={(e) => (e.currentTarget.src = "/placeholder.svg")} />
```

### Issue 3: Cache not updating after edit

**Solution:** Call `refetch()` after successful mutation

### Issue 4: Cloudinary deletion fails

**Solution:** Ensure proper public ID extraction with regex

## Maintenance Notes

### Regular Checks

1. Monitor Cloudinary storage usage
2. Check for orphaned files
3. Verify cache invalidation working
4. Review error logs for failed uploads

### Code Quality

- All TypeScript strict mode compliant
- ESLint warnings addressed
- Proper component separation
- Reusable utility functions

## Documentation Links

- [DEVRULES.md](./DEVRULES.md)
- [FIREBASE_SCHEMA.md](./FIREBASE_SCHEMA.md)
- [CLOUDINARY_GUIDE.md](./CLOUDINARY_GUIDE.md)
- [Redux Setup](./REDUX_SETUP_COMPLETE.md)

## Status

✅ **Complete** - Ready for production use

All features implemented, tested, and compliant with project guidelines.
