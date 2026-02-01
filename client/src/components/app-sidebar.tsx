import { useState, useRef, useCallback, useEffect, createContext, useContext } from "react";
import { sounds } from "@/lib/sounds";
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
  Crown,
  Building2,
  UserCog,
  LayoutGrid,
  Activity,
  History,
  ToggleLeft,
} from "lucide-react";
import { ThemeSelector } from "@/components/theme-selector";
import { Link, useLocation } from "wouter";
import glazerLogo from "@/assets/glazer-logo.png";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useArcade } from "@/contexts/arcade-context";
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

// Platform Layer Context
type PlatformMode = "clinic" | "platform";
interface PlatformContextType {
  mode: PlatformMode;
  setMode: (mode: PlatformMode) => void;
}
const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<PlatformMode>("clinic");
  return (
    <PlatformContext.Provider value={{ mode, setMode }}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) throw new Error("usePlatform must be used within PlatformProvider");
  return context;
}

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
    roles: ["super_admin", "clinic_admin", "admin", "doctor", "staff", "student"],
    feature: "dashboard",
  },
  {
    title: "Patients",
    url: "/patients",
    icon: Users,
    roles: ["super_admin", "clinic_admin", "admin", "doctor", "staff", "student"],
    feature: "patients",
  },
  {
    title: "Appointments",
    url: "/appointments",
    icon: Calendar,
    roles: ["super_admin", "clinic_admin", "admin", "doctor", "staff", "student"],
    feature: "appointments",
  },
  {
    title: "Doctors",
    url: "/doctors",
    icon: Stethoscope,
    roles: ["super_admin", "clinic_admin", "admin", "doctor", "staff"],
    feature: "users",
  },
  {
    title: "Services",
    url: "/services",
    icon: ClipboardList,
    roles: ["super_admin", "clinic_admin", "admin", "doctor"],
    feature: "services",
  },
  {
    title: "Inventory",
    url: "/inventory",
    icon: Package,
    roles: ["super_admin", "clinic_admin", "admin", "doctor"],
    feature: "inventory",
  },
  {
    title: "Lab Work",
    url: "/lab-work",
    icon: FlaskConical,
    roles: ["super_admin", "clinic_admin", "admin", "doctor"],
    feature: "labWork",
  },
  {
    title: "Financials",
    url: "/financials",
    icon: DollarSign,
    roles: ["super_admin", "clinic_admin", "admin", "doctor"],
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
    roles: ["super_admin", "clinic_admin", "admin"],
    feature: "reports",
  },
  {
    title: "Expenses",
    url: "/expenses",
    icon: Receipt,
    roles: ["super_admin", "clinic_admin", "admin", "staff", "student"],
    feature: "expenses",
  },
  {
    title: "Insurance Claims",
    url: "/insurance-claims",
    icon: Shield,
    roles: ["super_admin", "clinic_admin", "admin", "staff"],
    feature: "insuranceClaims",
  },
  {
    title: "Doctor Payments",
    url: "/doctor-payments",
    icon: Wallet,
    roles: ["super_admin", "clinic_admin", "admin"],
  },
  {
    title: "Audit Logs",
    url: "/audit-logs",
    icon: ShieldCheck,
    roles: ["super_admin", "clinic_admin", "admin"],
  },
  {
    title: "User Management",
    url: "/admin/users",
    icon: ShieldCheck,
    roles: ["super_admin", "clinic_admin", "admin"],
    feature: "users",
  },
];

const platformNavItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/platform",
    icon: LayoutDashboard,
    roles: ["super_admin"],
  },
  {
    title: "Organizations",
    url: "/platform/organizations",
    icon: Building2,
    roles: ["super_admin"],
  },
  {
    title: "Statistics",
    url: "/platform/statistics",
    icon: Activity,
    roles: ["super_admin"],
  },
  {
    title: "Financial",
    url: "/platform/financial",
    icon: CreditCard,
    roles: ["super_admin"],
  },
  {
    title: "Audit Logs",
    url: "/platform/audit-logs",
    icon: History,
    roles: ["super_admin"],
  },
  {
    title: "Settings",
    url: "/platform/settings",
    icon: Settings,
    roles: ["super_admin"],
  },
];

const settingsNavItems: NavItem[] = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    roles: ["super_admin", "clinic_admin", "admin"],
    feature: "settings",
  },
];

function getRoleIcon(role: UserRole) {
  switch (role) {
    case "super_admin":
      return <Crown className="h-3 w-3" />;
    case "clinic_admin":
      return <Building2 className="h-3 w-3" />;
    case "admin":
      return <UserCog className="h-3 w-3" />;
    case "doctor":
      return <Stethoscope className="h-3 w-3" />;
    case "staff":
      return <Users className="h-3 w-3" />;
    case "student":
      return <GraduationCap className="h-3 w-3" />;
    default:
      return null;
  }
}

function getRoleLabel(role: UserRole) {
  const labels: Record<UserRole, string> = {
    super_admin: "Super Admin",
    clinic_admin: "Clinic Admin",
    admin: "Admin",
    doctor: "Doctor",
    staff: "Staff",
    student: "Student",
    pending: "Pending"
  };
  return labels[role] || role;
}

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { hasFeature, subscriptionContext, getPlanType } = useSubscription();
  const { isOpen: arcadeOpen, openArcade, closeArcade } = useArcade();
  const { mode, setMode } = usePlatform();
  
  const clickCountRef = useRef(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);
  
  const handleLogoClick = useCallback(() => {
    if (arcadeOpen) return;
    
    clickCountRef.current += 1;
    sounds.click();
    
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    if (clickCountRef.current >= 5) {
      clickCountRef.current = 0;
      sounds.celebration();
      openArcade();
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 2000);
    }
  }, [arcadeOpen, openArcade]);

  const userRole = (user?.role as UserRole) || "staff";
  const planType = getPlanType();
  const isSuperAdmin = userRole === "super_admin";

  const currentNavItems = mode === "platform" ? platformNavItems : mainNavItems;
  
  const filteredNavItems = currentNavItems.filter((item) => {
    const hasRoleAccess = item.roles.includes(userRole);
    if (!hasRoleAccess) return false;
    
    // Always show all items in platform mode for super_admin
    if (mode === "platform") return true;
    
    // If not in platform mode and user has an organization, check feature flags
    if (user?.organizationId) {
      // If super_admin is in clinic mode, show all clinic features regardless of plan
      if (userRole === "super_admin") return true;

      if (item.feature) {
        return hasFeature(item.feature);
      }
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
    <Sidebar className={mode === "platform" ? "border-r-2 border-indigo-500/20" : ""}>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={handleLogoClick}
            className={`text-2xl font-bold bg-gradient-to-r ${
              mode === "platform" 
                ? "from-indigo-500 via-purple-500 to-pink-500" 
                : "from-[#12a3b0] via-[#2089de] to-[#9b59b6]"
            } bg-clip-text text-transparent cursor-pointer select-none`}
            data-testid="button-logo"
          >
            {mode === "platform" ? "GLAZER — PLATFORM" : "GLAZER"}
          </button>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">
              {mode === "platform" ? "CONTROL TOWER" : "By Dr. Ahmad Saleh"}
            </span>
            <div className="flex items-center gap-2">
              {planType && mode !== "platform" && (
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
        {isSuperAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Switch Layer</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => {
                      setMode(mode === "clinic" ? "platform" : "clinic");
                      sounds.click();
                    }}
                    className={mode === "platform" ? "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20" : ""}
                    data-testid="button-platform-toggle"
                  >
                    <ToggleLeft className={`h-4 w-4 transition-transform ${mode === "platform" ? "rotate-180" : ""}`} />
                    <span>{mode === "clinic" ? "Enter Platform Mode" : "Return to Clinic"}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>{mode === "platform" ? "Platform Control" : "Main Menu"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => {
                const isActive = location === item.url || 
                  (item.url !== "/" && item.url !== "/platform" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={mode === "platform" ? "data-[active=true]:bg-indigo-500/10 data-[active=true]:text-indigo-500" : ""}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <Link href={item.url} onClick={() => sounds.tabChange()}>
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

        {mode === "clinic" && filteredSettingsItems.length > 0 && (
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
                        <Link href={item.url} onClick={() => sounds.tabChange()}>
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
