# Orders Module Documentation

Complete documentation for the Blinking Events orders management system.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Installation](#installation)
- [Data Structure](#data-structure)
- [API Reference](#api-reference)
- [Helper Functions](#helper-functions)
- [Constants](#constants)
- [UI Components](#ui-components)
- [Testing](#testing)
- [Deployment](#deployment)

---

## 🎯 Overview

The Orders module provides a comprehensive system for managing 4 types of orders:

- **Event Orders**: Full event planning with services and staff
- **Service Orders**: Individual service bookings
- **Staff Orders**: Staff-only bookings
- **Offer Orders**: Marketing offer redemptions

### Key Features

✅ **Unified Data Model**: Single collection with discriminated unions  
✅ **Order Counter**: Atomic order number generation (ORD-001, ORD-002, etc.)  
✅ **Quote Builder**: Itemized breakdowns with discount calculations  
✅ **Payment Tracking**: Transaction history with automatic status updates  
✅ **Real-time Messaging**: Client-admin chat with system messages  
✅ **Timeline Management**: Milestone tracking for order progress  
✅ **Status History**: Complete audit trail of all changes  
✅ **Type-Safe**: Full TypeScript support with type guards

---

## 🏗️ Architecture

### Tech Stack

- **Next.js 14**: App Router with Server Components
- **TypeScript**: Strict typing with discriminated unions
- **Firebase Firestore**: Database with subcollections
- **Redux Toolkit + RTK Query**: State management & data fetching
- **Shadcn/ui**: UI component library
- **React Hook Form**: Form validation
- **Zod**: Schema validation

### File Structure

```
lib/
├── orders/
│   ├── helpers.ts          # Utility functions (50+ helpers)
│   ├── constants.ts        # Constants and config
│   └── setup-firebase.js   # Firebase setup script
├── redux/
│   └── api/
│       └── ordersApi.ts    # RTK Query API (20+ endpoints)
types/
└── orders.ts               # TypeScript types (40+ interfaces)
app/
└── orders/
    ├── page.tsx            # Orders list/dashboard
    ├── [id]/
    │   └── page.tsx        # Order detail page
    └── loading.tsx         # Loading state
components/
├── create-event-order-modal.tsx
├── create-service-order-modal.tsx
├── create-staff-order-modal.tsx
├── create-offer-order-modal.tsx
├── order-quote-builder.tsx
├── order-payment-tracker.tsx
└── order-messages.tsx
```

---

## 🚀 Installation

### 1. Firebase Setup

Run the Firebase setup script:

```bash
# Install firebase-admin if not already installed
npm install firebase-admin

# Create a service account key from Firebase Console
# Download it as firebase-service-account.json

# Run setup script
node lib/orders/setup-firebase.js
```

This will:

- Create the `appConfig/orderCounter` document
- Verify the `orders` collection
- Create a sample test order
- Show recommended Firestore indexes
- Show recommended security rules

### 2. Firestore Indexes

Add these composite indexes in Firebase Console:

**Index 1**: Query by type and status

```
Collection: orders
Fields:
  - orderType (Ascending)
  - status (Ascending)
  - createdAt (Descending)
```

**Index 2**: Query by client

```
Collection: orders
Fields:
  - clientInfo.email (Ascending)
  - createdAt (Descending)
```

**Index 3**: Query by assigned admin

```
Collection: orders
Fields:
  - assignedTo (Array)
  - createdAt (Descending)
```

**Index 4**: Query by date range

```
Collection: orders
Fields:
  - createdAt (Ascending)
  - status (Ascending)
```

### 3. Security Rules

Update `firestore.rules`:

```javascript
// Orders collection
match /orders/{orderId} {
  // Admins can read all orders
  allow read: if isAdmin();

  // Admins can create orders
  allow create: if isAdmin()
    && request.resource.data.createdAt is timestamp
    && request.resource.data.orderNumber is string
    && request.resource.data.orderType in ['event', 'service', 'staff', 'offer']
    && request.resource.data.status in ['pending', 'quoted', 'confirmed', 'completed', 'cancelled'];

  // Admins can update orders
  allow update: if isAdmin()
    && request.resource.data.updatedAt is timestamp;

  // Only super admins can delete orders
  allow delete: if isSuperAdmin();

  // Messages subcollection
  match /messages/{messageId} {
    allow read: if isAdmin();
    allow create: if isAdmin()
      && request.resource.data.createdAt is timestamp;
    allow update: if isAdmin();
    allow delete: if false; // Messages cannot be deleted
  }
}

// Order counter (system document)
match /appConfig/orderCounter {
  allow read: if isAdmin();
  allow write: if false; // Only server-side updates via transactions
}
```

### 4. Redux Store Setup

The orders API is automatically injected into the store via RTK Query. No additional setup needed if you're already using `firebaseApi`.

---

## 📊 Data Structure

### Order Types

Orders use a **discriminated union** pattern for type safety:

```typescript
type Order = EventOrder | ServiceOrder | StaffOrder | OfferOrder;

// Type guards
if (isEventOrder(order)) {
  // TypeScript knows this is an EventOrder
  console.log(order.eventDetails.eventType);
}
```

### Common Fields (All Order Types)

```typescript
{
  id: string;
  orderNumber: string;          // "ORD-001", "ORD-002", etc.
  orderType: OrderType;          // "event" | "service" | "staff" | "offer"
  status: OrderStatus;           // "pending" | "quoted" | "confirmed" | "completed" | "cancelled"
  clientInfo: {
    fullName: string;
    email: string;
    phone: string;
  };
  quote?: OrderQuote;            // Quote details (if quoted)
  payment?: OrderPayment;        // Payment tracking
  timeline: TimelineMilestone[]; // Progress milestones
  assignedTo: string[];          // Admin user IDs
  statusHistory: StatusChange[]; // Audit trail
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Event Order Specific Fields

```typescript
{
  orderType: "event";
  eventDetails: {
    eventType: "wedding" | "birthday" | "corporate" | "cultural" | "other";
    eventDate: Timestamp;
    guestCount: number;
    venue: {
      name: string;
      address: string;
      city: string;
    };
    servicesRequested: ServiceRequest[];  // Array of services
    staffRequested: StaffRequest[];       // Array of staff
    specialRequests?: string;
  };
}
```

### Service Order Specific Fields

```typescript
{
  orderType: "service";
  serviceDetails: {
    serviceId: string;
    serviceName: string;
    category: string;
    description: string;
  };
  serviceDate?: Timestamp;
}
```

### Staff Order Specific Fields

```typescript
{
  orderType: "staff";
  staffDetails: {
    staffId: string;
    staffName: string;
    role: string;
  }
  bookingDate: Timestamp;
  duration: number; // Hours
  location: string;
}
```

### Offer Order Specific Fields

```typescript
{
  orderType: "offer";
  offerDetails: {
    offerId: string;
    offerTitle: string;
    discount: string;
    description: string;
  };
  redemptionDate: Timestamp;
  eventType?: string;
}
```

### Quote Structure

```typescript
{
  breakdown: [
    {
      item: "Venue decoration";
      amount: 500000;
    },
    {
      item: "Photography service";
      amount: 200000;
    }
  ];
  total: 700000;
  discount?: 50000;
  finalAmount: 650000;
  currency: "XAF";
  notes?: "10% early booking discount applied";
  validUntil: Timestamp;
  createdAt: Timestamp;
  createdBy: "admin-user-id";
}
```

### Payment Structure

```typescript
{
  amountPaid: 300000;
  amountDue: 350000;
  status: "partial";            // "pending" | "partial" | "completed"
  transactions: [
    {
      id: "txn-001";
      amount: 300000;
      method: "bank_transfer";  // "bank_transfer" | "mobile_money" | "card" | "cash"
      reference: "TXN123456";
      receivedAt: Timestamp;
      receivedBy: "admin-user-id";
      notes?: "Initial deposit";
    }
  ];
}
```

### Messages Subcollection

Each order has a `messages` subcollection:

```typescript
{
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderType: "admin" | "client" | "system";
  content: string;
  attachments?: string[];
  seenBy: string[];              // User IDs who have seen this message
  createdAt: Timestamp;
}
```

---

## 🔌 API Reference

### Queries

#### `useGetOrdersQuery`

Fetch orders with filters:

```typescript
const { data, isLoading, error } = useGetOrdersQuery({
  filters: {
    orderType: "event", // Optional
    status: "pending", // Optional
    clientId: "user-id", // Optional
    assignedTo: "admin-id", // Optional
    startDate: new Date("2026-01-01"), // Optional
    endDate: new Date("2026-12-31"), // Optional
  },
  search: "John Doe", // Optional: searches order number, client name, email
  page: 1, // Optional: default 1
  pageSize: 20, // Optional: default 20
});
```

Returns:

```typescript
{
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

#### `useGetOrderByIdQuery`

Fetch single order:

```typescript
const { data: order, isLoading } = useGetOrderByIdQuery(orderId);
```

#### `useGetOrderMessagesQuery`

Fetch order messages:

```typescript
const { data, isLoading } = useGetOrderMessagesQuery({
  orderId: "order-id",
  userId: "current-user-id", // Optional: for marking messages as seen
  limit: 50, // Optional: default 50
});
```

Returns:

```typescript
{
  messages: OrderMessage[];
  hasUnread: boolean;
  unreadCount: number;
}
```

### Mutations

#### `useCreateEventOrderMutation`

Create an event order:

```typescript
const [createOrder, { isLoading }] = useCreateEventOrderMutation();

await createOrder({
  clientInfo: {
    fullName: "John Doe",
    email: "john@example.com",
    phone: "+237600000000",
  },
  eventDetails: {
    eventType: "wedding",
    eventDate: Timestamp.fromDate(new Date("2026-06-15")),
    guestCount: 150,
    venue: {
      name: "Grand Ballroom",
      address: "123 Main St",
      city: "Douala",
    },
    servicesRequested: [
      {
        serviceId: "service-1",
        serviceName: "Photography",
        quantity: 1,
      },
    ],
    staffRequested: [
      {
        staffId: "staff-1",
        staffName: "Jane Smith",
        role: "Event Coordinator",
      },
    ],
    specialRequests: "Need extra lighting setup",
  },
}).unwrap();
```

Similar mutations exist for:

- `useCreateServiceOrderMutation`
- `useCreateStaffOrderMutation`
- `useCreateOfferOrderMutation`

#### `useUpdateOrderStatusMutation`

Change order status:

```typescript
const [updateStatus] = useUpdateOrderStatusMutation();

await updateStatus({
  orderId: "order-id",
  status: "confirmed",
  userId: "admin-id",
  userName: "Admin Name",
  notes: "Client approved the quote",
}).unwrap();
```

#### `useCreateQuoteMutation`

Send a quote:

```typescript
const [createQuote] = useCreateQuoteMutation();

await createQuote({
  orderId: "order-id",
  breakdown: [
    { item: "Venue decoration", amount: 500000 },
    { item: "Photography", amount: 200000 },
  ],
  discount: 50000,
  currency: "XAF",
  notes: "10% early booking discount",
  validityDays: 30,
  userId: "admin-id",
  userName: "Admin Name",
}).unwrap();
```

#### `useAddPaymentMutation`

Record a payment:

```typescript
const [addPayment] = useAddPaymentMutation();

await addPayment({
  orderId: "order-id",
  amount: 300000,
  method: "bank_transfer",
  reference: "TXN123456",
  notes: "Initial deposit",
  userId: "admin-id",
  userName: "Admin Name",
}).unwrap();
```

#### `useSendMessageMutation`

Send a message:

```typescript
const [sendMessage] = useSendMessageMutation();

await sendMessage({
  orderId: "order-id",
  content: "Hello, we've received your payment!",
  senderId: "admin-id",
  senderName: "Admin Name",
  senderType: "admin",
  attachments: ["https://cloudinary.com/..."], // Optional
}).unwrap();
```

#### Other Mutations

- `useAddTimelineMilestoneMutation`: Add progress milestone
- `useMarkMessagesSeenMutation`: Mark messages as read
- `useAssignOrderMutation`: Assign order to admins
- `useCancelOrderMutation`: Cancel order with reason
- `useDeleteOrderMutation`: Soft delete order

---

## 🛠️ Helper Functions

Import helpers:

```typescript
import { OrderHelpers } from "@/lib/orders/helpers";
// OR import individual functions
import { formatCurrency, getOrderStatusColor } from "@/lib/orders/helpers";
```

### Formatting

```typescript
// Order numbers
formatOrderNumber(1); // "ORD-001"
parseOrderNumber("ORD-001"); // 1

// Currency
formatCurrency(500000, "XAF"); // "XAF 500,000"
formatAmount(500000); // "500,000"

// Dates
formatOrderDate(timestamp); // "15 Jun 2026"
formatOrderDateTime(timestamp); // "15 Jun 2026, 14:30"
getRelativeTime(timestamp); // "2 days ago"
```

### Status & Type

```typescript
// Status
getOrderStatusColor("pending"); // Tailwind classes
getOrderStatusLabel("pending"); // "Pending"
getNextStatuses("pending"); // ["quoted", "confirmed", "cancelled"]

// Type
getOrderTypeBadgeColor("event"); // Tailwind classes
getOrderTypeIcon("event"); // "Calendar"
getOrderTypeLabel("event"); // "Event Order"
```

### Quote & Payment

```typescript
// Quote
calculateQuoteTotal(breakdown); // Total amount
calculateFinalAmount(total, discount); // Total after discount
validateQuoteBreakdown(breakdown); // Boolean
formatQuoteSummary(quote); // Human-readable summary

// Payment
calculatePaymentProgress(paid, total); // Percentage
getPaymentStatusColor(paid, total); // Tailwind classes
formatPaymentSummary(paid, due, "XAF"); // Human-readable summary
```

### Validation

```typescript
isOrderEditable(status); // Boolean
isOrderCancellable(status); // Boolean
canSendQuote(order); // Boolean
canAddPayment(order); // Boolean
```

### Search & Filter

```typescript
searchOrders(orders, "John"); // Search by order number, name, email
filterOrdersByType(orders, "event"); // Filter by type
filterOrdersByStatus(orders, "pending"); // Filter by status
filterOrdersByDateRange(orders, from, to); // Filter by date range
```

### Sorting

```typescript
sortOrdersByNewest(orders); // Sort by date (newest first)
sortOrdersByOldest(orders); // Sort by date (oldest first)
sortOrdersByAmount(orders); // Sort by amount (highest first)
sortOrdersByStatusPriority(orders); // Sort by status priority
```

### Analytics

```typescript
countOrdersByStatus(orders); // { pending: 5, quoted: 3, ... }
countOrdersByType(orders); // { event: 10, service: 5, ... }
calculateTotalRevenue(orders); // Total paid amount
calculateAverageOrderValue(orders); // Average quote amount
calculateConversionRate(orders); // Percentage completed
```

---

## 🔧 Constants

Import constants:

```typescript
import { OrderConstants, ORDER_CONFIG } from "@/lib/orders/constants";
```

### Configuration

```typescript
ORDER_CONFIG.ORDER_PREFIX; // "ORD"
ORDER_CONFIG.DEFAULT_CURRENCY; // "XAF"
ORDER_CONFIG.DEFAULT_PAGE_SIZE; // 20
ORDER_CONFIG.QUOTE_VALIDITY_DAYS; // 30
```

### UI Colors & Icons

```typescript
UI_CONFIG.STATUS_COLORS; // { pending: "yellow", ... }
UI_CONFIG.TYPE_ICONS; // { event: "Calendar", ... }
```

### Validation Rules

```typescript
VALIDATION_RULES.CLIENT_NAME_MIN_LENGTH; // 2
VALIDATION_RULES.EVENT_GUEST_COUNT_MAX; // 10000
VALIDATION_RULES.MESSAGE_MAX_LENGTH; // 2000
```

### Messages

```typescript
ERROR_MESSAGES.ORDER_NOT_FOUND; // "Order not found."
SUCCESS_MESSAGES.ORDER_CREATED; // "Order created successfully!"
```

---

## 🎨 UI Components

### Orders Dashboard

```tsx
// app/orders/page.tsx
import { useGetOrdersQuery } from "@/lib/redux/api/ordersApi";

export default function OrdersPage() {
  const { data, isLoading } = useGetOrdersQuery({
    filters: { status: "pending" },
    page: 1,
    pageSize: 20,
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h1>Orders ({data?.total})</h1>
      {data?.orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
```

### Order Detail

```tsx
// app/orders/[id]/page.tsx
import { useGetOrderByIdQuery } from "@/lib/redux/api/ordersApi";

export default function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: order, isLoading } = useGetOrderByIdQuery(params.id);

  if (isLoading) return <LoadingSpinner />;
  if (!order) return <NotFound />;

  return (
    <div>
      <OrderHeader order={order} />
      <OrderDetails order={order} />
      <OrderQuote order={order} />
      <OrderPayments order={order} />
      <OrderTimeline order={order} />
      <OrderMessages orderId={order.id} />
    </div>
  );
}
```

### Create Order Modal

```tsx
import { useCreateEventOrderMutation } from "@/lib/redux/api/ordersApi";

function CreateEventOrderModal() {
  const [createOrder, { isLoading }] = useCreateEventOrderMutation();

  const handleSubmit = async (data) => {
    await createOrder(data).unwrap();
    toast.success("Order created!");
  };

  return (
    <Dialog>
      <form onSubmit={handleSubmit}>{/* Form fields */}</form>
    </Dialog>
  );
}
```

---

## 🧪 Testing

### Unit Tests

```bash
npm test lib/orders/helpers.test.ts
npm test lib/redux/api/ordersApi.test.ts
```

### Integration Tests

```bash
npm test app/orders/page.test.tsx
npm test components/create-event-order-modal.test.tsx
```

### E2E Tests (Playwright)

```bash
npx playwright test tests/orders-flow.spec.ts
```

---

## 🚀 Deployment

### Pre-Deployment Checklist

- [ ] Run Firebase setup script
- [ ] Add all Firestore indexes
- [ ] Update security rules
- [ ] Test order creation flow
- [ ] Test quote sending
- [ ] Test payment tracking
- [ ] Test messaging
- [ ] Run all tests
- [ ] Delete sample test order (ORD-000)

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### Deploy to Production

```bash
# Build
npm run build

# Deploy (Vercel example)
vercel --prod
```

---

## 📚 Additional Resources

- [TypeScript Discriminated Unions](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-func.html#discriminated-unions)
- [RTK Query Documentation](https://redux-toolkit.js.org/rtk-query/overview)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-model)
- [Next.js App Router](https://nextjs.org/docs/app)

---

## 🐛 Troubleshooting

### Order number not incrementing

Check that the `appConfig/orderCounter` document exists and the transaction is running successfully.

### Messages not showing

Ensure the `OrderMessages` tag is in the `firebaseApi` tagTypes array.

### Type errors with Order unions

Use type guards (`isEventOrder`, `isServiceOrder`, etc.) to narrow the type.

### Firestore permission denied

Check your security rules and ensure the user has the correct role claims.

---

## 📝 License

Proprietary - Blinking Events © 2026

---

**Questions?** Contact the development team.
