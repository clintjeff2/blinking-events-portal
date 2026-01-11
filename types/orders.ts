/**
 * Orders Module - TypeScript Type Definitions
 *
 * Comprehensive types for the unified orders system supporting 4 order types:
 * 1. Event Bookings - Full event planning with services and staff
 * 2. Service Bookings - Direct service package bookings
 * 3. Staff Bookings - Individual staff member hiring
 * 4. Offer Redemptions - Special promotional offer claims
 *
 * @created January 8, 2026
 * @version 1.0.0
 */

import { Timestamp } from "firebase/firestore";

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export const ORDER_TYPES = {
  EVENT: "event",
  SERVICE: "service",
  STAFF: "staff",
  OFFER: "offer",
} as const;

export const ORDER_STATUSES = {
  PENDING: "pending",
  QUOTED: "quoted",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export const EVENT_TYPES = {
  WEDDING: "wedding",
  CORPORATE: "corporate",
  CULTURAL: "cultural",
  SOCIAL: "social",
  BIRTHDAY: "birthday",
  CONFERENCE: "conference",
} as const;

export const PAYMENT_METHODS = {
  CASH: "cash",
  BANK_TRANSFER: "bank_transfer",
  MOBILE_MONEY: "mobile_money",
  CARD: "card",
} as const;

export const PAYMENT_STATUSES = {
  PENDING: "pending",
  PARTIAL: "partial",
  COMPLETED: "completed",
  REFUNDED: "refunded",
} as const;

export const TIMELINE_STATUSES = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
} as const;

export const MESSAGE_SENDER_ROLES = {
  CLIENT: "client",
  ADMIN: "admin",
  STAFF: "staff",
} as const;

export const ATTACHMENT_TYPES = {
  IMAGE: "image",
  DOCUMENT: "document",
  VIDEO: "video",
} as const;

// ============================================================================
// TYPE ALIASES
// ============================================================================

export type OrderType = (typeof ORDER_TYPES)[keyof typeof ORDER_TYPES];
export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];
export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];
export type PaymentMethod =
  (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];
export type PaymentStatus =
  (typeof PAYMENT_STATUSES)[keyof typeof PAYMENT_STATUSES];
export type TimelineStatus =
  (typeof TIMELINE_STATUSES)[keyof typeof TIMELINE_STATUSES];
export type MessageSenderRole =
  (typeof MESSAGE_SENDER_ROLES)[keyof typeof MESSAGE_SENDER_ROLES];
export type AttachmentType =
  (typeof ATTACHMENT_TYPES)[keyof typeof ATTACHMENT_TYPES];

// ============================================================================
// COMMON INTERFACES
// ============================================================================

export interface ClientInfo {
  fullName: string;
  email: string;
  phone: string;
}

export interface Venue {
  name: string;
  address: string;
  city: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface BudgetRange {
  min: number;
  max: number;
  currency: string; // Default: 'XAF'
}

export interface StatusHistoryItem {
  status: OrderStatus;
  changedAt: Timestamp;
  changedBy: string; // User ID
  changedByName?: string; // User display name
  notes: string;
}

export interface QuoteBreakdownItem {
  item: string;
  description?: string;
  amount: number;
}

export interface OrderQuote {
  total: number;
  currency: string;
  breakdown: QuoteBreakdownItem[];
  discount?: number; // Amount or percentage
  finalAmount: number;
  validUntil?: Timestamp;
  sentAt: Timestamp;
  sentBy: string; // Admin ID or name
}

export interface PaymentTransaction {
  amount: number;
  method: PaymentMethod;
  reference: string; // Transaction ID
  date: Timestamp;
  verifiedBy?: string;
  receiptUrl?: string;
}

export interface OrderPayment {
  method: PaymentMethod;
  status: PaymentStatus;
  amountPaid: number;
  amountDue: number;
  transactions: PaymentTransaction[];
}

export interface TimelineMilestone {
  milestone: string;
  description: string;
  dueDate: Timestamp;
  status: TimelineStatus;
  completedAt?: Timestamp;
}

export interface OrderRating {
  score: number; // 1-5
  review: string;
  createdAt: Timestamp;
}

// ============================================================================
// ORDER TYPE-SPECIFIC DETAILS
// ============================================================================

export interface EventDetails {
  eventType: EventType;
  eventDate: Timestamp;
  eventTime: string; // Format: "HH:MM"
  venue: Venue;
  guestCount: number;
  description?: string;
}

export interface ServiceRequest {
  serviceId: string;
  serviceName: string;
  packageId?: string;
  packageName?: string;
  quantity: number;
}

export interface StaffRequest {
  staffProfileId: string;
  staffName: string;
  role: string;
  quantity: number;
}

export interface ServiceDetails {
  serviceId: string;
  serviceName: string;
  category: string;
  packageId?: string;
  packageName?: string;
  packageFeatures?: string[];
  customRequirements?: string;
}

export interface ServiceDuration {
  value: number;
  unit: "hours" | "days" | "weeks";
}

export interface StaffDetails {
  staffProfileId: string;
  staffName: string;
  role: string;
  skills: string[];
  photoUrl?: string;
}

export interface BookingDuration {
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  hours: number;
}

export interface OfferDetails {
  offerId: string;
  offerTitle: string;
  offerDescription: string;
  discount: string; // e.g., "20%" or "50,000 XAF"
  originalPrice?: number;
  discountedPrice?: number;
  validTo: Timestamp;
  redemptionCode?: string;
}

export interface AppliedService {
  serviceId: string;
  serviceName: string;
}

// ============================================================================
// BASE ORDER INTERFACE
// ============================================================================

export interface BaseOrder {
  orderId: string;
  orderNumber: string; // Format: "ORD-001", "ORD-002", etc.
  clientId: string;
  clientInfo: ClientInfo;
  orderType: OrderType;
  status: OrderStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  statusHistory: StatusHistoryItem[];
  quote?: OrderQuote;
  payment?: OrderPayment;
  timeline?: TimelineMilestone[];
  documents?: string[]; // Array of Cloudinary URLs
  assignedTo?: string[]; // Array of admin user IDs
  adminNotes?: string;
  clientNotes?: string;
  rating?: OrderRating;
  cancellationReason?: string;
  refundAmount?: number;
}

// ============================================================================
// ORDER TYPE INTERFACES (Discriminated Union)
// ============================================================================

export interface EventOrder extends BaseOrder {
  orderType: "event";
  eventDetails: EventDetails;
  servicesRequested: ServiceRequest[];
  staffRequested: StaffRequest[];
  budgetRange?: BudgetRange;
  specialRequirements?: string;
}

export interface ServiceOrder extends BaseOrder {
  orderType: "service";
  serviceDetails: ServiceDetails;
  serviceDate?: Timestamp;
  duration?: ServiceDuration;
  budgetRange?: BudgetRange;
}

export interface StaffOrder extends BaseOrder {
  orderType: "staff";
  staffDetails: StaffDetails;
  bookingDate: Timestamp;
  bookingDuration: BookingDuration;
  location: string;
  requirements?: string;
  budgetRange?: BudgetRange;
}

export interface OfferOrder extends BaseOrder {
  orderType: "offer";
  offerDetails: OfferDetails;
  appliedToService?: AppliedService;
  redemptionDate: Timestamp;
}

// ============================================================================
// UNIFIED ORDER TYPE (Discriminated Union)
// ============================================================================

export type Order = EventOrder | ServiceOrder | StaffOrder | OfferOrder;

// ============================================================================
// ORDER MESSAGES (Subcollection)
// ============================================================================

export interface MessageAttachment {
  type: AttachmentType;
  url: string;
  name: string;
}

export interface MessageSeenBy {
  userId: string;
  seenAt: Timestamp;
}

export interface OrderMessage {
  messageId: string;
  senderId: string;
  senderName: string;
  senderRole: MessageSenderRole;
  text: string;
  attachments?: MessageAttachment[];
  createdAt: Timestamp;
  seenBy: MessageSeenBy[];
  isSystemMessage?: boolean;
}

// ============================================================================
// CREATE ORDER INPUT TYPES
// ============================================================================

export interface CreateEventOrderInput {
  clientId: string;
  clientInfo: ClientInfo;
  eventDetails: EventDetails;
  servicesRequested: ServiceRequest[];
  staffRequested: StaffRequest[];
  budgetRange?: BudgetRange;
  specialRequirements?: string;
  adminNotes?: string;
}

export interface CreateServiceOrderInput {
  clientId: string;
  clientInfo: ClientInfo;
  serviceDetails: ServiceDetails;
  serviceDate?: Date;
  duration?: ServiceDuration;
  budgetRange?: BudgetRange;
  adminNotes?: string;
}

export interface CreateStaffOrderInput {
  clientId: string;
  clientInfo: ClientInfo;
  staffDetails: StaffDetails;
  bookingDate: Date;
  bookingDuration: BookingDuration;
  location: string;
  requirements?: string;
  budgetRange?: BudgetRange;
  adminNotes?: string;
}

export interface CreateOfferOrderInput {
  clientId: string;
  clientInfo: ClientInfo;
  offerDetails: OfferDetails;
  appliedToService?: AppliedService;
  redemptionDate: Date;
  adminNotes?: string;
}

export type CreateOrderInput =
  | CreateEventOrderInput
  | CreateServiceOrderInput
  | CreateStaffOrderInput
  | CreateOfferOrderInput;

// ============================================================================
// UPDATE ORDER INPUT TYPES
// ============================================================================

export interface UpdateOrderStatusInput {
  orderId: string;
  status: OrderStatus;
  notes: string;
  changedBy: string;
  changedByName?: string; // Display name for the user making the change
}

export interface UpdateEventOrderInput {
  orderId: string;
  eventDetails?: Partial<EventDetails>;
  servicesRequested?: ServiceRequest[];
  staffRequested?: StaffRequest[];
  budgetRange?: BudgetRange;
  specialRequirements?: string;
  adminNotes?: string;
}

export interface UpdateServiceOrderInput {
  orderId: string;
  serviceDetails?: Partial<ServiceDetails>;
  serviceDate?: Date;
  duration?: ServiceDuration;
  budgetRange?: BudgetRange;
  adminNotes?: string;
}

export interface UpdateStaffOrderInput {
  orderId: string;
  staffDetails?: Partial<StaffDetails>;
  bookingDate?: Date;
  bookingDuration?: BookingDuration;
  location?: string;
  requirements?: string;
  budgetRange?: BudgetRange;
  adminNotes?: string;
}

export interface UpdateOfferOrderInput {
  orderId: string;
  offerDetails?: Partial<OfferDetails>;
  appliedToService?: AppliedService;
  adminNotes?: string;
}

export type UpdateOrderInput =
  | UpdateEventOrderInput
  | UpdateServiceOrderInput
  | UpdateStaffOrderInput
  | UpdateOfferOrderInput;

// ============================================================================
// QUOTE INPUT TYPES
// ============================================================================

export interface CreateQuoteInput {
  orderId: string;
  breakdown: QuoteBreakdownItem[];
  discount?: number;
  validUntil?: Date;
  sentBy: string;
}

export interface UpdateQuoteInput extends CreateQuoteInput {
  quoteId?: string; // For tracking quote versions
}

// ============================================================================
// PAYMENT INPUT TYPES
// ============================================================================

export interface AddPaymentInput {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  date: Date;
  verifiedBy?: string;
  receiptUrl?: string;
}

// ============================================================================
// TIMELINE INPUT TYPES
// ============================================================================

export interface AddTimelineMilestoneInput {
  orderId: string;
  milestone: string;
  description: string;
  dueDate: Date;
}

export interface UpdateTimelineMilestoneInput {
  orderId: string;
  milestoneIndex: number;
  status: TimelineStatus;
  completedAt?: Date;
}

// ============================================================================
// MESSAGE INPUT TYPES
// ============================================================================

export interface SendMessageInput {
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: MessageSenderRole;
  text: string;
  attachments?: MessageAttachment[];
  isSystemMessage?: boolean;
}

export interface MarkMessagesSeenInput {
  orderId: string;
  messageIds: string[];
  userId: string;
}

// ============================================================================
// ASSIGNMENT INPUT TYPES
// ============================================================================

export interface AssignOrderInput {
  orderId: string;
  adminIds: string[];
  assignedBy: string;
}

// ============================================================================
// CANCELLATION INPUT TYPES
// ============================================================================

export interface CancelOrderInput {
  orderId: string;
  reason: string;
  cancelledBy: string;
  refundAmount?: number;
}

// ============================================================================
// FILTER & SEARCH TYPES
// ============================================================================

export interface OrderFilters {
  orderType?: OrderType | "all";
  status?: OrderStatus | "all";
  clientId?: string;
  assignedTo?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  searchQuery?: string; // Search by order number, client name, email
}

export interface OrderSortOptions {
  field:
    | "createdAt"
    | "updatedAt"
    | "orderNumber"
    | "status"
    | "quote.finalAmount";
  direction: "asc" | "desc";
}

export interface OrderPaginationOptions {
  limit: number;
  offset: number;
  cursor?: string; // For cursor-based pagination
}

// ============================================================================
// QUERY RESULT TYPES
// ============================================================================

export interface OrdersQueryResult {
  orders: Order[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface OrderMessagesQueryResult {
  messages: OrderMessage[];
  total: number;
  hasMore: boolean;
  unreadCount: number;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface OrderTypeMetrics {
  event: number;
  service: number;
  staff: number;
  offer: number;
  total: number;
}

export interface OrderStatusMetrics {
  pending: number;
  quoted: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  total: number;
}

export interface RevenueMetrics {
  totalRevenue: number;
  averageOrderValue: number;
  revenueByType: {
    event: number;
    service: number;
    staff: number;
    offer: number;
  };
  revenueByMonth: Array<{
    month: string;
    revenue: number;
  }>;
}

export interface ConversionMetrics {
  pendingToQuoted: number;
  quotedToConfirmed: number;
  confirmedToCompleted: number;
  overallConversion: number;
}

export interface OrderAnalytics {
  orderTypeMetrics: OrderTypeMetrics;
  orderStatusMetrics: OrderStatusMetrics;
  revenueMetrics: RevenueMetrics;
  conversionMetrics: ConversionMetrics;
  cancellationRate: number;
  averageTimeToComplete: number; // In days
  topServices: Array<{ serviceId: string; serviceName: string; count: number }>;
  topStaff: Array<{
    staffProfileId: string;
    staffName: string;
    count: number;
  }>;
}

// ============================================================================
// HELPER TYPE GUARDS
// ============================================================================

export function isEventOrder(order: Order): order is EventOrder {
  return order.orderType === "event";
}

export function isServiceOrder(order: Order): order is ServiceOrder {
  return order.orderType === "service";
}

export function isStaffOrder(order: Order): order is StaffOrder {
  return order.orderType === "staff";
}

export function isOfferOrder(order: Order): order is OfferOrder {
  return order.orderType === "offer";
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["quoted", "confirmed", "cancelled"],
  quoted: ["confirmed", "cancelled", "pending"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function canTransitionStatus(
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): boolean {
  return ALLOWED_STATUS_TRANSITIONS[currentStatus].includes(newStatus);
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending Review",
  quoted: "Quote Sent",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  event: "Event Booking",
  service: "Service Booking",
  staff: "Staff Booking",
  offer: "Offer Redemption",
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  wedding: "Wedding",
  corporate: "Corporate Event",
  cultural: "Cultural Ceremony",
  social: "Social Event",
  birthday: "Birthday Party",
  conference: "Conference",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  bank_transfer: "Bank Transfer",
  mobile_money: "Mobile Money",
  card: "Card Payment",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Payment Pending",
  partial: "Partially Paid",
  completed: "Fully Paid",
  refunded: "Refunded",
};
