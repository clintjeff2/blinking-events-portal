# Firebase Cloud Functions Deployment - Setup Required

## Issue Encountered

Firebase Cloud Functions deployment failed because billing is not enabled for the project.

## Solution: Enable Billing

### Step 1: Go to Firebase Console

1. Visit: https://console.firebase.google.com/
2. Select project: **inglis-and-sumelong** (or create a new `blinking-events` project)

### Step 2: Enable Billing

1. Click on **⚙️ Settings** (gear icon) → **Usage and billing**
2. Click **Details & settings**
3. Click **Modify plan**
4. Choose **Blaze Plan** (Pay as you go)
   - **Note**: Blaze plan has a generous free tier
   - You only pay if you exceed free tier limits

### Step 3: Verify Required APIs

After enabling billing, these APIs will be automatically enabled:

- ✅ Cloud Functions API
- ✅ Cloud Build API
- ✅ Artifact Registry API

## Firebase Pricing - Cloud Functions Free Tier

Good news! Cloud Functions has a generous free tier:

| Resource            | Free Tier (Monthly) |
| ------------------- | ------------------- |
| Invocations         | 2,000,000           |
| GB-seconds          | 400,000             |
| CPU-seconds         | 200,000             |
| Outbound networking | 5 GB                |

For the Blinking Events notification system:

- Each notification ≈ 1 invocation
- Typical function execution ≈ 0.5 seconds
- **Estimated capacity**: ~2 million notifications/month for FREE

You'll only be charged if you exceed these limits.

## Alternative: Use a Different Project

If you don't want to enable billing on `inglis-and-sumelong`, you can:

### Option 1: Create a new `blinking-events` project

```bash
# Create new project
firebase projects:create blinking-events

# Select the new project
firebase use blinking-events

# Deploy
firebase deploy --only functions
```

### Option 2: Use the existing Firebase project from firebase.js

The `firebase.js` file references `projectId: "blinking-events"`. If this project exists under a different account:

1. Log in with that account:

   ```bash
   firebase logout
   firebase login
   ```

2. Update `.firebaserc`:

   ```json
   {
     "projects": {
       "default": "blinking-events"
     }
   }
   ```

3. Deploy:
   ```bash
   firebase deploy --only functions
   ```

## After Enabling Billing

Once billing is enabled, run:

```bash
cd /home/jeffersonyouashi/Documents/blinking-events/blinking-events-portal
firebase deploy --only functions
```

This will:

1. ✅ Build TypeScript functions
2. ✅ Enable required APIs
3. ✅ Deploy all 6 Cloud Functions
4. ✅ Make the notification system fully operational

## Cost Monitoring

To monitor costs:

1. Firebase Console → Usage and billing
2. Set up budget alerts
3. Monitor function invocations

**Expected monthly cost for moderate usage**: $0-5 (most apps stay in free tier)

## What Happens Next

After successful deployment, you'll see:

```
✔ functions deployed successfully:
  - onNotificationCreated
  - onMessageCreated
  - onOrderUpdated
  - sendNotificationToUser
  - broadcastNotification
  - cleanupOldNotifications
```

Then test by sending a notification from the admin portal!

---

**Current Status**: ⏸️ Waiting for billing to be enabled  
**Next Step**: Enable Blaze plan in Firebase Console  
**ETA to deploy**: 5 minutes after enabling billing
