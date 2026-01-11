# Blinking Events Notification System Guide

## Overview

The Blinking Events notification system enables **bi-directional** push notifications between the admin portal and mobile clients using:

- **Firebase Cloud Messaging (FCM)** - for web and Android native
- **Expo Push Notification Service** - for Expo/React Native apps

## Architecture

```
┌─────────────────┐                              ┌─────────────────────┐
│  Admin Portal   │◄────────────────────────────►│   Mobile App        │
│  (Next.js)      │                              │  (React Native)     │
└────────┬────────┘                              └──────────┬──────────┘
         │                                                  │
         │  Sends order updates,                           │  Sends messages,
         │  promotions, messages                           │  new orders
         │                                                  │
         ▼                                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Next.js API Route                                    │
│                    /api/notifications/send                              │
│                    (Firebase Admin SDK)                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌───────────┐   ┌───────────┐   ┌───────────┐
            │    FCM    │   │   Expo    │   │ Firestore │
            │  Service  │   │  Service  │   │notifications│
            └───────────┘   └───────────┘   └───────────┘
```

## Notification Flows

### Flow 1: Admin → Client (Order Updates, Promos)

```typescript
// Admin Portal: Using Redux mutation
const [sendNotification] = useSendNotificationMutation();

await sendNotification({
  recipientId: "client123",
  title: "Order Update",
  body: "Your order has been confirmed!",
  type: "order",
  reference: { type: "order", id: "order456" },
});
```

### Flow 2: Client → Admin (New Messages)

```typescript
// Mobile App: When client sends a message
import { sendMessageNotification } from "@/lib/redux/api/notificationsApi";

await sendMessageNotification({
  recipientId: "admin123",
  senderName: "John Doe",
  messagePreview: "Hi, I have a question about...",
  conversationId: "conv456",
  senderId: "client123",
});
```

### Flow 3: Client → Admins (New Orders)

```typescript
// Mobile App: Automatically triggered when order is created
// All admins are notified about new orders
sendOrderNotification({
  recipientId: adminId,
  orderId: "order789",
  orderNumber: "ORD-2026-0001",
  status: "new",
  senderId: clientId,
  senderName: "John Doe",
});
```

## How It Works

### Notification Processing Steps

1. **Create Firestore Document** → `notifications` collection with `status: "pending"`
2. **Call API Route** → `POST /api/notifications/send`
3. **Fetch User Tokens** → Get `fcmTokens` from user document
4. **Route by Token Type**:
   - `fcm` tokens → Firebase Admin SDK
   - `expo` tokens → Expo Push Service
5. **Update Status** → Set `status: "delivered"` or `status: "failed"`
6. **Mobile Receives** → App handles via `expo-notifications`

### 3. Token Types

| Token Type | Source              | Delivery Service         |
| ---------- | ------------------- | ------------------------ |
| `fcm`      | Web, Android native | Firebase Cloud Messaging |
| `expo`     | Expo/EAS builds     | Expo Push Service        |
| `apns`     | iOS native          | FCM (routes to APNs)     |

## Setup Instructions

### Portal Setup

#### 1. Environment Variables

Add to `.env.local`:

```env
# Firebase Admin SDK - Service Account JSON (required for sending notifications)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project",...}
```

#### 2. Get Service Account

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Project Settings → Service Accounts
4. Click "Generate new private key"
5. Download and save securely

### Mobile Setup

#### 1. Environment Variables

Add to `.env.local`:

```env
# Portal API URL for sending notifications
# Development: Use your computer's local IP (for physical device testing)
# Production: Use your deployed portal URL
EXPO_PUBLIC_PORTAL_API_URL=http://192.168.1.100:3000
```

**Important**: For testing on a physical device, use your computer's local network IP address, not `localhost`.

#### 2. Token Registration

Tokens are registered automatically when user logs in:

```typescript
import { registerForPushNotifications } from "@/lib/firebase/fcm";

// After successful login
await registerForPushNotifications(userId);
```

#### 3. Notification Handling

Setup listeners in your app root:

```typescript
import { setupNotificationListeners } from "@/lib/firebase/notificationHandlers";

useEffect(() => {
  const cleanup = setupNotificationListeners();
  return cleanup;
}, []);
```

## API Reference

### POST /api/notifications/send

Send push notifications to users.

**Request Body:**

```typescript
{
  // Target (one required)
  userId?: string;           // Single user
  userIds?: string[];        // Multiple users
  tokens?: string[];         // Direct tokens

  // Content (required)
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
    data?: Record<string, string>;
  };

  // Options
  priority?: 'high' | 'normal';
  android?: { channelId?: string };
}
```

**Response:**

```typescript
{
  success: boolean;
  stats: {
    totalSuccess: number;
    totalFailure: number;
    fcmSuccess: number;
    fcmFailure: number;
    expoSuccess: number;
    expoFailure: number;
  }
}
```

## Redux API Endpoints

### Mutations

| Endpoint                    | Description                      |
| --------------------------- | -------------------------------- |
| `sendNotification`          | Send to single user              |
| `sendBroadcastNotification` | Send to multiple users/audiences |
| `sendOrderNotification`     | Order status updates             |
| `sendMessageNotification`   | Chat message notifications       |

### Queries

| Endpoint                         | Description                    |
| -------------------------------- | ------------------------------ |
| `getNotifications`               | Get notifications with filters |
| `getNotification`                | Get single notification        |
| `getNotificationAnalytics`       | Get delivery stats             |
| `getUserNotificationPreferences` | Get user preferences           |

## Firestore Schema

### notifications collection

```typescript
{
  notificationId: string;
  title: string;
  body: string;
  type: 'order' | 'message' | 'promo' | 'reminder' | 'info' | 'system';

  // Targeting
  recipientId?: string;      // Single user
  recipientIds?: string[];   // Multiple users
  targetAudience?: 'all' | 'clients' | 'staff' | 'admins';

  // Reference
  reference?: {
    type: 'order' | 'conversation' | 'service' | 'event';
    id: string;
  };

  // Status
  status: 'pending' | 'delivered' | 'failed' | 'read';
  sentAt?: Timestamp;
  deliveredAt?: Timestamp;
  readAt?: Timestamp;

  // Stats (for broadcasts)
  stats?: {
    totalRecipients: number;
    delivered: number;
    failed: number;
    read: number;
  };

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### users.fcmTokens array

```typescript
{
  token: string;
  deviceId: string;
  platform: "ios" | "android" | "web";
  tokenType: "fcm" | "expo" | "apns";
  isActive: boolean;
  createdAt: Timestamp;
  lastUsedAt: Timestamp;
}
```

## Troubleshooting

### Notifications Not Received

1. **Check user has active tokens**: Query user document for `fcmTokens`
2. **Verify token type**: Ensure `tokenType` is correct for your app build
3. **Check API route logs**: Server console shows send results
4. **Verify permissions**: Mobile must have notification permissions granted

### Token Registration Failed

1. **Physical device required**: Push tokens won't work on emulators
2. **Check EAS project ID**: For Expo tokens, project ID must be valid UUID
3. **Permission denied**: User may have declined notification permissions

### API Route Errors

1. **Missing service account**: Set `FIREBASE_SERVICE_ACCOUNT_KEY` env var
2. **Invalid credentials**: Regenerate service account key
3. **Network issues**: Check Firebase project status

### Failed Token Cleanup

Failed tokens are automatically deactivated:

```typescript
// Token marked as inactive
{ ...token, isActive: false }
```

## Best Practices

1. **Always provide reference data** - Enables deep linking on tap
2. **Use appropriate priority** - `high` for urgent, `normal` for regular
3. **Keep messages concise** - Title < 50 chars, body < 150 chars
4. **Handle all notification types** - In `notificationHandlers.ts`
5. **Test on real devices** - Emulators don't support push notifications

## Files Reference

### Portal

- `/app/api/notifications/send/route.ts` - API route for sending
- `/lib/firebase/admin.ts` - Firebase Admin SDK setup
- `/lib/redux/api/notificationsApi.ts` - Redux RTK Query endpoints
- `/types/notifications.ts` - TypeScript types

### Mobile

- `/lib/firebase/fcm.ts` - Token registration
- `/lib/firebase/notificationHandlers.ts` - Incoming notification handling
- `/lib/firebase/config.ts` - Firebase configuration
