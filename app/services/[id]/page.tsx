import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit, Trash2, Star, Package, Users, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function ServiceDetailPage({ params }: { params: { id: string } }) {
  const service = {
    id: params.id,
    name: "Premium Wedding Package",
    category: "Wedding",
    description:
      "Our premium wedding package offers comprehensive event planning and execution services to make your special day unforgettable. From venue decoration to entertainment coordination, we handle every detail with precision and care.",
    priceRange: { min: 400000, max: 800000 },
    isActive: true,
    featured: true,
    images: ["/elegant-wedding-decor.png", "/outdoor-wedding-ceremony.png", "/elegant-wedding-reception.png"],
    packages: [
      {
        id: "1",
        name: "Basic Package",
        price: 400000,
        features: ["Venue decoration", "Basic sound system", "2 hostesses", "Event coordination", "Basic photography"],
        description: "Perfect for intimate weddings with essential services",
      },
      {
        id: "2",
        name: "Standard Package",
        price: 600000,
        features: [
          "Premium venue decoration",
          "Professional sound & lighting",
          "4 hostesses",
          "MC services",
          "Professional photography & videography",
          "Catering coordination",
        ],
        description: "Comprehensive package for medium-sized weddings",
      },
      {
        id: "3",
        name: "Premium Package",
        price: 800000,
        features: [
          "Luxury venue transformation",
          "Premium sound, lighting & effects",
          "6 hostesses",
          "Professional MC & DJ",
          "Premium photography & videography",
          "Full catering services",
          "Security personnel",
          "Transportation coordination",
        ],
        description: "All-inclusive luxury experience for grand celebrations",
      },
    ],
    staffProfiles: ["Sarah M.", "John D.", "Emma W.", "Michael C."],
    stats: {
      totalBookings: 45,
      revenue: 1200000,
      avgRating: 4.9,
      repeatClients: 28,
    },
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <h2 className="text-lg font-semibold">Service Details</h2>
            <div className="flex items-center gap-2">
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
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{service.name}</h1>
                {service.featured && (
                  <Badge variant="secondary" className="bg-accent/10 text-accent">
                    <Star className="mr-1 h-3 w-3 fill-current" />
                    Featured
                  </Badge>
                )}
                <Badge variant={service.isActive ? "default" : "secondary"}>
                  {service.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="mt-2 text-muted-foreground">
                <Badge variant="outline">{service.category}</Badge>
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{service.stats.totalBookings}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{service.stats.revenue.toLocaleString()} XAF</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{service.stats.avgRating}/5.0</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Repeat Clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{service.stats.repeatClients}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="packages">Packages</TabsTrigger>
              <TabsTrigger value="staff">Staff</TabsTrigger>
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Service Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{service.description}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pricing Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Price Range</span>
                      <span className="text-lg font-semibold">
                        {service.priceRange.min.toLocaleString()} - {service.priceRange.max.toLocaleString()} XAF
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Available Packages</span>
                      <span className="font-medium">{service.packages.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="packages" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                {service.packages.map((pkg) => (
                  <Card key={pkg.id} className="relative">
                    <CardHeader>
                      <CardTitle>{pkg.name}</CardTitle>
                      <CardDescription>{pkg.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-3xl font-bold">{pkg.price.toLocaleString()} XAF</p>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Features:</p>
                        <ul className="space-y-2">
                          {pkg.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button className="w-full bg-transparent" variant="outline">
                        Edit Package
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="staff" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Staff</CardTitle>
                  <CardDescription>Staff members who can deliver this service</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {service.staffProfiles.map((staff, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{staff}</p>
                            <p className="text-sm text-muted-foreground">Event Specialist</p>
                          </div>
                        </div>
                        <Link href="/staff">
                          <Button variant="outline" size="sm">
                            View Profile
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gallery" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                {service.images.map((image, index) => (
                  <Card key={index} className="overflow-hidden">
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`Service ${index + 1}`}
                      className="h-48 w-full object-cover"
                    />
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
