"use client";

import React, { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useUpdateServiceMutation } from "@/lib/redux/api/servicesApi";
import { X, Plus, Upload, Trash2, Loader2 } from "lucide-react";
import type { Service, ServicePackage } from "@/lib/redux/api/servicesApi";

interface ImagePreview {
  url: string;
  file?: File;
  isNew: boolean;
  isDeleted: boolean;
}

interface EditServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  service: Service | null;
}

export function EditServiceModal({
  open,
  onOpenChange,
  onSubmit,
  service,
}: EditServiceModalProps) {
  const { toast } = useToast();
  const [updateService, { isLoading: isUpdating }] = useUpdateServiceMutation();

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    priceRange: { min: 0, max: 0, currency: "XAF" },
    featured: false,
    isActive: true,
  });

  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [currentPackage, setCurrentPackage] = useState<ServicePackage>({
    name: "",
    features: [],
    price: 0,
    description: "",
  });
  const [currentFeature, setCurrentFeature] = useState("");
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Reset form when service changes
  useEffect(() => {
    if (service && open) {
      console.log("[Edit Service Modal] Loading service data:", service);
      setFormData({
        name: service.name,
        category: service.category,
        description: service.description,
        priceRange: service.priceRange,
        featured: service.featured,
        isActive: service.isActive,
      });
      setPackages(service.packages || []);

      // Load existing images
      const existingImages: ImagePreview[] = (service.images || []).map(
        (url) => ({
          url,
          isNew: false,
          isDeleted: false,
        })
      );
      setImagePreviews(existingImages);
    }
  }, [service, open]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    console.log("[Edit Service Modal] Files selected:", files.length);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [
          ...prev,
          {
            url: reader.result as string,
            file,
            isNew: true,
            isDeleted: false,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    setImagePreviews((prev) => {
      const updated = [...prev];
      if (updated[index].isNew) {
        // Remove new images completely
        updated.splice(index, 1);
      } else {
        // Mark existing images as deleted
        updated[index].isDeleted = true;
      }
      return updated;
    });
  };

  const handleRestoreImage = (index: number) => {
    setImagePreviews((prev) => {
      const updated = [...prev];
      updated[index].isDeleted = false;
      return updated;
    });
  };

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "blinking-events/services");

    const response = await fetch("/api/cloudinary/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    const data = await response.json();
    return data.url;
  };

  const addFeature = () => {
    if (currentFeature.trim()) {
      setCurrentPackage((prev) => ({
        ...prev,
        features: [...prev.features, currentFeature.trim()],
      }));
      setCurrentFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setCurrentPackage((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const addPackage = () => {
    if (
      currentPackage.name &&
      currentPackage.price > 0 &&
      currentPackage.features.length > 0
    ) {
      setPackages((prev) => [...prev, currentPackage]);
      setCurrentPackage({
        name: "",
        features: [],
        price: 0,
        description: "",
      });
      toast({
        title: "Package added",
        description: "Package added successfully",
      });
    } else {
      toast({
        title: "Validation error",
        description:
          "Please fill all package fields and add at least one feature",
        variant: "destructive",
      });
    }
  };

  const removePackage = (index: number) => {
    setPackages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!service) return;

    try {
      console.log("[Edit Service Modal] Starting save process...");

      // Validation
      if (formData.priceRange.min >= formData.priceRange.max) {
        toast({
          title: "Validation error",
          description: "Maximum price must be greater than minimum price",
          variant: "destructive",
        });
        return;
      }

      if (packages.length === 0) {
        toast({
          title: "Validation error",
          description: "Please add at least one package",
          variant: "destructive",
        });
        return;
      }

      const activeImages = imagePreviews.filter((img) => !img.isDeleted);
      if (activeImages.length === 0) {
        toast({
          title: "Validation error",
          description: "Please add at least one image",
          variant: "destructive",
        });
        return;
      }

      // Upload new images
      setIsUploadingImages(true);
      console.log("[Edit Service Modal] Uploading new images...");

      const newImages = imagePreviews.filter(
        (img) => img.isNew && !img.isDeleted
      );
      const uploadedUrls: string[] = [];

      for (const img of newImages) {
        if (img.file) {
          try {
            const url = await uploadImageToCloudinary(img.file);
            uploadedUrls.push(url);
            console.log("[Edit Service Modal] Image uploaded:", url);
          } catch (error: any) {
            console.error("[Edit Service Modal] Image upload failed:", error);
            toast({
              title: "Upload error",
              description: `Failed to upload image: ${error.message}`,
              variant: "destructive",
            });
            setIsUploadingImages(false);
            return;
          }
        }
      }

      // Combine existing (not deleted) + newly uploaded images
      const existingImages = imagePreviews
        .filter((img) => !img.isNew && !img.isDeleted)
        .map((img) => img.url);

      const finalImages = [...existingImages, ...uploadedUrls];

      console.log("[Edit Service Modal] Final images:", finalImages);
      setIsUploadingImages(false);

      // Update service
      console.log("[Edit Service Modal] Updating service...");
      await updateService({
        id: service.id,
        data: {
          ...formData,
          packages,
          images: finalImages,
        },
      }).unwrap();

      toast({
        title: "Success",
        description: "Service updated successfully",
      });

      onSubmit();
      onOpenChange(false);
    } catch (error: any) {
      console.error("[Edit Service Modal] Error:", error);
      setIsUploadingImages(false);
      toast({
        title: "Error",
        description: error.message || "Failed to update service",
        variant: "destructive",
      });
    }
  };

  if (!service) return null;

  const isSubmitting = isUploadingImages || isUpdating;
  const activeImages = imagePreviews.filter((img) => !img.isDeleted);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Service</DialogTitle>
          <DialogDescription>
            Update service information, packages, and images
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wedding">Wedding</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="cultural">Cultural</SelectItem>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minPrice">Minimum Price *</Label>
                <Input
                  id="minPrice"
                  type="number"
                  value={formData.priceRange.min}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priceRange: {
                        ...formData.priceRange,
                        min: Number(e.target.value),
                      },
                    })
                  }
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPrice">Maximum Price *</Label>
                <Input
                  id="maxPrice"
                  type="number"
                  value={formData.priceRange.max}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priceRange: {
                        ...formData.priceRange,
                        max: Number(e.target.value),
                      },
                    })
                  }
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Select
                  value={formData.priceRange.currency}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      priceRange: { ...formData.priceRange, currency: value },
                    })
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="XAF">XAF</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Featured Service</Label>
                <p className="text-sm text-muted-foreground">
                  Show this service prominently
                </p>
              </div>
              <Switch
                checked={formData.featured}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, featured: checked })
                }
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active</Label>
                <p className="text-sm text-muted-foreground">
                  Make this service available to clients
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Service Images *</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("image-upload")?.click()}
                disabled={isSubmitting}
              >
                <Upload className="mr-2 h-4 w-4" />
                Add Images
              </Button>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                {imagePreviews.map((img, index) => (
                  <div
                    key={index}
                    className={`relative group ${
                      img.isDeleted ? "opacity-50" : ""
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    {img.isNew && (
                      <Badge
                        variant="secondary"
                        className="absolute top-2 left-2 text-xs"
                      >
                        New
                      </Badge>
                    )}
                    {img.isDeleted ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => handleRestoreImage(index)}
                        disabled={isSubmitting}
                      >
                        Restore
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveImage(index)}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {activeImages.length} active image(s). At least 1 required.
            </p>
          </div>

          {/* Packages Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Service Packages</h3>

            {/* Existing Packages */}
            {packages.length > 0 && (
              <div className="space-y-3">
                {packages.map((pkg, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 space-y-2 bg-muted/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{pkg.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {pkg.description}
                        </p>
                        <p className="text-lg font-bold mt-2">
                          {pkg.price.toLocaleString()}{" "}
                          {formData.priceRange.currency}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {pkg.features.map((feature, fIndex) => (
                            <Badge key={fIndex} variant="outline">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePackage(index)}
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Package */}
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium">Add New Package</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Package Name *</Label>
                  <Input
                    value={currentPackage.name}
                    onChange={(e) =>
                      setCurrentPackage({
                        ...currentPackage,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g., Basic Package"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Price *</Label>
                  <Input
                    type="number"
                    value={currentPackage.price || ""}
                    onChange={(e) =>
                      setCurrentPackage({
                        ...currentPackage,
                        price: Number(e.target.value),
                      })
                    }
                    placeholder="0"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={currentPackage.description}
                  onChange={(e) =>
                    setCurrentPackage({
                      ...currentPackage,
                      description: e.target.value,
                    })
                  }
                  placeholder="Package description"
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label>Features *</Label>
                <div className="flex gap-2">
                  <Input
                    value={currentFeature}
                    onChange={(e) => setCurrentFeature(e.target.value)}
                    placeholder="Add a feature"
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addFeature())
                    }
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    onClick={addFeature}
                    disabled={isSubmitting}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {currentPackage.features.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {currentPackage.features.map((feature, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeFeature(index)}
                      >
                        {feature} <X className="ml-1 h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addPackage}
                className="w-full"
                disabled={isSubmitting}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add This Package
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              {packages.length} package(s) added. At least 1 required.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isUploadingImages && (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading Images...
                </>
              )}
              {isUpdating && !isUploadingImages && (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              )}
              {!isSubmitting && "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
