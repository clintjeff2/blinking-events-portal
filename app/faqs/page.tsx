"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import { AddFaqModal } from "@/components/add-faq-modal"
import { useState } from "react"

export default function FAQsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const faqs = [
    {
      id: "1",
      question: "How far in advance should I book your services?",
      answer:
        "We recommend booking at least 3-6 months in advance for major events like weddings. For corporate events, 2-3 months is usually sufficient. However, we can accommodate last-minute requests based on availability.",
      category: "Booking",
      isActive: true,
    },
    {
      id: "2",
      question: "What payment methods do you accept?",
      answer:
        "We accept bank transfers, mobile money (MTN, Orange), and cash payments. A 50% deposit is required to confirm your booking, with the balance due one week before the event.",
      category: "Payment",
      isActive: true,
    },
    {
      id: "3",
      question: "Can I customize my event package?",
      answer:
        "All our packages are fully customizable. We work with you to create a tailored solution that fits your specific needs and budget.",
      category: "Services",
      isActive: true,
    },
    {
      id: "4",
      question: "Do you provide services outside Douala?",
      answer:
        "Yes, we provide services throughout Cameroon. Additional travel fees may apply for events outside the Douala region.",
      category: "Services",
      isActive: true,
    },
    {
      id: "5",
      question: "What is your cancellation policy?",
      answer:
        "Cancellations made 30+ days before the event receive a 75% refund. Cancellations 15-29 days before receive 50%. Less than 15 days notice results in no refund, but you can reschedule within 6 months.",
      category: "Policy",
      isActive: true,
    },
  ]

  const categories = ["All", "Booking", "Payment", "Services", "Policy"]

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <h2 className="text-lg font-semibold">FAQs</h2>
            <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add FAQ
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <PageHeader title="FAQs & Knowledge Base" description="Manage frequently asked questions and help articles" />

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1 md:max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search FAQs..." className="pl-9" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={category === "All" ? "default" : "outline"}
                      size="sm"
                      className="bg-transparent"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQs List */}
          <div className="space-y-4">
            {faqs.map((faq) => (
              <Card key={faq.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{faq.question}</CardTitle>
                      <CardDescription className="mt-2">{faq.answer}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{faq.category}</Badge>
                      <Badge variant={faq.isActive ? "default" : "secondary"}>
                        {faq.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive bg-transparent">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <AddFaqModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
      </SidebarInset>
    </SidebarProvider>
  )
}
