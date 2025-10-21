"use client";

import type React from "react";

import { useState, useRef } from "react";
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
  Plus,
  X,
  Upload,
  Image as ImageIcon,
  Video,
  FileText,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGetEventsQuery } from "@/lib/redux/api/eventsApi";
import { useCreateMediaMutation } from "@/lib/redux/api/mediaApi";
import {
  uploadMultipleFilesClient,
  CloudinaryPaths,
} from "@/lib/cloudinary/upload";
import { validateFiles } from "@/lib/cloudinary/config";
import { getMediaType } from "@/lib/utils/media";
import { MediaPreview } from "./media-preview";

interface AddMediaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMediaModal({ open, onOpenChange }: AddMediaModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [createMedia, { isLoading: isCreating }] = useCreateMediaMutation();
  const { data: events = [] } = useGetEventsQuery({});

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    tags: [] as string[],
    eventId: "",
    isFeatured: false,
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [currentTag, setCurrentTag] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate files
    const validation = validateFiles(files);
    if (!validation.isValid) {
      validation.errors.forEach((error) =>
        toast({ variant: "destructive", description: error })
      );
      return;
    }

    // Add valid files
    const newFiles = [...selectedFiles, ...validation.validFiles];
    setSelectedFiles(newFiles);

    // Create previews
    const newPreviews = validation.validFiles.map((file) =>
      URL.createObjectURL(file)
    );
    setFilePreviews([...filePreviews, ...newPreviews]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    URL.revokeObjectURL(filePreviews[index]);
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    setFilePreviews(filePreviews.filter((_, i) => i !== index));

    // Adjust thumbnail index if needed
    if (thumbnailIndex === index) {
      setThumbnailIndex(0);
    } else if (thumbnailIndex > index) {
      setThumbnailIndex(thumbnailIndex - 1);
    }
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

    if (selectedFiles.length === 0) {
      toast({
        variant: "destructive",
        description: "Please select at least one file to upload",
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

      console.log("[Upload] Starting upload process...");
      console.log("[Upload] Selected files:", selectedFiles.length);

      // Step 1: Upload files to Cloudinary
      console.log("[Upload] Step 1: Uploading to Cloudinary...");
      const results = await uploadMultipleFilesClient(
        selectedFiles,
        "blinking-events/media",
        (progress) => {
          console.log("[Upload] Progress:", progress + "%");
          setUploadProgress(progress);
        }
      );

      console.log("[Upload] Cloudinary upload complete:", results);
      const mediaUrls = results.map((r) => r.url);
      const thumbnailUrl = results[thumbnailIndex]?.url || mediaUrls[0];

      console.log("[Upload] Media URLs:", mediaUrls);
      console.log("[Upload] Thumbnail URL:", thumbnailUrl);

      // Step 2: Create media document in Firebase
      console.log("[Upload] Step 2: Creating Firebase document...");

      // Build data object without undefined fields
      const mediaData: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        url: mediaUrls,
        thumbnailUrl,
        category: formData.category,
        tags: formData.tags,
        isFeatured: formData.isFeatured,
        uploadedBy: "admin", // TODO: Get from auth context
        uploadedAt: new Date().toISOString(),
        isActive: true,
      };

      // Only add eventId if it's valid
      if (formData.eventId && formData.eventId !== "none") {
        mediaData.eventId = formData.eventId;
      }

      console.log("[Upload] Firebase data:", mediaData);

      const result = await createMedia(mediaData).unwrap();
      console.log("[Upload] Firebase document created:", result);

      toast({ description: "Media uploaded successfully!" });
      handleClose();
    } catch (error: any) {
      console.error("[Upload] Error:", error);
      toast({
        variant: "destructive",
        description: error.message || "Failed to upload media",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    // Clean up previews
    filePreviews.forEach((preview) => URL.revokeObjectURL(preview));

    // Reset form
    setFormData({
      title: "",
      description: "",
      category: "",
      tags: [],
      eventId: "",
      isFeatured: false,
    });
    setSelectedFiles([]);
    setFilePreviews([]);
    setThumbnailIndex(0);
    setUploadProgress(0);
    setCurrentTag("");

    onOpenChange(false);
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />;
    if (type.startsWith("video/")) return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Upload Media</DialogTitle>
          <DialogDescription>
            Add new media to your gallery (images, videos, documents)
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Media Files *</Label>
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

              {/* File Previews */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Files ({selectedFiles.length})</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                    {selectedFiles.map((file, index) => {
                      const preview = filePreviews[index];
                      const mediaType = getMediaType(file.name);
                      const isThumbnail = index === thumbnailIndex;

                      return (
                        <div
                          key={index}
                          className={`group relative aspect-video rounded-lg overflow-hidden border-2 ${
                            isThumbnail
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-border"
                          }`}
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
                                  onClick={() => setThumbnailIndex(index)}
                                >
                                  Set as Thumbnail
                                </Button>
                              )}
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveFile(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* File Info */}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2 text-xs text-white truncate">
                            {file.name}
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
                    <span>Uploading...</span>
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
                      e.key === "Enter" && (e.preventDefault(), handleAddTag())
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
                disabled={isUploading || selectedFiles.length === 0}
              >
                {isUploading ? "Uploading..." : "Upload Media"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
