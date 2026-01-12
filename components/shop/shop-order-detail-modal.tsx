"use client";

import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Package,
  User,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShopOrder,
  ORDER_STATUSES,
  OrderStatus,
} from "@/lib/redux/api/shopApi";

interface ShopOrderDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: ShopOrder;
  onConfirm?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
}

export default function ShopOrderDetailModal({
  open,
  onOpenChange,
  order,
  onConfirm,
  onComplete,
  onCancel,
}: ShopOrderDetailModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "XAF",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = ORDER_STATUSES.find((s) => s.value === status);
    if (!statusConfig) return null;

    const icons: Record<OrderStatus, React.ReactNode> = {
      pending: <Clock className="h-3 w-3 mr-1" />,
      confirmed: <AlertCircle className="h-3 w-3 mr-1" />,
      completed: <CheckCircle2 className="h-3 w-3 mr-1" />,
      cancelled: <XCircle className="h-3 w-3 mr-1" />,
    };

    return (
      <Badge className={`${statusConfig.color} flex items-center`}>
        {icons[status]}
        {statusConfig.label}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order {order.orderId}</span>
            {getStatusBadge(order.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="font-semibold">Customer Information</h3>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{order.clientName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${order.clientEmail}`}
                  className="text-primary hover:underline"
                >
                  {order.clientEmail}
                </a>
              </div>
              {order.clientPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${order.clientPhone}`}
                    className="text-primary hover:underline"
                  >
                    {order.clientPhone}
                  </a>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Order Items ({order.items.length})
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="h-10 w-10 rounded-md object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <span className="font-medium">{item.productName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.price)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.subtotal)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-semibold">
                    Total
                  </TableCell>
                  <TableCell className="text-right text-lg font-bold">
                    {formatCurrency(order.totalAmount)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Notes */}
          {order.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold">Notes</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {order.notes}
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Order Timeline
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Placed</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              {order.confirmedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Confirmed</span>
                  <span>{formatDate(order.confirmedAt)}</span>
                </div>
              )}
              {order.completedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span>{formatDate(order.completedAt)}</span>
                </div>
              )}
              {order.cancelledAt && (
                <div className="flex justify-between text-destructive">
                  <span>Cancelled</span>
                  <span>{formatDate(order.cancelledAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {order.status === "pending" && onConfirm && (
              <Button onClick={onConfirm}>
                <AlertCircle className="mr-2 h-4 w-4" />
                Confirm Order
              </Button>
            )}
            {(order.status === "pending" || order.status === "confirmed") &&
              onComplete && (
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={onComplete}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark Complete
                </Button>
              )}
            {order.status !== "cancelled" &&
              order.status !== "completed" &&
              onCancel && (
                <Button variant="destructive" onClick={onCancel}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Order
                </Button>
              )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
