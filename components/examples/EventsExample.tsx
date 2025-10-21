"use client";

/**
 * Example component demonstrating Redux Toolkit + RTK Query usage
 * This shows how to fetch, create, update, and delete data using Firebase through Redux
 */

import { useState } from "react";
import {
  useGetEventsQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
} from "@/lib/redux/api/eventsApi";
import {
  uploadMultipleFiles,
  deleteMultipleFiles,
} from "@/lib/firebase/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function EventsExample() {
  // Fetch events with optional filters
  const {
    data: events,
    isLoading,
    error,
    refetch,
  } = useGetEventsQuery({
    status: "upcoming",
  });

  // Mutations
  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation();
  const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();
  const [deleteEvent, { isLoading: isDeleting }] = useDeleteEventMutation();

  const [uploadProgress, setUploadProgress] = useState(0);

  // Example: Create event with images
  const handleCreateEvent = async (formData: any, imageFiles: File[]) => {
    try {
      // 1. Create event first to get ID
      const newEvent = await createEvent({
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        eventType: formData.eventType,
        status: "upcoming",
        clientId: formData.clientId,
        assignedStaffIds: [],
        servicesIds: [],
        budget: formData.budget,
        images: [],
        isActive: true,
      }).unwrap();

      // 2. Upload images if provided
      if (imageFiles.length > 0) {
        const imageUrls = await uploadMultipleFiles(
          imageFiles,
          `events/${newEvent.id}`,
          (progress) => setUploadProgress(progress)
        );

        // 3. Update event with image URLs
        await updateEvent({
          id: newEvent.id,
          data: { images: imageUrls },
        }).unwrap();
      }

      toast.success("Event created successfully!");
      setUploadProgress(0);
    } catch (error: any) {
      toast.error(`Failed to create event: ${error.message}`);
      console.error(error);
    }
  };

  // Example: Update event
  const handleUpdateEvent = async (eventId: string, updates: any) => {
    try {
      await updateEvent({
        id: eventId,
        data: updates,
      }).unwrap();

      toast.success("Event updated successfully!");
    } catch (error: any) {
      toast.error(`Failed to update event: ${error.message}`);
    }
  };

  // Example: Delete event (soft delete)
  const handleDeleteEvent = async (eventId: string, imageUrls?: string[]) => {
    try {
      // 1. Delete images from storage if any
      if (imageUrls && imageUrls.length > 0) {
        await deleteMultipleFiles(imageUrls);
      }

      // 2. Soft delete the event
      await deleteEvent(eventId).unwrap();

      toast.success("Event deleted successfully!");
    } catch (error: any) {
      toast.error(`Failed to delete event: ${error.message}`);
    }
  };

  // Render
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading events...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            Error loading events: {error.toString()}
          </div>
          <Button onClick={() => refetch()} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Events (RTK Query Example)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events?.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between border-b pb-2"
            >
              <div>
                <h3 className="font-medium">{event.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {event.date} at {event.time}
                </p>
                <p className="text-xs text-muted-foreground">
                  Status: {event.status}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleUpdateEvent(event.id, { status: "completed" })
                  }
                  disabled={isUpdating}
                >
                  Mark Complete
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteEvent(event.id, event.images)}
                  disabled={isDeleting}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}

          {events?.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No events found
            </div>
          )}

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-4">
              <div className="text-sm text-muted-foreground mb-2">
                Uploading images: {uploadProgress.toFixed(0)}%
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Example usage in a page:
// import { EventsExample } from "@/components/EventsExample";
//
// export default function EventsPage() {
//   return <EventsExample />;
// }
