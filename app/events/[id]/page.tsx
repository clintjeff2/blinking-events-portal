"use client";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  MapPin,
  Users,
  Star,
  Edit,
  Trash2,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useGetEventByIdQuery,
  useDeleteEventMutation,
} from "@/lib/redux/api/eventsApi";
import { useGetServicesQuery } from "@/lib/redux/api/servicesApi";
import { EditEventModal } from "@/components/edit-event-modal";
import { format } from "date-fns";

export default function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch event data
  const {
    data: event,
    isLoading,
    error,
    refetch,
  } = useGetEventByIdQuery(params.id);
  const [deleteEvent] = useDeleteEventMutation();
  const { data: allServices = [] } = useGetServicesQuery({});
  const handleDelete = async () => {
    try {
      await deleteEvent(params.id).unwrap();
      toast({
        title: "Event deleted",
        description: "The event has been deleted successfully",
      });
      router.push("/events");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  const handleEditSuccess = () => {
    refetch();
    toast({
      title: "Success",
      description: "Event updated successfully",
    });
  };

  // Calculate average rating from testimonials
  const getAverageRating = () => {
    if (!event?.testimonials || event.testimonials.length === 0) return 0;
    const sum = event.testimonials.reduce((acc, t) => acc + (t.rating || 0), 0);
    return sum / event.testimonials.length;
  };

  // Get service name by ID
  const getServiceName = (serviceId: string) => {
    const service = allServices.find((s) => s.id === serviceId);
    return service?.name || serviceId;
  };

  // Loading state
  if (isLoading || !event) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Skeleton className="h-6 w-40" />
          </header>
          <div className="flex flex-1 flex-col gap-6 p-6">
            <Skeleton className="h-10 w-full" />
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Error state
  if (error) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-1 items-center justify-center p-6">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">
                  Failed to load event details
                </p>
                <Button onClick={() => router.push("/events")}>
                  Back to Events
                </Button>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const avgRating = getAverageRating();
  const eventDate = event.date ? new Date(event.date) : null;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/events")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold">Event Details</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditModal(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{event.name}</h1>
                <Badge variant={event.isPublished ? "default" : "secondary"}>
                  {event.isPublished ? "Published" : "Draft"}
                </Badge>
              </div>
              <p className="mt-2">
                <Badge variant="outline">{event.category}</Badge>
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Event Date
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {eventDate ? format(eventDate, "MMM d, yyyy") : "No date"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Rating
                </CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {avgRating > 0 ? `${avgRating.toFixed(1)}/5.0` : "No ratings"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From {event.testimonials.length} testimonial(s)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Staff Involved
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {event.staffInvolved.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Team members
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Services Used
                </CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {event.servicesUsed.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Services provided
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="staff">Staff</TabsTrigger>
              <TabsTrigger value="testimonials">
                Testimonials ({event.testimonials.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Event Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {event.description}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Venue</span>
                      <span className="font-medium">{event.venue}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Category</span>
                      <Badge variant="outline">{event.category}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium">
                        {eventDate ? format(eventDate, "PPP") : "No date"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge
                        variant={event.isPublished ? "default" : "secondary"}
                      >
                        {event.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="services" className="space-y-6">
              {event.servicesUsed && event.servicesUsed.length > 0 ? (
                <div className="grid gap-4">
                  {event.servicesUsed.map((serviceId, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {getServiceName(serviceId)}
                        </CardTitle>
                        <CardDescription>
                          Service ID: {serviceId}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/services/${serviceId}`}>
                            View Service Details
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No services used</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="staff" className="space-y-6">
              {event.staffInvolved && event.staffInvolved.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Staff Members</CardTitle>
                    <CardDescription>
                      Team members involved in this event
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {event.staffInvolved.map((staffId, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                Staff Member {index + 1}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                ID: {staffId}
                              </p>
                            </div>
                          </div>
                          <Link href={`/staff/${staffId}`}>
                            <Button variant="outline" size="sm">
                              View Profile
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No staff assigned</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="testimonials" className="space-y-6">
              {event.testimonials && event.testimonials.length > 0 ? (
                <div className="grid gap-4">
                  {event.testimonials.map((testimonial, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              Client Testimonial
                            </CardTitle>
                            <CardDescription>
                              Client ID: {testimonial.clientId}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < testimonial.rating
                                    ? "fill-accent text-accent"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground leading-relaxed">
                          "{testimonial.text}"
                        </p>
                        <p className="text-xs text-muted-foreground mt-4">
                          {testimonial.createdAt
                            ? format(new Date(testimonial.createdAt), "PPP")
                            : "Date not available"}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No testimonials yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Testimonials from clients will appear here
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>

      <EditEventModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSubmit={handleEditSuccess}
        event={event}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{event.name}"? This action cannot
              be undone. This will also remove all associated testimonials.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
