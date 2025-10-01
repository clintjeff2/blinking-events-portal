import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Phone, Mail } from "lucide-react"

export default function SettingsPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <h2 className="text-lg font-semibold">Settings</h2>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <PageHeader title="Settings" description="Manage your account and application settings" />

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="company">Company Info</TabsTrigger>
              <TabsTrigger value="contact">Emergency Contact</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src="/placeholder.svg?height=96&width=96" />
                      <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <Button variant="outline">Change Photo</Button>
                      <p className="text-sm text-muted-foreground">JPG, PNG or GIF. Max size 2MB.</p>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input defaultValue="Admin User" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" defaultValue="admin@blinking.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input defaultValue="+237 6XX XXX XXX" />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Input defaultValue="Administrator" disabled />
                    </div>
                  </div>
                  <Button>Save Changes</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your password to keep your account secure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <Input type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm New Password</Label>
                    <Input type="password" />
                  </div>
                  <Button>Update Password</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="company" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>Manage your business details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input defaultValue="Blinking Events" />
                  </div>
                  <div className="space-y-2">
                    <Label>Business Description</Label>
                    <Textarea defaultValue="Premier event planning and management services in Cameroon" rows={4} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Business Email</Label>
                      <Input type="email" defaultValue="info@blinkingevents.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Business Phone</Label>
                      <Input defaultValue="+237 6XX XXX XXX" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Business Address</Label>
                    <Textarea defaultValue="123 Main Street, Douala, Cameroon" rows={3} />
                  </div>
                  <Button>Save Changes</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Emergency Contact</CardTitle>
                  <CardDescription>Contact information for urgent client needs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Emergency Phone</Label>
                    <Input defaultValue="+237 6XX XXX XXX" />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp Number</Label>
                    <Input defaultValue="+237 6XX XXX XXX" />
                  </div>
                  <div className="space-y-2">
                    <Label>Emergency Email</Label>
                    <Input type="email" defaultValue="emergency@blinkingevents.com" />
                  </div>
                  <Button>Save Changes</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Current Emergency Contact</CardTitle>
                  <CardDescription>Displayed in the mobile app for urgent situations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">+237 6XX XXX XXX</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">WhatsApp</p>
                        <p className="font-medium">+237 6XX XXX XXX</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">emergency@blinkingevents.com</p>
                      </div>
                    </div>
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
