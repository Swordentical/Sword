import { useState, useEffect } from "react";
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
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  useDraggable,
  useDroppable,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AddAppointmentDialog } from "./add-appointment-dialog";
import type { AppointmentWithPatient } from "@shared/schema";

type ViewMode = "month" | "day";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-emerald-500",
  pending: "bg-amber-500",
  canceled: "bg-destructive",
  completed: "bg-primary",
};

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8);

function DraggableAppointment({
  appointment,
  isDragging,
  onClick,
}: {
  appointment: AppointmentWithPatient;
  isDragging?: boolean;
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging: isCurrentlyDragging } = useDraggable({
    id: appointment.id,
    data: { appointment },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined;

  const initials = `${appointment.patient.firstName.charAt(0)}${appointment.patient.lastName.charAt(0)}`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 mb-1 rounded-lg border bg-card hover-elevate cursor-grab active:cursor-grabbing touch-none",
        (isCurrentlyDragging || isDragging) && "opacity-50 shadow-lg"
      )}
      data-testid={`appointment-${appointment.id}`}
      {...attributes}
      {...listeners}
      onClick={onClick}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
      <div
        className={cn(
          "w-1 h-10 rounded-full shrink-0",
          STATUS_COLORS[appointment.status || "pending"]
        )}
      />
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {appointment.patient.firstName} {appointment.patient.lastName}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {appointment.title} - {format(new Date(appointment.startTime), "h:mm a")}
        </p>
      </div>
      <Badge
        variant={
          appointment.status === "confirmed"
            ? "default"
            : appointment.status === "canceled"
            ? "destructive"
            : "secondary"
        }
        className="shrink-0"
      >
        {appointment.status}
      </Badge>
    </div>
  );
}

function DroppableTimeSlot({
  hour,
  selectedDate,
  appointments,
  onAppointmentClick,
}: {
  hour: number;
  selectedDate: Date;
  appointments: AppointmentWithPatient[];
  onAppointmentClick: (apt: AppointmentWithPatient) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `hour-${hour}`,
    data: { hour, selectedDate },
  });

  const hourStart = setMinutes(setHours(selectedDate, hour), 0);

  return (
    <div className="contents">
      <div className="text-right pr-3 py-3 text-sm text-muted-foreground">
        {format(hourStart, "h a")}
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "border-t py-2 min-h-[60px] transition-colors rounded-r",
          isOver && "bg-primary/10 border-primary border-2 border-dashed"
        )}
        data-testid={`timeslot-${hour}`}
      >
        {appointments.map((apt) => (
          <DraggableAppointment 
            key={apt.id} 
            appointment={apt} 
            onClick={() => onAppointmentClick(apt)}
          />
        ))}
      </div>
    </div>
  );
}

function StatusDropZone({
  status,
  label,
  color,
}: {
  status: string;
  label: string;
  color: string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `status-${status}`,
    data: { status },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "p-3 rounded-lg border-2 border-dashed transition-all text-center",
        isOver ? "border-primary bg-primary/10 scale-105" : "border-muted-foreground/30"
      )}
      data-testid={`status-drop-${status}`}
    >
      <div className={cn("w-3 h-3 rounded-full mx-auto mb-1", color)} />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

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
      {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
        <div
          key={i}
          className="bg-muted p-1 sm:p-3 text-center text-xs font-medium text-muted-foreground"
        >
          <span className="hidden sm:inline">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i]}</span>
          <span className="sm:hidden">{day}</span>
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
              "bg-card min-h-[60px] sm:min-h-[100px] p-1 sm:p-2 cursor-pointer hover-elevate transition-colors",
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
  activeId,
  onAppointmentClick,
}: {
  selectedDate: Date;
  appointments: AppointmentWithPatient[];
  activeId: string | null;
  onAppointmentClick: (apt: AppointmentWithPatient) => void;
}) {
  const dayAppointments = appointments.filter((apt) =>
    isSameDay(new Date(apt.startTime), selectedDate)
  );

  return (
    <div className="flex flex-col">
      <div className="mb-3 p-2 bg-muted/50 rounded-lg text-center">
        <p className="text-xs text-muted-foreground">Drag appointments to reschedule or click to edit</p>
      </div>
      <div className="grid grid-cols-[60px_1fr] sm:grid-cols-[80px_1fr] gap-2">
        {HOURS.map((hour) => {
          const hourAppointments = dayAppointments.filter((apt) => {
            const aptHour = new Date(apt.startTime).getHours();
            return aptHour === hour;
          });

          return (
            <DroppableTimeSlot
              key={hour}
              hour={hour}
              selectedDate={selectedDate}
              appointments={hourAppointments}
              onAppointmentClick={onAppointmentClick}
            />
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
    <div className="grid grid-cols-3 gap-2">
      <Card>
        <CardContent className="p-2 sm:p-4 text-center">
          <p className="text-lg sm:text-2xl font-bold text-primary">{todayCount}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Today</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-2 sm:p-4 text-center">
          <p className="text-lg sm:text-2xl font-bold text-emerald-600">{confirmedCount}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Confirmed</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-2 sm:p-4 text-center">
          <p className="text-lg sm:text-2xl font-bold text-amber-600">{pendingCount}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Pending</p>
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
  const { toast } = useToast();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(showNewDialog);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentWithPatient | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

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

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, data, actionType }: { id: string; data: { startTime?: string; status?: string }; actionType: "reschedule" | "status" }) => {
      const res = await apiRequest("PATCH", `/api/appointments/${id}`, data);
      return { result: await res.json(), actionType };
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: response.actionType === "reschedule" ? "Appointment rescheduled" : "Status updated",
        description: response.actionType === "reschedule" 
          ? "The appointment time has been updated." 
          : "The appointment status has been changed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
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

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    setActiveId(id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const appointmentId = active.id as string;
    const overId = over.id as string;

    if (overId.startsWith("hour-")) {
      const hour = parseInt(overId.replace("hour-", ""), 10);
      const appointment = appointments.find((a) => a.id === appointmentId);
      if (appointment) {
        const currentTime = new Date(appointment.startTime);
        const newTime = setMinutes(setHours(selectedDate, hour), currentTime.getMinutes());
        
        if (newTime.getTime() !== currentTime.getTime()) {
          updateAppointmentMutation.mutate({
            id: appointmentId,
            data: { startTime: newTime.toISOString() },
            actionType: "reschedule",
          });
        }
      }
    } else if (overId.startsWith("status-")) {
      const newStatus = overId.replace("status-", "");
      const appointment = appointments.find((a) => a.id === appointmentId);
      if (appointment && appointment.status !== newStatus) {
        updateAppointmentMutation.mutate({
          id: appointmentId,
          data: { status: newStatus },
          actionType: "status",
        });
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="p-4 sm:p-6 space-y-6">
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

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3 space-y-4 order-2 lg:order-1">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
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
                    <h2 className="text-sm sm:text-lg font-semibold min-w-[100px] sm:min-w-[140px] text-center">
                      {viewMode === "month"
                        ? format(currentDate, "MMM yyyy")
                        : format(selectedDate, "EEE, MMM d")}
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

                  <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[110px] sm:w-[140px]">
                        <Filter className="h-4 w-4 mr-1 sm:mr-2" />
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
                        className="rounded-none px-2 sm:px-3"
                        data-testid="button-month-view"
                      >
                        <CalendarIcon className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Month</span>
                      </Button>
                      <Button
                        variant={viewMode === "day" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("day")}
                        className="rounded-none px-2 sm:px-3"
                        data-testid="button-day-view"
                      >
                        <Clock className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Day</span>
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
                      activeId={activeId}
                      onAppointmentClick={(apt) => setEditingAppointment(apt)}
                    />
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 order-1 lg:order-2">
            <AppointmentStats appointments={appointments} />

            {viewMode === "day" && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Quick Status Change</CardTitle>
                  <p className="text-xs text-muted-foreground">Drag appointments here</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    <StatusDropZone status="confirmed" label="Confirm" color="bg-emerald-500" />
                    <StatusDropZone status="pending" label="Pending" color="bg-amber-500" />
                    <StatusDropZone status="completed" label="Complete" color="bg-primary" />
                    <StatusDropZone status="canceled" label="Cancel" color="bg-destructive" />
                  </div>
                </CardContent>
              </Card>
            )}

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
                        className="flex items-center gap-3 py-2 border-b last:border-0 cursor-pointer hover:bg-muted/50 rounded-md px-2"
                        onClick={() => setEditingAppointment(apt)}
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

      <EditAppointmentDialog
        appointment={editingAppointment}
        onOpenChange={(open) => !open && setEditingAppointment(null)}
      />
    </div>
    </DndContext>
  );
}

function EditAppointmentDialog({
  appointment,
  onOpenChange,
}: {
  appointment: AppointmentWithPatient | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [newTime, setNewTime] = useState("");
  
  useEffect(() => {
    if (appointment) {
      setNewTime(format(new Date(appointment.startTime), "HH:mm"));
    }
  }, [appointment]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/appointments/${appointment?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({ title: "Appointment updated" });
      onOpenChange(false);
    },
  });

  if (!appointment) return null;

  const handleUpdateStatus = (status: string) => {
    updateMutation.mutate({ status });
  };

  const handleUpdateTime = () => {
    const [hours, minutes] = newTime.split(":").map(Number);
    const startTime = new Date(appointment.startTime);
    startTime.setHours(hours, minutes, 0, 0);
    updateMutation.mutate({ startTime: startTime.toISOString() });
  };

  return (
    <Dialog open={!!appointment} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Appointment</DialogTitle>
          <DialogDescription>
            Manage appointment for {appointment.patient.firstName} {appointment.patient.lastName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Update Time</Label>
            <div className="flex gap-2">
              <Input 
                type="time" 
                value={newTime} 
                onChange={(e) => setNewTime(e.target.value)}
                data-testid="input-edit-time"
              />
              <Button onClick={handleUpdateTime} disabled={updateMutation.isPending}>
                Update Time
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Change Status</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                onClick={() => handleUpdateStatus("confirmed")}
                disabled={updateMutation.isPending}
                data-testid="button-confirm"
              >
                Confirm
              </Button>
              <Button 
                variant="outline"
                className="border-amber-500 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                onClick={() => handleUpdateStatus("pending")}
                disabled={updateMutation.isPending}
                data-testid="button-pending"
              >
                Pending
              </Button>
              <Button 
                variant="outline"
                className="border-primary text-primary hover:bg-primary/5"
                onClick={() => handleUpdateStatus("completed")}
                disabled={updateMutation.isPending}
                data-testid="button-complete"
              >
                Complete
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleUpdateStatus("canceled")}
                disabled={updateMutation.isPending}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
