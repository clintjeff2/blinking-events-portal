"use client";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
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
  Edit,
  Trash2,
  Star,
  Package,
  Users,
  TrendingUp,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
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
import {
  useGetServiceByIdQuery,
  useDeleteServiceMutation,
} from "@/lib/redux/api/servicesApi";
import { EditServiceModal } from "@/components/edit-service-modal";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export default function ServiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    totalBookings: 0,
    revenue: 0,
    loading: true,
  });

  // Fetch service data
  const {
    data: service,
    isLoading,
    error,
    refetch,
  } = useGetServiceByIdQuery(params.id);
  const [deleteService] = useDeleteServiceMutation();

  // Calculate stats from orders
  useEffect(() => {
    const calculateStats = async () => {
      try {
        console.log(
          "[Service Detail] Calculating stats for service:",
          params.id
        );

        // Query all orders that include this service
        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, where("isActive", "!=", false));

        const snapshot = await getDocs(q);
        console.log("[Service Detail] Total orders found:", snapshot.size);

        let totalBookings = 0;
        let totalRevenue = 0;

        snapshot.forEach((doc) => {
          const orderData = doc.data();
          const servicesRequested = orderData.servicesRequested || [];

          // Check if this service is in the order
          const hasThisService = servicesRequested.some(
            (sr: any) => sr.serviceId === params.id
          );

          if (hasThisService) {
            totalBookings++;

            // Only count revenue from completed orders
            if (orderData.status === "completed" && orderData.quote?.total) {
              totalRevenue += orderData.quote.total;
            }
          }
        });

        console.log("[Service Detail] Stats calculated:", {
          totalBookings,
          totalRevenue,
        });

        setStats({
          totalBookings,
          revenue: totalRevenue,
          loading: false,
        });
      } catch (error: any) {
        console.error("[Service Detail] Error calculating stats:", error);
        setStats({ totalBookings: 0, revenue: 0, loading: false });
      }
    };

    if (params.id) {
      calculateStats();
    }
  }, [params.id]);

  const handleDelete = async () => {
    try {
      await deleteService(params.id).unwrap();
      toast({
        title: "Service deleted",
        description: "The service has been deleted successfully",
      });
      router.push("/services");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete service",
        variant: "destructive",
      });
    }
  };

  const handleEditSuccess = () => {
    refetch();
    toast({
      title: "Success",
      description: "Service updated successfully",
    });
  };

  // Loading state
  if (isLoading || !service) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Skeleton className="h-6 w-40" />
          </header>
          <div className="flex flex-1 flex-col gap-6 p-6">
            <Skeleton className="h-10 w-full" />
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Error state
  if (error) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-1 items-center justify-center p-6">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">
                  Failed to load service details
                </p>
                <Button onClick={() => router.push("/services")}>
                  Back to Services
                </Button>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/services")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold">Service Details</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditModal(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{service.name}</h1>
                {service.featured && (
                  <Badge
                    variant="secondary"
                    className="bg-accent/10 text-accent"
                  >
                    <Star className="mr-1 h-3 w-3 fill-current" />
                    Featured
                  </Badge>
                )}
                <Badge variant={service.isActive ? "default" : "secondary"}>
                  {service.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="mt-2">
                <Badge variant="outline">{service.category}</Badge>
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Bookings
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {stats.loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">
                    {stats.totalBookings}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Events using this service
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Revenue Generated
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {stats.loading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <div className="text-2xl font-bold">
                    {stats.revenue.toLocaleString()}{" "}
                    {service.priceRange.currency}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  From completed orders
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Available Packages
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {service.packages?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Service packages
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="packages">Packages</TabsTrigger>
              {service.staffProfiles && service.staffProfiles.length > 0 && (
                <TabsTrigger value="staff">Staff</TabsTrigger>
              )}
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Service Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pricing Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Price Range</span>
                      <span className="text-lg font-semibold">
                        {service.priceRange.min.toLocaleString()} -{" "}
                        {service.priceRange.max.toLocaleString()}{" "}
                        {service.priceRange.currency}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Available Packages
                      </span>
                      <span className="font-medium">
                        {service.packages?.length || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Currency</span>
                      <Badge variant="outline">
                        {service.priceRange.currency}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="packages" className="space-y-6">
              {service.packages && service.packages.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {service.packages.map((pkg, index) => (
                    <Card key={index} className="relative">
                      <CardHeader>
                        <CardTitle>{pkg.name}</CardTitle>
                        <CardDescription>{pkg.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-3xl font-bold">
                            {pkg.price.toLocaleString()}{" "}
                            {service.priceRange.currency}
                          </p>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Features:</p>
                          <ul className="space-y-2">
                            {pkg.features.map((feature, fIndex) => (
                              <li
                                key={fIndex}
                                className="flex items-start gap-2 text-sm text-muted-foreground"
                              >
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No packages available
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {service.staffProfiles && service.staffProfiles.length > 0 && (
              <TabsContent value="staff" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Assigned Staff</CardTitle>
                    <CardDescription>
                      Staff members who can deliver this service
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {service.staffProfiles.map((staffId, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                Staff Member {index + 1}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                ID: {staffId}
                              </p>
                            </div>
                          </div>
                          <Link href={`/staff/${staffId}`}>
                            <Button variant="outline" size="sm">
                              View Profile
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="gallery" className="space-y-6">
              {service.images && service.images.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {service.images.map((image, index) => (
                    <Card
                      key={index}
                      className="overflow-hidden group relative"
                    >
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`Service ${index + 1}`}
                        className="h-64 w-full object-cover"
                      />
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No images available</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>

      <EditServiceModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSubmit={handleEditSuccess}
        service={service}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{service.name}"? This will make
              it inactive but data will be preserved. This action affects{" "}
              {stats.totalBookings} bookings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Service
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
