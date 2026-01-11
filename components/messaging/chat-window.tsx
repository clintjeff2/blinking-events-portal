/**
 * Chat Window Component
 * Displays messages and input for a conversation
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Send,
  Package,
  Phone,
  Mail,
  ExternalLink,
  Check,
  CheckCheck,
  Loader2,
  ArrowDown,
  Info,
} from "lucide-react";
import Link from "next/link";
import { Timestamp } from "firebase/firestore";
import type { Conversation, Message } from "@/types/messaging";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  adminId: string;
  adminName: string;
  onSendMessage: (text: string) => Promise<void>;
  isSending?: boolean;
}

// Helper to get initials from name
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Helper to format time
function formatTime(timestamp: Timestamp): string {
  return timestamp.toDate().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Helper to format date
function formatDate(timestamp: Timestamp): string {
  const date = timestamp.toDate();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

// Check if we should show date separator
function shouldShowDateSeparator(
  currentMsg: Message,
  prevMsg: Message | null
): boolean {
  if (!prevMsg) return true;
  const currentDate = currentMsg.createdAt.toDate().toDateString();
  const prevDate = prevMsg.createdAt.toDate().toDateString();
  return currentDate !== prevDate;
}

// Get client from conversation
function getClient(conversation: Conversation) {
  return conversation.participants.find((p) => p.role === "client");
}

// Status indicator component
function StatusIndicator({ status }: { status: string }) {
  switch (status) {
    case "sent":
      return <Check className="h-3 w-3 text-muted-foreground" />;
    case "delivered":
      return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
    case "read":
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    default:
      return null;
  }
}

// Message bubble component
function MessageBubble({
  message,
  isOwnMessage,
  showAvatar,
}: {
  message: Message;
  isOwnMessage: boolean;
  showAvatar: boolean;
}) {
  if (message.isSystemMessage) {
    return (
      <div className="flex justify-center my-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full text-xs text-muted-foreground">
          <Info className="h-3 w-3" />
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-2 max-w-[85%]",
        isOwnMessage ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {showAvatar && !isOwnMessage ? (
        <Avatar className="h-8 w-8 shrink-0">
          {message.senderAvatar && <AvatarImage src={message.senderAvatar} />}
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {getInitials(message.senderName)}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-8 shrink-0" />
      )}

      <div
        className={cn(
          "flex flex-col",
          isOwnMessage ? "items-end" : "items-start"
        )}
      >
        {showAvatar && !isOwnMessage && (
          <span className="text-xs text-muted-foreground mb-1 ml-1">
            {message.senderName}
          </span>
        )}

        <div
          className={cn(
            "rounded-2xl px-4 py-2 max-w-full break-words",
            isOwnMessage
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted rounded-tl-sm"
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        </div>

        <div className="flex items-center gap-1 mt-1 px-1">
          <span className="text-[10px] text-muted-foreground">
            {formatTime(message.createdAt)}
          </span>
          {isOwnMessage && <StatusIndicator status={message.status} />}
        </div>
      </div>
    </div>
  );
}

export function ChatWindow({
  conversation,
  messages,
  loading,
  adminId,
  adminName,
  onSendMessage,
  isSending = false,
}: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const isNearBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text || isSending) return;

    setNewMessage("");
    await onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Empty state
  if (!conversation) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">No conversation selected</h3>
          <p className="text-sm text-muted-foreground">
            Select a conversation from the list or start a new one
          </p>
        </CardContent>
      </Card>
    );
  }

  const client = getClient(conversation);

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {client?.avatarUrl && <AvatarImage src={client.avatarUrl} />}
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(client?.fullName || "?")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{client?.fullName || "Unknown"}</h3>
              {conversation.orderNumber && (
                <Link
                  href={`/orders/${conversation.orderId}`}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <Package className="h-3 w-3" />
                  <span className="font-mono">{conversation.orderNumber}</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>

          {/* Priority badge */}
          {conversation.metadata?.priority &&
            conversation.metadata.priority !== "normal" && (
              <Badge
                variant={
                  conversation.metadata.priority === "urgent"
                    ? "destructive"
                    : "secondary"
                }
              >
                {conversation.metadata.priority}
              </Badge>
            )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea
        className="flex-1 p-4"
        ref={scrollAreaRef}
        onScrollCapture={handleScroll}
      >
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn("flex gap-2", i % 2 === 0 && "flex-row-reverse")}
              >
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton
                  className={cn(
                    "h-16 rounded-2xl",
                    i % 2 === 0 ? "w-48" : "w-64"
                  )}
                />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Send className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message, index) => {
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const isOwnMessage = message.senderId === adminId;
              const showDateSeparator = shouldShowDateSeparator(
                message,
                prevMessage
              );
              const showAvatar =
                !prevMessage ||
                prevMessage.senderId !== message.senderId ||
                showDateSeparator;

              return (
                <div key={message.messageId}>
                  {showDateSeparator && (
                    <div className="flex items-center gap-4 my-4">
                      <Separator className="flex-1" />
                      <span className="text-xs text-muted-foreground">
                        {formatDate(message.createdAt)}
                      </span>
                      <Separator className="flex-1" />
                    </div>
                  )}
                  <MessageBubble
                    message={message}
                    isOwnMessage={isOwnMessage}
                    showAvatar={showAvatar}
                  />
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Scroll to bottom button */}
        {showScrollButton && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute bottom-20 right-4 rounded-full shadow-lg"
            onClick={scrollToBottom}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
