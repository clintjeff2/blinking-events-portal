/**
 * useConversations Hook
 * Real-time listener for conversations
 */

"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Conversation, ConversationStatus } from "@/types/messaging";

interface UseConversationsOptions {
  adminId: string;
  status?: ConversationStatus;
  enabled?: boolean;
}

interface UseConversationsReturn {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  totalUnread: number;
}

export function useConversations({
  adminId,
  status, // No default - undefined means "all"
  enabled = true,
}: UseConversationsOptions): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    console.log("[useConversations] Effect running with:", {
      adminId,
      status,
      enabled,
    });

    if (!enabled || !adminId) {
      console.log("[useConversations] Not enabled or no adminId, skipping");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const conversationsRef = collection(db, "conversations");

    // Simple query - just filter by adminId, do other filtering client-side
    // This avoids composite index requirements
    console.log("[useConversations] Creating query for adminId:", adminId);
    const q = query(conversationsRef, where("adminId", "==", adminId));

    console.log("[useConversations] Setting up onSnapshot listener...");
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log(
          "[useConversations] Snapshot received, docs count:",
          snapshot.size
        );
        let convos: Conversation[] = [];
        let unread = 0;

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          console.log("[useConversations] Processing conversation:", doc.id, {
            clientId: data.clientId,
            status: data.status,
          });

          const conversation: Conversation = {
            conversationId: doc.id,
            participants: data.participants || [],
            clientId: data.clientId || "",
            adminId: data.adminId || "",
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            lastMessage: data.lastMessage,
            unreadCount: data.unreadCount || {},
            status: data.status || "active",
            createdAt: data.createdAt || Timestamp.now(),
            updatedAt: data.updatedAt || Timestamp.now(),
            createdBy: data.createdBy || "",
            metadata: data.metadata,
          };

          convos.push(conversation);
          unread += conversation.unreadCount[adminId] || 0;
        });

        // Client-side filtering by status if specified
        if (status) {
          convos = convos.filter((c) => c.status === status);
          console.log("[useConversations] After status filter:", convos.length);
        }

        // Client-side sorting by updatedAt (newest first)
        convos.sort((a, b) => {
          const aTime = a.updatedAt?.toMillis?.() || 0;
          const bTime = b.updatedAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

        console.log("[useConversations] Total conversations:", convos.length);
        console.log("[useConversations] Total unread:", unread);
        setConversations(convos);
        setTotalUnread(unread);
        setLoading(false);
      },
      (err) => {
        console.error("[useConversations] Listener error:", err);
        console.error("[useConversations] Error code:", err.code);
        console.error("[useConversations] Error message:", err.message);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      console.log("[useConversations] Unsubscribing from listener");
      unsubscribe();
    };
  }, [adminId, status, enabled]);

  return { conversations, loading, error, totalUnread };
}
