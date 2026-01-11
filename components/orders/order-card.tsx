/**
 * Order Card Component
 * Displays individual order in list view
 */

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Eye,
  MoreVertical,
  Users,
  DollarSign,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { OrderStatusBadge } from "./order-status-badge";
import { OrderTypeBadge } from "./order-type-badge";
import {
  formatOrderDate,
  formatCurrency,
  getOrderSummary,
  getOrderLocation,
  getOrderDisplayDate,
} from "@/lib/orders/helpers";
import type { Order } from "@/types/orders";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OrderCardProps {
  order: Order;
  onViewDetails?: (orderId: string) => void;
  onEdit?: (orderId: string) => void;
  onDelete?: (orderId: string) => void;
  onMessage?: (orderId: string) => void;
}

// Helper to generate message link with client info
function getMessageLink(order: Order): string {
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

export function OrderCard({
  order,
  onViewDetails,
  onEdit,
  onDelete,
  onMessage,
}: OrderCardProps) {
  const displayDate = getOrderDisplayDate(order);
  const location = getOrderLocation(order);
  const summary = getOrderSummary(order);
  const messageLink = getMessageLink(order);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          {/* Main Content */}
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold font-mono">
                    {order.orderNumber}
                  </h3>
                  <OrderStatusBadge status={order.status} />
                  <OrderTypeBadge type={order.orderType} />
                </div>
                <div>
                  <p className="font-medium">{order.clientInfo.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.clientInfo.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {displayDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span>{formatOrderDate(displayDate)}</span>
                </div>
              )}

              {location !== "N/A" && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{location}</span>
                </div>
              )}

              {order.quote && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-semibold">
                    {formatCurrency(
                      order.quote.finalAmount,
                      order.quote.currency
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Summary */}
            {summary && (
              <div className="text-sm text-muted-foreground">{summary}</div>
            )}

            {/* Payment Status */}
            {order.payment && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Payment:</span>
                <span
                  className={`font-medium ${
                    order.payment.status === "completed"
                      ? "text-green-600 dark:text-green-400"
                      : order.payment.status === "partial"
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {formatCurrency(
                    order.payment.amountPaid,
                    order.quote?.currency
                  )}{" "}
                  paid
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-row md:flex-col gap-2 justify-end">
            <Link
              href={`/orders/${order.orderId}`}
              className="flex-1 md:flex-none"
            >
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="mr-2 h-4 w-4" />
                View
              </Button>
            </Link>

            <Link href={messageLink} className="flex-1 md:flex-none">
              <Button variant="outline" size="sm" className="w-full">
                <MessageSquare className="mr-2 h-4 w-4" />
                Message
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onViewDetails?.(order.orderId)}
                >
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMessage?.(order.orderId)}>
                  Send Message
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit?.(order.orderId)}>
                  Edit Order
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete?.(order.orderId)}
                  className="text-destructive"
                >
                  Delete Order
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
