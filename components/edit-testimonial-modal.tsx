"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useUpdateTestimonialMutation,
  useGetEventsQuery,
  useGetClientsQuery,
  Testimonial,
} from "@/lib/redux/api/testimonialsApi";

interface EditTestimonialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: () => void;
  testimonial: Testimonial | null;
}

export function EditTestimonialModal({
  open,
  onOpenChange,
  onSubmit,
  testimonial,
}: EditTestimonialModalProps) {
  const { toast } = useToast();
  const [updateTestimonial, { isLoading: isUpdating }] =
    useUpdateTestimonialMutation();
  const { data: events = [] } = useGetEventsQuery();
  const { data: clients = [] } = useGetClientsQuery();

  const [formData, setFormData] = useState({
    clientId: "",
    eventId: "none",
    text: "",
    rating: 5,
    isPublished: true,
  });

  // Populate form when testimonial changes
  useEffect(() => {
    if (testimonial) {
      setFormData({
        clientId: testimonial.clientId,
        eventId: testimonial.eventId || "none",
        text: testimonial.text,
        rating: testimonial.rating,
        isPublished: testimonial.isPublished,
      });
    }
  }, [testimonial]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({
        clientId: "",
        eventId: "none",
        text: "",
        rating: 5,
        isPublished: true,
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!testimonial) {
      toast({
        title: "Error",
        description: "No testimonial selected for editing",
        variant: "destructive",
      });
      return;
    }

    // Validation
    if (!formData.clientId) {
      toast({
        title: "Validation Error",
        description: "Client is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.text.trim()) {
      toast({
        title: "Validation Error",
        description: "Testimonial text is required",
        variant: "destructive",
      });
      return;
    }

    if (formData.rating < 1 || formData.rating > 5) {
      toast({
        title: "Validation Error",
        description: "Rating must be between 1 and 5",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log(
        "[Edit Testimonial Modal] Updating testimonial:",
        testimonial.id,
        formData
      );

      const testimonialData = {
        id: testimonial.id,
        clientId: formData.clientId,
        text: formData.text.trim(),
        rating: formData.rating,
        isPublished: formData.isPublished,
        ...(formData.eventId &&
          formData.eventId !== "none" && { eventId: formData.eventId }),
      };

      await updateTestimonial(testimonialData).unwrap();

      toast({
        title: "Success",
        description: "Testimonial updated successfully",
      });

      onOpenChange(false);
      onSubmit?.();
    } catch (error: any) {
      console.error(
        "[Edit Testimonial Modal] Error updating testimonial:",
        error
      );
      toast({
        title: "Error",
        description: error.message || "Failed to update testimonial",
        variant: "destructive",
      });
    }
  };

  if (!testimonial) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Testimonial</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-client">Client *</Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, clientId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-event">Event (Optional)</Label>
              <Select
                value={formData.eventId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, eventId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No event</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-text">Testimonial Text *</Label>
              <Textarea
                id="edit-text"
                value={formData.text}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, text: e.target.value }))
                }
                placeholder="Enter the client's testimonial..."
                rows={5}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Rating *</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, rating: star }))
                    }
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= formData.rating
                          ? "fill-accent text-accent"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Current rating: {formData.rating} star
                {formData.rating !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isPublished"
                checked={formData.isPublished}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isPublished: checked }))
                }
              />
              <Label htmlFor="edit-isPublished">
                Publish testimonial (make it visible to users)
              </Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Testimonial"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
