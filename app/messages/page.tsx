/**
 * Messages Page
 * Admin messaging center with real-time conversations
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { PageHeader } from "@/components/page-header";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  ConversationsList,
  ChatWindow,
  NewConversationModal,
} from "@/components/messaging";
import { useConversations } from "@/hooks/use-conversations";
import { useMessages, markConversationAsRead } from "@/hooks/use-messages";
import {
  useGetOrCreateConversationMutation,
  useSendMessageMutation,
  useMarkAsReadMutation,
  useMarkMessagesAsDeliveredMutation,
  useMarkMessagesAsReadMutation,
  useLazyFindClientByEmailQuery,
} from "@/lib/redux/api/messagingApi";
import type { Conversation, ConversationStatus } from "@/types/messaging";
import { Timestamp } from "firebase/firestore";

export default function MessagesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasHandledParams = useRef(false);

  // Get authenticated admin user
  const { user: adminUser, isAuthenticated } = useAuth();
  const adminId = adminUser?.uid || "";
  const adminName = adminUser?.displayName || "Admin";

  // State
  const [activeTab, setActiveTab] = useState<ConversationStatus | "all">(
    "all" // Default to "all" so new conversations appear immediately
  );
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Real-time hooks
  const {
    conversations,
    loading: conversationsLoading,
    error: conversationsError,
    totalUnread,
  } = useConversations({
    adminId: adminId,
    status: activeTab === "all" ? undefined : (activeTab as ConversationStatus),
    enabled: isAuthenticated && !!adminId,
  });

  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
  } = useMessages({
    conversationId: selectedConversation?.conversationId || null,
    enabled: !!selectedConversation,
  });

  // Log messages state for debugging
  useEffect(() => {
    console.log("[MessagesPage] Messages state updated:", {
      messagesCount: messages.length,
      messagesLoading,
      messagesError,
      selectedConversationId: selectedConversation?.conversationId,
    });
  }, [messages, messagesLoading, messagesError, selectedConversation]);

  // Mutations and lazy queries
  const [getOrCreateConversation, { isLoading: isCreatingConversation }] =
    useGetOrCreateConversationMutation();
  const [sendMessage] = useSendMessageMutation();
  const [markAsRead] = useMarkAsReadMutation();
  const [markMessagesAsDelivered] = useMarkMessagesAsDeliveredMutation();
  const [markMessagesAsRead] = useMarkMessagesAsReadMutation();
  const [findClientByEmail] = useLazyFindClientByEmailQuery();

  // Handle URL params for opening conversation from other pages (e.g., orders)
  useEffect(() => {
    // Prevent running multiple times
    if (hasHandledParams.current) return;

    const clientName = searchParams.get("clientName");
    const clientEmail = searchParams.get("clientEmail");
    const orderId = searchParams.get("orderId");
    const orderNumber = searchParams.get("orderNumber");

    if (clientName && clientEmail) {
      hasHandledParams.current = true;
      handleStartConversationFromParams({
        clientName,
        clientEmail,
        orderId: orderId || undefined,
        orderNumber: orderNumber || undefined,
      });
    }
  }, [searchParams]);

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedConversation && adminId) {
      const unreadCount = selectedConversation.unreadCount[adminId] || 0;
      if (unreadCount > 0) {
        markConversationAsRead(selectedConversation.conversationId, adminId);
        markAsRead({
          conversationId: selectedConversation.conversationId,
          userId: adminId,
        });
      }
    }
  }, [selectedConversation, markAsRead, adminId]);

  // Mark messages as delivered/read when viewing them
  useEffect(() => {
    if (!selectedConversation || !messages.length) return;

    const conversationId = selectedConversation.conversationId;
    const clientId = selectedConversation.clientId;

    // Find messages from the client that need status updates
    // (messages sent by the client, not by admin)
    const clientMessages = messages.filter(
      (msg) => msg.senderId === clientId && !msg.isSystemMessage
    );

    // Check if there are any messages that need status updates
    const hasUndeliveredMessages = clientMessages.some(
      (msg) => msg.status === "sent"
    );
    const hasUnreadMessages = clientMessages.some(
      (msg) => msg.status === "sent" || msg.status === "delivered"
    );

    // Mark messages as delivered first (when admin opens conversation)
    if (hasUndeliveredMessages) {
      console.log(
        "[MessagesPage] Marking client messages as delivered for conversation:",
        conversationId
      );
      markMessagesAsDelivered({
        conversationId,
        recipientId: adminId, // Admin is the recipient opening the conversation
      }).then(() => {
        // After delivered, mark as read
        if (hasUnreadMessages) {
          console.log(
            "[MessagesPage] Marking client messages as read for conversation:",
            conversationId
          );
          markMessagesAsRead({
            conversationId,
            userId: adminId, // Admin is viewing the messages
            senderId: clientId, // Messages sent by the client
          });
        }
      });
    } else if (hasUnreadMessages) {
      // If already delivered, just mark as read
      console.log(
        "[MessagesPage] Marking client messages as read for conversation:",
        conversationId
      );
      markMessagesAsRead({
        conversationId,
        userId: adminId, // Admin is viewing the messages
        senderId: clientId, // Messages sent by the client
      });
    }
  }, [
    selectedConversation,
    messages,
    markMessagesAsDelivered,
    markMessagesAsRead,
    adminId,
  ]);

  // Handle starting conversation from URL params
  const handleStartConversationFromParams = async (params: {
    clientName: string;
    clientEmail: string;
    orderId?: string;
    orderNumber?: string;
  }) => {
    console.log(
      "[MessagesPage] handleStartConversationFromParams called with:",
      params
    );
    setIsInitializing(true);

    try {
      // First, find the actual client by email in the database
      console.log(
        "[MessagesPage] Finding client by email:",
        params.clientEmail
      );
      const clientResult = await findClientByEmail(params.clientEmail).unwrap();
      console.log("[MessagesPage] findClientByEmail result:", clientResult);

      if (!clientResult) {
        // Client not found in database
        console.log("[MessagesPage] Client not found in database");
        toast({
          title: "Client Not Found",
          description: `No client account found with email: ${params.clientEmail}`,
          variant: "destructive",
        });
        // Clear URL params
        router.replace("/messages");
        setIsInitializing(false);
        return;
      }

      // Use the actual client ID from the database
      console.log(
        "[MessagesPage] Creating/getting conversation for client:",
        clientResult.uid
      );
      const result = await getOrCreateConversation({
        clientId: clientResult.uid,
        clientName: clientResult.fullName || params.clientName,
        adminId: adminId,
        adminName: adminName,
        orderId: params.orderId,
        orderNumber: params.orderNumber,
      }).unwrap();

      console.log("[MessagesPage] getOrCreateConversation result:", result);

      // Convert serialized conversation to Conversation type
      const conversation: Conversation = {
        ...result,
        createdAt: Timestamp.fromDate(new Date(result.createdAt)),
        updatedAt: Timestamp.fromDate(new Date(result.updatedAt)),
        lastMessage: result.lastMessage
          ? {
              ...result.lastMessage,
              timestamp: Timestamp.fromDate(
                new Date(result.lastMessage.timestamp)
              ),
            }
          : undefined,
      };

      console.log(
        "[MessagesPage] Setting selected conversation:",
        conversation.conversationId
      );
      setSelectedConversation(conversation);

      // Clear URL params after successful initialization
      router.replace("/messages");

      toast({
        title: params.orderId
          ? "Order Conversation Ready"
          : "Conversation Ready",
        description: `Messaging with ${clientResult.fullName}${
          params.orderNumber ? ` for ${params.orderNumber}` : ""
        }`,
      });
    } catch (error: any) {
      console.error(
        "[MessagesPage] Error creating conversation from params:",
        error
      );
      console.error(
        "[MessagesPage] Error details:",
        JSON.stringify(error, null, 2)
      );
      toast({
        title: "Error",
        description:
          error.message || "Failed to start conversation. Please try again.",
        variant: "destructive",
      });
      // Clear URL params on error
      router.replace("/messages");
    } finally {
      setIsInitializing(false);
    }
  };

  // Handle selecting a conversation
  const handleSelectConversation = useCallback((conversation: Conversation) => {
    console.log("[MessagesPage] handleSelectConversation called with:", {
      conversationId: conversation.conversationId,
      clientId: conversation.clientId,
      status: conversation.status,
    });
    setSelectedConversation(conversation);
  }, []);

  // Handle opening new conversation modal
  const handleNewConversation = useCallback(() => {
    setIsNewConversationOpen(true);
  }, []);

  // Handle starting a new conversation
  const handleStartConversation = async (
    client: { uid: string; fullName: string; email: string },
    priority?: "normal" | "high" | "urgent"
  ) => {
    console.log("[MessagesPage] handleStartConversation called with:", {
      client,
      priority,
    });

    try {
      console.log("[MessagesPage] Calling getOrCreateConversation...");
      const result = await getOrCreateConversation({
        clientId: client.uid,
        clientName: client.fullName,
        adminId: adminId,
        adminName: adminName,
        priority,
      }).unwrap();

      console.log("[MessagesPage] getOrCreateConversation result:", result);

      // Convert serialized conversation to Conversation type
      const conversation: Conversation = {
        ...result,
        createdAt: Timestamp.fromDate(new Date(result.createdAt)),
        updatedAt: Timestamp.fromDate(new Date(result.updatedAt)),
        lastMessage: result.lastMessage
          ? {
              ...result.lastMessage,
              timestamp: Timestamp.fromDate(
                new Date(result.lastMessage.timestamp)
              ),
            }
          : undefined,
      };

      console.log(
        "[MessagesPage] Setting selected conversation:",
        conversation.conversationId
      );
      setSelectedConversation(conversation);
      setIsNewConversationOpen(false);

      toast({
        title: "Conversation Started",
        description: `Started conversation with ${client.fullName}`,
      });
    } catch (error: any) {
      console.error("[MessagesPage] Error creating conversation:", error);
      console.error(
        "[MessagesPage] Error details:",
        JSON.stringify(error, null, 2)
      );
      toast({
        title: "Error",
        description:
          error.message || "Failed to start conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle sending a message
  const handleSendMessage = async (text: string) => {
    if (!selectedConversation || !adminId) return;

    setIsSending(true);
    try {
      await sendMessage({
        conversationId: selectedConversation.conversationId,
        senderId: adminId,
        senderName: adminName,
        senderRole: "admin",
        text,
        recipientId: selectedConversation.clientId,
      }).unwrap();
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Calculate status counts
  const statusCounts = {
    all: conversations.length,
    active: conversations.filter((c) => c.status === "active").length,
    archived: conversations.filter((c) => c.status === "archived").length,
    closed: conversations.filter((c) => c.status === "closed").length,
  };

  // Filter conversations by tab
  const filteredConversations =
    activeTab === "all"
      ? conversations
      : conversations.filter((c) => c.status === activeTab);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Messages</h2>
              {totalUnread > 0 && (
                <Badge variant="default" className="rounded-full">
                  {totalUnread}
                </Badge>
              )}
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col p-6">
          <PageHeader
            title="Client Messages"
            description="Communicate with your clients in real-time"
            className="mb-6"
          />

          {/* Status Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as ConversationStatus | "all")}
            className="mb-4"
          >
            <TabsList>
              <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
              <TabsTrigger value="active">
                Active ({statusCounts.active})
              </TabsTrigger>
              <TabsTrigger value="archived">
                Archived ({statusCounts.archived})
              </TabsTrigger>
              <TabsTrigger value="closed">
                Closed ({statusCounts.closed})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Main Content */}
          {isInitializing ? (
            <div
              className="flex flex-1 items-center justify-center"
              style={{ minHeight: "calc(100vh - 320px)" }}
            >
              <Card className="w-full max-w-sm">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-sm font-medium">
                    Starting conversation...
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Finding client and loading messages
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div
              className="grid flex-1 gap-6 lg:grid-cols-3"
              style={{ minHeight: "calc(100vh - 320px)" }}
            >
              {/* Conversations List */}
              <div className="lg:col-span-1 h-full">
                <ConversationsList
                  conversations={filteredConversations}
                  loading={conversationsLoading}
                  error={conversationsError}
                  selectedConversationId={
                    selectedConversation?.conversationId || null
                  }
                  adminId={adminId}
                  onSelectConversation={handleSelectConversation}
                  onNewConversation={handleNewConversation}
                />
              </div>

              {/* Chat Window */}
              <div className="lg:col-span-2 h-full">
                <ChatWindow
                  conversation={selectedConversation}
                  messages={messages}
                  loading={messagesLoading}
                  adminId={adminId}
                  adminName={adminName}
                  onSendMessage={handleSendMessage}
                  isSending={isSending}
                />
              </div>
            </div>
          )}
        </div>

        {/* New Conversation Modal */}
        <NewConversationModal
          isOpen={isNewConversationOpen}
          onClose={() => setIsNewConversationOpen(false)}
          onStartConversation={handleStartConversation}
          isLoading={isCreatingConversation}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
