"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  Star,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShopProduct } from "@/lib/redux/api/shopApi";

interface ProductDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ShopProduct;
}

export default function ProductDetailModal({
  open,
  onOpenChange,
  product,
}: ProductDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "XAF",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const nextImage = () => {
    if (product.images && product.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product.images && product.images.length > 0) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + product.images.length) % product.images.length
      );
    }
  };

  const getStockStatus = () => {
    if (product.quantity === 0) {
      return { label: "Out of Stock", variant: "destructive" as const };
    }
    if (product.quantity <= 5) {
      return { label: "Low Stock", variant: "destructive" as const };
    }
    return { label: "In Stock", variant: "default" as const };
  };

  const stockStatus = getStockStatus();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {product.name}
            {product.isFeatured && (
              <Badge className="bg-yellow-500 hover:bg-yellow-600">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              {product.images && product.images.length > 0 ? (
                <>
                  <img
                    src={product.images[currentImageIndex].url}
                    alt={product.images[currentImageIndex].alt || product.name}
                    className="h-full w-full object-cover"
                  />
                  {product.images.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {product.images.map((_, index) => (
                          <button
                            key={index}
                            className={`h-2 w-2 rounded-full transition-colors ${
                              index === currentImageIndex
                                ? "bg-primary"
                                : "bg-primary/30"
                            }`}
                            onClick={() => setCurrentImageIndex(index)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Package className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                      index === currentImageIndex
                        ? "border-primary"
                        : "border-transparent"
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img
                      src={image.url}
                      alt={image.alt || `Thumbnail ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            {/* Price */}
            <div>
              <p className="text-3xl font-bold">
                {formatCurrency(product.price)}
              </p>
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{product.category}</Badge>
              <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
              {product.isActive ? (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Visible
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <EyeOff className="h-3 w-3" />
                  Hidden
                </Badge>
              )}
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {product.description}
              </p>
            </div>

            <Separator />

            {/* Stock Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Stock Quantity</p>
                <p className="text-lg font-semibold">
                  {product.quantity} units
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(product.price * product.quantity)}
                </p>
              </div>
            </div>

            <Separator />

            {/* Timestamps */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(product.createdAt)}</span>
              </div>
              {product.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{formatDate(product.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
