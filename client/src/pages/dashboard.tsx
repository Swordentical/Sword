import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AppointmentWithPatient, Patient, InventoryItem, ActivityLog } from "@shared/schema";

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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`rounded-lg p-2 ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp
              className={`h-3 w-3 ${trend.isPositive ? "text-emerald-500" : "text-destructive rotate-180"}`}
            />
            <span
              className={`text-xs font-medium ${trend.isPositive ? "text-emerald-500" : "text-destructive"}`}
            >
              {trend.isPositive ? "+" : "-"}{trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AppointmentStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    confirmed: { variant: "default", label: "Confirmed" },
    pending: { variant: "secondary", label: "Pending" },
    canceled: { variant: "destructive", label: "Canceled" },
    completed: { variant: "outline", label: "Completed" },
  };

  const { variant, label } = variants[status] || variants.pending;
  return <Badge variant={variant}>{label}</Badge>;
}

function TodayAppointmentCard({ appointment }: { appointment: AppointmentWithPatient }) {
  const startTime = new Date(appointment.startTime);
  const initials = `${appointment.patient.firstName.charAt(0)}${appointment.patient.lastName.charAt(0)}`;

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg border bg-card hover-elevate">
      <div className="text-center">
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
        <div className="text-sm text-muted-foreground truncate">
          {appointment.title}
        </div>
      </div>
      <AppointmentStatusBadge status={appointment.status || "pending"} />
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

export default function Dashboard() {
  const { user } = useAuth();
  const isStudent = user?.role === "student";

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
    queryKey: ["/api/appointments/today"],
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity/recent"],
  });

  const { data: lowStockItems, isLoading: inventoryLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory/low-stock"],
    enabled: !isStudent,
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">
          {greeting()}, {user?.firstName}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening at your clinic today.
        </p>
      </div>

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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
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
              {appointmentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : todayAppointments && todayAppointments.length > 0 ? (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {todayAppointments.map((appointment) => (
                      <TodayAppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                      />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mb-3 opacity-50" />
                  <p>No appointments scheduled for today</p>
                  <Link href="/appointments">
                    <Button variant="link" className="mt-2" data-testid="button-schedule-appointment">
                      Schedule an appointment
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

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
        </div>

        <div className="space-y-6">
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

          {!isStudent && (
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
                        <Button variant="link" size="sm" className="p-0">
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
          )}
        </div>
      </div>
    </div>
  );
}
