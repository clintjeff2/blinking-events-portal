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
  useCreateTestimonialMutation,
  useGetEventsQuery,
  useGetClientsQuery,
} from "@/lib/redux/api/testimonialsApi";

interface AddTestimonialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: () => void;
}

export function AddTestimonialModal({
  open,
  onOpenChange,
  onSubmit,
}: AddTestimonialModalProps) {
  const { toast } = useToast();
  const [createTestimonial, { isLoading: isCreating }] =
    useCreateTestimonialMutation();
  const { data: events = [] } = useGetEventsQuery();
  const { data: clients = [] } = useGetClientsQuery();

  const [formData, setFormData] = useState({
    clientId: "",
    eventId: "none",
    text: "",
    rating: 5,
    isPublished: true,
  });

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
      console.log("[Add Testimonial Modal] Submitting testimonial:", formData);

      const testimonialData = {
        clientId: formData.clientId,
        text: formData.text.trim(),
        rating: formData.rating,
        isPublished: formData.isPublished,
        ...(formData.eventId &&
          formData.eventId !== "none" && { eventId: formData.eventId }),
      };

      await createTestimonial(testimonialData).unwrap();

      toast({
        title: "Success",
        description: "Testimonial created successfully",
      });

      onOpenChange(false);
      onSubmit?.();
    } catch (error: any) {
      console.error(
        "[Add Testimonial Modal] Error creating testimonial:",
        error
      );
      toast({
        title: "Error",
        description: error.message || "Failed to create testimonial",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Testimonial</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client *</Label>
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
              <Label htmlFor="event">Event (Optional)</Label>
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
              <Label htmlFor="text">Testimonial Text *</Label>
              <Textarea
                id="text"
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
                id="isPublished"
                checked={formData.isPublished}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isPublished: checked }))
                }
              />
              <Label htmlFor="isPublished">
                Publish testimonial (make it visible to users)
              </Label>
            </div>
          </div>

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
              {isCreating ? "Creating..." : "Create Testimonial"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
