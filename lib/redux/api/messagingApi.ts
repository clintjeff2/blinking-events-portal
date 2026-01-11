/**
 * Messaging API
 * RTK Query endpoints for messaging operations
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  increment,
  serverTimestamp,
  onSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { firebaseApi } from "./firebaseApi";
import { sendMessageNotification } from "./notificationsApi";
import type {
  Conversation,
  Message,
  SerializedConversation,
  SerializedMessage,
  CreateConversationInput,
  SendMessageInput,
  MarkAsReadInput,
  UpdateConversationInput,
  GetConversationsResponse,
  GetMessagesResponse,
  UnreadCountResponse,
  ConversationFilters,
} from "@/types/messaging";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert Firestore Timestamp to ISO string
 */
const timestampToString = (timestamp: Timestamp | undefined): string => {
  if (!timestamp) return new Date().toISOString();
  return timestamp.toDate().toISOString();
};

/**
 * Serialize conversation for Redux store
 */
const serializeConversation = (
  data: DocumentData,
  id: string
): SerializedConversation => {
  return {
    conversationId: id,
    participants: data.participants || [],
    clientId: data.clientId || "",
    adminId: data.adminId || "",
    orderId: data.orderId,
    orderNumber: data.orderNumber,
    lastMessage: data.lastMessage
      ? {
          text: data.lastMessage.text,
          senderId: data.lastMessage.senderId,
          senderName: data.lastMessage.senderName,
          timestamp: timestampToString(data.lastMessage.timestamp),
          type: data.lastMessage.type || "text",
        }
      : undefined,
    unreadCount: data.unreadCount || {},
    status: data.status || "active",
    createdAt: timestampToString(data.createdAt),
    updatedAt: timestampToString(data.updatedAt),
    createdBy: data.createdBy || "",
    metadata: data.metadata,
  };
};

/**
 * Serialize message for Redux store
 */
const serializeMessage = (
  data: DocumentData,
  id: string
): SerializedMessage => {
  return {
    messageId: id,
    conversationId: data.conversationId || "",
    senderId: data.senderId || "",
    senderName: data.senderName || "",
    senderRole: data.senderRole || "client",
    senderAvatar: data.senderAvatar,
    text: data.text || "",
    type: data.type || "text",
    attachments: data.attachments,
    status: data.status || "sent",
    createdAt: timestampToString(data.createdAt),
    deliveredAt: data.deliveredAt
      ? timestampToString(data.deliveredAt)
      : undefined,
    readAt: data.readAt ? timestampToString(data.readAt) : undefined,
    readBy: data.readBy?.map((r: any) => ({
      userId: r.userId,
      readAt: timestampToString(r.readAt),
    })),
    isDeleted: data.isDeleted || false,
    deletedAt: data.deletedAt ? timestampToString(data.deletedAt) : undefined,
    replyTo: data.replyTo,
    isSystemMessage: data.isSystemMessage || false,
  };
};

// ============================================================================
// API Endpoints
// ============================================================================

export const messagingApi = firebaseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ========================================================================
    // Conversations
    // ========================================================================

    /**
     * Get all conversations for an admin
     */
    getConversations: builder.query<
      GetConversationsResponse,
      { adminId: string; filters?: ConversationFilters; limitCount?: number }
    >({
      async queryFn({ adminId, filters, limitCount = 50 }) {
        try {
          const conversationsRef = collection(db, "conversations");
          let constraints: any[] = [
            where("adminId", "==", adminId),
            orderBy("updatedAt", "desc"),
          ];

          if (filters?.status) {
            constraints = [
              where("adminId", "==", adminId),
              where("status", "==", filters.status),
              orderBy("updatedAt", "desc"),
            ];
          }

          if (limitCount) {
            constraints.push(limit(limitCount));
          }

          const q = query(conversationsRef, ...constraints);
          const snapshot = await getDocs(q);

          let conversations = snapshot.docs.map((doc) =>
            serializeConversation(doc.data(), doc.id)
          );

          // Client-side filtering for search
          if (filters?.searchQuery) {
            const searchLower = filters.searchQuery.toLowerCase();
            conversations = conversations.filter(
              (conv) =>
                conv.participants.some((p) =>
                  p.fullName.toLowerCase().includes(searchLower)
                ) ||
                conv.orderNumber?.toLowerCase().includes(searchLower) ||
                conv.lastMessage?.text.toLowerCase().includes(searchLower)
            );
          }

          if (filters?.hasOrder !== undefined) {
            conversations = conversations.filter((conv) =>
              filters.hasOrder ? !!conv.orderId : !conv.orderId
            );
          }

          if (filters?.priority) {
            conversations = conversations.filter(
              (conv) => conv.metadata?.priority === filters.priority
            );
          }

          return {
            data: {
              conversations,
              total: conversations.length,
            },
          };
        } catch (error: any) {
          console.error("Error fetching conversations:", error);
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.conversations.map(({ conversationId }) => ({
                type: "Messages" as const,
                id: conversationId,
              })),
              { type: "Messages", id: "CONVERSATIONS_LIST" },
            ]
          : [{ type: "Messages", id: "CONVERSATIONS_LIST" }],
    }),

    /**
     * Get a single conversation by ID
     */
    getConversationById: builder.query<SerializedConversation, string>({
      async queryFn(conversationId) {
        try {
          const docRef = doc(db, "conversations", conversationId);
          const docSnap = await getDoc(docRef);

          if (!docSnap.exists()) {
            return {
              error: { status: "NOT_FOUND", error: "Conversation not found" },
            };
          }

          const conversation = serializeConversation(
            docSnap.data(),
            docSnap.id
          );
          return { data: conversation };
        } catch (error: any) {
          console.error("Error fetching conversation:", error);
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      providesTags: (result, error, id) => [{ type: "Messages", id }],
    }),

    /**
     * Get or create conversation
     */
    getOrCreateConversation: builder.mutation<
      SerializedConversation,
      CreateConversationInput
    >({
      async queryFn(input) {
        console.log("[getOrCreateConversation] Starting with input:", {
          clientId: input.clientId,
          clientName: input.clientName,
          adminId: input.adminId,
          adminName: input.adminName,
          orderId: input.orderId,
          orderNumber: input.orderNumber,
          priority: input.priority,
        });

        try {
          const conversationsRef = collection(db, "conversations");
          console.log(
            "[getOrCreateConversation] Got conversations collection ref"
          );

          // Check if conversation already exists
          let existingQuery;
          if (input.orderId) {
            console.log(
              "[getOrCreateConversation] Checking for existing order conversation"
            );
            // For order-specific conversation - check by orderId AND clientId
            existingQuery = query(
              conversationsRef,
              where("orderId", "==", input.orderId),
              where("clientId", "==", input.clientId),
              where("status", "==", "active")
            );
          } else {
            console.log(
              "[getOrCreateConversation] Checking for existing general conversation"
            );
            // For general conversation between client and admin (without order)
            existingQuery = query(
              conversationsRef,
              where("clientId", "==", input.clientId),
              where("adminId", "==", input.adminId),
              where("status", "==", "active")
            );
          }

          console.log(
            "[getOrCreateConversation] Executing existing conversation query..."
          );
          const existingSnapshot = await getDocs(existingQuery);
          console.log(
            "[getOrCreateConversation] Existing conversations found:",
            existingSnapshot.size
          );

          if (!existingSnapshot.empty) {
            // For general conversations (no orderId), prefer the one without an order
            if (!input.orderId) {
              // Try to find a conversation without an orderId first
              const generalConv = existingSnapshot.docs.find(
                (doc) => !doc.data().orderId
              );
              if (generalConv) {
                console.log(
                  "[getOrCreateConversation] Found existing general conversation:",
                  generalConv.id
                );
                const serialized = serializeConversation(
                  generalConv.data(),
                  generalConv.id
                );
                console.log(
                  "[getOrCreateConversation] Returning serialized conversation:",
                  serialized.conversationId
                );
                return { data: serialized };
              }
            }
            // Return first matching conversation
            const existingDoc = existingSnapshot.docs[0];
            console.log(
              "[getOrCreateConversation] Found existing conversation:",
              existingDoc.id
            );
            const serialized = serializeConversation(
              existingDoc.data(),
              existingDoc.id
            );
            console.log(
              "[getOrCreateConversation] Returning serialized conversation:",
              serialized.conversationId
            );
            return { data: serialized };
          }

          // Create new conversation
          console.log(
            "[getOrCreateConversation] No existing conversation found, creating new one..."
          );
          const now = Timestamp.now();
          const newConversation = {
            participants: [
              {
                userId: input.clientId,
                role: "client" as const,
                fullName: input.clientName,
                avatarUrl: input.clientAvatar || null,
              },
              {
                userId: input.adminId,
                role: "admin" as const,
                fullName: input.adminName,
                avatarUrl: input.adminAvatar || null,
              },
            ],
            clientId: input.clientId,
            adminId: input.adminId,
            orderId: input.orderId || null,
            orderNumber: input.orderNumber || null,
            unreadCount: {
              [input.clientId]: 0,
              [input.adminId]: 0,
            },
            status: "active" as const,
            createdAt: now,
            updatedAt: now,
            createdBy: input.adminId,
            metadata: {
              subject: input.subject || null,
              priority: input.priority || "normal",
            },
          };

          console.log(
            "[getOrCreateConversation] New conversation data prepared:",
            {
              clientId: newConversation.clientId,
              adminId: newConversation.adminId,
              status: newConversation.status,
            }
          );

          const docRef = await addDoc(conversationsRef, newConversation);
          console.log(
            "[getOrCreateConversation] New conversation created with ID:",
            docRef.id
          );

          // Also update the document with its own ID as conversationId
          await updateDoc(docRef, { conversationId: docRef.id });
          console.log(
            "[getOrCreateConversation] Updated conversation with conversationId field"
          );

          const serialized = serializeConversation(
            { ...newConversation, conversationId: docRef.id },
            docRef.id
          );
          console.log(
            "[getOrCreateConversation] Returning new serialized conversation:",
            serialized.conversationId
          );

          return { data: serialized };
        } catch (error: any) {
          console.error("[getOrCreateConversation] ERROR:", error);
          console.error(
            "[getOrCreateConversation] Error message:",
            error.message
          );
          console.error("[getOrCreateConversation] Error stack:", error.stack);
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: [{ type: "Messages", id: "CONVERSATIONS_LIST" }],
    }),

    /**
     * Update conversation (status, metadata)
     */
    updateConversation: builder.mutation<
      SerializedConversation,
      UpdateConversationInput
    >({
      async queryFn(input) {
        try {
          const docRef = doc(db, "conversations", input.conversationId);
          const updates: any = {
            updatedAt: serverTimestamp(),
          };

          if (input.status) {
            updates.status = input.status;
          }

          if (input.metadata) {
            // Merge metadata
            const docSnap = await getDoc(docRef);
            const currentMetadata = docSnap.data()?.metadata || {};
            updates.metadata = { ...currentMetadata, ...input.metadata };
          }

          await updateDoc(docRef, updates);

          // Fetch updated document
          const updatedDoc = await getDoc(docRef);
          return {
            data: serializeConversation(updatedDoc.data()!, updatedDoc.id),
          };
        } catch (error: any) {
          console.error("Error updating conversation:", error);
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: (result, error, { conversationId }) => [
        { type: "Messages", id: conversationId },
        { type: "Messages", id: "CONVERSATIONS_LIST" },
      ],
    }),

    // ========================================================================
    // Messages
    // ========================================================================

    /**
     * Get messages for a conversation
     */
    getMessages: builder.query<
      GetMessagesResponse,
      { conversationId: string; limitCount?: number }
    >({
      async queryFn({ conversationId, limitCount = 100 }) {
        try {
          const messagesRef = collection(
            db,
            "conversations",
            conversationId,
            "messages"
          );
          const q = query(
            messagesRef,
            where("isDeleted", "==", false),
            orderBy("createdAt", "asc"),
            limit(limitCount)
          );

          const snapshot = await getDocs(q);
          const messages = snapshot.docs.map((doc) =>
            serializeMessage(doc.data(), doc.id)
          );

          return {
            data: {
              messages,
              conversationId,
            },
          };
        } catch (error: any) {
          console.error("Error fetching messages:", error);
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      providesTags: (result, error, { conversationId }) => [
        { type: "Messages", id: `MESSAGES_${conversationId}` },
      ],
    }),

    /**
     * Send a message
     */
    sendMessage: builder.mutation<SerializedMessage, SendMessageInput>({
      async queryFn(input) {
        try {
          const batch = writeBatch(db);
          const now = Timestamp.now();

          // Create message document
          const messagesRef = collection(
            db,
            "conversations",
            input.conversationId,
            "messages"
          );
          const messageDocRef = doc(messagesRef);

          const messageData = {
            conversationId: input.conversationId,
            senderId: input.senderId,
            senderName: input.senderName,
            senderRole: input.senderRole,
            senderAvatar: input.senderAvatar || null,
            text: input.text,
            type: input.type || "text",
            attachments: input.attachments || [],
            status: "sent" as const,
            createdAt: now,
            isDeleted: false,
            isSystemMessage: false,
            replyTo: input.replyTo || null,
          };

          batch.set(messageDocRef, messageData);

          // Update conversation
          const conversationRef = doc(
            db,
            "conversations",
            input.conversationId
          );
          batch.update(conversationRef, {
            lastMessage: {
              text: input.text,
              senderId: input.senderId,
              senderName: input.senderName,
              timestamp: now,
              type: input.type || "text",
            },
            updatedAt: now,
            [`unreadCount.${input.recipientId}`]: increment(1),
          });

          await batch.commit();

          // Send push notification to recipient
          // This runs asynchronously and doesn't block the message sending
          sendMessageNotification({
            recipientId: input.recipientId,
            senderId: input.senderId,
            senderName: input.senderName,
            senderAvatar: input.senderAvatar,
            messagePreview: input.text,
            conversationId: input.conversationId,
            messageId: messageDocRef.id,
          }).catch((error) => {
            // Log error but don't fail the message send
            console.warn("Failed to send notification:", error);
          });

          return {
            data: serializeMessage(
              { ...messageData, createdAt: now },
              messageDocRef.id
            ),
          };
        } catch (error: any) {
          console.error("Error sending message:", error);
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: (result, error, { conversationId }) => [
        { type: "Messages", id: `MESSAGES_${conversationId}` },
        { type: "Messages", id: conversationId },
        { type: "Messages", id: "CONVERSATIONS_LIST" },
      ],
    }),

    /**
     * Send a system message (for status updates, etc.)
     */
    sendSystemMessage: builder.mutation<
      SerializedMessage,
      { conversationId: string; text: string; adminId: string }
    >({
      async queryFn({ conversationId, text, adminId }) {
        try {
          const now = Timestamp.now();

          const messagesRef = collection(
            db,
            "conversations",
            conversationId,
            "messages"
          );

          const messageData = {
            conversationId,
            senderId: "system",
            senderName: "System",
            senderRole: "admin" as const,
            text,
            type: "system" as const,
            status: "sent" as const,
            createdAt: now,
            isDeleted: false,
            isSystemMessage: true,
          };

          const docRef = await addDoc(messagesRef, messageData);

          // Update conversation
          const conversationRef = doc(db, "conversations", conversationId);
          await updateDoc(conversationRef, {
            lastMessage: {
              text,
              senderId: "system",
              senderName: "System",
              timestamp: now,
              type: "system",
            },
            updatedAt: now,
          });

          return {
            data: serializeMessage(
              { ...messageData, createdAt: now },
              docRef.id
            ),
          };
        } catch (error: any) {
          console.error("Error sending system message:", error);
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: (result, error, { conversationId }) => [
        { type: "Messages", id: `MESSAGES_${conversationId}` },
        { type: "Messages", id: conversationId },
      ],
    }),

    // ========================================================================
    // Read Status
    // ========================================================================

    /**
     * Mark conversation as read for a user
     */
    markAsRead: builder.mutation<void, MarkAsReadInput>({
      async queryFn({ conversationId, userId }) {
        try {
          const conversationRef = doc(db, "conversations", conversationId);
          await updateDoc(conversationRef, {
            [`unreadCount.${userId}`]: 0,
          });

          return { data: undefined };
        } catch (error: any) {
          console.error("Error marking as read:", error);
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: (result, error, { conversationId }) => [
        { type: "Messages", id: conversationId },
        { type: "Messages", id: "CONVERSATIONS_LIST" },
        { type: "Messages", id: "UNREAD_COUNT" },
      ],
    }),

    /**
     * Update message status (sent -> delivered -> read)
     * Used to mark messages as delivered or read
     */
    updateMessageStatus: builder.mutation<
      void,
      {
        conversationId: string;
        messageId: string;
        status: "delivered" | "read";
        userId: string;
      }
    >({
      async queryFn({ conversationId, messageId, status, userId }) {
        try {
          console.log("[updateMessageStatus] Updating message:", {
            conversationId,
            messageId,
            status,
            userId,
          });

          const messageRef = doc(
            db,
            "conversations",
            conversationId,
            "messages",
            messageId
          );

          const now = Timestamp.now();
          const updates: Record<string, any> = {
            status,
          };

          if (status === "delivered") {
            updates.deliveredAt = now;
          } else if (status === "read") {
            updates.readAt = now;
            // Add to readBy array
            updates.readBy = [{ userId, readAt: now }];
          }

          await updateDoc(messageRef, updates);
          console.log(
            "[updateMessageStatus] Message status updated successfully"
          );

          return { data: undefined };
        } catch (error: any) {
          console.error("[updateMessageStatus] Error:", error);
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
    }),

    /**
     * Mark multiple messages as read in a conversation
     * Updates all unread messages from a specific sender to "read" status
     */
    markMessagesAsRead: builder.mutation<
      void,
      {
        conversationId: string;
        userId: string; // The user viewing the messages (admin)
        senderId: string; // The sender of the messages to mark as read (client)
      }
    >({
      async queryFn({ conversationId, userId, senderId }) {
        try {
          console.log("[markMessagesAsRead] Marking messages as read:", {
            conversationId,
            userId,
            senderId,
          });

          // Get all unread messages from the sender
          const messagesRef = collection(
            db,
            "conversations",
            conversationId,
            "messages"
          );
          const q = query(
            messagesRef,
            where("senderId", "==", senderId),
            where("status", "in", ["sent", "delivered"])
          );

          const snapshot = await getDocs(q);
          console.log(
            "[markMessagesAsRead] Found",
            snapshot.size,
            "messages to update"
          );

          if (snapshot.empty) {
            return { data: undefined };
          }

          const batch = writeBatch(db);
          const now = Timestamp.now();

          snapshot.docs.forEach((docSnapshot) => {
            batch.update(docSnapshot.ref, {
              status: "read",
              readAt: now,
              readBy: [{ userId, readAt: now }],
            });
          });

          await batch.commit();
          console.log(
            "[markMessagesAsRead] Messages marked as read successfully"
          );

          return { data: undefined };
        } catch (error: any) {
          console.error("[markMessagesAsRead] Error:", error);
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
    }),

    /**
     * Mark messages as delivered when recipient opens conversation
     */
    markMessagesAsDelivered: builder.mutation<
      void,
      {
        conversationId: string;
        recipientId: string; // The user opening the conversation
      }
    >({
      async queryFn({ conversationId, recipientId }) {
        try {
          console.log(
            "[markMessagesAsDelivered] Marking messages as delivered:",
            {
              conversationId,
              recipientId,
            }
          );

          // Get all "sent" messages that are NOT from the recipient
          const messagesRef = collection(
            db,
            "conversations",
            conversationId,
            "messages"
          );
          const q = query(messagesRef, where("status", "==", "sent"));

          const snapshot = await getDocs(q);

          // Filter to only messages NOT sent by the recipient
          const messagesToUpdate = snapshot.docs.filter(
            (doc) => doc.data().senderId !== recipientId
          );

          console.log(
            "[markMessagesAsDelivered] Found",
            messagesToUpdate.length,
            "messages to update"
          );

          if (messagesToUpdate.length === 0) {
            return { data: undefined };
          }

          const batch = writeBatch(db);
          const now = Timestamp.now();

          messagesToUpdate.forEach((docSnapshot) => {
            batch.update(docSnapshot.ref, {
              status: "delivered",
              deliveredAt: now,
            });
          });

          await batch.commit();
          console.log(
            "[markMessagesAsDelivered] Messages marked as delivered successfully"
          );

          return { data: undefined };
        } catch (error: any) {
          console.error("[markMessagesAsDelivered] Error:", error);
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
    }),

    /**
     * Get total unread count for admin
     */
    getTotalUnreadCount: builder.query<UnreadCountResponse, string>({
      async queryFn(adminId) {
        try {
          const conversationsRef = collection(db, "conversations");
          const q = query(
            conversationsRef,
            where("adminId", "==", adminId),
            where("status", "==", "active")
          );

          const snapshot = await getDocs(q);
          let total = 0;
          const byConversation: Record<string, number> = {};

          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            const unreadCount = data.unreadCount?.[adminId] || 0;
            total += unreadCount;
            if (unreadCount > 0) {
              byConversation[doc.id] = unreadCount;
            }
          });

          return {
            data: { total, byConversation },
          };
        } catch (error: any) {
          console.error("Error getting unread count:", error);
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      providesTags: [{ type: "Messages", id: "UNREAD_COUNT" }],
    }),

    // ========================================================================
    // Clients
    // ========================================================================

    /**
     * Search clients by name or email for starting new conversations
     * This performs a case-insensitive search by fetching clients and filtering
     */
    searchClients: builder.query<
      Array<{
        uid: string;
        fullName: string;
        email: string;
        phone?: string;
        avatarUrl?: string;
      }>,
      { searchQuery: string }
    >({
      async queryFn({ searchQuery }) {
        console.log("[searchClients] Starting search with query:", searchQuery);

        try {
          // If no search query, return empty array (user must search)
          if (!searchQuery || searchQuery.trim().length < 2) {
            console.log("[searchClients] Query too short, returning empty");
            return { data: [] };
          }

          const usersRef = collection(db, "users");
          console.log("[searchClients] Got users collection ref");

          // Query all clients (Firestore doesn't support case-insensitive search)
          // We'll filter on client-side for case-insensitivity
          const q = query(
            usersRef,
            where("role", "==", "client"),
            limit(200) // Reasonable limit for client-side filtering
          );

          console.log(
            "[searchClients] Executing query for clients with role='client'..."
          );
          const snapshot = await getDocs(q);
          console.log("[searchClients] Found", snapshot.size, "total clients");

          const searchLower = searchQuery.toLowerCase().trim();

          const clients = snapshot.docs
            .map((doc) => {
              const data = doc.data();
              return {
                uid: doc.id,
                fullName: data.fullName || "",
                email: data.email || "",
                phone: data.phone,
                avatarUrl: data.avatarUrl,
              };
            })
            .filter(
              (client) =>
                client.fullName.toLowerCase().includes(searchLower) ||
                client.email.toLowerCase().includes(searchLower)
            )
            .slice(0, 20); // Return max 20 results

          console.log(
            "[searchClients] Filtered to",
            clients.length,
            "matching clients"
          );
          console.log(
            "[searchClients] Clients found:",
            clients.map((c) => ({
              uid: c.uid,
              fullName: c.fullName,
              email: c.email,
            }))
          );

          return { data: clients };
        } catch (error: any) {
          console.error("[searchClients] ERROR:", error);
          console.error("[searchClients] Error message:", error.message);
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      providesTags: [{ type: "Users", id: "CLIENTS_SEARCH" }],
    }),

    /**
     * Find a client by their exact email address
     * Used when navigating from orders page with clientEmail param
     */
    findClientByEmail: builder.query<
      {
        uid: string;
        fullName: string;
        email: string;
        phone?: string;
        avatarUrl?: string;
      } | null,
      string
    >({
      async queryFn(email) {
        console.log("[findClientByEmail] Starting search for email:", email);

        try {
          if (!email) {
            console.log(
              "[findClientByEmail] No email provided, returning null"
            );
            return { data: null };
          }

          const usersRef = collection(db, "users");
          console.log("[findClientByEmail] Got users collection ref");

          const q = query(
            usersRef,
            where("email", "==", email),
            where("role", "==", "client"),
            limit(1)
          );

          console.log("[findClientByEmail] Executing query...");
          const snapshot = await getDocs(q);
          console.log(
            "[findClientByEmail] Query returned",
            snapshot.size,
            "results"
          );

          if (snapshot.empty) {
            console.log(
              "[findClientByEmail] No client found with email:",
              email
            );
            return { data: null };
          }

          const doc = snapshot.docs[0];
          const clientData = {
            uid: doc.id,
            fullName: doc.data().fullName || "",
            email: doc.data().email || "",
            phone: doc.data().phone,
            avatarUrl: doc.data().avatarUrl,
          };

          console.log("[findClientByEmail] Found client:", clientData);
          return { data: clientData };
        } catch (error: any) {
          console.error("[findClientByEmail] ERROR:", error);
          console.error("[findClientByEmail] Error message:", error.message);
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      providesTags: (result, error, email) => [
        { type: "Users", id: `CLIENT_${email}` },
      ],
    }),

    /**
     * @deprecated Use searchClients instead
     * Get clients for starting new conversations (kept for backward compatibility)
     */
    getClientsForMessaging: builder.query<
      Array<{
        uid: string;
        fullName: string;
        email: string;
        phone?: string;
        avatarUrl?: string;
      }>,
      { searchQuery?: string }
    >({
      async queryFn({ searchQuery }) {
        try {
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("role", "==", "client"), limit(100));

          const snapshot = await getDocs(q);
          let clients = snapshot.docs.map((doc) => ({
            uid: doc.id,
            fullName: doc.data().fullName || "",
            email: doc.data().email || "",
            phone: doc.data().phone,
            avatarUrl: doc.data().avatarUrl,
          }));

          // Client-side search
          if (searchQuery) {
            const searchLower = searchQuery.toLowerCase();
            clients = clients.filter(
              (client) =>
                client.fullName.toLowerCase().includes(searchLower) ||
                client.email.toLowerCase().includes(searchLower)
            );
          }

          return { data: clients };
        } catch (error: any) {
          console.error("Error fetching clients:", error);
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      providesTags: [{ type: "Users", id: "CLIENTS_LIST" }],
    }),
  }),
});

// Export hooks
export const {
  useGetConversationsQuery,
  useGetConversationByIdQuery,
  useGetOrCreateConversationMutation,
  useUpdateConversationMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
  useSendSystemMessageMutation,
  useMarkAsReadMutation,
  useMarkMessagesAsDeliveredMutation,
  useMarkMessagesAsReadMutation,
  useGetTotalUnreadCountQuery,
  useSearchClientsQuery,
  useLazySearchClientsQuery,
  useFindClientByEmailQuery,
  useLazyFindClientByEmailQuery,
  useGetClientsForMessagingQuery,
} = messagingApi;
