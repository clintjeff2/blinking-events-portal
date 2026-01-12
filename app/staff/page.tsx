"use client";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Star,
  Calendar,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AddStaffModal } from "@/components/add-staff-modal";
import { EditStaffModal } from "@/components/edit-staff-modal";
import {
  useGetStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  type StaffProfile,
  type CreateStaffInput,
} from "@/lib/redux/api/staffApi";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { notifyNewStaff } from "@/lib/utils/admin-notifications";

export default function StaffPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // RTK Query hooks
  const { data: staff = [], isLoading, error } = useGetStaffQuery({});
  const [createStaff, { isLoading: isCreating }] = useCreateStaffMutation();
  const [updateStaff, { isLoading: isUpdating }] = useUpdateStaffMutation();
  const [deleteStaff, { isLoading: isDeleting }] = useDeleteStaffMutation();

  const handleAddStaff = async (data: CreateStaffInput) => {
    try {
      const result = await createStaff(data).unwrap();

      // Send notification to all mobile app users
      try {
        await notifyNewStaff({
          fullName: data.fullName,
          categories: data.categories,
          staffProfileId: result?.id || result?.staffProfileId || "",
        });
        console.log("[StaffPage] Notification sent to all users");
      } catch (notifyError) {
        console.error("[StaffPage] Failed to send notification:", notifyError);
      }

      toast.success("Staff member added successfully!");
      setShowAddModal(false);
    } catch (error: any) {
      toast.error(error?.error || "Failed to add staff member");
      console.error("Error adding staff:", error);
    }
  };

  const handleEditStaff = async (data: any) => {
    if (!selectedStaff) return;

    try {
      await updateStaff({
        id: selectedStaff.id,
        data,
      }).unwrap();
      toast.success("Staff member updated successfully!");
      setShowEditModal(false);
      setSelectedStaff(null);
    } catch (error: any) {
      toast.error(error?.error || "Failed to update staff member");
      console.error("Error updating staff:", error);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this staff member?"))
      return;

    try {
      await deleteStaff(id).unwrap();
      toast.success("Staff member deactivated successfully!");
    } catch (error: any) {
      toast.error(error?.error || "Failed to deactivate staff member");
      console.error("Error deleting staff:", error);
    }
  };

  const handleEditClick = (staffMember: StaffProfile) => {
    setSelectedStaff(staffMember);
    setShowEditModal(true);
  };

  // Filter staff based on search and category
  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.skills.some((skill) =>
        skill.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      member.categories.some((cat) =>
        cat.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      categoryFilter === "All" || member.categories.includes(categoryFilter);

    return matchesSearch && matchesCategory;
  });

  const categories = [
    "All",
    "Hostess",
    "MC",
    "Security",
    "Photographer",
    "Videographer",
    "Protocol Officer",
    "DJ",
    "Decorator",
    "Caterer",
  ];

  // Calculate availability status
  const getAvailabilityStatus = (availability: any[]): string => {
    if (!availability || availability.length === 0) return "Available";
    return "Booked";
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <h2 className="text-lg font-semibold">Staff Profiles</h2>
            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
              disabled={isCreating}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Staff Member
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <PageHeader
            title="Staff Management"
            description="Manage your team members, their profiles, and availability"
          />

          {/* Error Alert */}
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex flex-col gap-2">
                <p className="font-semibold">Failed to load staff</p>
                <p className="text-sm">
                  {(error as any)?.error ||
                    "Please check your Firebase configuration and try again."}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="w-fit"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1 md:max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search staff..."
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
                        categoryFilter === category ? "default" : "outline"
                      }
                      size="sm"
                      className="bg-transparent"
                      onClick={() => setCategoryFilter(category)}
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
            <div className="flex justify-center items-center py-12">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredStaff.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No staff members found</p>
                <Button className="mt-4" onClick={() => setShowAddModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Staff Member
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Staff Grid */}
          {!isLoading && filteredStaff.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredStaff.map((member) => (
                <Card key={member.id} className="relative overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={member.photoUrl || "/placeholder.svg"}
                          alt={member.fullName}
                        />
                        <AvatarFallback>
                          {member.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {member.fullName}
                            </CardTitle>
                            <div className="mt-1 flex items-center gap-1">
                              <Star className="h-4 w-4 fill-accent text-accent" />
                              <span className="text-sm font-medium">
                                {member.rating.toFixed(1)}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                ({member.reviews.length})
                              </span>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/staff/${member.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Profile
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEditClick(member)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Calendar className="mr-2 h-4 w-4" />
                                Manage Availability
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteStaff(member.id)}
                                disabled={isDeleting}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Deactivate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-1">
                      {member.categories.map((category) => (
                        <Badge
                          key={category}
                          variant="outline"
                          className="text-xs"
                        >
                          {category}
                        </Badge>
                      ))}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Skills</p>
                      <p className="text-sm">
                        {member.skills.slice(0, 2).join(", ")}
                        {member.skills.length > 2 ? "..." : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Languages</p>
                      <p className="text-sm">{member.languages.join(", ")}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {member.portfolio.length} events
                      </span>
                      <Badge
                        variant={
                          getAvailabilityStatus(member.availability) ===
                          "Available"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {getAvailabilityStatus(member.availability)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={member.isActive ? "default" : "secondary"}
                      >
                        {member.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Link href={`/staff/${member.id}`}>
                        <Button variant="outline" size="sm">
                          View Profile
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SidebarInset>

      {/* Modals */}
      <AddStaffModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSubmit={handleAddStaff}
      />
      {selectedStaff && (
        <EditStaffModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          onSubmit={handleEditStaff}
          staff={selectedStaff}
        />
      )}
    </SidebarProvider>
  );
}
