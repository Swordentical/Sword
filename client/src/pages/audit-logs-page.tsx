import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";
import { Loader2, Clock, User, ShieldCheck } from "lucide-react";
import type { User as UserType } from "@shared/schema";

type AuditLogEntry = {
  id: string;
  createdAt: Date | null;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  user?: UserType;
};
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function AuditLogsPage() {
  const { user } = useAuth();
  
  const { data: logs, isLoading: logsLoading } = useQuery<AuditLogEntry[]>({
    queryKey: ["/api/activity/all"],
  });

  if (user?.role !== "admin") {
    return <Redirect to="/" />;
  }

  return (
    <div className="p-8 space-y-8 max-w-[1200px] mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
          <ShieldCheck className="h-10 w-10 text-primary" />
          Audit Logs
        </h1>
        <p className="text-muted-foreground text-lg">
          Monitor and review all system activities and administrative changes.
        </p>
      </div>

      <Card className="border-none shadow-lg bg-gradient-to-br from-card to-muted/20">
        <CardHeader className="pb-4">
          <CardTitle>System Activity</CardTitle>
          <CardDescription>
            A detailed record of all actions performed by users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="rounded-xl border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead className="w-[150px]">User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead className="w-[100px] text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium text-muted-foreground">
                        <div className="flex flex-col">
                          <span>{format(new Date(log.createdAt || new Date()), "MMM d, yyyy")}</span>
                          <span className="text-[10px] uppercase tracking-wider">{format(new Date(log.createdAt || new Date()), "HH:mm:ss")}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-bold text-sm">
                            {log.user ? `${log.user.firstName} ${log.user.lastName}` : "System"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {log.action}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter">
                          Log #{log.id}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-lg font-bold">No logs found</p>
              <p className="text-sm text-muted-foreground">System activities will appear here as they occur.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
