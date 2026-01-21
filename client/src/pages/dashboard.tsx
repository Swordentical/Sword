import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { format, isAfter, startOfDay, isToday, isTomorrow } from "date-fns";
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
      className="group relative flex items-center gap-4 p-4 rounded-xl border border-transparent bg-card/50 hover:bg-card hover:border-primary/20 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden"
      onClick={() => onClick(appointment)}
      data-testid={`card-appointment-${appointment.id}`}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="text-center min-w-[70px] space-y-1">
        <div className="text-xl font-black tracking-tighter text-foreground">
          {format(startTime, "HH:mm")}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          {format(startTime, "a")}
        </div>
      </div>
      <Avatar className="h-12 w-12 border-2 border-background shadow-sm group-hover:scale-105 transition-transform">
        <AvatarFallback className="bg-primary/10 text-primary text-base font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="text-base font-bold tracking-tight truncate group-hover:text-primary transition-colors">
          {appointment.patient.firstName} {appointment.patient.lastName}
        </div>
        <div className="flex flex-col gap-1 mt-1">
          <div className="text-sm font-medium text-muted-foreground/80 truncate">
            {appointment.title}
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tight">
            {appointment.doctor && (
              <span className="flex items-center gap-1 truncate">
                <User className="h-3 w-3" />
                Dr. {appointment.doctor.firstName.charAt(0)}. {appointment.doctor.lastName}
              </span>
            )}
            {appointment.roomNumber && (
              <span className="flex items-center gap-1 shrink-0">
                <Settings2 className="h-3 w-3" />
                Room {appointment.roomNumber}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="transition-transform group-hover:scale-105">
        <AppointmentStatusBadge status={appointment.status || "pending"} />
      </div>
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
            <Label htmlFor="edit-apt-time">Date & Time</Label>
            <Input
              id="edit-apt-time"
              type="datetime-local"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              data-testid="input-appointment-datetime"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button
              variant="default"
              onClick={() => updateMutation.mutate({ status: "confirmed", startTime: new Date(newTime).toISOString() })}
              disabled={updateMutation.isPending}
              data-testid="button-confirm-appointment"
            >
              Confirm
            </Button>
            <Button
              variant="outline"
              onClick={() => updateMutation.mutate({ status: "completed", startTime: new Date(newTime).toISOString() })}
              disabled={updateMutation.isPending}
              data-testid="button-complete-appointment"
            >
              Complete
            </Button>
            <Button
              className="col-span-2"
              variant="destructive"
              onClick={() => updateMutation.mutate({ status: "canceled", startTime: new Date(newTime).toISOString() })}
              disabled={updateMutation.isPending}
              data-testid="button-cancel-appointment"
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

function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="rounded-2xl bg-primary/10 p-4 shadow-inner">
            <Clock className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <div>
            <div className="text-4xl font-black tabular-nums tracking-tighter text-foreground/90">
              {format(time, "HH:mm:ss")}
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground/80 mt-1">
              <CalendarDays className="h-4 w-4 text-primary/60" />
              <span>{format(time, "EEEE, MMMM d, yyyy")}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: appointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: inventory } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const filteredPatients = patients?.filter((p) =>
    `${p.firstName} ${p.lastName} ${p.phone || ""} ${p.email || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  ).slice(0, 5) || [];

  const filteredAppointments = appointments?.filter((a) =>
    (a.title || "").toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5) || [];

  const filteredInventory = inventory?.filter((item) =>
    `${item.name} ${item.category || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  ).slice(0, 5) || [];

  const handleSelectPatient = (id: string) => {
    setOpen(false);
    setSearch("");
    navigate(`/patients/${id}`);
  };

  const handleSelectAppointment = () => {
    setOpen(false);
    setSearch("");
    navigate("/appointments");
  };

  const handleSelectInventory = () => {
    setOpen(false);
    setSearch("");
    navigate("/inventory");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full md:w-[400px] justify-start text-muted-foreground gap-2"
          data-testid="button-global-search"
        >
          <Search className="h-4 w-4" />
          <span>Search patients, appointments, inventory...</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full md:w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search by name, phone, email, or item..." 
            value={search}
            onValueChange={setSearch}
            data-testid="input-global-search"
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {filteredPatients.length > 0 && (
              <CommandGroup heading="Patients">
                {filteredPatients.map((patient) => (
                  <CommandItem
                    key={patient.id}
                    onSelect={() => handleSelectPatient(patient.id)}
                    className="gap-3 cursor-pointer"
                    data-testid={`search-result-patient-${patient.id}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {patient.firstName} {patient.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {patient.phone || patient.email || "No contact info"}
                      </div>
                    </div>
                    <User className="h-4 w-4 text-muted-foreground" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {filteredAppointments.length > 0 && (
              <CommandGroup heading="Appointments">
                {filteredAppointments.map((appointment) => (
                  <CommandItem
                    key={appointment.id}
                    onSelect={handleSelectAppointment}
                    className="gap-3 cursor-pointer"
                    data-testid={`search-result-appointment-${appointment.id}`}
                  >
                    <div className="rounded-full bg-emerald-500/10 p-1.5">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {appointment.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(appointment.startTime), "MMM d, h:mm a")}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {filteredInventory.length > 0 && (
              <CommandGroup heading="Inventory">
                {filteredInventory.map((item) => (
                  <CommandItem
                    key={item.id}
                    onSelect={handleSelectInventory}
                    className="gap-3 cursor-pointer"
                    data-testid={`search-result-inventory-${item.id}`}
                  >
                    <div className="rounded-full bg-amber-500/10 p-1.5">
                      <Package className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.category || "Uncategorized"} - Qty: {item.currentQuantity}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  color = "primary",
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: { value: number; isPositive: boolean };
  color?: "primary" | "success" | "warning" | "destructive";
}) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    destructive: "bg-destructive/10 text-destructive",
  };

  return (
    <Card className="group overflow-hidden border-none bg-gradient-to-br from-card to-muted/30 shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
          {title}
        </CardTitle>
        <div className={`rounded-xl p-2.5 shadow-sm transition-transform duration-300 group-hover:scale-110 ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black tracking-tight">{value}</div>
        {description && (
          <p className="text-xs font-medium text-muted-foreground/70 mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1.5 mt-3">
            <div className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              trend.isPositive ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"
            }`}>
              <TrendingUp
                className={`h-3 w-3 ${trend.isPositive ? "" : "rotate-180"}`}
              />
              {trend.isPositive ? "+" : "-"}{trend.value}%
            </div>
            <span className="text-[10px] font-medium text-muted-foreground/60 italic">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
        className="group relative flex flex-col items-center gap-3 h-auto py-6 px-4 w-full border-none bg-gradient-to-b from-card to-muted/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
        data-testid={testId}
      >
        <div className="rounded-2xl bg-primary/10 p-3 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
          <Icon className="h-6 w-6" />
        </div>
        <span className="text-sm font-bold tracking-tight">{label}</span>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-b-lg" />
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
  { id: "appointments", label: "Upcoming Appointments", slot: "main", enabled: true, order: 0 },
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

  const { data: upcomingAppointments, isLoading: appointmentsLoading } = useQuery<AppointmentWithPatient[]>({
    queryKey: ["/api/appointments", { start: startOfDay(new Date()).toISOString() }],
  });

  const [selectedApt, setSelectedApt] = useState<AppointmentWithPatient | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleAptClick = (apt: AppointmentWithPatient) => {
    setSelectedApt(apt);
    setIsEditDialogOpen(true);
  };

  // Group appointments by date
  const groupedAppointments = upcomingAppointments?.reduce((groups: Record<string, AppointmentWithPatient[]>, apt) => {
    const date = startOfDay(new Date(apt.startTime)).toISOString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(apt);
    return groups;
  }, {});

  const sortedDates = groupedAppointments ? Object.keys(groupedAppointments).sort() : [];

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "d / M / yyyy");
  };

  const renderAppointments = () => {
    if (appointmentsLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!upcomingAppointments || upcomingAppointments.length === 0) {
      return (
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
      );
    }

    return (
      <div className="space-y-6">
        {sortedDates.map((dateStr) => (
          <div key={dateStr} className="space-y-3">
            <div className="flex items-center gap-4">
              <Separator className="flex-1" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {getDateLabel(dateStr)}
              </span>
              <Separator className="flex-1" />
            </div>
            <div className="grid gap-3">
              {groupedAppointments![dateStr].map((apt) => (
                <TodayAppointmentCard 
                  key={apt.id} 
                  appointment={apt} 
                  onClick={handleAptClick}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
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
    <Card className="border-none bg-gradient-to-br from-card to-muted/20 shadow-lg ring-1 ring-primary/5">
      <CardHeader className="flex flex-row items-center justify-between gap-4 border-b bg-card/50 pb-6">
        <div>
          <CardTitle className="text-xl font-black tracking-tight">Upcoming Appointments</CardTitle>
          <CardDescription className="text-sm font-medium">
            Stay on top of your schedule
          </CardDescription>
        </div>
        <Link href="/appointments">
          <Button variant="secondary" size="sm" className="font-bold shadow-sm" data-testid="button-view-appointments">
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="pt-6">
        <ScrollArea className="h-[600px] pr-4 -mr-4">
          {renderAppointments()}
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
    <div className="p-4 sm:p-8 space-y-8 max-w-[1600px] mx-auto overflow-x-hidden">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black tracking-tight text-foreground" data-testid="text-greeting">
              {greeting()}, <span className="text-primary">{user?.firstName}</span>!
            </h1>
            <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary transition-colors" data-testid="button-customize-dashboard">
                  <Settings2 className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-md">
                <SheetHeader className="pb-6 border-b">
                  <SheetTitle className="text-2xl font-bold">Dashboard Layout</SheetTitle>
                  <SheetDescription className="text-base">
                    Personalize your workspace by arranging and toggling widgets.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-8">
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
          <p className="text-lg font-medium text-muted-foreground/80">
            Welcome back! Here is a summary of today's activities.
          </p>
          <div className="mt-4 max-w-md">
            <GlobalSearch />
          </div>
        </div>
        {headerWidgets.map(w => (
          <div key={w.id} className="lg:w-auto transform hover:scale-[1.02] transition-transform">{renderWidgetById(w.id)}</div>
        ))}
      </div>

      {fullWidthWidgets.map(w => (
        <div key={w.id} className="w-full">{renderWidgetById(w.id)}</div>
      ))}

      <EditAppointmentDialog 
        appointment={selectedApt}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      {(mainWidgets.length > 0 || sidebarWidgets.length > 0) && (
        <div className={`grid gap-8 ${sidebarWidgets.length > 0 ? 'lg:grid-cols-12' : 'grid-cols-1'}`}>
          {mainWidgets.length > 0 && (
            <div className={`${sidebarWidgets.length > 0 ? 'lg:col-span-8' : ''} space-y-8`}>
              {mainWidgets.map(w => (
                <div key={w.id} className="w-full">{renderWidgetById(w.id)}</div>
              ))}
            </div>
          )}
          {sidebarWidgets.length > 0 && (
            <div className="lg:col-span-4 space-y-8">
              {sidebarWidgets.map(w => (
                <div key={w.id} className="w-full">{renderWidgetById(w.id)}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
