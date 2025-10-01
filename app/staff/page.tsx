"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Search, MoreVertical, Edit, Trash2, Eye, Star, Calendar } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { AddStaffModal } from "@/components/add-staff-modal"

export default function StaffPage() {
  const [showAddModal, setShowAddModal] = useState(false)

  const handleAddStaff = (data: any) => {
    console.log("[v0] New staff data:", data)
    // TODO: Integrate with Firebase
  }

  const staff = [
    {
      id: "1",
      fullName: "Sarah Mitchell",
      photoUrl: "/placeholder.svg?height=100&width=100",
      categories: ["Hostess", "Event Coordinator"],
      skills: ["Customer Service", "Event Planning", "Multilingual"],
      languages: ["English", "French", "Spanish"],
      rating: 4.9,
      reviewCount: 45,
      eventsCompleted: 78,
      isActive: true,
      availability: "Available",
    },
    {
      id: "2",
      fullName: "John Davidson",
      photoUrl: "/placeholder.svg?height=100&width=100",
      categories: ["MC", "DJ"],
      skills: ["Public Speaking", "Entertainment", "Music Production"],
      languages: ["English", "French"],
      rating: 4.8,
      reviewCount: 38,
      eventsCompleted: 65,
      isActive: true,
      availability: "Available",
    },
    {
      id: "3",
      fullName: "Emma Williams",
      photoUrl: "/placeholder.svg?height=100&width=100",
      categories: ["Hostess", "Protocol Officer"],
      skills: ["Protocol Management", "VIP Handling", "Etiquette"],
      languages: ["English", "French", "German"],
      rating: 4.7,
      reviewCount: 42,
      eventsCompleted: 72,
      isActive: true,
      availability: "Booked",
    },
    {
      id: "4",
      fullName: "Michael Chen",
      photoUrl: "/placeholder.svg?height=100&width=100",
      categories: ["Security", "Crowd Control"],
      skills: ["Security Management", "Risk Assessment", "First Aid"],
      languages: ["English", "French"],
      rating: 4.9,
      reviewCount: 51,
      eventsCompleted: 89,
      isActive: true,
      availability: "Available",
    },
    {
      id: "5",
      fullName: "Lisa Kamara",
      photoUrl: "/placeholder.svg?height=100&width=100",
      categories: ["Photographer", "Videographer"],
      skills: ["Photography", "Videography", "Editing"],
      languages: ["English", "French"],
      rating: 4.6,
      reviewCount: 33,
      eventsCompleted: 54,
      isActive: false,
      availability: "Unavailable",
    },
  ]

  const categories = ["All", "Hostess", "MC", "Security", "Photographer", "Protocol Officer"]

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <h2 className="text-lg font-semibold">Staff Profiles</h2>
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Staff Member
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <PageHeader
            title="Staff Management"
            description="Manage your team members, their profiles, and availability"
          />

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1 md:max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search staff..." className="pl-9" />
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

          {/* Staff Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {staff.map((member) => (
              <Card key={member.id} className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={member.photoUrl || "/placeholder.svg"} alt={member.fullName} />
                      <AvatarFallback>
                        {member.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{member.fullName}</CardTitle>
                          <div className="mt-1 flex items-center gap-1">
                            <Star className="h-4 w-4 fill-accent text-accent" />
                            <span className="text-sm font-medium">{member.rating}</span>
                            <span className="text-sm text-muted-foreground">({member.reviewCount})</span>
                          </div>
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
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="mr-2 h-4 w-4" />
                              Manage Availability
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove Staff
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-1">
                    {member.categories.map((category) => (
                      <Badge key={category} variant="outline" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Skills</p>
                    <p className="text-sm">{member.skills.slice(0, 2).join(", ")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Languages</p>
                    <p className="text-sm">{member.languages.join(", ")}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{member.eventsCompleted} events</span>
                    <Badge
                      variant={
                        member.availability === "Available"
                          ? "default"
                          : member.availability === "Booked"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {member.availability}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant={member.isActive ? "default" : "secondary"}>
                      {member.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Link href={`/staff/${member.id}`}>
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </SidebarInset>
      <AddStaffModal open={showAddModal} onOpenChange={setShowAddModal} onSubmit={handleAddStaff} />
    </SidebarProvider>
  )
}
