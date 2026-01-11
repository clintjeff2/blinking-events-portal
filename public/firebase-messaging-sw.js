/**
 * Firebase Cloud Messaging Service Worker
 * Handles background push notifications
 *
 * This file must be in the public folder at the root level
 *
 * IMPORTANT: Update the Firebase config below with your actual values.
 * These values should match your Firebase project configuration.
 * You can find these in Firebase Console > Project Settings > General > Your apps
 */

// Import Firebase scripts
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js"
);

// Firebase configuration
// IMPORTANT: Replace these placeholder values with your actual Firebase config
// You can find these values in Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
  apiKey: self.FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: self.FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
  projectId: self.FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: self.FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT.appspot.com",
  messagingSenderId:
    self.FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: self.FIREBASE_APP_ID || "YOUR_APP_ID",
};

// Try to get config from the client if available
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "FIREBASE_CONFIG") {
    console.log(
      "[firebase-messaging-sw.js] Received Firebase config from client"
    );
    Object.assign(firebaseConfig, event.data.config);
  }
});

// Initialize Firebase in the service worker
try {
  firebase.initializeApp(firebaseConfig);
  console.log("[firebase-messaging-sw.js] Firebase initialized successfully");
} catch (error) {
  console.error(
    "[firebase-messaging-sw.js] Firebase initialization error:",
    error
  );
}

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message:",
    payload
  );

  const notificationTitle = payload.notification?.title || "Blinking Events";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/placeholder-logo.png",
    badge: "/placeholder-logo.png",
    tag: payload.data?.notificationId || "default",
    data: payload.data,
    actions: [
      {
        action: "open",
        title: "View",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  console.log("[firebase-messaging-sw.js] Notification click:", event);

  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  // Get the notification data
  const data = event.notification.data;
  let targetUrl = "/";

  // Determine where to navigate based on notification type
  if (data) {
    switch (data.type) {
      case "order":
        targetUrl = data.referenceId
          ? `/orders/${data.referenceId}`
          : "/orders";
        break;
      case "message":
        targetUrl = data.referenceId
          ? `/messages?conversation=${data.referenceId}`
          : "/messages";
        break;
      case "promo":
      case "info":
        targetUrl = data.url || "/notifications";
        break;
      default:
        targetUrl = data.url || "/";
    }
  }

  // Open or focus the app window
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window/tab open
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            client.navigate(targetUrl);
            return;
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
