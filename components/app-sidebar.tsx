"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  ShoppingCart,
  ImageIcon,
  Calendar,
  MessageSquare,
  Star,
  HelpCircle,
  Settings,
  Bell,
  TrendingUp,
  Megaphone,
  Sparkles,
  LogOut,
  Store,
  Package,
  ShoppingBag,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/lib/redux/hooks";
import { logOut } from "@/lib/auth/authService";
import { useGetUserProfileQuery } from "@/lib/redux/api/profileApi";
import { useGetTotalUnreadCountQuery } from "@/lib/redux/api/messagingApi";

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: TrendingUp,
  },
];

const managementItems = [
  {
    title: "Services",
    url: "/services",
    icon: Briefcase,
  },
  {
    title: "Staff Profiles",
    url: "/staff",
    icon: Users,
  },
  {
    title: "Orders",
    url: "/orders",
    icon: ShoppingCart,
  },
  {
    title: "Media Gallery",
    url: "/media",
    icon: ImageIcon,
  },
  {
    title: "Events",
    url: "/events",
    icon: Calendar,
  },
  {
    title: "Testimonials",
    url: "/testimonials",
    icon: Star,
  },
];

const shopItems = [
  {
    title: "Shop Products",
    url: "/shop",
    icon: Package,
  },
  {
    title: "Shop Orders",
    url: "/shop/orders",
    icon: ShoppingBag,
  },
];

const toolsItems = [
  {
    title: "Marketing",
    url: "/marketing",
    icon: Megaphone,
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
  },
  {
    title: "FAQs",
    url: "/faqs",
    icon: HelpCircle,
  },
  {
    title: "Messages",
    url: "/messages",
    icon: MessageSquare,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);

  // Fetch current user profile for most up-to-date data
  const { data: userProfile } = useGetUserProfileQuery(user?.uid || "", {
    skip: !user?.uid,
  });

  // Fetch unread message count
  const { data: unreadData } = useGetTotalUnreadCountQuery(user?.uid || "", {
    skip: !user?.uid,
  });
  const totalUnread = unreadData?.total || 0;

  const handleLogout = async () => {
    try {
      await logOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getUserInitials = () => {
    const displayName = userProfile?.fullName || user?.displayName;
    if (displayName) {
      return displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    }
    return "AD";
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-sidebar-foreground">
              Blinking Events
            </h2>
            <p className="text-xs text-muted-foreground">Admin Portal</p>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.url)}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Shop</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {shopItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname === item.url ||
                      (item.url === "/shop" && pathname === "/shop")
                    }
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.url)}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.title === "Messages" && totalUnread > 0 && (
                    <SidebarMenuBadge className="bg-primary text-primary-foreground">
                      {totalUnread > 99 ? "99+" : totalUnread}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="space-y-2">
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={
                  userProfile?.photoURL ||
                  user?.photoURL ||
                  "/placeholder.svg?height=32&width=32"
                }
              />
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-sm">
              <p className="font-medium text-sidebar-foreground">
                {userProfile?.fullName || user?.displayName || "Admin User"}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.email || "admin@blinking.com"}
              </p>
            </div>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
