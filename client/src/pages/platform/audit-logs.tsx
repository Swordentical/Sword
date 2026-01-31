import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, User, Globe, Info } from "lucide-react";

export default function PlatformAuditLogs() {
  const logs = [
    { id: "1", timestamp: "2024-01-31 10:24:05", org: "DentalCare Clinic", user: "admin_user", action: "Deleted Patient", ip: "192.168.1.1", severity: "High" },
    { id: "2", timestamp: "2024-01-31 09:15:22", org: "Smile Bright", user: "doctor_smith", action: "Changed Price", ip: "172.16.0.42", severity: "Medium" },
    { id: "3", timestamp: "2024-01-31 08:45:10", org: "Modern Lab", user: "lab_tech", action: "Logged In", ip: "10.0.0.15", severity: "Low" },
    { id: "4", timestamp: "2024-01-30 22:12:00", org: "DentalCare Clinic", user: "staff_jane", action: "Uploaded X-ray", ip: "192.168.1.5", severity: "Low" },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "medium": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default: return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">System-wide event tracking and security monitoring.</p>
        </div>
        <Badge variant="outline" className="gap-1 px-3 py-1">
          <Shield className="h-3.5 w-3.5" />
          God View Active
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-500" />
            Recent System Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Severity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm font-mono text-muted-foreground">{log.timestamp}</TableCell>
                  <TableCell className="font-medium">{log.org}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      {log.user}
                    </div>
                  </TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-3.5 w-3.5" />
                      {log.ip}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getSeverityColor(log.severity)}>
                      {log.severity}
                    </Badge>
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
