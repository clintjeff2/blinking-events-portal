import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  firebaseApi,
  convertFirestoreData,
  withTimestamp,
} from "./firebaseApi";

export interface MediaItem {
  id: string;
  title: string;
  url: string[]; // Array of media URLs
  thumbnailUrl: string;
  category: string; // e.g., 'wedding', 'corporate', 'cultural'
  eventId?: string; // Optional reference to events
  description: string;
  isFeatured: boolean;
  tags: string[];
  uploadedBy: string; // userId/adminId
  uploadedAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export const mediaApi = firebaseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all media (only active items)
    getMedia: builder.query<
      MediaItem[],
      { category?: string; isFeatured?: boolean }
    >({
      async queryFn({ category, isFeatured }) {
        try {
          console.log("[MediaAPI] Fetching media with filters:", {
            category,
            isFeatured,
          });

          const mediaRef = collection(db, "media");

          // Always filter by isActive = true (soft delete support)
          const constraints = [where("isActive", "==", true)];

          // Apply additional filters if provided
          if (category) {
            constraints.push(where("category", "==", category));
          }
          if (isFeatured !== undefined) {
            constraints.push(where("isFeatured", "==", isFeatured));
          }

          const q = query(mediaRef, ...constraints);
          const snapshot = await getDocs(q);

          console.log(
            "[MediaAPI] Found",
            snapshot.docs.length,
            "active media items"
          );

          const media = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...convertFirestoreData(doc.data()),
          })) as MediaItem[];

          return { data: media };
        } catch (error: any) {
          console.error("[MediaAPI] Error fetching media:", error);
          return { error: error.message || "Unknown error occurred" };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Media" as const, id })),
              { type: "Media", id: "LIST" },
            ]
          : [{ type: "Media", id: "LIST" }],
    }),

    // Get media by ID
    getMediaById: builder.query<MediaItem, string>({
      async queryFn(mediaId) {
        try {
          const mediaDoc = await getDoc(doc(db, "media", mediaId));
          if (!mediaDoc.exists()) {
            return { error: "Media not found" };
          }
          const media = {
            id: mediaDoc.id,
            ...convertFirestoreData(mediaDoc.data()),
          } as MediaItem;
          return { data: media };
        } catch (error: any) {
          return { error: error.message };
        }
      },
      providesTags: (result, error, id) => [{ type: "Media", id }],
    }),

    // Get media by event
    getMediaByEvent: builder.query<MediaItem[], string>({
      async queryFn(eventId) {
        try {
          const mediaRef = collection(db, "media");
          const q = query(
            mediaRef,
            where("isActive", "==", true),
            where("eventId", "==", eventId),
            orderBy("uploadedAt", "desc")
          );
          const snapshot = await getDocs(q);
          const media = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...convertFirestoreData(doc.data()),
          })) as MediaItem[];
          return { data: media };
        } catch (error: any) {
          return { error: error.message };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Media" as const, id })),
              { type: "Media", id: "LIST" },
            ]
          : [{ type: "Media", id: "LIST" }],
    }),

    // Create media
    createMedia: builder.mutation<
      MediaItem,
      Omit<MediaItem, "id" | "createdAt" | "updatedAt">
    >({
      async queryFn(mediaData) {
        try {
          console.log("[MediaAPI] Creating media with data:", mediaData);

          // Clean the data - remove undefined fields
          const cleanData = Object.entries(mediaData).reduce(
            (acc, [key, value]) => {
              if (value !== undefined) {
                acc[key] = value;
              }
              return acc;
            },
            {} as any
          );

          console.log("[MediaAPI] Cleaned data:", cleanData);

          const mediaRef = collection(db, "media");
          const docRef = await addDoc(mediaRef, withTimestamp(cleanData));

          console.log("[MediaAPI] Document created with ID:", docRef.id);

          const newDoc = await getDoc(docRef);
          const media = {
            id: newDoc.id,
            ...convertFirestoreData(newDoc.data()!),
          } as MediaItem;

          console.log("[MediaAPI] Media created successfully:", media);
          return { data: media };
        } catch (error: any) {
          console.error("[MediaAPI] Error creating media:", error);
          return { error: error.message };
        }
      },
      invalidatesTags: [{ type: "Media", id: "LIST" }],
    }),

    // Update media
    updateMedia: builder.mutation<
      MediaItem,
      { id: string; data: Partial<MediaItem> }
    >({
      async queryFn({ id, data }) {
        try {
          const mediaRef = doc(db, "media", id);
          await updateDoc(mediaRef, withTimestamp(data, true));
          const updatedDoc = await getDoc(mediaRef);
          if (!updatedDoc.exists()) {
            return { error: "Media not found after update" };
          }
          const media = {
            id: updatedDoc.id,
            ...convertFirestoreData(updatedDoc.data()),
          } as MediaItem;
          return { data: media };
        } catch (error: any) {
          return { error: error.message };
        }
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Media", id },
        { type: "Media", id: "LIST" },
      ],
    }),

    // Delete media (soft delete)
    deleteMedia: builder.mutation<void, string>({
      async queryFn(mediaId) {
        try {
          console.log("[MediaAPI] 🗑️ Deleting media:", mediaId);

          const mediaRef = doc(db, "media", mediaId);

          // Check if document exists first
          const docSnap = await getDoc(mediaRef);
          if (!docSnap.exists()) {
            console.error("[MediaAPI] ❌ Media document not found:", mediaId);
            return { error: "Media not found" };
          }

          // Soft delete by setting isActive to false
          await updateDoc(mediaRef, {
            isActive: false,
            updatedAt: withTimestamp({}, true).updatedAt,
          });

          console.log(
            "[MediaAPI] ✅ Media soft-deleted successfully:",
            mediaId
          );

          // Return null instead of undefined for void mutations
          return { data: null as unknown as void };
        } catch (error: any) {
          console.error("[MediaAPI] ❌ Error deleting media:", error);
          return { error: error.message };
        }
      },
      invalidatesTags: (result, error, id) => [
        { type: "Media", id },
        { type: "Media", id: "LIST" },
      ],
    }),

    // Toggle featured status
    toggleFeatured: builder.mutation<
      MediaItem,
      { id: string; isFeatured: boolean }
    >({
      async queryFn({ id, isFeatured }) {
        try {
          const mediaRef = doc(db, "media", id);
          await updateDoc(mediaRef, withTimestamp({ isFeatured }, true));
          const updatedDoc = await getDoc(mediaRef);
          if (!updatedDoc.exists()) {
            return { error: "Media not found after update" };
          }
          const media = {
            id: updatedDoc.id,
            ...convertFirestoreData(updatedDoc.data()),
          } as MediaItem;
          return { data: media };
        } catch (error: any) {
          return { error: error.message };
        }
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Media", id },
        { type: "Media", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetMediaQuery,
  useGetMediaByIdQuery,
  useGetMediaByEventQuery,
  useCreateMediaMutation,
  useUpdateMediaMutation,
  useDeleteMediaMutation,
  useToggleFeaturedMutation,
} = mediaApi;
