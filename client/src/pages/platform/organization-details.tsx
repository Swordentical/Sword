import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Building2, 
  Users, 
  Database, 
  Activity, 
  Shield, 
  CreditCard,
  UserPlus,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Organization, User } from "@shared/schema";
import { useState } from "react";

export default function OrganizationDetails() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const { data: org, isLoading: orgLoading } = useQuery<Organization>({
    queryKey: [`/api/platform/organizations/${id}`],
  });

  const { data: orgUsers, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: [`/api/platform/organizations/${id}/users`],
  });

  const updateOrgMutation = useMutation({
    mutationFn: async (updates: Partial<Organization>) => {
      const res = await apiRequest("PATCH", `/api/platform/organizations/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/platform/organizations/${id}`] });
      toast({ title: "Organization updated successfully" });
      setIsEditing(false);
    },
  });

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold">Organization not found</h2>
        <Button variant="link" onClick={() => setLocation("/platform/organizations")}>
          Back to list
        </Button>
      </div>
    );
  }

  const storageLimit = 100 * 1024 * 1024; // 100MB default
  const storageUsed = 0; // Placeholder for actual data size used
  const storagePercentage = (storageUsed / storageLimit) * 100;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/platform/organizations")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{org.name}</h1>
            <Badge className={org.isActive ? "bg-green-500/10 text-green-500 border-0" : "bg-red-500/10 text-red-500 border-0"}>
              {org.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-muted-foreground">Manage organization settings, subscriptions, and users.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => updateOrgMutation.mutate({ isActive: !org.isActive })}>
            {org.isActive ? "Deactivate" : "Activate"}
          </Button>
          <Button variant="default" className="bg-indigo-600 hover:bg-indigo-700">Action</Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" /> Users
          </TabsTrigger>
          <TabsTrigger value="subscription" className="gap-2">
            <CreditCard className="h-4 w-4" /> Subscription
          </TabsTrigger>
          <TabsTrigger value="storage" className="gap-2">
            <Database className="h-4 w-4" /> Storage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{org.currentPatientCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{org.subscriptionStatus}</div>
              </CardContent>
            </Card>
            <Card>
            <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Created At</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{org.createdAt ? new Date(org.createdAt).toLocaleDateString() : 'N/A'}</div>
          </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Organization Name</label>
                  <Input defaultValue={org.name} readOnly={!isEditing} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">URL Slug</label>
                  <Input defaultValue={org.slug} readOnly={!isEditing} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Enrolled Users</CardTitle>
                <CardDescription>Manage user accounts for this organization.</CardDescription>
              </div>
              <Button size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" /> Add User
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : orgUsers?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">{user.firstName} {user.lastName}</div>
                        <div className="text-xs text-muted-foreground">@{user.username}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-500/10 text-green-500 border-0">Active</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Storage Usage</CardTitle>
              <CardDescription>Monitor and limit data storage for this tenant.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Used Storage</span>
                  <span>{storageUsed} MB / 100 MB</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 transition-all" 
                    style={{ width: `${storagePercentage}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Storage Limit (MB)</label>
                  <div className="flex gap-2">
                    <Input type="number" defaultValue={100} />
                    <Button variant="outline">Update Limit</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan</CardTitle>
              <CardDescription>Manage the billing status and feature access.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Current Plan</label>
              <Select value={org.subscriptionStatus || "trial"} onValueChange={(val) => updateOrgMutation.mutate({ subscriptionStatus: val as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="clinic">Clinic</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
