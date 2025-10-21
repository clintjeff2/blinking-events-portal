"use client"

import { useState } from "react"
import Link from "next/link"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Search, MoreVertical, Edit, Trash2, Eye, Star, Upload, ImageIcon, Video, FileText } from "lucide-react"
import { AddMediaModal } from "@/components/add-media-modal"
import { useGetMediaQuery, useDeleteMediaMutation, useToggleFeaturedMutation } from "@/lib/redux/api/mediaApi"
import { useToast } from "@/hooks/use-toast"
import { getMediaType } from "@/lib/utils/media"

export default function MediaPage() {
  const { toast } = useToast()
  const { data: allMedia = [], isLoading, error } = useGetMediaQuery({})
  const [deleteMedia] = useDeleteMediaMutation()
  const [toggleFeatured] = useToggleFeaturedMutation()
  
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedType, setSelectedType] = useState("All")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [mediaToDelete, setMediaToDelete] = useState<string | null>(null)

  const handleToggleFeatured = async (mediaId: string, currentStatus: boolean) => {
    try {
      await toggleFeatured({ id: mediaId, isFeatured: !currentStatus }).unwrap()
      toast({ description: currentStatus ? "Removed from featured" : "Added to featured" })
    } catch (error) {
      toast({ variant: "destructive", description: "Failed to update featured status" })
    }
  }

  const handleDeleteClick = (mediaId: string) => {
    setMediaToDelete(mediaId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!mediaToDelete) return
    
    try {
      await deleteMedia(mediaToDelete).unwrap()
      toast({ description: "Media deleted successfully" })
    } catch (error) {
      toast({ variant: "destructive", description: "Failed to delete media" })
    } finally {
      setDeleteDialogOpen(false)
      setMediaToDelete(null)
    }
  }

  // Filter media
  const filteredMedia = allMedia.filter((item) => {
    const matchesSearch = searchQuery === "" || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === "All" || item.category.toLowerCase() === selectedCategory.toLowerCase()
    
    const matchesType = selectedType === "All" || (() => {
      const hasImages = item.url.some(url => getMediaType(url) === "image")
      const hasVideos = item.url.some(url => getMediaType(url) === "video")
      
      if (selectedType === "Images") return hasImages
      if (selectedType === "Videos") return hasVideos
      return true
    })()

    return matchesSearch && matchesCategory && matchesType
  })

  const categories = ["All", "Wedding", "Corporate", "Cultural", "Social", "Birthday", "Other"]
  const types = ["All", "Images", "Videos"]

  const getMediaTypeIcon = (url: string) => {
    const type = getMediaType(url)
    if (type === "image") return <ImageIcon className="h-4 w-4" />
    if (type === "video") return <Video className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
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
                  <Input 
                    placeholder="Search media by title, description or tags..." 
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="flex gap-2">
                    <span className="text-sm text-muted-foreground">Category:</span>
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={category === selectedCategory ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
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
                        variant={type === selectedType ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedType(type)}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {isLoading && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <Skeleton className="aspect-video" />
                  <CardContent className="pt-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Failed to load media. Please try again.</p>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredMedia.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-lg font-medium">No media found</p>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery || selectedCategory !== "All" || selectedType !== "All"
                      ? "Try adjusting your filters"
                      : "Upload your first media to get started"}
                  </p>
                  {!searchQuery && selectedCategory === "All" && selectedType === "All" && (
                    <Button className="mt-4" onClick={() => setShowUploadModal(true)}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Media
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Media Grid */}
          {!isLoading && !error && filteredMedia.length > 0 && (
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList>
                <TabsTrigger value="all">
                  All Media ({filteredMedia.length})
                </TabsTrigger>
                <TabsTrigger value="featured">
                  Featured ({filteredMedia.filter((m) => m.isFeatured).length})
                </TabsTrigger>
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
