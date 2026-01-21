import { useState } from "react";
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";
import { 
  Loader2, 
  ShieldCheck, 
  ChevronDown, 
  ChevronRight, 
  User, 
  FileText, 
  Download, 
  Printer,
  Filter,
  X,
  AlertCircle
} from "lucide-react";
import type { User as UserType, AuditLog } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

type AuditLogEntry = AuditLog & { user?: UserType };

type UserOption = { id: string; firstName: string; lastName: string; role: string };

const ACTION_TYPES = ["CREATE", "UPDATE", "DELETE"] as const;
const ENTITY_TYPES = [
  "invoice", "payment", "patient", "appointment", "inventory", "lab_case",
  "expense", "payment_plan", "invoice_adjustment", "user", "treatment"
] as const;

function JsonDiff({ previous, current, actionType }: { 
  previous: unknown; 
  current: unknown; 
  actionType: string;
}) {
  if (actionType === "CREATE") {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-green-600 dark:text-green-400">New Value:</p>
        <pre className="text-xs bg-green-50 dark:bg-green-950/30 p-3 rounded-lg overflow-auto max-h-60 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800">
          {JSON.stringify(current, null, 2)}
        </pre>
      </div>
    );
  }
  
  if (actionType === "DELETE") {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-red-600 dark:text-red-400">Deleted Value:</p>
        <pre className="text-xs bg-red-50 dark:bg-red-950/30 p-3 rounded-lg overflow-auto max-h-60 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800">
          {JSON.stringify(previous, null, 2)}
        </pre>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-red-600 dark:text-red-400">Previous Value:</p>
        <pre className="text-xs bg-red-50 dark:bg-red-950/30 p-3 rounded-lg overflow-auto max-h-60 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800">
          {JSON.stringify(previous, null, 2)}
        </pre>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-green-600 dark:text-green-400">New Value:</p>
        <pre className="text-xs bg-green-50 dark:bg-green-950/30 p-3 rounded-lg overflow-auto max-h-60 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800">
          {JSON.stringify(current, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // Filters
  const [userFilter, setUserFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [entityFilter, setEntityFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  // Build query params
  const queryParams = new URLSearchParams();
  if (userFilter) queryParams.set("userId", userFilter);
  if (actionFilter) queryParams.set("actionType", actionFilter);
  if (entityFilter) queryParams.set("entityType", entityFilter);
  if (startDate) queryParams.set("startDate", startDate);
  if (endDate) queryParams.set("endDate", endDate);
  
  const queryString = queryParams.toString();
  const apiUrl = queryString ? `/api/audit-logs?${queryString}` : "/api/audit-logs";
  
  const { data: logs, isLoading: logsLoading } = useQuery<AuditLogEntry[]>({
    queryKey: ["/api/audit-logs", userFilter, actionFilter, entityFilter, startDate, endDate],
    queryFn: async () => {
      const res = await fetch(apiUrl, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      return res.json();
    },
  });
  
  const { data: userOptions } = useQuery<UserOption[]>({
    queryKey: ["/api/audit-logs/users"],
  });

  if (user?.role !== "admin") {
    return <Redirect to="/" />;
  }

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const clearFilters = () => {
    setUserFilter("");
    setActionFilter("");
    setEntityFilter("");
    setStartDate("");
    setEndDate("");
  };

  const hasFilters = userFilter || actionFilter || entityFilter || startDate || endDate;

  const getActionBadgeVariant = (actionType: string) => {
    switch (actionType) {
      case "CREATE": return "default";
      case "UPDATE": return "secondary";
      case "DELETE": return "destructive";
      default: return "outline";
    }
  };

  const exportToCsv = () => {
    if (!logs || logs.length === 0) return;
    
    const headers = ["Timestamp", "User", "Role", "Action", "Entity Type", "Entity ID", "Description"];
    const rows = logs.map(log => [
      log.timestamp ? format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss") : "",
      log.user ? `${log.user.firstName} ${log.user.lastName}` : log.userId,
      log.userRole,
      log.actionType,
      log.entityType,
      log.entityId,
      log.description
    ]);
    
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground">
            Immutable, tamper-proof record of all system activities. These logs cannot be modified or deleted.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToCsv} disabled={!logs?.length} data-testid="button-export-csv">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} data-testid="button-print">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-lg">Filters</CardTitle>
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">User</label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger data-testid="select-user-filter">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {userOptions?.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Action Type</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger data-testid="select-action-filter">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {ACTION_TYPES.map(a => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Entity Type</label>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger data-testid="select-entity-filter">
                  <SelectValue placeholder="All Entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {ENTITY_TYPES.map(e => (
                    <SelectItem key={e} value={e}>{e.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-start-date"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-end-date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm print:shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Activity Records
            {logs && <Badge variant="secondary" className="ml-2">{logs.length} entries</Badge>}
          </CardTitle>
          <CardDescription>
            Click on a row to expand and view the full change details (JSON diff).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : logs && logs.length > 0 ? (
            <ScrollArea className="h-[600px]">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="w-[160px]">Timestamp</TableHead>
                      <TableHead className="w-[150px]">User</TableHead>
                      <TableHead className="w-[80px]">Role</TableHead>
                      <TableHead className="w-[100px]">Action</TableHead>
                      <TableHead className="w-[120px]">Entity</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <Collapsible key={log.id} open={expandedRows.has(log.id)}>
                        <CollapsibleTrigger asChild>
                          <TableRow 
                            className="cursor-pointer hover:bg-muted/30 transition-colors"
                            onClick={() => toggleRow(log.id)}
                            data-testid={`row-audit-${log.id}`}
                          >
                            <TableCell className="w-10">
                              {expandedRows.has(log.id) ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {log.timestamp ? format(new Date(log.timestamp), "MMM d, yyyy HH:mm:ss") : "N/A"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-3 w-3 text-primary" />
                                </div>
                                <span className="text-sm font-medium truncate max-w-[100px]">
                                  {log.user ? `${log.user.firstName} ${log.user.lastName}` : "Unknown"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] uppercase">
                                {log.userRole}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getActionBadgeVariant(log.actionType)}>
                                {log.actionType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm capitalize">{log.entityType.replace(/_/g, " ")}</span>
                            </TableCell>
                            <TableCell className="max-w-[300px]">
                              <span className="text-sm truncate block">{log.description}</span>
                            </TableCell>
                          </TableRow>
                        </CollapsibleTrigger>
                        <CollapsibleContent asChild>
                          <tr>
                            <td colSpan={7} className="p-0">
                              <div className="bg-muted/20 p-4 border-t">
                                <div className="space-y-4">
                                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                    <span><strong>Log ID:</strong> {log.id}</span>
                                    <span><strong>Entity ID:</strong> {log.entityId}</span>
                                    {log.ipAddress && <span><strong>IP:</strong> {log.ipAddress}</span>}
                                  </div>
                                  <JsonDiff 
                                    previous={log.previousValue} 
                                    current={log.newValue} 
                                    actionType={log.actionType}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-lg font-bold">No audit logs found</p>
              <p className="text-sm text-muted-foreground">
                {hasFilters ? "Try adjusting your filters." : "System activities will be logged here automatically."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
