"use client";

import { useState } from "react";
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
import { Plus, X, Upload, ImageIcon, Loader2 } from "lucide-react";
import { useCreateServiceMutation } from "@/lib/redux/api/servicesApi";
import { useToast } from "@/hooks/use-toast";
import { uploadMultipleFilesClient } from "@/lib/cloudinary/upload";

interface ServicePackage {
  name: string;
  features: string[];
  price: number;
  description: string;
}

interface AddServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: any) => void;
}

interface ImagePreview {
  file: File;
  preview: string;
}

const CURRENCIES = [
  { code: "XAF", name: "CFA Franc (XAF)", symbol: "XAF" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
];

export function AddServiceModal({
  open,
  onOpenChange,
  onSubmit,
}: AddServiceModalProps) {
  const { toast } = useToast();
  const [createService, { isLoading }] = useCreateServiceMutation();

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    priceRange: { min: 0, max: 0, currency: "XAF" },
    featured: false,
    isActive: true,
    staffProfiles: [] as string[],
  });

  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [currentPackage, setCurrentPackage] = useState<ServicePackage>({
    name: "",
    features: [""],
    price: 0,
    description: "",
  });

  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [uploading, setUploading] = useState(false);

  // Handle image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => file.type.startsWith("image/"));

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid files",
        description: "Only image files are allowed",
        variant: "destructive",
      });
    }

    // Create previews
    const newPreviews: ImagePreview[] = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  // Remove image preview
  const handleRemoveImage = (index: number) => {
    const newPreviews = [...imagePreviews];
    URL.revokeObjectURL(newPreviews[index].preview); // Clean up
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };

  // Package management
  const handleAddPackage = () => {
    const validFeatures = currentPackage.features.filter((f) => f.trim());
    if (
      currentPackage.name &&
      currentPackage.price > 0 &&
      validFeatures.length > 0
    ) {
      setPackages([
        ...packages,
        { ...currentPackage, features: validFeatures },
      ]);
      setCurrentPackage({
        name: "",
        features: [""],
        price: 0,
        description: "",
      });
      toast({
        title: "Package added",
        description: `${currentPackage.name} has been added to the service`,
      });
    } else {
      toast({
        title: "Invalid package",
        description:
          "Please fill in package name, price, and at least one feature",
        variant: "destructive",
      });
    }
  };

  const handleRemovePackage = (index: number) => {
    setPackages(packages.filter((_, i) => i !== index));
  };

  const handleAddFeature = () => {
    setCurrentPackage({
      ...currentPackage,
      features: [...currentPackage.features, ""],
    });
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...currentPackage.features];
    newFeatures[index] = value;
    setCurrentPackage({ ...currentPackage, features: newFeatures });
  };

  const handleRemoveFeature = (index: number) => {
    if (currentPackage.features.length > 1) {
      setCurrentPackage({
        ...currentPackage,
        features: currentPackage.features.filter((_, i) => i !== index),
      });
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("[AddService] Form submitted");

    // Validation
    if (!formData.name || !formData.category || !formData.description) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.priceRange.min <= 0 || formData.priceRange.max <= 0) {
      toast({
        title: "Invalid price range",
        description: "Price range must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (formData.priceRange.min > formData.priceRange.max) {
      toast({
        title: "Invalid price range",
        description: "Minimum price cannot be greater than maximum price",
        variant: "destructive",
      });
      return;
    }

    if (imagePreviews.length === 0) {
      toast({
        title: "No images",
        description: "Please add at least one image",
        variant: "destructive",
      });
      return;
    }

    if (packages.length === 0) {
      toast({
        title: "No packages",
        description: "Please add at least one service package",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      console.log("[AddService] Uploading images to Cloudinary...");

      // Upload images to Cloudinary
      const files = imagePreviews.map((img) => img.file);
      const uploadResults = await uploadMultipleFilesClient(
        files,
        "blinking-events/services"
      );

      const imageUrls = uploadResults.map((result) => result.url);
      console.log("[AddService] Images uploaded:", imageUrls);

      // Prepare service data
      const serviceData = {
        ...formData,
        packages,
        images: imageUrls,
      };

      console.log("[AddService] Creating service in Firestore...");

      // Create service in Firestore
      const result = await createService(serviceData).unwrap();

      console.log("[AddService] Service created successfully:", result);

      toast({
        title: "Service created",
        description: `${formData.name} has been created successfully`,
      });

      // Call optional callback
      if (onSubmit) {
        onSubmit(result);
      }

      // Reset form
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      console.error("[AddService] Error:", error);
      toast({
        title: "Failed to create service",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      description: "",
      priceRange: { min: 0, max: 0, currency: "XAF" },
      featured: false,
      isActive: true,
      staffProfiles: [],
    });
    setPackages([]);
    setCurrentPackage({
      name: "",
      features: [""],
      price: 0,
      description: "",
    });
    // Clean up image previews
    imagePreviews.forEach((img) => URL.revokeObjectURL(img.preview));
    setImagePreviews([]);
  };

  const selectedCurrency = CURRENCIES.find(
    (c) => c.code === formData.priceRange.currency
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Service</DialogTitle>
          <DialogDescription>
            Create a new service offering with packages and pricing
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2">
              Basic Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Service Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Premium Wedding Package"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                  required
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
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe the service offering in detail..."
                rows={4}
                required
              />
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2">Price Range</h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">
                  Currency <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.priceRange.currency}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      priceRange: { ...formData.priceRange, currency: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((curr) => (
                      <SelectItem key={curr.code} value={curr.code}>
                        {curr.symbol} {curr.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minPrice">
                  Minimum Price ({selectedCurrency?.symbol}){" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="minPrice"
                  type="number"
                  value={formData.priceRange.min || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priceRange: {
                        ...formData.priceRange,
                        min: Number(e.target.value),
                      },
                    })
                  }
                  placeholder="50000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPrice">
                  Maximum Price ({selectedCurrency?.symbol}){" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="maxPrice"
                  type="number"
                  value={formData.priceRange.max || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priceRange: {
                        ...formData.priceRange,
                        max: Number(e.target.value),
                      },
                    })
                  }
                  placeholder="500000"
                  required
                />
              </div>
            </div>
          </div>

          {/* Service Images */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2">
              Service Images <span className="text-destructive">*</span>
            </h3>

            <div className="space-y-4">
              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                  {imagePreviews.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {img.file.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="images"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Label htmlFor="images" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Upload Images</p>
                      <p className="text-sm text-muted-foreground">
                        Click to browse or drag and drop
                      </p>
                    </div>
                  </div>
                </Label>
              </div>
            </div>
          </div>

          {/* Service Packages */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2">
              Service Packages <span className="text-destructive">*</span>
            </h3>

            {/* Existing Packages */}
            {packages.length > 0 && (
              <div className="space-y-2">
                {packages.map((pkg, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between p-4 bg-muted rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{pkg.name}</p>
                        <Badge variant="secondary">
                          {selectedCurrency?.symbol}
                          {pkg.price.toLocaleString()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {pkg.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {pkg.features.map((feature, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemovePackage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Package */}
            <div className="p-4 border rounded-lg space-y-4 bg-card">
              <p className="font-medium text-sm">Add New Package</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="packageName">Package Name</Label>
                  <Input
                    id="packageName"
                    value={currentPackage.name}
                    onChange={(e) =>
                      setCurrentPackage({
                        ...currentPackage,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g., Basic, Premium, Deluxe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="packagePrice">
                    Price ({selectedCurrency?.symbol})
                  </Label>
                  <Input
                    id="packagePrice"
                    type="number"
                    value={currentPackage.price || ""}
                    onChange={(e) =>
                      setCurrentPackage({
                        ...currentPackage,
                        price: Number(e.target.value),
                      })
                    }
                    placeholder="100000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="packageDescription">Package Description</Label>
                <Textarea
                  id="packageDescription"
                  value={currentPackage.description}
                  onChange={(e) =>
                    setCurrentPackage({
                      ...currentPackage,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe what's included in this package..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Features</Label>
                {currentPackage.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={feature}
                      onChange={(e) =>
                        handleFeatureChange(index, e.target.value)
                      }
                      placeholder="Feature description"
                    />
                    {currentPackage.features.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFeature(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddFeature}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Feature
                </Button>
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={handleAddPackage}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Package to Service
              </Button>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2">Settings</h3>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="space-y-0.5">
                <Label>Featured Service</Label>
                <p className="text-sm text-muted-foreground">
                  Show this service prominently on the platform
                </p>
              </div>
              <Switch
                checked={formData.featured}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, featured: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="space-y-0.5">
                <Label>Active</Label>
                <p className="text-sm text-muted-foreground">
                  Make this service available for booking
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={uploading || isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={uploading || isLoading}>
              {uploading || isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploading ? "Uploading Images..." : "Creating Service..."}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Create Service
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
