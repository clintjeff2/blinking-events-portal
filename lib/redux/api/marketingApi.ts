import {
  collection,
  doc,
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

// Special Offers Types
export interface Offer {
  id: string;
  title: string;
  description: string;
  discount: string;
  validFrom: any;
  validTo: any;
  isActive: boolean;
  redemptions: number;
  terms?: string;
  category?: string;
  createdAt: any;
  updatedAt: any;
}

export interface CreateOfferRequest {
  title: string;
  description: string;
  discount: string;
  validFrom: any;
  validTo: any;
  isActive: boolean;
  terms?: string;
  category?: string;
}

export interface UpdateOfferRequest {
  id: string;
  title?: string;
  description?: string;
  discount?: string;
  validFrom?: any;
  validTo?: any;
  isActive?: boolean;
  terms?: string;
  category?: string;
}

// Marketing Banners Types
export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  link: string;
  position: string;
  isActive: boolean;
  order: number;
  description?: string;
  createdAt: any;
  updatedAt: any;
}

export interface CreateBannerRequest {
  title: string;
  imageUrl: string;
  link: string;
  position: string;
  isActive: boolean;
  order?: number;
  description?: string;
}

export interface UpdateBannerRequest {
  id: string;
  title?: string;
  imageUrl?: string;
  link?: string;
  position?: string;
  isActive?: boolean;
  order?: number;
  description?: string;
}

export interface GetOffersRequest {
  isActive?: boolean;
  category?: string;
}

export interface GetBannersRequest {
  isActive?: boolean;
  position?: string;
}

// Extend the main firebaseApi
export const marketingApi = firebaseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Special Offers endpoints
    getOffers: builder.query<Offer[], GetOffersRequest>({
      queryFn: async ({ isActive, category }) => {
        try {
          console.log("[Marketing API] Fetching offers with filters:", {
            isActive,
            category,
          });

          const offersRef = collection(db, "marketing", "offers", "offers");
          const constraints = [];

          // Add active status filter
          if (isActive !== undefined) {
            constraints.push(where("isActive", "==", isActive));
          }

          // Add category filter
          if (category && category !== "all") {
            constraints.push(where("category", "==", category));
          }

          // Add ordering
          constraints.push(orderBy("createdAt", "desc"));

          const q = query(offersRef, ...constraints);
          const querySnapshot = await getDocs(q);

          const offers = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...convertFirestoreData(doc.data()),
          })) as Offer[];

          console.log("[Marketing API] Retrieved offers:", offers.length);
          return { data: offers };
        } catch (error: any) {
          console.error("[Marketing API] Error fetching offers:", error);
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      providesTags: ["Marketing"],
    }),

    createOffer: builder.mutation<Offer, CreateOfferRequest>({
      queryFn: async (offerData) => {
        try {
          console.log("[Marketing API] Creating offer:", offerData);

          const offersRef = collection(db, "marketing", "offers", "offers");
          const newOffer = withTimestamp({
            ...offerData,
            redemptions: 0,
          });

          const docRef = await addDoc(offersRef, newOffer);

          const result = {
            id: docRef.id,
            ...offerData,
            redemptions: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          console.log("[Marketing API] Offer created:", result);
          return { data: result };
        } catch (error: any) {
          console.error("[Marketing API] Error creating offer:", error);
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: ["Marketing"],
    }),

    updateOffer: builder.mutation<Offer, UpdateOfferRequest>({
      queryFn: async ({ id, ...updates }) => {
        try {
          console.log("[Marketing API] Updating offer:", id, updates);

          const offerRef = doc(db, "marketing", "offers", "offers", id);
          const updatedData = withTimestamp(updates, true);

          await updateDoc(offerRef, updatedData);

          const result = {
            id,
            ...updates,
            updatedAt: new Date().toISOString(),
          };

          console.log("[Marketing API] Offer updated:", result);
          return { data: result as Offer };
        } catch (error: any) {
          console.error("[Marketing API] Error updating offer:", error);
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: ["Marketing"],
    }),

    deleteOffer: builder.mutation<void, string>({
      queryFn: async (id) => {
        try {
          console.log("[Marketing API] Deleting offer:", id);

          const offerRef = doc(db, "marketing", "offers", "offers", id);
          await deleteDoc(offerRef);

          console.log("[Marketing API] Offer deleted:", id);
          return { data: undefined };
        } catch (error: any) {
          console.error("[Marketing API] Error deleting offer:", error);
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: ["Marketing"],
    }),

    // Marketing Banners endpoints
    getBanners: builder.query<Banner[], GetBannersRequest>({
      queryFn: async ({ isActive, position }) => {
        try {
          console.log("[Marketing API] Fetching banners with filters:", {
            isActive,
            position,
          });

          const bannersRef = collection(db, "marketing", "banners", "banners");
          const constraints = [];

          // Add active status filter
          if (isActive !== undefined) {
            constraints.push(where("isActive", "==", isActive));
          }

          // Add position filter
          if (position && position !== "all") {
            constraints.push(where("position", "==", position));
          }

          // Add ordering
          constraints.push(orderBy("order", "asc"));
          constraints.push(orderBy("createdAt", "desc"));

          const q = query(bannersRef, ...constraints);
          const querySnapshot = await getDocs(q);

          const banners = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...convertFirestoreData(doc.data()),
          })) as Banner[];

          console.log("[Marketing API] Retrieved banners:", banners.length);
          return { data: banners };
        } catch (error: any) {
          console.error("[Marketing API] Error fetching banners:", error);
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      providesTags: ["Marketing"],
    }),

    createBanner: builder.mutation<Banner, CreateBannerRequest>({
      queryFn: async (bannerData) => {
        try {
          console.log("[Marketing API] Creating banner:", bannerData);

          const bannersRef = collection(db, "marketing", "banners", "banners");
          const newBanner = withTimestamp({
            ...bannerData,
            order: bannerData.order || 0,
          });

          const docRef = await addDoc(bannersRef, newBanner);

          const result = {
            id: docRef.id,
            ...bannerData,
            order: bannerData.order || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          console.log("[Marketing API] Banner created:", result);
          return { data: result };
        } catch (error: any) {
          console.error("[Marketing API] Error creating banner:", error);
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: ["Marketing"],
    }),

    updateBanner: builder.mutation<Banner, UpdateBannerRequest>({
      queryFn: async ({ id, ...updates }) => {
        try {
          console.log("[Marketing API] Updating banner:", id, updates);

          const bannerRef = doc(db, "marketing", "banners", "banners", id);
          const updatedData = withTimestamp(updates, true);

          await updateDoc(bannerRef, updatedData);

          const result = {
            id,
            ...updates,
            updatedAt: new Date().toISOString(),
          };

          console.log("[Marketing API] Banner updated:", result);
          return { data: result as Banner };
        } catch (error: any) {
          console.error("[Marketing API] Error updating banner:", error);
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: ["Marketing"],
    }),

    deleteBanner: builder.mutation<void, string>({
      queryFn: async (id) => {
        try {
          console.log("[Marketing API] Deleting banner:", id);

          const bannerRef = doc(db, "marketing", "banners", "banners", id);
          await deleteDoc(bannerRef);

          console.log("[Marketing API] Banner deleted:", id);
          return { data: undefined };
        } catch (error: any) {
          console.error("[Marketing API] Error deleting banner:", error);
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: ["Marketing"],
    }),
  }),
});

export const {
  useGetOffersQuery,
  useCreateOfferMutation,
  useUpdateOfferMutation,
  useDeleteOfferMutation,
  useGetBannersQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
} = marketingApi;
