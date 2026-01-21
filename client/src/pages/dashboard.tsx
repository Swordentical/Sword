import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { format, isAfter, startOfDay } from "date-fns";
import {
  Users,
  Calendar,
  DollarSign,
  AlertCircle,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  TrendingUp,
  Package,
  FileText,
  Search,
  CalendarDays,
  User,
  Settings2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AppointmentWithDetails as AppointmentWithPatient, Patient, InventoryItem, ActivityLog, Appointment } from "@shared/schema";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  confirmed: "default",
  pending: "secondary",
  canceled: "destructive",
  completed: "outline",
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  canceled: "Canceled",
  completed: "Completed",
};

function AppointmentStatusBadge({ status }: { status: string }) {
  const variant = STATUS_VARIANTS[status] || "secondary";
  const label = STATUS_LABELS[status] || "Pending";
  return <Badge variant={variant}>{label}</Badge>;
}

function TodayAppointmentCard({ 
  appointment, 
  onClick 
}: { 
  appointment: AppointmentWithPatient;
  onClick: (apt: AppointmentWithPatient) => void;
}) {
  const startTime = new Date(appointment.startTime);
  const initials = `${appointment.patient.firstName.charAt(0)}${appointment.patient.lastName.charAt(0)}`;

  return (
    <div 
      className="flex items-center gap-4 p-3 rounded-lg border bg-card hover-elevate cursor-pointer transition-colors hover:bg-accent/50"
      onClick={() => onClick(appointment)}
    >
      <div className="text-center min-w-[60px]">
        <div className="text-lg font-bold text-foreground">
          {format(startTime, "HH:mm")}
        </div>
        <div className="text-xs text-muted-foreground">
          {format(startTime, "a")}
        </div>
      </div>
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">
          {appointment.patient.firstName} {appointment.patient.lastName}
        </div>
        <div className="flex flex-col gap-0.5 mt-0.5">
          <div className="text-sm text-muted-foreground truncate">
            {appointment.title}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70">
            {appointment.doctor && (
              <span className="truncate">Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}</span>
            )}
            {appointment.roomNumber && (
              <span>Room {appointment.roomNumber}</span>
            )}
          </div>
        </div>
      </div>
      <AppointmentStatusBadge status={appointment.status || "pending"} />
    </div>
  );
}

function EditAppointmentDialog({
  appointment,
  open,
  onOpenChange,
}: {
  appointment: AppointmentWithPatient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [newTime, setNewTime] = useState("");

  useEffect(() => {
    if (appointment) {
      setNewTime(format(new Date(appointment.startTime), "yyyy-MM-dd'T'HH:mm"));
    }
  }, [appointment]);

  const updateMutation = useMutation({
    mutationFn: async (data: { startTime?: string; status?: string }) => {
      const res = await apiRequest("PATCH", `/api/appointments/${appointment?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/today"] });
      toast({ title: "Appointment updated successfully" });
      onOpenChange(false);
    },
  });

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Appointment</DialogTitle>
          <DialogDescription>
            Reschedule or update status for {appointment.patient.firstName} {appointment.patient.lastName}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="time">Date & Time</Label>
            <Input
              id="time"
              type="datetime-local"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button
              className="w-full"
              variant="default"
              onClick={() => updateMutation.mutate({ status: "confirmed", startTime: new Date(newTime).toISOString() })}
              disabled={updateMutation.isPending}
            >
              Confirm
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => updateMutation.mutate({ status: "completed", startTime: new Date(newTime).toISOString() })}
              disabled={updateMutation.isPending}
            >
              Complete
            </Button>
            <Button
              className="w-full col-span-2"
              variant="destructive"
              onClick={() => updateMutation.mutate({ status: "canceled", startTime: new Date(newTime).toISOString() })}
              disabled={updateMutation.isPending}
            >
              Cancel Appointment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ... rest of the file ...

function QuickActionButton({
  icon: Icon,
  label,
  href,
  testId,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  testId: string;
}) {
  return (
    <Link href={href}>
      <Button
        variant="outline"
        className="flex flex-col items-center gap-2 h-auto py-4 px-6 w-full"
        data-testid={testId}
      >
        <Icon className="h-5 w-5" />
        <span className="text-sm">{label}</span>
      </Button>
    </Link>
  );
}

function RecentActivityItem({ activity }: { activity: ActivityLog }) {
  const getActivityIcon = (action: string) => {
    if (action.includes("created")) return <Plus className="h-4 w-4 text-emerald-500" />;
    if (action.includes("completed")) return <CheckCircle2 className="h-4 w-4 text-primary" />;
    if (action.includes("canceled")) return <XCircle className="h-4 w-4 text-destructive" />;
    return <FileText className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className="mt-0.5">{getActivityIcon(activity.action)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{activity.details}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {activity.createdAt && format(new Date(activity.createdAt), "MMM d, h:mm a")}
        </p>
      </div>
    </div>
  );
}

type WidgetSlot = "header" | "fullWidth" | "main" | "sidebar";

type WidgetConfig = {
  id: string;
  label: string;
  slot: WidgetSlot;
  enabled: boolean;
  order: number;
};

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "clock", label: "Clock & Date", slot: "header", enabled: true, order: 0 },
  { id: "stats", label: "Statistics Cards", slot: "fullWidth", enabled: true, order: 0 },
  { id: "appointments", label: "Today's Appointments", slot: "main", enabled: true, order: 0 },
  { id: "quickActions", label: "Quick Actions", slot: "main", enabled: true, order: 1 },
  { id: "activity", label: "Recent Activity", slot: "sidebar", enabled: true, order: 0 },
  { id: "lowStock", label: "Low Stock Alerts", slot: "sidebar", enabled: true, order: 1 },
];

const SLOT_LABELS: Record<WidgetSlot, string> = {
  header: "Header",
  fullWidth: "Full Width",
  main: "Main Column",
  sidebar: "Sidebar",
};

const WIDGETS_STORAGE_KEY = "dashboard-widgets-config-v2";

function loadWidgetConfig(): WidgetConfig[] {
  try {
    const saved = localStorage.getItem(WIDGETS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as WidgetConfig[];
      const savedMap = new Map<string, WidgetConfig>(parsed.map((w) => [w.id, w]));
      return DEFAULT_WIDGETS.map(dw => {
        const savedWidget = savedMap.get(dw.id);
        return savedWidget ? { ...dw, enabled: savedWidget.enabled, order: savedWidget.order } : dw;
      });
    }
  } catch (e) {}
  return [...DEFAULT_WIDGETS];
}

function saveWidgetConfig(config: WidgetConfig[]) {
  localStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(config));
}

function WidgetSettingsPanel({ 
  widgets, 
  onToggle, 
  onMoveUp,
  onMoveDown,
  onReset 
}: { 
  widgets: WidgetConfig[];
  onToggle: (id: string) => void;
  onMoveUp: (id: string, slot: WidgetSlot) => void;
  onMoveDown: (id: string, slot: WidgetSlot) => void;
  onReset: () => void;
}) {
  const slots: WidgetSlot[] = ["header", "fullWidth", "main", "sidebar"];
  
  return (
    <div className="space-y-6">
      {slots.map(slot => {
        const slotWidgets = widgets
          .filter(w => w.slot === slot)
          .sort((a, b) => a.order - b.order);
        
        if (slotWidgets.length === 0) return null;
        
        return (
          <div key={slot} className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {SLOT_LABELS[slot]}
            </h4>
            <div className="space-y-2">
              {slotWidgets.map((widget, index) => (
                <div 
                  key={widget.id} 
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`widget-${widget.id}`}
                      checked={widget.enabled}
                      onCheckedChange={() => onToggle(widget.id)}
                      data-testid={`switch-widget-${widget.id}`}
                    />
                    <Label htmlFor={`widget-${widget.id}`} className="cursor-pointer text-sm">
                      {widget.label}
                    </Label>
                  </div>
                  {slotWidgets.length > 1 && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onMoveUp(widget.id, slot)}
                        disabled={index === 0}
                        data-testid={`button-move-up-${widget.id}`}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onMoveDown(widget.id, slot)}
                        disabled={index === slotWidgets.length - 1}
                        data-testid={`button-move-down-${widget.id}`}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <Separator />
      <Button 
        variant="outline" 
        onClick={onReset} 
        className="w-full"
        data-testid="button-reset-widgets"
      >
        Reset to Default
      </Button>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => loadWidgetConfig());
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalPatients: number;
    todayAppointments: number;
    monthlyRevenue: number;
    outstandingBalance: number;
    lowStockItems: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: todayAppointments, isLoading: appointmentsLoading } = useQuery<AppointmentWithPatient[]>({
    queryKey: ["/api/appointments", { start: startOfDay(new Date()).toISOString() }],
  });

  const [selectedApt, setSelectedApt] = useState<AppointmentWithPatient | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleAptClick = (apt: AppointmentWithPatient) => {
    setSelectedApt(apt);
    setIsEditDialogOpen(true);
  };

  const { data: recentActivity, isLoading: activityLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity/recent"],
  });

  const { data: lowStockItems, isLoading: inventoryLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory/low-stock"],
    enabled: !isStudent,
  });

  const isWidgetEnabled = (id: string) => widgets.find(w => w.id === id)?.enabled ?? true;

  const toggleWidget = (id: string) => {
    const updated = widgets.map(w => 
      w.id === id ? { ...w, enabled: !w.enabled } : w
    );
    setWidgets(updated);
    saveWidgetConfig(updated);
  };

  const moveWidgetUp = (id: string, slot: WidgetSlot) => {
    const slotWidgets = widgets.filter(w => w.slot === slot).sort((a, b) => a.order - b.order);
    const index = slotWidgets.findIndex(w => w.id === id);
    if (index > 0) {
      const updated = widgets.map(w => {
        if (w.id === id) return { ...w, order: slotWidgets[index - 1].order };
        if (w.id === slotWidgets[index - 1].id) return { ...w, order: slotWidgets[index].order };
        return w;
      });
      setWidgets(updated);
      saveWidgetConfig(updated);
    }
  };

  const moveWidgetDown = (id: string, slot: WidgetSlot) => {
    const slotWidgets = widgets.filter(w => w.slot === slot).sort((a, b) => a.order - b.order);
    const index = slotWidgets.findIndex(w => w.id === id);
    if (index < slotWidgets.length - 1) {
      const updated = widgets.map(w => {
        if (w.id === id) return { ...w, order: slotWidgets[index + 1].order };
        if (w.id === slotWidgets[index + 1].id) return { ...w, order: slotWidgets[index].order };
        return w;
      });
      setWidgets(updated);
      saveWidgetConfig(updated);
    }
  };

  const resetWidgets = () => {
    setWidgets([...DEFAULT_WIDGETS]);
    saveWidgetConfig([...DEFAULT_WIDGETS]);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const renderStatsWidget = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Patients"
        value={statsLoading ? "..." : stats?.totalPatients || 0}
        description="All registered patients"
        icon={Users}
        color="primary"
      />
      <StatCard
        title="Today's Appointments"
        value={statsLoading ? "..." : stats?.todayAppointments || 0}
        description="Scheduled for today"
        icon={Calendar}
        color="success"
      />
      {!isStudent && (
        <>
          <StatCard
            title="Monthly Revenue"
            value={statsLoading ? "..." : `$${(stats?.monthlyRevenue || 0).toLocaleString()}`}
            description="This month's earnings"
            icon={DollarSign}
            color="success"
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Outstanding Balance"
            value={statsLoading ? "..." : `$${(stats?.outstandingBalance || 0).toLocaleString()}`}
            description="Pending payments"
            icon={AlertCircle}
            color="warning"
          />
        </>
      )}
      {isStudent && (
        <StatCard
          title="My Patients"
          value={statsLoading ? "..." : stats?.totalPatients || 0}
          description="Assigned to you"
          icon={Users}
          color="success"
        />
      )}
    </div>
  );

  const renderAppointmentsWidget = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle>Today's Appointments</CardTitle>
          <CardDescription>
            {todayAppointments?.length || 0} appointments scheduled
          </CardDescription>
        </div>
        <Link href="/appointments">
          <Button variant="outline" size="sm" data-testid="button-view-appointments">
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px] pr-4">
          {appointmentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : todayAppointments && todayAppointments.length > 0 ? (
            <div className="space-y-4">
              {todayAppointments
                .filter(apt => apt.status !== "canceled" || isAfter(new Date(apt.startTime), startOfDay(new Date())))
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .map((apt) => (
                  <TodayAppointmentCard key={apt.id} appointment={apt} onClick={handleAptClick} />
                ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No upcoming appointments</p>
              <p className="text-xs text-muted-foreground mt-1">
                Enjoy your clear schedule or create a new one
              </p>
              <Link href="/appointments?action=new">
                <Button variant="outline" size="sm" className="mt-4">
                  Schedule Now
                </Button>
              </Link>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );

  const renderQuickActionsWidget = () => (
    <div className="grid gap-4 md:grid-cols-4">
      <QuickActionButton
        icon={Plus}
        label="Add Patient"
        href="/patients?action=new"
        testId="button-quick-add-patient"
      />
      <QuickActionButton
        icon={Calendar}
        label="New Appointment"
        href="/appointments?action=new"
        testId="button-quick-new-appointment"
      />
      {!isStudent && (
        <>
          <QuickActionButton
            icon={FileText}
            label="Create Invoice"
            href="/financials?action=new-invoice"
            testId="button-quick-create-invoice"
          />
          <QuickActionButton
            icon={Package}
            label="Check Inventory"
            href="/inventory"
            testId="button-quick-inventory"
          />
        </>
      )}
    </div>
  );

  const renderActivityWidget = () => (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates in your clinic</CardDescription>
      </CardHeader>
      <CardContent>
        {activityLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : recentActivity && recentActivity.length > 0 ? (
          <ScrollArea className="h-[250px]">
            {recentActivity.map((activity) => (
              <RecentActivityItem key={activity.id} activity={activity} />
            ))}
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Clock className="h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderLowStockWidget = () => {
    if (isStudent) return null;
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inventoryLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : lowStockItems && lowStockItems.length > 0 ? (
            <div className="space-y-2">
              {lowStockItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <span className="text-sm font-medium truncate">{item.name}</span>
                  <Badge variant="destructive" className="shrink-0">
                    {item.currentQuantity} left
                  </Badge>
                </div>
              ))}
              {lowStockItems.length > 5 && (
                <Link href="/inventory?filter=low-stock">
                  <Button variant="ghost" size="sm" className="p-0">
                    View all {lowStockItems.length} items
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              All items are well stocked
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  const getSlotWidgets = (slot: WidgetSlot) => 
    widgets.filter(w => w.slot === slot && w.enabled).sort((a, b) => a.order - b.order);
  
  const headerWidgets = getSlotWidgets("header");
  const fullWidthWidgets = getSlotWidgets("fullWidth");
  const mainWidgets = getSlotWidgets("main");
  const sidebarWidgets = getSlotWidgets("sidebar").filter(w => !(isStudent && w.id === "lowStock"));

  const renderWidgetById = (id: string) => {
    switch (id) {
      case "clock": return <LiveClock />;
      case "stats": return renderStatsWidget();
      case "appointments": return renderAppointmentsWidget();
      case "quickActions": return renderQuickActionsWidget();
      case "activity": return renderActivityWidget();
      case "lowStock": return renderLowStockWidget();
      default: return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-greeting">
              {greeting()}, {user?.firstName}!
            </h1>
            <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-customize-dashboard">
                  <Settings2 className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Customize Dashboard</SheetTitle>
                  <SheetDescription>
                    Show, hide, or reorder widgets to customize your dashboard
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  <WidgetSettingsPanel
                    widgets={widgets}
                    onToggle={toggleWidget}
                    onMoveUp={moveWidgetUp}
                    onMoveDown={moveWidgetDown}
                    onReset={resetWidgets}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <p className="text-muted-foreground">
            Here's what's happening at your clinic today.
          </p>
          <div className="mt-2">
            <GlobalSearch />
          </div>
        </div>
        {headerWidgets.map(w => (
          <div key={w.id} className="lg:w-auto">{renderWidgetById(w.id)}</div>
        ))}
      </div>

      {fullWidthWidgets.map(w => (
        <div key={w.id}>{renderWidgetById(w.id)}</div>
      ))}

      <EditAppointmentDialog 
        appointment={selectedApt}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      {(mainWidgets.length > 0 || sidebarWidgets.length > 0) && (
        <div className={`grid gap-6 ${sidebarWidgets.length > 0 ? 'lg:grid-cols-3' : ''}`}>
          {mainWidgets.length > 0 && (
            <div className={`${sidebarWidgets.length > 0 ? 'lg:col-span-2' : ''} space-y-6`}>
              {mainWidgets.map(w => (
                <div key={w.id}>{renderWidgetById(w.id)}</div>
              ))}
            </div>
          )}
          {sidebarWidgets.length > 0 && (
            <div className="space-y-6">
              {sidebarWidgets.map(w => (
                <div key={w.id}>{renderWidgetById(w.id)}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
