"use client";

import React, { useState } from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AddTestimonialModal } from "@/components/add-testimonial-modal";
import { EditTestimonialModal } from "@/components/edit-testimonial-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Search, Trash2, Edit } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import {
  useGetTestimonialsQuery,
  useDeleteTestimonialMutation,
  Testimonial,
} from "@/lib/redux/api/testimonialsApi";

export default function TestimonialsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] =
    useState<Testimonial | null>(null);
  const [deletingTestimonial, setDeletingTestimonial] =
    useState<Testimonial | null>(null);

  const {
    data: testimonials = [],
    isLoading,
    error,
    refetch,
  } = useGetTestimonialsQuery({
    search: searchTerm,
    isPublished:
      selectedFilter === "published"
        ? true
        : selectedFilter === "draft"
        ? false
        : undefined,
  });

  const [deleteTestimonial, { isLoading: isDeleting }] =
    useDeleteTestimonialMutation();

  const handleDelete = async () => {
    if (!deletingTestimonial) return;

    try {
      console.log(
        "[Testimonials Page] Deleting testimonial:",
        deletingTestimonial.id
      );
      await deleteTestimonial(deletingTestimonial.id).unwrap();

      toast({
        title: "Success",
        description: "Testimonial deleted successfully",
      });

      setDeletingTestimonial(null);
    } catch (error: any) {
      console.error("[Testimonials Page] Error deleting testimonial:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete testimonial",
        variant: "destructive",
      });
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-accent text-accent"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown date";

    let date: Date;
    if (timestamp.seconds) {
      // Firestore timestamp
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (error) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
            </div>
          </header>
          <div className="flex-1 space-y-6 p-8 pt-6">
            <PageHeader
              title="Client Testimonials"
              description="Manage client reviews and feedback"
            />
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-destructive">
                  Error loading testimonials:{" "}
                  {(error as any)?.message || "Unknown error"}
                </p>
                <Button onClick={() => refetch()} className="mt-4">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
        </header>
        <div className="flex-1 space-y-6 p-8 pt-6">
          <PageHeader
            title="Client Testimonials"
            description="Manage client reviews and feedback"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search testimonials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <Button onClick={() => setIsAddModalOpen(true)}>
              Add New Testimonial
            </Button>
          </div>

          <div className="grid gap-6">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : testimonials.length > 0 ? (
              testimonials.map((testimonial) => (
                <Card key={testimonial.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src="/placeholder-user.jpg" />
                          <AvatarFallback>
                            {testimonial.clientName
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("") || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">
                            {testimonial.clientName || "Unknown Client"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {testimonial.eventName || "No event specified"}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            {renderStars(testimonial.rating)}
                            <span className="text-sm text-muted-foreground">
                              {formatDate(testimonial.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            testimonial.isPublished ? "default" : "secondary"
                          }
                        >
                          {testimonial.isPublished ? "Published" : "Draft"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingTestimonial(testimonial)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeletingTestimonial(testimonial)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {testimonial.text}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">
                    {searchTerm || selectedFilter !== "all"
                      ? "No testimonials found matching your criteria."
                      : "No testimonials yet. Add your first testimonial to get started."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Add Testimonial Modal */}
          <AddTestimonialModal
            open={isAddModalOpen}
            onOpenChange={setIsAddModalOpen}
            onSubmit={() => {
              console.log(
                "[Testimonials Page] Testimonial added, refetching data"
              );
            }}
          />

          {/* Edit Testimonial Modal */}
          <EditTestimonialModal
            open={!!editingTestimonial}
            onOpenChange={(open) => !open && setEditingTestimonial(null)}
            testimonial={editingTestimonial}
            onSubmit={() => {
              console.log(
                "[Testimonials Page] Testimonial edited, refetching data"
              );
            }}
          />

          {/* Delete Confirmation Dialog */}
          <AlertDialog
            open={!!deletingTestimonial}
            onOpenChange={(open) => !open && setDeletingTestimonial(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Testimonial</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this testimonial from{" "}
                  <strong>{deletingTestimonial?.clientName}</strong>? This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
