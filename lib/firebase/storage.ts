import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  UploadTask,
} from "firebase/storage";
import { storage } from "@/lib/firebase/config";

export interface UploadProgress {
  progress: number;
  status: "idle" | "uploading" | "success" | "error";
  error?: string;
  downloadURL?: string;
}

/**
 * Upload a single file to Firebase Storage
 * @param file - The file to upload
 * @param path - Storage path (e.g., 'events/event-id/image.jpg')
 * @param onProgress - Optional callback for upload progress
 * @returns Promise with download URL
 */
export const uploadFile = async (
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    const storageRef = ref(storage, path);

    if (onProgress) {
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(progress);
          },
          (error) => {
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    } else {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    }
  } catch (error: any) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

/**
 * Upload multiple files to Firebase Storage
 * @param files - Array of files to upload
 * @param basePath - Base storage path
 * @param onProgress - Optional callback for overall progress
 * @returns Promise with array of download URLs
 */
export const uploadMultipleFiles = async (
  files: File[],
  basePath: string,
  onProgress?: (progress: number) => void
): Promise<string[]> => {
  const uploadPromises = files.map((file, index) => {
    const fileName = `${Date.now()}-${index}-${file.name}`;
    const filePath = `${basePath}/${fileName}`;
    return uploadFile(file, filePath);
  });

  if (onProgress) {
    let completed = 0;
    const total = files.length;

    const trackedPromises = uploadPromises.map((promise) =>
      promise.then((url) => {
        completed++;
        onProgress((completed / total) * 100);
        return url;
      })
    );

    return Promise.all(trackedPromises);
  }

  return Promise.all(uploadPromises);
};

/**
 * Delete a file from Firebase Storage
 * @param url - The download URL or storage path of the file
 */
export const deleteFile = async (url: string): Promise<void> => {
  try {
    // Extract path from URL if it's a full download URL
    let filePath = url;
    if (url.includes("firebasestorage.googleapis.com")) {
      const urlParts = url.split("/o/")[1];
      if (urlParts) {
        filePath = decodeURIComponent(urlParts.split("?")[0]);
      }
    }

    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
  } catch (error: any) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

/**
 * Delete multiple files from Firebase Storage
 * @param urls - Array of download URLs or storage paths
 */
export const deleteMultipleFiles = async (urls: string[]): Promise<void> => {
  const deletePromises = urls.map((url) => deleteFile(url));
  await Promise.all(deletePromises);
};

/**
 * Get all files in a storage path
 * @param path - Storage path
 * @returns Array of download URLs
 */
export const listFilesInPath = async (path: string): Promise<string[]> => {
  try {
    const listRef = ref(storage, path);
    const result = await listAll(listRef);

    const urlPromises = result.items.map((itemRef) => getDownloadURL(itemRef));
    return Promise.all(urlPromises);
  } catch (error: any) {
    throw new Error(`Failed to list files: ${error.message}`);
  }
};

/**
 * Storage path generators for different entities
 */
export const StoragePaths = {
  events: (eventId: string, fileName: string) =>
    `events/${eventId}/${fileName}`,
  services: (serviceId: string, fileName: string) =>
    `services/${serviceId}/${fileName}`,
  staff: (staffId: string, fileName: string) => `staff/${staffId}/${fileName}`,
  media: (mediaId: string, fileName: string) => `media/${mediaId}/${fileName}`,
  testimonials: (testimonialId: string, fileName: string) =>
    `testimonials/${testimonialId}/${fileName}`,
  users: (userId: string, fileName: string) => `users/${userId}/${fileName}`,
};
