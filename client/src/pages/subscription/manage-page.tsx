import { useMutation } from "@tanstack/react-query";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, CreditCard, Users, UserPlus, Calendar, AlertTriangle, CheckCircle2, Clock, ArrowUpRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

export default function ManageSubscriptionPage() {
  const { user } = useAuth();
  const { subscriptionContext, isLoading } = useSubscription();
  const { toast } = useToast();

  const portalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/stripe/portal", {});
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { organization, plan, limits, status } = subscriptionContext;

  if (!organization || !plan) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-4xl">
        <Card data-testid="card-no-subscription">
          <CardHeader>
            <CardTitle>No Active Subscription</CardTitle>
            <CardDescription>
              You don't have an active subscription yet. Choose a plan to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/pricing">
              <Button data-testid="button-view-plans">
                View Plans
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const patientUsagePercent = limits.patientLimit 
    ? Math.min(100, (limits.currentPatientCount / limits.patientLimit) * 100)
    : 0;
  const userUsagePercent = limits.userLimit
    ? Math.min(100, (limits.currentUserCount / limits.userLimit) * 100)
    : 0;

  const getStatusBadge = () => {
    if (status.isExpired) {
      return (
        <Badge variant="destructive" data-testid="badge-status-expired">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Expired
        </Badge>
      );
    }
    if (status.isTrial) {
      return (
        <Badge variant="secondary" data-testid="badge-status-trial">
          <Clock className="mr-1 h-3 w-3" />
          Trial ({status.daysRemaining} days left)
        </Badge>
      );
    }
    if (status.isActive) {
      return (
        <Badge data-testid="badge-status-active">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Active
        </Badge>
      );
    }
    return <Badge variant="outline">Unknown</Badge>;
  };

  const planTypeLabel = {
    clinic: "Clinic Plan",
    doctor: "Doctor Plan",
    student: "Student Plan",
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Subscription Management</h1>
        <p className="text-muted-foreground">
          Manage your subscription, view usage, and update billing information.
        </p>
      </div>

      <div className="grid gap-6">
        <Card data-testid="card-plan-details">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>{organization.name}</CardDescription>
              </div>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-2xl font-bold" data-testid="text-plan-name">
                  {planTypeLabel[plan.type as keyof typeof planTypeLabel] || plan.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {organization.billingCycle === "annual" ? "Annual billing" : "Monthly billing"}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/pricing">
                  <Button variant="outline" data-testid="button-change-plan">
                    Change Plan
                  </Button>
                </Link>
                <Button
                  onClick={() => portalMutation.mutate()}
                  disabled={portalMutation.isPending}
                  data-testid="button-manage-billing"
                >
                  {portalMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  Manage Billing
                </Button>
              </div>
            </div>

            {status.daysRemaining !== null && (
              <div className="p-4 rounded-lg bg-muted" data-testid="card-subscription-period">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Subscription Period</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {status.isTrial
                    ? `Your trial ends in ${status.daysRemaining} day${status.daysRemaining !== 1 ? "s" : ""}`
                    : `${status.daysRemaining} day${status.daysRemaining !== 1 ? "s" : ""} remaining in current period`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card data-testid="card-patient-usage">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserPlus className="h-5 w-5" />
                Patient Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-bold" data-testid="text-patient-count">
                  {limits.currentPatientCount}
                </span>
                <span className="text-muted-foreground" data-testid="text-patient-limit">
                  {limits.patientLimit !== null 
                    ? `of ${limits.patientLimit} patients`
                    : "Unlimited patients"}
                </span>
              </div>
              {limits.patientLimit !== null && (
                <Progress value={patientUsagePercent} className="h-2" />
              )}
              {limits.patientLimit !== null && patientUsagePercent >= 80 && (
                <p className="text-sm text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {patientUsagePercent >= 100
                    ? "Patient limit reached. Upgrade to add more."
                    : "Approaching patient limit. Consider upgrading."}
                </p>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-user-usage">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                User Accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-bold" data-testid="text-user-count">
                  {limits.currentUserCount}
                </span>
                <span className="text-muted-foreground" data-testid="text-user-limit">
                  {limits.userLimit !== null
                    ? `of ${limits.userLimit} users`
                    : "Unlimited users"}
                </span>
              </div>
              {limits.userLimit !== null && (
                <Progress value={userUsagePercent} className="h-2" />
              )}
              {limits.userLimit !== null && userUsagePercent >= 80 && (
                <p className="text-sm text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {userUsagePercent >= 100
                    ? "User limit reached. Upgrade to add more."
                    : "Approaching user limit. Consider upgrading."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {status.isExpired && (
          <Card className="border-destructive" data-testid="card-expired-warning">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Subscription Expired
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Your subscription has expired. Some features may be unavailable until you renew.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => portalMutation.mutate()}
                  disabled={portalMutation.isPending}
                  data-testid="button-renew-subscription"
                >
                  Renew Subscription
                </Button>
                <Link href="/pricing">
                  <Button variant="outline" data-testid="button-view-plans-expired">
                    View Plans
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
