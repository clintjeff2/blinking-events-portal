"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Upload, X, AlertCircle, ImageIcon, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUpdateBannerMutation, Banner } from "@/lib/redux/api/marketingApi";
import { useToast } from "@/hooks/use-toast";
import {
  uploadFileClient,
  CloudinaryPaths,
  deleteFile,
  getPublicIdFromUrl,
} from "@/lib/cloudinary/upload";
import {
  validateFiles,
  CLOUDINARY_LIMITS_READABLE,
  isImage,
} from "@/lib/cloudinary/config";

interface EditBannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner: Banner | null;
  onSubmit?: () => void;
}

const BANNER_POSITIONS = [
  "Home Hero",
  "Services Page",
  "Events Gallery",
  "About Section",
  "Contact Header",
  "Footer Banner",
] as const;

interface FormData {
  title: string;
  description: string;
  link: string;
  position: string;
  order: number;
  isActive: boolean;
}

export function EditBannerModal({
  open,
  onOpenChange,
  banner,
  onSubmit,
}: EditBannerModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    link: "",
    position: "",
    order: 1,
    isActive: true,
  });

  // Image states
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [isReplacingImage, setIsReplacingImage] = useState(false);

  const [updateBanner, { isLoading: isUpdating }] = useUpdateBannerMutation();

  // Reset form when banner changes
  useEffect(() => {
    if (banner && open) {
      console.log("[Edit Banner Modal] Setting form data from banner:", banner);

      setFormData({
        title: banner.title || "",
        description: banner.description || "",
        link: banner.link || "",
        position: banner.position || "",
        order: banner.order || 1,
        isActive: banner.isActive !== undefined ? banner.isActive : true,
      });

      setCurrentImageUrl(banner.imageUrl || "");
      setSelectedFile(null);
      setImagePreview("");
      setUploadProgress(0);
      setIsUploading(false);
      setUploadError("");
      setIsReplacingImage(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [banner, open]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      link: "",
      position: "",
      order: 1,
      isActive: true,
    });
    setCurrentImageUrl("");
    setSelectedFile(null);
    setImagePreview("");
    setUploadProgress(0);
    setIsUploading(false);
    setUploadError("");
    setIsReplacingImage(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log(
      "[Edit Banner Modal] File selected:",
      file.name,
      file.type,
      file.size
    );

    // Validate file
    const validation = validateFiles([file]);
    if (!validation.isValid) {
      setUploadError(validation.errors[0]);
      toast({
        title: "Invalid File",
        description: validation.errors[0],
        variant: "destructive",
      });
      return;
    }

    // Check if it's an image
    if (!isImage(file)) {
      const error = "Please select an image file (JPG, PNG, GIF, WebP, or SVG)";
      setUploadError(error);
      toast({
        title: "Invalid File Type",
        description: error,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setUploadError("");
    setIsReplacingImage(true);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveNewImage = () => {
    setSelectedFile(null);
    setImagePreview("");
    setUploadError("");
    setIsReplacingImage(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleReplaceImage = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!banner) return;

    console.log("[Edit Banner Modal] Form submitted");
    console.log("[Edit Banner Modal] Form data:", formData);
    console.log("[Edit Banner Modal] Selected file:", selectedFile);
    console.log("[Edit Banner Modal] Is replacing image:", isReplacingImage);

    // Validate required fields
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Banner title is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.position) {
      toast({
        title: "Validation Error",
        description: "Banner position is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.link.trim()) {
      toast({
        title: "Validation Error",
        description: "Banner link is required",
        variant: "destructive",
      });
      return;
    }

    try {
      let imageUrl = currentImageUrl;

      // If user selected a new image, upload it and delete the old one
      if (selectedFile && isReplacingImage) {
        setIsUploading(true);
        setUploadProgress(0);

        console.log("[Edit Banner Modal] Starting image upload...");

        // Upload new image to Cloudinary
        const uploadResult = await uploadFileClient(
          selectedFile,
          CloudinaryPaths.marketing.banners(),
          (progress) => {
            console.log("[Edit Banner Modal] Upload progress:", progress);
            setUploadProgress(progress);
          }
        );

        console.log("[Edit Banner Modal] Upload successful:", uploadResult.url);

        // Delete old image if it exists
        if (currentImageUrl) {
          try {
            const oldPublicId = getPublicIdFromUrl(currentImageUrl);
            await deleteFile(oldPublicId, "image");
            console.log("[Edit Banner Modal] Old image deleted:", oldPublicId);
          } catch (deleteError) {
            console.warn(
              "[Edit Banner Modal] Failed to delete old image:",
              deleteError
            );
            // Continue anyway - the new image was uploaded successfully
          }
        }

        imageUrl = uploadResult.url;
      }

      // Update banner with new data
      const bannerData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        imageUrl,
        link: formData.link.trim(),
        position: formData.position,
        order: formData.order,
        isActive: formData.isActive,
      };

      console.log("[Edit Banner Modal] Updating banner with data:", bannerData);

      await updateBanner({
        id: banner.id,
        ...bannerData,
      }).unwrap();

      console.log("[Edit Banner Modal] Banner updated successfully");

      toast({
        title: "Success",
        description: "Banner updated successfully",
      });

      resetForm();
      onOpenChange(false);
      onSubmit?.();
    } catch (error: any) {
      console.error("[Edit Banner Modal] Error updating banner:", error);

      toast({
        title: "Error",
        description: error.message || "Failed to update banner",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const isSubmitting = isUpdating || isUploading;
  const displayImageUrl = imagePreview || currentImageUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Banner</DialogTitle>
          <DialogDescription>
            Update the marketing banner details and image
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Banner Image */}
          <div className="space-y-4">
            <Label>Banner Image *</Label>

            {displayImageUrl ? (
              <div className="relative">
                <div className="relative rounded-lg overflow-hidden border bg-muted">
                  <img
                    src={displayImageUrl}
                    alt="Banner"
                    className="w-full h-48 object-cover"
                  />
                  {!isReplacingImage ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleReplaceImage}
                      disabled={isSubmitting}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Replace
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveNewImage}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {selectedFile && isReplacingImage && (
                  <p className="text-sm text-muted-foreground mt-2">
                    New image: {selectedFile.name} (
                    {Math.round(selectedFile.size / 1024)} KB)
                  </p>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <div className="mx-auto flex flex-col items-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                    className="mb-2"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose Image
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Supports JPG, PNG, GIF, WebP, or SVG files
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum size: {CLOUDINARY_LIMITS_READABLE.MAX_IMAGE_SIZE}
                  </p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isSubmitting}
            />

            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading new image...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}
          </div>

          {/* Banner Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-banner-title">Banner Title *</Label>
              <Input
                id="edit-banner-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="e.g., Summer Wedding Special"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-banner-position">Position *</Label>
              <Select
                value={formData.position}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, position: value }))
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select banner position" />
                </SelectTrigger>
                <SelectContent>
                  {BANNER_POSITIONS.map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-banner-description">Description</Label>
            <Textarea
              id="edit-banner-description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Brief description of the banner (optional)"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-banner-link">Target Link *</Label>
            <Input
              id="edit-banner-link"
              value={formData.link}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, link: e.target.value }))
              }
              placeholder="e.g., /services/wedding or https://example.com"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-banner-order">Display Order</Label>
              <Input
                id="edit-banner-order"
                type="number"
                min="1"
                value={formData.order}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    order: parseInt(e.target.value) || 1,
                  }))
                }
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-banner-active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isActive: checked }))
                  }
                  disabled={isSubmitting}
                />
                <Label htmlFor="edit-banner-active">Active</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Banner"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
