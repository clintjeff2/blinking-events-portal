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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUpdateEventMutation, Event } from "@/lib/redux/api/eventsApi";
import { useGetServicesQuery } from "@/lib/redux/api/servicesApi";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface StaffProfile {
  id: string;
  fullName: string;
  categories: string[];
}

interface EditEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  event: Event | null;
}

export function EditEventModal({
  open,
  onOpenChange,
  onSubmit,
  event,
}: EditEventModalProps) {
  const { toast } = useToast();
  const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();
  const { data: services = [], isLoading: servicesLoading } =
    useGetServicesQuery({});

  const [staffProfiles, setStaffProfiles] = useState<StaffProfile[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    date: undefined as Date | undefined,
    venue: "",
    category: "",
    description: "",
    servicesUsed: [] as string[],
    staffInvolved: [] as string[],
    isPublished: true,
  });

  // Load staff profiles
  useEffect(() => {
    const loadStaff = async () => {
      try {
        console.log("[Edit Event Modal] Loading staff profiles...");
        const staffRef = collection(db, "staffProfiles");
        const snapshot = await getDocs(staffRef);
        const staff = snapshot.docs
          .filter((doc) => doc.data().isActive !== false)
          .map((doc) => ({
            id: doc.id,
            fullName: doc.data().fullName || "Unnamed Staff",
            categories: doc.data().categories || [],
          })) as StaffProfile[];
        console.log("[Edit Event Modal] Staff profiles loaded:", staff.length);
        setStaffProfiles(staff);
      } catch (error: any) {
        console.error("[Edit Event Modal] Error loading staff:", error);
        toast({
          title: "Error",
          description: "Failed to load staff profiles",
          variant: "destructive",
        });
      } finally {
        setLoadingStaff(false);
      }
    };

    if (open) {
      loadStaff();
    }
  }, [open, toast]);

  // Populate form data when event changes
  useEffect(() => {
    if (event) {
      console.log("[Edit Event Modal] Populating form with event:", event);
      setFormData({
        name: event.name,
        date: event.date ? new Date(event.date) : undefined,
        venue: event.venue,
        category: event.category,
        description: event.description,
        servicesUsed: event.servicesUsed || [],
        staffInvolved: event.staffInvolved || [],
        isPublished: event.isPublished,
      });
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!event) {
      toast({
        title: "Error",
        description: "No event to update",
        variant: "destructive",
      });
      return;
    }

    // Validation
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Event name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.category) {
      toast({
        title: "Validation Error",
        description: "Category is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.date) {
      toast({
        title: "Validation Error",
        description: "Event date is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.venue.trim()) {
      toast({
        title: "Validation Error",
        description: "Venue is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Description is required",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("[Edit Event Modal] Updating event:", event.id, formData);

      // Prepare update data
      const updateData = {
        name: formData.name.trim(),
        date: formData.date.toISOString(),
        venue: formData.venue.trim(),
        category: formData.category,
        description: formData.description.trim(),
        servicesUsed: formData.servicesUsed,
        staffInvolved: formData.staffInvolved,
        isPublished: formData.isPublished,
        // Keep existing testimonials
        testimonials: event.testimonials,
      };

      await updateEvent({ id: event.id, data: updateData }).unwrap();

      console.log("[Edit Event Modal] Event updated successfully");
      toast({
        title: "Success",
        description: "Event updated successfully",
      });

      onSubmit(); // Trigger refetch in parent
      onOpenChange(false);
    } catch (error: any) {
      console.error("[Edit Event Modal] Error updating event:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update event",
        variant: "destructive",
      });
    }
  };

  const toggleService = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      servicesUsed: prev.servicesUsed.includes(serviceId)
        ? prev.servicesUsed.filter((id) => id !== serviceId)
        : [...prev.servicesUsed, serviceId],
    }));
  };

  const removeService = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      servicesUsed: prev.servicesUsed.filter((id) => id !== serviceId),
    }));
  };

  const toggleStaff = (staffId: string) => {
    setFormData((prev) => ({
      ...prev,
      staffInvolved: prev.staffInvolved.includes(staffId)
        ? prev.staffInvolved.filter((id) => id !== staffId)
        : [...prev.staffInvolved, staffId],
    }));
  };

  const removeStaff = (staffId: string) => {
    setFormData((prev) => ({
      ...prev,
      staffInvolved: prev.staffInvolved.filter((id) => id !== staffId),
    }));
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Update event information and settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Event Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Johnson-Williams Wedding"
                  required
                  disabled={isUpdating}
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
                  disabled={isUpdating}
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
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Event Date *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={
                    formData.date
                      ? formData.date.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => {
                    console.log(
                      "[Edit Event Modal] Date input changed:",
                      e.target.value
                    );
                    if (e.target.value) {
                      const selectedDate = new Date(e.target.value);
                      console.log(
                        "[Edit Event Modal] Parsed date:",
                        selectedDate
                      );
                      setFormData((prev) => ({ ...prev, date: selectedDate }));
                    } else {
                      setFormData((prev) => ({ ...prev, date: undefined }));
                    }
                  }}
                  required
                  disabled={isUpdating}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue">Venue *</Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) =>
                    setFormData({ ...formData, venue: e.target.value })
                  }
                  placeholder="e.g., Grand Hotel Ballroom"
                  required
                  disabled={isUpdating}
                />
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
                placeholder="Describe the event..."
                rows={4}
                required
                disabled={isUpdating}
              />
            </div>
          </div>

          {/* Services Used */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Services Used</h3>
              <span className="text-sm text-muted-foreground">
                {formData.servicesUsed.length} selected
              </span>
            </div>

            {servicesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <ScrollArea className="h-48 rounded-md border p-4">
                  <div className="space-y-3">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`service-${service.id}`}
                          checked={formData.servicesUsed.includes(service.id)}
                          onCheckedChange={() => toggleService(service.id)}
                          disabled={isUpdating}
                        />
                        <label
                          htmlFor={`service-${service.id}`}
                          className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {service.name}
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({service.category})
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {formData.servicesUsed.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.servicesUsed.map((serviceId) => {
                      const service = services.find((s) => s.id === serviceId);
                      return (
                        <Badge key={serviceId} variant="secondary">
                          {service?.name || serviceId}
                          <button
                            type="button"
                            onClick={() => removeService(serviceId)}
                            className="ml-2 hover:text-destructive"
                            disabled={isUpdating}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Staff Involved */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Staff Involved</h3>
              <span className="text-sm text-muted-foreground">
                {formData.staffInvolved.length} selected
              </span>
            </div>

            {loadingStaff ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <ScrollArea className="h-48 rounded-md border p-4">
                  <div className="space-y-3">
                    {staffProfiles.map((staff) => (
                      <div
                        key={staff.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`staff-${staff.id}`}
                          checked={formData.staffInvolved.includes(staff.id)}
                          onCheckedChange={() => toggleStaff(staff.id)}
                          disabled={isUpdating}
                        />
                        <label
                          htmlFor={`staff-${staff.id}`}
                          className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {staff.fullName}
                          {staff.categories.length > 0 && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({staff.categories.join(", ")})
                            </span>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {formData.staffInvolved.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.staffInvolved.map((staffId) => {
                      const staff = staffProfiles.find((s) => s.id === staffId);
                      return (
                        <Badge key={staffId} variant="secondary">
                          {staff?.fullName || staffId}
                          <button
                            type="button"
                            onClick={() => removeStaff(staffId)}
                            className="ml-2 hover:text-destructive"
                            disabled={isUpdating}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Publish Status */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="published">Published Status</Label>
              <p className="text-sm text-muted-foreground">
                Make this event visible to clients on the platform
              </p>
            </div>
            <Switch
              id="published"
              checked={formData.isPublished}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isPublished: checked })
              }
              disabled={isUpdating}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
