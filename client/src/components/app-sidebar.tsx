import { Home, Building2, MessageSquare, Heart, Settings, Users, BarChart3, Plus } from "lucide-react";
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
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";

export function AppSidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const isLandlord = user?.userType === "landlord" || user?.userType === "both";
  const isTenant = user?.userType === "tenant" || user?.userType === "both";

  const landlordItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home, testId: "link-dashboard" },
    { title: "My Listings", url: "/listings", icon: Building2, testId: "link-listings" },
    { title: "Matches", url: "/matches", icon: Users, testId: "link-matches" },
    { title: "Messages", url: "/messages", icon: MessageSquare, testId: "link-messages" },
    { title: "Analytics", url: "/analytics", icon: BarChart3, testId: "link-analytics" },
  ];

  const tenantItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home, testId: "link-dashboard" },
    { title: "Search Rentals", url: "/search", icon: Building2, testId: "link-search" },
    { title: "Saved", url: "/saved", icon: Heart, testId: "link-saved" },
    { title: "Messages", url: "/messages", icon: MessageSquare, testId: "link-messages" },
  ];

  const items = isLandlord ? landlordItems : isTenant ? tenantItems : landlordItems;

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">Livva</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={location === item.url ? "bg-sidebar-accent" : ""}
                    data-testid={item.testId}
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

        {isLandlord && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <Link href="/listings/new">
                <Button className="w-full" data-testid="button-create-listing">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Listing
                </Button>
              </Link>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild data-testid="link-settings">
                  <Link href="/settings">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {user?.firstName?.[0] || user?.email?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.email || "User"}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {user?.userType || "tenant"}
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
