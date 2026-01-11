/**
 * Messaging Types
 * Type definitions for the messaging system
 */

import { Timestamp } from "firebase/firestore";

/**
 * Message participant information
 */
export interface MessageParticipant {
  userId: string;
  role: "client" | "admin";
  fullName: string;
  avatarUrl?: string;
}

/**
 * Last message preview for conversation list
 */
export interface LastMessage {
  text: string;
  senderId: string;
  senderName: string;
  senderRole?: "client" | "admin";
  timestamp: Timestamp;
  type: MessageType;
}

/**
 * Conversation metadata
 */
export interface ConversationMetadata {
  subject?: string;
  priority?: "normal" | "high" | "urgent";
  tags?: string[];
}

/**
 * Conversation status
 */
export type ConversationStatus = "active" | "archived" | "closed";

/**
 * Message type
 */
export type MessageType = "text" | "image" | "document" | "system";

/**
 * Message status
 */
export type MessageStatus = "sent" | "delivered" | "read";

/**
 * Conversation document
 */
export interface Conversation {
  conversationId: string;
  participants: MessageParticipant[];
  clientId: string;
  adminId: string;
  orderId?: string;
  orderNumber?: string;
  lastMessage?: LastMessage;
  unreadCount: Record<string, number>; // { [userId]: count }
  status: ConversationStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  metadata?: ConversationMetadata;
}

/**
 * Message attachment
 */
export interface MessageAttachment {
  type: "image" | "document" | "video";
  url: string;
  name: string;
  size?: number;
  mimeType?: string;
}

/**
 * Read receipt
 */
export interface ReadReceipt {
  userId: string;
  readAt: Timestamp;
}

/**
 * Reply reference
 */
export interface ReplyTo {
  messageId: string;
  text: string;
  senderName: string;
}

/**
 * Message document
 */
export interface Message {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: "client" | "admin";
  senderAvatar?: string;
  text: string;
  type: MessageType;
  attachments?: MessageAttachment[];
  status: MessageStatus;
  createdAt: Timestamp;
  deliveredAt?: Timestamp;
  readAt?: Timestamp;
  readBy?: ReadReceipt[];
  isDeleted: boolean;
  deletedAt?: Timestamp;
  replyTo?: ReplyTo;
  isSystemMessage: boolean;
}

// ============================================================================
// Input Types for API Operations
// ============================================================================

/**
 * Create conversation input
 */
export interface CreateConversationInput {
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  adminId: string;
  adminName: string;
  adminAvatar?: string;
  orderId?: string;
  orderNumber?: string;
  subject?: string;
  priority?: "normal" | "high" | "urgent";
}

/**
 * Send message input
 */
export interface SendMessageInput {
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: "admin";
  senderAvatar?: string;
  text: string;
  type?: MessageType;
  attachments?: MessageAttachment[];
  recipientId: string;
  replyTo?: ReplyTo;
}

/**
 * Mark as read input
 */
export interface MarkAsReadInput {
  conversationId: string;
  userId: string;
}

/**
 * Update conversation input
 */
export interface UpdateConversationInput {
  conversationId: string;
  status?: ConversationStatus;
  metadata?: Partial<ConversationMetadata>;
}

// ============================================================================
// Serialized Types (for Redux store - timestamps as strings)
// ============================================================================

/**
 * Serialized last message (timestamps as ISO strings)
 */
export interface SerializedLastMessage {
  text: string;
  senderId: string;
  senderName: string;
  senderRole?: "client" | "admin";
  timestamp: string;
  type: MessageType;
}

/**
 * Serialized conversation (timestamps as ISO strings)
 */
export interface SerializedConversation {
  conversationId: string;
  participants: MessageParticipant[];
  clientId: string;
  adminId: string;
  orderId?: string;
  orderNumber?: string;
  lastMessage?: SerializedLastMessage;
  unreadCount: Record<string, number>;
  status: ConversationStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  metadata?: ConversationMetadata;
}

/**
 * Serialized message (timestamps as ISO strings)
 */
export interface SerializedMessage {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: "client" | "admin";
  senderAvatar?: string;
  text: string;
  type: MessageType;
  attachments?: MessageAttachment[];
  status: MessageStatus;
  createdAt: string;
  deliveredAt?: string;
  readAt?: string;
  readBy?: { userId: string; readAt: string }[];
  isDeleted: boolean;
  deletedAt?: string;
  replyTo?: ReplyTo;
  isSystemMessage: boolean;
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Get conversations response
 */
export interface GetConversationsResponse {
  conversations: SerializedConversation[];
  total: number;
}

/**
 * Get messages response
 */
export interface GetMessagesResponse {
  messages: SerializedMessage[];
  conversationId: string;
}

/**
 * Unread count response
 */
export interface UnreadCountResponse {
  total: number;
  byConversation: Record<string, number>;
}

// ============================================================================
// Filter Types
// ============================================================================

/**
 * Conversation filters
 */
export interface ConversationFilters {
  status?: ConversationStatus;
  hasOrder?: boolean;
  priority?: "normal" | "high" | "urgent";
  searchQuery?: string;
}
