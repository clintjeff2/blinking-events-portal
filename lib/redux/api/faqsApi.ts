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

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  isActive: boolean;
  order: number;
  createdAt: any;
  updatedAt: any;
}

export interface CreateFAQRequest {
  question: string;
  answer: string;
  category: string;
  isActive: boolean;
  order?: number;
}

export interface UpdateFAQRequest {
  id: string;
  question?: string;
  answer?: string;
  category?: string;
  isActive?: boolean;
  order?: number;
}

export interface GetFAQsRequest {
  category?: string;
  isActive?: boolean;
  search?: string;
}

// Extend the main firebaseApi
export const faqsApi = firebaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFAQs: builder.query<FAQ[], GetFAQsRequest>({
      queryFn: async ({ category, isActive, search = "" }) => {
        try {
          console.log("[FAQs API] Fetching FAQs with filters:", {
            category,
            isActive,
            search,
          });

          const faqsRef = collection(db, "faqs");
          const constraints = [];

          // Add category filter
          if (category && category !== "all") {
            constraints.push(where("category", "==", category));
          }

          // Add active status filter
          if (isActive !== undefined) {
            constraints.push(where("isActive", "==", isActive));
          }

          // Add ordering
          constraints.push(orderBy("order", "asc"));
          constraints.push(orderBy("createdAt", "desc"));

          const q = query(faqsRef, ...constraints);
          const querySnapshot = await getDocs(q);

          let faqs = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...convertFirestoreData(doc.data()),
          })) as FAQ[];

          // Apply search filter (client-side)
          if (search) {
            faqs = faqs.filter(
              (faq) =>
                faq.question.toLowerCase().includes(search.toLowerCase()) ||
                faq.answer.toLowerCase().includes(search.toLowerCase())
            );
          }

          console.log("[FAQs API] Retrieved FAQs:", faqs.length);
          return { data: faqs };
        } catch (error: any) {
          console.error("[FAQs API] Error fetching FAQs:", error);
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      providesTags: ["FAQs"],
    }),

    createFAQ: builder.mutation<FAQ, CreateFAQRequest>({
      queryFn: async (faqData) => {
        try {
          console.log("[FAQs API] Creating FAQ:", faqData);

          const faqsRef = collection(db, "faqs");
          const newFAQ = withTimestamp({
            ...faqData,
            order: faqData.order || 0,
          });

          const docRef = await addDoc(faqsRef, newFAQ);

          const result = {
            id: docRef.id,
            ...faqData,
            order: faqData.order || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          console.log("[FAQs API] FAQ created:", result);
          return { data: result };
        } catch (error: any) {
          console.error("[FAQs API] Error creating FAQ:", error);
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: ["FAQs"],
    }),

    updateFAQ: builder.mutation<FAQ, UpdateFAQRequest>({
      queryFn: async ({ id, ...updates }) => {
        try {
          console.log("[FAQs API] Updating FAQ:", id, updates);

          const faqRef = doc(db, "faqs", id);
          const updatedData = withTimestamp(updates, true);

          await updateDoc(faqRef, updatedData);

          const result = {
            id,
            ...updates,
            updatedAt: new Date().toISOString(),
          };

          console.log("[FAQs API] FAQ updated:", result);
          return { data: result as FAQ };
        } catch (error: any) {
          console.error("[FAQs API] Error updating FAQ:", error);
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: ["FAQs"],
    }),

    deleteFAQ: builder.mutation<void, string>({
      queryFn: async (id) => {
        try {
          console.log("[FAQs API] Deleting FAQ:", id);

          const faqRef = doc(db, "faqs", id);
          await deleteDoc(faqRef);

          console.log("[FAQs API] FAQ deleted:", id);
          return { data: undefined };
        } catch (error: any) {
          console.error("[FAQs API] Error deleting FAQ:", error);
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: ["FAQs"],
    }),
  }),
});

export const {
  useGetFAQsQuery,
  useCreateFAQMutation,
  useUpdateFAQMutation,
  useDeleteFAQMutation,
} = faqsApi;
