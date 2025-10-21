/**
 * Cloudinary Server-Side Upload Utilities
 * Use these only in API routes or server components
 */

import { v2 as cloudinary } from "cloudinary";
import { cloudinaryConfig } from "./config";

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudinaryConfig.cloudName,
  api_key: cloudinaryConfig.apiKey,
  api_secret: cloudinaryConfig.apiSecret,
});

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
 * Upload a file to Cloudinary (Server-side only)
 * Use this in API routes
 * @param fileBuffer - File buffer or base64 string
 * @param folder - Cloudinary folder path
 * @param options - Upload options
 * @returns Promise with upload result
 */
export const uploadFileServer = async (
  fileBuffer: Buffer | string,
  folder: string,
  options?: {
    publicId?: string;
    transformation?: any;
    resourceType?: "image" | "video" | "raw" | "auto";
    format?: string;
  }
): Promise<UploadResult> => {
  const maxRetries = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[Server Upload] Starting upload (attempt ${attempt}/${maxRetries})...`
      );
      console.log(
        "[Server Upload] Buffer type:",
        Buffer.isBuffer(fileBuffer) ? "Buffer" : typeof fileBuffer
      );
      console.log("[Server Upload] Folder:", folder);
      console.log("[Server Upload] Options:", JSON.stringify(options));

      let uploadData: string;

      if (Buffer.isBuffer(fileBuffer)) {
        // Determine the appropriate MIME type based on resourceType or format
        const format = options?.format || "png";
        const resourceType = options?.resourceType || "auto";

        console.log("[Server Upload] File format:", format);
        console.log("[Server Upload] Resource type:", resourceType);

        // For videos, use video MIME type
        let mimeType = "image/png";
        if (
          resourceType === "video" ||
          ["mp4", "mov", "avi", "webm"].includes(format.toLowerCase())
        ) {
          mimeType = `video/${format}`;
        } else if (
          resourceType === "raw" ||
          ["pdf", "doc", "docx"].includes(format.toLowerCase())
        ) {
          mimeType = `application/${format}`;
        } else {
          mimeType = `image/${format}`;
        }

        console.log("[Server Upload] Using MIME type:", mimeType);
        console.log("[Server Upload] Buffer length:", fileBuffer.length);

        uploadData = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
        console.log("[Server Upload] Base64 data length:", uploadData.length);
      } else {
        uploadData = fileBuffer;
        console.log(
          "[Server Upload] Using string data, length:",
          uploadData.length
        );
      }

      console.log("[Server Upload] Calling Cloudinary API...");
      const result = await cloudinary.uploader.upload(uploadData, {
        folder,
        public_id: options?.publicId,
        transformation: options?.transformation,
        resource_type: options?.resourceType || "auto",
        timeout: 60000, // 60 second timeout
      });

      console.log("[Server Upload] Upload successful!");
      console.log("[Server Upload] Result URL:", result.url);
      console.log("[Server Upload] Public ID:", result.public_id);

      return {
        url: result.url,
        publicId: result.public_id,
        secureUrl: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        resourceType: result.resource_type,
      };
    } catch (error: any) {
      lastError = error;
      const errorCode =
        error.error?.code || error.code || error.error?.name || error.name;
      const isRetryable =
        errorCode === "ECONNRESET" ||
        errorCode === "ETIMEDOUT" ||
        errorCode === "ENOTFOUND" ||
        errorCode === "ECONNREFUSED" ||
        errorCode === "TimeoutError" ||
        error.error?.name === "TimeoutError" ||
        error.error?.message?.includes("Timeout");

      console.error(`[Server Upload] ❌ ERROR on attempt ${attempt}:`, error);
      console.error("[Server Upload] Error code:", errorCode);
      console.error(
        "[Server Upload] Error message:",
        error.message || error.error?.message
      );
      console.error("[Server Upload] Is retryable:", isRetryable);

      if (isRetryable && attempt < maxRetries) {
        const delay = attempt * 2000; // Exponential backoff: 2s, 4s, 6s
        console.log(`[Server Upload] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // If not retryable or out of retries, throw the error
      console.error("[Server Upload] Error stack:", error.stack);
      console.error(
        "[Server Upload] Full error object:",
        JSON.stringify(error, null, 2)
      );
      break;
    }
  }

  // Handle nested error structure from Cloudinary
  const errorMessage =
    lastError.message ||
    lastError.error?.message ||
    lastError.error?.code ||
    "Unknown upload error";

  throw new Error(
    `Failed to upload file after ${maxRetries} attempts: ${errorMessage}`
  );
};

/**
 * Delete a file from Cloudinary (Server-side only)
 * Use this in API routes
 * @param publicId - The public ID of the file to delete
 * @param resourceType - Type of resource
 */
export const deleteFileServer = async (
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image"
): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error: any) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

/**
 * Delete multiple files from Cloudinary (Server-side only)
 * @param publicIds - Array of public IDs to delete
 * @param resourceType - Type of resources
 */
export const deleteMultipleFilesServer = async (
  publicIds: string[],
  resourceType: "image" | "video" | "raw" = "image"
): Promise<void> => {
  try {
    await cloudinary.api.delete_resources(publicIds, {
      resource_type: resourceType,
    });
  } catch (error: any) {
    throw new Error(`Failed to delete files: ${error.message}`);
  }
};
