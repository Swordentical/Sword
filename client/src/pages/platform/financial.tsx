import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, CreditCard, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function PlatformFinancial() {
  const transactions = [
    { id: "1", org: "DentalCare Clinic", plan: "Professional", amount: "$199.00", status: "Paid", date: "2024-01-30" },
    { id: "2", org: "Smile Bright", plan: "Basic", amount: "$99.00", status: "Paid", date: "2024-01-29" },
    { id: "3", org: "Modern Lab", plan: "Enterprise", amount: "$499.00", status: "Pending", date: "2024-01-28" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Financials</h1>
        <p className="text-muted-foreground">Monitor revenue, subscriptions, and financial health across the platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue (MRR)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$42,500.00</div>
            <div className="flex items-center text-xs text-green-500 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +12.5% from last month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">124</div>
            <div className="flex items-center text-xs text-green-500 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +8 new this week
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2%</div>
            <div className="flex items-center text-xs text-red-500 mt-1">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              -0.4% from last month
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">{tx.org}</TableCell>
                  <TableCell>{tx.plan}</TableCell>
                  <TableCell>{tx.amount}</TableCell>
                  <TableCell>
                    <Badge variant={tx.status === "Paid" ? "default" : "secondary"}>
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{tx.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
