import { useState, useEffect, useMemo } from "react";
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
  Stethoscope,
  Receipt,
  ClipboardList,
  FlaskConical,
  Bell,
  Activity,
  Target,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
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
      className="group relative flex items-center gap-3 p-3 rounded-lg border hover-elevate shadow-sm transition-all cursor-pointer backdrop-blur-[var(--elements-blur,2px)] [background-color:hsl(var(--card)/var(--elements-transparency,0.5))]"
      onClick={() => onClick(appointment)}
      data-testid={`card-appointment-${appointment.id}`}
    >
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity rounded-l-lg" />
      <div className="text-center min-w-[50px]">
        <div className="text-lg font-bold text-foreground">
          {format(startTime, "HH:mm")}
        </div>
        <div className="text-[10px] uppercase text-muted-foreground">
          {format(startTime, "a")}
        </div>
      </div>
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={appointment.patient.photoUrl || undefined} alt={`${appointment.patient.firstName} ${appointment.patient.lastName}`} />
        <AvatarFallback className="bg-primary/10 text-foreground text-sm font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">
          {appointment.patient.firstName} {appointment.patient.lastName}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {appointment.title || appointment.category}
        </p>
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

const CLOCK_STORAGE_KEY = "dashboard-clock-style";

function LiveWallpaper() {
  const particles = useMemo(() => 
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      size: Math.random() * 60 + 20,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * -20,
    })), []
  );

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20 dark:to-muted/10" />
      <div className="absolute inset-0 opacity-30 dark:opacity-20">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/15 dark:to-primary/5 blur-xl"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              animation: `float-particle ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-radial from-primary/10 to-transparent dark:from-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-radial from-primary/8 to-transparent dark:from-primary/4 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
      <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-gradient-radial from-muted/30 to-transparent dark:from-muted/15 rounded-full blur-2xl" />
      <style>{`
        @keyframes float-particle {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.6;
          }
          25% {
            transform: translate(30px, -40px) scale(1.1);
            opacity: 0.8;
          }
          50% {
            transform: translate(-20px, -60px) scale(0.9);
            opacity: 0.5;
          }
          75% {
            transform: translate(40px, -30px) scale(1.05);
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  const [isAnalog, setIsAnalog] = useState(() => {
    try {
      return localStorage.getItem(CLOCK_STORAGE_KEY) === "analog";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleClockStyle = () => {
    const newStyle = !isAnalog;
    setIsAnalog(newStyle);
    localStorage.setItem(CLOCK_STORAGE_KEY, newStyle ? "analog" : "digital");
  };

  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  
  const hourDeg = (hours * 30) + (minutes * 0.5);
  const minuteDeg = minutes * 6;
  const secondDeg = seconds * 6;

  return (
    <div 
      className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 p-3 sm:p-4 md:p-5 rounded-xl bg-gradient-to-br from-primary/8 via-primary/4 to-transparent border border-primary/15 cursor-pointer hover-elevate transition-all duration-300 backdrop-blur-sm"
      onClick={toggleClockStyle}
      title="Click to toggle clock style"
      data-testid="button-clock-toggle"
    >
      {isAnalog ? (
        <div className="relative h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-full border-2 border-primary/20 bg-gradient-to-br from-card to-muted/30 shadow-lg">
          <div className="absolute inset-1 rounded-full border border-primary/10" />
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute inset-0 flex justify-center"
              style={{ transform: `rotate(${i * 30}deg)` }}
            >
              <div className={`${i % 3 === 0 ? 'h-2 w-0.5 bg-foreground/60 mt-1' : 'h-1.5 w-px bg-muted-foreground/40 mt-1.5'}`} />
            </div>
          ))}
          <div 
            className="absolute inset-0 flex justify-center"
            style={{ transform: `rotate(${hourDeg}deg)` }}
          >
            <div className="w-1 h-[25%] bg-foreground rounded-full mt-[25%] shadow-sm" />
          </div>
          <div 
            className="absolute inset-0 flex justify-center"
            style={{ transform: `rotate(${minuteDeg}deg)` }}
          >
            <div className="w-0.5 h-[35%] bg-foreground/80 rounded-full mt-[15%]" />
          </div>
          <div 
            className="absolute inset-0 flex justify-center"
            style={{ transform: `rotate(${secondDeg}deg)` }}
          >
            <div className="w-px h-[35%] bg-primary rounded-full mt-[15%]" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-primary shadow-sm z-10" />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 sm:p-2.5 rounded-lg bg-primary/10">
            <Clock className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-primary" />
          </div>
          <div className="text-2xl sm:text-3xl md:text-4xl font-bold tabular-nums tracking-tight">
            {format(time, "HH:mm")}
            <span className="text-lg sm:text-xl md:text-2xl text-muted-foreground animate-pulse">:</span>
            <span className="text-lg sm:text-xl md:text-2xl text-muted-foreground">{format(time, "ss")}</span>
          </div>
        </div>
      )}
      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-1 sm:gap-0.5 text-center sm:text-right">
        <div className="text-xs sm:text-sm font-medium text-muted-foreground">
          {format(time, "EEEE")}
        </div>
        <span className="text-muted-foreground/50 sm:hidden">-</span>
        <div className="text-sm sm:text-base md:text-lg font-semibold">
          {format(time, "MMM d, yyyy")}
        </div>
      </div>
    </div>
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
        <div className="flex">
          {/* Icon-only button for intermediate screens (sm to md) */}
          <Button 
            variant="outline" 
            size="icon"
            className="hidden sm:flex md:hidden"
            data-testid="button-global-search-icon"
          >
            <Search className="h-4 w-4" />
          </Button>
          {/* Full search bar for mobile and larger screens */}
          <Button 
            variant="outline" 
            className="w-full justify-start text-muted-foreground gap-2 sm:hidden md:flex"
            data-testid="button-global-search"
          >
            <Search className="h-4 w-4" />
            <span className="hidden md:inline">Search patients, appointments...</span>
            <span className="md:hidden">Search...</span>
            <kbd className="hidden lg:inline-flex pointer-events-none ml-auto select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono font-medium text-muted-foreground">
              Ctrl+K
            </kbd>
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[90vw] max-w-md p-0" align="start">
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
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={patient.photoUrl || undefined} alt={`${patient.firstName} ${patient.lastName}`} />
                      <AvatarFallback className="bg-primary/10 text-foreground text-xs">
                        {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {patient.firstName} {patient.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {patient.phone || patient.email || "No contact info"}
                      </div>
                    </div>
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
                      <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
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
                      <Package className="h-3.5 w-3.5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.currentQuantity} {item.unit} in stock
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

function MiniStatCard({
  title,
  value,
  icon: Icon,
  color = "primary",
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color?: "primary" | "success" | "warning" | "destructive";
  trend?: { value: number; isPositive: boolean };
}) {
  const colorClasses = {
    primary: "bg-primary/10 text-foreground",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    destructive: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border shadow-sm hover-elevate transition-shadow backdrop-blur-[var(--elements-blur,2px)] [background-color:hsl(var(--card)/var(--elements-transparency,0.5))]">
      <div className={cn("rounded-lg p-2", colorClasses[color])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{title}</p>
        <div className="flex items-center gap-2">
          <p className="text-lg font-bold">{value}</p>
          {trend && (
            <span className={cn(
              "text-[10px] font-medium",
              trend.isPositive ? "text-emerald-600" : "text-destructive"
            )}>
              {trend.isPositive ? "+" : ""}{trend.value}%
            </span>
          )}
        </div>
      </div>
    </div>
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
        variant="ghost"
        size="sm"
        className="flex-col gap-1.5 w-full"
        data-testid={testId}
      >
        <div className="rounded-lg bg-primary/10 p-2 text-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <span className="font-medium text-muted-foreground">{label}</span>
      </Button>
    </Link>
  );
}

const INSPIRATIONAL_QUOTES = [
  { text: "The art of medicine consists of amusing the patient while nature cures the disease.", author: "Voltaire", category: "Philosophy" },
  { text: "Wherever the art of medicine is loved, there is also a love of humanity.", author: "Hippocrates", category: "Medical" },
  { text: "The good physician treats the disease; the great physician treats the patient who has the disease.", author: "William Osler", category: "Medical" },
  { text: "The best way to find yourself is to lose yourself in the service of others.", author: "Mahatma Gandhi", category: "Philosophy" },
  { text: "Science is organized knowledge. Wisdom is organized life.", author: "Immanuel Kant", category: "Science" },
  { text: "In nothing do men more nearly approach the gods than in giving health to men.", author: "Cicero", category: "Medical" },
  { text: "The greatest wealth is health.", author: "Virgil", category: "Philosophy" },
  { text: "Medicine is a science of uncertainty and an art of probability.", author: "William Osler", category: "Medical" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "Empowerment" },
  { text: "It is health that is real wealth and not pieces of gold and silver.", author: "Mahatma Gandhi", category: "Philosophy" },
  { text: "The first wealth is health.", author: "Ralph Waldo Emerson", category: "Philosophy" },
  { text: "Healing is a matter of time, but it is sometimes also a matter of opportunity.", author: "Hippocrates", category: "Medical" },
  { text: "Science knows no country, because knowledge belongs to humanity.", author: "Louis Pasteur", category: "Science" },
  { text: "The doctor of the future will give no medication, but will interest his patients in the care of the human frame.", author: "Thomas Edison", category: "Medical" },
  { text: "Nothing in life is to be feared, it is only to be understood.", author: "Marie Curie", category: "Science" },
  { text: "Let food be thy medicine and medicine be thy food.", author: "Hippocrates", category: "Medical" },
  { text: "The mind is everything. What you think you become.", author: "Buddha", category: "Philosophy" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", category: "Empowerment" },
  { text: "A healthy outside starts from the inside.", author: "Robert Urich", category: "Advice" },
  { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn", category: "Advice" },
  { text: "An ounce of prevention is worth a pound of cure.", author: "Benjamin Franklin", category: "Advice" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney", category: "Empowerment" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", category: "Empowerment" },
  { text: "Your body hears everything your mind says.", author: "Naomi Judd", category: "Philosophy" },
  { text: "Health is not valued till sickness comes.", author: "Thomas Fuller", category: "Philosophy" },
  { text: "The human body is the best picture of the human soul.", author: "Ludwig Wittgenstein", category: "Philosophy" },
  { text: "Life is not merely to be alive, but to be well.", author: "Marcus Valerius Martial", category: "Philosophy" },
  { text: "Prevention is better than cure.", author: "Desiderius Erasmus", category: "Medical" },
  { text: "The physician must be able to tell the antecedents, know the present, and foretell the future.", author: "Hippocrates", category: "Medical" },
  { text: "Walking is man's best medicine.", author: "Hippocrates", category: "Advice" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins", category: "Empowerment" },
  { text: "Do not go where the path may lead, go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson", category: "Philosophy" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson", category: "Empowerment" },
  { text: "The purpose of life is not to be happy. It is to be useful.", author: "Ralph Waldo Emerson", category: "Philosophy" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela", category: "Empowerment" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein", category: "Science" },
  { text: "Imagination is more important than knowledge.", author: "Albert Einstein", category: "Science" },
  { text: "The only true wisdom is in knowing you know nothing.", author: "Socrates", category: "Philosophy" },
  { text: "Be the change you wish to see in the world.", author: "Mahatma Gandhi", category: "Philosophy" },
  { text: "What we know is a drop, what we don't know is an ocean.", author: "Isaac Newton", category: "Science" },
  { text: "The science of today is the technology of tomorrow.", author: "Edward Teller", category: "Science" },
  { text: "Every patient is a lesson in humility.", author: "Unknown", category: "Medical" },
  { text: "Empathy is the starting point for creating a community and taking action.", author: "Max Carver", category: "Empowerment" },
  { text: "A smile is the universal welcome.", author: "Max Eastman", category: "Advice" },
  { text: "The best doctor gives the least medicines.", author: "Benjamin Franklin", category: "Medical" },
  { text: "Health is a state of complete harmony of the body, mind and spirit.", author: "B.K.S. Iyengar", category: "Philosophy" },
  { text: "Rest when you're weary. Refresh and renew yourself.", author: "Ralph Marston", category: "Advice" },
  { text: "Happiness lies first of all in health.", author: "George William Curtis", category: "Philosophy" },
  { text: "Your health is what you make of it.", author: "Unknown", category: "Advice" },
  { text: "The groundwork for all happiness is good health.", author: "Leigh Hunt", category: "Philosophy" },
  { text: "He who has health has hope, and he who has hope has everything.", author: "Thomas Carlyle", category: "Philosophy" },
  { text: "A healthy attitude is contagious but don't wait to catch it from others.", author: "Tom Stoppard", category: "Advice" },
  { text: "To keep the body in good health is a duty.", author: "Buddha", category: "Philosophy" },
  { text: "Good health is not something we can buy. However, it can be an extremely valuable savings account.", author: "Anne Wilson Schaef", category: "Advice" },
  { text: "The higher your energy level, the more efficient your body.", author: "Tony Robbins", category: "Empowerment" },
  { text: "Those who think they have no time for healthy eating will sooner or later have to find time for illness.", author: "Edward Stanley", category: "Advice" },
];

function InspirationalQuotes() {
  const [currentIndex, setCurrentIndex] = useState(() => 
    Math.floor(Math.random() * INSPIRATIONAL_QUOTES.length)
  );
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % INSPIRATIONAL_QUOTES.length);
        setIsAnimating(false);
      }, 500);
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  const quote = INSPIRATIONAL_QUOTES[currentIndex];
  const categoryColors: Record<string, string> = {
    Philosophy: "text-purple-500 dark:text-purple-400",
    Medical: "text-emerald-500 dark:text-emerald-400",
    Science: "text-blue-500 dark:text-blue-400",
    Empowerment: "text-amber-500 dark:text-amber-400",
    Advice: "text-rose-500 dark:text-rose-400",
  };

  return (
    <Card className="overflow-hidden" data-testid="card-daily-inspiration">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold" data-testid="text-daily-inspiration-title">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Daily Inspiration
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div 
          className={cn(
            "transition-all duration-500 ease-in-out",
            isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
          )}
        >
          <blockquote className="text-sm italic text-foreground leading-relaxed mb-2" data-testid="text-quote-content">
            "{quote.text}"
          </blockquote>
          <div className="flex items-center justify-between">
            <cite className="text-xs text-muted-foreground not-italic font-medium" data-testid="text-quote-author">
              — {quote.author}
            </cite>
            <Badge variant="outline" className={cn("text-xs", categoryColors[quote.category])} data-testid="badge-quote-category">
              {quote.category}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-3" data-testid="indicator-quote-progress">
          {INSPIRATIONAL_QUOTES.slice(0, 5).map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i === currentIndex % 5 ? "bg-primary" : "bg-muted"
              )}
              data-testid={`indicator-quote-dot-${i}`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
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
  { id: "quickActions", label: "Quick Actions", slot: "sidebar", enabled: true, order: 0 },
  { id: "lowStock", label: "Low Stock Alerts", slot: "sidebar", enabled: true, order: 1 },
  { id: "productivity", label: "Daily Inspiration", slot: "sidebar", enabled: true, order: 2 },
];

const SLOT_LABELS: Record<WidgetSlot, string> = {
  header: "Header",
  fullWidth: "Full Width",
  main: "Main Column",
  sidebar: "Sidebar",
};

const WIDGETS_STORAGE_KEY = "dashboard-widgets-config-v3";

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
                  className="flex items-center justify-between p-3 rounded-lg border backdrop-blur-[var(--elements-blur,2px)] [background-color:hsl(var(--card)/var(--elements-transparency,0.5))]"
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
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onMoveUp(widget.id, slot)}
                      disabled={index === 0}
                      data-testid={`button-widget-move-up-${widget.id}`}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onMoveDown(widget.id, slot)}
                      disabled={index === slotWidgets.length - 1}
                      data-testid={`button-widget-move-down-${widget.id}`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <Separator />
      <Button variant="outline" size="sm" onClick={onReset} className="w-full" data-testid="button-reset-widgets">
        Reset to Default
      </Button>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState<WidgetConfig[]>(loadWidgetConfig);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState<AppointmentWithPatient | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const isStudent = user?.role === "student";

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalPatients: number;
    todayAppointments: number;
    monthlyRevenue: number;
    outstandingBalance?: number;
    pendingPayments?: number;
    lowStockItems: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: upcomingAppointments, isLoading: appointmentsLoading } = useQuery<AppointmentWithPatient[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: lowStockItems, isLoading: inventoryLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory/low-stock"],
    enabled: !isStudent,
  });

  const handleAptClick = (apt: AppointmentWithPatient) => {
    setSelectedApt(apt);
    setIsEditDialogOpen(true);
  };

  const filteredAppointments = upcomingAppointments?.filter((apt) => {
    const now = new Date();
    const aptDate = new Date(apt.startTime);
    return apt.status !== "canceled" && apt.status !== "completed" && isAfter(aptDate, startOfDay(now));
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()) || [];

  const groupedAppointments = filteredAppointments.reduce((acc, apt) => {
    const dateKey = format(new Date(apt.startTime), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(apt);
    return acc;
  }, {} as Record<string, AppointmentWithPatient[]>);

  const sortedDates = Object.keys(groupedAppointments).sort();

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEEE, MMM d");
  };

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

  const { resolvedTheme } = useTheme();
  const [timeOfDay, setTimeOfDay] = useState("morning");
  const [displayText, setDisplayText] = useState("morning");
  const [isTyping, setIsTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(false);
  
  useEffect(() => {
    let targetWord: string;
    if (resolvedTheme === "dark") {
      targetWord = "evening";
    } else if (resolvedTheme === "dusk") {
      targetWord = "afternoon";
    } else {
      targetWord = "morning";
    }
    
    if (targetWord !== timeOfDay) {
      setIsTyping(true);
      setShowCursor(true);
      
      // Stop any existing intervals
      const deleteInterval = setInterval(() => {
        setDisplayText(prev => {
          if (prev.length > 0) {
            return prev.slice(0, -1);
          }
          
          // Once cleared, start typing the new word
          clearInterval(deleteInterval);
          let charIndex = 0;
          const typeInterval = setInterval(() => {
            charIndex++;
            if (charIndex <= targetWord.length) {
              setDisplayText(targetWord.slice(0, charIndex));
            } else {
              clearInterval(typeInterval);
              setTimeOfDay(targetWord);
              setIsTyping(false);
              setTimeout(() => setShowCursor(false), 500);
            }
          }, 60);
          return "";
        });
      }, 40);
      
      return () => clearInterval(deleteInterval);
    }
  }, [resolvedTheme, timeOfDay]);

  const renderStatsWidget = () => (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      <MiniStatCard
        title="Total Patients"
        value={statsLoading ? "..." : stats?.totalPatients || 0}
        icon={Users}
        color="primary"
      />
      <MiniStatCard
        title="Today's Appointments"
        value={statsLoading ? "..." : stats?.todayAppointments || 0}
        icon={Calendar}
        color="success"
      />
      {!isStudent && (
        <>
          <MiniStatCard
            title="Monthly Revenue"
            value={statsLoading ? "..." : `$${(stats?.monthlyRevenue || 0).toLocaleString()}`}
            icon={DollarSign}
            color="success"
            trend={{ value: 12, isPositive: true }}
          />
          <MiniStatCard
            title="Outstanding"
            value={statsLoading ? "..." : `$${(stats?.outstandingBalance || stats?.pendingPayments || 0).toLocaleString()}`}
            icon={AlertCircle}
            color="warning"
          />
        </>
      )}
      {isStudent && (
        <MiniStatCard
          title="My Patients"
          value={statsLoading ? "..." : stats?.totalPatients || 0}
          icon={Users}
          color="success"
        />
      )}
    </div>
  );

  const renderAppointmentsWidget = () => (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3 shrink-0">
        <div>
          <CardTitle className="text-base font-semibold">Upcoming Appointments</CardTitle>
          <CardDescription className="text-xs">
            {filteredAppointments.length} scheduled
          </CardDescription>
        </div>
        <Link href="/appointments">
          <Button variant="ghost" size="sm" data-testid="button-view-appointments">
            View All
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden pt-0">
        <ScrollArea className="h-[400px] lg:h-[500px] pr-3 -mr-3">
          {appointmentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-2 mb-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No upcoming appointments</p>
              <Link href="/appointments?action=new">
                <Button variant="ghost" size="sm" className="mt-2" data-testid="button-schedule-appointment">
                  Schedule Now
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedDates.map((dateStr) => (
                <div key={dateStr} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      {getDateLabel(dateStr)}
                    </span>
                    <Separator className="flex-1" />
                  </div>
                  <div className="space-y-2">
                    {groupedAppointments[dateStr].map((apt) => (
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
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );

  const renderQuickActionsWidget = () => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="grid grid-cols-3 gap-1">
          <QuickActionButton
            icon={Plus}
            label="New Patient"
            href="/patients?action=new"
            testId="button-quick-add-patient"
          />
          <QuickActionButton
            icon={Calendar}
            label="Schedule"
            href="/appointments?action=new"
            testId="button-quick-new-appointment"
          />
          <QuickActionButton
            icon={Settings2}
            label="Settings"
            href="/settings"
            testId="button-quick-settings"
          />
          {!isStudent && (
            <>
              <QuickActionButton
                icon={Receipt}
                label="Invoice"
                href="/financials?action=new-invoice"
                testId="button-quick-create-invoice"
              />
              <QuickActionButton
                icon={Package}
                label="Inventory"
                href="/inventory"
                testId="button-quick-inventory"
              />
              <QuickActionButton
                icon={FlaskConical}
                label="Lab Work"
                href="/lab-work"
                testId="button-quick-lab"
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderLowStockWidget = () => {
    if (isStudent) return null;
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          {inventoryLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : lowStockItems && lowStockItems.length > 0 ? (
            <div className="space-y-1.5">
              {lowStockItems.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-1.5 text-sm"
                >
                  <span className="truncate text-muted-foreground">{item.name}</span>
                  <Badge variant={item.currentQuantity === 0 ? "destructive" : "secondary"} className="shrink-0 ml-2">
                    {item.currentQuantity} left
                  </Badge>
                </div>
              ))}
              {lowStockItems.length > 4 && (
                <Link href="/inventory?filter=low-stock">
                  <Button variant="ghost" size="sm" data-testid="link-more-low-stock">
                    +{lowStockItems.length - 4} more items
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-3">
              All items stocked
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderProductivityWidget = () => {
    return <InspirationalQuotes />;
  };

  const getSlotWidgets = (slot: WidgetSlot) => 
    widgets.filter(w => w.slot === slot && w.enabled).sort((a, b) => a.order - b.order);
  
  const headerWidgets = getSlotWidgets("header");
  const fullWidthWidgets = getSlotWidgets("fullWidth");
  const mainWidgets = getSlotWidgets("main");
  const sidebarWidgets = getSlotWidgets("sidebar").filter(w => !(isStudent && (w.id === "lowStock" || w.id === "productivity")));

  const renderWidgetById = (id: string) => {
    switch (id) {
      case "clock": return <LiveClock />;
      case "stats": return renderStatsWidget();
      case "appointments": return renderAppointmentsWidget();
      case "quickActions": return renderQuickActionsWidget();
      case "lowStock": return renderLowStockWidget();
      case "productivity": return renderProductivityWidget();
      default: return null;
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      <LiveWallpaper />
      <div className="shrink-0 border-b p-3 sm:p-4 backdrop-blur-[var(--elements-blur,2px)] [background-color:hsl(var(--card)/var(--elements-transparency,0.5))]">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl sm:text-4xl font-bold truncate tracking-tight" data-testid="text-greeting">
                    <span>Good </span>
                    <span className="inline-block min-w-[120px] sm:min-w-[160px]">
                      {displayText}
                      <span 
                        className={cn(
                          "inline-block w-[2px] h-[0.9em] ml-0.5 align-middle bg-primary transition-opacity",
                          showCursor ? "animate-pulse" : "opacity-0"
                        )}
                        style={{ animationDuration: '530ms' }}
                      />
                    </span>
                    , <span className="text-primary">{user?.firstName}</span>
                  </h1>
                  <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid="button-customize-dashboard">
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-md">
                      <SheetHeader className="pb-4 border-b">
                        <SheetTitle>Dashboard Layout</SheetTitle>
                        <SheetDescription>
                          Customize your workspace widgets.
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
                <p className="text-sm sm:text-base text-muted-foreground font-medium hidden sm:block">
                  Here's your clinic overview
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex-1 sm:flex-none md:w-80 lg:w-96">
                <GlobalSearch />
              </div>
              <div className="hidden lg:flex items-center gap-3">
                {headerWidgets.map(w => (
                  <div key={w.id}>{renderWidgetById(w.id)}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 sm:p-4">
        <div className="max-w-[1400px] mx-auto space-y-4">
          {fullWidthWidgets.map(w => (
            <div key={w.id}>{renderWidgetById(w.id)}</div>
          ))}

          <EditAppointmentDialog 
            appointment={selectedApt}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
          />

          {(mainWidgets.length > 0 || sidebarWidgets.length > 0) && (
            <div className="grid gap-4 lg:grid-cols-3">
              {mainWidgets.length > 0 && (
                <div className="lg:col-span-2 space-y-4">
                  {mainWidgets.map(w => (
                    <div key={w.id}>{renderWidgetById(w.id)}</div>
                  ))}
                </div>
              )}
              {sidebarWidgets.length > 0 && (
                <div className="space-y-4">
                  {sidebarWidgets.map(w => (
                    <div key={w.id}>{renderWidgetById(w.id)}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
