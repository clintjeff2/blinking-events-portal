"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  ArrowLeft,
  Star,
  Calendar,
  Tag,
  FolderOpen,
  Link2,
  Edit,
  Trash2,
  Download,
} from "lucide-react";
import {
  useGetMediaByIdQuery,
  useDeleteMediaMutation,
  useToggleFeaturedMutation,
} from "@/lib/redux/api/mediaApi";
import { useToast } from "@/hooks/use-toast";
import { getMediaType, isVideoUrl, isImageUrl } from "@/lib/utils/media";
import { MediaPreview } from "@/components/media-preview";
import { EditMediaModal } from "@/components/edit-media-modal";

export default function MediaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const mediaId = params.id as string;

  const { data: media, isLoading, isError } = useGetMediaByIdQuery(mediaId);
  const [deleteMedia, { isLoading: isDeleting }] = useDeleteMediaMutation();
  const [toggleFeatured] = useToggleFeaturedMutation();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(
    null
  );

  const handleToggleFeatured = async () => {
    if (!media) return;
    try {
      await toggleFeatured({
        id: media.id,
        isFeatured: !media.isFeatured,
      }).unwrap();
      toast({
        description: media.isFeatured
          ? "Removed from featured"
          : "Added to featured",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to update featured status",
      });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMedia(mediaId).unwrap();
      toast({ description: "Media deleted successfully" });
      router.push("/media");
    } catch (error) {
      toast({ variant: "destructive", description: "Failed to delete media" });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const downloadMedia = (url: string, index: number) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `media-${mediaId}-${index + 1}`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Skeleton className="h-8 w-48" />
          </header>
          <div className="flex flex-1 flex-col gap-6 p-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (isError || !media) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h2 className="text-lg font-semibold">Media Not Found</h2>
          </header>
          <div className="flex flex-1 flex-col items-center justify-center p-6">
            <p className="text-muted-foreground">
              This media item could not be found.
            </p>
            <Button asChild className="mt-4">
              <Link href="/media">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Gallery
              </Link>
            </Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/media">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <h2 className="text-lg font-semibold">{media.title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditDialogOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant={media.isFeatured ? "default" : "outline"}
                size="sm"
                onClick={handleToggleFeatured}
              >
                <Star
                  className={`h-4 w-4 mr-2 ${
                    media.isFeatured ? "fill-current" : ""
                  }`}
                />
                {media.isFeatured ? "Featured" : "Feature"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Header Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-2xl font-bold">{media.title}</h1>
                      {media.isFeatured && (
                        <Badge variant="default" className="gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    {media.description && (
                      <p className="text-muted-foreground">
                        {media.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(media.uploadedAt)}
                    </div>
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" />
                      <Badge variant="outline" className="capitalize">
                        {media.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      {media.url.length} file{media.url.length > 1 ? "s" : ""}
                    </div>
                  </div>

                  {media.tags.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Tag className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div className="flex flex-wrap gap-2">
                        {media.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media Gallery - Masonry Grid */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              Media Files ({media.url.length})
            </h2>

            {/* Masonry Grid using columns */}
            <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
              {media.url.map((url, index) => {
                const mediaType = getMediaType(url);

                return (
                  <div
                    key={index}
                    className="break-inside-avoid relative group rounded-lg overflow-hidden border border-border hover:border-primary transition-colors cursor-pointer bg-muted"
                    onClick={() => setSelectedMediaIndex(index)}
                  >
                    <Card className="border-0 shadow-none">
                      <div className="relative">
                        {mediaType === "image" && (
                          <img
                            src={url}
                            alt={`${media.title} - ${index + 1}`}
                            className="w-full h-auto object-cover rounded-t-lg"
                          />
                        )}

                        {mediaType === "video" && (
                          <div className="relative aspect-video">
                            <MediaPreview
                              src={url}
                              alt={`${media.title} - Video ${index + 1}`}
                              className="w-full h-full object-cover"
                              showControls={true}
                              muted={false}
                              loop={false}
                            />
                          </div>
                        )}

                        {mediaType === "document" && (
                          <div className="aspect-video flex items-center justify-center bg-muted">
                            <div className="text-center p-4">
                              <Download className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {url.split("/").pop()?.split("?")[0] ||
                                  "Document File"}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Overlay - Different controls for different media types */}
                        {mediaType === "video" ? (
                          // Videos show play/pause indicator (native controls handle interaction)
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            {/* The MediaPreview component has showControls={true}, so no additional overlay needed */}
                          </div>
                        ) : (
                          // Images and Documents show download button
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadMedia(url, index);
                              }}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        )}

                        {/* Number Badge - no type label */}
                        <div className="absolute top-2 right-2">
                          <Badge
                            variant="secondary"
                            className="bg-background/90"
                          >
                            {index + 1} / {media.url.length}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fullscreen Modal */}
          {selectedMediaIndex !== null && (
            <div
              className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
              onClick={() => setSelectedMediaIndex(null)}
            >
              <button
                className="absolute top-4 right-4 text-white hover:text-gray-300"
                onClick={() => setSelectedMediaIndex(null)}
              >
                <X className="h-8 w-8" />
              </button>

              <div className="max-w-7xl w-full max-h-full flex items-center justify-center">
                {isImageUrl(media.url[selectedMediaIndex]) && (
                  <img
                    src={media.url[selectedMediaIndex]}
                    alt={`${media.title} - Full view`}
                    className="max-w-full max-h-[90vh] object-contain"
                    onClick={(e) => e.stopPropagation()}
                  />
                )}

                {isVideoUrl(media.url[selectedMediaIndex]) && (
                  <div
                    className="w-full max-w-5xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MediaPreview
                      src={media.url[selectedMediaIndex]}
                      alt={`${media.title} - Full view`}
                      className="w-full"
                      showControls={true}
                      muted={false}
                      loop={false}
                    />
                  </div>
                )}
              </div>

              {/* Navigation */}
              {media.url.length > 1 && (
                <>
                  <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 bg-black/50 rounded-full p-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMediaIndex(
                        (selectedMediaIndex - 1 + media.url.length) %
                          media.url.length
                      );
                    }}
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </button>
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 bg-black/50 rounded-full p-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMediaIndex(
                        (selectedMediaIndex + 1) % media.url.length
                      );
                    }}
                  >
                    <ArrowLeft className="h-6 w-6 rotate-180" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </SidebarInset>

      {/* Edit Media Modal */}
      {media && (
        <EditMediaModal
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          media={media}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Media?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete "
              {media.title}" and all its associated files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}

// Import X icon for the fullscreen close button
import { X } from "lucide-react";
