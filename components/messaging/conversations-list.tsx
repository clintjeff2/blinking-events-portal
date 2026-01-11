/**
 * Conversations List Component
 * Displays all conversations with real-time updates
 */

"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Package, Clock, AlertCircle } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import type { Conversation } from "@/types/messaging";
import { cn } from "@/lib/utils";

interface ConversationsListProps {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  selectedConversationId: string | null;
  adminId: string;
  onSelectConversation: (conversation: Conversation) => void;
  onNewConversation: () => void;
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

// Helper to format relative time
function formatRelativeTime(timestamp: Timestamp): string {
  const now = new Date();
  const date = timestamp.toDate();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Get client from conversation participants
function getClient(conversation: Conversation) {
  return conversation.participants.find((p) => p.role === "client");
}

export function ConversationsList({
  conversations,
  loading,
  error,
  selectedConversationId,
  adminId,
  onSelectConversation,
  onNewConversation,
}: ConversationsListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter conversations by search query
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const client = getClient(conv);
    return (
      client?.fullName.toLowerCase().includes(searchLower) ||
      conv.orderNumber?.toLowerCase().includes(searchLower) ||
      conv.lastMessage?.text.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="p-4 space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-destructive font-medium">
            Failed to load conversations
          </p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-4 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button size="icon" onClick={onNewConversation}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Conversations */}
        <ScrollArea className="flex-1 -mx-4 px-4">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No conversations match your search"
                  : "No conversations yet"}
              </p>
              {!searchQuery && (
                <Button
                  variant="link"
                  onClick={onNewConversation}
                  className="mt-2"
                >
                  Start a new conversation
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map((conversation) => {
                const client = getClient(conversation);
                const unreadCount = conversation.unreadCount[adminId] || 0;
                const isSelected =
                  selectedConversationId === conversation.conversationId;

                return (
                  <button
                    key={conversation.conversationId}
                    onClick={() => onSelectConversation(conversation)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors",
                      "hover:bg-muted/50",
                      isSelected && "bg-muted border-l-2 border-l-primary"
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        {client?.avatarUrl && (
                          <AvatarImage src={client.avatarUrl} />
                        )}
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(client?.fullName || "?")}
                        </AvatarFallback>
                      </Avatar>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 overflow-hidden min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "font-medium truncate",
                            unreadCount > 0 && "font-semibold"
                          )}
                        >
                          {client?.fullName || "Unknown"}
                        </span>
                        {conversation.lastMessage && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatRelativeTime(
                              conversation.lastMessage.timestamp
                            )}
                          </span>
                        )}
                      </div>

                      {conversation.orderNumber && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Package className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground font-mono">
                            {conversation.orderNumber}
                          </span>
                        </div>
                      )}

                      {conversation.lastMessage && (
                        <p
                          className={cn(
                            "text-sm truncate mt-1",
                            unreadCount > 0
                              ? "text-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {conversation.lastMessage.senderId === adminId && (
                            <span className="text-muted-foreground">You: </span>
                          )}
                          {conversation.lastMessage.type === "system" ? (
                            <span className="italic">
                              {conversation.lastMessage.text}
                            </span>
                          ) : (
                            conversation.lastMessage.text
                          )}
                        </p>
                      )}

                      {/* Priority badge */}
                      {conversation.metadata?.priority &&
                        conversation.metadata.priority !== "normal" && (
                          <Badge
                            variant={
                              conversation.metadata.priority === "urgent"
                                ? "destructive"
                                : "secondary"
                            }
                            className="mt-1 text-[10px] h-5"
                          >
                            {conversation.metadata.priority}
                          </Badge>
                        )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
