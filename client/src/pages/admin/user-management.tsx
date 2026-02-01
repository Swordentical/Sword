import { useQuery, useMutation } from "@tanstack/react-query";
import { User, UserRole } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  UserPlus, 
  ShieldCheck, 
  UserCog, 
  Loader2,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { useState } from "react";

export default function UserManagement() {
  const { toast } = useToast();
  const [selectedRoles, setSelectedRoles] = useState<Record<string, UserRole>>({});

  const { data: pendingUsers, isLoading: isLoadingPending } = useQuery<User[]>({
    queryKey: ["/api/users/pending"],
  });

  const { data: activeUsers, isLoading: isLoadingActive } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const approveMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const res = await apiRequest("POST", `/api/users/${userId}/approve`, { role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
      toast({
        title: "User Approved",
        description: "The user has been successfully approved and assigned a role.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRoleChange = (userId: string, role: UserRole) => {
    setSelectedRoles((prev) => ({ ...prev, [userId]: role }));
  };

  const roles: UserRole[] = ["admin", "doctor", "staff", "student"];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground mt-2">
          Review and approve pending user registrations and manage roles.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Pending Approvals
              </CardTitle>
              <CardDescription>
                New users waiting for role assignment and system access.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="h-6">
              {pendingUsers?.length || 0} Pending
            </Badge>
          </CardHeader>
          <CardContent>
            {isLoadingPending ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !pendingUsers || pendingUsers.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <CheckCircle2 className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Pending Approvals</h3>
                <p className="text-muted-foreground">
                  All users have been processed. New registrations will appear here.
                </p>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Requested On</TableHead>
                      <TableHead>Assign Role</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((user) => (
                      <TableRow key={user.id} className="group">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {user.firstName} {user.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              @{user.username}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {new Date(user.createdAt!).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={selectedRoles[user.id] || ""}
                            onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                          >
                            <SelectTrigger className="w-[140px] h-9">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {role.charAt(0).toUpperCase() + role.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            disabled={!selectedRoles[user.id] || approveMutation.isPending}
                            onClick={() =>
                              approveMutation.mutate({
                                userId: user.id,
                                role: selectedRoles[user.id],
                              })
                            }
                            data-testid={`button-approve-${user.id}`}
                          >
                            {approveMutation.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Approve
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Active Users
            </CardTitle>
            <CardDescription>
              Manage roles and permissions for currently active staff members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingActive ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !activeUsers || activeUsers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No active users found.</p>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.firstName} {user.lastName}</span>
                            <span className="text-xs text-muted-foreground">@{user.username}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {user.role.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">Manage</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
