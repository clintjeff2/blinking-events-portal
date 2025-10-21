"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Edit,
  Trash2,
  Star,
  Calendar,
  Briefcase,
  Award,
  MessageSquare,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { EditStaffModal } from "@/components/edit-staff-modal";
import { MediaPreview } from "@/components/media-preview";
import { format } from "date-fns";
import {
  useGetStaffByIdQuery,
  useDeleteStaffMutation,
  useUpdateStaffMutation,
} from "@/lib/redux/api/staffApi";
import { deleteFile } from "@/lib/cloudinary/upload";
import { getMediaType } from "@/lib/utils/media";

export default function StaffDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Fetch staff data from Firebase
  const {
    data: staff,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetStaffByIdQuery(params.id);

  // Delete and update mutations
  const [deleteStaff, { isLoading: isDeleting }] = useDeleteStaffMutation();
  const [updateStaff, { isLoading: isUpdating }] = useUpdateStaffMutation();

  // Handle delete
  const handleDelete = async () => {
    try {
      // Start with soft delete
      await deleteStaff(params.id).unwrap();

      // Cleanup Cloudinary resources
      if (staff) {
        // Delete profile photo if exists
        if (staff.photoUrl) {
          try {
            await deleteFile(extractPublicIdFromUrl(staff.photoUrl));
          } catch (error) {
            console.error("Failed to delete profile photo:", error);
          }
        }

        // Delete portfolio media
        if (staff.portfolio && staff.portfolio.length > 0) {
          for (const item of staff.portfolio) {
            if (item.media && item.media.length > 0) {
              for (const mediaUrl of item.media) {
                try {
                  await deleteFile(extractPublicIdFromUrl(mediaUrl));
                } catch (error) {
                  console.error("Failed to delete portfolio media:", error);
                }
              }
            }
          }
        }
      }

      toast.success("Staff member deleted successfully");
      router.push("/staff");
    } catch (error: any) {
      toast.error(`Failed to delete staff: ${error.message}`);
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  // Helper function to extract public ID from Cloudinary URL
  const extractPublicIdFromUrl = (url: string): string => {
    // Example: https://res.cloudinary.com/dbdhj1c4m/image/upload/v1666123456/blinking-events/staff/abc123.jpg
    const regex = /\/upload\/(?:v\d+\/)?(.+)$/;
    const match = url.match(regex);
    if (match && match[1]) {
      // Remove file extension
      return match[1].replace(/\.\w+$/, "");
    }
    return url;
  };

  // Handle edit/update
  const handleUpdate = async (updatedData: any) => {
    try {
      await updateStaff({
        id: params.id,
        data: updatedData,
      }).unwrap();

      toast.success("Staff profile updated successfully");
      await refetch(); // Refresh data after update
      setEditModalOpen(false);
    } catch (error: any) {
      toast.error(`Failed to update: ${error.message}`);
    }
  };

  // If loading
  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading staff details...</span>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // If error
  if (isError || !staff) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="p-6 max-w-4xl mx-auto">
            <Button
              variant="outline"
              onClick={() => router.push("/staff")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Staff
            </Button>

            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error
                  ? `Error: ${JSON.stringify(error)}`
                  : "Staff member not found"}
              </AlertDescription>
            </Alert>

            <Button onClick={() => refetch()}>Retry</Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Calculate stats
  const eventsCompleted = staff.portfolio?.length || 0;
  const reviewCount = staff.reviews?.length || 0;
  const avgRating = staff.rating || 0;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/staff")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <h2 className="text-lg font-semibold">Staff Profile</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditModalOpen(true)}
                disabled={isDeleting || isUpdating}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isDeleting || isUpdating}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-start">
                <Avatar className="h-32 w-32">
                  <AvatarImage
                    src={staff.photoUrl || "/placeholder.svg"}
                    alt={staff.fullName}
                  />
                  <AvatarFallback className="text-2xl">
                    {staff.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl font-bold">{staff.fullName}</h1>
                      <Badge variant={staff.isActive ? "default" : "secondary"}>
                        {staff.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Star className="h-5 w-5 fill-accent text-accent" />
                      <span className="text-lg font-medium">
                        {avgRating.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground">
                        ({reviewCount} reviews)
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {staff.categories.map((category) => (
                      <Badge key={category} variant="outline">
                        {category}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {staff.bio}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Events Completed
                </CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{eventsCompleted}</div>
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
                  {avgRating.toFixed(1)}/5.0
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Reviews
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reviewCount}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="details" className="space-y-6">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="availability">Availability</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Skills & Expertise</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {staff.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Languages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {staff.languages.map((language) => (
                        <Badge key={language} variant="secondary">
                          {language}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Qualifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {staff.qualifications.map((qual, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Award className="mt-0.5 h-4 w-4 text-accent" />
                          <span className="text-sm">{qual}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">
                        {staff.contact.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">
                        {staff.contact.email}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="portfolio" className="space-y-6">
              {staff.portfolio && staff.portfolio.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {staff.portfolio.map((item, index) => (
                    <Card key={index}>
                      <CardHeader>
                        {item.eventName && (
                          <CardDescription>{item.eventName}</CardDescription>
                        )}
                        <CardTitle className="text-lg">
                          {item.description}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-2">
                          {item.media && item.media.length > 0 ? (
                            item.media.map((mediaUrl, mediaIndex) => {
                              const mediaType = getMediaType(mediaUrl);
                              return (
                                <div
                                  key={mediaIndex}
                                  className={`w-full rounded-lg overflow-hidden ${
                                    mediaType === "video" ? "h-64" : "h-48"
                                  }`}
                                >
                                  <MediaPreview
                                    src={mediaUrl || "/placeholder.svg"}
                                    alt={`${item.description} - Media ${
                                      mediaIndex + 1
                                    }`}
                                    className="h-full"
                                    showControls={true}
                                    muted={false}
                                    loop={false}
                                  />
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-sm text-muted-foreground italic">
                              No media available
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      No portfolio items available
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Client Reviews</CardTitle>
                  <CardDescription>Feedback from past clients</CardDescription>
                </CardHeader>
                <CardContent>
                  {staff.reviews && staff.reviews.length > 0 ? (
                    <div className="space-y-6">
                      {staff.reviews.map((review, index) => {
                        const date =
                          review.createdAt instanceof Date
                            ? review.createdAt
                            : new Date(
                                (review.createdAt as any).seconds * 1000
                              );

                        return (
                          <div
                            key={index}
                            className="border-b border-border pb-6 last:border-0 last:pb-0"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">
                                  User #{review.userId}
                                </p>
                                <div className="mt-1 flex items-center gap-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < review.rating
                                          ? "fill-accent text-accent"
                                          : "text-muted"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {format(date, "MMMM d, yyyy")}
                              </span>
                            </div>
                            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                              {review.comment}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No reviews yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="availability" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Availability Calendar</CardTitle>
                  <CardDescription>
                    Upcoming bookings and available dates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {staff.availability && staff.availability.length > 0 ? (
                    <div className="space-y-4">
                      {staff.availability.map((slot, index) => {
                        const from =
                          slot.from instanceof Date
                            ? slot.from
                            : new Date((slot.from as any).seconds * 1000);

                        const to =
                          slot.to instanceof Date
                            ? slot.to
                            : new Date((slot.to as any).seconds * 1000);

                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded-lg border border-border p-4"
                          >
                            <div className="flex items-center gap-3">
                              <Calendar className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">
                                  {format(from, "MMMM d, yyyy")} -{" "}
                                  {format(to, "MMMM d, yyyy")}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No availability information
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will delete the staff profile and all associated data
              including portfolio media. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-destructive text-destructive-foreground"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Modal */}
      {staff && (
        <EditStaffModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onSubmit={handleUpdate}
          staff={staff}
        />
      )}
    </SidebarProvider>
  );
}
