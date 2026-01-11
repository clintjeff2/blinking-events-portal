/**
 * Order Detail Page
 * Comprehensive view of a single order with all information
 * Redesigned with better layout and messaging integration
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Edit,
  Trash2,
  XCircle,
  MessageSquare,
  ExternalLink,
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

interface PageProps {
  params: { id: string };
}

// Helper to generate initials from name
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Helper to generate message link with client info
function getMessageLink(order: {
  orderId: string;
  orderNumber: string;
  clientInfo: { fullName: string; email: string; phone?: string };
  clientId: string;
}): string {
  const params = new URLSearchParams({
    clientId: order.clientId,
    clientName: order.clientInfo.fullName,
    clientEmail: order.clientInfo.email,
    orderId: order.orderId,
    orderNumber: order.orderNumber,
  });
  if (order.clientInfo.phone) {
    params.set("clientPhone", order.clientInfo.phone);
  }
  return `/messages?${params.toString()}`;
}

export default function OrderDetailPage({ params }: PageProps) {
  const { id } = params;
  const router = useRouter();

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
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
              <div className="space-y-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            </div>
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
  const messageLink = getMessageLink(order);

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
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold font-mono">
                  {order.orderNumber}
                </h2>
                <OrderStatusBadge status={order.status} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={messageLink}>
                <Button variant="outline" size="sm">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Message Client
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Two Column Layout */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content - Left Side (2 columns) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Overview Card */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl font-mono">
                        {order.orderNumber}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Created {getRelativeTime(order.createdAt)}
                      </CardDescription>
                    </div>
                    <Button onClick={() => setIsStatusModalOpen(true)}>
                      Update Status
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <OrderStatusBadge status={order.status} />
                    <OrderTypeBadge type={order.orderType} />
                  </div>

                  {/* Key Info Grid */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {displayDate && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Date</p>
                          <p className="text-sm font-medium">
                            {formatOrderDate(displayDate)}
                          </p>
                        </div>
                      </div>
                    )}

                    {location !== "N/A" && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <MapPin className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Location
                          </p>
                          <p className="text-sm font-medium truncate max-w-[180px]">
                            {location}
                          </p>
                        </div>
                      </div>
                    )}

                    {order.quote && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Total Amount
                          </p>
                          <p className="text-sm font-semibold">
                            {formatCurrency(
                              order.quote.finalAmount,
                              order.quote.currency
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Order Type Specific Details */}
              {isEventOrder(order) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Event Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Event Type
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {EVENT_TYPE_LABELS[order.eventDetails.eventType]}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Guest Count
                        </p>
                        <p className="font-medium">
                          {order.eventDetails.guestCount} guests
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Venue
                      </p>
                      <p className="font-medium">
                        {order.eventDetails.venue.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.eventDetails.venue.address},{" "}
                        {order.eventDetails.venue.city}
                      </p>
                    </div>

                    {order.servicesRequested &&
                      order.servicesRequested.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Services Requested
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {order.servicesRequested.map((service, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                <Package className="h-3 w-3" />
                                {service.serviceName}
                                <span className="text-xs opacity-70">
                                  x{service.quantity}
                                </span>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                    {order.staffRequested &&
                      order.staffRequested.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Staff Requested
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {order.staffRequested.map((staff, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                <Users className="h-3 w-3" />
                                {staff.staffName} ({staff.role})
                                <span className="text-xs opacity-70">
                                  x{staff.quantity}
                                </span>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                    {order.specialRequirements && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Special Requirements
                        </p>
                        <p className="text-sm bg-muted/50 p-3 rounded-lg">
                          {order.specialRequirements}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {isServiceOrder(order) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Service Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Service</p>
                        <p className="font-medium">
                          {order.serviceDetails.serviceName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Category
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {order.serviceDetails.category}
                        </Badge>
                      </div>
                    </div>
                    {order.serviceDetails.customRequirements && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-1">
                          Custom Requirements
                        </p>
                        <p className="text-sm bg-muted/50 p-3 rounded-lg">
                          {order.serviceDetails.customRequirements}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {isStaffOrder(order) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Staff Booking Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Staff Member
                        </p>
                        <p className="font-medium">
                          {order.staffDetails.staffName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Role</p>
                        <Badge variant="outline" className="mt-1">
                          {order.staffDetails.role}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Duration
                        </p>
                        <p className="font-medium">
                          {order.bookingDuration.hours} hours
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Location
                        </p>
                        <p className="font-medium">{order.location}</p>
                      </div>
                    </div>
                    {order.requirements && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-1">
                          Requirements
                        </p>
                        <p className="text-sm bg-muted/50 p-3 rounded-lg">
                          {order.requirements}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {isOfferOrder(order) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Offer Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Offer</p>
                        <p className="font-medium">
                          {order.offerDetails.offerTitle}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Discount
                        </p>
                        <Badge
                          variant="secondary"
                          className="mt-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                        >
                          {order.offerDetails.discount}
                        </Badge>
                      </div>
                    </div>
                    {order.offerDetails.offerDescription && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-1">
                          Description
                        </p>
                        <p className="text-sm bg-muted/50 p-3 rounded-lg">
                          {order.offerDetails.offerDescription}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Quote & Payment Section */}
              {(order.quote || order.payment) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quote & Payment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Quote Breakdown */}
                    {order.quote && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Quote Breakdown
                        </p>
                        <div className="space-y-2 bg-muted/30 rounded-lg p-4">
                          {order.quote.breakdown.map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between text-sm"
                            >
                              <span>{item.item}</span>
                              <span className="font-medium">
                                {formatCurrency(
                                  item.amount,
                                  order.quote!.currency
                                )}
                              </span>
                            </div>
                          ))}
                          <Separator className="my-2" />
                          <div className="flex justify-between text-sm">
                            <span>Subtotal</span>
                            <span className="font-medium">
                              {formatCurrency(
                                order.quote.total,
                                order.quote.currency
                              )}
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
                          <Separator className="my-2" />
                          <div className="flex justify-between font-semibold">
                            <span>Total</span>
                            <span>
                              {formatCurrency(
                                order.quote.finalAmount,
                                order.quote.currency
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment Status */}
                    {order.payment && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Payment Status
                        </p>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                            <p className="text-xs text-green-600 dark:text-green-400">
                              Paid
                            </p>
                            <p className="font-semibold text-green-700 dark:text-green-300">
                              {formatCurrency(
                                order.payment.amountPaid,
                                order.quote?.currency
                              )}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
                            <p className="text-xs text-orange-600 dark:text-orange-400">
                              Due
                            </p>
                            <p className="font-semibold text-orange-700 dark:text-orange-300">
                              {formatCurrency(
                                order.payment.amountDue,
                                order.quote?.currency
                              )}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">
                              Status
                            </p>
                            <Badge
                              variant="secondary"
                              className="mt-1 capitalize"
                            >
                              {order.payment.status}
                            </Badge>
                          </div>
                        </div>

                        {/* Transaction History */}
                        {order.payment.transactions.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm text-muted-foreground mb-2">
                              Transactions
                            </p>
                            <div className="space-y-2">
                              {order.payment.transactions.map((txn, index) => (
                                <div
                                  key={index}
                                  className="flex justify-between items-center p-2 rounded bg-muted/30"
                                >
                                  <div>
                                    <p className="text-sm font-medium">
                                      {formatCurrency(
                                        txn.amount,
                                        order.quote?.currency
                                      )}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatOrderDate(txn.date.toDate())}
                                    </p>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className="capitalize"
                                  >
                                    {txn.method.replace("_", " ")}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Right Side (1 column) */}
            <div className="space-y-6">
              {/* Client Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Client</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(order.clientInfo.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {order.clientInfo.fullName}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {order.clientInfo.email}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{order.clientInfo.email}</span>
                    </div>
                    {order.clientInfo.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{order.clientInfo.phone}</span>
                      </div>
                    )}
                  </div>

                  <Separator className="my-4" />

                  <Link href={messageLink} className="block">
                    <Button className="w-full" variant="outline">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Send Message
                      <ExternalLink className="ml-auto h-3 w-3" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Quick Actions Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => setIsStatusModalOpen(true)}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Update Status
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Order
                  </Button>
                  <Button
                    className="w-full justify-start text-destructive hover:text-destructive"
                    variant="outline"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Cancel Order
                  </Button>
                </CardContent>
              </Card>

              {/* Status History Card */}
              {order.statusHistory.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative space-y-4">
                      {/* Timeline line */}
                      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />

                      {order.statusHistory.map((history, index) => (
                        <div key={index} className="flex gap-3 relative">
                          <div className="rounded-full bg-background border-2 border-primary p-1 z-10">
                            <Clock className="h-3 w-3 text-primary" />
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <OrderStatusBadge status={history.status} />
                              <span className="text-xs text-muted-foreground">
                                {getRelativeTime(history.changedAt)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              by{" "}
                              {history.changedByName ||
                                order.clientInfo.fullName}
                            </p>
                            {history.notes && (
                              <p className="text-xs mt-1 text-muted-foreground bg-muted/50 p-2 rounded">
                                {history.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Admin Notes */}
              {order.adminNotes && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Admin Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {order.adminNotes}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
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
