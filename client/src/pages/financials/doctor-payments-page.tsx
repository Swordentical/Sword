import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Wallet,
  DollarSign,
  UserIcon,
  Calendar,
  Loader2,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { DoctorPayment, User } from "@shared/schema";

const PAYMENT_TYPES = [
  { value: "salary", label: "Salary" },
  { value: "bonus", label: "Bonus" },
  { value: "commission", label: "Commission" },
  { value: "deduction", label: "Deduction" },
  { value: "reimbursement", label: "Reimbursement" },
  { value: "other", label: "Other" },
] as const;

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "insurance", label: "Insurance" },
  { value: "other", label: "Other" },
] as const;

const paymentFormSchema = z.object({
  doctorId: z.string().min(1, "Doctor is required"),
  amount: z.string().min(1, "Amount is required"),
  paymentType: z.enum(["salary", "bonus", "commission", "deduction", "reimbursement", "other"]),
  paymentMethod: z.enum(["cash", "card", "bank_transfer", "insurance", "other"]),
  paymentDate: z.string().min(1, "Date is required"),
  paymentPeriodStart: z.string().optional(),
  paymentPeriodEnd: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface DoctorPaymentWithDoctor extends DoctorPayment {
  doctor?: User;
}

function PaymentDialog({
  open,
  onOpenChange,
  payment,
  doctors,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment?: DoctorPaymentWithDoctor | null;
  doctors: User[];
}) {
  const { toast } = useToast();
  const isEditing = !!payment;

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      doctorId: payment?.doctorId || "",
      amount: payment?.amount || "",
      paymentType: (payment?.paymentType as any) || "salary",
      paymentMethod: (payment?.paymentMethod as any) || "bank_transfer",
      paymentDate: payment?.paymentDate || format(new Date(), "yyyy-MM-dd"),
      paymentPeriodStart: payment?.paymentPeriodStart || "",
      paymentPeriodEnd: payment?.paymentPeriodEnd || "",
      referenceNumber: payment?.referenceNumber || "",
      notes: payment?.notes || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PaymentFormValues) => {
      const res = await apiRequest("POST", "/api/doctor-payments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctor-payments"] });
      toast({ title: "Payment recorded", description: "The payment has been recorded successfully." });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: PaymentFormValues) => {
      const res = await apiRequest("PATCH", `/api/doctor-payments/${payment?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctor-payments"] });
      toast({ title: "Payment updated", description: "The payment has been updated successfully." });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: PaymentFormValues) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Payment" : "Record Payment"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the payment details." : "Record a new payment to a doctor."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="doctorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Doctor *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-doctor">
                        <SelectValue placeholder="Select doctor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          Dr. {doctor.firstName} {doctor.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="paymentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Type *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-payment-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="0.00" className="pl-9" {...field} data-testid="input-amount" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-payment-method">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_METHODS.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-payment-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="paymentPeriodStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period Start</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-period-start" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentPeriodEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period End</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-period-end" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="referenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Check #, Transfer ID, etc." {...field} data-testid="input-reference" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes..." rows={2} {...field} data-testid="input-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-save-payment">
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? "Save Changes" : "Record Payment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeletePaymentDialog({
  open,
  onOpenChange,
  payment,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: DoctorPaymentWithDoctor | null;
}) {
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/doctor-payments/${payment?.id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctor-payments"] });
      toast({ title: "Payment deleted", description: "The payment has been deleted." });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Payment</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this payment record? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm">
            <span className="font-medium">
              Dr. {payment.doctor?.firstName} {payment.doctor?.lastName}
            </span>
            <span className="text-muted-foreground"> - ${payment.amount}</span>
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-delete">
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            data-testid="button-confirm-delete"
          >
            {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type SortField = "date" | "doctor" | "type" | "amount";
type SortDirection = "asc" | "desc";

export default function DoctorPaymentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editPayment, setEditPayment] = useState<DoctorPaymentWithDoctor | null>(null);
  const [deletePayment, setDeletePayment] = useState<DoctorPaymentWithDoctor | null>(null);
  const [doctorFilter, setDoctorFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const { data: doctors } = useQuery<User[]>({
    queryKey: ["/api/doctors"],
  });

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (doctorFilter !== "all") params.doctorId = doctorFilter;
    if (typeFilter !== "all") params.paymentType = typeFilter;
    return params;
  }, [doctorFilter, typeFilter]);

  const { data: payments, isLoading } = useQuery<DoctorPaymentWithDoctor[]>({
    queryKey: ["/api/doctor-payments", queryParams],
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedPayments = useMemo(() => {
    if (!payments) return [];
    return [...payments].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "date":
          comparison = new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime();
          break;
        case "doctor":
          const nameA = `${a.doctor?.firstName || ""} ${a.doctor?.lastName || ""}`.toLowerCase();
          const nameB = `${b.doctor?.firstName || ""} ${b.doctor?.lastName || ""}`.toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        case "type":
          comparison = (a.paymentType || "").localeCompare(b.paymentType || "");
          break;
        case "amount":
          comparison = Number(a.amount) - Number(b.amount);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [payments, sortField, sortDirection]);

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-30" />
        )}
      </div>
    </TableHead>
  );

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(amount));
  };

  const getPaymentTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      salary: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      bonus: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      commission: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      deduction: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      reimbursement: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      other: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    };
    return colors[type] || colors.other;
  };

  const totalPayments = payments?.reduce((sum, p) => {
    const amount = Number(p.amount);
    if (p.paymentType === "deduction") return sum - amount;
    return sum + amount;
  }, 0) || 0;

  const totalSalary = payments?.filter(p => p.paymentType === "salary").reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const totalBonus = payments?.filter(p => p.paymentType === "bonus" || p.paymentType === "commission").reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const totalDeductions = payments?.filter(p => p.paymentType === "deduction").reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  if (!isAdmin) {
    return (
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
            <p className="text-muted-foreground text-center">
              Only administrators can manage doctor payments.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 overflow-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-payments-title">Doctor Payments</h1>
            <p className="text-muted-foreground">Manage salary payments, bonuses, and commissions</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-add-payment">
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-paid">
                {formatCurrency(totalPayments)}
              </div>
              <p className="text-xs text-muted-foreground">
                {payments?.length || 0} payment records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Salaries</CardTitle>
              <UserIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="text-total-salary">
                {formatCurrency(totalSalary)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Bonuses & Commissions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600" data-testid="text-total-bonus">
                {formatCurrency(totalBonus)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Deductions</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600" data-testid="text-total-deductions">
                {formatCurrency(totalDeductions)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Payment Records</CardTitle>
              <CardDescription>All recorded payments to doctors</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="doctor-filter">Doctor:</Label>
              <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                <SelectTrigger className="w-40" id="doctor-filter" data-testid="select-doctor-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Doctors</SelectItem>
                  {doctors?.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      Dr. {doctor.firstName} {doctor.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label htmlFor="type-filter">Type:</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40" id="type-filter" data-testid="select-type-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {PAYMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : payments && payments.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortHeader field="date">Date</SortHeader>
                      <SortHeader field="doctor">Doctor</SortHeader>
                      <SortHeader field="type">Type</SortHeader>
                      <TableHead>Method</TableHead>
                      <TableHead>Period</TableHead>
                      <SortHeader field="amount">Amount</SortHeader>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPayments.map((payment) => (
                      <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(payment.paymentDate), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            Dr. {payment.doctor?.firstName} {payment.doctor?.lastName}
                          </div>
                          {payment.referenceNumber && (
                            <p className="text-xs text-muted-foreground">
                              Ref: {payment.referenceNumber}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getPaymentTypeBadge(payment.paymentType)}>
                            {PAYMENT_TYPES.find(t => t.value === payment.paymentType)?.label || payment.paymentType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground capitalize">
                          {payment.paymentMethod?.replace("_", " ") || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {payment.paymentPeriodStart && payment.paymentPeriodEnd ? (
                            <span className="text-xs">
                              {format(new Date(payment.paymentPeriodStart), "MMM d")} -{" "}
                              {format(new Date(payment.paymentPeriodEnd), "MMM d, yyyy")}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${payment.paymentType === "deduction" ? "text-red-600" : ""}`}>
                          {payment.paymentType === "deduction" && "-"}
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-payment-menu-${payment.id}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditPayment(payment)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeletePayment(payment)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No payments recorded yet</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setCreateDialogOpen(true)}
                  data-testid="button-add-first-payment"
                >
                  Record your first payment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PaymentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        doctors={doctors || []}
      />

      <PaymentDialog
        open={!!editPayment}
        onOpenChange={(open) => !open && setEditPayment(null)}
        payment={editPayment}
        doctors={doctors || []}
      />

      <DeletePaymentDialog
        open={!!deletePayment}
        onOpenChange={(open) => !open && setDeletePayment(null)}
        payment={deletePayment}
      />
    </div>
  );
}
