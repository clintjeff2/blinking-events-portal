/**
 * Notification Types
 * Type definitions for the push notification system
 *
 * @created January 10, 2026
 * @version 1.0.0
 */

import { Timestamp } from "firebase/firestore";

// ============================================================================
// Enums and Constants
// ============================================================================

/**
 * Notification types - categorizes the purpose of the notification
 */
export type NotificationType =
  | "order" // Order-related updates (new orders, status changes, quotes)
  | "message" // New messages in conversations
  | "promo" // Promotional notifications and special offers
  | "reminder" // Event reminders and upcoming deadlines
  | "info" // General information and announcements
  | "system" // System notifications (maintenance, updates)
  | "payment" // Payment-related notifications
  | "staff"; // Staff assignments and updates

/**
 * Notification priority levels
 */
export type NotificationPriority = "low" | "normal" | "high" | "urgent";

/**
 * Notification status
 */
export type NotificationStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "failed"
  | "cancelled";

/**
 * Target audience types for broadcast notifications
 */
export type TargetAudience =
  | "all" // All users with push tokens
  | "clients" // All clients
  | "active_clients" // Clients with recent activity
  | "vip_clients" // VIP/premium clients
  | "new_users" // Users who joined recently
  | "staff" // All staff members
  | "admins" // All admins
  | "custom"; // Custom user list

/**
 * Notification channel (where/how it's delivered)
 */
export type NotificationChannel = "push" | "in_app" | "email" | "sms";

// ============================================================================
// Core Interfaces
// ============================================================================

/**
 * Reference data for deep linking from notifications
 */
export interface NotificationReference {
  type:
    | "order"
    | "conversation"
    | "service"
    | "event"
    | "staff"
    | "offer"
    | "url";
  id?: string;
  url?: string;
  metadata?: Record<string, string>;
}

/**
 * Notification action button
 */
export interface NotificationAction {
  id: string;
  title: string;
  action: string; // Deep link or action identifier
  icon?: string;
}

/**
 * Notification document (stored in Firestore)
 */
export interface Notification {
  notificationId: string;

  // Content
  title: string;
  body: string;
  imageUrl?: string;

  // Categorization
  type: NotificationType;
  priority: NotificationPriority;

  // Targeting
  recipientId?: string; // Single user (null for broadcasts)
  recipientIds?: string[]; // Multiple specific users
  targetAudience?: TargetAudience; // Broadcast target

  // Deep linking
  reference?: NotificationReference;
  actions?: NotificationAction[];

  // Delivery info
  channels: NotificationChannel[];
  status: NotificationStatus;
  sentAt?: Timestamp;
  deliveredAt?: Timestamp;
  failureReason?: string;

  // Tracking
  isRead: boolean;
  readAt?: Timestamp;
  clickedAt?: Timestamp;

  // Scheduling
  scheduledFor?: Timestamp;

  // Metadata
  senderId: string; // Admin who created
  senderName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Stats (for broadcasts)
  stats?: NotificationStats;
}

/**
 * Notification statistics for broadcast notifications
 */
export interface NotificationStats {
  totalRecipients: number;
  delivered: number;
  failed: number;
  opened: number;
  clicked: number;
}

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  userId: string;

  // Channel preferences
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;

  // Type preferences (which types to receive)
  orderNotifications: boolean;
  messageNotifications: boolean;
  promoNotifications: boolean;
  reminderNotifications: boolean;
  infoNotifications: boolean;

  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // "22:00" format
  quietHoursEnd?: string; // "07:00" format

  // Updated
  updatedAt: Timestamp;
}

/**
 * FCM Token stored in user document
 */
export interface FCMToken {
  token: string;
  deviceId: string;
  platform: "web" | "ios" | "android";
  tokenType: "fcm" | "expo" | "apns"; // Token type for proper delivery routing
  createdAt: Timestamp;
  lastUsedAt: Timestamp;
  isActive: boolean;
  appVersion?: string;
}

// ============================================================================
// Serialized Types (for RTK Query)
// ============================================================================

/**
 * Serialized notification (dates as ISO strings)
 */
export interface SerializedNotification {
  notificationId: string;
  title: string;
  body: string;
  imageUrl?: string;
  type: NotificationType;
  priority: NotificationPriority;
  recipientId?: string;
  recipientIds?: string[];
  targetAudience?: TargetAudience;
  reference?: NotificationReference;
  actions?: NotificationAction[];
  channels: NotificationChannel[];
  status: NotificationStatus;
  sentAt?: string;
  deliveredAt?: string;
  failureReason?: string;
  isRead: boolean;
  readAt?: string;
  clickedAt?: string;
  scheduledFor?: string;
  senderId: string;
  senderName: string;
  createdAt: string;
  updatedAt: string;
  stats?: NotificationStats;
}

// ============================================================================
// Input Types for API Operations
// ============================================================================

/**
 * Create notification input (for sending to single user)
 */
export interface CreateNotificationInput {
  title: string;
  body: string;
  imageUrl?: string;
  type: NotificationType;
  priority?: NotificationPriority;
  recipientId: string;
  reference?: NotificationReference;
  actions?: NotificationAction[];
  channels?: NotificationChannel[];
  scheduledFor?: Date;
}

/**
 * Create broadcast notification input (for sending to multiple users)
 */
export interface CreateBroadcastNotificationInput {
  title: string;
  body: string;
  imageUrl?: string;
  type: NotificationType;
  priority?: NotificationPriority;
  targetAudience: TargetAudience;
  customRecipientIds?: string[]; // For "custom" audience
  reference?: NotificationReference;
  actions?: NotificationAction[];
  channels?: NotificationChannel[];
  scheduledFor?: Date;
}

/**
 * Send order notification input
 */
export interface SendOrderNotificationInput {
  orderId: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  type:
    | "new_order"
    | "status_update"
    | "quote_sent"
    | "payment_received"
    | "reminder";
  status?: string;
  additionalMessage?: string;
}

/**
 * Send message notification input
 */
export interface SendMessageNotificationInput {
  conversationId: string;
  recipientId: string;
  senderName: string;
  messagePreview: string;
  orderId?: string;
  orderNumber?: string;
}

/**
 * Query filters for notifications
 */
export interface NotificationFilters {
  type?: NotificationType;
  status?: NotificationStatus;
  priority?: NotificationPriority;
  targetAudience?: TargetAudience;
  senderId?: string;
  fromDate?: Date;
  toDate?: Date;
  searchQuery?: string;
}

/**
 * Paginated notifications result
 */
export interface NotificationsQueryResult {
  notifications: SerializedNotification[];
  total: number;
  hasMore: boolean;
  lastDoc?: string;
}

/**
 * Notification analytics
 */
export interface NotificationAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  openRate: number;
  clickRate: number;
  byType: Record<NotificationType, number>;
  byChannel: Record<NotificationChannel, number>;
  trend: {
    date: string;
    sent: number;
    delivered: number;
    opened: number;
  }[];
}

/**
 * Register FCM token input
 */
export interface RegisterFCMTokenInput {
  userId: string;
  token: string;
  deviceId: string;
  platform: "web" | "ios" | "android";
}

/**
 * Update notification preferences input
 */
export interface UpdateNotificationPreferencesInput {
  userId: string;
  preferences: Partial<Omit<NotificationPreferences, "userId" | "updatedAt">>;
}

// ============================================================================
// Push Notification Payload Types
// ============================================================================

/**
 * FCM message payload structure
 */
export interface FCMMessagePayload {
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  };
  data: {
    notificationId: string;
    type: NotificationType;
    referenceType?: string;
    referenceId?: string;
    url?: string;
    [key: string]: string | undefined;
  };
  token?: string; // Single device
  tokens?: string[]; // Multiple devices
  topic?: string; // Topic-based
  condition?: string; // Condition-based
}

/**
 * Template for notification messages
 */
export interface NotificationTemplate {
  templateId: string;
  name: string;
  type: NotificationType;
  titleTemplate: string; // e.g., "Order {{orderNumber}} Update"
  bodyTemplate: string; // e.g., "Your order status is now {{status}}"
  variables: string[]; // ["orderNumber", "status"]
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
