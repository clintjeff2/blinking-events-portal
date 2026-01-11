/**
 * Orders Empty State Component
 * Shown when no orders match the current filters
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";

interface OrdersEmptyStateProps {
  onCreateOrder?: () => void;
  message?: string;
}

export function OrdersEmptyState({
  onCreateOrder,
  message = "No orders found",
}: OrdersEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-muted p-6 mb-4">
          <Package className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{message}</h3>
        <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
          {onCreateOrder
            ? "Get started by creating your first order. Track quotes, payments, and communications all in one place."
            : "Try adjusting your filters or search query to find what you're looking for."}
        </p>
        {onCreateOrder && (
          <Button onClick={onCreateOrder}>Create First Order</Button>
        )}
      </CardContent>
    </Card>
  );
}
