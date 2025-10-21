"use client";

import React, { useState } from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Plus, Edit, Trash2, Calendar, Tag, TrendingUp } from "lucide-react";
import { AddOfferModal } from "@/components/add-offer-modal";
import { EditOfferModal } from "@/components/edit-offer-modal";
import { AddBannerModal } from "@/components/add-banner-modal";
import { EditBannerModal } from "@/components/edit-banner-modal";
import { useToast } from "@/hooks/use-toast";
import {
  useGetOffersQuery,
  useDeleteOfferMutation,
  useGetBannersQuery,
  useDeleteBannerMutation,
  Offer,
  Banner,
} from "@/lib/redux/api/marketingApi";

export default function MarketingPage() {
  const { toast } = useToast();

  // Modal states
  const [isAddOfferModalOpen, setIsAddOfferModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [deletingOffer, setDeletingOffer] = useState<Offer | null>(null);

  const [isAddBannerModalOpen, setIsAddBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deletingBanner, setDeletingBanner] = useState<Banner | null>(null);

  // API hooks
  const {
    data: offers = [],
    isLoading: offersLoading,
    error: offersError,
    refetch: refetchOffers,
  } = useGetOffersQuery({});

  const {
    data: banners = [],
    isLoading: bannersLoading,
    error: bannersError,
    refetch: refetchBanners,
  } = useGetBannersQuery({});

  const [deleteOffer, { isLoading: isDeletingOffer }] =
    useDeleteOfferMutation();
  const [deleteBanner, { isLoading: isDeletingBanner }] =
    useDeleteBannerMutation();

  // Helper functions
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown date";

    let date: Date;
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Delete handlers
  const handleDeleteOffer = async () => {
    if (!deletingOffer) return;

    try {
      console.log("[Marketing Page] Deleting offer:", deletingOffer.id);
      await deleteOffer(deletingOffer.id).unwrap();

      toast({
        title: "Success",
        description: "Offer deleted successfully",
      });

      setDeletingOffer(null);
    } catch (error: any) {
      console.error("[Marketing Page] Error deleting offer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete offer",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBanner = async () => {
    if (!deletingBanner) return;

    try {
      console.log("[Marketing Page] Deleting banner:", deletingBanner.id);
      await deleteBanner(deletingBanner.id).unwrap();

      toast({
        title: "Success",
        description: "Banner deleted successfully",
      });

      setDeletingBanner(null);
    } catch (error: any) {
      console.error("[Marketing Page] Error deleting banner:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete banner",
        variant: "destructive",
      });
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <h2 className="text-lg font-semibold">Marketing</h2>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <PageHeader
            title="Marketing Tools"
            description="Manage promotions, banners, and featured content"
          />

          <Tabs defaultValue="offers" className="space-y-6">
            <TabsList>
              <TabsTrigger value="offers">Special Offers</TabsTrigger>
              <TabsTrigger value="banners">Banners</TabsTrigger>
              <TabsTrigger value="featured">Featured Content</TabsTrigger>
            </TabsList>

            {/* Special Offers Tab */}
            <TabsContent value="offers" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Special Offers & Discounts</CardTitle>
                      <CardDescription>
                        Create and manage promotional offers
                      </CardDescription>
                    </div>
                    <Button onClick={() => setIsAddOfferModalOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Offer
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {offersLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Card key={i}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-2">
                                <Skeleton className="h-6 w-64" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-48" />
                              </div>
                              <div className="flex gap-2">
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-8 w-16" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : offersError ? (
                    <div className="text-center py-12">
                      <p className="text-destructive">
                        Error loading offers:{" "}
                        {(offersError as any)?.message || "Unknown error"}
                      </p>
                      <Button onClick={() => refetchOffers()} className="mt-4">
                        Try Again
                      </Button>
                    </div>
                  ) : offers.length > 0 ? (
                    <div className="space-y-4">
                      {offers.map((offer) => (
                        <Card key={offer.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                  <h3 className="text-lg font-semibold">
                                    {offer.title}
                                  </h3>
                                  <Badge
                                    variant={
                                      offer.isActive ? "default" : "secondary"
                                    }
                                  >
                                    {offer.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="bg-accent/10 text-accent"
                                  >
                                    <Tag className="mr-1 h-3 w-3" />
                                    {offer.discount}
                                  </Badge>
                                  {offer.category && (
                                    <Badge variant="outline">
                                      {offer.category.charAt(0).toUpperCase() +
                                        offer.category.slice(1)}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {offer.description}
                                </p>
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                      {formatDate(offer.validFrom)} to{" "}
                                      {formatDate(offer.validTo)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                      {offer.redemptions || 0} redemptions
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingOffer(offer)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => setDeletingOffer(offer)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">
                        No offers yet. Create your first offer to get started.
                      </p>
                      <Button
                        onClick={() => setIsAddOfferModalOpen(true)}
                        className="mt-4"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Offer
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Banners Tab */}
            <TabsContent value="banners" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Marketing Banners</CardTitle>
                      <CardDescription>
                        Manage promotional banners for the app
                      </CardDescription>
                    </div>
                    <Button onClick={() => setIsAddBannerModalOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Banner
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {bannersLoading ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <Card key={i}>
                          <CardContent className="pt-6">
                            <div className="flex gap-4">
                              <Skeleton className="h-24 w-40 rounded-lg" />
                              <div className="flex-1 space-y-2">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-64" />
                              </div>
                              <div className="flex gap-2">
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-8 w-16" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : bannersError ? (
                    <div className="text-center py-12">
                      <p className="text-destructive">
                        Error loading banners:{" "}
                        {(bannersError as any)?.message || "Unknown error"}
                      </p>
                      <Button onClick={() => refetchBanners()} className="mt-4">
                        Try Again
                      </Button>
                    </div>
                  ) : banners.length > 0 ? (
                    <div className="space-y-4">
                      {banners.map((banner) => (
                        <Card key={banner.id}>
                          <CardContent className="pt-6">
                            <div className="flex gap-4">
                              <div className="h-24 w-40 overflow-hidden rounded-lg bg-muted">
                                <img
                                  src={banner.imageUrl || "/placeholder.svg"}
                                  alt={banner.title}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                  <h3 className="font-semibold">
                                    {banner.title}
                                  </h3>
                                  <Badge
                                    variant={
                                      banner.isActive ? "default" : "secondary"
                                    }
                                  >
                                    {banner.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Position: {banner.position}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Link: {banner.link}
                                </p>
                                {banner.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {banner.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingBanner(banner)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => setDeletingBanner(banner)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">
                        No banners yet. Add your first banner to get started.
                      </p>
                      <Button
                        onClick={() => setIsAddBannerModalOpen(true)}
                        className="mt-4"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Banner
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Featured Content Tab */}
            <TabsContent value="featured" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Featured Content</CardTitle>
                  <CardDescription>
                    Manage featured services and staff profiles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      Featured content management will be implemented when
                      services and staff APIs are available.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Add Offer Modal */}
          <AddOfferModal
            open={isAddOfferModalOpen}
            onOpenChange={setIsAddOfferModalOpen}
            onSubmit={() => {
              console.log("[Marketing Page] Offer added, refetching data");
            }}
          />

          {/* Edit Offer Modal */}
          <EditOfferModal
            open={!!editingOffer}
            onOpenChange={(open) => !open && setEditingOffer(null)}
            offer={editingOffer}
            onSubmit={() => {
              console.log("[Marketing Page] Offer edited, refetching data");
            }}
          />

          {/* Add Banner Modal */}
          <AddBannerModal
            open={isAddBannerModalOpen}
            onOpenChange={setIsAddBannerModalOpen}
            onSubmit={() => {
              console.log("[Marketing Page] Banner added, refetching data");
            }}
          />

          {/* Edit Banner Modal */}
          <EditBannerModal
            open={!!editingBanner}
            onOpenChange={(open) => !open && setEditingBanner(null)}
            banner={editingBanner}
            onSubmit={() => {
              console.log("[Marketing Page] Banner edited, refetching data");
            }}
          />

          {/* Delete Offer Confirmation Dialog */}
          <AlertDialog
            open={!!deletingOffer}
            onOpenChange={(open) => !open && setDeletingOffer(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Offer</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the offer "
                  {deletingOffer?.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeletingOffer}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteOffer}
                  disabled={isDeletingOffer}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeletingOffer ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete Banner Confirmation Dialog */}
          <AlertDialog
            open={!!deletingBanner}
            onOpenChange={(open) => !open && setDeletingBanner(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Banner</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the banner "
                  {deletingBanner?.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeletingBanner}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteBanner}
                  disabled={isDeletingBanner}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeletingBanner ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
