/**
 * Admin Notification Utilities
 * Send exciting broadcast notifications when admin creates new content
 * Now with FCM Push Notification support!
 *
 * @description Automatically notifies all mobile app users when new content is added
 * @created January 11, 2026
 * @updated January 11, 2026 - Added FCM push notification support via API route
 */

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// Notification types
export type NotificationType =
  | "new_service"
  | "new_event"
  | "new_staff"
  | "new_gallery"
  | "new_offer"
  | "new_banner"
  | "new_product"
  | "shop_order"
  | "shop_order_status"
  | "announcement";

// Exciting message templates for different content types
const SERVICE_MESSAGES = [
  "🎉 Exciting News! We've just added a brand new service: {name}! Elevate your next event to extraordinary heights!",
  "✨ NEW SERVICE ALERT! Introducing {name} - Your events are about to get even more amazing!",
  "🌟 Big News! {name} is now available! Let us help you create unforgettable moments!",
  "🎊 Just Launched! {name} - Premium service designed to make your event shine!",
  "💫 Fresh from Blinking Events! {name} is here to transform your celebrations!",
];

const EVENT_MESSAGES = [
  "📸 Check out our latest event showcase! '{name}' was absolutely spectacular!",
  "🎬 New in our portfolio! See how we made '{name}' an unforgettable experience!",
  "✨ Event Spotlight! '{name}' - Another success story from Blinking Events!",
  "🌟 Inspiration Alert! Discover the magic we created at '{name}'!",
  "🎉 Just Added! See the amazing moments from '{name}' in our gallery!",
];

const STAFF_MESSAGES = [
  "👋 Meet our newest team member: {name}! Ready to bring excellence to your events!",
  "🌟 Welcome to the family! {name} has joined our elite team of professionals!",
  "✨ Introducing {name}! Our team just got even more amazing!",
  "🎊 New Talent Alert! {name} is here to make your events extraordinary!",
  "💫 Say hello to {name}! Excellence personified, now at your service!",
];

const GALLERY_MESSAGES = [
  "📸 Fresh photos just dropped! Check out our stunning new gallery: '{title}'!",
  "🎬 Visual Treat! New media added to our portfolio - '{title}'!",
  "✨ Feast your eyes! '{title}' is now live in our gallery!",
  "🌟 New Gallery Alert! '{title}' showcases the magic of Blinking Events!",
  "📷 Just Published! '{title}' - Moments captured, memories preserved!",
];

const OFFER_MESSAGES = [
  "🔥 HOT DEAL ALERT! {discount} OFF on {title}! Don't miss this incredible offer!",
  "🎉 LIMITED TIME! Grab {discount} OFF with our {title} promotion!",
  "💰 SAVE BIG! {discount} discount on {title} - Act fast!",
  "✨ SPECIAL OFFER! {title} now comes with {discount} OFF!",
  "🎊 EXCLUSIVE DEAL! Get {discount} OFF on {title} - Limited spots available!",
];

const BANNER_MESSAGES = [
  "🌟 Big Announcement! Check out our latest update: '{title}'! Something exciting awaits you!",
  "📢 Attention! We have exciting news: '{title}'! Don't miss out!",
  "✨ New Update Alert! '{title}' - See what's new at Blinking Events!",
  "🎉 Exciting News! '{title}' - Discover something amazing today!",
  "🚀 Just In! '{title}' - We've got something special for you!",
];

const PRODUCT_MESSAGES = [
  "🛍️ NEW IN SHOP! {name} just landed! Get it before it's gone!",
  "✨ SHOP UPDATE! Check out our newest addition: {name}!",
  "🎁 Fresh Arrival! {name} is now available in our shop!",
  "🛒 Just Added! {name} - Perfect for your next event!",
  "🌟 Shop Alert! {name} is here - Don't miss out!",
];

const SHOP_ORDER_ADMIN_MESSAGES = [
  "🛒 New Shop Order! {clientName} just placed order #{orderNumber} for {amount}",
  "📦 Order Alert! #{orderNumber} from {clientName} - {amount} total",
  "🎉 New Order! {clientName} ordered {itemCount} item(s) totaling {amount}",
];

const SHOP_ORDER_STATUS_MESSAGES: Record<
  string,
  { title: string; body: string }
> = {
  confirmed: {
    title: "Order Confirmed! 🎉",
    body: "Great news! Your order #{orderNumber} has been confirmed and is being processed.",
  },
  processing: {
    title: "Order Processing 📦",
    body: "Your order #{orderNumber} is now being prepared. We'll keep you updated!",
  },
  completed: {
    title: "Order Completed! ✨",
    body: "Your order #{orderNumber} is ready! Thank you for shopping with Blinking Events!",
  },
  cancelled: {
    title: "Order Cancelled",
    body: "Your order #{orderNumber} has been cancelled. Contact us if you have questions.",
  },
};

// Helper to get random message from array
const getRandomMessage = (messages: string[]): string => {
  return messages[Math.floor(Math.random() * messages.length)];
};

// Replace placeholders in message
const formatMessage = (
  template: string,
  data: Record<string, string>
): string => {
  let message = template;
  Object.entries(data).forEach(([key, value]) => {
    message = message.replace(new RegExp(`{${key}}`, "g"), value);
  });
  return message;
};

// ============================================================================
// FCM Push Notification Functions (via API routes)
// ============================================================================

// Get all user IDs for broadcast (for in-app notifications)
async function getAllUserIds(): Promise<string[]> {
  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    const userIds: string[] = [];
    snapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      // Include all users - clients, staff, etc.
      if (data.uid || docSnapshot.id) {
        userIds.push(data.uid || docSnapshot.id);
      }
    });

    console.log(
      `[AdminNotifications] Found ${userIds.length} users for broadcast`
    );
    return userIds;
  } catch (error) {
    console.error("[AdminNotifications] Error fetching users:", error);
    return [];
  }
}

/**
 * Send push notifications to all users via API route (batch)
 * Uses the server-side broadcast API for efficiency
 */
async function sendBroadcastPush(
  title: string,
  body: string,
  notificationType: NotificationType,
  reference?: { type: string; id: string; name?: string }
): Promise<{ sent: number; failed: number; errors: string[] }> {
  console.log(
    "[AdminNotifications] 🚀 Starting broadcast push notification..."
  );
  console.log(`[AdminNotifications] 📝 Title: "${title}"`);
  console.log(`[AdminNotifications] 📝 Body: "${body.substring(0, 100)}..."`);

  try {
    // Prepare push data
    const pushData = {
      type: notificationType,
      referenceType: reference?.type || "",
      referenceId: reference?.id || "",
      referenceName: reference?.name || "",
      timestamp: new Date().toISOString(),
    };

    // Call our broadcast API endpoint
    const response = await fetch("/api/notifications/broadcast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        body,
        data: pushData,
        notificationType,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("[AdminNotifications] 📊 Broadcast Push Results:");
      console.log(`[AdminNotifications]    ✅ Sent: ${result.sent}`);
      console.log(`[AdminNotifications]    ❌ Failed: ${result.failed}`);

      return {
        sent: result.sent || 0,
        failed: result.failed || 0,
        errors: [],
      };
    } else {
      const error = await response.json();
      console.error("[AdminNotifications] ❌ Broadcast API error:", error);
      return {
        sent: 0,
        failed: 0,
        errors: [error.message || "API error"],
      };
    }
  } catch (error: any) {
    console.error(
      "[AdminNotifications] ❌ Failed to send broadcast:",
      error.message
    );
    return {
      sent: 0,
      failed: 0,
      errors: [error.message],
    };
  }
}

// Create notification document
async function createNotification(
  recipientId: string,
  title: string,
  body: string,
  type: NotificationType,
  reference?: {
    type: string;
    id: string;
    name?: string;
  }
): Promise<void> {
  try {
    const notificationData = {
      title,
      body,
      type,
      priority: "normal",
      recipientId,
      reference: reference || null,
      channels: ["push", "in_app"],
      status: "sent",
      isRead: false,
      sentAt: Timestamp.now(),
      senderId: "system",
      senderName: "Blinking Events",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await addDoc(collection(db, "notifications"), notificationData);
  } catch (error) {
    console.error("[AdminNotifications] Error creating notification:", error);
  }
}

/**
 * Send notification when a new service is created
 */
export async function notifyNewService(service: {
  name: string;
  category: string;
  serviceId: string;
}): Promise<void> {
  console.log(
    "[AdminNotifications] 🆕 =========================================="
  );
  console.log(
    "[AdminNotifications] 🆕 Sending new service notification:",
    service.name
  );
  console.log(
    "[AdminNotifications] 🆕 =========================================="
  );

  const title = "🎉 New Service Available!";
  const body = formatMessage(getRandomMessage(SERVICE_MESSAGES), {
    name: service.name,
    category: service.category,
  });

  const reference = {
    type: "service",
    id: service.serviceId,
    name: service.name,
  };

  // 1. Send FCM Push Notifications to all devices
  console.log(
    "[AdminNotifications] 📱 Step 1: Sending FCM push notifications..."
  );
  const pushResult = await sendBroadcastPush(
    title,
    body,
    "new_service",
    reference
  );

  // 2. Create in-app notifications in Firestore
  console.log(
    "[AdminNotifications] 📝 Step 2: Creating in-app notifications..."
  );
  const userIds = await getAllUserIds();
  const promises = userIds.map((userId) =>
    createNotification(userId, title, body, "new_service", reference)
  );

  await Promise.all(promises);

  console.log(`[AdminNotifications] ✅ Service notification complete:`);
  console.log(
    `[AdminNotifications]    📱 Push: ${pushResult.sent} sent, ${pushResult.failed} failed`
  );
  console.log(
    `[AdminNotifications]    📝 In-app: ${userIds.length} notifications created`
  );
}

/**
 * Send notification when a new event is created/published
 */
export async function notifyNewEvent(event: {
  name: string;
  category: string;
  venue: string;
  eventId: string;
}): Promise<void> {
  console.log(
    "[AdminNotifications] 🆕 =========================================="
  );
  console.log(
    "[AdminNotifications] 🆕 Sending new event notification:",
    event.name
  );
  console.log(
    "[AdminNotifications] 🆕 =========================================="
  );

  const title = "✨ New Event Showcase!";
  const body = formatMessage(getRandomMessage(EVENT_MESSAGES), {
    name: event.name,
    category: event.category,
    venue: event.venue,
  });

  const reference = {
    type: "event",
    id: event.eventId,
    name: event.name,
  };

  // 1. Send FCM Push Notifications
  console.log(
    "[AdminNotifications] 📱 Step 1: Sending FCM push notifications..."
  );
  const pushResult = await sendBroadcastPush(
    title,
    body,
    "new_event",
    reference
  );

  // 2. Create in-app notifications
  console.log(
    "[AdminNotifications] 📝 Step 2: Creating in-app notifications..."
  );
  const userIds = await getAllUserIds();
  const promises = userIds.map((userId) =>
    createNotification(userId, title, body, "new_event", reference)
  );

  await Promise.all(promises);

  console.log(`[AdminNotifications] ✅ Event notification complete:`);
  console.log(
    `[AdminNotifications]    📱 Push: ${pushResult.sent} sent, ${pushResult.failed} failed`
  );
  console.log(
    `[AdminNotifications]    📝 In-app: ${userIds.length} notifications created`
  );
}

/**
 * Send notification when a new staff member is added
 */
export async function notifyNewStaff(staff: {
  fullName: string;
  categories: string[];
  staffProfileId: string;
}): Promise<void> {
  console.log(
    "[AdminNotifications] 🆕 =========================================="
  );
  console.log(
    "[AdminNotifications] 🆕 Sending new staff notification:",
    staff.fullName
  );
  console.log(
    "[AdminNotifications] 🆕 =========================================="
  );

  const category = staff.categories?.[0] || "Professional";
  const title = "👋 Meet Our New Professional!";
  const body = formatMessage(getRandomMessage(STAFF_MESSAGES), {
    name: staff.fullName,
    category,
  });

  const reference = {
    type: "staff",
    id: staff.staffProfileId,
    name: staff.fullName,
  };

  // 1. Send FCM Push Notifications
  console.log(
    "[AdminNotifications] 📱 Step 1: Sending FCM push notifications..."
  );
  const pushResult = await sendBroadcastPush(
    title,
    body,
    "new_staff",
    reference
  );

  // 2. Create in-app notifications
  console.log(
    "[AdminNotifications] 📝 Step 2: Creating in-app notifications..."
  );
  const userIds = await getAllUserIds();
  const promises = userIds.map((userId) =>
    createNotification(userId, title, body, "new_staff", reference)
  );

  await Promise.all(promises);

  console.log(`[AdminNotifications] ✅ Staff notification complete:`);
  console.log(
    `[AdminNotifications]    📱 Push: ${pushResult.sent} sent, ${pushResult.failed} failed`
  );
  console.log(
    `[AdminNotifications]    📝 In-app: ${userIds.length} notifications created`
  );
}

/**
 * Send notification when new gallery content is added
 */
export async function notifyNewGallery(media: {
  title: string;
  category: string;
  mediaId: string;
}): Promise<void> {
  console.log(
    "[AdminNotifications] 🆕 =========================================="
  );
  console.log(
    "[AdminNotifications] 🆕 Sending new gallery notification:",
    media.title
  );
  console.log(
    "[AdminNotifications] 🆕 =========================================="
  );

  const title = "📸 New Gallery Content!";
  const body = formatMessage(getRandomMessage(GALLERY_MESSAGES), {
    title: media.title,
    category: media.category,
  });

  const reference = {
    type: "media",
    id: media.mediaId,
    name: media.title,
  };

  // 1. Send FCM Push Notifications
  console.log(
    "[AdminNotifications] 📱 Step 1: Sending FCM push notifications..."
  );
  const pushResult = await sendBroadcastPush(
    title,
    body,
    "new_gallery",
    reference
  );

  // 2. Create in-app notifications
  console.log(
    "[AdminNotifications] 📝 Step 2: Creating in-app notifications..."
  );
  const userIds = await getAllUserIds();
  const promises = userIds.map((userId) =>
    createNotification(userId, title, body, "new_gallery", reference)
  );

  await Promise.all(promises);

  console.log(`[AdminNotifications] ✅ Gallery notification complete:`);
  console.log(
    `[AdminNotifications]    📱 Push: ${pushResult.sent} sent, ${pushResult.failed} failed`
  );
  console.log(
    `[AdminNotifications]    📝 In-app: ${userIds.length} notifications created`
  );
}

/**
 * Send notification when a new offer/promotion is created
 */
export async function notifyNewOffer(offer: {
  title: string;
  discount: string;
  offerId: string;
}): Promise<void> {
  console.log(
    "[AdminNotifications] 🆕 =========================================="
  );
  console.log(
    "[AdminNotifications] 🆕 Sending new offer notification:",
    offer.title
  );
  console.log(
    "[AdminNotifications] 🆕 =========================================="
  );

  const title = "🔥 Special Offer Alert!";
  const body = formatMessage(getRandomMessage(OFFER_MESSAGES), {
    title: offer.title,
    discount: offer.discount,
  });

  const reference = {
    type: "offer",
    id: offer.offerId,
    name: offer.title,
  };

  // 1. Send FCM Push Notifications
  console.log(
    "[AdminNotifications] 📱 Step 1: Sending FCM push notifications..."
  );
  const pushResult = await sendBroadcastPush(
    title,
    body,
    "new_offer",
    reference
  );

  // 2. Create in-app notifications
  console.log(
    "[AdminNotifications] 📝 Step 2: Creating in-app notifications..."
  );
  const userIds = await getAllUserIds();
  const promises = userIds.map((userId) =>
    createNotification(userId, title, body, "new_offer", reference)
  );

  await Promise.all(promises);

  console.log(`[AdminNotifications] ✅ Offer notification complete:`);
  console.log(
    `[AdminNotifications]    📱 Push: ${pushResult.sent} sent, ${pushResult.failed} failed`
  );
  console.log(
    `[AdminNotifications]    📝 In-app: ${userIds.length} notifications created`
  );
}

/**
 * Send a custom announcement to all users
 */
export async function sendAnnouncement(
  title: string,
  message: string
): Promise<void> {
  console.log(
    "[AdminNotifications] 🆕 =========================================="
  );
  console.log("[AdminNotifications] 🆕 Sending announcement:", title);
  console.log(
    "[AdminNotifications] 🆕 =========================================="
  );

  const formattedTitle = `📢 ${title}`;

  // 1. Send FCM Push Notifications
  console.log(
    "[AdminNotifications] 📱 Step 1: Sending FCM push notifications..."
  );
  const pushResult = await sendBroadcastPush(
    formattedTitle,
    message,
    "announcement"
  );

  // 2. Create in-app notifications
  console.log(
    "[AdminNotifications] 📝 Step 2: Creating in-app notifications..."
  );
  const userIds = await getAllUserIds();
  const promises = userIds.map((userId) =>
    createNotification(userId, formattedTitle, message, "announcement")
  );

  await Promise.all(promises);

  console.log(`[AdminNotifications] ✅ Announcement complete:`);
  console.log(
    `[AdminNotifications]    📱 Push: ${pushResult.sent} sent, ${pushResult.failed} failed`
  );
  console.log(
    `[AdminNotifications]    📝 In-app: ${userIds.length} notifications created`
  );
}

/**
 * Send notification when a new marketing banner is created
 */
export async function notifyNewBanner(banner: {
  title: string;
  description?: string;
  bannerId: string;
}): Promise<void> {
  console.log(
    "[AdminNotifications] 🆕 =========================================="
  );
  console.log(
    "[AdminNotifications] 🆕 Sending new banner notification:",
    banner.title
  );
  console.log(
    "[AdminNotifications] 🆕 =========================================="
  );

  const title = "📢 New Announcement!";
  const body = formatMessage(getRandomMessage(BANNER_MESSAGES), {
    title: banner.title,
    description: banner.description || "",
  });

  const reference = {
    type: "banner",
    id: banner.bannerId,
    name: banner.title,
  };

  // 1. Send FCM Push Notifications
  console.log(
    "[AdminNotifications] 📱 Step 1: Sending FCM push notifications..."
  );
  const pushResult = await sendBroadcastPush(
    title,
    body,
    "new_banner",
    reference
  );

  // 2. Create in-app notifications
  console.log(
    "[AdminNotifications] 📝 Step 2: Creating in-app notifications..."
  );
  const userIds = await getAllUserIds();
  const promises = userIds.map((userId) =>
    createNotification(userId, title, body, "new_banner", reference)
  );

  await Promise.all(promises);

  console.log(`[AdminNotifications] ✅ Banner notification complete:`);
  console.log(
    `[AdminNotifications]    📱 Push: ${pushResult.sent} sent, ${pushResult.failed} failed`
  );
  console.log(
    `[AdminNotifications]    📝 In-app: ${userIds.length} notifications created`
  );
}

// ============================================================================
// SHOP NOTIFICATIONS
// ============================================================================

/**
 * Send notification when a new product is added to the shop
 * Notifies all clients about the new product
 */
export async function notifyNewProduct(product: {
  name: string;
  category: string;
  price: number;
  currency?: string;
  productId: string;
}): Promise<void> {
  console.log(
    "[AdminNotifications] 🆕 =========================================="
  );
  console.log(
    "[AdminNotifications] 🆕 Sending new product notification:",
    product.name
  );
  console.log(
    "[AdminNotifications] 🆕 =========================================="
  );

  const formattedPrice =
    product.currency === "XAF"
      ? `${product.price.toLocaleString()} FCFA`
      : `${product.price.toLocaleString()} ${product.currency || "XAF"}`;

  const title = "🛍️ New Product in Shop!";
  const body = formatMessage(getRandomMessage(PRODUCT_MESSAGES), {
    name: product.name,
    category: product.category,
    price: formattedPrice,
  });

  const reference = {
    type: "shop_product",
    id: product.productId,
    name: product.name,
  };

  // 1. Send FCM Push Notifications
  console.log(
    "[AdminNotifications] 📱 Step 1: Sending FCM push notifications..."
  );
  const pushResult = await sendBroadcastPush(
    title,
    body,
    "new_product",
    reference
  );

  // 2. Create in-app notifications for all users
  console.log(
    "[AdminNotifications] 📝 Step 2: Creating in-app notifications..."
  );
  const userIds = await getAllUserIds();
  const promises = userIds.map((userId) =>
    createNotification(userId, title, body, "new_product", reference)
  );

  await Promise.all(promises);

  console.log(`[AdminNotifications] ✅ Product notification complete:`);
  console.log(
    `[AdminNotifications]    📱 Push: ${pushResult.sent} sent, ${pushResult.failed} failed`
  );
  console.log(
    `[AdminNotifications]    📝 In-app: ${userIds.length} notifications created`
  );
}

/**
 * Send notification to all admins when a client places a shop order
 */
export async function notifyShopOrderToAdmins(order: {
  orderId: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  totalAmount: number;
  currency?: string;
  itemCount: number;
}): Promise<void> {
  console.log(
    "[AdminNotifications] 🆕 =========================================="
  );
  console.log(
    "[AdminNotifications] 🆕 Notifying admins of new shop order:",
    order.orderNumber
  );
  console.log(
    "[AdminNotifications] 🆕 =========================================="
  );

  const formattedAmount =
    order.currency === "XAF"
      ? `${order.totalAmount.toLocaleString()} FCFA`
      : `${order.totalAmount.toLocaleString()} ${order.currency || "XAF"}`;

  const title = "🛒 New Shop Order!";
  const body = formatMessage(getRandomMessage(SHOP_ORDER_ADMIN_MESSAGES), {
    clientName: order.clientName,
    orderNumber: order.orderNumber,
    amount: formattedAmount,
    itemCount: order.itemCount.toString(),
  });

  const reference = {
    type: "shop_order",
    id: order.orderId,
    name: order.orderNumber,
  };

  // Get all admin user IDs
  const adminsRef = collection(db, "users");
  const adminQuery = query(adminsRef, where("role", "==", "admin"));
  const adminSnapshot = await getDocs(adminQuery);
  const adminIds = adminSnapshot.docs.map((doc) => doc.id);

  console.log(`[AdminNotifications] Found ${adminIds.length} admins to notify`);

  // Send push to admins
  if (adminIds.length > 0) {
    try {
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: adminIds,
          notification: {
            title,
            body,
            data: {
              type: "shop_order",
              referenceType: "shop_order",
              referenceId: order.orderId,
            },
          },
          priority: "high",
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(
          `[AdminNotifications] 📱 Push sent to ${
            result.stats?.totalSuccess || 0
          } admins`
        );
      }
    } catch (error) {
      console.error(
        "[AdminNotifications] Failed to send push to admins:",
        error
      );
    }
  }

  // Create in-app notifications for admins
  const promises = adminIds.map((adminId) =>
    createNotification(adminId, title, body, "shop_order", reference)
  );

  await Promise.all(promises);

  console.log(`[AdminNotifications] ✅ Admin order notification complete`);
}

/**
 * Send notification to client when their shop order status changes
 */
export async function notifyShopOrderStatusChange(order: {
  orderId: string;
  orderNumber: string;
  clientId: string;
  newStatus: string;
  senderId: string;
  senderName: string;
}): Promise<void> {
  console.log(
    "[AdminNotifications] 🆕 =========================================="
  );
  console.log(
    "[AdminNotifications] 🆕 Sending order status notification:",
    order.orderNumber,
    "->",
    order.newStatus
  );
  console.log(
    "[AdminNotifications] 🆕 =========================================="
  );

  const statusMessage = SHOP_ORDER_STATUS_MESSAGES[order.newStatus] || {
    title: "Order Update",
    body:
      "Your order #{orderNumber} status has been updated to " + order.newStatus,
  };

  const title = statusMessage.title;
  const body = formatMessage(statusMessage.body, {
    orderNumber: order.orderNumber,
    status: order.newStatus,
  });

  const reference = {
    type: "shop_order",
    id: order.orderId,
    name: order.orderNumber,
  };

  // Send push to the client
  try {
    const response = await fetch("/api/notifications/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: order.clientId,
        notification: {
          title,
          body,
          data: {
            type: "shop_order_status",
            referenceType: "shop_order",
            referenceId: order.orderId,
            status: order.newStatus,
          },
        },
        priority: order.newStatus === "confirmed" ? "high" : "normal",
      }),
    });

    if (response.ok) {
      console.log("[AdminNotifications] 📱 Push sent to client");
    }
  } catch (error) {
    console.error("[AdminNotifications] Failed to send push to client:", error);
  }

  // Create in-app notification for the client
  await createNotification(
    order.clientId,
    title,
    body,
    "shop_order_status",
    reference
  );

  console.log(
    `[AdminNotifications] ✅ Order status notification sent to client`
  );
}
