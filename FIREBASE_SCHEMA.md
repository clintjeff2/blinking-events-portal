# Blinking Events App – Firebase Data Collections & Data Structures

This document defines all Firebase Firestore collections, their fields, data structures, and relationships for the Blinking Events Application, supporting both the client-facing mobile/web apps and the admin portal.

---

## 1. Users Collection (`users`)

**Purpose:** Stores information about all users (clients, staff, admins).  
**Document ID:** Auto-generated UID (matches Firebase Auth UID).

### Fields:

- `uid` (string): Firebase Auth UID (redundant, but often helpful)
- `role` (string): `'client' | 'admin' | 'staff'`
- `fullName` (string)
- `email` (string)
- `phone` (string)
- `avatarUrl` (string, optional)
- `createdAt` (timestamp)
- `favorites` (array of {type: string, refId: string}): List of favorited services or staff.
  - Example: [{ type: "service", refId: "serviceId1" }, { type: "staff", refId: "staffId3" }]
- `notificationTokens` (array of string, optional): For push notifications (DEPRECATED - use fcmTokens)
- `fcmTokens` (array of FCMToken, optional): Firebase Cloud Messaging tokens for push notifications
  ```typescript
  interface FCMToken {
    token: string; // The FCM/Expo push token
    deviceId: string; // Unique device identifier
    platform: "web" | "ios" | "android";
    tokenType: "fcm" | "expo" | "apns"; // Token type for proper delivery routing
    createdAt: Timestamp; // When token was first registered
    lastUsedAt: Timestamp; // Last successful notification delivery
    isActive: boolean; // Whether token is still valid
    appVersion?: string; // App version for debugging (mobile only)
  }
  ```
- `isActive` (boolean): For soft deletes or bans

#### For Staff/Admins (if role is `'staff'`):

- `staffProfileId` (string): Reference to `staffProfiles` document

#### For Admins (if role is `'admin'`):

- `permissions` (array of string): e.g., `["service_management", "order_management"]`

---

## 2. Services Collection (`services`)

**Purpose:** Stores all service offerings.

### Fields:

- `serviceId` (string, auto-id)
- `name` (string)
- `category` (string): e.g., `'wedding'`, `'corporate'`, `'cultural'`
- `description` (string)
- `priceRange` (object): `{ min: number, max: number, currency: string }` (default currency: 'XAF')
- `packages` (array of objects):
  - `{ name: string, features: array of string, price: number, description: string }`
- `images` (array of string): URLs
- `isActive` (boolean)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)
- `featured` (boolean): For marketing/promotions
- `staffProfiles` (array of string, optional): IDs of staff that deliver this service

---

## 3. Staff Profiles Collection (`staffProfiles`)

**Purpose:** Stores detailed info about all service staff.

### Fields:

- `staffProfileId` (string, auto-id)
- `fullName` (string)
- `photoUrl` (string)
- `bio` (string)
- `skills` (array of string)
- `qualifications` (array of string)
- `languages` (array of string)
- `categories` (array of string): e.g., [`'hostess'`, `'MC'`, `'security'`]
- `availability` (array of date ranges):
  - `{ from: timestamp, to: timestamp }`
- `portfolio` (array of { eventName: string, description: string, media: array of string })
- `rating` (number, avg)
- `reviews` (array of { userId: string, rating: number, comment: string, createdAt: timestamp })
- `contact` (object): `{ phone: string, email: string }`
- `isActive` (boolean)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

---

## 4. Orders Collection (`orders`)

**Purpose:** Client event requests, quotes, and order management.

### Fields:

- `orderId` (string, auto-id)
- `clientId` (string): Reference to `users.uid`
- `servicesRequested` (array of { serviceId: string, packageId: string, quantity: number })
- `staffRequested` (array of staffProfileId)
- `eventType` (string): `'wedding'`, `'corporate'`, etc.
- `eventDate` (timestamp)
- `eventTime` (string)
- `venue` (object): `{ name: string, address: string, location: GeoPoint, guestCount: number }`
- `specialRequirements` (string)
- `budgetRange` (object): `{ min: number, max: number }`
- `documents` (array of string): URLs to uploaded docs
- `status` (string): `'pending' | 'quoted' | 'confirmed' | 'completed' | 'cancelled'`
- `quote` (object, optional):
  - `{ total: number, breakdown: array of { item: string, amount: number }, sentAt: timestamp }`
- `timeline` (array of { milestone: string, date: timestamp, status: string })
- `messages` (subcollection, see below)
- `adminNotes` (string, optional)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

#### Subcollection: `messages`

- Stores chat between client and admin/staff for this order
  - `messageId` (string)
  - `senderId` (string)
  - `text` (string)
  - `attachments` (array of string, optional)
  - `createdAt` (timestamp)
  - `seenBy` (array of string, optional)

---

## 5. Media Collection (`media`)

**Purpose:** Stores all gallery media and portfolios.

### Fields:

- `mediaId` (string, auto-id)
- `title` (string): Media title/name
- `url` (array of strings): Array of media file URLs (images, videos, documents, etc.)
- `thumbnailUrl` (string): Thumbnail image URL (can be selected from uploaded media or auto-generated)
- `category` (string): e.g., `'wedding'`, `'corporate'`, `'cultural'`
- `eventId` (string, optional): Reference to events
- `uploadedBy` (string): userId/adminId
- `uploadedAt` (timestamp)
- `description` (string): Media description
- `isFeatured` (boolean): Whether to feature this media prominently
- `tags` (array of string): Search/filter tags
- `isActive` (boolean): For soft deletes
- `createdAt` (timestamp): Document creation timestamp
- `updatedAt` (timestamp, optional): Last update timestamp

**Note:** The `beforeAfter` field has been removed. Media type (image, video, PDF, etc.) is determined by individual file types in the `url` array, not stored as a separate field.

---

## 6. Events Collection (`events`)

**Purpose:** Past events for gallery, testimonials, analytics.

### Fields:

- `eventId` (string, auto-id)
- `name` (string)
- `date` (timestamp)
- `venue` (string)
- `category` (string)
- `servicesUsed` (array of serviceId)
- `staffInvolved` (array of staffProfileId)
- `description` (string)
- `testimonials` (array of { clientId: string, text: string, rating: number, createdAt: timestamp })
- `isPublished` (boolean)
- `createdAt` (timestamp)

---

## 7. Notifications Collection (`notifications`)

**Purpose:** Push notifications and in-app alerts. Stores both individual notifications and broadcast campaigns.

**Document ID:** Auto-generated

### Fields:

- `notificationId` (string): Same as document ID
- `title` (string): Notification title (max 100 characters recommended)
- `body` (string): Notification message body (max 500 characters recommended)
- `imageUrl` (string, optional): Image to display with notification
- `type` (string): `'order' | 'message' | 'promo' | 'reminder' | 'info' | 'system' | 'payment' | 'staff'`
- `priority` (string): `'low' | 'normal' | 'high' | 'urgent'`

#### Targeting Fields:

- `recipientId` (string, optional): Single recipient user ID
- `recipientIds` (array of string, optional): Multiple specific recipient user IDs (for targeted campaigns)
- `targetAudience` (string, optional): For broadcasts: `'all' | 'clients' | 'active_clients' | 'vip_clients' | 'new_users' | 'staff' | 'admins' | 'custom'`

#### Deep Linking:

- `reference` (object, optional): For navigation on tap
  ```typescript
  {
    type: 'order' | 'conversation' | 'service' | 'event' | 'staff' | 'offer' | 'url';
    id?: string;        // Entity ID for deep linking
    url?: string;       // Custom URL for 'url' type
    metadata?: Record<string, string>;  // Additional context
  }
  ```
- `actions` (array, optional): Action buttons
  ```typescript
  {
    id: string;
    title: string;
    action: string;  // Deep link or action identifier
    icon?: string;
  }[]
  ```

#### Delivery Information:

- `channels` (array of string): `['push', 'in_app', 'email', 'sms']`
- `status` (string): `'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled'`
- `sentAt` (timestamp, optional): When notification was sent
- `deliveredAt` (timestamp, optional): When notification was delivered
- `failureReason` (string, optional): Error message if failed
- `scheduledFor` (timestamp, optional): For scheduled notifications

#### Read/Engagement Tracking:

- `isRead` (boolean): Whether recipient has read the notification
- `readAt` (timestamp, optional): When notification was read
- `clickedAt` (timestamp, optional): When notification was tapped/clicked

#### Metadata:

- `senderId` (string): Admin user ID who created the notification
- `senderName` (string): Admin display name
- `createdAt` (timestamp)
- `updatedAt` (timestamp)
- `parentNotificationId` (string, optional): For broadcast child notifications, reference to parent

#### Broadcast Statistics (for campaign notifications):

- `stats` (object, optional):
  ```typescript
  {
    totalRecipients: number;
    delivered: number;
    failed: number;
    opened: number;
    clicked: number;
  }
  ```

### Indexes Required:

```
notifications:
  - recipientId ASC, createdAt DESC
  - recipientId ASC, isRead ASC, createdAt DESC
  - senderId ASC, createdAt DESC
  - type ASC, status ASC, createdAt DESC
  - targetAudience ASC, createdAt DESC
  - status ASC, scheduledFor ASC (for scheduled notification processing)
```

---

## 7.1 Notification Preferences Collection (`notificationPreferences`)

**Purpose:** User-specific notification settings and preferences.

**Document ID:** User ID (same as users collection document ID)

### Fields:

- `userId` (string): Reference to users collection

#### Channel Preferences:

- `pushEnabled` (boolean): Enable/disable push notifications
- `emailEnabled` (boolean): Enable/disable email notifications
- `smsEnabled` (boolean): Enable/disable SMS notifications

#### Type Preferences:

- `orderNotifications` (boolean): Order-related notifications
- `messageNotifications` (boolean): New message notifications
- `promoNotifications` (boolean): Promotional notifications
- `reminderNotifications` (boolean): Reminder notifications
- `infoNotifications` (boolean): General information notifications

#### Quiet Hours:

- `quietHoursEnabled` (boolean): Enable quiet hours
- `quietHoursStart` (string, optional): Start time in "HH:mm" format (e.g., "22:00")
- `quietHoursEnd` (string, optional): End time in "HH:mm" format (e.g., "07:00")

- `updatedAt` (timestamp)

---

## 8. FAQs & Knowledge Base (`faqs`)

**Purpose:** App support and help articles.

### Fields:

- `faqId` (string, auto-id)
- `question` (string)
- `answer` (string)
- `category` (string)
- `isActive` (boolean)
- `createdAt` (timestamp)

---

## 9. Marketing Collection (`marketing`)

**Purpose:** Manage promotional offers, banners, and featured content for marketing campaigns.

### Subcollections:

#### 9.1 Special Offers (`marketing/offers/offers`)

- `offerId` (string, auto-id)
- `title` (string): Offer title/name
- `description` (string): Detailed description of the offer
- `discount` (string): Discount amount or percentage (e.g., "15%", "50,000 XAF")
- `validFrom` (timestamp): When the offer becomes active
- `validTo` (timestamp): When the offer expires
- `isActive` (boolean): Whether the offer is currently active
- `redemptions` (number): Number of times the offer has been used
- `terms` (string, optional): Terms and conditions
- `category` (string, optional): Type of offer (e.g., 'wedding', 'corporate', 'general')
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

#### 9.2 Marketing Banners (`marketing/banners/banners`)

- `bannerId` (string, auto-id)
- `title` (string): Banner title/name
- `imageUrl` (string): URL to banner image (stored in Cloudinary: `blinking-events/marketing/banners/`)
- `link` (string): Target URL when banner is clicked
- `position` (string): Where banner appears (e.g., 'Home Hero', 'Services Page')
- `isActive` (boolean): Whether banner is currently displayed
- `order` (number): Display order/priority
- `description` (string, optional): Banner description
- `createdAt` (timestamp)
- `updatedAt` (timestamp)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

---

## 10. Conversations Collection (`conversations`)

**Purpose:** Stores messaging conversations between admins and clients. Enables real-time two-way communication.

**Document ID:** Auto-generated

### Fields:

- `conversationId` (string): Same as document ID
- `participants` (array of MessageParticipant):
  ```typescript
  interface MessageParticipant {
    userId: string;
    role: "client" | "admin";
    fullName: string;
    avatarUrl?: string;
  }
  ```
- `clientId` (string): User ID of the client participant
- `adminId` (string): User ID of the admin participant
- `orderId` (string, optional): Reference to an order (for order-specific conversations)
- `orderNumber` (string, optional): Display order number (e.g., "ORD-001")
- `lastMessage` (object, optional):
  ```typescript
  {
    text: string;
    senderId: string;
    senderName: string;
    senderRole?: 'client' | 'admin';
    timestamp: Timestamp;
    type: 'text' | 'image' | 'document' | 'system';
  }
  ```
- `unreadCount` (object): Map of userId to unread count
  ```typescript
  { [userId: string]: number }
  ```
- `status` (string): `'active' | 'archived' | 'closed'`
- `createdAt` (timestamp)
- `updatedAt` (timestamp)
- `createdBy` (string): User ID who created the conversation
- `metadata` (object, optional):
  ```typescript
  {
    subject?: string;
    priority?: 'normal' | 'high' | 'urgent';
    tags?: string[];
  }
  ```

### Subcollection: `conversations/{conversationId}/messages`

**Purpose:** Stores individual messages within a conversation.

- `messageId` (string): Same as document ID
- `conversationId` (string): Parent conversation ID
- `senderId` (string): User ID of the sender
- `senderName` (string): Display name of the sender
- `senderRole` (string): `'client' | 'admin'`
- `senderAvatar` (string, optional): Avatar URL
- `text` (string): Message content
- `type` (string): `'text' | 'image' | 'document' | 'system'`
- `attachments` (array, optional):
  ```typescript
  {
    type: 'image' | 'document' | 'video';
    url: string;
    name: string;
    size?: number;
    mimeType?: string;
  }[]
  ```
- `status` (string): `'sent' | 'delivered' | 'read'`
- `createdAt` (timestamp)
- `deliveredAt` (timestamp, optional)
- `readAt` (timestamp, optional)
- `readBy` (array, optional):
  ```typescript
  {
    userId: string;
    readAt: Timestamp;
  }
  [];
  ```
- `isDeleted` (boolean): Soft delete flag
- `deletedAt` (timestamp, optional)
- `replyTo` (object, optional): For reply-to-message feature
  ```typescript
  {
    messageId: string;
    text: string;
    senderName: string;
  }
  ```
- `isSystemMessage` (boolean): True for automated system messages

### Indexes Required:

```
conversations:
  - adminId ASC, status ASC, updatedAt DESC
  - clientId ASC, status ASC, updatedAt DESC
  - orderId ASC, status ASC

messages (subcollection):
  - isDeleted ASC, createdAt ASC
  - senderId ASC, status ASC
```

---

## 11. App Config Collection (`appConfig`)

**Purpose:** Global app settings, marketing banners, offers.

### Fields:

- `configId` (string, e.g., `'marketing'`, `'settings'`)
- `banners` (array of { image: string, link: string, text: string })
- `specialOffers` (array of { title: string, description: string, validFrom: timestamp, validTo: timestamp })
- `emergencyContact` (object): `{ phone: string, whatsapp: string, email: string }`
- `updatedAt` (timestamp)

---

## 12. Analytics Collection (`analytics`)

**Purpose:** Track app usage, engagement, revenue, etc.

### Fields:

- `analyticId` (string, auto-id)
- `type` (string): `'booking' | 'revenue' | 'activity' | 'push'`
- `metric` (string)
- `value` (number)
- `period` (string): `'daily' | 'weekly' | 'monthly'`
- `breakdown` (object, optional)
- `createdAt` (timestamp)

---

## 13. Testimonials Collection (`testimonials`)

**Purpose:** Client testimonials for marketing.

### Fields:

- `testimonialId` (string, auto-id)
- `clientId` (string)
- `eventId` (string, optional)
- `text` (string)
- `rating` (number)
- `media` (array of mediaId, optional)
- `createdAt` (timestamp)
- `isPublished` (boolean)

---

## Relationships Diagram (Textual)

- `users` refer to their `favorites` (services, staff).
- `staffProfiles` may reference `users` (for staff login).
- `orders` reference `users` as `clientId`, `services` as `servicesRequested.serviceId`, and `staffProfiles` as `staffRequested`.
- `conversations` reference `users` as both `clientId` and `adminId`, and optionally link to `orders` via `orderId`.
- `media` can be linked to `events`, `services`, or `staffProfiles`.
- `events` aggregate `servicesUsed`, `staffInvolved`, `media`, and `testimonials`.
- `notifications` are targeted per `userId`.
- `testimonials` may be linked to both `events` and `clients`.

---

## Push Notification Architecture

**Purpose:** Send push notifications from admin portal to mobile clients using Firebase Cloud Messaging (FCM) and Expo Push Service.

### How Notifications Work

1. **Admin Portal sends notification** → Creates document in `notifications` collection + calls `/api/notifications/send` API route
2. **API route processes request** → Fetches user tokens from `users` collection
3. **Routes to appropriate service**:
   - FCM tokens → Firebase Admin SDK (web/Android)
   - Expo tokens → Expo Push Service (Expo apps)
4. **Mobile receives notification** → Handles via `expo-notifications`
5. **Updates Firestore** → Sets notification `status` to `delivered` or `failed`

### API Route

**Location:** `/app/api/notifications/send/route.ts`

**Method:** `POST`

**Request Body:**

```typescript
{
  userIds: string[];      // Array of user IDs to send to
  title: string;          // Notification title
  body: string;           // Notification body
  data?: Record<string, string>;  // Optional custom data
  imageUrl?: string;      // Optional image URL
}
```

**Response:**

```typescript
{
  success: boolean;
  results: {
    userId: string;
    success: boolean;
    tokensSent: number;
    error?: string;
  }[];
  totalSent: number;
  totalFailed: number;
}
```

### Firebase Admin SDK Setup

**Location:** `/lib/firebase/admin.ts`

**Required Environment Variables:**

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}  # JSON string
# OR
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

### Token Type Routing

Push tokens are routed based on `tokenType` field in `users.fcmTokens`:

| Token Type | Delivery Service         | Typical Source          |
| ---------- | ------------------------ | ----------------------- |
| `fcm`      | Firebase Cloud Messaging | Web app, Android native |
| `expo`     | Expo Push Service        | Expo managed builds     |
| `apns`     | FCM (handles APNs)       | iOS native              |

---

## Notes

- All timestamp fields are [Firestore Timestamps](https://firebase.google.com/docs/reference/js/firestore_.timestamp).
- All references by ID are implemented as string fields (not Firestore references, for flexibility).
- Subcollections (e.g., `orders/{orderId}/messages`) are used for chat/message history.
- Media uploads (images, videos, docs) are stored in Firebase Storage; Firestore holds URLs.
- Role-based permissions are managed via the `users` collection and enforced in the admin portal UI/backend.

---

**This file should be copied into both the web and React Native codebases for dev reference.**
