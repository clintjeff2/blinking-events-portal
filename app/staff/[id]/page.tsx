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
import { format } from "date-fns";
import {
  useGetStaffByIdQuery,
  useDeleteStaffMutation,
  useHardDeleteStaffMutation,
} from "@/lib/redux/api/staffApi";
import { deleteFile } from "@/lib/cloudinary/upload";

export default function StaffDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Fetch staff data
  const {
    data: staff,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetStaffByIdQuery(params.id);

  // Delete mutations
  const [deleteStaff, { isLoading: isDeleting }] = useDeleteStaffMutation();
  const [hardDeleteStaff, { isLoading: isHardDeleting }] =
    useHardDeleteStaffMutation();

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

  // Handle edit
  const handleUpdate = async (updatedData: any) => {
    try {
      // The EditStaffModal will handle the actual update API call
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
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading staff details...</span>
      </div>
    );
  }

  // If error
  if (isError || !staff) {
    return (
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
    );
  }

  return (
    <SidebarProvider>
      <div className="h-screen overflow-hidden w-full">
        <div className="grid sm:grid-cols-5 h-full w-full">
          {/* Sidebar */}
          <div className="hidden sm:block">
            <AppSidebar />
          </div>

          {/* Mobile Sidebar Trigger */}
          <div className="sm:hidden fixed bottom-6 right-6 z-40">
            <SidebarTrigger>
              <Button size="icon" className="rounded-full shadow-lg">
                <Briefcase className="h-5 w-5" />
              </Button>
            </SidebarTrigger>
          </div>

          {/* Main content */}
          <div className="sm:col-span-4 h-full overflow-y-auto w-full">
            <div className="p-4 md:p-6 max-w-full">
              {/* Top Navigation */}
              <div className="flex items-center justify-between mb-6">
                <Button
                  variant="outline"
                  onClick={() => router.push("/staff")}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Staff
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditModalOpen(true)}
                    disabled={isDeleting || isHardDeleting}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={isDeleting || isHardDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>

              {/* Staff Profile Header */}
              <Card className="mb-6 w-full">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <Avatar className="h-32 w-32 border">
                      <AvatarImage
                        src={staff.photoUrl || "/placeholder-user.jpg"}
                        alt={staff.fullName}
                      />
                      <AvatarFallback>
                        {staff.fullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <h1 className="text-3xl font-bold mb-2">
                        {staff.fullName}
                      </h1>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {staff.categories.map((category, i) => (
                          <Badge key={i} variant="outline">
                            {category}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-500" />
                          <span>
                            {staff.rating.toFixed(1)} ({staff.reviews.length}{" "}
                            reviews)
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Joined{" "}
                            {staff.createdAt instanceof Date
                              ? format(staff.createdAt, "MMM yyyy")
                              : "Recently"}
                          </span>
                        </div>
                        {staff.isActive ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-300"
                          >
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-300"
                          >
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs */}
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                  <TabsTrigger value="availability">Availability</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>

                {/* About Tab */}
                <TabsContent value="about" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Bio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{staff.bio}</p>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Skills */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Briefcase className="h-5 w-5" />
                          Skills
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {staff.skills.map((skill, i) => (
                            <Badge key={i} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Qualifications */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Award className="h-5 w-5" />
                          Qualifications
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc pl-5 space-y-1">
                          {staff.qualifications.map((qualification, i) => (
                            <li key={i}>{qualification}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Languages */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Languages</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {staff.languages.map((language, i) => (
                            <Badge key={i} variant="outline">
                              {language}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Contact */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          Contact Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div>
                          <span className="font-semibold block">Phone:</span>
                          <span>{staff.contact.phone}</span>
                        </div>
                        <div>
                          <span className="font-semibold block">Email:</span>
                          <span>{staff.contact.email}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Portfolio Tab */}
                <TabsContent value="portfolio">
                  <Card>
                    <CardHeader>
                      <CardTitle>Portfolio</CardTitle>
                      <CardDescription>
                        Past events and projects
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {staff.portfolio && staff.portfolio.length > 0 ? (
                        <div className="grid grid-cols-1 gap-8">
                          {staff.portfolio.map((item, index) => (
                            <Card key={index} className="overflow-hidden">
                              <CardHeader>
                                {item.eventName && (
                                  <CardDescription>
                                    {item.eventName}
                                  </CardDescription>
                                )}
                                <CardTitle className="text-lg">
                                  {item.description}
                                </CardTitle>
                              </CardHeader>

                              <CardContent className="p-4">
                                {item.media && item.media.length > 0 ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {item.media.map((mediaUrl, mediaIndex) => (
                                      <div
                                        key={mediaIndex}
                                        className="aspect-video w-full overflow-hidden border rounded-md"
                                      >
                                        <img
                                          src={mediaUrl}
                                          alt={`${item.description} - media ${
                                            mediaIndex + 1
                                          }`}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.currentTarget.src =
                                              "/placeholder.jpg";
                                          }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-muted-foreground italic">
                                    No media available
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          No portfolio items available
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Availability Tab */}
                <TabsContent value="availability">
                  <Card>
                    <CardHeader>
                      <CardTitle>Availability</CardTitle>
                      <CardDescription>
                        Upcoming schedule and availability
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
                                className="flex items-center p-3 border rounded-lg"
                              >
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {format(from, "MMMM d, yyyy")} -{" "}
                                    {format(to, "MMMM d, yyyy")}
                                  </p>
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

                {/* Reviews Tab */}
                <TabsContent value="reviews">
                  <Card>
                    <CardHeader>
                      <CardTitle>Reviews</CardTitle>
                      <CardDescription>
                        Client feedback and ratings
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {staff.reviews && staff.reviews.length > 0 ? (
                        <div className="space-y-4">
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
                                className="p-4 border rounded-lg"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="font-medium">
                                      User #{review.userId}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {format(date, "MMMM d, yyyy")}
                                    </p>
                                  </div>
                                  <div className="flex items-center">
                                    <Star className="h-4 w-4 text-amber-500 mr-1" />
                                    <span>{review.rating}</span>
                                  </div>
                                </div>
                                <p>{review.comment}</p>
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
              </Tabs>
            </div>
          </div>
        </div>
      </div>

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

      {/* Mobile Sidebar Content */}
      <SidebarInset className="py-6">
        <AppSidebar />
      </SidebarInset>
    </SidebarProvider>
  );
}
