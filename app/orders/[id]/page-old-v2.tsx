/**
 * Order Detail Page
 * Comprehensive view of a single order with all information
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Phone,
  Mail,
  DollarSign,
  Clock,
  Package,
  FileText,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useGetOrderByIdQuery } from "@/lib/redux/api/ordersApi";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderTypeBadge } from "@/components/orders/order-type-badge";
import { OrderStatusModal } from "@/components/orders/order-status-modal";
import { EditOrderModal } from "@/components/orders/edit-order-modal";
import { DeleteOrderDialog } from "@/components/orders/delete-order-dialog";
import {
  formatOrderDate,
  formatCurrency,
  getOrderDisplayDate,
  getOrderLocation,
  getRelativeTime,
} from "@/lib/orders/helpers";
import {
  EVENT_TYPE_LABELS,
  isEventOrder,
  isServiceOrder,
  isStaffOrder,
  isOfferOrder,
} from "@/types/orders";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface PageProps {
  params: { id: string };
}

export default function OrderDetailPage({ params }: PageProps) {
  const { id } = params;
  const router = useRouter();
  const { toast } = useToast();

  // Modal states
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch order data
  const { data: order, isLoading, error } = useGetOrderByIdQuery(id);

  // Handlers
  const handleBack = () => {
    router.push("/orders");
  };

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleStatusChange = () => {
    setIsStatusModalOpen(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Skeleton className="h-6 w-32" />
          </header>
          <div className="flex flex-1 flex-col gap-6 p-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h2 className="text-lg font-semibold">Order Not Found</h2>
          </header>
          <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
            <XCircle className="h-16 w-16 text-destructive" />
            <div className="text-center">
              <h3 className="text-2xl font-semibold mb-2">Order Not Found</h3>
              <p className="text-muted-foreground mb-6">
                The order you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Orders
              </Button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const displayDate = getOrderDisplayDate(order);
  const location = getOrderLocation(order);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <h2 className="text-lg font-semibold font-mono">
                {order.orderNumber}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Order Header Card */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="font-mono">
                      {order.orderNumber}
                    </CardTitle>
                    <OrderStatusBadge status={order.status} />
                    <OrderTypeBadge type={order.orderType} />
                  </div>
                  <CardDescription>
                    Created {getRelativeTime(order.createdAt)}
                  </CardDescription>
                </div>
                <Button onClick={handleStatusChange}>Update Status</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {displayDate && (
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Date</p>
                      <p className="text-sm text-muted-foreground">
                        {formatOrderDate(displayDate)}
                      </p>
                    </div>
                  </div>
                )}

                {location !== "N/A" && (
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">
                        {location}
                      </p>
                    </div>
                  </div>
                )}

                {order.quote && (
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Quote Amount</p>
                      <p className="text-sm font-semibold">
                        {formatCurrency(
                          order.quote.finalAmount,
                          order.quote.currency
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {order.payment && (
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <CheckCircle className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Payment Status</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {order.payment.status}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Full Name</p>
                      <p className="text-sm text-muted-foreground">
                        {order.clientInfo.fullName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">
                        {order.clientInfo.email}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">
                        {order.clientInfo.phone}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Details - Type Specific */}
          {isEventOrder(order) && (
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium mb-1">Event Type</p>
                      <Badge variant="outline">
                        {EVENT_TYPE_LABELS[order.eventDetails.eventType]}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Guest Count</p>
                      <p className="text-sm text-muted-foreground">
                        {order.eventDetails.guestCount} guests
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-1">Venue</p>
                    <p className="text-sm text-muted-foreground">
                      {order.eventDetails.venue.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.eventDetails.venue.address},{" "}
                      {order.eventDetails.venue.city}
                    </p>
                  </div>

                  {order.servicesRequested.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">
                        Services Requested
                      </p>
                      <div className="space-y-2">
                        {order.servicesRequested.map((service, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span>{service.serviceName}</span>
                            <Badge variant="secondary">
                              x{service.quantity}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {order.staffRequested.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">
                        Staff Requested
                      </p>
                      <div className="space-y-2">
                        {order.staffRequested.map((staff, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {staff.staffName} ({staff.role})
                            </span>
                            <Badge variant="secondary">x{staff.quantity}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {order.specialRequirements && (
                    <div>
                      <p className="text-sm font-medium mb-1">
                        Special Requirements
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.specialRequirements}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {isServiceOrder(order) && (
            <Card>
              <CardHeader>
                <CardTitle>Service Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Service</p>
                    <p className="text-sm text-muted-foreground">
                      {order.serviceDetails.serviceName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Category</p>
                    <Badge variant="outline">
                      {order.serviceDetails.category}
                    </Badge>
                  </div>
                  {order.serviceDetails.customRequirements && (
                    <div>
                      <p className="text-sm font-medium mb-1">
                        Custom Requirements
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.serviceDetails.customRequirements}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {isStaffOrder(order) && (
            <Card>
              <CardHeader>
                <CardTitle>Staff Booking Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Staff Member</p>
                    <p className="text-sm text-muted-foreground">
                      {order.staffDetails.staffName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Role</p>
                    <Badge variant="outline">{order.staffDetails.role}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Duration</p>
                    <p className="text-sm text-muted-foreground">
                      {order.bookingDuration.hours} hours
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {order.location}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isOfferOrder(order) && (
            <Card>
              <CardHeader>
                <CardTitle>Offer Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Offer</p>
                    <p className="text-sm text-muted-foreground">
                      {order.offerDetails.offerTitle}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Discount</p>
                    <Badge variant="secondary">
                      {order.offerDetails.discount}
                    </Badge>
                  </div>
                  {order.offerDetails.offerDescription && (
                    <div>
                      <p className="text-sm font-medium mb-1">Description</p>
                      <p className="text-sm text-muted-foreground">
                        {order.offerDetails.offerDescription}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quote Details */}
          {order.quote && (
            <Card>
              <CardHeader>
                <CardTitle>Quote</CardTitle>
                <CardDescription>
                  Sent {getRelativeTime(order.quote.sentAt)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    {order.quote.breakdown.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.item}</span>
                        <span className="font-medium">
                          {formatCurrency(item.amount, order.quote!.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span className="font-medium">
                      {formatCurrency(order.quote.total, order.quote.currency)}
                    </span>
                  </div>
                  {order.quote.discount && order.quote.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span>Discount</span>
                      <span className="font-medium">
                        -
                        {formatCurrency(
                          order.quote.discount,
                          order.quote.currency
                        )}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-base font-semibold">
                    <span>Total</span>
                    <span>
                      {formatCurrency(
                        order.quote.finalAmount,
                        order.quote.currency
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Information */}
          {order.payment && (
            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Amount Paid</span>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(
                        order.payment.amountPaid,
                        order.quote?.currency
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Amount Due</span>
                    <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                      {formatCurrency(
                        order.payment.amountDue,
                        order.quote?.currency
                      )}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge variant="secondary" className="capitalize">
                      {order.payment.status}
                    </Badge>
                  </div>

                  {order.payment.transactions.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">
                        Transaction History
                      </p>
                      <div className="space-y-2">
                        {order.payment.transactions.map((txn, index) => (
                          <div
                            key={index}
                            className="text-sm flex justify-between items-center p-2 rounded-lg bg-muted"
                          >
                            <div>
                              <p className="font-medium">
                                {formatCurrency(
                                  txn.amount,
                                  order.quote?.currency
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatOrderDate(txn.date.toDate())}
                              </p>
                            </div>
                            <Badge variant="outline" className="capitalize">
                              {txn.method.replace("_", " ")}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status History */}
          {order.statusHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Status History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.statusHistory.map((history, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="rounded-full bg-muted p-2 mt-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <OrderStatusBadge status={history.status} />
                          <span className="text-sm text-muted-foreground">
                            {getRelativeTime(history.changedAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Changed by{" "}
                          {history.changedByName || order.clientInfo.fullName}
                        </p>
                        {history.notes && (
                          <p className="text-sm mt-1">{history.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Modals */}
        <OrderStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          orderId={order.orderId}
          currentStatus={order.status}
          orderNumber={order.orderNumber}
        />

        <EditOrderModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          order={order}
        />

        <DeleteOrderDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          orderId={order.orderId}
          orderNumber={order.orderNumber}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
