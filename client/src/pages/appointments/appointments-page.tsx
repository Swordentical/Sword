import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearch, useLocation } from "wouter";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  setHours,
  setMinutes,
} from "date-fns";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Loader2,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AddAppointmentDialog } from "./add-appointment-dialog";
import type { AppointmentWithPatient } from "@shared/schema";

type ViewMode = "month" | "day";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-emerald-500",
  pending: "bg-amber-500",
  canceled: "bg-destructive",
  completed: "bg-primary",
};

const HOURS = Array.from({ length: 12 }, (_, i) => i + 12);

function MonthView({
  currentDate,
  appointments,
  onDayClick,
}: {
  currentDate: Date;
  appointments: AppointmentWithPatient[];
  onDayClick: (date: Date) => void;
}) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getAppointmentsForDay = (day: Date) =>
    appointments.filter((apt) => isSameDay(new Date(apt.startTime), day));

  return (
    <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
        <div
          key={day}
          className="bg-muted p-3 text-center text-xs font-medium text-muted-foreground"
        >
          {day}
        </div>
      ))}
      {days.map((day, idx) => {
        const dayAppointments = getAppointmentsForDay(day);
        const isCurrentMonth = isSameMonth(day, currentDate);
        const isCurrentDay = isToday(day);

        return (
          <div
            key={idx}
            onClick={() => onDayClick(day)}
            className={cn(
              "bg-card min-h-[100px] p-2 cursor-pointer hover-elevate transition-colors",
              !isCurrentMonth && "bg-muted/50"
            )}
          >
            <div
              className={cn(
                "text-sm font-medium mb-1",
                !isCurrentMonth && "text-muted-foreground",
                isCurrentDay && "text-primary"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full",
                  isCurrentDay && "bg-primary text-primary-foreground"
                )}
              >
                {format(day, "d")}
              </span>
            </div>
            <div className="space-y-1">
              {dayAppointments.slice(0, 3).map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center gap-1"
                  data-testid={`appointment-dot-${apt.id}`}
                >
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      STATUS_COLORS[apt.status || "pending"]
                    )}
                  />
                  <span className="text-xs truncate">
                    {format(new Date(apt.startTime), "HH:mm")}
                  </span>
                </div>
              ))}
              {dayAppointments.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{dayAppointments.length - 3} more
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayView({
  selectedDate,
  appointments,
}: {
  selectedDate: Date;
  appointments: AppointmentWithPatient[];
}) {
  const dayAppointments = appointments.filter((apt) =>
    isSameDay(new Date(apt.startTime), selectedDate)
  );

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-[80px_1fr] gap-2">
        {HOURS.map((hour) => {
          const hourStart = setMinutes(setHours(selectedDate, hour), 0);
          const hourAppointments = dayAppointments.filter((apt) => {
            const aptHour = new Date(apt.startTime).getHours();
            return aptHour === hour;
          });

          return (
            <div key={hour} className="contents">
              <div className="text-right pr-3 py-3 text-sm text-muted-foreground">
                {format(hourStart, "h a")}
              </div>
              <div className="border-t py-2 min-h-[60px]">
                {hourAppointments.map((apt) => {
                  const initials = `${apt.patient.firstName.charAt(0)}${apt.patient.lastName.charAt(0)}`;
                  return (
                    <div
                      key={apt.id}
                      className="flex items-center gap-3 p-2 mb-1 rounded-lg border bg-card hover-elevate"
                      data-testid={`appointment-${apt.id}`}
                    >
                      <div
                        className={cn(
                          "w-1 h-10 rounded-full",
                          STATUS_COLORS[apt.status || "pending"]
                        )}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {apt.patient.firstName} {apt.patient.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {apt.title} • {format(new Date(apt.startTime), "h:mm a")}
                        </p>
                      </div>
                      <Badge
                        variant={
                          apt.status === "confirmed"
                            ? "default"
                            : apt.status === "canceled"
                            ? "destructive"
                            : "secondary"
                        }
                        className="shrink-0"
                      >
                        {apt.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AppointmentStats({ appointments }: { appointments: AppointmentWithPatient[] }) {
  const today = new Date();
  const todayCount = appointments.filter((apt) =>
    isSameDay(new Date(apt.startTime), today)
  ).length;
  const confirmedCount = appointments.filter((apt) => apt.status === "confirmed").length;
  const pendingCount = appointments.filter((apt) => apt.status === "pending").length;

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{todayCount}</p>
          <p className="text-xs text-muted-foreground">Today</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{confirmedCount}</p>
          <p className="text-xs text-muted-foreground">Confirmed</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AppointmentsPage() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  const showNewDialog = urlParams.get("action") === "new";

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(showNewDialog);

  const { data: appointments = [], isLoading } = useQuery<AppointmentWithPatient[]>({
    queryKey: [
      "/api/appointments",
      {
        start: startOfMonth(currentDate).toISOString(),
        end: endOfMonth(currentDate).toISOString(),
        status: statusFilter !== "all" ? statusFilter : undefined,
      },
    ],
  });

  const filteredAppointments =
    statusFilter === "all"
      ? appointments
      : appointments.filter((apt) => apt.status === statusFilter);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setViewMode("day");
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    if (showNewDialog) {
      setLocation("/appointments");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground">
            Manage your clinic's appointment schedule
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-new-appointment">
          <Plus className="h-4 w-4 mr-2" />
          New Appointment
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setCurrentDate((prev) =>
                        viewMode === "month" ? subMonths(prev, 1) : subMonths(prev, 0)
                      )
                    }
                    data-testid="button-prev-month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-lg font-semibold min-w-[140px] text-center">
                    {viewMode === "month"
                      ? format(currentDate, "MMMM yyyy")
                      : format(selectedDate, "EEEE, MMM d, yyyy")}
                  </h2>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setCurrentDate((prev) =>
                        viewMode === "month" ? addMonths(prev, 1) : addMonths(prev, 0)
                      )
                    }
                    data-testid="button-next-month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex border rounded-lg overflow-hidden">
                    <Button
                      variant={viewMode === "month" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("month")}
                      className="rounded-none"
                      data-testid="button-month-view"
                    >
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Month
                    </Button>
                    <Button
                      variant={viewMode === "day" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("day")}
                      className="rounded-none"
                      data-testid="button-day-view"
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      Day
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : viewMode === "month" ? (
                <MonthView
                  currentDate={currentDate}
                  appointments={filteredAppointments}
                  onDayClick={handleDayClick}
                />
              ) : (
                <ScrollArea className="h-[600px]">
                  <DayView
                    selectedDate={selectedDate}
                    appointments={filteredAppointments}
                  />
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <AppointmentStats appointments={appointments} />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Upcoming Today</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {appointments
                  .filter(
                    (apt) =>
                      isSameDay(new Date(apt.startTime), new Date()) &&
                      apt.status !== "canceled" &&
                      apt.status !== "completed"
                  )
                  .sort(
                    (a, b) =>
                      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
                  )
                  .map((apt) => {
                    const initials = `${apt.patient.firstName.charAt(0)}${apt.patient.lastName.charAt(0)}`;
                    return (
                      <div
                        key={apt.id}
                        className="flex items-center gap-3 py-2 border-b last:border-0"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {apt.patient.firstName} {apt.patient.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(apt.startTime), "h:mm a")}
                          </p>
                        </div>
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            STATUS_COLORS[apt.status || "pending"]
                          )}
                        />
                      </div>
                    );
                  })}
                {appointments.filter(
                  (apt) =>
                    isSameDay(new Date(apt.startTime), new Date()) &&
                    apt.status !== "canceled" &&
                    apt.status !== "completed"
                ).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No upcoming appointments today
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      <AddAppointmentDialog open={dialogOpen} onOpenChange={handleCloseDialog} />
    </div>
  );
}
