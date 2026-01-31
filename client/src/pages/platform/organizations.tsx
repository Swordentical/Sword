import { useQuery, useMutation } from "@tanstack/react-query";
import { type Organization } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Search, LogIn } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function PlatformOrganizations() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [impersonateOrg, setImpersonateOrg] = useState<Organization | null>(null);

  const { data: organizations, isLoading } = useQuery<Organization[]>({
    queryKey: ["/api/platform/organizations"],
  });

  const impersonateMutation = useMutation({
    mutationFn: async ({ organizationId, role }: { organizationId: string; role: string }) => {
      const res = await apiRequest("POST", "/api/platform/impersonate", { organizationId, role });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setImpersonateOrg(null);
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Impersonation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="p-6">Loading organizations...</div>;
  }

  const roles = [
    { value: "clinic_admin", label: "Clinic Admin" },
    { value: "admin", label: "Admin" },
    { value: "doctor", label: "Doctor" },
    { value: "staff", label: "Staff" },
    { value: "student", label: "Student" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">Manage all tenants and clinic accounts across the platform.</p>
        </div>
        <Button className="gap-2">
          <Building2 className="h-4 w-4" />
          Add Organization
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search organizations..." className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Org Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Patients</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations?.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>{org.slug}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{org.subscriptionStatus}</Badge>
                  </TableCell>
                  <TableCell>{org.currentPatientCount}</TableCell>
                  <TableCell>
                    <Badge className={org.isActive ? "bg-green-500/10 text-green-500 hover:bg-green-500/20 border-0" : "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-0"}>
                      {org.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{org.createdAt ? new Date(org.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => setImpersonateOrg(org)}
                    >
                      <LogIn className="h-4 w-4" />
                      Login As
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!impersonateOrg} onOpenChange={(open) => !open && setImpersonateOrg(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login As ({impersonateOrg?.name})</DialogTitle>
            <DialogDescription>
              Select the role you want to impersonate within this organization.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 py-4">
            {roles.map((role) => (
              <Button
                key={role.value}
                variant="outline"
                className="justify-start gap-2 h-auto py-3"
                onClick={() => impersonateMutation.mutate({ 
                  organizationId: impersonateOrg?.id || "", 
                  role: role.value 
                })}
                disabled={impersonateMutation.isPending}
              >
                <Badge variant="secondary" className="font-mono text-[10px] uppercase">
                  {role.value.replace('_', ' ')}
                </Badge>
                <span>{role.label}</span>
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setImpersonateOrg(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
