"use client";

import React, { useState, useRef } from "react";
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
import { Upload, X, AlertCircle, ImageIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCreateBannerMutation } from "@/lib/redux/api/marketingApi";
import { useToast } from "@/hooks/use-toast";
import { uploadFileClient, CloudinaryPaths } from "@/lib/cloudinary/upload";
import {
  validateFiles,
  CLOUDINARY_LIMITS_READABLE,
  isImage,
} from "@/lib/cloudinary/config";

interface AddBannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function AddBannerModal({
  open,
  onOpenChange,
  onSubmit,
}: AddBannerModalProps) {
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

  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");

  const [createBanner, { isLoading: isCreating }] = useCreateBannerMutation();

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      link: "",
      position: "",
      order: 1,
      isActive: true,
    });
    setSelectedFile(null);
    setImagePreview("");
    setUploadProgress(0);
    setIsUploading(false);
    setUploadError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log(
      "[Add Banner Modal] File selected:",
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

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setImagePreview("");
    setUploadError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("[Add Banner Modal] Form submitted");
    console.log("[Add Banner Modal] Form data:", formData);
    console.log("[Add Banner Modal] Selected file:", selectedFile);

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

    if (!selectedFile) {
      toast({
        title: "Validation Error",
        description: "Banner image is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      console.log("[Add Banner Modal] Starting image upload...");

      // Upload image to Cloudinary
      const uploadResult = await uploadFileClient(
        selectedFile,
        CloudinaryPaths.marketing.banners(),
        (progress) => {
          console.log("[Add Banner Modal] Upload progress:", progress);
          setUploadProgress(progress);
        }
      );

      console.log("[Add Banner Modal] Upload successful:", uploadResult.url);

      // Create banner with uploaded image URL
      const bannerData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        imageUrl: uploadResult.url,
        link: formData.link.trim(),
        position: formData.position,
        order: formData.order,
        isActive: formData.isActive,
      };

      console.log("[Add Banner Modal] Creating banner with data:", bannerData);

      await createBanner(bannerData).unwrap();

      console.log("[Add Banner Modal] Banner created successfully");

      toast({
        title: "Success",
        description: "Banner created successfully",
      });

      resetForm();
      onOpenChange(false);
      onSubmit?.();
    } catch (error: any) {
      console.error("[Add Banner Modal] Error creating banner:", error);

      toast({
        title: "Error",
        description: error.message || "Failed to create banner",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const isSubmitting = isCreating || isUploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Banner</DialogTitle>
          <DialogDescription>
            Create a new marketing banner for promotional campaigns
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Banner Image Upload */}
          <div className="space-y-4">
            <Label>Banner Image *</Label>

            {!imagePreview ? (
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
            ) : (
              <div className="relative">
                <div className="relative rounded-lg overflow-hidden border bg-muted">
                  <img
                    src={imagePreview}
                    alt="Banner preview"
                    className="w-full h-48 object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveFile}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: {selectedFile.name} (
                    {Math.round(selectedFile.size / 1024)} KB)
                  </p>
                )}
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
                  <span>Uploading image...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}
          </div>

          {/* Banner Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="banner-title">Banner Title *</Label>
              <Input
                id="banner-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="e.g., Summer Wedding Special"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner-position">Position *</Label>
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
            <Label htmlFor="banner-description">Description</Label>
            <Textarea
              id="banner-description"
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
            <Label htmlFor="banner-link">Target Link *</Label>
            <Input
              id="banner-link"
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
              <Label htmlFor="banner-order">Display Order</Label>
              <Input
                id="banner-order"
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
                  id="banner-active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isActive: checked }))
                  }
                  disabled={isSubmitting}
                />
                <Label htmlFor="banner-active">Active</Label>
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
            <Button type="submit" disabled={isSubmitting || !selectedFile}>
              {isSubmitting ? "Creating..." : "Create Banner"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
