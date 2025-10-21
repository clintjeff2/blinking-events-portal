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

export interface ServicePackage {
  name: string;
  features: string[];
  price: number;
  description: string;
}

export interface Service {
  id: string;
  name: string;
  category: string; // 'wedding' | 'corporate' | 'cultural' | 'birthday' | 'other'
  description: string;
  priceRange: {
    min: number;
    max: number;
    currency: string; // Default: 'XAF'
  };
  packages: ServicePackage[];
  images: string[];
  isActive: boolean;
  featured: boolean;
  staffProfiles?: string[];
  createdAt: string;
  updatedAt?: string;
}

export const servicesApi = firebaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getServices: builder.query<
      Service[],
      { category?: string; featured?: boolean }
    >({
      async queryFn({ category, featured }) {
        try {
          console.log("[Services API] ========== FETCHING SERVICES ==========");
          console.log("[Services API] Query params:", { category, featured });

          const servicesRef = collection(db, "services");
          let q = query(
            servicesRef,
            where("isActive", "==", true),
            orderBy("name", "asc")
          );

          if (category) {
            console.log("[Services API] Filtering by category:", category);
            q = query(
              servicesRef,
              where("category", "==", category),
              where("isActive", "==", true)
            );
          }
          if (featured !== undefined) {
            console.log("[Services API] Filtering by featured:", featured);
            q = query(
              servicesRef,
              where("featured", "==", featured),
              where("isActive", "==", true)
            );
          }

          console.log("[Services API] Executing query...");
          const snapshot = await getDocs(q);
          console.log("[Services API] Snapshot size:", snapshot.size);
          console.log("[Services API] Snapshot empty:", snapshot.empty);

          const services = snapshot.docs.map((doc) => {
            const data = doc.data();
            console.log("[Services API] Raw doc data:", doc.id, data);
            const converted = convertFirestoreData(data);
            console.log(
              "[Services API] Converted doc data:",
              doc.id,
              converted
            );
            return {
              id: doc.id,
              ...converted,
            };
          }) as Service[];

          console.log(
            "[Services API] Total services retrieved:",
            services.length
          );
          console.log("[Services API] Services array:", services);
          console.log("[Services API] ========== FETCH COMPLETE ==========");

          return { data: services };
        } catch (error: any) {
          console.error("[Services API] ❌ ERROR:", error);
          console.error("[Services API] Error message:", error.message);
          console.error("[Services API] Error stack:", error.stack);
          return { error: error.message };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Services" as const, id })),
              { type: "Services", id: "LIST" },
            ]
          : [{ type: "Services", id: "LIST" }],
    }),

    getServiceById: builder.query<Service, string>({
      async queryFn(serviceId) {
        try {
          const serviceDoc = await getDoc(doc(db, "services", serviceId));
          if (!serviceDoc.exists()) {
            return { error: "Service not found" };
          }
          const service = {
            id: serviceDoc.id,
            ...convertFirestoreData(serviceDoc.data()),
          } as Service;
          return { data: service };
        } catch (error: any) {
          return { error: error.message };
        }
      },
      providesTags: (result, error, id) => [{ type: "Services", id }],
    }),

    createService: builder.mutation<
      Service,
      Omit<Service, "id" | "createdAt" | "updatedAt">
    >({
      async queryFn(serviceData) {
        try {
          const servicesRef = collection(db, "services");
          const docRef = await addDoc(servicesRef, withTimestamp(serviceData));
          const newDoc = await getDoc(docRef);
          const service = {
            id: newDoc.id,
            ...convertFirestoreData(newDoc.data()!),
          } as Service;
          return { data: service };
        } catch (error: any) {
          return { error: error.message };
        }
      },
      invalidatesTags: [{ type: "Services", id: "LIST" }],
    }),

    updateService: builder.mutation<
      Service,
      { id: string; data: Partial<Service> }
    >({
      async queryFn({ id, data }) {
        try {
          const serviceRef = doc(db, "services", id);
          await updateDoc(serviceRef, withTimestamp(data, true));
          const updatedDoc = await getDoc(serviceRef);
          if (!updatedDoc.exists()) {
            return { error: "Service not found after update" };
          }
          const service = {
            id: updatedDoc.id,
            ...convertFirestoreData(updatedDoc.data()),
          } as Service;
          return { data: service };
        } catch (error: any) {
          return { error: error.message };
        }
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Services", id },
        { type: "Services", id: "LIST" },
      ],
    }),

    deleteService: builder.mutation<void, string>({
      async queryFn(serviceId) {
        try {
          const serviceRef = doc(db, "services", serviceId);
          await updateDoc(serviceRef, {
            isActive: false,
            updatedAt: withTimestamp({}, true).updatedAt,
          });
          return { data: undefined };
        } catch (error: any) {
          return { error: error.message };
        }
      },
      invalidatesTags: (result, error, id) => [
        { type: "Services", id },
        { type: "Services", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetServicesQuery,
  useGetServiceByIdQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
} = servicesApi;
