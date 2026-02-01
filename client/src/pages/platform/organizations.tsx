import { useQuery, useMutation } from "@tanstack/react-query";
import { type Organization, insertOrganizationSchema, insertUserSchema } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Search, LogIn, Plus } from "lucide-react";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const addOrgSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric and hyphens"),
  adminUsername: z.string().min(3, "Username must be at least 3 characters"),
  adminPassword: z.string().min(6, "Password must be at least 6 characters"),
  adminFirstName: z.string().min(1, "First name is required"),
  adminLastName: z.string().min(1, "Last name is required"),
});

type AddOrgFormValues = z.infer<typeof addOrgSchema>;

export default function PlatformOrganizations() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [impersonateOrg, setImpersonateOrg] = useState<Organization | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: organizations, isLoading } = useQuery<Organization[]>({
    queryKey: ["/api/platform/organizations"],
  });

  const form = useForm<AddOrgFormValues>({
    resolver: zodResolver(addOrgSchema),
    defaultValues: {
      name: "",
      slug: "",
      adminUsername: "",
      adminPassword: "",
      adminFirstName: "",
      adminLastName: "",
    },
  });

  const addOrgMutation = useMutation({
    mutationFn: async (data: AddOrgFormValues) => {
      const res = await apiRequest("POST", "/api/platform/organizations", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Organization created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/platform/organizations"] });
      setShowAddDialog(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
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
          <h1 className="text-3xl font-bold tracking-tight text-indigo-900 dark:text-indigo-100">Organizations</h1>
          <p className="text-muted-foreground">Manage all tenants and clinic accounts across the platform.</p>
        </div>
        <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4" />
          Add Organization
        </Button>
      </div>

      <Card className="border-indigo-100 dark:border-indigo-900 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search organizations..." className="pl-8 border-indigo-50/50" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-indigo-50/30 dark:bg-indigo-950/20">
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
                <TableRow 
                  key={org.id}
                  className="cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-950/10 transition-colors"
                  onDoubleClick={() => setLocation(`/platform/organizations/${org.id}`)}
                >
                  <TableCell className="font-medium text-indigo-900 dark:text-indigo-100">{org.name}</TableCell>
                  <TableCell className="font-mono text-xs">{org.slug}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-indigo-200 text-indigo-700 dark:text-indigo-300">{org.subscriptionStatus}</Badge>
                  </TableCell>
                  <TableCell>{org.currentPatientCount}</TableCell>
                  <TableCell>
                    <Badge className={org.isActive ? "bg-green-500/10 text-green-500 hover:bg-green-500/20 border-0" : "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-0"}>
                      {org.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{org.createdAt ? new Date(org.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImpersonateOrg(org);
                      }}
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
        <DialogContent className="max-w-md border-indigo-100 dark:border-indigo-900">
          <DialogHeader>
            <DialogTitle className="text-indigo-900 dark:text-indigo-100">Login As ({impersonateOrg?.name})</DialogTitle>
            <DialogDescription>
              Select the role you want to impersonate within this organization.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 py-4">
            {roles.map((role) => (
              <Button
                key={role.value}
                variant="outline"
                className="justify-start gap-2 h-auto py-3 border-indigo-100 hover:bg-indigo-50 dark:border-indigo-900 dark:hover:bg-indigo-950"
                onClick={() => impersonateMutation.mutate({ 
                  organizationId: impersonateOrg?.id || "", 
                  role: role.value 
                })}
                disabled={impersonateMutation.isPending}
              >
                <Badge variant="secondary" className="font-mono text-[10px] uppercase bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                  {role.value.replace('_', ' ')}
                </Badge>
                <span className="text-xs">{role.label}</span>
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setImpersonateOrg(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-xl border-indigo-100 dark:border-indigo-900">
          <DialogHeader>
            <DialogTitle className="text-indigo-900 dark:text-indigo-100">Add New Organization</DialogTitle>
            <DialogDescription>
              Create a new clinic organization and its first administrator.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => addOrgMutation.mutate(data))} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Organization Details</h3>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl><Input placeholder="Smiles Dental" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Slug</FormLabel>
                        <FormControl><Input placeholder="smiles-dental" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Admin User</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="adminFirstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl><Input placeholder="John" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="adminLastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl><Input placeholder="Doe" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="adminUsername"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl><Input placeholder="admin_smiles" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="adminPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl><Input type="password" placeholder="******" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" type="button" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={addOrgMutation.isPending}>
                  {addOrgMutation.isPending ? "Creating..." : "Create Organization"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
