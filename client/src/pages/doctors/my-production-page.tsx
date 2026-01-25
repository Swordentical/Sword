import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths, startOfMonth, endOfMonth, startOfYear } from "date-fns";
import {
  DollarSign,
  Users,
  Stethoscope,
  TrendingUp,
  Calendar,
  FileText,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExportDropdown } from "@/components/export-dropdown";
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
import { Badge } from "@/components/ui/badge";
import type { DoctorPayment } from "@shared/schema";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

const PAYMENT_TYPES: Record<string, { label: string; color: string }> = {
  salary: { label: "Salary", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  bonus: { label: "Bonus", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  commission: { label: "Commission", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
  deduction: { label: "Deduction", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
  reimbursement: { label: "Reimbursement", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
  other: { label: "Other", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
};

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

  const { data: myPayments } = useQuery<DoctorPayment[]>({
    queryKey: ["/api/my-payments", queryParams],
  });

  const totalPaymentsReceived = useMemo(() => {
    if (!myPayments) return 0;
    return myPayments.reduce((sum, p) => {
      const amount = Number(p.amount);
      if (p.paymentType === "deduction") return sum - amount;
      return sum + amount;
    }, 0);
  }, [myPayments]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleExportHTML = () => {
    if (!report) return;
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Production Report - Dr. ${user?.firstName} ${user?.lastName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; padding: 40px; color: #333; line-height: 1.6; max-width: 900px; margin: 0 auto; background: #fff; }
    
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid; border-image: linear-gradient(90deg, #12a3b0, #2089de, #9b59b6) 1; padding-bottom: 20px; margin-bottom: 30px; }
    .logo-section { }
    .brand-text { font-size: 32px; font-weight: bold; background: linear-gradient(90deg, #12a3b0, #2089de, #9b59b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .brand-subtitle { font-size: 12px; color: #666; margin-top: 4px; }
    .report-title { text-align: right; }
    .report-title h1 { margin: 0; font-size: 24px; color: #333; letter-spacing: 1px; text-transform: uppercase; }
    .report-title p { margin: 5px 0 0; color: #666; font-size: 13px; }
    
    .doctor-info { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 8px; padding: 20px; margin-bottom: 30px; border-left: 4px solid #12a3b0; }
    .doctor-info h2 { font-size: 20px; color: #12a3b0; margin-bottom: 8px; }
    .doctor-info .period { color: #666; font-size: 14px; }
    
    .summary-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-bottom: 30px; }
    .summary-card { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; text-align: center; }
    .summary-card.production { border-left: 4px solid #22c55e; }
    .summary-card.collected { border-left: 4px solid #3b82f6; }
    .summary-card.patients { border-left: 4px solid #f59e0b; }
    .summary-card.treatments { border-left: 4px solid #9b59b6; }
    .summary-label { font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 8px; font-weight: 600; }
    .summary-value { font-size: 28px; font-weight: bold; color: #333; }
    .summary-card.production .summary-value { color: #22c55e; }
    .summary-card.collected .summary-value { color: #3b82f6; }
    
    .section { margin-bottom: 30px; }
    .section-title { font-size: 16px; font-weight: 600; text-transform: uppercase; color: #12a3b0; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #e0e0e0; }
    
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; border-bottom: 2px solid #e0e0e0; padding: 12px 10px; font-size: 11px; color: #666; text-transform: uppercase; background: #f8f9fa; font-weight: 600; }
    td { padding: 12px 10px; border-bottom: 1px solid #eee; font-size: 13px; }
    tr:hover { background: #fafafa; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 600; }
    .currency { color: #22c55e; font-weight: 600; }
    .currency-blue { color: #3b82f6; font-weight: 600; }
    
    .totals-row { background: #f8f9fa; font-weight: bold; }
    .totals-row td { border-top: 2px solid #12a3b0; padding-top: 15px; }
    
    .two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
    
    .footer { margin-top: 50px; border-top: 1px solid #e0e0e0; padding-top: 20px; text-align: center; color: #999; font-size: 11px; }
    .footer p { margin: 3px 0; }
    
    @media print {
      body { padding: 20px; }
      .summary-grid { grid-template-columns: repeat(5, 1fr); }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      <div class="brand-text">GLAZER</div>
      <div class="brand-subtitle">Dental Clinic Management</div>
    </div>
    <div class="report-title">
      <h1>Production Report</h1>
      <p>Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    </div>
  </div>
  
  <div class="doctor-info">
    <h2>Dr. ${user?.firstName} ${user?.lastName}</h2>
    <div class="period">Report Period: ${format(new Date(dateRange.startDate), "MMMM d, yyyy")} - ${format(new Date(dateRange.endDate), "MMMM d, yyyy")}</div>
  </div>
  
  <div class="summary-grid">
    <div class="summary-card production">
      <div class="summary-label">Total Production</div>
      <div class="summary-value">${formatCurrency(report.totalProduction)}</div>
    </div>
    <div class="summary-card collected">
      <div class="summary-label">Total Collected</div>
      <div class="summary-value">${formatCurrency(report.totalCollected)}</div>
    </div>
    <div class="summary-card patients">
      <div class="summary-label">Patients Treated</div>
      <div class="summary-value">${report.patientCount}</div>
    </div>
    <div class="summary-card treatments">
      <div class="summary-label">Treatments Done</div>
      <div class="summary-value">${report.treatmentCount}</div>
    </div>
    <div class="summary-card" style="border-left: 4px solid #9333ea;">
      <div class="summary-label">Payments Received</div>
      <div class="summary-value" style="color: #9333ea;">${formatCurrency(totalPaymentsReceived)}</div>
    </div>
  </div>
  
  ${report.treatmentBreakdown.length > 0 ? `
  <div class="section">
    <div class="section-title">Treatment Breakdown</div>
    <table>
      <thead>
        <tr>
          <th>Treatment</th>
          <th class="text-right">Count</th>
          <th class="text-right">Revenue</th>
        </tr>
      </thead>
      <tbody>
        ${report.treatmentBreakdown.map(t => `
        <tr>
          <td>${t.treatmentName}</td>
          <td class="text-right">${t.count}</td>
          <td class="text-right currency">${formatCurrency(t.revenue)}</td>
        </tr>
        `).join('')}
        <tr class="totals-row">
          <td>Total</td>
          <td class="text-right">${report.treatmentBreakdown.reduce((sum, t) => sum + t.count, 0)}</td>
          <td class="text-right currency">${formatCurrency(report.treatmentBreakdown.reduce((sum, t) => sum + t.revenue, 0))}</td>
        </tr>
      </tbody>
    </table>
  </div>
  ` : ''}
  
  ${report.monthlyBreakdown.length > 0 ? `
  <div class="section">
    <div class="section-title">Monthly Performance</div>
    <table>
      <thead>
        <tr>
          <th>Month</th>
          <th class="text-right">Production</th>
          <th class="text-right">Treatments</th>
          <th class="text-right">Patients</th>
        </tr>
      </thead>
      <tbody>
        ${report.monthlyBreakdown.map(m => `
        <tr>
          <td class="font-bold">${m.month}</td>
          <td class="text-right currency">${formatCurrency(m.production)}</td>
          <td class="text-right">${m.treatments}</td>
          <td class="text-right">${m.patients}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}
  
  ${report.patientDetails.length > 0 ? `
  <div class="section">
    <div class="section-title">Patient Details</div>
    <table>
      <thead>
        <tr>
          <th>Patient Name</th>
          <th class="text-right">Treatments</th>
          <th class="text-right">Total Amount</th>
          <th class="text-right">Amount Paid</th>
          <th class="text-right">Balance</th>
        </tr>
      </thead>
      <tbody>
        ${report.patientDetails.map(p => `
        <tr>
          <td class="font-bold">${p.patientName}</td>
          <td class="text-right">${p.treatments.length}</td>
          <td class="text-right currency">${formatCurrency(p.totalAmount)}</td>
          <td class="text-right currency-blue">${formatCurrency(p.amountPaid)}</td>
          <td class="text-right" style="color: ${p.totalAmount - p.amountPaid > 0 ? '#f59e0b' : '#22c55e'};">${formatCurrency(p.totalAmount - p.amountPaid)}</td>
        </tr>
        `).join('')}
        <tr class="totals-row">
          <td>Total</td>
          <td class="text-right">${report.patientDetails.reduce((sum, p) => sum + p.treatments.length, 0)}</td>
          <td class="text-right currency">${formatCurrency(report.patientDetails.reduce((sum, p) => sum + p.totalAmount, 0))}</td>
          <td class="text-right currency-blue">${formatCurrency(report.patientDetails.reduce((sum, p) => sum + p.amountPaid, 0))}</td>
          <td class="text-right">${formatCurrency(report.patientDetails.reduce((sum, p) => sum + (p.totalAmount - p.amountPaid), 0))}</td>
        </tr>
      </tbody>
    </table>
  </div>
  ` : ''}
  
  ${myPayments && myPayments.length > 0 ? `
  <div class="section">
    <div class="section-title">Payments Received</div>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Method</th>
          <th>Period</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${myPayments.map(p => `
        <tr>
          <td>${format(new Date(p.paymentDate), "MMM d, yyyy")}</td>
          <td><span style="padding: 2px 8px; border-radius: 4px; font-size: 11px; background: ${p.paymentType === 'salary' ? '#dcfce7' : p.paymentType === 'bonus' ? '#dbeafe' : p.paymentType === 'deduction' ? '#fee2e2' : '#f3f4f6'}; color: ${p.paymentType === 'salary' ? '#166534' : p.paymentType === 'bonus' ? '#1e40af' : p.paymentType === 'deduction' ? '#991b1b' : '#374151'};">${PAYMENT_TYPES[p.paymentType]?.label || p.paymentType}</span></td>
          <td style="text-transform: capitalize;">${p.paymentMethod?.replace("_", " ") || "-"}</td>
          <td style="font-size: 12px; color: #666;">${p.paymentPeriodStart && p.paymentPeriodEnd ? `${format(new Date(p.paymentPeriodStart), "MMM d")} - ${format(new Date(p.paymentPeriodEnd), "MMM d, yyyy")}` : "-"}</td>
          <td class="text-right" style="font-weight: bold; color: ${p.paymentType === 'deduction' ? '#dc2626' : '#16a34a'};">${p.paymentType === 'deduction' ? '-' : ''}${formatCurrency(Number(p.amount))}</td>
        </tr>
        `).join('')}
        <tr class="totals-row">
          <td colspan="4">Total Payments Received</td>
          <td class="text-right" style="color: #9333ea; font-size: 18px;">${formatCurrency(totalPaymentsReceived)}</td>
        </tr>
      </tbody>
    </table>
  </div>
  ` : ''}
  
  <div class="footer">
    <p>GLAZER Dental Clinic Management System</p>
    <p>This report was generated automatically. For questions, please contact clinic administration.</p>
  </div>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Production-Report-${user?.firstName}-${user?.lastName}-${dateRange.startDate}-to-${dateRange.endDate}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
            <ExportDropdown 
              onExportHTML={handleExportHTML}
              data={{
                period: { start: dateRange.startDate, end: dateRange.endDate },
                doctorName: `${user?.firstName} ${user?.lastName}`,
                ...report,
              }}
              filename="My-Production-Report"
            />
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Payments Received
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400" data-testid="text-payments-received">
                    {formatCurrency(totalPaymentsReceived)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {myPayments?.length || 0} payment{myPayments?.length !== 1 ? 's' : ''}
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

            {/* Payments Received Section */}
            {myPayments && myPayments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Payments Received
                  </CardTitle>
                  <CardDescription>Salary, bonuses, and other payments during this period</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myPayments.map((payment) => (
                        <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(payment.paymentDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge className={PAYMENT_TYPES[payment.paymentType]?.color || PAYMENT_TYPES.other.color}>
                              {PAYMENT_TYPES[payment.paymentType]?.label || payment.paymentType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground capitalize">
                            {payment.paymentMethod?.replace("_", " ") || "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {payment.paymentPeriodStart && payment.paymentPeriodEnd ? (
                              <>
                                {format(new Date(payment.paymentPeriodStart), "MMM d")} -{" "}
                                {format(new Date(payment.paymentPeriodEnd), "MMM d, yyyy")}
                              </>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className={`text-right font-bold ${payment.paymentType === "deduction" ? "text-red-600" : "text-green-600"}`}>
                            {payment.paymentType === "deduction" && "-"}
                            {formatCurrency(Number(payment.amount))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex justify-end mt-4 pt-4 border-t">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Payments</p>
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalPaymentsReceived)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
