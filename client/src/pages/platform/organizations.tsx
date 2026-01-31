import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Search, LogIn } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function PlatformOrganizations() {
  const organizations = [
    { id: "1", name: "DentalCare Clinic", type: "Clinic", plan: "Professional", users: 12, status: "Active", lastActive: "2 hours ago" },
    { id: "2", name: "Smile Bright", type: "Clinic", plan: "Basic", users: 5, status: "Active", lastActive: "1 day ago" },
    { id: "3", name: "Modern Lab", type: "Lab", plan: "Enterprise", users: 25, status: "Active", lastActive: "Just now" },
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
                <TableHead>Type</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>{org.type}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{org.plan}</Badge>
                  </TableCell>
                  <TableCell>{org.users}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-0">
                      {org.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{org.lastActive}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="gap-2">
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
    </div>
  );
}
