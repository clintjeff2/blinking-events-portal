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
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  firebaseApi,
  convertFirestoreData,
  withTimestamp,
} from "./firebaseApi";

export interface Testimonial {
  id: string;
  clientId: string;
  clientName?: string;
  eventId?: string;
  eventName?: string;
  text: string;
  rating: number;
  isPublished: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface CreateTestimonialRequest {
  clientId: string;
  eventId?: string;
  text: string;
  rating: number;
  isPublished: boolean;
}

export interface UpdateTestimonialRequest {
  id: string;
  clientId?: string;
  eventId?: string;
  text?: string;
  rating?: number;
  isPublished?: boolean;
}

export interface GetTestimonialsRequest {
  isPublished?: boolean;
  search?: string;
}

export interface ClientOption {
  id: string;
  fullName: string;
}

export interface EventOption {
  id: string;
  name: string;
}

// Extend the main firebaseApi
export const testimonialsApi = firebaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTestimonials: builder.query<Testimonial[], GetTestimonialsRequest>({
      queryFn: async ({ isPublished, search = "" }) => {
        try {
          console.log(
            "[Testimonials API] Fetching testimonials with filters:",
            { isPublished, search }
          );

          const testimonialsRef = collection(db, "testimonials");
          const constraints = [];

          // Add published status filter
          if (isPublished !== undefined) {
            constraints.push(where("isPublished", "==", isPublished));
          }

          // Add ordering
          constraints.push(orderBy("createdAt", "desc"));

          const q = query(testimonialsRef, ...constraints);
          const querySnapshot = await getDocs(q);

          let testimonials = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...convertFirestoreData(doc.data()),
          })) as Testimonial[];

          // Fetch client and event names
          for (const testimonial of testimonials) {
            // Get client name
            try {
              const clientDoc = await getDoc(
                doc(db, "users", testimonial.clientId)
              );
              if (clientDoc.exists()) {
                const clientData = clientDoc.data();
                testimonial.clientName =
                  clientData.fullName ||
                  clientData.firstName + " " + clientData.lastName;
              }
            } catch (error) {
              console.warn(
                "[Testimonials API] Error fetching client name:",
                error
              );
              testimonial.clientName = "Unknown Client";
            }

            // Get event name if eventId exists
            if (testimonial.eventId) {
              try {
                const eventDoc = await getDoc(
                  doc(db, "events", testimonial.eventId)
                );
                if (eventDoc.exists()) {
                  const eventData = eventDoc.data();
                  testimonial.eventName = eventData.name;
                }
              } catch (error) {
                console.warn(
                  "[Testimonials API] Error fetching event name:",
                  error
                );
                testimonial.eventName = "Unknown Event";
              }
            }
          }

          // Apply search filter (client-side)
          if (search) {
            testimonials = testimonials.filter(
              (testimonial) =>
                testimonial.text.toLowerCase().includes(search.toLowerCase()) ||
                testimonial.clientName
                  ?.toLowerCase()
                  .includes(search.toLowerCase()) ||
                testimonial.eventName
                  ?.toLowerCase()
                  .includes(search.toLowerCase())
            );
          }

          console.log(
            "[Testimonials API] Retrieved testimonials:",
            testimonials.length
          );
          return { data: testimonials };
        } catch (error: any) {
          console.error(
            "[Testimonials API] Error fetching testimonials:",
            error
          );
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      providesTags: ["Testimonials"],
    }),

    getClients: builder.query<ClientOption[], void>({
      queryFn: async () => {
        try {
          console.log("[Testimonials API] Fetching clients for dropdown");

          const usersRef = collection(db, "users");
          const q = query(usersRef, orderBy("fullName", "asc"));
          const querySnapshot = await getDocs(q);

          const clients = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              fullName: data.fullName || data.firstName + " " + data.lastName,
            };
          });

          console.log("[Testimonials API] Retrieved clients:", clients.length);
          return { data: clients };
        } catch (error: any) {
          console.error("[Testimonials API] Error fetching clients:", error);
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      providesTags: ["Users"],
    }),

    getEvents: builder.query<EventOption[], void>({
      queryFn: async () => {
        try {
          console.log("[Testimonials API] Fetching events for dropdown");

          const eventsRef = collection(db, "events");
          const q = query(eventsRef, orderBy("name", "asc"));
          const querySnapshot = await getDocs(q);

          const events = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name,
            };
          });

          console.log("[Testimonials API] Retrieved events:", events.length);
          return { data: events };
        } catch (error: any) {
          console.error("[Testimonials API] Error fetching events:", error);
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      providesTags: ["Events"],
    }),

    createTestimonial: builder.mutation<Testimonial, CreateTestimonialRequest>({
      queryFn: async (testimonialData) => {
        try {
          console.log(
            "[Testimonials API] Creating testimonial:",
            testimonialData
          );

          const testimonialsRef = collection(db, "testimonials");
          const newTestimonial = withTimestamp(testimonialData);

          const docRef = await addDoc(testimonialsRef, newTestimonial);

          const result = {
            id: docRef.id,
            ...testimonialData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          console.log("[Testimonials API] Testimonial created:", result);
          return { data: result };
        } catch (error: any) {
          console.error(
            "[Testimonials API] Error creating testimonial:",
            error
          );
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: ["Testimonials"],
    }),

    updateTestimonial: builder.mutation<Testimonial, UpdateTestimonialRequest>({
      queryFn: async ({ id, ...updates }) => {
        try {
          console.log("[Testimonials API] Updating testimonial:", id, updates);

          const testimonialRef = doc(db, "testimonials", id);
          const updatedData = withTimestamp(updates, true);

          await updateDoc(testimonialRef, updatedData);

          const result = {
            id,
            ...updates,
            updatedAt: new Date().toISOString(),
          };

          console.log("[Testimonials API] Testimonial updated:", result);
          return { data: result as Testimonial };
        } catch (error: any) {
          console.error(
            "[Testimonials API] Error updating testimonial:",
            error
          );
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: ["Testimonials"],
    }),

    deleteTestimonial: builder.mutation<void, string>({
      queryFn: async (id) => {
        try {
          console.log("[Testimonials API] Deleting testimonial:", id);

          const testimonialRef = doc(db, "testimonials", id);
          await deleteDoc(testimonialRef);

          console.log("[Testimonials API] Testimonial deleted:", id);
          return { data: undefined };
        } catch (error: any) {
          console.error(
            "[Testimonials API] Error deleting testimonial:",
            error
          );
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: ["Testimonials"],
    }),
  }),
});

export const {
  useGetTestimonialsQuery,
  useGetClientsQuery,
  useGetEventsQuery,
  useCreateTestimonialMutation,
  useUpdateTestimonialMutation,
  useDeleteTestimonialMutation,
} = testimonialsApi;
