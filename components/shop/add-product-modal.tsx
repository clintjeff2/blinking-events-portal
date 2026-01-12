"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  X,
  Loader2,
  ImagePlus,
  Star,
  Check,
  Upload,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateProductMutation,
  PRODUCT_CATEGORIES,
} from "@/lib/redux/api/shopApi";
import {
  uploadMultipleFilesClient,
  UploadResult,
} from "@/lib/cloudinary/upload";
import { cn } from "@/lib/utils";
import { notifyNewProduct } from "@/lib/utils/admin-notifications";

const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  currency: z.string().default("XAF"),
  quantity: z.coerce
    .number()
    .int()
    .min(0, "Quantity must be a non-negative integer"),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

// Available currencies
const CURRENCIES = [
  { value: "XAF", label: "XAF (FCFA)", symbol: "FCFA" },
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "EUR", label: "EUR (€)", symbol: "€" },
  { value: "GBP", label: "GBP (£)", symbol: "£" },
];

type ProductFormValues = z.infer<typeof productSchema>;

// Local preview image with file reference
interface LocalImage {
  id: string;
  file: File;
  previewUrl: string;
  isUploaded: boolean;
  uploadedData?: UploadResult;
  uploadProgress: number;
  uploadError?: string;
}

interface AddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddProductModal({
  open,
  onOpenChange,
}: AddProductModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local images (preview before upload)
  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  const [thumbnailId, setThumbnailId] = useState<string | null>(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState<
    "idle" | "uploading" | "saving" | "complete"
  >("idle");

  const [createProduct, { isLoading }] = useCreateProductMutation();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
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

  // Generate unique ID for local images
  const generateId = () =>
    `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Handle file selection (local preview only)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: LocalImage[] = Array.from(files).map((file) => ({
      id: generateId(),
      file,
      previewUrl: URL.createObjectURL(file),
      isUploaded: false,
      uploadProgress: 0,
    }));

    setLocalImages((prev) => {
      const updated = [...prev, ...newImages];
      // Auto-select first image as thumbnail if none selected
      if (!thumbnailId && updated.length > 0) {
        setThumbnailId(updated[0].id);
      }
      return updated;
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Remove a local image
  const removeImage = (id: string) => {
    setLocalImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }
      const filtered = prev.filter((img) => img.id !== id);

      // Update thumbnail if removed image was thumbnail
      if (thumbnailId === id && filtered.length > 0) {
        setThumbnailId(filtered[0].id);
      } else if (filtered.length === 0) {
        setThumbnailId(null);
      }

      return filtered;
    });
  };

  // Set an image as thumbnail
  const setAsThumbnail = (id: string) => {
    setThumbnailId(id);
  };

  // Form submission
  const onSubmit = async (values: ProductFormValues) => {
    console.log("[AddProduct] Form submitted with values:", values);

    if (localImages.length === 0) {
      toast({
        title: "Images required",
        description: "Please add at least one product image.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadPhase("uploading");
    setOverallProgress(0);

    try {
      // Reorder images so thumbnail is first
      const orderedImages = [...localImages].sort((a, b) => {
        if (a.id === thumbnailId) return -1;
        if (b.id === thumbnailId) return 1;
        return 0;
      });

      const files = orderedImages.map((img) => img.file);

      console.log(
        "[AddProduct] Uploading",
        files.length,
        "images to Cloudinary..."
      );

      // Upload images to Cloudinary using the utility function
      const uploadResults = await uploadMultipleFilesClient(
        files,
        "blinking-events/shop/products",
        (progress) => {
          setOverallProgress(progress);
        }
      );

      console.log("[AddProduct] Images uploaded successfully:", uploadResults);

      // Convert upload results to product images format
      const productImages = uploadResults.map((result, index) => ({
        url: result.url,
        publicId: result.publicId,
        alt: orderedImages[index].file.name.replace(/\.[^/.]+$/, ""),
        isThumbnail: index === 0, // First image (thumbnail) is marked
      }));

      // Mark all images as uploaded in UI
      setLocalImages((prev) =>
        prev.map((img) => ({ ...img, isUploaded: true, uploadProgress: 100 }))
      );

      // Phase 2: Save product to Firebase
      setUploadPhase("saving");
      setOverallProgress(100);

      console.log("[AddProduct] Creating product in Firebase...");

      const result = await createProduct({
        ...values,
        images: productImages,
        thumbnailUrl: productImages[0]?.url,
      }).unwrap();

      console.log("[AddProduct] Product created successfully:", result);

      // Send notification to all users about the new product
      try {
        console.log("[AddProduct] Sending notifications...");
        await notifyNewProduct({
          name: values.name,
          category: values.category,
          price: values.price,
          currency: values.currency,
          productId: result.id,
        });
        console.log("[AddProduct] Notifications sent successfully");
      } catch (notifyError) {
        console.error(
          "[AddProduct] Failed to send notifications:",
          notifyError
        );
        // Don't fail the whole operation if notifications fail
      }

      setUploadPhase("complete");

      toast({
        title: "Product created",
        description: `${values.name} has been added to the shop.`,
      });

      // Cleanup and close
      handleClose();
    } catch (error: any) {
      console.error("[AddProduct] Error:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to create product. Please try again.",
        variant: "destructive",
      });
      setUploadPhase("idle");
    } finally {
      setIsUploading(false);
    }
  };

  // Cleanup on close
  const handleClose = () => {
    // Revoke all object URLs
    localImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));

    // Reset state
    setLocalImages([]);
    setThumbnailId(null);
    setOverallProgress(0);
    setUploadPhase("idle");
    form.reset();
    onOpenChange(false);
  };

  // Drag and drop support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const imageFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/")
      );

      if (imageFiles.length > 0) {
        const newImages: LocalImage[] = imageFiles.map((file) => ({
          id: generateId(),
          file,
          previewUrl: URL.createObjectURL(file),
          isUploaded: false,
          uploadProgress: 0,
        }));

        setLocalImages((prev) => {
          const updated = [...prev, ...newImages];
          if (!thumbnailId && updated.length > 0) {
            setThumbnailId(updated[0].id);
          }
          return updated;
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Add a new product to your shop inventory
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Image Upload Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base">Product Images</FormLabel>
                {localImages.length > 0 && (
                  <Badge variant="secondary">
                    {localImages.length} image
                    {localImages.length !== 1 ? "s" : ""} selected
                  </Badge>
                )}
              </div>

              {/* Upload Progress Bar */}
              {isUploading && (
                <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {uploadPhase === "uploading"
                        ? "Uploading images to cloud..."
                        : uploadPhase === "saving"
                        ? "Saving product..."
                        : "Complete!"}
                    </span>
                    <span className="text-muted-foreground">
                      {overallProgress}%
                    </span>
                  </div>
                  <Progress value={overallProgress} className="h-2" />
                </div>
              )}

              {/* Image Grid */}
              <div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {localImages.map((image) => (
                  <div
                    key={image.id}
                    className={cn(
                      "relative aspect-square rounded-lg overflow-hidden border-2 group",
                      thumbnailId === image.id
                        ? "border-primary ring-2 ring-primary ring-offset-2"
                        : "border-border",
                      image.uploadError && "border-destructive"
                    )}
                  >
                    {/* Image Preview */}
                    <img
                      src={image.previewUrl}
                      alt={image.file.name}
                      className="h-full w-full object-cover"
                    />

                    {/* Thumbnail Badge */}
                    {thumbnailId === image.id && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-primary text-primary-foreground text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Thumbnail
                        </Badge>
                      </div>
                    )}

                    {/* Upload Progress Overlay */}
                    {isUploading && !image.isUploaded && !image.uploadError && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                        <Loader2 className="h-6 w-6 animate-spin mb-2" />
                        <span className="text-sm font-medium">
                          {image.uploadProgress}%
                        </span>
                      </div>
                    )}

                    {/* Upload Success Overlay */}
                    {image.isUploaded && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                        <div className="bg-green-500 rounded-full p-1">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Upload Error Overlay */}
                    {image.uploadError && (
                      <div className="absolute inset-0 bg-destructive/20 flex flex-col items-center justify-center text-destructive">
                        <AlertCircle className="h-6 w-6 mb-1" />
                        <span className="text-xs text-center px-2">Failed</span>
                      </div>
                    )}

                    {/* Action Buttons (visible on hover when not uploading) */}
                    {!isUploading && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        {thumbnailId !== image.id && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-8"
                            onClick={() => setAsThumbnail(image.id)}
                          >
                            <Star className="h-3 w-3 mr-1" />
                            Set Thumbnail
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Remove Button */}
                    {!isUploading && (
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="absolute top-1 right-1 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}

                {/* Add More Images Button */}
                {!isUploading && (
                  <label className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors">
                    <ImagePlus className="h-8 w-8 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-2">
                      Add Images
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <FormDescription>
                Select images for your product. Click on an image to set it as
                the thumbnail. Drag and drop is supported.
              </FormDescription>
            </div>

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., White Wedding Dress"
                      {...field}
                      disabled={isUploading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the product in detail..."
                      className="min-h-[100px]"
                      {...field}
                      disabled={isUploading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isUploading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRODUCT_CATEGORIES.map((category) => (
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

            {/* Price, Currency and Quantity */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
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
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
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
                    <FormLabel>Stock Quantity</FormLabel>
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

            {/* Toggles */}
            <div className="flex gap-6">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isUploading}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Active</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isFeatured"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isUploading}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Featured</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uploadPhase === "uploading"
                      ? `Uploading ${overallProgress}%`
                      : "Saving..."}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Create Product
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
