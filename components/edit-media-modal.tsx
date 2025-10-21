"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Plus,
  X,
  Upload,
  Image as ImageIcon,
  Video,
  FileText,
  Check,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGetEventsQuery } from "@/lib/redux/api/eventsApi";
import { useUpdateMediaMutation, MediaItem } from "@/lib/redux/api/mediaApi";
import {
  uploadMultipleFilesClient,
  deleteFile,
  getPublicIdFromUrl,
} from "@/lib/cloudinary/upload";
import { validateFiles } from "@/lib/cloudinary/config";
import { getMediaType } from "@/lib/utils/media";
import { MediaPreview } from "./media-preview";

interface EditMediaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: MediaItem;
}

export function EditMediaModal({
  open,
  onOpenChange,
  media,
}: EditMediaModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [updateMedia, { isLoading: isUpdating }] = useUpdateMediaMutation();
  const { data: events = [] } = useGetEventsQuery({});

  const [formData, setFormData] = useState({
    title: media.title,
    description: media.description,
    category: media.category,
    tags: [...media.tags],
    eventId: media.eventId || "",
    isFeatured: media.isFeatured,
  });

  // Existing files from the media
  const [existingFiles, setExistingFiles] = useState<string[]>([...media.url]);
  const [thumbnailUrl, setThumbnailUrl] = useState(media.thumbnailUrl);

  // New files to upload
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newFilePreviews, setNewFilePreviews] = useState<string[]>([]);

  // Files marked for deletion
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [currentTag, setCurrentTag] = useState("");
  const [deleteConfirmUrl, setDeleteConfirmUrl] = useState<string | null>(null);

  // Update form data when media changes
  useEffect(() => {
    if (media) {
      setFormData({
        title: media.title,
        description: media.description,
        category: media.category,
        tags: [...media.tags],
        eventId: media.eventId || "",
        isFeatured: media.isFeatured,
      });
      setExistingFiles([...media.url]);
      setThumbnailUrl(media.thumbnailUrl);
      setFilesToDelete([]);
    }
  }, [media]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const validation = validateFiles(files);
    if (!validation.isValid) {
      validation.errors.forEach((error) =>
        toast({ variant: "destructive", description: error })
      );
      return;
    }

    const updatedNewFiles = [...newFiles, ...validation.validFiles];
    setNewFiles(updatedNewFiles);

    const newPreviews = validation.validFiles.map((file) =>
      URL.createObjectURL(file)
    );
    setNewFilePreviews([...newFilePreviews, ...newPreviews]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveNewFile = (index: number) => {
    URL.revokeObjectURL(newFilePreviews[index]);
    setNewFiles(newFiles.filter((_, i) => i !== index));
    setNewFilePreviews(newFilePreviews.filter((_, i) => i !== index));
  };

  const handleMarkExistingFileForDeletion = (url: string) => {
    setDeleteConfirmUrl(url);
  };

  const confirmDeleteExistingFile = () => {
    if (!deleteConfirmUrl) return;

    setFilesToDelete([...filesToDelete, deleteConfirmUrl]);
    setExistingFiles(existingFiles.filter((url) => url !== deleteConfirmUrl));

    // If deleted file was thumbnail, set new thumbnail
    if (thumbnailUrl === deleteConfirmUrl) {
      const remainingFiles = existingFiles.filter(
        (url) => url !== deleteConfirmUrl
      );
      if (remainingFiles.length > 0) {
        setThumbnailUrl(remainingFiles[0]);
      } else if (newFilePreviews.length > 0) {
        // Will set after upload
        setThumbnailUrl("");
      }
    }

    setDeleteConfirmUrl(null);
    toast({ description: "File marked for deletion" });
  };

  const handleSetThumbnail = (url: string) => {
    setThumbnailUrl(url);
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, currentTag.trim()] });
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (index: number) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (existingFiles.length === 0 && newFiles.length === 0) {
      toast({
        variant: "destructive",
        description: "Media must have at least one file",
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({ variant: "destructive", description: "Please provide a title" });
      return;
    }

    if (!formData.category) {
      toast({
        variant: "destructive",
        description: "Please select a category",
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      console.log("[Edit Media] Starting update process...");

      // Step 1: Delete files from Cloudinary
      if (filesToDelete.length > 0) {
        console.log(
          "[Edit Media] Deleting files from Cloudinary:",
          filesToDelete.length
        );
        for (const url of filesToDelete) {
          try {
            const publicId = getPublicIdFromUrl(url);
            const mediaType = getMediaType(url);
            const resourceType =
              mediaType === "video"
                ? "video"
                : mediaType === "image"
                ? "image"
                : "raw";
            await deleteFile(publicId, resourceType);
            console.log("[Edit Media] Deleted:", publicId);
          } catch (error) {
            console.error("[Edit Media] Failed to delete:", url, error);
            // Continue with other deletions
          }
        }
      }

      // Step 2: Upload new files to Cloudinary
      let uploadedUrls: string[] = [];
      if (newFiles.length > 0) {
        console.log(
          "[Edit Media] Uploading new files to Cloudinary:",
          newFiles.length
        );
        const results = await uploadMultipleFilesClient(
          newFiles,
          "blinking-events/media",
          (progress) => setUploadProgress(progress)
        );
        uploadedUrls = results.map((r) => r.url);
        console.log("[Edit Media] New files uploaded:", uploadedUrls);
      }

      // Step 3: Combine existing and new URLs
      const allUrls = [...existingFiles, ...uploadedUrls];
      console.log("[Edit Media] Final URLs:", allUrls);

      // Step 4: Determine thumbnail
      let finalThumbnail = thumbnailUrl;
      if (!finalThumbnail || filesToDelete.includes(finalThumbnail)) {
        finalThumbnail = uploadedUrls.length > 0 ? uploadedUrls[0] : allUrls[0];
      }
      console.log("[Edit Media] Final thumbnail:", finalThumbnail);

      // Step 5: Update Firebase document
      console.log("[Edit Media] Updating Firebase document...");
      const updateData: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        url: allUrls,
        thumbnailUrl: finalThumbnail,
        category: formData.category,
        tags: formData.tags,
        isFeatured: formData.isFeatured,
      };

      if (formData.eventId && formData.eventId !== "none") {
        updateData.eventId = formData.eventId;
      }

      await updateMedia({ id: media.id, data: updateData }).unwrap();
      console.log("[Edit Media] Update successful");

      toast({ description: "Media updated successfully!" });
      handleClose();
    } catch (error: any) {
      console.error("[Edit Media] Error:", error);
      toast({
        variant: "destructive",
        description: error.message || "Failed to update media",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    // Clean up previews
    newFilePreviews.forEach((preview) => URL.revokeObjectURL(preview));

    // Reset state
    setFormData({
      title: media.title,
      description: media.description,
      category: media.category,
      tags: [...media.tags],
      eventId: media.eventId || "",
      isFeatured: media.isFeatured,
    });
    setExistingFiles([...media.url]);
    setThumbnailUrl(media.thumbnailUrl);
    setNewFiles([]);
    setNewFilePreviews([]);
    setFilesToDelete([]);
    setUploadProgress(0);
    setCurrentTag("");
    setDeleteConfirmUrl(null);

    onOpenChange(false);
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />;
    if (type.startsWith("video/")) return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const getUrlIcon = (url: string) => {
    const type = getMediaType(url);
    if (type === "image") return <ImageIcon className="h-4 w-4" />;
    if (type === "video") return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const totalFiles = existingFiles.length + newFiles.length;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Media</DialogTitle>
            <DialogDescription>
              Update media details, add or remove files
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Existing Files */}
              {existingFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Current Files ({existingFiles.length})</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                    {existingFiles.map((url, index) => {
                      const mediaType = getMediaType(url);
                      const isThumbnail = url === thumbnailUrl;

                      return (
                        <div
                          key={url}
                          className={`group relative aspect-video rounded-lg overflow-hidden border-2 ${
                            isThumbnail
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-border"
                          }`}
                        >
                          {/* Preview */}
                          {mediaType === "image" || mediaType === "video" ? (
                            <MediaPreview
                              src={url}
                              alt={`File ${index + 1}`}
                              className="w-full h-full object-cover"
                              showControls={mediaType === "video"}
                              muted={true}
                              loop={false}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              {getUrlIcon(url)}
                              <p className="text-xs ml-2">Document</p>
                            </div>
                          )}

                          {/* Thumbnail Badge */}
                          {isThumbnail && (
                            <div className="absolute top-2 left-2">
                              <Badge variant="default" className="text-xs">
                                <Check className="h-3 w-3 mr-1" />
                                Thumbnail
                              </Badge>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            {!isThumbnail &&
                              (mediaType === "image" ||
                                mediaType === "video") && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleSetThumbnail(url)}
                                >
                                  Set as Thumbnail
                                </Button>
                              )}
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleMarkExistingFileForDeletion(url)
                              }
                              disabled={isUploading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add New Files */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Add New Files</Label>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,application/pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supported: Images (JPG, PNG, GIF, WebP), Videos (MP4, WebM,
                    MOV), Documents (PDF, DOC)
                  </p>
                </div>

                {/* New File Previews */}
                {newFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>New Files to Upload ({newFiles.length})</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                      {newFiles.map((file, index) => {
                        const preview = newFilePreviews[index];
                        const mediaType = getMediaType(file.name);

                        return (
                          <div
                            key={index}
                            className="group relative aspect-video rounded-lg overflow-hidden border-2 border-green-500/50"
                          >
                            {/* Preview */}
                            {mediaType === "image" || mediaType === "video" ? (
                              <MediaPreview
                                src={preview}
                                alt={file.name}
                                className="w-full h-full object-cover"
                                showControls={mediaType === "video"}
                                muted={true}
                                loop={false}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-muted">
                                {getFileIcon(file)}
                                <p className="text-xs ml-2 truncate">
                                  {file.name}
                                </p>
                              </div>
                            )}

                            {/* New Badge */}
                            <div className="absolute top-2 left-2">
                              <Badge
                                variant="default"
                                className="text-xs bg-green-600"
                              >
                                New
                              </Badge>
                            </div>

                            {/* Actions */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRemoveNewFile(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Updating...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="e.g., Elegant Wedding Setup"
                      required
                      disabled={isUploading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category: value })
                      }
                      required
                      disabled={isUploading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wedding">Wedding</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="cultural">Cultural</SelectItem>
                        <SelectItem value="birthday">Birthday</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe this media..."
                    rows={3}
                    disabled={isUploading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventId">Event (Optional)</Label>
                  <Select
                    value={formData.eventId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, eventId: value })
                    }
                    disabled={isUploading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an event" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label>Tags</Label>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(index)}
                            className="ml-2"
                            disabled={isUploading}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      placeholder="Add a tag"
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), handleAddTag())
                      }
                      disabled={isUploading}
                    />
                    <Button
                      type="button"
                      onClick={handleAddTag}
                      disabled={isUploading}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Featured</Label>
                    <p className="text-sm text-muted-foreground">
                      Show this media prominently
                    </p>
                  </div>
                  <Switch
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isFeatured: checked })
                    }
                    disabled={isUploading}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUploading || totalFiles === 0}
                >
                  {isUploading ? "Updating..." : "Update Media"}
                </Button>
              </div>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteConfirmUrl !== null}
        onOpenChange={() => setDeleteConfirmUrl(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this file?</AlertDialogTitle>
            <AlertDialogDescription>
              This file will be permanently deleted from both Cloudinary and
              Firestore. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteExistingFile}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
