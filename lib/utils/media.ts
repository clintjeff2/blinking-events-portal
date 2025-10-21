/**
 * Media Type Detection and Utilities
 * Supports images and videos for portfolio and other media displays
 */

// Video file extensions
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg", ".mov", ".avi", ".mkv"];

// Image file extensions
const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".bmp",
];

// Document file extensions
const DOCUMENT_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
];

/**
 * Check if a URL or filename is a video based on extension
 */
export function isVideoUrl(url: string): boolean {
  if (!url) return false;

  const lowercaseUrl = url.toLowerCase();

  // Check file extension
  return VIDEO_EXTENSIONS.some((ext) => lowercaseUrl.includes(ext));
}

/**
 * Check if a URL or filename is an image based on extension
 */
export function isImageUrl(url: string): boolean {
  if (!url) return false;

  const lowercaseUrl = url.toLowerCase();

  // Check file extension
  return IMAGE_EXTENSIONS.some((ext) => lowercaseUrl.includes(ext));
}

/**
 * Check if a URL or filename is a document based on extension
 */
export function isDocumentUrl(url: string): boolean {
  if (!url) return false;

  const lowercaseUrl = url.toLowerCase();

  // Check file extension
  return DOCUMENT_EXTENSIONS.some((ext) => lowercaseUrl.includes(ext));
}

/**
 * Get media type from URL
 */
export function getMediaType(
  url: string
): "image" | "video" | "document" | "unknown" {
  if (isVideoUrl(url)) return "video";
  if (isImageUrl(url)) return "image";
  if (isDocumentUrl(url)) return "document";
  return "unknown";
}

/**
 * Check if a File object is a video
 */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/");
}

/**
 * Check if a File object is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

/**
 * Get media type from File object
 */
export function getFileMediaType(
  file: File
): "image" | "video" | "document" | "unknown" {
  if (isVideoFile(file)) return "video";
  if (isImageFile(file)) return "image";
  // Check if it's a document type
  if (
    file.type.includes("pdf") ||
    file.type.includes("document") ||
    file.type.includes("msword") ||
    file.type.includes("wordprocessingml") ||
    file.type.includes("spreadsheet") ||
    file.type.includes("presentation")
  ) {
    return "document";
  }
  return "unknown";
}
