/**
 * Edit Order Modal
 * Allows editing of order details based on order type
 */

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Order,
  isEventOrder,
  isServiceOrder,
  isStaffOrder,
  isOfferOrder,
  EVENT_TYPE_LABELS,
  EventType,
} from "@/types/orders";
import {
  useUpdateEventOrderMutation,
  useUpdateServiceOrderMutation,
  useUpdateStaffOrderMutation,
  useUpdateOfferOrderMutation,
} from "@/lib/redux/api/ordersApi";
import { useToast } from "@/hooks/use-toast";

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

export function EditOrderModal({
  isOpen,
  onClose,
  order,
}: EditOrderModalProps) {
  const { toast } = useToast();

  // Form state - common fields
  const [adminNotes, setAdminNotes] = useState(order.adminNotes || "");

  // Event-specific state
  const [eventType, setEventType] = useState<EventType | "">("");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [venueCity, setVenueCity] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [specialRequirements, setSpecialRequirements] = useState("");

  // Service-specific state
  const [serviceName, setServiceName] = useState("");
  const [serviceCategory, setServiceCategory] = useState("");
  const [customRequirements, setCustomRequirements] = useState("");

  // Staff-specific state
  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState("");
  const [location, setLocation] = useState("");
  const [bookingHours, setBookingHours] = useState("");
  const [requirements, setRequirements] = useState("");

  // Offer-specific state
  const [offerTitle, setOfferTitle] = useState("");
  const [offerDiscount, setOfferDiscount] = useState("");

  // Mutations
  const [updateEventOrder, { isLoading: isUpdatingEvent }] =
    useUpdateEventOrderMutation();
  const [updateServiceOrder, { isLoading: isUpdatingService }] =
    useUpdateServiceOrderMutation();
  const [updateStaffOrder, { isLoading: isUpdatingStaff }] =
    useUpdateStaffOrderMutation();
  const [updateOfferOrder, { isLoading: isUpdatingOffer }] =
    useUpdateOfferOrderMutation();

  const isLoading =
    isUpdatingEvent || isUpdatingService || isUpdatingStaff || isUpdatingOffer;

  // Initialize form with order data
  useEffect(() => {
    setAdminNotes(order.adminNotes || "");

    if (isEventOrder(order)) {
      setEventType(order.eventDetails.eventType);
      setVenueName(order.eventDetails.venue.name);
      setVenueAddress(order.eventDetails.venue.address);
      setVenueCity(order.eventDetails.venue.city);
      setGuestCount(order.eventDetails.guestCount.toString());
      setEventDescription(order.eventDetails.description || "");
      setSpecialRequirements(order.specialRequirements || "");
    } else if (isServiceOrder(order)) {
      setServiceName(order.serviceDetails.serviceName);
      setServiceCategory(order.serviceDetails.category);
      setCustomRequirements(order.serviceDetails.customRequirements || "");
    } else if (isStaffOrder(order)) {
      setStaffName(order.staffDetails.staffName);
      setStaffRole(order.staffDetails.role);
      setLocation(order.location);
      setBookingHours(order.bookingDuration.hours.toString());
      setRequirements(order.requirements || "");
    } else if (isOfferOrder(order)) {
      setOfferTitle(order.offerDetails.offerTitle);
      setOfferDiscount(order.offerDetails.discount);
    }
  }, [order]);

  const handleSubmit = async () => {
    try {
      if (isEventOrder(order)) {
        await updateEventOrder({
          orderId: order.orderId,
          eventDetails: {
            eventType: eventType as EventType,
            venue: {
              name: venueName,
              address: venueAddress,
              city: venueCity,
            },
            guestCount: parseInt(guestCount, 10),
            description: eventDescription,
          },
          specialRequirements,
          adminNotes,
        }).unwrap();
      } else if (isServiceOrder(order)) {
        await updateServiceOrder({
          orderId: order.orderId,
          serviceDetails: {
            serviceName,
            category: serviceCategory,
            customRequirements,
          },
          adminNotes,
        }).unwrap();
      } else if (isStaffOrder(order)) {
        await updateStaffOrder({
          orderId: order.orderId,
          location,
          requirements,
          bookingDuration: {
            startTime: order.bookingDuration.startTime,
            endTime: order.bookingDuration.endTime,
            hours: parseInt(bookingHours, 10),
          },
          adminNotes,
        }).unwrap();
      } else if (isOfferOrder(order)) {
        await updateOfferOrder({
          orderId: order.orderId,
          adminNotes,
        }).unwrap();
      }

      toast({
        title: "Order Updated",
        description: `Order ${order.orderNumber} has been updated successfully.`,
      });

      onClose();
    } catch (error: any) {
      console.error("Failed to update order:", error);
      toast({
        title: "Update Failed",
        description:
          error?.data?.error || "Failed to update order. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Order</DialogTitle>
          <DialogDescription>
            Update details for order{" "}
            <span className="font-mono font-medium">{order.orderNumber}</span>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Order Details</TabsTrigger>
            <TabsTrigger value="notes">Admin Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            {/* Event Order Fields */}
            {isEventOrder(order) && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select
                    value={eventType}
                    onValueChange={(v) => setEventType(v as EventType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EVENT_TYPE_LABELS).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="venueName">Venue Name</Label>
                    <Input
                      id="venueName"
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                      placeholder="Enter venue name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="venueCity">City</Label>
                    <Input
                      id="venueCity"
                      value={venueCity}
                      onChange={(e) => setVenueCity(e.target.value)}
                      placeholder="Enter city"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="venueAddress">Venue Address</Label>
                  <Input
                    id="venueAddress"
                    value={venueAddress}
                    onChange={(e) => setVenueAddress(e.target.value)}
                    placeholder="Enter venue address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guestCount">Guest Count</Label>
                  <Input
                    id="guestCount"
                    type="number"
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    placeholder="Enter number of guests"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventDescription">Event Description</Label>
                  <Textarea
                    id="eventDescription"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    placeholder="Describe the event..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialRequirements">
                    Special Requirements
                  </Label>
                  <Textarea
                    id="specialRequirements"
                    value={specialRequirements}
                    onChange={(e) => setSpecialRequirements(e.target.value)}
                    placeholder="Any special requirements..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Service Order Fields */}
            {isServiceOrder(order) && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceName">Service Name</Label>
                  <Input
                    id="serviceName"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="Enter service name"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Service cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceCategory">Category</Label>
                  <Input
                    id="serviceCategory"
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value)}
                    placeholder="Enter category"
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customRequirements">
                    Custom Requirements
                  </Label>
                  <Textarea
                    id="customRequirements"
                    value={customRequirements}
                    onChange={(e) => setCustomRequirements(e.target.value)}
                    placeholder="Any custom requirements..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Staff Order Fields */}
            {isStaffOrder(order) && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="staffName">Staff Member</Label>
                    <Input
                      id="staffName"
                      value={staffName}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Staff cannot be changed
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staffRole">Role</Label>
                    <Input
                      id="staffRole"
                      value={staffRole}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter event location"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bookingHours">Booking Duration (hours)</Label>
                  <Input
                    id="bookingHours"
                    type="number"
                    value={bookingHours}
                    onChange={(e) => setBookingHours(e.target.value)}
                    placeholder="Enter hours"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requirements">Requirements</Label>
                  <Textarea
                    id="requirements"
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    placeholder="Any specific requirements..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Offer Order Fields */}
            {isOfferOrder(order) && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="offerTitle">Offer</Label>
                  <Input
                    id="offerTitle"
                    value={offerTitle}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Offer details cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offerDiscount">Discount</Label>
                  <Input
                    id="offerDiscount"
                    value={offerDiscount}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <p className="text-sm text-muted-foreground">
                  Offer redemption details are fixed. You can only update admin
                  notes.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="adminNotes">Admin Notes</Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal notes about this order..."
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                These notes are only visible to administrators.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
