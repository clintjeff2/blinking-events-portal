import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  Timestamp,
  DocumentData,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// Base Firebase API
export const firebaseApi = createApi({
  reducerPath: "firebaseApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: [
    "Users",
    "Events",
    "Services",
    "Staff",
    "Orders",
    "OrderMessages",
    "Testimonials",
    "FAQs",
    "Media",
    "Messages",
    "Notifications",
    "NotificationPreferences",
    "Analytics",
    "Marketing",
  ],
  endpoints: () => ({}),
});

// Helper function to convert Firestore data
export const convertFirestoreData = (data: DocumentData) => {
  const converted: any = { ...data };

  // Convert Timestamps to ISO strings
  Object.keys(converted).forEach((key) => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate().toISOString();
    }
  });

  return converted;
};

// Helper to add server timestamp
export const withTimestamp = (data: any, isUpdate = false) => {
  if (isUpdate) {
    return {
      ...data,
      updatedAt: serverTimestamp(),
    };
  }
  return {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
};
