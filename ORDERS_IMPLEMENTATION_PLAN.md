# Orders Module Implementation Plan

**Created:** January 8, 2026  
**Status:** In Progress  
**Target Completion:** Phase-by-phase rollout

---

## Overview

Complete migration and implementation of the unified orders system supporting 4 order types:

1. **Event Bookings** - Full event planning
2. **Service Bookings** - Direct service packages
3. **Staff Bookings** - Individual staff hiring
4. **Offer Redemptions** - Promotional offer claims

---

## Implementation Phases

### ✅ Phase 0: Planning & Architecture (Current)

**Tasks:**

- [x] Review current orders implementation
- [x] Define new data structure
- [x] Update FIREBASE_SCHEMA.md
- [ ] Create implementation plan document
- [ ] Define TypeScript interfaces
- [ ] Plan component architecture

**Files to Create:**

- `ORDERS_IMPLEMENTATION_PLAN.md` (this file)
- `ORDERS_MIGRATION_GUIDE.md`
- `types/orders.ts`

---

### 🔄 Phase 1: Data Layer & Types (Week 1)

**Objective:** Set up TypeScript types, Firebase API, and data structures

#### 1.1 TypeScript Types

**File:** `types/orders.ts`

Define interfaces for:

- `Order` (base interface with discriminated union)
- `EventOrder`
- `ServiceOrder`
- `StaffOrder`
- `OfferOrder`
- `OrderQuote`
- `OrderPayment`
- `OrderTimeline`
- `OrderMessage`
- `OrderStatusHistory`
- `CreateOrderInput` types for each order type
- `UpdateOrderInput` types

#### 1.2 Firebase API

**File:** `lib/redux/api/ordersApi.ts`

Endpoints to implement:

- `getOrders` - List all orders with filters
- `getOrderById` - Get single order details
- `getOrderMessages` - Get order chat messages
- `createEventOrder` - Create new event booking
- `createServiceOrder` - Create new service booking
- `createStaffOrder` - Create new staff booking
- `createOfferOrder` - Create new offer redemption
- `updateOrderStatus` - Change order status
- `updateOrder` - Update order details
- `createQuote` - Create/update order quote
- `addPayment` - Record payment transaction
- `addTimeline` - Add timeline milestone
- `sendMessage` - Send message in order chat
- `markMessagesSeen` - Mark messages as read
- `assignOrder` - Assign order to admin
- `cancelOrder` - Cancel order with reason
- `deleteOrder` - Soft delete order

**Query Tags:**

- `Orders`
- `OrderMessages`

#### 1.3 Order Counter Setup

**Create Firestore document:**

```
Path: /appConfig/orderCounter
Fields: {
  lastOrderNumber: 0,
  updatedAt: Timestamp
}
```

**Function:** `generateOrderNumber()`

- Atomically increment counter
- Return formatted number (ORD-001, ORD-002, etc.)

#### 1.4 Helper Functions

**File:** `lib/orders/helpers.ts`

Functions:

- `generateOrderNumber()` - Get next order number
- `formatOrderNumber(num)` - Format to ORD-XXX
- `getOrderStatusColor(status)` - Status badge colors
- `getOrderTypeIcon(type)` - Type icons
- `getOrderTypeBadgeColor(type)` - Type badge colors
- `canTransitionStatus(from, to)` - Validate status changes
- `calculateQuoteTotal(breakdown, discount)` - Quote calculations
- `formatCurrency(amount)` - Format XAF amounts
- `isOrderEditable(status)` - Check if editable
- `getOrderDisplayDate(order)` - Get relevant date per type

**Deliverables:**

- [ ] `types/orders.ts` with all interfaces
- [ ] `lib/redux/api/ordersApi.ts` with RTK Query endpoints
- [ ] `lib/orders/helpers.ts` with utility functions
- [ ] Order counter document created in Firestore
- [ ] API tested with Postman/Firebase console

---

### 📋 Phase 2: Orders List & Dashboard (Week 2)

**Objective:** Build orders list page with filters, search, and basic actions

#### 2.1 Orders Dashboard Page

**File:** `app/orders/page.tsx`

Components to build:

- Orders list table/grid view
- Status filter dropdown (All, Pending, Quoted, Confirmed, Completed, Cancelled)
- Order type filter (All, Event, Service, Staff, Offer)
- Search bar (order number, client name, email)
- Date range filter
- Pagination controls
- Quick actions per order (View, Change Status, Message)

**Features:**

- Real-time updates with RTK Query
- Skeleton loading states
- Empty states
- Error handling
- Responsive design (mobile-friendly)

#### 2.2 Order List Components

**File:** `components/orders/order-list-item.tsx`

- Display order card/row
- Order number, client name, type badge, status badge
- Key details preview (date, venue/service/staff)
- Quick actions buttons

**File:** `components/orders/order-filters.tsx`

- Status filter dropdown
- Type filter dropdown
- Date range picker
- Clear filters button

**File:** `components/orders/order-search.tsx`

- Search input with debounce
- Search suggestions dropdown
- Recent searches

#### 2.3 Status Badge Component

**File:** `components/orders/order-status-badge.tsx`

- Color-coded status badges
- Tooltip with status description
- Click to change status (if allowed)

#### 2.4 Type Badge Component

**File:** `components/orders/order-type-badge.tsx`

- Type icons and colors
- Event (Red), Service (Blue), Staff (Gold), Offer (Green)

**Deliverables:**

- [ ] Orders dashboard page with filters
- [ ] Order list components
- [ ] Status and type badges
- [ ] Search functionality
- [ ] Pagination
- [ ] Responsive design

---

### 📄 Phase 3: Order Detail Page (Week 3)

**Objective:** Build comprehensive order detail view with all information

#### 3.1 Order Detail Page

**File:** `app/orders/[id]/page.tsx`

Sections to implement:

1. **Header Section**

   - Order number, type badge, status badge
   - Status change dropdown
   - Assign to admin dropdown
   - Print/Export button

2. **Client Information Card**

   - Name, email, phone
   - Order history link
   - Quick actions (Call, Email, WhatsApp)

3. **Order Details Card (Type-Specific)**

   - Event: Event type, date, venue, services, staff
   - Service: Service name, package, date, duration
   - Staff: Staff name, role, booking date/time
   - Offer: Offer details, discount, applied service

4. **Quote Section**

   - Quote breakdown table
   - Create/Edit quote button
   - Send quote button
   - Quote status

5. **Payment Section**

   - Payment summary (paid, due, total)
   - Transaction history
   - Add payment button
   - Payment method

6. **Timeline Section**

   - Milestones with status indicators
   - Add milestone button
   - Mark complete

7. **Documents Section**

   - Upload documents
   - Document list with preview
   - Delete documents

8. **Messages/Chat Section**

   - Real-time chat interface
   - Send messages
   - File attachments
   - System messages

9. **Status History**

   - Timeline of status changes
   - Changed by, date, notes

10. **Admin Actions Panel**
    - Change status
    - Assign admin
    - Cancel order
    - Mark complete
    - Delete order

#### 3.2 Order Detail Components

**File:** `components/orders/order-header.tsx`
**File:** `components/orders/order-client-info.tsx`
**File:** `components/orders/order-event-details.tsx`
**File:** `components/orders/order-service-details.tsx`
**File:** `components/orders/order-staff-details.tsx`
**File:** `components/orders/order-offer-details.tsx`
**File:** `components/orders/order-quote-section.tsx`
**File:** `components/orders/order-payment-section.tsx`
**File:** `components/orders/order-timeline-section.tsx`
**File:** `components/orders/order-documents-section.tsx`
**File:** `components/orders/order-messages-section.tsx`
**File:** `components/orders/order-status-history.tsx`
**File:** `components/orders/order-actions-panel.tsx`

**Deliverables:**

- [ ] Order detail page with all sections
- [ ] Type-specific detail components
- [ ] Quote display
- [ ] Payment display
- [ ] Timeline display
- [ ] Documents display
- [ ] Messages display
- [ ] Status history
- [ ] Admin actions panel

---

### ➕ Phase 4: Create Order Flows (Week 4)

**Objective:** Implement order creation modals for all 4 types

#### 4.1 Create Order Modals

**File:** `components/orders/create-event-order-modal.tsx`

- Client selector (search or create)
- Event type dropdown
- Event date/time pickers
- Venue form (name, address, city, guest count)
- Services multi-select with packages
- Staff multi-select with roles
- Budget range
- Special requirements

**File:** `components/orders/create-service-order-modal.tsx`

- Client selector
- Service selector with category
- Package selector
- Service date
- Duration input
- Custom requirements

**File:** `components/orders/create-staff-order-modal.tsx`

- Client selector
- Staff selector
- Booking date
- Start/end time
- Location
- Requirements

**File:** `components/orders/create-offer-order-modal.tsx`

- Client selector
- Offer selector (active offers only)
- Service to apply (optional)
- Auto-calculate discount
- Redemption confirmation

#### 4.2 Client Selector Component

**File:** `components/orders/client-selector.tsx`

- Search existing clients
- Create new client inline
- Display selected client info

#### 4.3 Form Validation

- Required field validation
- Date validation (no past dates)
- Budget range validation
- Email/phone format validation
- Duplicate order prevention

**Deliverables:**

- [ ] Create event order modal
- [ ] Create service order modal
- [ ] Create staff order modal
- [ ] Create offer order modal
- [ ] Client selector component
- [ ] Form validation
- [ ] Success/error handling

---

### 💰 Phase 5: Quote Builder & Management (Week 5)

**Objective:** Implement quote creation, editing, and sending

#### 5.1 Quote Builder Modal

**File:** `components/orders/quote-builder-modal.tsx`

Features:

- Line item table (item, description, amount)
- Add/remove line items
- Auto-populate from services/staff
- Manual line item addition
- Discount input (percentage or fixed amount)
- Auto-calculate subtotal, discount, total
- Valid until date picker
- Notes/terms textarea
- Preview quote
- Save draft
- Send quote button

#### 5.2 Quote Display Component

**File:** `components/orders/quote-display.tsx`

- Read-only quote view
- Breakdown table
- Total with discount
- Sent date
- Status (Draft, Sent, Accepted, Rejected)

#### 5.3 Quote Email Template

**File:** `lib/email/templates/quote-email.tsx`

- HTML email template
- Company branding
- Quote details
- Accept/Reject buttons
- Contact information

#### 5.4 Quote Actions

- Create quote → Status: Pending
- Send quote → Status: Quoted + Email notification
- Edit quote → Update quote object
- Accept quote (by client) → Status: Confirmed
- Reject quote (by client) → Status: Pending (with notes)

**Deliverables:**

- [ ] Quote builder modal
- [ ] Quote display component
- [ ] Quote calculations
- [ ] Email template
- [ ] Send quote functionality
- [ ] Quote status tracking

---

### 💳 Phase 6: Payment Tracking (Week 6)

**Objective:** Implement payment recording and tracking

#### 6.1 Add Payment Modal

**File:** `components/orders/add-payment-modal.tsx`

Fields:

- Amount paid
- Payment method (Cash, Bank Transfer, Mobile Money, Card)
- Payment reference/transaction ID
- Payment date
- Receipt upload
- Notes
- Verified by (admin name)

#### 6.2 Payment Display Component

**File:** `components/orders/payment-display.tsx`

- Payment summary card (Total, Paid, Due)
- Progress bar (% paid)
- Transaction history table
- Add payment button

#### 6.3 Payment Calculations

- Calculate total from quote
- Track amount paid (sum of transactions)
- Calculate amount due (total - paid)
- Update payment status:
  - `pending` - No payments
  - `partial` - Some payments made
  - `completed` - Fully paid
  - `refunded` - Refunded

#### 6.4 Payment Verification

- Mark transaction as verified
- Upload payment receipt
- Admin approval workflow

**Deliverables:**

- [ ] Add payment modal
- [ ] Payment display component
- [ ] Payment calculations
- [ ] Transaction history
- [ ] Payment verification
- [ ] Receipt upload

---

### 💬 Phase 7: Messaging System (Week 7)

**Objective:** Implement real-time chat for orders

#### 7.1 Messages Component

**File:** `components/orders/messages-list.tsx`

- Real-time message list
- Message bubbles (client, admin, system)
- Sender name and role badge
- Timestamp
- Read indicators
- File attachments display

#### 7.2 Message Input Component

**File:** `components/orders/message-input.tsx`

- Text input with auto-resize
- Send button
- File attachment button
- Emoji picker (optional)
- Typing indicator

#### 7.3 Message Types

1. **User Messages**

   - Text content
   - File attachments (images, PDFs)
   - Sender info (name, role)
   - Seen by list

2. **System Messages**
   - Status changes
   - Quote sent
   - Payment received
   - Order assigned
   - Special formatting/styling

#### 7.4 Real-time Updates

- Firestore snapshot listeners
- Auto-scroll to new messages
- Mark as seen on view
- Notification badge for unread

#### 7.5 File Attachments

- Upload to Cloudinary
- Image preview
- PDF preview
- Download option

**Deliverables:**

- [ ] Messages list component
- [ ] Message input component
- [ ] Real-time updates
- [ ] File attachments
- [ ] System messages
- [ ] Read indicators

---

### 📊 Phase 8: Analytics & Reports (Week 8)

**Objective:** Build analytics dashboard and export reports

#### 8.1 Analytics Dashboard

**File:** `app/orders/analytics/page.tsx`

Metrics to display:

- Total orders by type (pie chart)
- Orders by status (bar chart)
- Revenue by month (line chart)
- Average order value by type
- Conversion rate (pending → confirmed → completed)
- Cancellation rate
- Popular services in orders
- Popular staff in orders
- Revenue by event type
- Top clients by order count

#### 8.2 Chart Components

**File:** `components/orders/analytics/orders-by-type-chart.tsx`
**File:** `components/orders/analytics/orders-by-status-chart.tsx`
**File:** `components/orders/analytics/revenue-chart.tsx`
**File:** `components/orders/analytics/conversion-funnel.tsx`

#### 8.3 Export Functionality

- Export orders to CSV
- Export analytics to PDF
- Date range selection
- Filter by status/type
- Include/exclude columns

#### 8.4 Reports

- Daily orders report
- Weekly revenue report
- Monthly summary
- Quarterly performance
- Annual report

**Deliverables:**

- [ ] Analytics dashboard
- [ ] Charts (pie, bar, line, funnel)
- [ ] Export to CSV
- [ ] Export to PDF
- [ ] Date range filters
- [ ] Report generation

---

### 🔔 Phase 9: Notifications (Week 9)

**Objective:** Implement notification system for orders

#### 9.1 Notification Triggers

Send notifications when:

- New order created → Notify all admins
- Order status changed → Notify client + assigned admin
- Quote sent → Notify client
- Quote accepted/rejected → Notify assigned admin
- Payment received → Notify client + admin
- New message → Notify recipient
- Order assigned → Notify assigned admin
- Order cancelled → Notify client + admin
- Timeline milestone due → Notify assigned admin
- Order completed → Notify client

#### 9.2 Notification Channels

1. **In-App Notifications**

   - Notification badge in sidebar
   - Notification panel/dropdown
   - Mark as read
   - Click to navigate to order

2. **Email Notifications**

   - HTML email templates
   - Order details summary
   - Action buttons (View Order, Reply)
   - Unsubscribe option

3. **Push Notifications (Optional)**
   - Browser push notifications
   - Mobile push (if mobile app)

#### 9.3 Email Templates

**Files:**

- `lib/email/templates/new-order-email.tsx`
- `lib/email/templates/status-change-email.tsx`
- `lib/email/templates/quote-sent-email.tsx`
- `lib/email/templates/payment-received-email.tsx`
- `lib/email/templates/message-notification-email.tsx`

#### 9.4 Notification Preferences

- Allow users to configure notification preferences
- Enable/disable email notifications
- Enable/disable push notifications
- Notification frequency (real-time, daily digest)

**Deliverables:**

- [ ] Notification service
- [ ] In-app notifications
- [ ] Email templates
- [ ] Email sending integration
- [ ] Push notifications (optional)
- [ ] Notification preferences

---

### 🔐 Phase 10: Permissions & Security (Week 10)

**Objective:** Implement role-based access control

#### 10.1 Permission Roles

**Admin (Super Admin):**

- View all orders
- Create all order types
- Edit all orders
- Change any order status
- Delete orders
- Assign orders to others
- View all payments
- Access analytics
- Manage settings

**Manager:**

- View all orders
- Create all order types
- Edit assigned orders only
- Change status of assigned orders
- Cannot delete orders
- Assign orders to team
- View payments
- Access analytics

**Staff:**

- View assigned orders only
- Update order status (limited transitions)
- Add messages
- View payments (read-only)
- Cannot create/delete orders

**Read-Only:**

- View orders only
- No edit permissions
- Access analytics
- Cannot create/delete

#### 10.2 Permission Checks

**File:** `lib/permissions/order-permissions.ts`

Functions:

- `canViewOrder(user, order)` - Check view permission
- `canEditOrder(user, order)` - Check edit permission
- `canChangeStatus(user, order, newStatus)` - Check status change
- `canDeleteOrder(user, order)` - Check delete permission
- `canAssignOrder(user)` - Check assign permission
- `canViewPayments(user, order)` - Check payment view
- `canAddPayment(user, order)` - Check payment add

#### 10.3 Firebase Security Rules

Update Firestore security rules for orders collection:

```javascript
match /orders/{orderId} {
  // Admins can read/write all
  allow read, write: if isAdmin();

  // Managers can read all, write assigned
  allow read: if isManager();
  allow write: if isManager() && isAssignedTo(orderId);

  // Staff can read assigned only
  allow read: if isStaff() && isAssignedTo(orderId);
  allow update: if isStaff() && isAssignedTo(orderId) && onlyStatusUpdate();

  // Clients can read their own orders
  allow read: if isClient() && resource.data.clientId == request.auth.uid;
}
```

#### 10.4 UI Permission Guards

- Hide/disable buttons based on permissions
- Show permission denied messages
- Redirect unauthorized users
- Log permission violations

**Deliverables:**

- [ ] Permission functions
- [ ] Role-based UI guards
- [ ] Firebase security rules
- [ ] Permission denied messages
- [ ] Audit logging

---

### 🧪 Phase 11: Testing & QA (Week 11)

**Objective:** Comprehensive testing of all features

#### 11.1 Unit Tests

**Files to test:**

- `lib/redux/api/ordersApi.ts` - All endpoints
- `lib/orders/helpers.ts` - All helper functions
- `lib/permissions/order-permissions.ts` - Permission checks
- Component render tests

#### 11.2 Integration Tests

- Create order flow (all types)
- Update order flow
- Status change flow
- Quote creation and sending
- Payment recording
- Message sending
- Order assignment

#### 11.3 E2E Tests

- Complete order lifecycle (create → quote → confirm → complete)
- Multi-user scenarios (admin + client)
- Real-time updates
- Notification delivery

#### 11.4 Performance Tests

- Load 1000+ orders
- Pagination performance
- Search performance
- Real-time message latency
- Image upload speed

#### 11.5 Test Scenarios

**Event Order:**

1. Create event order with services and staff
2. Generate quote
3. Send quote
4. Record payment
5. Update timeline
6. Send messages
7. Change status to confirmed
8. Mark as completed

**Service Order:**

1. Create service order
2. Quote and confirm
3. Complete booking

**Staff Order:**

1. Book staff member
2. Confirm booking
3. Complete

**Offer Order:**

1. Redeem offer
2. Apply discount
3. Complete

#### 11.6 Bug Tracking

- Create bug tracking sheet
- Prioritize bugs (Critical, High, Medium, Low)
- Fix critical bugs before launch
- Schedule medium/low bugs for post-launch

**Deliverables:**

- [ ] Unit tests for all functions
- [ ] Integration tests for flows
- [ ] E2E tests for scenarios
- [ ] Performance benchmarks
- [ ] Bug fixes
- [ ] Test coverage report

---

### 🚀 Phase 12: Deployment & Documentation (Week 12)

**Objective:** Deploy to production and complete documentation

#### 12.1 Data Migration

**Migration Script:** `scripts/migrate-orders.ts`

Steps:

1. Backup existing orders collection
2. Create new orders with unified structure
3. Generate order numbers
4. Map old fields to new structure
5. Verify data integrity
6. Archive old orders

#### 12.2 Deployment Checklist

- [ ] Run all tests
- [ ] Update Firebase security rules
- [ ] Deploy order counter document
- [ ] Migrate existing data
- [ ] Update environment variables
- [ ] Deploy to staging
- [ ] QA on staging
- [ ] Deploy to production
- [ ] Monitor for errors

#### 12.3 Documentation

**Files to create:**

- `docs/ORDERS_USER_GUIDE.md` - How to use orders module
- `docs/ORDERS_API_REFERENCE.md` - API documentation
- `docs/ORDERS_MIGRATION_GUIDE.md` - Migration instructions
- `docs/ORDERS_TROUBLESHOOTING.md` - Common issues

**Video Tutorials:**

- How to create an event order
- How to manage order status
- How to send quotes
- How to record payments
- How to use messaging

#### 12.4 Training

- Train admin team on new orders module
- Provide user guide
- Conduct live demo
- Q&A session
- Feedback collection

#### 12.5 Monitoring

- Set up error monitoring (Sentry)
- Monitor order creation rate
- Monitor API performance
- Monitor email delivery
- Monitor notification delivery
- Set up alerts for errors

**Deliverables:**

- [ ] Migration script
- [ ] Data migrated successfully
- [ ] Production deployment
- [ ] User documentation
- [ ] API documentation
- [ ] Video tutorials
- [ ] Team training
- [ ] Monitoring setup

---

## Success Metrics

### Performance Metrics

- [ ] Page load time < 2 seconds
- [ ] Order creation time < 5 seconds
- [ ] Search results < 1 second
- [ ] Real-time message latency < 500ms

### Feature Completeness

- [ ] All 4 order types functional
- [ ] Status changes work correctly
- [ ] Quote builder creates accurate quotes
- [ ] Payment tracking records transactions
- [ ] Messaging works in real-time
- [ ] Analytics display accurate data
- [ ] Notifications send successfully

### Code Quality

- [ ] No TypeScript errors
- [ ] All tests passing
- [ ] Code coverage > 80%
- [ ] No console errors
- [ ] Proper error handling
- [ ] Clean code (ESLint passing)

### User Experience

- [ ] Mobile responsive
- [ ] Intuitive navigation
- [ ] Clear error messages
- [ ] Loading states
- [ ] Empty states
- [ ] Accessible (WCAG AA)

---

## Risk Management

### Potential Risks

1. **Data Migration Issues**

   - Risk: Data loss or corruption during migration
   - Mitigation: Backup before migration, verify after, rollback plan

2. **Performance Problems**

   - Risk: Slow load times with large datasets
   - Mitigation: Pagination, indexing, caching

3. **Real-time Sync Issues**

   - Risk: Messages not syncing in real-time
   - Mitigation: Test with multiple users, fallback to polling

4. **Permission Conflicts**

   - Risk: Users accessing unauthorized data
   - Mitigation: Thorough testing, security rules, audit logging

5. **Email Delivery Failures**
   - Risk: Notifications not reaching users
   - Mitigation: Email queue, retry logic, fallback to in-app

### Rollback Plan

If critical issues arise:

1. Revert to previous orders structure
2. Disable new orders module
3. Display maintenance message
4. Fix issues in staging
5. Redeploy when stable

---

## Timeline Summary

| Phase                  | Duration | Deliverables                 |
| ---------------------- | -------- | ---------------------------- |
| Phase 0: Planning      | 3 days   | Plan documents, architecture |
| Phase 1: Data Layer    | 1 week   | Types, API, helpers          |
| Phase 2: Orders List   | 1 week   | Dashboard, filters, search   |
| Phase 3: Order Detail  | 1 week   | Detail page, all sections    |
| Phase 4: Create Orders | 1 week   | Create modals for all types  |
| Phase 5: Quote Builder | 1 week   | Quote creation and sending   |
| Phase 6: Payment       | 1 week   | Payment tracking             |
| Phase 7: Messaging     | 1 week   | Real-time chat               |
| Phase 8: Analytics     | 1 week   | Reports and charts           |
| Phase 9: Notifications | 1 week   | Email and in-app alerts      |
| Phase 10: Permissions  | 1 week   | Role-based access            |
| Phase 11: Testing      | 1 week   | All tests, bug fixes         |
| Phase 12: Deployment   | 1 week   | Migration, docs, launch      |

**Total Duration:** ~12 weeks (3 months)

---

## Next Steps

1. Review and approve this implementation plan
2. Set up project board/tracking (Jira, Trello, GitHub Projects)
3. Assign developers to phases
4. Start Phase 1: Data Layer & Types
5. Daily standups to track progress
6. Weekly reviews with stakeholders

---

**Document Version:** 1.0  
**Last Updated:** January 8, 2026  
**Maintained By:** Development Team
