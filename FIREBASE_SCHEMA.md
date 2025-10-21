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
- `notificationTokens` (array of string, optional): For push notifications
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

**Purpose:** Push notifications and in-app alerts (per user).

### Fields:

- `notificationId` (string, auto-id)
- `userId` (string)
- `title` (string)
- `body` (string)
- `type` (string): `'order' | 'promo' | 'info' | 'reminder'`
- `reference` (object, optional): e.g., `{ orderId: string }`
- `isRead` (boolean)
- `createdAt` (timestamp)

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

## 10. App Config Collection (`appConfig`)

**Purpose:** Global app settings, marketing banners, offers.

### Fields:

- `configId` (string, e.g., `'marketing'`, `'settings'`)
- `banners` (array of { image: string, link: string, text: string })
- `specialOffers` (array of { title: string, description: string, validFrom: timestamp, validTo: timestamp })
- `emergencyContact` (object): `{ phone: string, whatsapp: string, email: string }`
- `updatedAt` (timestamp)

---

## 11. Analytics Collection (`analytics`)

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

## 12. Testimonials Collection (`testimonials`)

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
- `media` can be linked to `events`, `services`, or `staffProfiles`.
- `events` aggregate `servicesUsed`, `staffInvolved`, `media`, and `testimonials`.
- `notifications` are targeted per `userId`.
- `testimonials` may be linked to both `events` and `clients`.

---

## Notes

- All timestamp fields are [Firestore Timestamps](https://firebase.google.com/docs/reference/js/firestore_.timestamp).
- All references by ID are implemented as string fields (not Firestore references, for flexibility).
- Subcollections (e.g., `orders/{orderId}/messages`) are used for chat/message history.
- Media uploads (images, videos, docs) are stored in Firebase Storage; Firestore holds URLs.
- Role-based permissions are managed via the `users` collection and enforced in the admin portal UI/backend.

---

**This file should be copied into both the web and React Native codebases for dev reference.**
