"use client"

import { useState } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, MoreVertical, Edit, Trash2, Eye, Star, Upload, ImageIcon, Video, Globe } from "lucide-react"
import { AddMediaModal } from "@/components/add-media-modal"

export default function MediaPage() {
  const [showUploadModal, setShowUploadModal] = useState(false)

  const handleUploadMedia = (data: any) => {
    console.log("[v0] New media data:", data)
    // TODO: Integrate with Firebase
  }

  const media = [
    {
      id: "1",
      type: "image",
      url: "/elegant-wedding-decoration.png",
      thumbnailUrl: "/elegant-wedding-decoration.png",
      category: "Wedding",
      description: "Elegant wedding decoration with gold accents",
      uploadedAt: "2025-01-15",
      isFeatured: true,
      tags: ["wedding", "decoration", "gold", "elegant"],
    },
    {
      id: "2",
      type: "image",
      url: "/corporate-event.png",
      thumbnailUrl: "/corporate-event.png",
      category: "Corporate",
      description: "Professional corporate event setup",
      uploadedAt: "2025-01-14",
      isFeatured: false,
      tags: ["corporate", "professional", "conference"],
    },
    {
      id: "3",
      type: "video",
      url: "/videos/wedding-highlight.mp4",
      thumbnailUrl: "/wedding-video-thumbnail.png",
      category: "Wedding",
      description: "Wedding ceremony highlight reel",
      uploadedAt: "2025-01-13",
      isFeatured: true,
      tags: ["wedding", "video", "ceremony"],
    },
    {
      id: "4",
      type: "image",
      url: "/vibrant-cultural-ceremony.png",
      thumbnailUrl: "/vibrant-cultural-ceremony.png",
      category: "Cultural",
      description: "Traditional cultural ceremony setup",
      uploadedAt: "2025-01-12",
      isFeatured: false,
      tags: ["cultural", "traditional", "ceremony"],
    },
    {
      id: "5",
      type: "360",
      url: "/360/venue-tour.jpg",
      thumbnailUrl: "/360-venue-view.jpg",
      category: "Wedding",
      description: "360° venue tour - Grand Ballroom",
      uploadedAt: "2025-01-11",
      isFeatured: true,
      tags: ["360", "venue", "tour", "ballroom"],
    },
    {
      id: "6",
      type: "image",
      url: "/outdoor-wedding.jpg",
      thumbnailUrl: "/outdoor-wedding.jpg",
      category: "Wedding",
      description: "Beautiful outdoor wedding ceremony",
      uploadedAt: "2025-01-10",
      isFeatured: false,
      tags: ["wedding", "outdoor", "garden"],
    },
  ]

  const categories = ["All", "Wedding", "Corporate", "Cultural", "Social"]
  const types = ["All", "Images", "Videos", "360° Tours"]

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-4 w-4" />
      case "video":
        return <Video className="h-4 w-4" />
      case "360":
        return <Globe className="h-4 w-4" />
      default:
        return <ImageIcon className="h-4 w-4" />
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <h2 className="text-lg font-semibold">Media Gallery</h2>
            <Button size="sm" onClick={() => setShowUploadModal(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Media
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <PageHeader title="Media Gallery" description="Manage your event portfolio, photos, videos, and 360° tours" />

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search media by description or tags..." className="pl-9" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="flex gap-2">
                    <span className="text-sm text-muted-foreground">Category:</span>
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
                  <Separator orientation="vertical" className="h-8" />
                  <div className="flex gap-2">
                    <span className="text-sm text-muted-foreground">Type:</span>
                    {types.map((type) => (
                      <Button
                        key={type}
                        variant={type === "All" ? "default" : "outline"}
                        size="sm"
                        className="bg-transparent"
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All Media ({media.length})</TabsTrigger>
              <TabsTrigger value="featured">Featured ({media.filter((m) => m.isFeatured).length})</TabsTrigger>
              <TabsTrigger value="images">Images ({media.filter((m) => m.type === "image").length})</TabsTrigger>
              <TabsTrigger value="videos">Videos ({media.filter((m) => m.type === "video").length})</TabsTrigger>
              <TabsTrigger value="360">360° Tours ({media.filter((m) => m.type === "360").length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {media.map((item) => (
                  <Card key={item.id} className="group relative overflow-hidden">
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={item.thumbnailUrl || "/placeholder.svg"}
                        alt={item.description}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      <div className="absolute right-2 top-2 flex gap-2">
                        {item.isFeatured && (
                          <Badge variant="secondary" className="bg-accent/90 text-accent-foreground">
                            <Star className="mr-1 h-3 w-3 fill-current" />
                            Featured
                          </Badge>
                        )}
                        <Badge variant="secondary" className="bg-background/90">
                          {getTypeIcon(item.type)}
                          <span className="ml-1 capitalize">{item.type}</span>
                        </Badge>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" className="flex-1">
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="secondary">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Star className="mr-2 h-4 w-4" />
                                {item.isFeatured ? "Remove from Featured" : "Mark as Featured"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium line-clamp-1">{item.description}</p>
                            <p className="text-sm text-muted-foreground">{item.uploadedAt}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {item.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {item.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{item.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {["featured", "images", "videos", "360"].map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {media
                    .filter((item) => {
                      if (tab === "featured") return item.isFeatured
                      if (tab === "images") return item.type === "image"
                      if (tab === "videos") return item.type === "video"
                      if (tab === "360") return item.type === "360"
                      return true
                    })
                    .map((item) => (
                      <Card key={item.id} className="group relative overflow-hidden">
                        <div className="relative aspect-video overflow-hidden">
                          <img
                            src={item.thumbnailUrl || "/placeholder.svg"}
                            alt={item.description}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                          <div className="absolute right-2 top-2 flex gap-2">
                            {item.isFeatured && (
                              <Badge variant="secondary" className="bg-accent/90 text-accent-foreground">
                                <Star className="mr-1 h-3 w-3 fill-current" />
                                Featured
                              </Badge>
                            )}
                            <Badge variant="secondary" className="bg-background/90">
                              {getTypeIcon(item.type)}
                              <span className="ml-1 capitalize">{item.type}</span>
                            </Badge>
                          </div>
                          <div className="absolute bottom-2 left-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                            <div className="flex gap-2">
                              <Button size="sm" variant="secondary" className="flex-1">
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="secondary">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Star className="mr-2 h-4 w-4" />
                                    {item.isFeatured ? "Remove from Featured" : "Mark as Featured"}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium line-clamp-1">{item.description}</p>
                                <p className="text-sm text-muted-foreground">{item.uploadedAt}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {item.category}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {item.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {item.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{item.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </SidebarInset>

      <AddMediaModal open={showUploadModal} onOpenChange={setShowUploadModal} onSubmit={handleUploadMedia} />
    </SidebarProvider>
  )
}
