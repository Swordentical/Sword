import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths, startOfMonth, endOfMonth, startOfYear } from "date-fns";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Users,
  PieChart,
  BarChart3,
  Calendar,
  Download,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#6366f1', '#f97316', '#14b8a6'];

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

export default function ReportsPage() {
  const [period, setPeriod] = useState("last12Months");
  const dateRange = useMemo(() => getDateRange(period), [period]);
  const queryParams = useMemo(() => ({ startDate: dateRange.startDate, endDate: dateRange.endDate }), [dateRange.startDate, dateRange.endDate]);

  const { data: revenueReport, isLoading: isLoadingRevenue } = useQuery<{
    totalRevenue: number;
    totalCollections: number;
    totalAdjustments: number;
    byMonth: { month: string; revenue: number; collections: number }[];
  }>({
    queryKey: ["/api/reports/revenue", queryParams],
  });

  const { data: arAgingReport, isLoading: isLoadingAR } = useQuery<{
    current: number;
    thirtyDays: number;
    sixtyDays: number;
    ninetyDays: number;
    overNinety: number;
    total: number;
  }>({
    queryKey: ["/api/reports/ar-aging"],
  });

  const { data: productionReport, isLoading: isLoadingProduction } = useQuery<{
    doctorId: string;
    doctorName: string;
    totalProduction: number;
    treatmentCount: number;
  }[]>({
    queryKey: ["/api/reports/production-by-doctor", queryParams],
  });

  const { data: expenseReport, isLoading: isLoadingExpenses } = useQuery<{
    total: number;
    byCategory: { category: string; amount: number }[];
    byMonth: { month: string; amount: number }[];
  }>({
    queryKey: ["/api/reports/expenses", queryParams],
  });

  const { data: netProfitReport, isLoading: isLoadingNetProfit } = useQuery<{
    grossRevenue: number;
    totalCollections: number;
    serviceCosts: number;
    operatingExpenses: number;
    grossProfit: number;
    netProfit: number;
    profitMargin: number;
    byMonth: { month: string; collections: number; costs: number; expenses: number; netProfit: number }[];
  }>({
    queryKey: ["/api/reports/net-profit", queryParams],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatCategoryLabel = (category: string) => {
    return category.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  return (
    <div className="flex-1 p-4 md:p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-reports-title">Financial Reports</h1>
            <p className="text-muted-foreground">Comprehensive financial analytics and reporting</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="period">Period:</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-40" id="period" data-testid="select-period">
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
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="net-profit" data-testid="tab-net-profit">Net Profit</TabsTrigger>
            <TabsTrigger value="revenue" data-testid="tab-revenue">Revenue</TabsTrigger>
            <TabsTrigger value="ar-aging" data-testid="tab-ar-aging">AR Aging</TabsTrigger>
            <TabsTrigger value="production" data-testid="tab-production">Production</TabsTrigger>
            <TabsTrigger value="expenses" data-testid="tab-expenses">Expenses</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-revenue">
                    {isLoadingRevenue ? "..." : formatCurrency(revenueReport?.totalRevenue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Invoiced amount</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="text-sm font-medium">Total Collections</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-collections">
                    {isLoadingRevenue ? "..." : formatCurrency(revenueReport?.totalCollections || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Payments received</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="text-sm font-medium">Outstanding AR</CardTitle>
                  <Clock className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-outstanding-ar">
                    {isLoadingAR ? "..." : formatCurrency(arAgingReport?.total || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Unpaid balance</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-expenses">
                    {isLoadingExpenses ? "..." : formatCurrency(expenseReport?.total || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Operating costs</p>
                </CardContent>
              </Card>

              <Card className={(netProfitReport?.netProfit || 0) >= 0 ? "border-green-500/50" : "border-red-500/50"}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                  {(netProfitReport?.netProfit || 0) >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${(netProfitReport?.netProfit || 0) >= 0 ? "text-green-600" : "text-red-600"}`} data-testid="text-net-profit">
                    {isLoadingNetProfit ? "..." : formatCurrency(netProfitReport?.netProfit || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isLoadingNetProfit ? "..." : `${(netProfitReport?.profitMargin || 0).toFixed(1)}% margin`}
                  </p>
                </CardContent>
              </Card>
            </div>

            {revenueReport && revenueReport.byMonth.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Revenue vs Collections Trend</CardTitle>
                  <CardDescription>Monthly comparison of invoiced revenue and collected payments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueReport.byMonth}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" tickFormatter={(v) => `$${v}`} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" name="Revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                        <Line type="monotone" dataKey="collections" name="Collections" stroke="#22c55e" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="net-profit" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Collections (Income)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600" data-testid="text-profit-collections">
                    {isLoadingNetProfit ? "..." : formatCurrency(netProfitReport?.totalCollections || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Payments received</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Service Costs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600" data-testid="text-service-costs">
                    {isLoadingNetProfit ? "..." : formatCurrency(netProfitReport?.serviceCosts || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Cost of treatments delivered</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Operating Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600" data-testid="text-operating-expenses">
                    {isLoadingNetProfit ? "..." : formatCurrency(netProfitReport?.operatingExpenses || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Rent, supplies, utilities, etc.</p>
                </CardContent>
              </Card>
              <Card className={(netProfitReport?.netProfit || 0) >= 0 ? "border-green-500" : "border-red-500"}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${(netProfitReport?.netProfit || 0) >= 0 ? "text-green-600" : "text-red-600"}`} data-testid="text-profit-net">
                    {isLoadingNetProfit ? "..." : formatCurrency(netProfitReport?.netProfit || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isLoadingNetProfit ? "..." : `${(netProfitReport?.profitMargin || 0).toFixed(1)}% profit margin`}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Profit Calculation Breakdown</CardTitle>
                <CardDescription>How your net profit is calculated</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Collections (Income)</span>
                    <span className="text-green-600 font-bold">{formatCurrency(netProfitReport?.totalCollections || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Less: Service Costs</span>
                    <span className="text-amber-600">- {formatCurrency(netProfitReport?.serviceCosts || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b bg-muted/30 px-2 rounded">
                    <span className="font-medium">Gross Profit</span>
                    <span className="font-bold">{formatCurrency(netProfitReport?.grossProfit || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Less: Operating Expenses</span>
                    <span className="text-red-600">- {formatCurrency(netProfitReport?.operatingExpenses || 0)}</span>
                  </div>
                  <div className={`flex justify-between items-center py-3 px-2 rounded ${(netProfitReport?.netProfit || 0) >= 0 ? "bg-green-100 dark:bg-green-950" : "bg-red-100 dark:bg-red-950"}`}>
                    <span className="font-bold text-lg">Net Profit</span>
                    <span className={`font-bold text-lg ${(netProfitReport?.netProfit || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(netProfitReport?.netProfit || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {netProfitReport && netProfitReport.byMonth.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Net Profit Trend</CardTitle>
                  <CardDescription>Net profit breakdown by month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={netProfitReport.byMonth}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" tickFormatter={(v) => `$${v}`} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="collections" name="Collections" fill="#22c55e" />
                        <Bar dataKey="costs" name="Service Costs" fill="#f59e0b" />
                        <Bar dataKey="expenses" name="Operating Expenses" fill="#ef4444" />
                        <Bar dataKey="netProfit" name="Net Profit" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {netProfitReport && netProfitReport.byMonth.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Profit Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Collections</TableHead>
                        <TableHead className="text-right">Service Costs</TableHead>
                        <TableHead className="text-right">Expenses</TableHead>
                        <TableHead className="text-right">Net Profit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {netProfitReport.byMonth.map((row) => (
                        <TableRow key={row.month}>
                          <TableCell className="font-medium">{row.month}</TableCell>
                          <TableCell className="text-right text-green-600">{formatCurrency(row.collections)}</TableCell>
                          <TableCell className="text-right text-amber-600">{formatCurrency(row.costs)}</TableCell>
                          <TableCell className="text-right text-red-600">{formatCurrency(row.expenses)}</TableCell>
                          <TableCell className={`text-right font-bold ${row.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatCurrency(row.netProfit)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatCurrency(revenueReport?.totalRevenue || 0)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Collections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{formatCurrency(revenueReport?.totalCollections || 0)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Adjustments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-600">{formatCurrency(revenueReport?.totalAdjustments || 0)}</div>
                </CardContent>
              </Card>
            </div>

            {revenueReport && revenueReport.byMonth.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueReport.byMonth}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" tickFormatter={(v) => `$${v}`} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--primary))" />
                        <Bar dataKey="collections" name="Collections" fill="#22c55e" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="ar-aging" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Accounts Receivable Aging Report
                </CardTitle>
                <CardDescription>Outstanding balances grouped by age</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingAR ? (
                  <p>Loading...</p>
                ) : arAgingReport ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950">
                        <p className="text-sm text-muted-foreground">Current</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-400">{formatCurrency(arAgingReport.current)}</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950">
                        <p className="text-sm text-muted-foreground">1-30 Days</p>
                        <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{formatCurrency(arAgingReport.thirtyDays)}</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-950">
                        <p className="text-sm text-muted-foreground">31-60 Days</p>
                        <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{formatCurrency(arAgingReport.sixtyDays)}</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950">
                        <p className="text-sm text-muted-foreground">61-90 Days</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(arAgingReport.ninetyDays)}</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-red-100 dark:bg-red-900">
                        <p className="text-sm text-muted-foreground">90+ Days</p>
                        <p className="text-2xl font-bold text-red-800 dark:text-red-300">{formatCurrency(arAgingReport.overNinety)}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Outstanding</span>
                        <span className="font-bold">{formatCurrency(arAgingReport.total)}</span>
                      </div>
                      <Progress value={arAgingReport.total > 0 ? 100 : 0} />
                    </div>

                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: "Current", value: arAgingReport.current, fill: "#22c55e" },
                            { name: "1-30", value: arAgingReport.thirtyDays, fill: "#eab308" },
                            { name: "31-60", value: arAgingReport.sixtyDays, fill: "#f97316" },
                            { name: "61-90", value: arAgingReport.ninetyDays, fill: "#ef4444" },
                            { name: "90+", value: arAgingReport.overNinety, fill: "#991b1b" },
                          ]}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                          <YAxis type="category" dataKey="name" width={60} />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Bar dataKey="value" name="Amount" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">No outstanding receivables</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="production" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Production by Doctor
                </CardTitle>
                <CardDescription>Completed treatment production for the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingProduction ? (
                  <p>Loading...</p>
                ) : productionReport && productionReport.length > 0 ? (
                  <div className="space-y-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Doctor</TableHead>
                          <TableHead className="text-right">Treatments</TableHead>
                          <TableHead className="text-right">Production</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productionReport.map((row, idx) => (
                          <TableRow key={row.doctorId}>
                            <TableCell className="font-medium">{row.doctorName}</TableCell>
                            <TableCell className="text-right">{row.treatmentCount}</TableCell>
                            <TableCell className="text-right font-bold">{formatCurrency(row.totalProduction)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={productionReport.map(d => ({ name: d.doctorName, value: d.totalProduction }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={100}
                            dataKey="value"
                          >
                            {productionReport.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No production data for the selected period</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Expense Report
                </CardTitle>
                <CardDescription>Operating expenses breakdown for the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingExpenses ? (
                  <p>Loading...</p>
                ) : expenseReport ? (
                  <div className="space-y-6">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Expenses</p>
                      <p className="text-4xl font-bold">{formatCurrency(expenseReport.total)}</p>
                    </div>

                    {expenseReport.byCategory.length > 0 && (
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-4">By Category</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {expenseReport.byCategory.map((row) => (
                                <TableRow key={row.category}>
                                  <TableCell>{formatCategoryLabel(row.category)}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(row.amount)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={expenseReport.byCategory.map(c => ({ name: formatCategoryLabel(c.category), value: c.amount }))}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                dataKey="value"
                              >
                                {expenseReport.byCategory.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: number) => formatCurrency(value)} />
                              <Legend />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {expenseReport.byMonth.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-4">Monthly Trend</h4>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={expenseReport.byMonth}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis dataKey="month" className="text-xs" />
                              <YAxis className="text-xs" tickFormatter={(v) => `$${v}`} />
                              <Tooltip formatter={(value: number) => formatCurrency(value)} />
                              <Bar dataKey="amount" name="Expenses" fill="hsl(var(--destructive))" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No expense data for the selected period</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
