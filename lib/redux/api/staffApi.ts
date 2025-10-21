// Staff API - RTK Query endpoints for staff management
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
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { firebaseApi } from "./firebaseApi";

// Staff data types based on Firebase schema
export interface StaffProfile {
  id: string;
  staffProfileId?: string;
  fullName: string;
  photoUrl: string;
  bio: string;
  skills: string[];
  qualifications: string[];
  languages: string[];
  categories: string[];
  availability: AvailabilitySlot[];
  portfolio: PortfolioItem[];
  rating: number;
  reviews: Review[];
  contact: {
    phone: string;
    email: string;
  };
  isActive: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface AvailabilitySlot {
  from: Timestamp | Date;
  to: Timestamp | Date;
}

export interface PortfolioItem {
  eventName: string;
  description: string;
  media: string[];
}

export interface Review {
  userId: string;
  rating: number;
  comment: string;
  createdAt: Timestamp | Date;
}

export interface CreateStaffInput {
  fullName: string;
  photoUrl: string;
  bio: string;
  skills: string[];
  qualifications: string[];
  languages: string[];
  categories: string[];
  contact: {
    phone: string;
    email: string;
  };
  availability?: AvailabilitySlot[];
  portfolio?: PortfolioItem[];
}

export interface UpdateStaffInput {
  id: string;
  data: Partial<CreateStaffInput>;
}

// Helper function to convert Firestore data
const convertStaffData = (doc: any): StaffProfile => {
  const data = doc.data();
  return {
    id: doc.id,
    staffProfileId: doc.id,
    fullName: data.fullName || "",
    photoUrl: data.photoUrl || "",
    bio: data.bio || "",
    skills: data.skills || [],
    qualifications: data.qualifications || [],
    languages: data.languages || [],
    categories: data.categories || [],
    availability: data.availability || [],
    portfolio: data.portfolio || [],
    rating: data.rating || 0,
    reviews: data.reviews || [],
    contact: data.contact || { phone: "", email: "" },
    isActive: data.isActive ?? true,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
};

export const staffApi = firebaseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all staff
    getStaff: builder.query<
      StaffProfile[],
      { isActive?: boolean; category?: string }
    >({
      async queryFn({ isActive, category }) {
        try {
          const staffRef = collection(db, "staffProfiles");
          let q = query(staffRef, orderBy("createdAt", "desc"));

          // Apply filters
          if (isActive !== undefined) {
            q = query(
              staffRef,
              where("isActive", "==", isActive),
              orderBy("createdAt", "desc")
            );
          }

          const snapshot = await getDocs(q);
          let staff = snapshot.docs.map(convertStaffData);

          // Filter by category if provided
          if (category && category !== "All") {
            staff = staff.filter((s) => s.categories.includes(category));
          }

          return { data: staff };
        } catch (error: any) {
          return { error: { error: error.message } };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Staff" as const, id })),
              { type: "Staff", id: "LIST" },
            ]
          : [{ type: "Staff", id: "LIST" }],
    }),

    // Get staff by ID
    getStaffById: builder.query<StaffProfile, string>({
      async queryFn(id) {
        try {
          const docRef = doc(db, "staffProfiles", id);
          const docSnap = await getDoc(docRef);

          if (!docSnap.exists()) {
            return { error: { error: "Staff member not found" } };
          }

          return { data: convertStaffData(docSnap) };
        } catch (error: any) {
          return { error: { error: error.message } };
        }
      },
      providesTags: (result, error, id) => [{ type: "Staff", id }],
    }),

    // Get staff by category
    getStaffByCategory: builder.query<StaffProfile[], string>({
      async queryFn(category) {
        try {
          const staffRef = collection(db, "staffProfiles");
          const q = query(
            staffRef,
            where("categories", "array-contains", category),
            where("isActive", "==", true),
            orderBy("rating", "desc")
          );

          const snapshot = await getDocs(q);
          const staff = snapshot.docs.map(convertStaffData);

          return { data: staff };
        } catch (error: any) {
          return { error: { error: error.message } };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Staff" as const, id })),
              { type: "Staff", id: "CATEGORY" },
            ]
          : [{ type: "Staff", id: "CATEGORY" }],
    }),

    // Create staff
    createStaff: builder.mutation<StaffProfile, CreateStaffInput>({
      async queryFn(staffData) {
        try {
          const staffRef = collection(db, "staffProfiles");
          const newStaff = {
            ...staffData,
            rating: 0,
            reviews: [],
            portfolio: staffData.portfolio || [],
            availability: staffData.availability || [],
            isActive: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          };

          const docRef = await addDoc(staffRef, newStaff);
          const docSnap = await getDoc(docRef);

          return { data: convertStaffData(docSnap) };
        } catch (error: any) {
          return { error: { error: error.message } };
        }
      },
      invalidatesTags: [{ type: "Staff", id: "LIST" }],
    }),

    // Update staff
    updateStaff: builder.mutation<StaffProfile, UpdateStaffInput>({
      async queryFn({ id, data }) {
        try {
          const docRef = doc(db, "staffProfiles", id);
          const updateData = {
            ...data,
            updatedAt: Timestamp.now(),
          };

          await updateDoc(docRef, updateData);
          const docSnap = await getDoc(docRef);

          return { data: convertStaffData(docSnap) };
        } catch (error: any) {
          return { error: { error: error.message } };
        }
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Staff", id },
        { type: "Staff", id: "LIST" },
      ],
    }),

    // Soft delete staff (set isActive to false)
    deleteStaff: builder.mutation<void, string>({
      async queryFn(id) {
        try {
          const docRef = doc(db, "staffProfiles", id);
          await updateDoc(docRef, {
            isActive: false,
            updatedAt: Timestamp.now(),
          });

          return { data: undefined };
        } catch (error: any) {
          return { error: { error: error.message } };
        }
      },
      invalidatesTags: (result, error, id) => [
        { type: "Staff", id },
        { type: "Staff", id: "LIST" },
      ],
    }),

    // Hard delete staff (permanent)
    hardDeleteStaff: builder.mutation<void, string>({
      async queryFn(id) {
        try {
          const docRef = doc(db, "staffProfiles", id);
          await deleteDoc(docRef);

          return { data: undefined };
        } catch (error: any) {
          return { error: { error: error.message } };
        }
      },
      invalidatesTags: [{ type: "Staff", id: "LIST" }],
    }),

    // Add review to staff
    addStaffReview: builder.mutation<
      StaffProfile,
      { id: string; review: Omit<Review, "createdAt"> }
    >({
      async queryFn({ id, review }) {
        try {
          const docRef = doc(db, "staffProfiles", id);
          const docSnap = await getDoc(docRef);

          if (!docSnap.exists()) {
            return { error: { error: "Staff member not found" } };
          }

          const currentData = docSnap.data();
          const reviews = currentData.reviews || [];
          const newReview = {
            ...review,
            createdAt: Timestamp.now(),
          };

          reviews.push(newReview);

          // Calculate new average rating
          const totalRating = reviews.reduce(
            (sum: number, r: any) => sum + r.rating,
            0
          );
          const newRating = totalRating / reviews.length;

          await updateDoc(docRef, {
            reviews,
            rating: newRating,
            updatedAt: Timestamp.now(),
          });

          const updatedSnap = await getDoc(docRef);
          return { data: convertStaffData(updatedSnap) };
        } catch (error: any) {
          return { error: { error: error.message } };
        }
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Staff", id },
        { type: "Staff", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetStaffQuery,
  useGetStaffByIdQuery,
  useGetStaffByCategoryQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  useHardDeleteStaffMutation,
  useAddStaffReviewMutation,
} = staffApi;
