import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Calendar, Tag, TrendingUp } from "lucide-react"

export default function MarketingPage() {
  const offers = [
    {
      id: "1",
      title: "Valentine's Day Special",
      description: "Get 15% off on all wedding packages booked for February events",
      validFrom: "2025-01-20",
      validTo: "2025-02-14",
      discount: "15%",
      isActive: true,
      redemptions: 12,
    },
    {
      id: "2",
      title: "Corporate Event Bundle",
      description: "Book 3 corporate events and get the 4th at 50% off",
      validFrom: "2025-01-01",
      validTo: "2025-03-31",
      discount: "50% on 4th",
      isActive: true,
      redemptions: 5,
    },
    {
      id: "3",
      title: "Early Bird Discount",
      description: "Book 6 months in advance and save 10%",
      validFrom: "2025-01-01",
      validTo: "2025-12-31",
      discount: "10%",
      isActive: true,
      redemptions: 28,
    },
  ]

  const banners = [
    {
      id: "1",
      title: "New Year Celebration Package",
      image: "/banner-new-year.jpg",
      link: "/services/celebration",
      isActive: true,
      position: "Home Hero",
    },
    {
      id: "2",
      title: "Premium Wedding Services",
      image: "/banner-wedding.jpg",
      link: "/services/wedding",
      isActive: true,
      position: "Services Page",
    },
  ]

  const featuredContent = [
    { type: "Service", name: "Premium Wedding Package", featured: true },
    { type: "Service", name: "Corporate Event Management", featured: false },
    { type: "Staff", name: "Sarah Mitchell", featured: true },
    { type: "Staff", name: "John Davidson", featured: true },
  ]

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <h2 className="text-lg font-semibold">Marketing</h2>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <PageHeader title="Marketing Tools" description="Manage promotions, banners, and featured content" />

          <Tabs defaultValue="offers" className="space-y-6">
            <TabsList>
              <TabsTrigger value="offers">Special Offers</TabsTrigger>
              <TabsTrigger value="banners">Banners</TabsTrigger>
              <TabsTrigger value="featured">Featured Content</TabsTrigger>
            </TabsList>

            <TabsContent value="offers" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Special Offers & Discounts</CardTitle>
                      <CardDescription>Create and manage promotional offers</CardDescription>
                    </div>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Offer
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {offers.map((offer) => (
                      <Card key={offer.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold">{offer.title}</h3>
                                <Badge variant={offer.isActive ? "default" : "secondary"}>
                                  {offer.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <Badge variant="outline" className="bg-accent/10 text-accent">
                                  <Tag className="mr-1 h-3 w-3" />
                                  {offer.discount}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{offer.description}</p>
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span>
                                    {offer.validFrom} to {offer.validTo}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                  <span>{offer.redemptions} redemptions</span>
                                </div>
                              </div>
                            </div>
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
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Create New Offer</CardTitle>
                  <CardDescription>Set up a new promotional offer</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Offer Title</Label>
                      <Input placeholder="e.g., Summer Wedding Special" />
                    </div>
                    <div className="space-y-2">
                      <Label>Discount</Label>
                      <Input placeholder="e.g., 20% or 50,000 XAF" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea placeholder="Describe the offer details..." rows={3} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Valid From</Label>
                      <Input type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label>Valid To</Label>
                      <Input type="date" />
                    </div>
                  </div>
                  <Button>Create Offer</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="banners" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Marketing Banners</CardTitle>
                      <CardDescription>Manage promotional banners for the app</CardDescription>
                    </div>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Banner
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {banners.map((banner) => (
                      <Card key={banner.id}>
                        <CardContent className="pt-6">
                          <div className="flex gap-4">
                            <div className="h-24 w-40 overflow-hidden rounded-lg bg-muted">
                              <img
                                src={banner.image || "/placeholder.svg"}
                                alt={banner.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold">{banner.title}</h3>
                                <Badge variant={banner.isActive ? "default" : "secondary"}>
                                  {banner.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">Position: {banner.position}</p>
                              <p className="text-sm text-muted-foreground">Link: {banner.link}</p>
                            </div>
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
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="featured" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Featured Content</CardTitle>
                  <CardDescription>Manage featured services and staff profiles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {featuredContent.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-border p-4"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{item.type}</Badge>
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={item.featured ? "default" : "secondary"}>
                            {item.featured ? "Featured" : "Not Featured"}
                          </Badge>
                          <Button variant="outline" size="sm">
                            {item.featured ? "Remove" : "Feature"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
