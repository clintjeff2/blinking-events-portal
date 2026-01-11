# Orders Module - Quick Start Guide

## 🚀 Setup Instructions (5 Minutes)

### 1. Install Firebase Admin SDK (if needed)

```bash
npm install firebase-admin
```

### 2. Download Firebase Service Account Key

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save as `firebase-service-account.json` in project root

### 3. Run Firebase Setup Script

```bash
node lib/orders/setup-firebase.js
```

This will:

- ✅ Create order counter document
- ✅ Show required Firestore indexes
- ✅ Show recommended security rules

### 4. Add Firestore Indexes

Go to Firebase Console → Firestore → Indexes → Add Composite Index

**Index 1:**

- Collection: `orders`
- Fields: `orderType` (Asc), `status` (Asc), `createdAt` (Desc)

**Index 2:**

- Collection: `orders`
- Fields: `clientInfo.email` (Asc), `createdAt` (Desc)

**Index 3:**

- Collection: `orders`
- Fields: `assignedTo` (Array), `createdAt` (Desc)

**Index 4:**

- Collection: `orders`
- Fields: `createdAt` (Asc), `status` (Asc)

### 5. Update Security Rules

Copy the rules from `lib/orders/setup-firebase.js` output to `firestore.rules`.

### 6. You're Done! 🎉

Navigate to `/orders` in your app to see the orders dashboard.

---

## 📖 Quick Usage Reference

### Fetch Orders

```typescript
import { useGetOrdersQuery } from "@/lib/redux/api/ordersApi";

const { data, isLoading } = useGetOrdersQuery({
  filters: {
    status: "pending",
    orderType: "event",
  },
  limit: 50,
});
```

### Get Single Order

```typescript
import { useGetOrderByIdQuery } from "@/lib/redux/api/ordersApi";

const { data: order } = useGetOrderByIdQuery(orderId);
```

### Format Currency

```typescript
import { formatCurrency } from "@/lib/orders/helpers";

const formatted = formatCurrency(500000, "XAF"); // "XAF 500,000"
```

### Check Order Type

```typescript
import { isEventOrder } from "@/lib/orders/helpers";

if (isEventOrder(order)) {
  // TypeScript knows this is an EventOrder
  console.log(order.eventDetails.eventType);
}
```

### Get Status Color

```typescript
import { getOrderStatusColor } from "@/lib/orders/helpers";

const colorClass = getOrderStatusColor("pending");
// Returns: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
```

---

## 🔥 Key Pages

- **Orders Dashboard**: `/orders`
- **Order Detail**: `/orders/[orderId]`

## 🧩 Key Components

- `<OrderCard />` - Individual order in list
- `<OrderStatusBadge />` - Status badge
- `<OrderTypeBadge />` - Type badge with icon
- `<OrderFilters />` - Advanced filtering panel
- `<OrdersEmptyState />` - Empty state
- `<OrdersLoadingSkeleton />` - Loading state

## 📚 Documentation

- **Complete Guide**: `ORDERS_MODULE_README.md` (1500+ lines)
- **Implementation Summary**: `IMPLEMENTATION_COMPLETE.md`
- **Phase 1 Summary**: `PHASE_1_COMPLETION_SUMMARY.md`
- **Phase 2 Plan**: `PHASE_2_KICKOFF.md`

---

## 🐛 Troubleshooting

### Orders not loading?

- Check Firebase connection
- Verify `ordersApi` is in Redux store
- Check browser console for errors

### TypeScript errors?

- Run `npm run type-check`
- Check imports are correct
- Ensure all types are from `@/types/orders`

### Filters not working?

- Check that filters match `OrderFilters` interface
- Verify dates are proper Date objects
- Check console for API errors

---

## 💡 Pro Tips

1. **Use helper functions** - Don't reinvent the wheel, we have 50+ helpers
2. **Use type guards** - Always check order type before accessing type-specific fields
3. **Use RTK Query** - It handles caching and real-time updates automatically
4. **Check the README** - Most questions are answered there

---

## 📞 Need Help?

1. Check `ORDERS_MODULE_README.md` first
2. Look at existing component examples
3. Review TypeScript types in `types/orders.ts`
4. Check helper functions in `lib/orders/helpers.ts`

---

**Happy Coding! 🚀**
