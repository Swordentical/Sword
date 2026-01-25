import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  Package,
  FlaskConical,
  DollarSign,
  Settings,
  LogOut,
  GraduationCap,
  Stethoscope,
  Edit,
  ExternalLink,
  BarChart3,
  Receipt,
  Shield,
  ShieldCheck,
  Lock,
  CreditCard,
  Wallet,
} from "lucide-react";
import { ThemeSelector } from "@/components/theme-selector";
import { Link, useLocation } from "wouter";
import glazerLogo from "@/assets/glazer-logo.png";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { UserRole, PlanFeatures } from "@shared/schema";

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  feature?: keyof PlanFeatures;
};

const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    roles: ["admin", "doctor", "staff", "student"],
    feature: "dashboard",
  },
  {
    title: "Patients",
    url: "/patients",
    icon: Users,
    roles: ["admin", "doctor", "staff", "student"],
    feature: "patients",
  },
  {
    title: "Appointments",
    url: "/appointments",
    icon: Calendar,
    roles: ["admin", "doctor", "staff", "student"],
    feature: "appointments",
  },
  {
    title: "Doctors",
    url: "/doctors",
    icon: Stethoscope,
    roles: ["admin", "doctor", "staff"],
    feature: "users",
  },
  {
    title: "Services",
    url: "/services",
    icon: ClipboardList,
    roles: ["admin", "doctor"],
    feature: "services",
  },
  {
    title: "Inventory",
    url: "/inventory",
    icon: Package,
    roles: ["admin", "doctor"],
    feature: "inventory",
  },
  {
    title: "Lab Work",
    url: "/lab-work",
    icon: FlaskConical,
    roles: ["admin", "doctor"],
    feature: "labWork",
  },
  {
    title: "Financials",
    url: "/financials",
    icon: DollarSign,
    roles: ["admin", "doctor"],
    feature: "financials",
  },
  {
    title: "My Production",
    url: "/my-production",
    icon: BarChart3,
    roles: ["doctor"],
    feature: "reports",
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    roles: ["admin"],
    feature: "reports",
  },
  {
    title: "Expenses",
    url: "/expenses",
    icon: Receipt,
    roles: ["admin", "doctor", "staff", "student"],
    feature: "expenses",
  },
  {
    title: "Insurance Claims",
    url: "/insurance-claims",
    icon: Shield,
    roles: ["admin", "doctor", "staff"],
    feature: "insuranceClaims",
  },
  {
    title: "Doctor Payments",
    url: "/doctor-payments",
    icon: Wallet,
    roles: ["admin"],
  },
  {
    title: "Audit Logs",
    url: "/audit-logs",
    icon: ShieldCheck,
    roles: ["admin"],
  },
  {
    title: "User Management",
    url: "/admin/users",
    icon: ShieldCheck,
    roles: ["admin"],
    feature: "users",
  },
];

const settingsNavItems: NavItem[] = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    roles: ["admin"],
    feature: "settings",
  },
];

function getRoleIcon(role: UserRole) {
  switch (role) {
    case "admin":
      return <Settings className="h-3 w-3" />;
    case "doctor":
      return <Stethoscope className="h-3 w-3" />;
    case "student":
      return <GraduationCap className="h-3 w-3" />;
    default:
      return null;
  }
}

function getRoleLabel(role: UserRole) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { hasFeature, subscriptionContext, getPlanType } = useSubscription();

  const userRole = (user?.role as UserRole) || "staff";
  const planType = getPlanType();
  
  const filteredMainItems = mainNavItems.filter((item) => {
    const hasRoleAccess = item.roles.includes(userRole);
    if (!hasRoleAccess) return false;
    
    if (!user?.organizationId) return true;
    
    if (item.feature) {
      return hasFeature(item.feature);
    }
    return true;
  });
  
  const filteredSettingsItems = settingsNavItems.filter((item) => {
    const hasRoleAccess = item.roles.includes(userRole);
    if (!hasRoleAccess) return false;
    
    if (!user?.organizationId) return true;
    
    if (item.feature) {
      return hasFeature(item.feature);
    }
    return true;
  });

  const initials = user
    ? `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`
    : "?";

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="text-2xl font-bold bg-gradient-to-r from-[#12a3b0] via-[#2089de] to-[#9b59b6] bg-clip-text text-transparent">
            GLAZER
          </span>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">
              By Dr. Ahmad Saleh
            </span>
            <div className="flex items-center gap-2">
              {planType && (
                <Badge 
                  variant="outline" 
                  className={`text-[10px] px-1.5 py-0 h-4 ${
                    planType === "clinic" 
                      ? "border-primary text-primary" 
                      : planType === "doctor" 
                      ? "border-blue-500 text-blue-500"
                      : "border-green-500 text-green-500"
                  }`}
                >
                  {planType === "clinic" ? "Clinic" : planType === "doctor" ? "Doctor" : "Student"}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin">
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMainItems.map((item) => {
                const isActive = location === item.url || 
                  (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredSettingsItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredSettingsItems.map((item) => {
                  const isActive = location === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center justify-between px-4 py-2 border-b border-sidebar-border">
          <span className="text-xs text-muted-foreground">Appearance</span>
          <ThemeSelector />
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <Popover>
            <PopoverTrigger asChild>
              <button className="shrink-0" data-testid="button-profile-menu">
                <Avatar className="h-9 w-9 cursor-pointer hover-elevate transition-all">
                  {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={`${user?.firstName} ${user?.lastName}`} />}
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-64 p-0">
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={`${user?.firstName} ${user?.lastName}`} />}
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user?.firstName} {user?.lastName}</p>
                    <p className="text-sm text-muted-foreground truncate">@{user?.username}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      {getRoleIcon(userRole)}
                      <span>{getRoleLabel(userRole)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="p-2 space-y-1">
                <Link href="/settings?tab=users">
                  <Button variant="ghost" size="sm" className="w-full justify-start" data-testid="link-manage-profile">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </Link>
                <Link href="/subscription">
                  <Button variant="ghost" size="sm" className="w-full justify-start" data-testid="link-subscription">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Subscription
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="ghost" size="sm" className="w-full justify-start" data-testid="link-settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </Link>
              </div>
              <Separator />
              <div className="p-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-destructive hover:text-destructive" 
                  onClick={() => logoutMutation.mutate()}
                  data-testid="button-popover-logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {user?.firstName} {user?.lastName}
            </span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getRoleIcon(userRole)}
              <span>{getRoleLabel(userRole)}</span>
            </div>
          </div>
          <SidebarMenuButton
            size="sm"
            onClick={() => logoutMutation.mutate()}
            className="h-8 w-8 p-0"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
