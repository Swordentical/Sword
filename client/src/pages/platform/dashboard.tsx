import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, 
  Users, 
  CreditCard, 
  TrendingUp, 
  PlusCircle, 
  Ban, 
  Key, 
  Send 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PlatformDashboard() {
  const { data: metrics, isLoading } = useQuery<{
    totalOrganizations: number;
    activeSubscriptions: number;
    totalRevenue: number;
    avgChurnRate: number;
  }>({
    queryKey: ["/api/platform/metrics"],
  });

  const stats = [
    { title: "Total Organizations", value: metrics?.totalOrganizations?.toString() || "0", icon: Building2, trend: "+12% this month" },
    { title: "Active Users", value: "1,240", icon: Users, trend: "+5% this month" }, // Keeping mock for now or could add to metrics
    { title: "Total MRR", value: `$${metrics?.totalRevenue?.toLocaleString() || "0"}`, icon: TrendingUp, trend: "+8% this month" },
    { title: "Active Subs", value: metrics?.activeSubscriptions?.toString() || "0", icon: CreditCard, trend: "+3% this month" },
  ];

  if (isLoading) {
    return <div className="p-6">Loading dashboard metrics...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Platform Control Tower</h1>
        <p className="text-muted-foreground">Mission control for Glazer system operations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>API Status</span>
                <span className="text-green-500 font-medium">Healthy</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Database Connectivity</span>
                <span className="text-green-500 font-medium">Optimal</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Storage Usage</span>
                <span className="text-yellow-500 font-medium">65% Capacity</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="justify-start gap-2 h-auto py-3">
              <PlusCircle className="h-4 w-4" />
              <span>New Org</span>
            </Button>
            <Button variant="outline" className="justify-start gap-2 h-auto py-3 text-destructive">
              <Ban className="h-4 w-4" />
              <span>Suspend Org</span>
            </Button>
            <Button variant="outline" className="justify-start gap-2 h-auto py-3">
              <Key className="h-4 w-4" />
              <span>Reset Pass</span>
            </Button>
            <Button variant="outline" className="justify-start gap-2 h-auto py-3">
              <Send className="h-4 w-4" />
              <span>Broadcast</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
