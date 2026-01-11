/**
 * useMessages Hook
 * Real-time listener for messages in a conversation
 */

"use client";

import { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Message } from "@/types/messaging";

interface UseMessagesOptions {
  conversationId: string | null;
  enabled?: boolean;
}

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
}

export function useMessages({
  conversationId,
  enabled = true,
}: UseMessagesOptions): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[useMessages] Effect running with:", {
      conversationId,
      enabled,
    });

    if (!enabled || !conversationId) {
      console.log(
        "[useMessages] Not enabled or no conversationId, clearing messages"
      );
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    console.log(
      "[useMessages] Setting up listener for conversation:",
      conversationId
    );

    const messagesRef = collection(
      db,
      "conversations",
      conversationId,
      "messages"
    );

    // Simplified query - just order by createdAt, filter isDeleted client-side
    // This avoids composite index requirements
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    console.log("[useMessages] Query created, subscribing to onSnapshot...");

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log(
          "[useMessages] Snapshot received, docs count:",
          snapshot.size
        );

        const msgs: Message[] = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              messageId: doc.id,
              conversationId: data.conversationId || conversationId,
              senderId: data.senderId || "",
              senderName: data.senderName || "",
              senderRole: data.senderRole || "client",
              senderAvatar: data.senderAvatar,
              text: data.text || "",
              type: data.type || "text",
              attachments: data.attachments,
              status: data.status || "sent",
              createdAt: data.createdAt || Timestamp.now(),
              deliveredAt: data.deliveredAt,
              readAt: data.readAt,
              readBy: data.readBy,
              isDeleted: data.isDeleted || false,
              deletedAt: data.deletedAt,
              replyTo: data.replyTo,
              isSystemMessage: data.isSystemMessage || false,
            };
          })
          // Filter deleted messages client-side
          .filter((msg) => !msg.isDeleted);

        console.log("[useMessages] Processed messages:", msgs.length);
        setMessages(msgs);
        setLoading(false);
      },
      (err) => {
        console.error("[useMessages] Listener error:", err);
        console.error("[useMessages] Error code:", err.code);
        console.error("[useMessages] Error message:", err.message);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      console.log("[useMessages] Unsubscribing from listener");
      unsubscribe();
    };
  }, [conversationId, enabled]);

  return { messages, loading, error };
}

/**
 * Mark conversation as read
 */
export async function markConversationAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  try {
    const conversationRef = doc(db, "conversations", conversationId);
    await updateDoc(conversationRef, {
      [`unreadCount.${userId}`]: 0,
    });
  } catch (error) {
    console.error("Error marking conversation as read:", error);
    throw error;
  }
}
