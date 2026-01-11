/**
 * Orders Constants
 *
 * Centralized constants for the orders system
 *
 * @created January 8, 2026
 */

// ============================================================================
// ORDER CONFIGURATION
// ============================================================================

export const ORDER_CONFIG = {
  // Order number prefix
  ORDER_PREFIX: "ORD",

  // Order number padding length
  ORDER_NUMBER_LENGTH: 3,

  // Default currency
  DEFAULT_CURRENCY: "XAF",

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Quote validity (days)
  QUOTE_VALIDITY_DAYS: 30,

  // Maximum discount percentage
  MAX_DISCOUNT_PERCENT: 100,

  // Payment deposit minimum (percentage)
  MIN_DEPOSIT_PERCENT: 30,

  // Messages per page
  MESSAGES_PAGE_SIZE: 50,

  // Timeline milestones max
  MAX_TIMELINE_MILESTONES: 20,

  // Staff per order max
  MAX_STAFF_PER_ORDER: 50,

  // Services per order max
  MAX_SERVICES_PER_ORDER: 20,
} as const;

// ============================================================================
// STATUS TRANSITIONS
// ============================================================================

export const STATUS_TRANSITIONS = {
  pending: ["quoted", "confirmed", "cancelled"],
  quoted: ["confirmed", "cancelled", "pending"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
} as const;

// ============================================================================
// NOTIFICATION TEMPLATES
// ============================================================================

export const NOTIFICATION_TEMPLATES = {
  ORDER_CREATED: {
    title: "New Order Created",
    message: "Order {{orderNumber}} has been created for {{clientName}}.",
  },
  ORDER_QUOTED: {
    title: "Quote Sent",
    message: "A quote of {{amount}} has been sent for order {{orderNumber}}.",
  },
  ORDER_CONFIRMED: {
    title: "Order Confirmed",
    message: "Order {{orderNumber}} has been confirmed and is now in progress.",
  },
  ORDER_COMPLETED: {
    title: "Order Completed",
    message: "Order {{orderNumber}} has been successfully completed.",
  },
  ORDER_CANCELLED: {
    title: "Order Cancelled",
    message: "Order {{orderNumber}} has been cancelled. Reason: {{reason}}",
  },
  PAYMENT_RECEIVED: {
    title: "Payment Received",
    message: "Payment of {{amount}} received for order {{orderNumber}}.",
  },
  NEW_MESSAGE: {
    title: "New Message",
    message: "You have a new message on order {{orderNumber}}.",
  },
} as const;

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

export const EMAIL_TEMPLATES = {
  QUOTE_SENT: {
    subject: "Quote for Order {{orderNumber}} - Blinking Events",
    preview: "Your quote is ready",
  },
  ORDER_CONFIRMED: {
    subject: "Order {{orderNumber}} Confirmed - Blinking Events",
    preview: "Your order has been confirmed",
  },
  PAYMENT_RECEIPT: {
    subject: "Payment Receipt - Order {{orderNumber}}",
    preview: "Payment confirmation",
  },
} as const;

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const VALIDATION_RULES = {
  // Client info
  CLIENT_NAME_MIN_LENGTH: 2,
  CLIENT_NAME_MAX_LENGTH: 100,
  CLIENT_EMAIL_MAX_LENGTH: 255,
  CLIENT_PHONE_MIN_LENGTH: 9,
  CLIENT_PHONE_MAX_LENGTH: 15,

  // Event details
  EVENT_GUEST_COUNT_MIN: 1,
  EVENT_GUEST_COUNT_MAX: 10000,
  VENUE_NAME_MAX_LENGTH: 200,

  // Quote
  QUOTE_ITEM_NAME_MAX_LENGTH: 200,
  QUOTE_NOTES_MAX_LENGTH: 1000,
  QUOTE_BREAKDOWN_MAX_ITEMS: 50,

  // Payment
  PAYMENT_REFERENCE_MAX_LENGTH: 100,
  PAYMENT_NOTES_MAX_LENGTH: 500,

  // Messages
  MESSAGE_MAX_LENGTH: 2000,

  // Timeline
  MILESTONE_TITLE_MAX_LENGTH: 200,
  MILESTONE_DESCRIPTION_MAX_LENGTH: 500,

  // Special requests
  SPECIAL_REQUESTS_MAX_LENGTH: 2000,
} as const;

// ============================================================================
// UI DISPLAY
// ============================================================================

export const UI_CONFIG = {
  // Badge colors - matching Tailwind classes
  STATUS_COLORS: {
    pending: "yellow",
    quoted: "blue",
    confirmed: "green",
    completed: "gray",
    cancelled: "red",
  },

  TYPE_COLORS: {
    event: "red",
    service: "blue",
    staff: "amber",
    offer: "green",
  },

  // Icons (Lucide icons)
  TYPE_ICONS: {
    event: "Calendar",
    service: "Package",
    staff: "Users",
    offer: "Tag",
  },

  STATUS_ICONS: {
    pending: "Clock",
    quoted: "FileText",
    confirmed: "CheckCircle",
    completed: "CheckCircle2",
    cancelled: "XCircle",
  },

  // Chart colors (for analytics)
  CHART_COLORS: {
    primary: "#3B82F6",
    secondary: "#8B5CF6",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    info: "#06B6D4",
  },
} as const;

// ============================================================================
// ANALYTICS PERIODS
// ============================================================================

export const ANALYTICS_PERIODS = {
  TODAY: "today",
  WEEK: "week",
  MONTH: "month",
  QUARTER: "quarter",
  YEAR: "year",
  ALL_TIME: "all_time",
} as const;

export const ANALYTICS_PERIOD_LABELS = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  quarter: "This Quarter",
  year: "This Year",
  all_time: "All Time",
} as const;

// ============================================================================
// SORT OPTIONS
// ============================================================================

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "amount-high", label: "Highest Amount" },
  { value: "amount-low", label: "Lowest Amount" },
  { value: "status", label: "Status Priority" },
] as const;

// ============================================================================
// FILTER OPTIONS
// ============================================================================

export const FILTER_OPTIONS = {
  types: [
    { value: "all", label: "All Types" },
    { value: "event", label: "Event Orders" },
    { value: "service", label: "Service Orders" },
    { value: "staff", label: "Staff Orders" },
    { value: "offer", label: "Offer Orders" },
  ],

  statuses: [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "quoted", label: "Quoted" },
    { value: "confirmed", label: "Confirmed" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ],
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  // Generic
  SOMETHING_WENT_WRONG: "Something went wrong. Please try again.",
  NETWORK_ERROR: "Network error. Please check your connection.",
  PERMISSION_DENIED: "You do not have permission to perform this action.",

  // Orders
  ORDER_NOT_FOUND: "Order not found.",
  INVALID_ORDER_TYPE: "Invalid order type.",
  INVALID_ORDER_STATUS: "Invalid order status.",
  CANNOT_TRANSITION_STATUS: "Cannot change status from {{from}} to {{to}}.",
  ORDER_ALREADY_CANCELLED: "This order has already been cancelled.",
  ORDER_ALREADY_COMPLETED: "This order has already been completed.",

  // Quote
  INVALID_QUOTE_BREAKDOWN: "Quote breakdown is invalid.",
  QUOTE_ALREADY_EXISTS: "A quote already exists for this order.",
  CANNOT_SEND_QUOTE: "Cannot send quote for this order status.",

  // Payment
  INVALID_PAYMENT_AMOUNT: "Invalid payment amount.",
  PAYMENT_EXCEEDS_TOTAL: "Payment amount exceeds order total.",
  CANNOT_ADD_PAYMENT: "Cannot add payment for this order status.",

  // Validation
  REQUIRED_FIELD: "{{field}} is required.",
  INVALID_EMAIL: "Invalid email address.",
  INVALID_PHONE: "Invalid phone number.",
  MIN_LENGTH: "{{field}} must be at least {{min}} characters.",
  MAX_LENGTH: "{{field}} must not exceed {{max}} characters.",
  MIN_VALUE: "{{field}} must be at least {{min}}.",
  MAX_VALUE: "{{field}} must not exceed {{max}}.",
} as const;

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  ORDER_CREATED: "Order created successfully!",
  ORDER_UPDATED: "Order updated successfully!",
  ORDER_DELETED: "Order deleted successfully!",
  QUOTE_SENT: "Quote sent successfully!",
  PAYMENT_ADDED: "Payment recorded successfully!",
  MESSAGE_SENT: "Message sent successfully!",
  STATUS_CHANGED: "Order status updated successfully!",
  ORDER_ASSIGNED: "Order assigned successfully!",
  ORDER_CANCELLED: "Order cancelled successfully!",
} as const;

// ============================================================================
// EXPORT ALL
// ============================================================================

export const OrderConstants = {
  CONFIG: ORDER_CONFIG,
  STATUS_TRANSITIONS,
  NOTIFICATION_TEMPLATES,
  EMAIL_TEMPLATES,
  VALIDATION_RULES,
  UI_CONFIG,
  ANALYTICS_PERIODS,
  ANALYTICS_PERIOD_LABELS,
  SORT_OPTIONS,
  FILTER_OPTIONS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} as const;
