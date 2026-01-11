/**
 * Order Status Badge Component
 * Displays order status with appropriate color coding
 */

import { Badge } from "@/components/ui/badge";
import { getOrderStatusColor, getOrderStatusLabel } from "@/lib/orders/helpers";
import type { OrderStatus } from "@/types/orders";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const colorClass = getOrderStatusColor(status);
  const label = getOrderStatusLabel(status);

  return (
    <Badge className={`${colorClass} ${className || ""}`} variant="secondary">
      {label}
    </Badge>
  );
}
