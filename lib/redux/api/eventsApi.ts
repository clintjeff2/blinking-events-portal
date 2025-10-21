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
import {
  firebaseApi,
  convertFirestoreData,
  withTimestamp,
} from "./firebaseApi";

export interface EventTestimonial {
  clientId: string;
  text: string;
  rating: number;
  createdAt: string;
}

export interface Event {
  id: string;
  name: string;
  date: string; // ISO string or Firestore Timestamp
  venue: string;
  category: string;
  servicesUsed: string[]; // Array of serviceIds
  staffInvolved: string[]; // Array of staffProfileIds
  description: string;
  testimonials: EventTestimonial[];
  isPublished: boolean;
  createdAt: string;
}

export const eventsApi = firebaseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all events
    getEvents: builder.query<
      Event[],
      { category?: string; isPublished?: boolean }
    >({
      async queryFn({ category, isPublished }) {
        try {
          console.log("[Events API] ========== FETCHING EVENTS ==========");
          console.log("[Events API] Query params:", { category, isPublished });

          const eventsRef = collection(db, "events");
          let q = query(eventsRef, orderBy("date", "desc"));

          if (category) {
            console.log("[Events API] Filtering by category:", category);
            q = query(
              eventsRef,
              where("category", "==", category),
              orderBy("date", "desc")
            );
          }
          if (isPublished !== undefined) {
            console.log("[Events API] Filtering by isPublished:", isPublished);
            q = query(
              eventsRef,
              where("isPublished", "==", isPublished),
              orderBy("date", "desc")
            );
          }

          console.log("[Events API] Executing query...");
          const snapshot = await getDocs(q);
          console.log("[Events API] Snapshot size:", snapshot.size);

          const events = snapshot.docs.map((doc) => {
            const data = doc.data();
            console.log("[Events API] Raw doc data:", doc.id, data);
            const converted = convertFirestoreData(data);
            console.log("[Events API] Converted doc data:", doc.id, converted);
            return {
              id: doc.id,
              ...converted,
            };
          }) as Event[];

          console.log("[Events API] Total events retrieved:", events.length);
          console.log("[Events API] ========== FETCH COMPLETE ==========");

          return { data: events };
        } catch (error: any) {
          console.error("[Events API] ❌ ERROR:", error);
          console.error("[Events API] Error message:", error.message);
          return { error: error.message };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Events" as const, id })),
              { type: "Events", id: "LIST" },
            ]
          : [{ type: "Events", id: "LIST" }],
    }),

    // Get event by ID
    getEventById: builder.query<Event, string>({
      async queryFn(eventId) {
        try {
          console.log("[Events API] Fetching event by ID:", eventId);
          const eventDoc = await getDoc(doc(db, "events", eventId));
          if (!eventDoc.exists()) {
            console.error("[Events API] Event not found:", eventId);
            return { error: "Event not found" };
          }
          const event = {
            id: eventDoc.id,
            ...convertFirestoreData(eventDoc.data()),
          } as Event;
          console.log("[Events API] Event retrieved:", event);
          return { data: event };
        } catch (error: any) {
          console.error("[Events API] Error fetching event:", error);
          return { error: error.message };
        }
      },
      providesTags: (result, error, id) => [{ type: "Events", id }],
    }),

    // Create event
    createEvent: builder.mutation<Event, Omit<Event, "id" | "createdAt">>({
      async queryFn(eventData) {
        try {
          console.log("[Events API] Creating event:", eventData);
          const eventsRef = collection(db, "events");
          const docRef = await addDoc(eventsRef, withTimestamp(eventData));
          const newDoc = await getDoc(docRef);
          const event = {
            id: newDoc.id,
            ...convertFirestoreData(newDoc.data()!),
          } as Event;
          console.log("[Events API] Event created:", event);
          return { data: event };
        } catch (error: any) {
          console.error("[Events API] Error creating event:", error);
          return { error: error.message };
        }
      },
      invalidatesTags: [{ type: "Events", id: "LIST" }],
    }),

    // Update event
    updateEvent: builder.mutation<Event, { id: string; data: Partial<Event> }>({
      async queryFn({ id, data }) {
        try {
          console.log("[Events API] Updating event:", id, data);
          const eventRef = doc(db, "events", id);
          await updateDoc(eventRef, withTimestamp(data, true));
          const updatedDoc = await getDoc(eventRef);
          if (!updatedDoc.exists()) {
            return { error: "Event not found after update" };
          }
          const event = {
            id: updatedDoc.id,
            ...convertFirestoreData(updatedDoc.data()),
          } as Event;
          console.log("[Events API] Event updated:", event);
          return { data: event };
        } catch (error: any) {
          console.error("[Events API] Error updating event:", error);
          return { error: error.message };
        }
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Events", id },
        { type: "Events", id: "LIST" },
      ],
    }),

    // Delete event (soft delete)
    deleteEvent: builder.mutation<void, string>({
      async queryFn(eventId) {
        try {
          console.log("[Events API] Deleting event:", eventId);
          await deleteDoc(doc(db, "events", eventId));
          console.log("[Events API] Event deleted:", eventId);
          return { data: undefined };
        } catch (error: any) {
          console.error("[Events API] Error deleting event:", error);
          return { error: error.message };
        }
      },
      invalidatesTags: (result, error, id) => [
        { type: "Events", id },
        { type: "Events", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetEventsQuery,
  useGetEventByIdQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
} = eventsApi;
