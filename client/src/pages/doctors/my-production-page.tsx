import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths, startOfMonth, endOfMonth, startOfYear } from "date-fns";
import {
  DollarSign,
  Users,
  Stethoscope,
  TrendingUp,
  Calendar,
  Printer,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuth } from "@/hooks/use-auth";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

type DateRange = {
  startDate: string;
  endDate: string;
};

function getDateRange(period: string): DateRange {
  const today = new Date();
  switch (period) {
    case "thisMonth":
      return {
        startDate: format(startOfMonth(today), "yyyy-MM-dd"),
        endDate: format(endOfMonth(today), "yyyy-MM-dd"),
      };
    case "lastMonth":
      const lastMonth = subMonths(today, 1);
      return {
        startDate: format(startOfMonth(lastMonth), "yyyy-MM-dd"),
        endDate: format(endOfMonth(lastMonth), "yyyy-MM-dd"),
      };
    case "last3Months":
      return {
        startDate: format(startOfMonth(subMonths(today, 2)), "yyyy-MM-dd"),
        endDate: format(endOfMonth(today), "yyyy-MM-dd"),
      };
    case "thisYear":
      return {
        startDate: format(startOfYear(today), "yyyy-MM-dd"),
        endDate: format(endOfMonth(today), "yyyy-MM-dd"),
      };
    case "last12Months":
    default:
      return {
        startDate: format(startOfMonth(subMonths(today, 11)), "yyyy-MM-dd"),
        endDate: format(endOfMonth(today), "yyyy-MM-dd"),
      };
  }
}

export default function MyProductionPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState("thisMonth");
  const dateRange = useMemo(() => getDateRange(period), [period]);
  const queryParams = useMemo(() => ({ startDate: dateRange.startDate, endDate: dateRange.endDate }), [dateRange.startDate, dateRange.endDate]);

  const { data: report, isLoading } = useQuery<{
    doctorId: string;
    doctorName: string;
    totalProduction: number;
    totalCollected: number;
    treatmentCount: number;
    patientCount: number;
    patientDetails: {
      patientId: string;
      patientName: string;
      treatments: { name: string; date: string; price: number; status: string }[];
      totalAmount: number;
      amountPaid: number;
    }[];
    treatmentBreakdown: { treatmentName: string; count: number; revenue: number }[];
    monthlyBreakdown: { month: string; production: number; treatments: number; patients: number }[];
  }>({
    queryKey: ["/api/my-production", queryParams],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 p-4 md:p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-my-production-title">My Production</h1>
            <p className="text-muted-foreground">
              Track your work, patients, and earnings
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="period-select">Period:</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[180px]" id="period-select" data-testid="select-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="last3Months">Last 3 Months</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                  <SelectItem value="last12Months">Last 12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={handlePrint} data-testid="button-print-my-production">
              <Printer className="h-4 w-4 mr-2" />
              Print Report
            </Button>
          </div>
        </div>

        {/* Printable Header */}
        <div className="hidden print:block mb-8">
          <h1 className="text-2xl font-bold text-center">Production Report</h1>
          <p className="text-center text-muted-foreground">
            Dr. {user?.firstName} {user?.lastName} | {dateRange.startDate} to {dateRange.endDate}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p>Loading your production data...</p>
          </div>
        ) : report ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Total Production
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid="text-total-production">
                    {formatCurrency(report.totalProduction)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Collected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-total-collected">
                    {formatCurrency(report.totalCollected)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Patients Treated
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold" data-testid="text-patient-count">
                    {report.patientCount}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Treatments Done
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold" data-testid="text-treatment-count">
                    {report.treatmentCount}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Performance Chart */}
            {report.monthlyBreakdown.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Monthly Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={report.monthlyBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" tickFormatter={(v) => `$${v}`} />
                        <Tooltip 
                          formatter={(value: number, name: string) => 
                            name === 'production' ? formatCurrency(value) : value
                          }
                        />
                        <Legend />
                        <Bar dataKey="production" name="Production" fill="hsl(var(--primary))" />
                        <Bar dataKey="treatments" name="Treatments" fill="#22c55e" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Treatment Breakdown */}
              {report.treatmentBreakdown.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Treatment Breakdown
                    </CardTitle>
                    <CardDescription>Revenue by treatment type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Treatment</TableHead>
                            <TableHead className="text-right">Count</TableHead>
                            <TableHead className="text-right">Revenue</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.treatmentBreakdown.map((t, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{t.treatmentName}</TableCell>
                              <TableCell className="text-right">{t.count}</TableCell>
                              <TableCell className="text-right font-bold">{formatCurrency(t.revenue)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      <div className="h-[200px] print:hidden">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={report.treatmentBreakdown.map(t => ({ name: t.treatmentName, value: t.revenue }))}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              dataKey="value"
                            >
                              {report.treatmentBreakdown.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Patient Summary */}
              {report.patientDetails.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Patient Summary
                    </CardTitle>
                    <CardDescription>Patients treated during this period</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Patient</TableHead>
                          <TableHead className="text-right">Treatments</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.patientDetails.slice(0, 10).map((p) => (
                          <TableRow key={p.patientId}>
                            <TableCell className="font-medium">{p.patientName}</TableCell>
                            <TableCell className="text-right">{p.treatments.length}</TableCell>
                            <TableCell className="text-right font-bold">{formatCurrency(p.totalAmount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {report.patientDetails.length > 10 && (
                      <p className="text-sm text-muted-foreground text-center mt-4">
                        + {report.patientDetails.length - 10} more patients
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Full Patient Details (for print) */}
            <div className="hidden print:block">
              <Card>
                <CardHeader>
                  <CardTitle>Complete Patient Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead className="text-right">Treatments</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.patientDetails.map((p) => (
                        <TableRow key={p.patientId}>
                          <TableCell className="font-medium">{p.patientName}</TableCell>
                          <TableCell className="text-right">{p.treatments.length}</TableCell>
                          <TableCell className="text-right">{formatCurrency(p.totalAmount)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(p.amountPaid)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(p.totalAmount - p.amountPaid)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No production data for the selected period</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
