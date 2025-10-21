# Cloudinary Upload Pattern - Project-Wide Standard

This document describes the **standardized pattern** for implementing file uploads with Cloudinary throughout the Blinking Events Portal project. All file uploads must follow this pattern to ensure consistent user experience with progress tracking, validation, and error handling.

## Overview

When implementing any file upload feature, follow these steps:

1. **Select file** → Validate size/type
2. **Preview** the file
3. **Upload to Cloudinary** with progress tracking
4. **Display upload percentage** and loading spinner
5. **Show errors** if size limit exceeded
6. **Save URL** to Firebase

## Core Principles

- ✅ **Always validate before upload** - Check file size and type client-side
- ✅ **Show progress feedback** - Display upload percentage and spinner
- ✅ **Clear error messages** - Especially for Cloudinary size limits
- ✅ **Preview before upload** - Let users see what they're uploading
- ✅ **Handle async properly** - Don't submit form until upload completes
- ✅ **Use existing utilities** - Leverage `/lib/cloudinary/upload.ts` and `/lib/cloudinary/config.ts`

## Required Dependencies

### 1. UI Components (shadcn/ui)

```typescript
import { Alert } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
```

### 2. Icons

```typescript
import { Upload, AlertCircle } from "lucide-react";
```

### 3. Cloudinary Utilities

```typescript
import { uploadFileClient, CloudinaryPaths } from "@/lib/cloudinary/upload";
import {
  validateFiles,
  CLOUDINARY_LIMITS_READABLE,
} from "@/lib/cloudinary/config";
```

### 4. Toast Notifications

```typescript
import { toast } from "sonner";
```

## Implementation Steps

### Step 1: Add Upload State Variables

```typescript
// Upload states
const [uploadProgress, setUploadProgress] = useState(0);
const [isUploading, setIsUploading] = useState(false);
const [uploadError, setUploadError] = useState("");
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [previewUrl, setPreviewUrl] = useState("");
```

### Step 2: Implement File Selection Handler

```typescript
const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Reset states
  setUploadError("");
  setUploadProgress(0);

  // Validate file
  const validation = validateFiles([file]);
  if (!validation.isValid) {
    setUploadError(validation.errors.join(". "));
    toast.error(validation.errors[0]);
    return;
  }

  // Create preview
  const reader = new FileReader();
  reader.onloadend = () => {
    setPreviewUrl(reader.result as string);
  };
  reader.readAsDataURL(file);

  setSelectedFile(file);
};
```

### Step 3: Implement Upload Handler

```typescript
const handleUploadPhoto = async () => {
  if (!selectedFile) {
    toast.error("Please select a photo first");
    return;
  }

  setIsUploading(true);
  setUploadError("");
  setUploadProgress(0);

  try {
    // Upload to Cloudinary with progress tracking
    const result = await uploadFileClient(
      selectedFile,
      CloudinaryPaths.staff("item-id"), // Adjust path based on resource type
      (progress) => {
        setUploadProgress(progress);
      }
    );

    // Update form data with uploaded URL
    setFormData({ ...formData, photoUrl: result.url });
    toast.success("Photo uploaded successfully!");
  } catch (error: any) {
    console.error("Upload error:", error);
    setUploadError(error.message || "Failed to upload photo");
    toast.error(error.message || "Failed to upload photo");
  } finally {
    setIsUploading(false);
  }
};
```

### Step 4: Implement Remove Handler

```typescript
const handleRemovePhoto = () => {
  setSelectedFile(null);
  setPreviewUrl("");
  setUploadProgress(0);
  setUploadError("");
};
```

### Step 5: Update Form Submit Handler

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validate required fields first
  if (!formData.name.trim()) {
    toast.error("Please enter a name");
    return;
  }

  // If file is selected but not uploaded, upload it first
  if (selectedFile && !formData.photoUrl) {
    toast.warning("Uploading photo first...");
    await handleUploadPhoto();
    return; // Will retry submit after upload
  }

  // Submit form data
  onSubmit(formData);

  // Reset upload states
  setSelectedFile(null);
  setPreviewUrl("");
  setUploadProgress(0);
  setUploadError("");
};
```

### Step 6: Add Upload UI Component

```tsx
<div className="space-y-2">
  <Label>Profile Photo</Label>

  {/* Display size limits */}
  <p className="text-xs text-muted-foreground">
    Maximum size: {CLOUDINARY_LIMITS_READABLE.MAX_IMAGE_SIZE}. Allowed formats:
    JPG, PNG, WebP
  </p>

  {/* Upload Error Alert */}
  {uploadError && (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <div>
        <p className="text-sm font-medium">Upload Error</p>
        <p className="text-sm">{uploadError}</p>
      </div>
    </Alert>
  )}

  {/* Photo Preview and Controls */}
  <div className="flex items-center gap-4">
    {/* Preview Avatar */}
    <Avatar className="h-24 w-24">
      {previewUrl || formData.photoUrl ? (
        <img
          src={previewUrl || formData.photoUrl}
          alt="Preview"
          className="object-cover"
        />
      ) : (
        <div className="flex items-center justify-center h-full w-full bg-muted">
          <Upload className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
    </Avatar>

    {/* Upload Controls */}
    <div className="flex-1 space-y-2">
      {!formData.photoUrl ? (
        <>
          {/* File Input */}
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="flex-1"
            />
            {selectedFile && !isUploading && (
              <Button type="button" onClick={handleUploadPhoto} size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uploading...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex-1 text-sm text-green-600 dark:text-green-400">
            ✓ Photo uploaded successfully
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemovePhoto}
            disabled={isUploading}
          >
            Change Photo
          </Button>
        </div>
      )}
    </div>
  </div>
</div>
```

## Cloudinary Paths

Use the appropriate CloudinaryPaths helper based on the resource type:

```typescript
import { CloudinaryPaths } from "@/lib/cloudinary/upload";

// For staff photos
CloudinaryPaths.staff(staffId);

// For event images
CloudinaryPaths.events(eventId);

// For service images
CloudinaryPaths.services(serviceId);

// For media library
CloudinaryPaths.media(mediaId);

// For testimonial images
CloudinaryPaths.testimonials(testimonialId);

// For user profile photos
CloudinaryPaths.users(userId);

// For temporary uploads (before creating record)
CloudinaryPaths.temp();
```

## File Type Variations

### For Images (Profile Photos, Event Photos, etc.)

- **Accept attribute**: `accept="image/*"`
- **Size limit**: 10 MB (`CLOUDINARY_LIMITS_READABLE.MAX_IMAGE_SIZE`)
- **Allowed formats**: JPG, PNG, WebP, GIF, SVG

### For Videos (Event Videos, Testimonials, etc.)

- **Accept attribute**: `accept="video/*"`
- **Size limit**: 100 MB (`CLOUDINARY_LIMITS_READABLE.MAX_VIDEO_SIZE`)
- **Allowed formats**: MP4, WebM, OGG, MOV

### For Multiple Files

Use `uploadMultipleFilesClient` from `/lib/cloudinary/upload.ts`:

```typescript
const results = await uploadMultipleFilesClient(
  files, // File[]
  CloudinaryPaths.events(eventId),
  (progress) => {
    setUploadProgress(progress);
  }
);

// results is an array of { url, publicId }
```

## Error Handling

### Common Errors to Handle

1. **File Too Large**

   ```typescript
   if (!validation.isValid) {
     setUploadError(validation.errors.join(". "));
     toast.error("File exceeds maximum size of 10 MB");
   }
   ```

2. **Invalid File Type**

   ```typescript
   toast.error("Please select a valid image file (JPG, PNG, WebP)");
   ```

3. **Upload Failed**

   ```typescript
   catch (error: any) {
     console.error("Upload error:", error)
     setUploadError(error.message || "Failed to upload file")
     toast.error(error.message || "Failed to upload file")
   }
   ```

4. **Network Issues**
   - The upload utilities automatically handle retries
   - Show clear error message if upload fails after retries

## Validation Rules

From `/lib/cloudinary/config.ts`:

```typescript
// Free plan limits
- Images: 10 MB max
- Videos: 100 MB max
- Image formats: JPG, PNG, GIF, WebP, SVG
- Video formats: MP4, WebM, OGG, MOV
```

## Best Practices

### ✅ DO

- **Always validate** before uploading to save Cloudinary credits
- **Show progress** for better UX on slow connections
- **Handle errors gracefully** with user-friendly messages
- **Reset states** after successful upload or modal close
- **Disable inputs** during upload to prevent double-uploads
- **Use CloudinaryPaths** helper for organized folder structure
- **Toast notifications** for success/error feedback

### ❌ DON'T

- **Don't upload** without validation
- **Don't submit form** while upload is in progress
- **Don't ignore errors** - always show to user
- **Don't hardcode paths** - use CloudinaryPaths helper
- **Don't forget to reset** upload states after submit
- **Don't exceed limits** - Cloudinary free plan is limited

## Complete Example: Staff Photo Upload

See `/components/add-staff-modal.tsx` and `/components/edit-staff-modal.tsx` for complete working implementations.

## Reference Files

- **Upload Utilities**: `/lib/cloudinary/upload.ts`
- **Config & Validation**: `/lib/cloudinary/config.ts`
- **Example Implementation**: `/components/add-staff-modal.tsx`
- **Edit Modal Example**: `/components/edit-staff-modal.tsx`

## Next Steps for Other Modules

Apply this same pattern to:

1. **Events Module** - Event cover images and gallery
2. **Services Module** - Service showcase images
3. **Media Module** - Media library uploads (images & videos)
4. **Testimonials Module** - Customer photos and video testimonials
5. **Settings Module** - Company logo and profile photos

## Testing Checklist

- [ ] File selection works
- [ ] Validation prevents oversized files
- [ ] Validation prevents invalid file types
- [ ] Preview shows selected image
- [ ] Upload button appears after selection
- [ ] Progress bar updates during upload
- [ ] Success message shows after upload
- [ ] Error message shows on failure
- [ ] Form submission waits for upload
- [ ] Upload states reset after submit
- [ ] Change photo button works
- [ ] Loading spinner shows during upload
- [ ] Toast notifications appear
- [ ] File input is disabled during upload

---

**Last Updated**: Created with Staff module implementation  
**Pattern Version**: 1.0  
**Applies To**: All file uploads in Blinking Events Portal
