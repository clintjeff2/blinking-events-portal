import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { firebaseApi, convertFirestoreData } from "./firebaseApi";

// Dashboard Statistics Interface
export interface DashboardStats {
  totalEvents: number;
  activeServices: number;
  totalStaff: number;
  totalTestimonials: number;
  publishedFaqs: number;
  totalMedia: number;
  activeOffers: number;
  activeBanners: number;
  eventsThisMonth: number;
  eventsThisYear: number;
  recentEvents: Event[];
  topServices: ServiceStats[];
  recentTestimonials: RecentTestimonial[];
  recentMedia: RecentMedia[];
  monthlyTrend: MonthlyTrend[];
}

export interface Event {
  id: string;
  name: string;
  date: string;
  venue: string;
  category: string;
  isPublished: boolean;
  createdAt: string;
  servicesUsed?: string[];
}

export interface ServiceStats {
  id: string;
  name: string;
  category: string;
  eventCount: number;
  isActive: boolean;
  featured: boolean;
}

export interface RecentTestimonial {
  id: string;
  clientName: string;
  text: string;
  rating: number;
  createdAt: string;
  isPublished: boolean;
}

export interface RecentMedia {
  id: string;
  title: string;
  category: string;
  url: string[];
  thumbnailUrl: string;
  isFeatured: boolean;
  uploadedAt: string;
}

export interface MonthlyTrend {
  month: string;
  events: number;
  testimonials: number;
  media: number;
}

export interface QuickActions {
  pendingTasks: number;
  draftEvents: number;
  unpublishedMedia: number;
  pendingTestimonials: number;
}

// Extend the Firebase API
export const dashboardApi = firebaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStats, void>({
      queryFn: async () => {
        try {
          console.log("[Dashboard API] Fetching dashboard statistics...");

          // Get current date for filtering
          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth();
          const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
          const firstDayOfYear = new Date(currentYear, 0, 1);

          // Parallel data fetching for better performance
          const [
            eventsSnapshot,
            servicesSnapshot,
            staffSnapshot,
            testimonialsSnapshot,
            faqsSnapshot,
            mediaSnapshot,
            offersSnapshot,
            bannersSnapshot,
          ] = await Promise.all([
            getDocs(collection(db, "events")),
            getDocs(collection(db, "services")),
            getDocs(collection(db, "staffProfiles")),
            getDocs(collection(db, "testimonials")),
            getDocs(collection(db, "faqs")),
            getDocs(collection(db, "media")),
            getDocs(collection(db, "marketing/offers/offers")),
            getDocs(collection(db, "marketing/banners/banners")),
          ]);

          // Process events
          const events: Event[] = [];
          let eventsThisMonth = 0;
          let eventsThisYear = 0;

          eventsSnapshot.forEach((doc) => {
            const data = convertFirestoreData(doc.data());
            const event = {
              id: doc.id,
              ...data,
            } as Event;

            events.push(event);

            // Count events for time periods
            const eventDate = new Date(event.date);
            if (eventDate >= firstDayOfMonth) eventsThisMonth++;
            if (eventDate >= firstDayOfYear) eventsThisYear++;
          });

          // Process services and calculate usage
          const services: ServiceStats[] = [];
          const serviceUsageMap = new Map<string, number>();

          // Count service usage from events
          events.forEach((event) => {
            if (event.servicesUsed && Array.isArray(event.servicesUsed)) {
              event.servicesUsed.forEach((serviceId: string) => {
                serviceUsageMap.set(
                  serviceId,
                  (serviceUsageMap.get(serviceId) || 0) + 1
                );
              });
            }
          });

          servicesSnapshot.forEach((doc) => {
            const data = convertFirestoreData(doc.data());
            services.push({
              id: doc.id,
              name: data.name,
              category: data.category,
              eventCount: serviceUsageMap.get(doc.id) || 0,
              isActive: data.isActive !== false,
              featured: data.featured === true,
            });
          });

          // Sort services by usage and get top 5
          const topServices = services
            .filter((s) => s.isActive)
            .sort((a, b) => b.eventCount - a.eventCount)
            .slice(0, 5);

          // Process testimonials
          const testimonials: RecentTestimonial[] = [];
          testimonialsSnapshot.forEach((doc) => {
            const data = convertFirestoreData(doc.data());
            testimonials.push({
              id: doc.id,
              clientName: data.clientName || "Anonymous",
              text: data.text,
              rating: data.rating,
              createdAt: data.createdAt,
              isPublished: data.isPublished !== false,
            });
          });

          // Process media
          const mediaItems: RecentMedia[] = [];
          mediaSnapshot.forEach((doc) => {
            const data = convertFirestoreData(doc.data());
            mediaItems.push({
              id: doc.id,
              title: data.title,
              category: data.category,
              url: data.url || [],
              thumbnailUrl: data.thumbnailUrl || "",
              isFeatured: data.isFeatured === true,
              uploadedAt: data.uploadedAt,
            });
          });

          // Count active items
          let activeServices = 0;
          servicesSnapshot.forEach((doc) => {
            const data = convertFirestoreData(doc.data());
            if (data.isActive !== false) activeServices++;
          });

          let totalStaff = 0;
          staffSnapshot.forEach((doc) => {
            const data = convertFirestoreData(doc.data());
            if (data.isActive !== false) totalStaff++;
          });

          let publishedFaqs = 0;
          faqsSnapshot.forEach((doc) => {
            const data = convertFirestoreData(doc.data());
            if (data.isActive !== false) publishedFaqs++;
          });

          let activeOffers = 0;
          offersSnapshot.forEach((doc) => {
            const data = convertFirestoreData(doc.data());
            if (data.isActive === true) activeOffers++;
          });

          let activeBanners = 0;
          bannersSnapshot.forEach((doc) => {
            const data = convertFirestoreData(doc.data());
            if (data.isActive === true) activeBanners++;
          });

          // Generate monthly trend (last 6 months)
          const monthlyTrend: MonthlyTrend[] = [];
          for (let i = 5; i >= 0; i--) {
            const date = new Date(currentYear, currentMonth - i, 1);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(
              date.getFullYear(),
              date.getMonth() + 1,
              0
            );

            const monthEvents = events.filter((event) => {
              const eventDate = new Date(event.date);
              return eventDate >= monthStart && eventDate <= monthEnd;
            }).length;

            const monthTestimonials = testimonials.filter((testimonial) => {
              const testimonialDate = new Date(testimonial.createdAt);
              return (
                testimonialDate >= monthStart && testimonialDate <= monthEnd
              );
            }).length;

            const monthMedia = mediaItems.filter((media) => {
              const mediaDate = new Date(media.uploadedAt);
              return mediaDate >= monthStart && mediaDate <= monthEnd;
            }).length;

            monthlyTrend.push({
              month: date.toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              }),
              events: monthEvents,
              testimonials: monthTestimonials,
              media: monthMedia,
            });
          }

          const dashboardStats: DashboardStats = {
            totalEvents: events.length,
            activeServices,
            totalStaff,
            totalTestimonials: testimonials.length,
            publishedFaqs,
            totalMedia: mediaItems.length,
            activeOffers,
            activeBanners,
            eventsThisMonth,
            eventsThisYear,
            recentEvents: events
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .slice(0, 5),
            topServices,
            recentTestimonials: testimonials
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .slice(0, 3),
            recentMedia: mediaItems
              .sort(
                (a, b) =>
                  new Date(b.uploadedAt).getTime() -
                  new Date(a.uploadedAt).getTime()
              )
              .slice(0, 4),
            monthlyTrend,
          };

          console.log("[Dashboard API] Dashboard stats fetched successfully");
          return { data: dashboardStats };
        } catch (error: any) {
          console.error(
            "[Dashboard API] Error fetching dashboard stats:",
            error
          );
          return {
            error: {
              status: "FETCH_ERROR",
              error: error.message || "Failed to fetch dashboard statistics",
            },
          };
        }
      },
      providesTags: ["Analytics"],
    }),

    getQuickActions: builder.query<QuickActions, void>({
      queryFn: async () => {
        try {
          console.log("[Dashboard API] Fetching quick actions data...");

          const [eventsSnapshot, mediaSnapshot, testimonialsSnapshot] =
            await Promise.all([
              getDocs(
                query(
                  collection(db, "events"),
                  where("isPublished", "==", false)
                )
              ),
              getDocs(
                query(collection(db, "media"), where("isActive", "==", false))
              ),
              getDocs(
                query(
                  collection(db, "testimonials"),
                  where("isPublished", "==", false)
                )
              ),
            ]);

          const quickActions: QuickActions = {
            pendingTasks: 0, // Will be calculated based on other metrics
            draftEvents: eventsSnapshot.size,
            unpublishedMedia: mediaSnapshot.size,
            pendingTestimonials: testimonialsSnapshot.size,
          };

          quickActions.pendingTasks =
            quickActions.draftEvents +
            quickActions.unpublishedMedia +
            quickActions.pendingTestimonials;

          console.log(
            "[Dashboard API] Quick actions data fetched successfully"
          );
          return { data: quickActions };
        } catch (error: any) {
          console.error("[Dashboard API] Error fetching quick actions:", error);
          return {
            error: {
              status: "FETCH_ERROR",
              error: error.message || "Failed to fetch quick actions",
            },
          };
        }
      },
      providesTags: ["Analytics"],
    }),
  }),
});

export const { useGetDashboardStatsQuery, useGetQuickActionsQuery } =
  dashboardApi;
