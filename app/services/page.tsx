"use client";

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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Edit, Trash2, Eye, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AddServiceModal } from "@/components/add-service-modal";
import {
  useGetServicesQuery,
  useDeleteServiceMutation,
  useUpdateServiceMutation,
} from "@/lib/redux/api/servicesApi";
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

export default function ServicesPage() {
  const { toast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

  // Fetch services
  const {
    data: services = [],
    isLoading,
    error,
    refetch,
  } = useGetServicesQuery({});
  const [deleteService] = useDeleteServiceMutation();
  const [updateService] = useUpdateServiceMutation();

  // Debug logging
  console.log("[Services Page] ========== SERVICES DATA ==========");
  console.log("[Services Page] Loading state:", isLoading);
  console.log("[Services Page] Error:", error);
  console.log("[Services Page] Raw services data:", services);
  console.log("[Services Page] Services count:", services?.length || 0);
  console.log(
    "[Services Page] Services array:",
    JSON.stringify(services, null, 2)
  );

  const handleDeleteClick = (serviceId: string) => {
    setServiceToDelete(serviceId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return;

    try {
      await deleteService(serviceToDelete).unwrap();
      toast({
        title: "Service deleted",
        description: "The service has been deleted successfully",
      });
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete service",
        variant: "destructive",
      });
    }
  };

  const handleToggleFeatured = async (
    serviceId: string,
    currentFeatured: boolean
  ) => {
    try {
      await updateService({
        id: serviceId,
        data: { featured: !currentFeatured },
      }).unwrap();
      toast({
        title: "Success",
        description: `Service ${
          !currentFeatured ? "added to" : "removed from"
        } featured`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update service",
        variant: "destructive",
      });
    }
  };

  // Filter services
  const filteredServices = services.filter((service) => {
    const matchesCategory =
      selectedCategory === "All" ||
      service.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  console.log("[Services Page] ========== FILTERING ==========");
  console.log("[Services Page] Selected category:", selectedCategory);
  console.log("[Services Page] Search query:", searchQuery);
  console.log(
    "[Services Page] Filtered services count:",
    filteredServices.length
  );
  console.log("[Services Page] Filtered services:", filteredServices);

  const categories = [
    "All",
    "Wedding",
    "Corporate",
    "Cultural",
    "Birthday",
    "Social",
  ];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <h2 className="text-lg font-semibold">Services</h2>
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <PageHeader
            title="Service Management"
            description="Manage your event services, packages, and pricing"
          />

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1 md:max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search services..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={
                        category === selectedCategory ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {isLoading && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-20 mt-2" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredServices.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">
                  {searchQuery || selectedCategory !== "All"
                    ? "No services found matching your criteria"
                    : "No services yet. Create your first service!"}
                </p>
                {!searchQuery && selectedCategory === "All" && (
                  <Button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Service
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Services Grid */}
          {!isLoading && filteredServices.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredServices.map((service) => (
                <Card key={service.id} className="relative overflow-hidden">
                  {service.featured && (
                    <div className="absolute right-4 top-4 z-10">
                      <Badge
                        variant="secondary"
                        className="bg-accent/10 text-accent"
                      >
                        <Star className="mr-1 h-3 w-3 fill-current" />
                        Featured
                      </Badge>
                    </div>
                  )}

                  {/* Service Image */}
                  {service.images && service.images.length > 0 && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={service.images[0]}
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <CardDescription className="mt-1">
                      <Badge variant="outline" className="mt-2">
                        {service.category}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {service.description}
                    </p>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Price Range
                      </p>
                      <p className="text-lg font-semibold">
                        {service.priceRange.min.toLocaleString()} -{" "}
                        {service.priceRange.max.toLocaleString()}{" "}
                        {service.priceRange.currency}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {service.packages?.length || 0} packages
                      </span>
                      <Badge
                        variant={service.isActive ? "default" : "secondary"}
                      >
                        {service.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        asChild
                      >
                        <Link href={`/services/${service.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          handleToggleFeatured(service.id, service.featured)
                        }
                      >
                        <Star
                          className={`h-4 w-4 ${
                            service.featured ? "fill-current" : ""
                          }`}
                        />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteClick(service.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SidebarInset>

      <AddServiceModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSubmit={() => refetch()}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this service? This will make it
              inactive but data will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
