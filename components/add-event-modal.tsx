"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
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
import { useToast } from "@/hooks/use-toast";
import { useCreateEventMutation } from "@/lib/redux/api/eventsApi";
import { useGetServicesQuery } from "@/lib/redux/api/servicesApi";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { notifyNewEvent } from "@/lib/utils/admin-notifications";

interface Service {
  id: string;
  name: string;
}

interface StaffProfile {
  id: string;
  fullName: string;
}

interface AddEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: () => void;
}

export function AddEventModal({
  open,
  onOpenChange,
  onSubmit,
}: AddEventModalProps) {
  const { toast } = useToast();
  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation();
  const { data: services = [] } = useGetServicesQuery({});

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    date: null as Date | null,
    venue: "",
    category: "",
    description: "",
    servicesUsed: [] as string[],
    staffInvolved: [] as string[],
    isPublished: true,
  });

  // UI state
  const [staffProfiles, setStaffProfiles] = useState<StaffProfile[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);

  // Load staff profiles
  useEffect(() => {
    const loadStaffProfiles = async () => {
      try {
        setLoadingStaff(true);
        const staffCollection = collection(db, "staffProfiles");
        const staffSnapshot = await getDocs(staffCollection);
        const staffData = staffSnapshot.docs.map((doc) => ({
          id: doc.id,
          fullName: doc.data().fullName,
        }));
        setStaffProfiles(staffData);
        console.log("[Add Event Modal] Loaded staff profiles:", staffData);
      } catch (error) {
        console.error("[Add Event Modal] Error loading staff:", error);
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
      loadStaffProfiles();
    }
  }, [open, toast]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({
        name: "",
        date: null,
        venue: "",
        category: "",
        description: "",
        servicesUsed: [],
        staffInvolved: [],
        isPublished: true,
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Event name is required",
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

    if (!formData.category) {
      toast({
        title: "Validation Error",
        description: "Category is required",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("[Add Event Modal] Submitting event:", formData);

      const eventData = {
        name: formData.name.trim(),
        date: formData.date.toISOString(),
        venue: formData.venue.trim(),
        category: formData.category,
        description: formData.description.trim(),
        servicesUsed: formData.servicesUsed,
        staffInvolved: formData.staffInvolved,
        isPublished: formData.isPublished,
        testimonials: [],
      };

      const result = await createEvent(eventData).unwrap();

      // Send notification to all mobile app users if event is published
      if (formData.isPublished) {
        try {
          await notifyNewEvent({
            name: formData.name.trim(),
            category: formData.category,
            venue: formData.venue.trim(),
            eventId: result?.eventId || result?.id || "",
          });
          console.log("[Add Event Modal] Notification sent to all users");
        } catch (notifyError) {
          console.error(
            "[Add Event Modal] Failed to send notification:",
            notifyError
          );
        }
      }

      toast({
        title: "Success",
        description: "Event created successfully",
      });

      onOpenChange(false);
      onSubmit?.();
    } catch (error: any) {
      console.error("[Add Event Modal] Error creating event:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      servicesUsed: prev.servicesUsed.includes(serviceId)
        ? prev.servicesUsed.filter((id) => id !== serviceId)
        : [...prev.servicesUsed, serviceId],
    }));
  };

  const handleStaffToggle = (staffId: string) => {
    setFormData((prev) => ({
      ...prev,
      staffInvolved: prev.staffInvolved.includes(staffId)
        ? prev.staffInvolved.filter((id) => id !== staffId)
        : [...prev.staffInvolved, staffId],
    }));
  };

  const getServiceName = (serviceId: string) => {
    const service = services.find((s: any) => s.id === serviceId);
    return service?.name || serviceId;
  };

  const getStaffName = (staffId: string) => {
    const staff = staffProfiles.find((s) => s.id === staffId);
    return staff?.fullName || staffId;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Event Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter event name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Event Date *</Label>
              <Input
                id="date"
                type="date"
                value={
                  formData.date ? formData.date.toISOString().split("T")[0] : ""
                }
                onChange={(e) => {
                  console.log(
                    "[Add Event Modal] Date input changed:",
                    e.target.value
                  );
                  if (e.target.value) {
                    const selectedDate = new Date(e.target.value);
                    console.log("[Add Event Modal] Parsed date:", selectedDate);
                    setFormData((prev) => ({ ...prev, date: selectedDate }));
                  } else {
                    setFormData((prev) => ({ ...prev, date: null }));
                  }
                }}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }
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

          <div className="space-y-2">
            <Label htmlFor="venue">Venue *</Label>
            <Input
              id="venue"
              value={formData.venue}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, venue: e.target.value }))
              }
              placeholder="Enter venue location"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Enter event description"
              rows={3}
            />
          </div>

          {/* Services Used */}
          <div className="space-y-2">
            <Label>Services Used</Label>
            {services.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {services.map((service: any) => (
                    <div
                      key={service.id}
                      className="flex items-center space-x-2"
                    >
                      <Switch
                        id={`service-${service.id}`}
                        checked={formData.servicesUsed.includes(service.id)}
                        onCheckedChange={() => handleServiceToggle(service.id)}
                      />
                      <Label
                        htmlFor={`service-${service.id}`}
                        className="text-sm"
                      >
                        {service.name}
                      </Label>
                    </div>
                  ))}
                </div>
                {formData.servicesUsed.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.servicesUsed.map((serviceId) => (
                      <Badge key={serviceId} variant="secondary">
                        {getServiceName(serviceId)}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-auto p-0"
                          onClick={() => handleServiceToggle(serviceId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No services available
              </p>
            )}
          </div>

          {/* Staff Involved */}
          <div className="space-y-2">
            <Label>Staff Involved</Label>
            {loadingStaff ? (
              <p className="text-sm text-muted-foreground">Loading staff...</p>
            ) : staffProfiles.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {staffProfiles.map((staff) => (
                    <div key={staff.id} className="flex items-center space-x-2">
                      <Switch
                        id={`staff-${staff.id}`}
                        checked={formData.staffInvolved.includes(staff.id)}
                        onCheckedChange={() => handleStaffToggle(staff.id)}
                      />
                      <Label htmlFor={`staff-${staff.id}`} className="text-sm">
                        {staff.fullName}
                      </Label>
                    </div>
                  ))}
                </div>
                {formData.staffInvolved.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.staffInvolved.map((staffId) => (
                      <Badge key={staffId} variant="secondary">
                        {getStaffName(staffId)}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-auto p-0"
                          onClick={() => handleStaffToggle(staffId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No staff available
              </p>
            )}
          </div>

          {/* Published Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isPublished"
              checked={formData.isPublished}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isPublished: checked }))
              }
            />
            <Label htmlFor="isPublished">
              Publish event (make it visible in the gallery)
            </Label>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
