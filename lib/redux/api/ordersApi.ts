/**
 * Orders API - RTK Query endpoints for order management
 *
 * Provides complete CRUD operations for all 4 order types:
 * - Event Bookings
 * - Service Bookings
 * - Staff Bookings
 * - Offer Redemptions
 *
 * @created January 8, 2026
 * @version 1.0.0
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  runTransaction,
  serverTimestamp,
  DocumentData,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { firebaseApi } from "./firebaseApi";
import type {
  Order,
  OrderMessage,
  CreateEventOrderInput,
  CreateServiceOrderInput,
  CreateStaffOrderInput,
  CreateOfferOrderInput,
  UpdateOrderStatusInput,
  UpdateEventOrderInput,
  UpdateServiceOrderInput,
  UpdateStaffOrderInput,
  UpdateOfferOrderInput,
  CreateQuoteInput,
  AddPaymentInput,
  AddTimelineMilestoneInput,
  SendMessageInput,
  MarkMessagesSeenInput,
  AssignOrderInput,
  CancelOrderInput,
  OrderFilters,
  OrdersQueryResult,
  OrderMessagesQueryResult,
  OrderAnalytics,
} from "@/types/orders";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate next order number atomically
 */
async function generateOrderNumber(): Promise<string> {
  const counterRef = doc(db, "appConfig", "orderCounter");

  let orderNumber = "";

  await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);

    let nextNumber = 1;
    if (counterDoc.exists()) {
      nextNumber = (counterDoc.data().lastOrderNumber || 0) + 1;
    }

    transaction.set(
      counterRef,
      {
        lastOrderNumber: nextNumber,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    orderNumber = `ORD-${String(nextNumber).padStart(3, "0")}`;
  });

  return orderNumber;
}

/**
 * Convert Date to Firestore Timestamp
 */
function toTimestamp(date: Date | Timestamp): Timestamp {
  if (date instanceof Timestamp) return date;
  return Timestamp.fromDate(date);
}

/**
 * Build Firestore query from filters
 */
function buildOrdersQuery(filters: OrderFilters): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];

  // Order type filter
  if (filters.orderType && filters.orderType !== "all") {
    constraints.push(where("orderType", "==", filters.orderType));
  }

  // Status filter
  if (filters.status && filters.status !== "all") {
    constraints.push(where("status", "==", filters.status));
  }

  // Client filter
  if (filters.clientId) {
    constraints.push(where("clientId", "==", filters.clientId));
  }

  // Assigned to filter
  if (filters.assignedTo) {
    constraints.push(where("assignedTo", "array-contains", filters.assignedTo));
  }

  // Date range filter
  if (filters.dateFrom) {
    constraints.push(where("createdAt", ">=", toTimestamp(filters.dateFrom)));
  }
  if (filters.dateTo) {
    constraints.push(where("createdAt", "<=", toTimestamp(filters.dateTo)));
  }

  // Default ordering
  constraints.push(orderBy("createdAt", "desc"));

  return constraints;
}

// ============================================================================
// RTK QUERY API
// ============================================================================

export const ordersApi = firebaseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ------------------------------------------------------------------------
    // GET ALL ORDERS (with filters)
    // ------------------------------------------------------------------------
    getOrders: builder.query<
      OrdersQueryResult,
      { filters?: OrderFilters; limit?: number }
    >({
      async queryFn({ filters = {}, limit: queryLimit = 50 }) {
        try {
          const ordersRef = collection(db, "orders");
          const constraints = buildOrdersQuery(filters);
          constraints.push(limit(queryLimit));

          const q = query(ordersRef, ...constraints);
          const querySnapshot = await getDocs(q);

          const orders: Order[] = [];
          querySnapshot.forEach((doc) => {
            orders.push({ orderId: doc.id, ...doc.data() } as Order);
          });

          // Apply client-side search filter if provided
          let filteredOrders = orders;
          if (filters.searchQuery) {
            const searchLower = filters.searchQuery.toLowerCase();
            filteredOrders = orders.filter(
              (order) =>
                order.orderNumber.toLowerCase().includes(searchLower) ||
                order.clientInfo.fullName.toLowerCase().includes(searchLower) ||
                order.clientInfo.email.toLowerCase().includes(searchLower)
            );
          }

          return {
            data: {
              orders: filteredOrders,
              total: filteredOrders.length,
              hasMore: querySnapshot.size === queryLimit,
              nextCursor: querySnapshot.docs[querySnapshot.docs.length - 1]?.id,
            },
          };
        } catch (error: any) {
          console.error("[Orders API] Error fetching orders:", error);
          return { error: { error: error.message } };
        }
      },
      providesTags: ["Orders"],
    }),

    // ------------------------------------------------------------------------
    // GET ORDER BY ID
    // ------------------------------------------------------------------------
    getOrderById: builder.query<Order, string>({
      async queryFn(orderId) {
        try {
          const orderRef = doc(db, "orders", orderId);
          const orderDoc = await getDoc(orderRef);

          if (!orderDoc.exists()) {
            return { error: { error: "Order not found" } };
          }

          return {
            data: { orderId: orderDoc.id, ...orderDoc.data() } as Order,
          };
        } catch (error: any) {
          console.error("[Orders API] Error fetching order:", error);
          return { error: { error: error.message } };
        }
      },
      providesTags: (result, error, orderId) => [
        { type: "Orders", id: orderId },
      ],
    }),

    // ------------------------------------------------------------------------
    // GET ORDER MESSAGES
    // ------------------------------------------------------------------------
    getOrderMessages: builder.query<
      OrderMessagesQueryResult,
      { orderId: string; userId?: string }
    >({
      async queryFn({ orderId, userId }) {
        try {
          const messagesRef = collection(db, "orders", orderId, "messages");
          const q = query(messagesRef, orderBy("createdAt", "asc"));
          const querySnapshot = await getDocs(q);

          const messages: OrderMessage[] = [];
          let unreadCount = 0;

          querySnapshot.forEach((doc) => {
            const message = {
              messageId: doc.id,
              ...doc.data(),
            } as OrderMessage;
            messages.push(message);

            // Count unread messages for current user
            if (
              userId &&
              !message.seenBy.some((seen) => seen.userId === userId)
            ) {
              unreadCount++;
            }
          });

          return {
            data: {
              messages,
              total: messages.length,
              hasMore: false,
              unreadCount,
            },
          };
        } catch (error: any) {
          console.error("[Orders API] Error fetching messages:", error);
          return { error: { error: error.message } };
        }
      },
      providesTags: (result, error, { orderId }) => [
        { type: "OrderMessages", id: orderId },
      ],
    }),

    // ------------------------------------------------------------------------
    // CREATE EVENT ORDER
    // ------------------------------------------------------------------------
    createEventOrder: builder.mutation<Order, CreateEventOrderInput>({
      async queryFn(input) {
        try {
          const orderNumber = await generateOrderNumber();

          const orderData = {
            orderNumber,
            orderType: "event" as const,
            clientId: input.clientId,
            clientInfo: input.clientInfo,
            eventDetails: {
              ...input.eventDetails,
              eventDate: toTimestamp(input.eventDetails.eventDate as any),
            },
            servicesRequested: input.servicesRequested,
            staffRequested: input.staffRequested,
            budgetRange: input.budgetRange,
            specialRequirements: input.specialRequirements,
            status: "pending" as const,
            statusHistory: [
              {
                status: "pending" as const,
                changedAt: Timestamp.now(),
                changedBy: input.clientId,
                changedByName: input.clientInfo.fullName,
                notes: "Order created",
              },
            ],
            adminNotes: input.adminNotes,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          const ordersRef = collection(db, "orders");
          const docRef = await addDoc(ordersRef, orderData);

          return {
            data: {
              orderId: docRef.id,
              ...orderData,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            } as Order,
          };
        } catch (error: any) {
          console.error("[Orders API] Error creating event order:", error);
          return { error: { error: error.message } };
        }
      },
      invalidatesTags: ["Orders"],
    }),

    // ------------------------------------------------------------------------
    // CREATE SERVICE ORDER
    // ------------------------------------------------------------------------
    createServiceOrder: builder.mutation<Order, CreateServiceOrderInput>({
      async queryFn(input) {
        try {
          const orderNumber = await generateOrderNumber();

          const orderData = {
            orderNumber,
            orderType: "service" as const,
            clientId: input.clientId,
            clientInfo: input.clientInfo,
            serviceDetails: input.serviceDetails,
            serviceDate: input.serviceDate
              ? toTimestamp(input.serviceDate)
              : undefined,
            duration: input.duration,
            budgetRange: input.budgetRange,
            status: "pending" as const,
            statusHistory: [
              {
                status: "pending" as const,
                changedAt: Timestamp.now(),
                changedBy: input.clientId,
                changedByName: input.clientInfo.fullName,
                notes: "Order created",
              },
            ],
            adminNotes: input.adminNotes,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          const ordersRef = collection(db, "orders");
          const docRef = await addDoc(ordersRef, orderData);

          return {
            data: {
              orderId: docRef.id,
              ...orderData,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            } as Order,
          };
        } catch (error: any) {
          console.error("[Orders API] Error creating service order:", error);
          return { error: { error: error.message } };
        }
      },
      invalidatesTags: ["Orders"],
    }),

    // ------------------------------------------------------------------------
    // CREATE STAFF ORDER
    // ------------------------------------------------------------------------
    createStaffOrder: builder.mutation<Order, CreateStaffOrderInput>({
      async queryFn(input) {
        try {
          const orderNumber = await generateOrderNumber();

          const orderData = {
            orderNumber,
            orderType: "staff" as const,
            clientId: input.clientId,
            clientInfo: input.clientInfo,
            staffDetails: input.staffDetails,
            bookingDate: toTimestamp(input.bookingDate),
            bookingDuration: input.bookingDuration,
            location: input.location,
            requirements: input.requirements,
            budgetRange: input.budgetRange,
            status: "pending" as const,
            statusHistory: [
              {
                status: "pending" as const,
                changedAt: Timestamp.now(),
                changedBy: input.clientId,
                changedByName: input.clientInfo.fullName,
                notes: "Order created",
              },
            ],
            adminNotes: input.adminNotes,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          const ordersRef = collection(db, "orders");
          const docRef = await addDoc(ordersRef, orderData);

          return {
            data: {
              orderId: docRef.id,
              ...orderData,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            } as Order,
          };
        } catch (error: any) {
          console.error("[Orders API] Error creating staff order:", error);
          return { error: { error: error.message } };
        }
      },
      invalidatesTags: ["Orders"],
    }),

    // ------------------------------------------------------------------------
    // CREATE OFFER ORDER
    // ------------------------------------------------------------------------
    createOfferOrder: builder.mutation<Order, CreateOfferOrderInput>({
      async queryFn(input) {
        try {
          const orderNumber = await generateOrderNumber();

          const orderData = {
            orderNumber,
            orderType: "offer" as const,
            clientId: input.clientId,
            clientInfo: input.clientInfo,
            offerDetails: {
              ...input.offerDetails,
              validTo: toTimestamp(input.offerDetails.validTo as any),
            },
            appliedToService: input.appliedToService,
            redemptionDate: toTimestamp(input.redemptionDate),
            status: "pending" as const,
            statusHistory: [
              {
                status: "pending" as const,
                changedAt: Timestamp.now(),
                changedBy: input.clientId,
                changedByName: input.clientInfo.fullName,
                notes: "Offer redeemed",
              },
            ],
            adminNotes: input.adminNotes,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          const ordersRef = collection(db, "orders");
          const docRef = await addDoc(ordersRef, orderData);

          return {
            data: {
              orderId: docRef.id,
              ...orderData,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            } as Order,
          };
        } catch (error: any) {
          console.error("[Orders API] Error creating offer order:", error);
          return { error: { error: error.message } };
        }
      },
      invalidatesTags: ["Orders"],
    }),

    // ------------------------------------------------------------------------
    // UPDATE ORDER STATUS
    // ------------------------------------------------------------------------
    updateOrderStatus: builder.mutation<void, UpdateOrderStatusInput>({
      async queryFn({ orderId, status, notes, changedBy, changedByName }) {
        try {
          const orderRef = doc(db, "orders", orderId);
          const orderDoc = await getDoc(orderRef);

          if (!orderDoc.exists()) {
            return { error: { error: "Order not found" } };
          }

          const currentOrder = orderDoc.data();
          const statusHistory = currentOrder.statusHistory || [];

          statusHistory.push({
            status,
            changedAt: Timestamp.now(),
            changedBy,
            changedByName: changedByName || "Admin",
            notes,
          });

          await updateDoc(orderRef, {
            status,
            statusHistory,
            updatedAt: serverTimestamp(),
          });

          // Create system message
          const messagesRef = collection(db, "orders", orderId, "messages");
          await addDoc(messagesRef, {
            senderId: changedBy,
            senderName: changedByName || "System",
            senderRole: "admin",
            text: `Order status changed to: ${status}. ${notes}`,
            isSystemMessage: true,
            createdAt: serverTimestamp(),
            seenBy: [],
          });

          return { data: undefined };
        } catch (error: any) {
          console.error("[Orders API] Error updating status:", error);
          return { error: { error: error.message } };
        }
      },
      invalidatesTags: (result, error, { orderId }) => [
        { type: "Orders", id: orderId },
        { type: "OrderMessages", id: orderId },
        "Orders",
      ],
    }),

    // ------------------------------------------------------------------------
    // UPDATE EVENT ORDER
    // ------------------------------------------------------------------------
    updateEventOrder: builder.mutation<void, UpdateEventOrderInput>({
      async queryFn({ orderId, ...updateData }) {
        try {
          const orderRef = doc(db, "orders", orderId);
          const updatePayload: any = { updatedAt: serverTimestamp() };

          if (updateData.eventDetails) {
            updatePayload.eventDetails = updateData.eventDetails;
          }
          if (updateData.servicesRequested) {
            updatePayload.servicesRequested = updateData.servicesRequested;
          }
          if (updateData.staffRequested) {
            updatePayload.staffRequested = updateData.staffRequested;
          }
          if (updateData.budgetRange) {
            updatePayload.budgetRange = updateData.budgetRange;
          }
          if (updateData.specialRequirements !== undefined) {
            updatePayload.specialRequirements = updateData.specialRequirements;
          }
          if (updateData.adminNotes !== undefined) {
            updatePayload.adminNotes = updateData.adminNotes;
          }

          await updateDoc(orderRef, updatePayload);
          return { data: undefined };
        } catch (error: any) {
          console.error("[Orders API] Error updating event order:", error);
          return { error: { error: error.message } };
        }
      },
      invalidatesTags: (result, error, { orderId }) => [
        { type: "Orders", id: orderId },
        "Orders",
      ],
    }),

    // ------------------------------------------------------------------------
    // UPDATE SERVICE ORDER
    // ------------------------------------------------------------------------
    updateServiceOrder: builder.mutation<void, UpdateServiceOrderInput>({
      async queryFn({ orderId, ...updateData }) {
        try {
          const orderRef = doc(db, "orders", orderId);
          const updatePayload: any = { updatedAt: serverTimestamp() };

          if (updateData.serviceDetails) {
            updatePayload.serviceDetails = updateData.serviceDetails;
          }
          if (updateData.serviceDate) {
            updatePayload.serviceDate = Timestamp.fromDate(
              updateData.serviceDate
            );
          }
          if (updateData.duration) {
            updatePayload.duration = updateData.duration;
          }
          if (updateData.budgetRange) {
            updatePayload.budgetRange = updateData.budgetRange;
          }
          if (updateData.adminNotes !== undefined) {
            updatePayload.adminNotes = updateData.adminNotes;
          }

          await updateDoc(orderRef, updatePayload);
          return { data: undefined };
        } catch (error: any) {
          console.error("[Orders API] Error updating service order:", error);
          return { error: { error: error.message } };
        }
      },
      invalidatesTags: (result, error, { orderId }) => [
        { type: "Orders", id: orderId },
        "Orders",
      ],
    }),

    // ------------------------------------------------------------------------
    // UPDATE STAFF ORDER
    // ------------------------------------------------------------------------
    updateStaffOrder: builder.mutation<void, UpdateStaffOrderInput>({
      async queryFn({ orderId, ...updateData }) {
        try {
          const orderRef = doc(db, "orders", orderId);
          const updatePayload: any = { updatedAt: serverTimestamp() };

          if (updateData.staffDetails) {
            updatePayload.staffDetails = updateData.staffDetails;
          }
          if (updateData.bookingDate) {
            updatePayload.bookingDate = Timestamp.fromDate(
              updateData.bookingDate
            );
          }
          if (updateData.bookingDuration) {
            updatePayload.bookingDuration = updateData.bookingDuration;
          }
          if (updateData.location !== undefined) {
            updatePayload.location = updateData.location;
          }
          if (updateData.requirements !== undefined) {
            updatePayload.requirements = updateData.requirements;
          }
          if (updateData.budgetRange) {
            updatePayload.budgetRange = updateData.budgetRange;
          }
          if (updateData.adminNotes !== undefined) {
            updatePayload.adminNotes = updateData.adminNotes;
          }

          await updateDoc(orderRef, updatePayload);
          return { data: undefined };
        } catch (error: any) {
          console.error("[Orders API] Error updating staff order:", error);
          return { error: { error: error.message } };
        }
      },
      invalidatesTags: (result, error, { orderId }) => [
        { type: "Orders", id: orderId },
        "Orders",
      ],
    }),

    // ------------------------------------------------------------------------
    // UPDATE OFFER ORDER
    // ------------------------------------------------------------------------
    updateOfferOrder: builder.mutation<void, UpdateOfferOrderInput>({
      async queryFn({ orderId, ...updateData }) {
        try {
          const orderRef = doc(db, "orders", orderId);
          const updatePayload: any = { updatedAt: serverTimestamp() };

          if (updateData.offerDetails) {
            updatePayload.offerDetails = updateData.offerDetails;
          }
          if (updateData.appliedToService) {
            updatePayload.appliedToService = updateData.appliedToService;
          }
          if (updateData.adminNotes !== undefined) {
            updatePayload.adminNotes = updateData.adminNotes;
          }

          await updateDoc(orderRef, updatePayload);
          return { data: undefined };
        } catch (error: any) {
          console.error("[Orders API] Error updating offer order:", error);
          return { error: { error: error.message } };
        }
      },
      invalidatesTags: (result, error, { orderId }) => [
        { type: "Orders", id: orderId },
        "Orders",
      ],
    }),

    // ------------------------------------------------------------------------
    // CREATE/UPDATE QUOTE
    // ------------------------------------------------------------------------
    createQuote: builder.mutation<void, CreateQuoteInput>({
      async queryFn({ orderId, breakdown, discount = 0, validUntil, sentBy }) {
        try {
          const total = breakdown.reduce((sum, item) => sum + item.amount, 0);
          const finalAmount = total - discount;

          const quote = {
            total,
            currency: "XAF",
            breakdown,
            discount,
            finalAmount,
            validUntil: validUntil ? toTimestamp(validUntil) : undefined,
            sentAt: Timestamp.now(),
            sentBy,
          };

          const orderRef = doc(db, "orders", orderId);
          await updateDoc(orderRef, {
            quote,
            status: "quoted",
            updatedAt: serverTimestamp(),
          });

          // Create system message
          const messagesRef = collection(db, "orders", orderId, "messages");
          await addDoc(messagesRef, {
            senderId: sentBy,
            senderName: "System",
            senderRole: "admin",
            text: `Quote sent: ${finalAmount.toLocaleString()} XAF`,
            isSystemMessage: true,
            createdAt: serverTimestamp(),
            seenBy: [],
          });

          return { data: undefined };
        } catch (error: any) {
          console.error("[Orders API] Error creating quote:", error);
          return { error: { error: error.message } };
        }
      },
      invalidatesTags: (result, error, { orderId }) => [
        { type: "Orders", id: orderId },
        { type: "OrderMessages", id: orderId },
        "Orders",
      ],
    }),

    // ------------------------------------------------------------------------
    // ADD PAYMENT
    // ------------------------------------------------------------------------
    addPayment: builder.mutation<void, AddPaymentInput>({
      async queryFn({
        orderId,
        amount,
        method,
        reference,
        date,
        verifiedBy,
        receiptUrl,
      }) {
        try {
          const orderRef = doc(db, "orders", orderId);
          const orderDoc = await getDoc(orderRef);

          if (!orderDoc.exists()) {
            return { error: { error: "Order not found" } };
          }

          const currentOrder = orderDoc.data();
          const payment = currentOrder.payment || {
            method,
            status: "pending",
            amountPaid: 0,
            amountDue: currentOrder.quote?.finalAmount || 0,
            transactions: [],
          };

          const transaction = {
            amount,
            method,
            reference,
            date: toTimestamp(date),
            verifiedBy,
            receiptUrl,
          };

          payment.transactions.push(transaction);
          payment.amountPaid += amount;
          payment.amountDue =
            (currentOrder.quote?.finalAmount || 0) - payment.amountPaid;

          // Update payment status
          if (payment.amountPaid >= (currentOrder.quote?.finalAmount || 0)) {
            payment.status = "completed";
          } else if (payment.amountPaid > 0) {
            payment.status = "partial";
          }

          await updateDoc(orderRef, {
            payment,
            updatedAt: serverTimestamp(),
          });

          // Create system message
          const messagesRef = collection(db, "orders", orderId, "messages");
          await addDoc(messagesRef, {
            senderId: verifiedBy || "system",
            senderName: "System",
            senderRole: "admin",
            text: `Payment received: ${amount.toLocaleString()} XAF via ${method}`,
            isSystemMessage: true,
            createdAt: serverTimestamp(),
            seenBy: [],
          });

          return { data: undefined };
        } catch (error: any) {
          console.error("[Orders API] Error adding payment:", error);
          return { error: { error: error.message } };
        }
      },
      invalidatesTags: (result, error, { orderId }) => [
        { type: "Orders", id: orderId },
        { type: "OrderMessages", id: orderId },
        "Orders",
      ],
    }),

    // ------------------------------------------------------------------------
    // ADD TIMELINE MILESTONE
    // ------------------------------------------------------------------------
    addTimelineMilestone: builder.mutation<void, AddTimelineMilestoneInput>({
      async queryFn({ orderId, milestone, description, dueDate }) {
        try {
          const orderRef = doc(db, "orders", orderId);
          const orderDoc = await getDoc(orderRef);

          if (!orderDoc.exists()) {
            return { error: { error: "Order not found" } };
          }

          const currentOrder = orderDoc.data();
          const timeline = currentOrder.timeline || [];

          timeline.push({
            milestone,
            description,
            dueDate: toTimestamp(dueDate),
            status: "pending",
          });

          await updateDoc(orderRef, {
            timeline,
            updatedAt: serverTimestamp(),
          });

          return { data: undefined };
        } catch (error: any) {
          console.error("[Orders API] Error adding timeline:", error);
          return { error: { error: error.message } };
        }
      },
      invalidatesTags: (result, error, { orderId }) => [
        { type: "Orders", id: orderId },
        "Orders",
      ],
    }),

    // ------------------------------------------------------------------------
    // SEND MESSAGE
    // ------------------------------------------------------------------------
    sendMessage: builder.mutation<void, SendMessageInput>({
      async queryFn({
        orderId,
        senderId,
        senderName,
        senderRole,
        text,
        attachments,
        isSystemMessage,
      }) {
        try {
          const messagesRef = collection(db, "orders", orderId, "messages");
          await addDoc(messagesRef, {
            senderId,
            senderName,
            senderRole,
            text,
            attachments: attachments || [],
            isSystemMessage: isSystemMessage || false,
            createdAt: serverTimestamp(),
            seenBy: [{ userId: senderId, seenAt: Timestamp.now() }],
          });

          return { data: undefined };
        } catch (error: any) {
          console.error("[Orders API] Error sending message:", error);
          return { error: { error: error.message } };
        }
      },
      invalidatesTags: (result, error, { orderId }) => [
        { type: "OrderMessages", id: orderId },
      ],
    }),

    // ------------------------------------------------------------------------
    // MARK MESSAGES AS SEEN
    // ------------------------------------------------------------------------
    markMessagesSeen: builder.mutation<void, MarkMessagesSeenInput>({
      async queryFn({ orderId, messageIds, userId }) {
        try {
          for (const messageId of messageIds) {
            const messageRef = doc(
              db,
              "orders",
              orderId,
              "messages",
              messageId
            );
            const messageDoc = await getDoc(messageRef);

            if (messageDoc.exists()) {
              const messageData = messageDoc.data();
              const seenBy = messageData.seenBy || [];

              if (!seenBy.some((seen: any) => seen.userId === userId)) {
                seenBy.push({
                  userId,
                  seenAt: Timestamp.now(),
                });

                await updateDoc(messageRef, { seenBy });
              }
            }
          }

          return { data: undefined };
        } catch (error: any) {
          console.error("[Orders API] Error marking messages seen:", error);
          return { error: { error: error.message } };
        }
      },
      invalidatesTags: (result, error, { orderId }) => [
        { type: "OrderMessages", id: orderId },
      ],
    }),

    // ------------------------------------------------------------------------
    // ASSIGN ORDER
    // ------------------------------------------------------------------------
    assignOrder: builder.mutation<void, AssignOrderInput>({
      async queryFn({ orderId, adminIds, assignedBy }) {
        try {
          const orderRef = doc(db, "orders", orderId);
          await updateDoc(orderRef, {
            assignedTo: adminIds,
            updatedAt: serverTimestamp(),
          });

          // Create system message
          const messagesRef = collection(db, "orders", orderId, "messages");
          await addDoc(messagesRef, {
            senderId: assignedBy,
            senderName: "System",
            senderRole: "admin",
            text: `Order assigned to ${adminIds.length} admin(s)`,
            isSystemMessage: true,
            createdAt: serverTimestamp(),
            seenBy: [],
          });

          return { data: undefined };
        } catch (error: any) {
          console.error("[Orders API] Error assigning order:", error);
          return { error: { error: error.message } };
        }
      },
      invalidatesTags: (result, error, { orderId }) => [
        { type: "Orders", id: orderId },
        { type: "OrderMessages", id: orderId },
        "Orders",
      ],
    }),

    // ------------------------------------------------------------------------
    // CANCEL ORDER
    // ------------------------------------------------------------------------
    cancelOrder: builder.mutation<void, CancelOrderInput>({
      async queryFn({ orderId, reason, cancelledBy, refundAmount }) {
        try {
          const orderRef = doc(db, "orders", orderId);
          const orderDoc = await getDoc(orderRef);

          if (!orderDoc.exists()) {
            return { error: { error: "Order not found" } };
          }

          const currentOrder = orderDoc.data();
          const statusHistory = currentOrder.statusHistory || [];

          statusHistory.push({
            status: "cancelled",
            changedAt: Timestamp.now(),
            changedBy: cancelledBy,
            notes: reason,
          });

          await updateDoc(orderRef, {
            status: "cancelled",
            statusHistory,
            cancellationReason: reason,
            refundAmount,
            updatedAt: serverTimestamp(),
          });

          // Create system message
          const messagesRef = collection(db, "orders", orderId, "messages");
          await addDoc(messagesRef, {
            senderId: cancelledBy,
            senderName: "System",
            senderRole: "admin",
            text: `Order cancelled: ${reason}${
              refundAmount
                ? ` | Refund: ${refundAmount.toLocaleString()} XAF`
                : ""
            }`,
            isSystemMessage: true,
            createdAt: serverTimestamp(),
            seenBy: [],
          });

          return { data: undefined };
        } catch (error: any) {
          console.error("[Orders API] Error cancelling order:", error);
          return { error: { error: error.message } };
        }
      },
      invalidatesTags: (result, error, { orderId }) => [
        { type: "Orders", id: orderId },
        { type: "OrderMessages", id: orderId },
        "Orders",
      ],
    }),

    // ------------------------------------------------------------------------
    // DELETE ORDER (Soft delete)
    // ------------------------------------------------------------------------
    deleteOrder: builder.mutation<void, string>({
      async queryFn(orderId) {
        try {
          const orderRef = doc(db, "orders", orderId);
          await updateDoc(orderRef, {
            status: "cancelled",
            updatedAt: serverTimestamp(),
          });

          return { data: undefined };
        } catch (error: any) {
          console.error("[Orders API] Error deleting order:", error);
          return { error: { error: error.message } };
        }
      },
      invalidatesTags: ["Orders"],
    }),
  }),
});

// ============================================================================
// EXPORTS
// ============================================================================

export const {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useGetOrderMessagesQuery,
  useCreateEventOrderMutation,
  useCreateServiceOrderMutation,
  useCreateStaffOrderMutation,
  useCreateOfferOrderMutation,
  useUpdateOrderStatusMutation,
  useUpdateEventOrderMutation,
  useUpdateServiceOrderMutation,
  useUpdateStaffOrderMutation,
  useUpdateOfferOrderMutation,
  useCreateQuoteMutation,
  useAddPaymentMutation,
  useAddTimelineMilestoneMutation,
  useSendMessageMutation,
  useMarkMessagesSeenMutation,
  useAssignOrderMutation,
  useCancelOrderMutation,
  useDeleteOrderMutation,
} = ordersApi;

export type {
  Order,
  OrderMessage,
  OrderFilters,
  OrdersQueryResult,
  OrderMessagesQueryResult,
};
