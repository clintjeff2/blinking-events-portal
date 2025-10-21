/**
 * Cloudinary Upload Utilities
 * Client-side uploads for browser
 */

import {
  cloudinaryConfig,
  CLOUDINARY_FOLDERS,
  validateFiles,
  generatePublicId,
  getFileType,
  CLOUDINARY_LIMITS_READABLE,
} from "./config";

export interface UploadProgress {
  progress: number;
  status: "idle" | "uploading" | "success" | "error";
  error?: string;
  url?: string;
  publicId?: string;
}

export interface UploadResult {
  url: string;
  publicId: string;
  secureUrl: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
  resourceType: string;
}

/**
 * Simple upload function - direct to Cloudinary without API route
 * For cases where we don't want server-side processing
 */
export const uploadToCloudinary = async (
  file: File,
  folder: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    // Validate file
    const validation = validateFiles([file]);
    if (!validation.isValid) {
      throw new Error(validation.errors[0]);
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "blinking_events"); // You'll need to create this in Cloudinary
    formData.append("folder", folder);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = Math.round((e.loaded / e.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.secure_url);
          } catch (error) {
            reject(new Error("Failed to parse upload response"));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed - network error"));
      });

      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`
      );
      xhr.send(formData);
    });
  } catch (error: any) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

/**
 * Upload a single file to Cloudinary (Client-side)
 * Uses API route for server-side upload
 * @param file - The file to upload
 * @param folder - Cloudinary folder path
 * @param onProgress - Optional callback for upload progress
 * @returns Promise with upload result
 */
export const uploadFileClient = async (
  file: File,
  folder: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  try {
    // Validate file
    const validation = validateFiles([file]);
    if (!validation.isValid) {
      throw new Error(validation.errors[0]);
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    // Create XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = Math.round((e.loaded / e.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success && response.result) {
              resolve({
                url: response.result.url,
                publicId: response.result.publicId,
                secureUrl: response.result.secureUrl,
                format: response.result.format,
                width: response.result.width,
                height: response.result.height,
                bytes: response.result.bytes,
                resourceType: response.result.resourceType,
              });
            } else {
              reject(new Error(response.error || "Upload failed"));
            }
          } catch (error) {
            reject(new Error("Failed to parse upload response"));
          }
        } else {
          try {
            const response = JSON.parse(xhr.responseText);
            reject(
              new Error(
                response.error || `Upload failed with status ${xhr.status}`
              )
            );
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed - network error"));
      });

      xhr.open("POST", "/api/cloudinary/upload");
      xhr.send(formData);
    });
  } catch (error: any) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

/**
 * Upload multiple files to Cloudinary (Client-side)
 * @param files - Array of files to upload
 * @param folder - Cloudinary folder path
 * @param onProgress - Optional callback for overall progress
 * @returns Promise with array of upload results
 */
export const uploadMultipleFilesClient = async (
  files: File[],
  folder: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult[]> => {
  // Validate all files first
  const validation = validateFiles(files);
  if (!validation.isValid) {
    throw new Error(`File validation failed:\n${validation.errors.join("\n")}`);
  }

  const uploadPromises = files.map((file, index) => {
    return uploadFileClient(file, folder, (fileProgress) => {
      if (onProgress) {
        // Calculate overall progress
        const overallProgress = Math.round(
          ((index + fileProgress / 100) / files.length) * 100
        );
        onProgress(overallProgress);
      }
    });
  });

  try {
    return await Promise.all(uploadPromises);
  } catch (error: any) {
    throw new Error(`Failed to upload files: ${error.message}`);
  }
};

/**
 * Delete a file from Cloudinary (Client-side)
 * Calls API route to delete from server
 * @param publicId - The public ID of the file to delete
 * @param resourceType - Type of resource ('image', 'video', 'raw')
 */
export const deleteFile = async (
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image"
): Promise<void> => {
  // Client-side: Call API route
  const response = await fetch("/api/cloudinary/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicId, resourceType }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete file");
  }
};

/**
 * Delete multiple files from Cloudinary
 * @param publicIds - Array of public IDs to delete
 * @param resourceType - Type of resources
 */
export const deleteMultipleFiles = async (
  publicIds: string[],
  resourceType: "image" | "video" | "raw" = "image"
): Promise<void> => {
  const deletePromises = publicIds.map((publicId) =>
    deleteFile(publicId, resourceType)
  );

  try {
    await Promise.all(deletePromises);
  } catch (error: any) {
    throw new Error(`Failed to delete files: ${error.message}`);
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param url - Cloudinary URL
 * @returns Public ID
 */
export const getPublicIdFromUrl = (url: string): string => {
  try {
    // Extract public_id from Cloudinary URL
    // Format: https://res.cloudinary.com/[cloud]/[resource_type]/[type]/[version]/[public_id].[format]
    const parts = url.split("/");
    const lastPart = parts[parts.length - 1];
    const publicId = lastPart.split(".")[0];

    // Include folder structure
    const folderIndex = parts.indexOf("upload") + 1;
    if (folderIndex > 0 && folderIndex < parts.length - 1) {
      const folders = parts.slice(folderIndex, -1).join("/");
      return `${folders}/${publicId}`;
    }

    return publicId;
  } catch (error) {
    throw new Error("Invalid Cloudinary URL");
  }
};

/**
 * Storage path generators for different entities
 * Maps to Cloudinary folder structure
 */
export const CloudinaryPaths = {
  events: (eventId: string) => `${CLOUDINARY_FOLDERS.EVENTS}/${eventId}`,
  services: (serviceId: string) =>
    `${CLOUDINARY_FOLDERS.SERVICES}/${serviceId}`,
  staff: (staffId: string) => `${CLOUDINARY_FOLDERS.STAFF}/${staffId}`,
  media: (mediaId: string) => `${CLOUDINARY_FOLDERS.MEDIA}/${mediaId}`,
  testimonials: (testimonialId: string) =>
    `${CLOUDINARY_FOLDERS.TESTIMONIALS}/${testimonialId}`,
  marketing: {
    banners: () => `${CLOUDINARY_FOLDERS.MARKETING}/banners`,
    offers: () => `${CLOUDINARY_FOLDERS.MARKETING}/offers`,
  },
  users: {
    profile: (userId: string) =>
      `${CLOUDINARY_FOLDERS.USERS}/${userId}/profile`,
    documents: (userId: string) =>
      `${CLOUDINARY_FOLDERS.USERS}/${userId}/documents`,
  },
  temp: () => CLOUDINARY_FOLDERS.TEMP,
};

/**
 * Get file size limit message for UI
 */
export const getFileSizeLimitMessage = (
  type: "image" | "video" | "raw" = "image"
): string => {
  const limits = {
    image: CLOUDINARY_LIMITS_READABLE.MAX_IMAGE_SIZE,
    video: CLOUDINARY_LIMITS_READABLE.MAX_VIDEO_SIZE,
    raw: CLOUDINARY_LIMITS_READABLE.MAX_RAW_SIZE,
  };

  return `Maximum file size: ${limits[type]}`;
};

/**
 * Get all supported file types as a string for input accept attribute
 */
export const getAcceptString = (
  types: ("image" | "video" | "raw")[]
): string => {
  const extensions: string[] = [];

  if (types.includes("image")) {
    extensions.push(".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg");
  }
  if (types.includes("video")) {
    extensions.push(".mp4", ".webm", ".ogg", ".mov");
  }
  if (types.includes("raw")) {
    extensions.push(".pdf", ".zip", ".json");
  }

  return extensions.join(",");
};
