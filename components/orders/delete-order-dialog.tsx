/**
 * Delete Order Confirmation Dialog
 * Confirms order deletion (soft delete - marks as cancelled)
 */

"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteOrderMutation } from "@/lib/redux/api/ordersApi";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface DeleteOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  redirectAfterDelete?: boolean;
}

export function DeleteOrderDialog({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  redirectAfterDelete = true,
}: DeleteOrderDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [deleteOrder, { isLoading }] = useDeleteOrderMutation();

  const handleDelete = async () => {
    try {
      await deleteOrder(orderId).unwrap();

      toast({
        title: "Order Cancelled",
        description: `Order ${orderNumber} has been cancelled successfully.`,
      });

      onClose();

      if (redirectAfterDelete) {
        router.push("/orders");
      }
    } catch (error: any) {
      console.error("Failed to delete order:", error);
      toast({
        title: "Delete Failed",
        description:
          error?.data?.error || "Failed to cancel order. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel order{" "}
            <span className="font-mono font-medium">{orderNumber}</span>?
            <br />
            <br />
            This action will mark the order as cancelled. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            No, Keep Order
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Cancelling..." : "Yes, Cancel Order"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
