#!/bin/bash

# Commit script for blinking-events-portal changes
# This script commits each file individually with descriptive messages

set -e  # Exit on error

echo "🚀 Starting git commits..."
echo ""

# Modified files - Core Schema & Config
echo "📝 Committing schema and config files..."
git add FIREBASE_SCHEMA.md
git commit -m "docs: update Firebase schema documentation"

git add firestore.indexes.json
git commit -m "fix: update Firestore indexes configuration"

git add firestore.rules
git commit -m "fix: update Firestore security rules"

# Modified files - API Layer
echo "🔌 Committing API changes..."
git add lib/redux/api/firebaseApi.ts
git commit -m "fix: update Firebase API integration"

git add lib/redux/api/index.ts
git commit -m "fix: update API exports and configuration"

git add lib/redux/api/mediaApi.ts
git commit -m "fix: update media API endpoints"

git add lib/redux/api/staffApi.ts
git commit -m "fix: update staff API endpoints"

# Modified files - Pages
echo "📄 Committing page updates..."
git add app/media/[id]/page.tsx
git commit -m "fix: update media detail page layout and functionality"

git add app/staff/page.tsx
git commit -m "fix: update staff listing page with improved UI"

# Modified files - Component Modals
echo "🎨 Committing modal components..."
git add components/add-banner-modal.tsx
git commit -m "feat: update banner creation modal"

git add components/add-event-modal.tsx
git commit -m "feat: update event creation modal"

git add components/add-media-modal.tsx
git commit -m "feat: update media upload modal with improved validation"

git add components/add-offer-modal.tsx
git commit -m "feat: update offer creation modal"

git add components/add-service-modal.tsx
git commit -m "feat: update service creation modal"

git add components/add-staff-modal.tsx
git commit -m "feat: update staff creation modal"

git add components/edit-staff-modal.tsx
git commit -m "feat: update staff editing modal"

# Modified files - UI Components
echo "🎨 Committing UI component updates..."
git add components/app-sidebar.tsx
git commit -m "fix: update sidebar navigation structure"

git add components/ui/alert-dialog.tsx
git commit -m "fix: update alert dialog component styling"

git add components/ui/dialog.tsx
git commit -m "fix: update dialog component with improved accessibility"

git add components/ui/textarea.tsx
git commit -m "fix: update textarea component styling"

# New files - Documentation
echo "📚 Committing new documentation..."
git add CLOUD_FUNCTIONS_DEPLOYMENT.md
git commit -m "docs: add cloud functions deployment guide"

git add DEBUG_SHOP_PRODUCTS.md
git commit -m "docs: add shop products debugging guide"

git add FIX_EXISTING_SHOP_PRODUCTS.md
git commit -m "docs: add guide for fixing existing shop products"

git add NOTIFICATION_SYSTEM_COMPLETE.md
git commit -m "docs: add notification system implementation guide"

git add SHOP_MODULE_FIX_SUMMARY.md
git commit -m "docs: add shop module fix summary"

git add SHOP_MODULE_IMPLEMENTATION.md
git commit -m "docs: add shop module implementation guide"

git add SHOP_PRODUCT_DETAIL_GUIDE.md
git commit -m "docs: add shop product detail page guide"

git add SHOP_PRODUCT_DETAIL_SUMMARY.md
git commit -m "docs: add shop product detail summary"

git add SHOP_PRODUCT_DETAIL_VISUAL.md
git commit -m "docs: add shop product detail visual guide"

# New files - API Routes
echo "🌐 Committing new API routes..."
git add app/api/notifications/broadcast/
git commit -m "feat: add broadcast notifications API endpoint"

git add app/api/notifications/send-push/
git commit -m "feat: add push notification sending API endpoint"

# New files - Shop Module
echo "🛍️ Committing shop module..."
git add app/shop/
git commit -m "feat: add complete shop module with product management"

git add components/shop/
git commit -m "feat: add shop UI components"

git add lib/redux/api/shopApi.ts
git commit -m "feat: add shop API with RTK Query integration"

# New files - Utilities
echo "🔧 Committing utility functions..."
git add lib/cloudinary/delete.ts
git commit -m "feat: add Cloudinary asset deletion utility"

git add lib/utils/admin-notifications.ts
git commit -m "feat: add admin notification utilities"

# New files - Cloud Functions
echo "☁️ Committing cloud functions..."
git add functions/
git commit -m "feat: add Firebase Cloud Functions for notifications and processing"

# Add this script itself
git add commit-changes.sh
git commit -m "chore: add automated commit script"

echo ""
echo "✅ All changes committed successfully!"
echo ""
echo "📊 Commit summary:"
git log --oneline -30
echo ""
echo "🚀 Ready to push! Run: git push origin development"
