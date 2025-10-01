"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Search, MoreVertical, Edit, Trash2, Eye, Star } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { AddServiceModal } from "@/components/add-service-modal"

export default function ServicesPage() {
  const [showAddModal, setShowAddModal] = useState(false)

  const handleAddService = (data: any) => {
    console.log("[v0] New service data:", data)
    // TODO: Integrate with Firebase
  }

  const services = [
    {
      id: "1",
      name: "Premium Wedding Package",
      category: "Wedding",
      priceRange: { min: 400000, max: 800000 },
      packages: 3,
      isActive: true,
      featured: true,
      bookings: 45,
    },
    {
      id: "2",
      name: "Corporate Event Management",
      category: "Corporate",
      priceRange: { min: 300000, max: 600000 },
      packages: 2,
      isActive: true,
      featured: false,
      bookings: 32,
    },
    {
      id: "3",
      name: "Cultural Ceremony Services",
      category: "Cultural",
      priceRange: { min: 250000, max: 500000 },
      packages: 2,
      isActive: true,
      featured: true,
      bookings: 28,
    },
    {
      id: "4",
      name: "Birthday Party Planning",
      category: "Social",
      priceRange: { min: 150000, max: 350000 },
      packages: 3,
      isActive: true,
      featured: false,
      bookings: 18,
    },
    {
      id: "5",
      name: "Conference & Seminar Setup",
      category: "Corporate",
      priceRange: { min: 200000, max: 450000 },
      packages: 2,
      isActive: false,
      featured: false,
      bookings: 12,
    },
  ]

  const categories = ["All", "Wedding", "Corporate", "Cultural", "Social"]

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <h2 className="text-lg font-semibold">Services</h2>
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <PageHeader title="Service Management" description="Manage your event services, packages, and pricing" />

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1 md:max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search services..." className="pl-9" />
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

          {/* Services Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.id} className="relative overflow-hidden">
                {service.featured && (
                  <div className="absolute right-4 top-4">
                    <Badge variant="secondary" className="bg-accent/10 text-accent">
                      <Star className="mr-1 h-3 w-3 fill-current" />
                      Featured
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <CardDescription className="mt-1">
                        <Badge variant="outline" className="mt-2">
                          {service.category}
                        </Badge>
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Service
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Star className="mr-2 h-4 w-4" />
                          {service.featured ? "Remove from Featured" : "Mark as Featured"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Service
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Price Range</p>
                    <p className="text-lg font-semibold">
                      {service.priceRange.min.toLocaleString()} - {service.priceRange.max.toLocaleString()} XAF
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{service.packages} packages</span>
                    <span className="text-muted-foreground">{service.bookings} bookings</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant={service.isActive ? "default" : "secondary"}>
                      {service.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Link href={`/services/${service.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </SidebarInset>
      <AddServiceModal open={showAddModal} onOpenChange={setShowAddModal} onSubmit={handleAddService} />
    </SidebarProvider>
  )
}
