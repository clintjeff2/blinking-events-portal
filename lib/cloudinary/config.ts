/**
 * Cloudinary Configuration and Constants
 * Free Plan Limits and Upload Settings
 */

// Cloudinary Configuration
export const cloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dbdhj1c4m",
  apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || "885264821638899",
  apiSecret: process.env.CLOUDINARY_API_SECRET || "jpe1mgTZ7RhkLGlHBq9PFnF4UY0",
};

/**
 * Cloudinary Free Plan Limits
 * These are hard limits that cannot be exceeded
 */
export const CLOUDINARY_LIMITS = {
  // File Size Limits (in bytes)
  MAX_IMAGE_SIZE: parseInt(
    process.env.NEXT_PUBLIC_CLOUDINARY_MAX_IMAGE_SIZE || "10485760"
  ), // 10 MB
  MAX_VIDEO_SIZE: parseInt(
    process.env.NEXT_PUBLIC_CLOUDINARY_MAX_VIDEO_SIZE || "104857600"
  ), // 100 MB
  MAX_RAW_SIZE: parseInt(
    process.env.NEXT_PUBLIC_CLOUDINARY_MAX_RAW_SIZE || "10485760"
  ), // 10 MB
  MAX_IMAGE_TRANSFORM_SIZE: parseInt(
    process.env.NEXT_PUBLIC_CLOUDINARY_MAX_IMAGE_TRANSFORM_SIZE || "104857600"
  ), // 100 MB
  MAX_VIDEO_TRANSFORM_SIZE: parseInt(
    process.env.NEXT_PUBLIC_CLOUDINARY_MAX_VIDEO_TRANSFORM_SIZE || "41943040"
  ), // 40 MB

  // Megapixel Limits
  MAX_IMAGE_MEGAPIXELS: parseInt(
    process.env.NEXT_PUBLIC_CLOUDINARY_MAX_IMAGE_MEGAPIXELS || "25"
  ), // 25 MP
  MAX_ALL_FRAMES_MEGAPIXELS: parseInt(
    process.env.NEXT_PUBLIC_CLOUDINARY_MAX_ALL_FRAMES_MEGAPIXELS || "50"
  ), // 50 MP

  // Account Limits
  MONTHLY_CREDITS: parseInt(
    process.env.NEXT_PUBLIC_CLOUDINARY_MONTHLY_CREDITS || "25"
  ),
  ADMIN_API_LIMIT: parseInt(
    process.env.NEXT_PUBLIC_CLOUDINARY_ADMIN_API_LIMIT || "500"
  ),
  MAX_USERS: 3,
  PRODUCT_ENVIRONMENTS: 1,
} as const;

/**
 * Human-readable file size limits
 */
export const CLOUDINARY_LIMITS_READABLE = {
  MAX_IMAGE_SIZE: "10 MB",
  MAX_VIDEO_SIZE: "100 MB",
  MAX_RAW_SIZE: "10 MB",
  MAX_IMAGE_TRANSFORM_SIZE: "100 MB",
  MAX_VIDEO_TRANSFORM_SIZE: "40 MB",
  MAX_IMAGE_MEGAPIXELS: "25 MP",
  MAX_ALL_FRAMES_MEGAPIXELS: "50 MP",
} as const;

/**
 * Supported file types
 */
export const SUPPORTED_FILE_TYPES = {
  IMAGES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ],
  VIDEOS: ["video/mp4", "video/webm", "video/ogg", "video/quicktime"],
  RAW: ["application/pdf", "application/zip", "application/json"],
} as const;

/**
 * File type extensions
 */
export const FILE_EXTENSIONS = {
  IMAGES: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
  VIDEOS: [".mp4", ".webm", ".ogg", ".mov"],
  RAW: [".pdf", ".zip", ".json"],
} as const;

/**
 * Cloudinary folder structure for organized uploads
 */
export const CLOUDINARY_FOLDERS = {
  EVENTS: "blinking-events/events",
  SERVICES: "blinking-events/services",
  STAFF: "blinking-events/staff",
  MEDIA: "blinking-events/media",
  TESTIMONIALS: "blinking-events/testimonials",
  MARKETING: "blinking-events/marketing",
  USERS: "blinking-events/users",
  TEMP: "blinking-events/temp",
} as const;

/**
 * Upload presets for different use cases
 */
export const UPLOAD_PRESETS = {
  EVENT_IMAGES: {
    folder: CLOUDINARY_FOLDERS.EVENTS,
    transformation: [
      { width: 1920, height: 1080, crop: "limit" },
      { quality: "auto", fetch_format: "auto" },
    ],
  },
  SERVICE_IMAGES: {
    folder: CLOUDINARY_FOLDERS.SERVICES,
    transformation: [
      { width: 1200, height: 800, crop: "limit" },
      { quality: "auto", fetch_format: "auto" },
    ],
  },
  STAFF_AVATARS: {
    folder: CLOUDINARY_FOLDERS.STAFF,
    transformation: [
      { width: 500, height: 500, crop: "fill", gravity: "face" },
      { quality: "auto", fetch_format: "auto" },
    ],
  },
  THUMBNAILS: {
    transformation: [
      { width: 300, height: 200, crop: "fill" },
      { quality: "auto", fetch_format: "auto" },
    ],
  },
} as const;

/**
 * Validate file size against Cloudinary limits
 * @param file - File to validate
 * @param type - Type of file ('image', 'video', 'raw')
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateFileSize(
  file: File,
  type: "image" | "video" | "raw" = "image"
): { isValid: boolean; error?: string } {
  const limits = {
    image: CLOUDINARY_LIMITS.MAX_IMAGE_SIZE,
    video: CLOUDINARY_LIMITS.MAX_VIDEO_SIZE,
    raw: CLOUDINARY_LIMITS.MAX_RAW_SIZE,
  };

  const readableLimits = {
    image: CLOUDINARY_LIMITS_READABLE.MAX_IMAGE_SIZE,
    video: CLOUDINARY_LIMITS_READABLE.MAX_VIDEO_SIZE,
    raw: CLOUDINARY_LIMITS_READABLE.MAX_RAW_SIZE,
  };

  const maxSize = limits[type];
  const readableLimit = readableLimits[type];

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size (${formatBytes(
        file.size
      )}) exceeds the maximum allowed size of ${readableLimit} for ${type} files.`,
    };
  }

  return { isValid: true };
}

/**
 * Validate file type
 * @param file - File to validate
 * @param allowedTypes - Array of allowed MIME types
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateFileType(
  file: File,
  allowedTypes: readonly string[]
): { isValid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type "${
        file.type
      }" is not supported. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  return { isValid: true };
}

/**
 * Format bytes to human readable string
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places
 * @returns Formatted string (e.g., "10.5 MB")
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Check if file is an image
 */
export function isImage(file: File): boolean {
  return (SUPPORTED_FILE_TYPES.IMAGES as readonly string[]).includes(file.type);
}

/**
 * Check if file is a video
 */
export function isVideo(file: File): boolean {
  return (SUPPORTED_FILE_TYPES.VIDEOS as readonly string[]).includes(file.type);
}

/**
 * Get file type category
 */
export function getFileType(file: File): "image" | "video" | "raw" {
  if (isImage(file)) return "image";
  if (isVideo(file)) return "video";
  return "raw";
}

/**
 * Validate multiple files at once
 */
export function validateFiles(files: File[]): {
  isValid: boolean;
  errors: string[];
  validFiles: File[];
} {
  const errors: string[] = [];
  const validFiles: File[] = [];

  files.forEach((file, index) => {
    const fileType = getFileType(file);

    // Validate file type
    const typeValidation = validateFileType(
      file,
      fileType === "image"
        ? SUPPORTED_FILE_TYPES.IMAGES
        : fileType === "video"
        ? SUPPORTED_FILE_TYPES.VIDEOS
        : SUPPORTED_FILE_TYPES.RAW
    );

    if (!typeValidation.isValid) {
      errors.push(`File ${index + 1} (${file.name}): ${typeValidation.error}`);
      return;
    }

    // Validate file size
    const sizeValidation = validateFileSize(file, fileType);

    if (!sizeValidation.isValid) {
      errors.push(`File ${index + 1} (${file.name}): ${sizeValidation.error}`);
      return;
    }

    validFiles.push(file);
  });

  return {
    isValid: errors.length === 0,
    errors,
    validFiles,
  };
}

/**
 * Generate a unique public ID for Cloudinary uploads
 */
export function generatePublicId(prefix: string, fileName: string): string {
  const timestamp = Date.now();
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.]/g, "_");
  return `${prefix}_${timestamp}_${cleanFileName}`;
}
