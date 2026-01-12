"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  X,
  Upload,
  Loader2,
  ImageIcon,
  Star,
  Trash2,
  Plus,
  AlertCircle,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useUpdateProductMutation } from "@/lib/redux/api/shopApi";
import { uploadMultipleFilesClient } from "@/lib/cloudinary/upload";
import Image from "next/image";

// Form schema
const productFormSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  currency: z.string().default("XAF"),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative"),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

// Available currencies
const CURRENCIES = [
  { value: "XAF", label: "XAF (FCFA)", symbol: "FCFA" },
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "EUR", label: "EUR (€)", symbol: "€" },
  { value: "GBP", label: "GBP (£)", symbol: "£" },
];

// Product categories
const productCategories = [
  "Wedding Dresses",
  "Suits & Tuxedos",
  "Accessories",
  "Decorations",
  "Vehicles",
  "Furniture",
  "Lighting",
  "Flowers",
  "Catering Equipment",
  "Audio/Visual",
  "Other",
];

// Interface for existing images from database
interface ExistingImage {
  id: string;
  url: string;
  publicId?: string;
  alt?: string;
  isThumbnail: boolean;
  isExisting: true;
}

// Interface for new local images
interface LocalImage {
  id: string;
  file: File;
  preview: string;
  isThumbnail: boolean;
  uploadProgress: number;
  uploadStatus: "pending" | "uploading" | "success" | "error";
  cloudinaryUrl?: string;
  publicId?: string;
  error?: string;
  isExisting: false;
}

type ImageItem = ExistingImage | LocalImage;

interface ProductImage {
  url: string;
  publicId?: string;
  alt?: string;
  isThumbnail?: boolean;
}

interface ShopProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency?: string;
  quantity: number;
  images: ProductImage[];
  thumbnailUrl?: string;
  isActive: boolean;
  isFeatured: boolean;
}

interface EditProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ShopProduct | null;
}

export default function EditProductModal({
  open,
  onOpenChange,
  product,
}: EditProductModalProps) {
  const { toast } = useToast();
  const [updateProduct] = useUpdateProductMutation();

  // Image state - combined existing and new images
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]); // publicIds to delete

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      price: 0,
      currency: "XAF",
      quantity: 0,
      isActive: true,
      isFeatured: false,
    },
  });

  // Initialize form and images when product changes
  useEffect(() => {
    if (product && open) {
      form.reset({
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        currency: product.currency || "XAF",
        quantity: product.quantity,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
      });

      // Convert existing product images
      const existingImages: ExistingImage[] = (product.images || []).map(
        (img, index) => ({
          id: `existing-${index}-${img.publicId}`,
          url: img.url,
          publicId: img.publicId,
          alt: img.alt,
          isThumbnail: img.isThumbnail || img.url === product.thumbnailUrl,
          isExisting: true as const,
        })
      );

      setImages(existingImages);
      setImagesToDelete([]);
      setOverallProgress(0);
    }
  }, [product, open, form]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (!img.isExisting && img.preview) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const newImages: LocalImage[] = Array.from(files).map((file) => ({
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
        isThumbnail: false,
        uploadProgress: 0,
        uploadStatus: "pending" as const,
        isExisting: false as const,
      }));

      setImages((prev) => {
        const combined = [...prev, ...newImages];
        // If no thumbnail set, set first image as thumbnail
        const hasThumbnail = combined.some((img) => img.isThumbnail);
        if (!hasThumbnail && combined.length > 0) {
          combined[0].isThumbnail = true;
        }
        return combined;
      });

      // Reset input
      event.target.value = "";
    },
    []
  );

  // Remove image
  const removeImage = useCallback((imageId: string) => {
    setImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === imageId);

      // If removing an existing image, track it for deletion
      if (imageToRemove?.isExisting && imageToRemove.publicId) {
        const publicIdToDelete = imageToRemove.publicId;
        setImagesToDelete((current) => [...current, publicIdToDelete]);
      } else if (imageToRemove && !imageToRemove.isExisting) {
        // Revoke preview URL for local images
        URL.revokeObjectURL(imageToRemove.preview);
      }

      const filtered = prev.filter((img) => img.id !== imageId);

      // If removed image was thumbnail, set first remaining as thumbnail
      if (imageToRemove?.isThumbnail && filtered.length > 0) {
        filtered[0].isThumbnail = true;
      }

      return filtered;
    });
  }, []);

  // Set thumbnail
  const setThumbnail = useCallback((imageId: string) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isThumbnail: img.id === imageId,
      }))
    );
  }, []);

  // Upload all new images using the utility function
  const uploadAllImages = async (): Promise<ProductImage[]> => {
    const newImages = images.filter(
      (img): img is LocalImage => !img.isExisting
    );
    const existingImages = images.filter(
      (img): img is ExistingImage => img.isExisting
    );

    const uploadResults: ProductImage[] = [];

    // Start with existing images
    existingImages.forEach((img) => {
      uploadResults.push({
        url: img.url,
        publicId: img.publicId,
        alt: img.alt,
        isThumbnail: img.isThumbnail,
      });
    });

    if (newImages.length === 0) {
      // No new images, just return existing ones
      return uploadResults;
    }

    // Mark new images as uploading
    setImages((prev) =>
      prev.map((img) =>
        !img.isExisting ? { ...img, uploadStatus: "uploading" as const } : img
      )
    );

    // Upload new images using the utility
    const files = newImages.map((img) => img.file);

    console.log("[EditProduct] Uploading", files.length, "new images...");

    const cloudinaryResults = await uploadMultipleFilesClient(
      files,
      "blinking-events/shop/products",
      (progress) => {
        setOverallProgress(progress);
      }
    );

    console.log("[EditProduct] Upload complete:", cloudinaryResults);

    // Mark all new images as uploaded and add to results
    cloudinaryResults.forEach((result, index) => {
      const newImage = newImages[index];
      uploadResults.push({
        url: result.url,
        publicId: result.publicId,
        isThumbnail: newImage.isThumbnail,
      });
    });

    // Update UI state
    setImages((prev) =>
      prev.map((img) =>
        !img.isExisting
          ? { ...img, uploadStatus: "success" as const, uploadProgress: 100 }
          : img
      )
    );

    return uploadResults;
  };

  // Delete images from Cloudinary (optional - depends on your backend)
  const deleteImagesFromCloudinary = async (publicIds: string[]) => {
    // Note: Cloudinary deletion typically requires server-side authentication
    // You may want to implement this on your backend
    // For now, we'll just track which images were removed
    console.log("Images to delete from Cloudinary:", publicIds);
  };

  const onSubmit = async (data: ProductFormData) => {
    if (!product) return;

    if (images.length === 0) {
      toast({
        title: "Images Required",
        description: "Please add at least one product image.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      setOverallProgress(0);

      // Upload all new images
      const uploadedImages = await uploadAllImages();

      // Delete removed images from Cloudinary (if implemented)
      if (imagesToDelete.length > 0) {
        await deleteImagesFromCloudinary(imagesToDelete);
      }

      // Find thumbnail URL
      const thumbnailImage =
        uploadedImages.find((img) => img.isThumbnail) || uploadedImages[0];

      // Update product in Firebase
      await updateProduct({
        id: product.id,
        data: {
          ...data,
          images: uploadedImages,
          thumbnailUrl: thumbnailImage?.url,
        },
      }).unwrap();

      toast({
        title: "Product Updated",
        description: `${data.name} has been updated successfully.`,
      });

      handleClose();
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    // Cleanup preview URLs for new images
    images.forEach((img) => {
      if (!img.isExisting && img.preview) {
        URL.revokeObjectURL(img.preview);
      }
    });
    setImages([]);
    setImagesToDelete([]);
    setOverallProgress(0);
    form.reset();
    onOpenChange(false);
  };

  // Get counts
  const existingCount = images.filter((img) => img.isExisting).length;
  const newCount = images.filter((img) => !img.isExisting).length;
  const deletedCount = imagesToDelete.length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Image Upload Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base">Product Images</FormLabel>
                <div className="flex gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{existingCount} existing</Badge>
                  {newCount > 0 && (
                    <Badge variant="secondary">{newCount} new</Badge>
                  )}
                  {deletedCount > 0 && (
                    <Badge variant="destructive">{deletedCount} removed</Badge>
                  )}
                </div>
              </div>

              {/* Upload Area */}
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="edit-image-upload"
                  disabled={isUploading}
                />
                <label
                  htmlFor="edit-image-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Add More Images</p>
                    <p className="text-sm text-muted-foreground">
                      Click to select additional images
                    </p>
                  </div>
                </label>
              </div>

              {/* Image Preview Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className={`relative group rounded-lg overflow-hidden border-2 ${
                        image.isThumbnail
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border"
                      }`}
                    >
                      {/* Image */}
                      <div className="aspect-square relative bg-muted">
                        <Image
                          src={image.isExisting ? image.url : image.preview}
                          alt={
                            image.isExisting && image.alt
                              ? image.alt
                              : "Product image"
                          }
                          fill
                          className="object-cover"
                        />

                        {/* Upload Progress Overlay for new images */}
                        {!image.isExisting &&
                          image.uploadStatus === "uploading" && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <div className="text-center text-white">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-1" />
                                <span className="text-sm">
                                  {image.uploadProgress}%
                                </span>
                              </div>
                            </div>
                          )}

                        {/* Success Overlay */}
                        {!image.isExisting &&
                          image.uploadStatus === "success" && (
                            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                              <Check className="h-8 w-8 text-green-500" />
                            </div>
                          )}

                        {/* Error Overlay */}
                        {!image.isExisting &&
                          image.uploadStatus === "error" && (
                            <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                              <AlertCircle className="h-8 w-8 text-red-500" />
                            </div>
                          )}
                      </div>

                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {image.isThumbnail && (
                          <Badge className="bg-primary text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Thumbnail
                          </Badge>
                        )}
                        {image.isExisting ? (
                          <Badge
                            variant="outline"
                            className="bg-background/80 text-xs"
                          >
                            Existing
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!image.isThumbnail && (
                          <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            className="h-7 w-7"
                            onClick={() => setThumbnail(image.id)}
                            disabled={isUploading}
                            title="Set as thumbnail"
                          >
                            <Star className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="h-7 w-7"
                          onClick={() => removeImage(image.id)}
                          disabled={isUploading}
                          title="Remove image"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Progress Bar for new images */}
                      {!image.isExisting &&
                        image.uploadStatus === "uploading" && (
                          <div className="absolute bottom-0 left-0 right-0">
                            <Progress
                              value={image.uploadProgress}
                              className="h-1 rounded-none"
                            />
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {images.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No images added yet</p>
                </div>
              )}

              <FormDescription>
                Click on an image to set it as thumbnail. Images marked as
                thumbnail will be used as the main product image.
              </FormDescription>
            </div>

            {/* Overall Upload Progress */}
            {isUploading && newCount > 0 && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading new images...
                  </span>
                  <span className="font-medium">{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="h-2" />
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter product name"
                        {...field}
                        disabled={isUploading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isUploading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter product description"
                      rows={4}
                      {...field}
                      disabled={isUploading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        disabled={isUploading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isUploading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem
                            key={currency.value}
                            value={currency.value}
                          >
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity in Stock</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                        disabled={isUploading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Product will be visible to customers
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isUploading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isFeatured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Featured</FormLabel>
                      <FormDescription>
                        Product will appear in featured section
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isUploading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
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
                disabled={isUploading || images.length === 0}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Update Product
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
