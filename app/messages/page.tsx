import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Send } from "lucide-react"

export default function MessagesPage() {
  const conversations = [
    {
      id: "1",
      clientName: "Sarah Johnson",
      lastMessage: "Thank you! Looking forward to working with you.",
      timestamp: "2 hours ago",
      unread: 0,
      orderId: "ORD-001",
    },
    {
      id: "2",
      clientName: "Michael Chen",
      lastMessage: "Can we schedule a call to discuss the details?",
      timestamp: "5 hours ago",
      unread: 2,
      orderId: "ORD-002",
    },
    {
      id: "3",
      clientName: "Emma Williams",
      lastMessage: "Perfect! I'll send the deposit today.",
      timestamp: "1 day ago",
      unread: 0,
      orderId: "ORD-003",
    },
  ]

  const currentMessages = [
    {
      id: "1",
      senderId: "client-1",
      senderName: "Sarah Johnson",
      text: "Hi, I received your quote. It looks great!",
      timestamp: "10:30 AM",
    },
    {
      id: "2",
      senderId: "admin-1",
      senderName: "Admin",
      text: "Wonderful! I'm glad you're happy with it. Do you have any questions?",
      timestamp: "10:35 AM",
    },
    {
      id: "3",
      senderId: "client-1",
      senderName: "Sarah Johnson",
      text: "Just one - can we add an extra photographer?",
      timestamp: "10:40 AM",
    },
    {
      id: "4",
      senderId: "admin-1",
      senderName: "Admin",
      text: "That would be an additional 80,000 XAF. I'll update the quote for you.",
      timestamp: "10:42 AM",
    },
    {
      id: "5",
      senderId: "client-1",
      senderName: "Sarah Johnson",
      text: "Thank you! Looking forward to working with you.",
      timestamp: "10:45 AM",
    },
  ]

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <h2 className="text-lg font-semibold">Messages</h2>
          </div>
        </header>
        <div className="flex flex-1 flex-col p-6">
          <PageHeader title="Client Messages" description="Communicate with your clients" className="mb-6" />

          <div className="grid flex-1 gap-6 lg:grid-cols-3">
            {/* Conversations List */}
            <Card className="lg:col-span-1">
              <CardContent className="p-4">
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search conversations..." className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {conversation.clientName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{conversation.clientName}</p>
                          {conversation.unread > 0 && (
                            <Badge variant="default" className="h-5 w-5 rounded-full p-0 text-xs">
                              {conversation.unread}
                            </Badge>
                          )}
                        </div>
                        <p className="truncate text-sm text-muted-foreground">{conversation.lastMessage}</p>
                        <p className="text-xs text-muted-foreground">{conversation.timestamp}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Message Thread */}
            <Card className="lg:col-span-2">
              <CardContent className="flex h-full flex-col p-0">
                {/* Header */}
                <div className="border-b border-border p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>SJ</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Sarah Johnson</p>
                      <p className="text-sm text-muted-foreground">Order: ORD-001</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                  {currentMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.senderId.startsWith("admin") ? "flex-row-reverse" : ""}`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {message.senderName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex-1 ${message.senderId.startsWith("admin") ? "text-right" : ""}`}>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{message.senderName}</p>
                          <p className="text-xs text-muted-foreground">{message.timestamp}</p>
                        </div>
                        <div
                          className={`mt-1 inline-block rounded-lg p-3 ${
                            message.senderId.startsWith("admin") ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div className="border-t border-border p-4">
                  <div className="flex gap-2">
                    <Input placeholder="Type your message..." />
                    <Button size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
