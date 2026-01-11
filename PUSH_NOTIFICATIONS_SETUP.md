# Push Notifications Setup Guide

This guide will help you configure push notifications for the Blinking Events Admin Portal.

## Prerequisites

1. Firebase project with Cloud Messaging enabled
2. Admin access to Firebase Console

---

## Step 1: Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon ⚙️ next to "Project Overview"
4. Select **Project settings**
5. Scroll down to "Your apps" section
6. Click on your web app or create one if you haven't
7. Copy the Firebase configuration values

---

## Step 2: Generate VAPID Key (Web Push Certificate)

**This is the most important step for web push notifications!**

1. In Firebase Console, go to **Project settings**
2. Click on the **Cloud Messaging** tab
3. Scroll down to **Web Push certificates** section
4. If you don't have a key pair, click **Generate key pair**
5. Copy the **Key pair** value (this is your VAPID key)

> **⚠️ Important**: Without the VAPID key, push notifications will NOT work!

---

## Step 3: Update Environment Variables

Create or update your `.env.local` file in the project root with the following:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# VAPID Key for Web Push Notifications (REQUIRED!)
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here
```

### Finding Your Values:

| Variable                                   | Where to Find                                                         |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Project Settings → General → Your apps → Config                       |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Project Settings → General → Your apps → Config                       |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | Project Settings → General → Project ID                               |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Project Settings → General → Your apps → Config                       |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Project Settings → Cloud Messaging → Sender ID                        |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | Project Settings → General → Your apps → App ID                       |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY`           | Project Settings → Cloud Messaging → Web Push certificates → Key pair |

---

## Step 4: Update Service Worker (Optional)

The service worker at `public/firebase-messaging-sw.js` will automatically receive the Firebase config. However, if you want to hardcode it (not recommended for security), you can update it manually.

---

## Step 5: Test Push Notifications

### Option A: Use the Notification Prompt

1. Start your development server: `npm run dev`
2. Log in to the admin portal
3. After 2 seconds, you should see a notification prompt in the bottom-right corner
4. Click **"Enable Notifications"**
5. Your browser will show a permission dialog
6. Click **"Allow"**
7. Check your browser console for success messages
8. Verify in Firebase Console → Firestore → `users/{yourUserId}` → `fcmTokens` array

### Option B: Use Settings Page

1. Navigate to **Settings** page
2. Click on the **Notifications** tab
3. Toggle the **"Enable Push Notifications"** switch
4. Allow the browser permission when prompted
5. Click **"Send Test Notification"** to verify it works

---

## Step 6: Verify Token Storage

1. Open Firebase Console
2. Go to **Firestore Database**
3. Navigate to `users` collection
4. Find your user document
5. Check for the `fcmTokens` array field
6. You should see an object with:
   ```json
   {
     "token": "your_fcm_token_here",
     "deviceId": "web_xxxxx",
     "platform": "web",
     "createdAt": "timestamp",
     "lastUsedAt": "timestamp",
     "isActive": true
   }
   ```

---

## Troubleshooting

### Issue: Permission Dialog Not Showing

**Cause**: Browser security requires user interaction

**Solution**:

- The notification prompt appears 2 seconds after login
- Click the "Enable Notifications" button
- Or go to Settings → Notifications tab

### Issue: "VAPID key not configured" Error

**Cause**: Missing or incorrect VAPID key

**Solution**:

1. Check `.env.local` file exists in project root
2. Verify `NEXT_PUBLIC_FIREBASE_VAPID_KEY` is set
3. Restart your development server after adding environment variables
4. Make sure the VAPID key is the **Key pair** value (not Sender ID)

### Issue: "Service worker registration failed"

**Cause**: Service worker file not found or HTTPS required (production)

**Solution**:

- Verify `public/firebase-messaging-sw.js` exists
- In production, ensure your site is served over HTTPS
- Check browser console for specific error messages

### Issue: Token Not Saved to Firestore

**Cause**: User document doesn't exist or permissions issue

**Solution**:

1. Verify the user document exists in Firestore
2. Check browser console for detailed error messages
3. Verify Firestore security rules allow updates to `fcmTokens` field
4. Ensure the user is properly authenticated

### Issue: Notifications Work in Settings But Not After Login

**Cause**: The automatic prompt might be dismissed

**Solution**:

- The prompt is dismissed for 7 days after clicking "Not Now"
- Clear localStorage or wait 7 days
- Or manually enable from Settings page

---

## Testing Notifications

### Send Test from Admin Portal

1. Go to **Notifications** page in the admin portal
2. Fill out the "Send Notification" form
3. Select a recipient (yourself)
4. Click **"Send Notification"**
5. You should receive the notification if:
   - You're on a different browser tab (background)
   - Or see it in the foreground (web notifications)

### Send Test from Firebase Console

1. Go to Firebase Console → Cloud Messaging
2. Click **"Send your first message"**
3. Enter notification title and text
4. Click **"Send test message"**
5. Paste your FCM token (from Firestore or browser console)
6. Click **"Test"**

---

## Browser Compatibility

| Browser | Support    | Notes                        |
| ------- | ---------- | ---------------------------- |
| Chrome  | ✅ Full    | Best support                 |
| Firefox | ✅ Full    | Full support                 |
| Safari  | ⚠️ Partial | macOS 13+ and iOS 16.4+ only |
| Edge    | ✅ Full    | Chromium-based               |
| Opera   | ✅ Full    | Chromium-based               |

---

## Security Best Practices

1. **Never commit `.env.local`** to version control
2. Use different Firebase projects for development and production
3. Restrict your Firebase API keys in Google Cloud Console
4. Implement proper Firestore security rules
5. Regularly audit and clean up inactive tokens

---

## Next Steps

Once push notifications are working:

1. ✅ Verify tokens are stored in Firestore
2. ✅ Test sending notifications from the admin portal
3. ✅ Configure notification types and preferences
4. ✅ Set up Cloud Functions for automated notifications (see `mobile_prompt.md`)
5. ✅ Implement the mobile app (React Native) notifications

---

## Support

If you're still experiencing issues:

1. Check browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure Firebase project has Cloud Messaging enabled
4. Review Firebase Console → Usage and Billing → Cloud Messaging quotas
5. Check Firestore security rules allow token updates

---

**Last Updated:** January 10, 2026
**Version:** 2.0.0
