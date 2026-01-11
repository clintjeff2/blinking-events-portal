/**
 * Order Status Change Modal
 * Allows admin to update order status with notes
 */

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  OrderStatus,
  ORDER_STATUS_LABELS,
  ALLOWED_STATUS_TRANSITIONS,
  canTransitionStatus,
} from "@/types/orders";
import { useUpdateOrderStatusMutation } from "@/lib/redux/api/ordersApi";
import { useToast } from "@/hooks/use-toast";
import { getOrderStatusColor } from "@/lib/orders/helpers";

interface OrderStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  currentStatus: OrderStatus;
  orderNumber: string;
}

export function OrderStatusModal({
  isOpen,
  onClose,
  orderId,
  currentStatus,
  orderNumber,
}: OrderStatusModalProps) {
  const [newStatus, setNewStatus] = useState<OrderStatus | "">("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const [updateStatus, { isLoading }] = useUpdateOrderStatusMutation();

  // Get available status transitions
  const availableStatuses = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

  const handleSubmit = async () => {
    if (!newStatus) {
      toast({
        title: "Select Status",
        description: "Please select a new status for the order.",
        variant: "destructive",
      });
      return;
    }

    try {
      // TODO: Get actual user ID and name from auth context
      await updateStatus({
        orderId,
        status: newStatus,
        notes: notes || `Status changed to ${ORDER_STATUS_LABELS[newStatus]}`,
        changedBy: "admin-user-id", // TODO: Get from auth context
        changedByName: "Admin", // TODO: Get from auth context
      }).unwrap();

      toast({
        title: "Status Updated",
        description: `Order ${orderNumber} status changed to ${ORDER_STATUS_LABELS[newStatus]}`,
      });

      // Reset and close
      setNewStatus("");
      setNotes("");
      onClose();
    } catch (error: any) {
      console.error("Failed to update status:", error);
      toast({
        title: "Update Failed",
        description:
          error?.data?.error ||
          "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setNewStatus("");
    setNotes("");
    onClose();
  };

  const currentStatusColor = getOrderStatusColor(currentStatus);
  const newStatusColor = newStatus ? getOrderStatusColor(newStatus) : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogDescription>
            Change the status of order{" "}
            <span className="font-mono font-medium">{orderNumber}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Status Display */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">
                Current Status
              </p>
              <Badge className={currentStatusColor}>
                {ORDER_STATUS_LABELS[currentStatus]}
              </Badge>
            </div>
            {newStatus && (
              <>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">
                    New Status
                  </p>
                  <Badge className={newStatusColor || ""}>
                    {ORDER_STATUS_LABELS[newStatus]}
                  </Badge>
                </div>
              </>
            )}
          </div>

          {/* No transitions available */}
          {availableStatuses.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This order cannot be transitioned to any other status.
                {currentStatus === "completed" &&
                  " Completed orders cannot be changed."}
                {currentStatus === "cancelled" &&
                  " Cancelled orders cannot be changed."}
              </AlertDescription>
            </Alert>
          )}

          {/* Status Selection */}
          {availableStatuses.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="status">New Status</Label>
              <Select
                value={newStatus}
                onValueChange={(value) => setNewStatus(value as OrderStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {availableStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={getOrderStatusColor(status)}
                          variant="outline"
                        >
                          {ORDER_STATUS_LABELS[status]}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          {availableStatuses.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add notes about this status change..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                These notes will be visible in the order history.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          {availableStatuses.length > 0 && (
            <Button onClick={handleSubmit} disabled={isLoading || !newStatus}>
              {isLoading ? "Updating..." : "Update Status"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
