# Cloudinary Integration Guide

**Last Updated:** October 16, 2025  
**Plan:** Free Plan  
**Cloud Name:** dbdhj1c4m

---

## Why Cloudinary Instead of Firebase Storage?

We chose Cloudinary over Firebase Storage to avoid upgrade costs and manage file storage more cost-effectively. The free plan provides sufficient resources for the portal's needs.

---

## Free Plan Limits

### File Size Limits

- **Images:** 10 MB max
- **Videos:** 100 MB max
- **Raw Files:** 10 MB max (PDFs, ZIPs, etc.)
- **Image Transformations:** 100 MB max
- **Video Transformations:** 40 MB max

### Resolution Limits

- **Images:** 25 megapixels max
- **All Video Frames:** 50 megapixels max

### Account Limits

- **Monthly Credits:** 25
- **Admin API Calls:** 500/month
- **Users:** 3 max
- **Environments:** 1

---

## Configuration

### Environment Variables

All sensitive data is stored in `.env.local`:

```env
# Cloudinary Credentials
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dbdhj1c4m
NEXT_PUBLIC_CLOUDINARY_API_KEY=885264821638899
CLOUDINARY_API_SECRET=jpe1mgTZ7RhkLGlHBq9PFnF4UY0

# Limits (pre-configured for free plan)
NEXT_PUBLIC_CLOUDINARY_MAX_IMAGE_SIZE=10485760
NEXT_PUBLIC_CLOUDINARY_MAX_VIDEO_SIZE=104857600
NEXT_PUBLIC_CLOUDINARY_MAX_RAW_SIZE=10485760
```

### Configuration File

Located at `/lib/cloudinary/config.ts`:

- Exports all limits and constants
- Provides validation functions
- Defines folder structure
- Contains helper utilities

---

## File Upload

### Client-Side Upload

```typescript
import {
  uploadFileClient,
  uploadMultipleFilesClient,
  CloudinaryPaths,
} from "@/lib/cloudinary/upload";
import { validateFiles } from "@/lib/cloudinary/config";

// Always validate files FIRST
const validation = validateFiles(selectedFiles);
if (!validation.isValid) {
  // Show all errors to user
  validation.errors.forEach((error) => toast.error(error));
  return;
}

// Upload single file
const result = await uploadFileClient(
  file,
  CloudinaryPaths.events(eventId),
  (progress) => setProgress(progress)
);

console.log(result.url); // Public URL
console.log(result.publicId); // For deletion

// Upload multiple files
const results = await uploadMultipleFilesClient(
  validation.validFiles,
  CloudinaryPaths.events(eventId),
  (progress) => setOverallProgress(progress)
);
```

### Server-Side Upload (API Routes)

```typescript
import { uploadFileServer } from "@/lib/cloudinary/upload";

// In an API route
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await uploadFileServer(
    buffer,
    "blinking-events/events/event-123",
    {
      publicId: "custom-id",
      resourceType: "image",
    }
  );

  return Response.json({ url: result.url });
}
```

---

## File Deletion

### Delete by Public ID

```typescript
import { deleteFile, deleteMultipleFiles } from "@/lib/cloudinary/upload";

// Delete single file
await deleteFile("blinking-events/events/event-123/image", "image");

// Delete multiple files
await deleteMultipleFiles(
  [
    "blinking-events/events/event-123/image1",
    "blinking-events/events/event-123/image2",
  ],
  "image"
);
```

### Delete by URL

```typescript
import { getPublicIdFromUrl, deleteFile } from "@/lib/cloudinary/upload";

const fileUrl =
  "https://res.cloudinary.com/.../blinking-events/events/123/image.jpg";
const publicId = getPublicIdFromUrl(fileUrl);
await deleteFile(publicId, "image");
```

---

## File Validation

### Validate Before Upload (REQUIRED!)

```typescript
import { validateFiles } from "@/lib/cloudinary/config";

const validation = validateFiles(selectedFiles);

if (!validation.isValid) {
  // Show errors
  validation.errors.forEach((error) => {
    toast.error(error);
  });
  return;
}

// Use only valid files
const { validFiles } = validation;
await uploadMultipleFilesClient(validFiles, folder);
```

### Manual Validation

```typescript
import {
  validateFileSize,
  validateFileType,
  SUPPORTED_FILE_TYPES,
  getFileType,
} from "@/lib/cloudinary/config";

// Validate size
const sizeValidation = validateFileSize(file, "image");
if (!sizeValidation.isValid) {
  toast.error(sizeValidation.error);
}

// Validate type
const typeValidation = validateFileType(file, SUPPORTED_FILE_TYPES.IMAGES);
if (!typeValidation.isValid) {
  toast.error(typeValidation.error);
}

// Get file type category
const fileType = getFileType(file); // 'image' | 'video' | 'raw'
```

---

## Folder Structure

All files are organized in Cloudinary folders:

```
blinking-events/
├── events/
│   ├── event-123/
│   │   ├── image1.jpg
│   │   └── image2.jpg
│   └── event-456/
├── services/
│   └── service-789/
├── staff/
│   └── staff-101/
├── media/
├── testimonials/
├── users/
└── temp/
```

### Path Helpers

```typescript
import { CloudinaryPaths } from "@/lib/cloudinary/upload";

const path = CloudinaryPaths.events("event-123");
// Returns: 'blinking-events/events/event-123'

const path = CloudinaryPaths.staff("staff-456");
// Returns: 'blinking-events/staff/staff-456'
```

---

## Supported File Types

### Images

- **MIME Types:** `image/jpeg`, `image/jpg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml`
- **Extensions:** `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`
- **Max Size:** 10 MB

### Videos

- **MIME Types:** `video/mp4`, `video/webm`, `video/ogg`, `video/quicktime`
- **Extensions:** `.mp4`, `.webm`, `.ogg`, `.mov`
- **Max Size:** 100 MB

### Raw Files

- **MIME Types:** `application/pdf`, `application/zip`, `application/json`
- **Extensions:** `.pdf`, `.zip`, `.json`
- **Max Size:** 10 MB

---

## UI Components

### File Input with Validation

```typescript
import {
  getAcceptString,
  getFileSizeLimitMessage,
} from "@/lib/cloudinary/upload";

<div>
  <input
    type="file"
    accept={getAcceptString(["image", "video"])}
    multiple
    onChange={handleFileChange}
  />
  <p className="text-xs text-muted-foreground">
    {getFileSizeLimitMessage("image")}
  </p>
</div>;
```

### Upload Progress

```typescript
const [progress, setProgress] = useState(0);

const handleUpload = async () => {
  await uploadFileClient(file, folder, (progress) => setProgress(progress));
};

return (
  <div>
    {progress > 0 && progress < 100 && (
      <div>
        <p>Uploading: {progress.toFixed(0)}%</p>
        <div className="h-2 bg-gray-200 rounded">
          <div
            className="h-2 bg-blue-500 rounded transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    )}
  </div>
);
```

---

## Helper Functions

### Format File Size

```typescript
import { formatBytes } from "@/lib/cloudinary/config";

const size = formatBytes(1048576); // "1 MB"
const size = formatBytes(2560); // "2.5 KB"
```

### Check File Type

```typescript
import { isImage, isVideo, getFileType } from "@/lib/cloudinary/config";

if (isImage(file)) {
  console.log("It's an image!");
}

if (isVideo(file)) {
  console.log("It's a video!");
}

const type = getFileType(file); // 'image' | 'video' | 'raw'
```

### Generate Public ID

```typescript
import { generatePublicId } from "@/lib/cloudinary/config";

const publicId = generatePublicId("events", "my-photo.jpg");
// Returns: "events_1697472000000_my_photo.jpg"
```

---

## API Routes

### Upload Endpoint

`POST /api/cloudinary/upload`

```typescript
const formData = new FormData();
formData.append("file", file);
formData.append("folder", "blinking-events/events/123");

const response = await fetch("/api/cloudinary/upload", {
  method: "POST",
  body: formData,
});

const result = await response.json();
console.log(result.url);
```

### Delete Endpoint

`POST /api/cloudinary/delete`

```typescript
const response = await fetch("/api/cloudinary/delete", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    publicId: "blinking-events/events/123/image",
    resourceType: "image",
  }),
});
```

---

## Best Practices

### ✅ DO

1. **Always validate files before uploading**
2. **Show file size limits to users**
3. **Display upload progress for better UX**
4. **Delete old files when updating**
5. **Use structured folder paths**
6. **Handle errors gracefully**
7. **Clean up temp files**

### ❌ DON'T

1. **Upload files without validation**
2. **Exceed free plan limits**
3. **Hard-code file paths**
4. **Forget to delete replaced files**
5. **Upload to root folder**
6. **Ignore error messages**
7. **Store sensitive data in public IDs**

---

## Error Handling

### Common Errors

```typescript
try {
  await uploadFileClient(file, folder);
} catch (error) {
  if (error.message.includes("exceeds")) {
    toast.error("File is too large!");
  } else if (error.message.includes("not supported")) {
    toast.error("File type not supported!");
  } else {
    toast.error("Upload failed. Please try again.");
  }
}
```

### Validation Errors

```typescript
const validation = validateFiles(files);
if (!validation.isValid) {
  // Each error is descriptive
  validation.errors.forEach((error) => {
    // Example: "File 1 (photo.jpg): File size (15 MB) exceeds the maximum allowed size of 10 MB for image files."
    toast.error(error);
  });
}
```

---

## Monitoring Usage

### Check Credits

- Visit [Cloudinary Dashboard](https://cloudinary.com/console)
- View "Credits Used" in the dashboard
- Free plan = 25 credits/month

### Check Storage

- Dashboard → Media Library
- View total storage used
- Monitor file counts

### Check API Calls

- Dashboard → Reports
- View API usage
- Free plan = 500 admin API calls/month

---

## Migration from Firebase Storage

If you have existing Firebase Storage files:

1. Download all files from Firebase
2. Upload to Cloudinary using the upload utilities
3. Update database URLs to Cloudinary URLs
4. Delete files from Firebase Storage
5. Remove Firebase Storage dependencies

---

## Troubleshooting

### Upload Fails

- Check file size against limits
- Verify file type is supported
- Check internet connection
- Verify environment variables are set

### Files Not Deleting

- Verify public ID is correct
- Check resource type (image/video/raw)
- Ensure API secret is configured
- Check Cloudinary console for errors

### High Credit Usage

- Review transformation settings
- Optimize image sizes before upload
- Use appropriate quality settings
- Consider upgrading plan if needed

---

## Resources

- [Cloudinary Dashboard](https://cloudinary.com/console)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Upload Widget](https://cloudinary.com/documentation/upload_widget)
- [Transformation Reference](https://cloudinary.com/documentation/image_transformations)

---

**Remember:** Always validate files before uploading and respect the free plan limits!
