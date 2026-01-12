"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowLeft,
  Save,
  Upload,
  Loader2,
  ImageIcon,
  Star,
  Trash2,
  Plus,
  Package,
  DollarSign,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  MoreVertical,
} from "lucide-react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  useGetProductQuery,
  useUpdateProductMutation,
  useDeleteProductMutation,
  PRODUCT_CATEGORIES,
} from "@/lib/redux/api/shopApi";
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

// Currency options
const CURRENCIES = [
  { value: "XAF", label: "XAF (CFA Franc)" },
  { value: "FCFA", label: "FCFA" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
];

// Interface for existing images from database
interface ExistingImage {
  id: string;
  url: string;
  publicId: string;
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
  publicId: string;
  alt?: string;
  isThumbnail?: boolean;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const productId = params.productId as string;

  // Fetch product
  const {
    data: product,
    isLoading,
    error,
  } = useGetProductQuery(productId, {
    skip: !productId,
  });

  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

  // State
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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

  // Initialize form and images when product loads
  useEffect(() => {
    if (product) {
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
          id: `existing-${index}-${img.publicId || index}`,
          url: img.url,
          publicId: img.publicId || "",
          alt: img.alt,
          isThumbnail: img.isThumbnail || img.url === product.thumbnailUrl,
          isExisting: true as const,
        })
      );

      setImages(existingImages);
      setImagesToDelete([]);
      setOverallProgress(0);
      setHasChanges(false);
    }
  }, [product, form]);

  // Track form changes
  useEffect(() => {
    const subscription = form.watch(() => setHasChanges(true));
    return () => subscription.unsubscribe();
  }, [form]);

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
      setHasChanges(true);

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
      if (imageToRemove?.isExisting) {
        setImagesToDelete((current) => [...current, imageToRemove.publicId]);
      } else if (imageToRemove && !imageToRemove.isExisting) {
        URL.revokeObjectURL(imageToRemove.preview);
      }

      const filtered = prev.filter((img) => img.id !== imageId);

      // If removed image was thumbnail, set first remaining as thumbnail
      if (imageToRemove?.isThumbnail && filtered.length > 0) {
        filtered[0].isThumbnail = true;
      }

      return filtered;
    });
    setHasChanges(true);
  }, []);

  // Set thumbnail
  const setThumbnail = useCallback((imageId: string) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isThumbnail: img.id === imageId,
      }))
    );
    setHasChanges(true);
  }, []);

  // Upload all new images
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
      return uploadResults;
    }

    // Mark new images as uploading
    setImages((prev) =>
      prev.map((img) =>
        !img.isExisting ? { ...img, uploadStatus: "uploading" as const } : img
      )
    );

    // Upload new images
    const files = newImages.map((img) => img.file);
    const cloudinaryResults = await uploadMultipleFilesClient(
      files,
      "blinking-events/shop/products",
      (progress) => {
        setOverallProgress(progress);
      }
    );

    // Add uploaded images to results
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

  // Handle form submit
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

      setHasChanges(false);
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

  // Handle delete
  const handleDeleteConfirm = async () => {
    if (!product) return;

    try {
      await deleteProduct(product.id).unwrap();
      toast({
        title: "Product Deleted",
        description: `${product.name} has been removed from the shop.`,
      });
      router.push("/shop");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Format currency for display
  const formatPrice = (price: number, currency: string) => {
    return `${price.toLocaleString()} ${currency}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Skeleton className="h-4 w-48" />
          </header>
          <main className="flex-1 p-6">
            <div className="space-y-6">
              <Skeleton className="h-10 w-64" />
              <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-[400px]" />
                <Skeleton className="h-[400px]" />
              </div>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Button variant="ghost" onClick={() => router.push("/shop")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Shop
            </Button>
          </header>
          <main className="flex-1 p-6">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">
                  Product Not Found
                </h2>
                <p className="text-muted-foreground mb-4">
                  The product you're looking for doesn't exist or has been
                  removed.
                </p>
                <Button onClick={() => router.push("/shop")}>Go to Shop</Button>
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/shop">Shop</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{product.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-2">
            {hasChanges && (
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-800"
              >
                Unsaved Changes
              </Badge>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button
              size="sm"
              onClick={form.handleSubmit(onSubmit)}
              disabled={isUploading || isUpdating}
            >
              {isUploading || isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Left Column - Images */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Product Images
                    </CardTitle>
                    <CardDescription>
                      Upload and manage product images. Click the star to set
                      the thumbnail.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Upload Progress */}
                    {isUploading && (
                      <div className="mb-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Uploading images...</span>
                          <span>{Math.round(overallProgress)}%</span>
                        </div>
                        <Progress value={overallProgress} />
                      </div>
                    )}

                    {/* Image Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {images.map((image) => (
                        <div
                          key={image.id}
                          className="relative aspect-square group"
                        >
                          <Image
                            src={image.isExisting ? image.url : image.preview}
                            alt={
                              image.isExisting
                                ? image.alt || "Product"
                                : "Preview"
                            }
                            fill
                            className="object-cover rounded-lg border"
                          />

                          {/* Thumbnail indicator */}
                          {image.isThumbnail && (
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-amber-500">
                                <Star className="h-3 w-3 mr-1" />
                                Thumbnail
                              </Badge>
                            </div>
                          )}

                          {/* Upload status for new images */}
                          {!image.isExisting && (
                            <div className="absolute top-2 right-2">
                              {image.uploadStatus === "pending" && (
                                <Badge variant="secondary">New</Badge>
                              )}
                              {image.uploadStatus === "uploading" && (
                                <Badge variant="secondary">
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                  Uploading
                                </Badge>
                              )}
                              {image.uploadStatus === "success" && (
                                <Badge className="bg-green-500">
                                  <Check className="h-3 w-3 mr-1" />
                                  Uploaded
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Hover Actions */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                            {!image.isThumbnail && (
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => setThumbnail(image.id)}
                              >
                                <Star className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeImage(image.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {/* Add Image Button */}
                      <label className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleFileSelect}
                          disabled={isUploading}
                        />
                        <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-xs text-muted-foreground">
                          Add Image
                        </span>
                      </label>
                    </div>

                    {images.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No images added yet. Click the button above to add
                        product images.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Right Column - Product Info */}
                <div className="space-y-6">
                  {/* Basic Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Product Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter product description"
                                className="min-h-[100px]"
                                {...field}
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
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
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
                    </CardContent>
                  </Card>

                  {/* Pricing & Inventory */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Pricing & Inventory
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  {...field}
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
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Currency" />
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
                      </div>

                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock Quantity</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} />
                            </FormControl>
                            <FormDescription>
                              {field.value <= 5 && field.value > 0 && (
                                <span className="text-amber-600">
                                  ⚠️ Low stock warning
                                </span>
                              )}
                              {field.value === 0 && (
                                <span className="text-red-600">
                                  ⚠️ Out of stock
                                </span>
                              )}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Status & Visibility */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Status & Visibility
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Product Active
                              </FormLabel>
                              <FormDescription>
                                Active products are visible in the shop
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isFeatured"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base flex items-center gap-2">
                                <Star className="h-4 w-4 text-amber-500" />
                                Featured Product
                              </FormLabel>
                              <FormDescription>
                                Featured products appear prominently
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </form>
          </Form>
        </main>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Product?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{product.name}"? This action
                cannot be undone and will remove the product from the shop.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
