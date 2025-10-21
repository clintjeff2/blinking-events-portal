"use client";

import React, { useState, useRef } from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Phone,
  Mail,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  Camera,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../../hooks/use-auth";
import {
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useChangePasswordMutation,
  type UpdateProfileData,
  type ChangePasswordData,
} from "@/lib/redux/api/profileApi";
import { uploadFileClient, CloudinaryPaths } from "@/lib/cloudinary/upload";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [profileData, setProfileData] = useState({
    fullName: "",
    phone: "",
  });

  // Password state
  const [passwordData, setPasswordData] = useState<ChangePasswordData>({
    currentPassword: "",
    newPassword: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Company info state
  const [companyData, setCompanyData] = useState({
    name: "Blinking Events",
    description: "Premier event planning and management services in Cameroon",
    email: "info@blinkingevents.com",
    phone: "+237 6XX XXX XXX",
    address: "123 Main Street, Douala, Cameroon",
  });

  // Emergency contact state
  const [emergencyData, setEmergencyData] = useState({
    phone: "+237 6XX XXX XXX",
    whatsapp: "+237 6XX XXX XXX",
    email: "emergency@blinkingevents.com",
  });

  // API hooks
  const { data: userProfile, isLoading: profileLoading } =
    useGetUserProfileQuery(user?.uid || "", {
      skip: !user?.uid,
    });
  const [updateProfile, { isLoading: updateLoading }] =
    useUpdateUserProfileMutation();
  const [changePassword, { isLoading: passwordLoading }] =
    useChangePasswordMutation();

  // Initialize profile data when user profile loads
  React.useEffect(() => {
    if (userProfile) {
      setProfileData({
        fullName: userProfile.fullName || "",
        phone: userProfile.phone || "",
      });
    } else if (user) {
      setProfileData({
        fullName: user.displayName || "",
        phone: "",
      });
    }
  }, [userProfile, user]);

  // Cleanup preview URL on unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    // Store file and create preview
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    setIsUploading(true);
    try {
      let photoURL = userProfile?.photoURL;

      // Upload new image if one was selected
      if (selectedFile) {
        photoURL = await uploadFileClient(
          selectedFile,
          CloudinaryPaths.users.profile(user.uid)
        ).then((result: any) => result.secureUrl);
      }

      // Update profile with all data
      const updateData: any = {
        ...profileData,
      };

      if (photoURL && photoURL !== userProfile?.photoURL) {
        updateData.photoURL = photoURL;
      }

      await updateProfile({
        userId: user.uid,
        data: updateData,
      }).unwrap();

      // Clear selected file and preview
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl("");
      }

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords
    if (passwordData.newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    try {
      await changePassword(passwordData).unwrap();

      // Reset form
      setPasswordData({ currentPassword: "", newPassword: "" });
      setConfirmPassword("");

      toast.success("Password changed successfully");
    } catch (error: any) {
      toast.error(error.data?.error || "Failed to change password");
    }
  };

  const getUserInitials = () => {
    const name =
      userProfile?.fullName || user?.displayName || user?.email || "U";
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (profileLoading) {
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
            <div className="space-y-4">
              <div className="h-8 w-48 bg-muted animate-pulse rounded" />
              <div className="h-4 w-64 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }
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
          <PageHeader
            title="Settings"
            description="Manage your account and application settings"
          />

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
                  <CardDescription>
                    Update your personal information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage
                          src={
                            previewUrl ||
                            userProfile?.photoURL ||
                            user?.photoURL ||
                            ""
                          }
                        />
                        <AvatarFallback className="text-lg">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : selectedFile ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                            Photo Selected
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Change Photo
                          </>
                        )}
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        JPG, PNG or GIF. Max size 2MB.
                        {selectedFile && (
                          <span className="block text-green-600 mt-1">
                            New photo will be uploaded when you save changes.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          value={profileData.fullName}
                          onChange={(e) =>
                            setProfileData((prev) => ({
                              ...prev,
                              fullName: e.target.value,
                            }))
                          }
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={user?.email || ""}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                          Email cannot be changed
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) =>
                            setProfileData((prev) => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                          placeholder="+237 6XX XXX XXX"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="role"
                            value={userProfile?.role || "Administrator"}
                            disabled
                            className="bg-muted"
                          />
                          <Badge variant="secondary">
                            {userProfile?.role || "Admin"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={updateLoading || isUploading}
                    >
                      {updateLoading || isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {isUploading ? "Uploading..." : "Saving..."}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {selectedFile
                            ? "Save Changes & Upload Photo"
                            : "Save Changes"}
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">
                        Current Password *
                      </Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData((prev) => ({
                              ...prev,
                              currentPassword: e.target.value,
                            }))
                          }
                          placeholder="Enter current password"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                          onClick={() =>
                            setShowPasswords((prev) => ({
                              ...prev,
                              current: !prev.current,
                            }))
                          }
                        >
                          {showPasswords.current ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password *</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData((prev) => ({
                              ...prev,
                              newPassword: e.target.value,
                            }))
                          }
                          placeholder="Enter new password (min 6 characters)"
                          required
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                          onClick={() =>
                            setShowPasswords((prev) => ({
                              ...prev,
                              new: !prev.new,
                            }))
                          }
                        >
                          {showPasswords.new ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Confirm New Password *
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showPasswords.confirm ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                          onClick={() =>
                            setShowPasswords((prev) => ({
                              ...prev,
                              confirm: !prev.confirm,
                            }))
                          }
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {passwordData.newPassword &&
                      confirmPassword &&
                      passwordData.newPassword !== confirmPassword && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Passwords do not match
                          </AlertDescription>
                        </Alert>
                      )}

                    <Button
                      type="submit"
                      disabled={
                        passwordLoading ||
                        passwordData.newPassword !== confirmPassword ||
                        !passwordData.currentPassword ||
                        !passwordData.newPassword
                      }
                    >
                      {passwordLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Update Password
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="company" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>
                    Manage your business details displayed to clients
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={companyData.name}
                      onChange={(e) =>
                        setCompanyData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessDescription">
                      Business Description
                    </Label>
                    <Textarea
                      id="businessDescription"
                      value={companyData.description}
                      onChange={(e) =>
                        setCompanyData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={4}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="businessEmail">Business Email</Label>
                      <Input
                        id="businessEmail"
                        type="email"
                        value={companyData.email}
                        onChange={(e) =>
                          setCompanyData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessPhone">Business Phone</Label>
                      <Input
                        id="businessPhone"
                        value={companyData.phone}
                        onChange={(e) =>
                          setCompanyData((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessAddress">Business Address</Label>
                    <Textarea
                      id="businessAddress"
                      value={companyData.address}
                      onChange={(e) =>
                        setCompanyData((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      rows={3}
                    />
                  </div>
                  <Button>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Save Company Info
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Emergency Contact</CardTitle>
                  <CardDescription>
                    Contact information for urgent client needs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                    <Input
                      id="emergencyPhone"
                      value={emergencyData.phone}
                      onChange={(e) =>
                        setEmergencyData((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                    <Input
                      id="whatsappNumber"
                      value={emergencyData.whatsapp}
                      onChange={(e) =>
                        setEmergencyData((prev) => ({
                          ...prev,
                          whatsapp: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyEmail">Emergency Email</Label>
                    <Input
                      id="emergencyEmail"
                      type="email"
                      value={emergencyData.email}
                      onChange={(e) =>
                        setEmergencyData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <Button>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Save Contact Info
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Current Emergency Contact</CardTitle>
                  <CardDescription>
                    This information is displayed in the mobile app for urgent
                    situations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{emergencyData.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          WhatsApp
                        </p>
                        <p className="font-medium">{emergencyData.whatsapp}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{emergencyData.email}</p>
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
  );
}
