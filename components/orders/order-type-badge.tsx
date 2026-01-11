/**
 * Order Type Badge Component
 * Displays order type with icon and color
 */

import { Badge } from "@/components/ui/badge";
import { Calendar, Package, Users, Tag } from "lucide-react";
import {
  getOrderTypeBadgeColor,
  getOrderTypeLabel,
} from "@/lib/orders/helpers";
import type { OrderType } from "@/types/orders";

interface OrderTypeBadgeProps {
  type: OrderType;
  showIcon?: boolean;
  className?: string;
}

export function OrderTypeBadge({
  type,
  showIcon = true,
  className,
}: OrderTypeBadgeProps) {
  const colorClass = getOrderTypeBadgeColor(type);
  const label = getOrderTypeLabel(type);

  const icons = {
    event: Calendar,
    service: Package,
    staff: Users,
    offer: Tag,
  };

  const Icon = icons[type];

  return (
    <Badge className={`${colorClass} ${className || ""}`} variant="secondary">
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {label}
    </Badge>
  );
}
