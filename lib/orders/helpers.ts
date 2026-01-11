/**
 * Orders Helper Functions
 *
 * Utility functions for order management, formatting, and validation
 *
 * @created January 8, 2026
 * @version 1.0.0
 */

import { Timestamp } from "firebase/firestore";
import type {
  Order,
  EventOrder,
  ServiceOrder,
  StaffOrder,
  OfferOrder,
  OrderType,
  OrderStatus,
  OrderQuote,
  QuoteBreakdownItem,
} from "@/types/orders";
import {
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  EVENT_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
  canTransitionStatus,
  isEventOrder,
  isServiceOrder,
  isStaffOrder,
  isOfferOrder,
} from "@/types/orders";

// ============================================================================
// ORDER NUMBER FORMATTING
// ============================================================================

/**
 * Format order number with padding
 * @example formatOrderNumber(1) => "ORD-001"
 */
export function formatOrderNumber(num: number): string {
  return `ORD-${String(num).padStart(3, "0")}`;
}

/**
 * Extract number from order number string
 * @example parseOrderNumber("ORD-001") => 1
 */
export function parseOrderNumber(orderNumber: string): number {
  const match = orderNumber.match(/ORD-(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

// ============================================================================
// STATUS HELPERS
// ============================================================================

/**
 * Get color class for order status badge
 */
export function getOrderStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    pending:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    quoted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    confirmed:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    completed:
      "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return colors[status] || colors.pending;
}

/**
 * Get Tailwind color for charts and visualizations
 */
export function getOrderStatusChartColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    pending: "#FCD34D", // Yellow
    quoted: "#60A5FA", // Blue
    confirmed: "#34D399", // Green
    completed: "#9CA3AF", // Gray
    cancelled: "#F87171", // Red
  };

  return colors[status] || colors.pending;
}

/**
 * Get status label
 */
export function getOrderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status];
}

/**
 * Check if status can be changed
 */
export function canChangeOrderStatus(
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): boolean {
  return canTransitionStatus(currentStatus, newStatus);
}

/**
 * Get next possible statuses
 */
export function getNextStatuses(currentStatus: OrderStatus): OrderStatus[] {
  const transitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ["quoted", "confirmed", "cancelled"],
    quoted: ["confirmed", "cancelled", "pending"],
    confirmed: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };

  return transitions[currentStatus] || [];
}

// ============================================================================
// ORDER TYPE HELPERS
// ============================================================================

/**
 * Get color class for order type badge
 */
export function getOrderTypeBadgeColor(type: OrderType): string {
  const colors: Record<OrderType, string> = {
    event: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    service: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    staff:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    offer:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  };

  return colors[type];
}

/**
 * Get icon name for order type
 */
export function getOrderTypeIcon(type: OrderType): string {
  const icons: Record<OrderType, string> = {
    event: "Calendar",
    service: "Package",
    staff: "Users",
    offer: "Tag",
  };

  return icons[type];
}

/**
 * Get type label
 */
export function getOrderTypeLabel(type: OrderType): string {
  return ORDER_TYPE_LABELS[type];
}

// ============================================================================
// DATE HELPERS
// ============================================================================

/**
 * Get relevant display date for order based on type
 */
export function getOrderDisplayDate(order: Order): Date | null {
  if (isEventOrder(order)) {
    return order.eventDetails.eventDate.toDate();
  }

  if (isServiceOrder(order) && order.serviceDate) {
    return order.serviceDate.toDate();
  }

  if (isStaffOrder(order)) {
    return order.bookingDate.toDate();
  }

  if (isOfferOrder(order)) {
    return order.redemptionDate.toDate();
  }

  return null;
}

/**
 * Format date for display
 */
export function formatOrderDate(date: Timestamp | Date | null): string {
  if (!date) return "N/A";

  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(dateObj);
}

/**
 * Format date and time
 */
export function formatOrderDateTime(date: Timestamp | Date): string {
  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
}

/**
 * Get relative time (e.g., "2 days ago")
 */
export function getRelativeTime(date: Timestamp | Date): string {
  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

// ============================================================================
// CURRENCY HELPERS
// ============================================================================

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number,
  currency: string = "XAF"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format currency without symbol
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

// ============================================================================
// QUOTE HELPERS
// ============================================================================

/**
 * Calculate quote total
 */
export function calculateQuoteTotal(breakdown: QuoteBreakdownItem[]): number {
  return breakdown.reduce((sum, item) => sum + item.amount, 0);
}

/**
 * Calculate final amount after discount
 */
export function calculateFinalAmount(
  total: number,
  discount: number = 0
): number {
  return total - discount;
}

/**
 * Validate quote breakdown
 */
export function validateQuoteBreakdown(
  breakdown: QuoteBreakdownItem[]
): boolean {
  if (!breakdown || breakdown.length === 0) return false;

  return breakdown.every(
    (item) =>
      item.item &&
      item.item.trim() !== "" &&
      typeof item.amount === "number" &&
      item.amount >= 0
  );
}

/**
 * Format quote summary
 */
export function formatQuoteSummary(quote: OrderQuote): string {
  const { total, discount, finalAmount, currency } = quote;
  const items = quote.breakdown.length;

  let summary = `${items} item(s) • Total: ${formatCurrency(total, currency)}`;

  if (discount && discount > 0) {
    summary += ` • Discount: -${formatCurrency(discount, currency)}`;
  }

  summary += ` • Final: ${formatCurrency(finalAmount, currency)}`;

  return summary;
}

// ============================================================================
// PAYMENT HELPERS
// ============================================================================

/**
 * Calculate payment progress percentage
 */
export function calculatePaymentProgress(
  amountPaid: number,
  total: number
): number {
  return calculatePercentage(amountPaid, total);
}

/**
 * Get payment status color
 */
export function getPaymentStatusColor(paid: number, total: number): string {
  if (paid >= total) {
    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
  }
  if (paid > 0) {
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
  }
  return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
}

/**
 * Format payment summary
 */
export function formatPaymentSummary(
  paid: number,
  due: number,
  currency: string = "XAF"
): string {
  const total = paid + due;
  const percentage = calculatePaymentProgress(paid, total);

  return `${formatCurrency(paid, currency)} of ${formatCurrency(
    total,
    currency
  )} paid (${percentage}%)`;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if order can be edited
 */
export function isOrderEditable(status: OrderStatus): boolean {
  return status === "pending" || status === "quoted";
}

/**
 * Check if order can be cancelled
 */
export function isOrderCancellable(status: OrderStatus): boolean {
  return status !== "completed" && status !== "cancelled";
}

/**
 * Check if quote can be sent
 */
export function canSendQuote(order: Order): boolean {
  return order.status === "pending" || order.status === "quoted";
}

/**
 * Check if payment can be added
 */
export function canAddPayment(order: Order): boolean {
  return order.status === "quoted" || order.status === "confirmed";
}

// ============================================================================
// ORDER DETAILS HELPERS
// ============================================================================

/**
 * Get order summary text
 */
export function getOrderSummary(order: Order): string {
  if (isEventOrder(order)) {
    const { eventType, guestCount } = order.eventDetails;
    const servicesCount = order.servicesRequested.length;
    const staffCount = order.staffRequested.length;

    return `${EVENT_TYPE_LABELS[eventType]} • ${guestCount} guests • ${servicesCount} services • ${staffCount} staff`;
  }

  if (isServiceOrder(order)) {
    const { serviceName, category } = order.serviceDetails;
    return `${serviceName} • ${category}`;
  }

  if (isStaffOrder(order)) {
    const { staffName, role } = order.staffDetails;
    return `${staffName} • ${role}`;
  }

  if (isOfferOrder(order)) {
    const { offerTitle, discount } = order.offerDetails;
    return `${offerTitle} • ${discount} off`;
  }

  return "";
}

/**
 * Get order venue/location
 */
export function getOrderLocation(order: Order): string {
  if (isEventOrder(order)) {
    return order.eventDetails.venue.name;
  }

  if (isStaffOrder(order)) {
    return order.location;
  }

  return "N/A";
}

/**
 * Get order items count (services + staff)
 */
export function getOrderItemsCount(order: Order): number {
  if (isEventOrder(order)) {
    return order.servicesRequested.length + order.staffRequested.length;
  }

  return 1;
}

// ============================================================================
// SEARCH & FILTER HELPERS
// ============================================================================

/**
 * Search orders by query (order number, client name, email)
 */
export function searchOrders(orders: Order[], query: string): Order[] {
  if (!query || query.trim() === "") return orders;

  const searchLower = query.toLowerCase();

  return orders.filter(
    (order) =>
      order.orderNumber.toLowerCase().includes(searchLower) ||
      order.clientInfo.fullName.toLowerCase().includes(searchLower) ||
      order.clientInfo.email.toLowerCase().includes(searchLower)
  );
}

/**
 * Filter orders by type
 */
export function filterOrdersByType(
  orders: Order[],
  type: OrderType | "all"
): Order[] {
  if (type === "all") return orders;
  return orders.filter((order) => order.orderType === type);
}

/**
 * Filter orders by status
 */
export function filterOrdersByStatus(
  orders: Order[],
  status: OrderStatus | "all"
): Order[] {
  if (status === "all") return orders;
  return orders.filter((order) => order.status === status);
}

/**
 * Filter orders by date range
 */
export function filterOrdersByDateRange(
  orders: Order[],
  from: Date | null,
  to: Date | null
): Order[] {
  if (!from && !to) return orders;

  return orders.filter((order) => {
    const orderDate = order.createdAt.toDate();

    if (from && orderDate < from) return false;
    if (to && orderDate > to) return false;

    return true;
  });
}

// ============================================================================
// SORTING HELPERS
// ============================================================================

/**
 * Sort orders by created date (newest first)
 */
export function sortOrdersByNewest(orders: Order[]): Order[] {
  return [...orders].sort(
    (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()
  );
}

/**
 * Sort orders by created date (oldest first)
 */
export function sortOrdersByOldest(orders: Order[]): Order[] {
  return [...orders].sort(
    (a, b) => a.createdAt.toMillis() - b.createdAt.toMillis()
  );
}

/**
 * Sort orders by amount (highest first)
 */
export function sortOrdersByAmount(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => {
    const amountA = a.quote?.finalAmount || 0;
    const amountB = b.quote?.finalAmount || 0;
    return amountB - amountA;
  });
}

/**
 * Sort orders by status priority
 */
export function sortOrdersByStatusPriority(orders: Order[]): Order[] {
  const priority: Record<OrderStatus, number> = {
    pending: 1,
    quoted: 2,
    confirmed: 3,
    completed: 4,
    cancelled: 5,
  };

  return [...orders].sort((a, b) => priority[a.status] - priority[b.status]);
}

// ============================================================================
// ANALYTICS HELPERS
// ============================================================================

/**
 * Count orders by status
 */
export function countOrdersByStatus(
  orders: Order[]
): Record<OrderStatus, number> {
  return orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<OrderStatus, number>);
}

/**
 * Count orders by type
 */
export function countOrdersByType(orders: Order[]): Record<OrderType, number> {
  return orders.reduce((acc, order) => {
    acc[order.orderType] = (acc[order.orderType] || 0) + 1;
    return acc;
  }, {} as Record<OrderType, number>);
}

/**
 * Calculate total revenue
 */
export function calculateTotalRevenue(orders: Order[]): number {
  return orders.reduce((sum, order) => {
    if (order.payment && order.payment.status === "completed") {
      return sum + order.payment.amountPaid;
    }
    return sum;
  }, 0);
}

/**
 * Calculate average order value
 */
export function calculateAverageOrderValue(orders: Order[]): number {
  const ordersWithQuotes = orders.filter((order) => order.quote);
  if (ordersWithQuotes.length === 0) return 0;

  const total = ordersWithQuotes.reduce(
    (sum, order) => sum + (order.quote?.finalAmount || 0),
    0
  );
  return Math.round(total / ordersWithQuotes.length);
}

/**
 * Calculate conversion rate
 */
export function calculateConversionRate(orders: Order[]): number {
  const total = orders.length;
  if (total === 0) return 0;

  const completed = orders.filter(
    (order) => order.status === "completed"
  ).length;
  return calculatePercentage(completed, total);
}

// ============================================================================
// EXPORT ALL HELPERS
// ============================================================================

export const OrderHelpers = {
  // Number formatting
  formatOrderNumber,
  parseOrderNumber,

  // Status helpers
  getOrderStatusColor,
  getOrderStatusChartColor,
  getOrderStatusLabel,
  canChangeOrderStatus,
  getNextStatuses,

  // Type helpers
  getOrderTypeBadgeColor,
  getOrderTypeIcon,
  getOrderTypeLabel,

  // Date helpers
  getOrderDisplayDate,
  formatOrderDate,
  formatOrderDateTime,
  getRelativeTime,

  // Currency helpers
  formatCurrency,
  formatAmount,
  calculatePercentage,

  // Quote helpers
  calculateQuoteTotal,
  calculateFinalAmount,
  validateQuoteBreakdown,
  formatQuoteSummary,

  // Payment helpers
  calculatePaymentProgress,
  getPaymentStatusColor,
  formatPaymentSummary,

  // Validation helpers
  isOrderEditable,
  isOrderCancellable,
  canSendQuote,
  canAddPayment,

  // Order details helpers
  getOrderSummary,
  getOrderLocation,
  getOrderItemsCount,

  // Search & filter helpers
  searchOrders,
  filterOrdersByType,
  filterOrdersByStatus,
  filterOrdersByDateRange,

  // Sorting helpers
  sortOrdersByNewest,
  sortOrdersByOldest,
  sortOrdersByAmount,
  sortOrdersByStatusPriority,

  // Analytics helpers
  countOrdersByStatus,
  countOrdersByType,
  calculateTotalRevenue,
  calculateAverageOrderValue,
  calculateConversionRate,
};
