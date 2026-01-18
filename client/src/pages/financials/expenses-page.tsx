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
  Receipt,
  DollarSign,
  Building2,
  Calendar,
  FileText,
  Loader2,
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Expense } from "@shared/schema";

const EXPENSE_CATEGORIES = [
  { value: "supplies", label: "Supplies" },
  { value: "equipment", label: "Equipment" },
  { value: "lab_fees", label: "Lab Fees" },
  { value: "utilities", label: "Utilities" },
  { value: "rent", label: "Rent" },
  { value: "salaries", label: "Salaries" },
  { value: "marketing", label: "Marketing" },
  { value: "insurance", label: "Insurance" },
  { value: "maintenance", label: "Maintenance" },
  { value: "software", label: "Software" },
  { value: "training", label: "Training" },
  { value: "other", label: "Other" },
] as const;

const expenseFormSchema = z.object({
  description: z.string().min(1, "Description is required"),
  category: z.enum(["supplies", "equipment", "lab_fees", "utilities", "rent", "salaries", "marketing", "insurance", "maintenance", "software", "training", "other"]),
  amount: z.string().min(1, "Amount is required"),
  expenseDate: z.string().min(1, "Date is required"),
  vendor: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

function ExpenseDialog({
  open,
  onOpenChange,
  expense,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
}) {
  const { toast } = useToast();
  const isEditing = !!expense;

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: expense?.description || "",
      category: (expense?.category as any) || "supplies",
      amount: expense?.amount || "",
      expenseDate: expense?.expenseDate || format(new Date(), "yyyy-MM-dd"),
      vendor: expense?.vendor || "",
      referenceNumber: expense?.referenceNumber || "",
      notes: expense?.notes || "",
      isRecurring: expense?.isRecurring || false,
      recurringFrequency: expense?.recurringFrequency || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ExpenseFormValues) => {
      const res = await apiRequest("POST", "/api/expenses", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Expense created", description: "The expense has been recorded successfully." });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ExpenseFormValues) => {
      const res = await apiRequest("PATCH", `/api/expenses/${expense?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Expense updated", description: "The expense has been updated successfully." });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: ExpenseFormValues) => {
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
          <DialogTitle>{isEditing ? "Edit Expense" : "Add Expense"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the expense details." : "Record a new expense for the clinic."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Input placeholder="Office supplies, Equipment purchase, etc." {...field} data-testid="input-expense-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-expense-category">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
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
                        <Input placeholder="0.00" className="pl-9" {...field} data-testid="input-expense-amount" />
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
                name="expenseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-expense-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vendor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor</FormLabel>
                    <FormControl>
                      <Input placeholder="Vendor name" {...field} data-testid="input-expense-vendor" />
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
                    <Input placeholder="Invoice #, Receipt #, etc." {...field} data-testid="input-expense-reference" />
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
                    <Textarea placeholder="Additional notes..." rows={2} {...field} data-testid="input-expense-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-4">
              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-recurring" />
                    </FormControl>
                    <FormLabel className="!mt-0">Recurring expense</FormLabel>
                  </FormItem>
                )}
              />

              {form.watch("isRecurring") && (
                <FormField
                  control={form.control}
                  name="recurringFrequency"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-recurring-frequency">
                            <SelectValue placeholder="Frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-save-expense">
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? "Save Changes" : "Add Expense"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteExpenseDialog({
  open,
  onOpenChange,
  expense,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
}) {
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/expenses/${expense?.id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Expense deleted", description: "The expense has been deleted." });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (!expense) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Expense</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this expense? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm">
            <span className="font-medium">{expense.description}</span>
            <span className="text-muted-foreground"> - ${expense.amount}</span>
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

export default function ExpensesPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const queryParams = useMemo(
    () => (categoryFilter !== "all" ? { category: categoryFilter } : {}),
    [categoryFilter]
  );

  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses", queryParams],
  });

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(amount));
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      supplies: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      equipment: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      lab_fees: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
      utilities: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      rent: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      salaries: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      marketing: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
      insurance: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
      maintenance: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      software: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300",
      training: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
      other: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    };
    return colors[category] || colors.other;
  };

  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

  return (
    <div className="flex-1 p-4 md:p-6 overflow-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-expenses-title">Expense Tracking</h1>
            <p className="text-muted-foreground">Manage and track clinic operating expenses</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-add-expense">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-expenses">
                {formatCurrency(totalExpenses)}
              </div>
              <p className="text-xs text-muted-foreground">
                {expenses?.length || 0} expense records
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Expense Records</CardTitle>
              <CardDescription>All recorded expenses</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="category-filter">Filter:</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40" id="category-filter" data-testid="select-category-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
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
            ) : expenses && expenses.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id} data-testid={`row-expense-${expense.id}`}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(expense.expenseDate), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{expense.description}</span>
                            {expense.isRecurring && (
                              <Badge variant="outline" className="text-xs">
                                Recurring
                              </Badge>
                            )}
                          </div>
                          {expense.notes && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {expense.notes}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getCategoryBadge(expense.category)}>
                            {EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.label || expense.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {expense.vendor || "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(expense.amount)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-expense-menu-${expense.id}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditExpense(expense)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteExpense(expense)}
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
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No expenses recorded yet</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setCreateDialogOpen(true)}
                  data-testid="button-add-first-expense"
                >
                  Add your first expense
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ExpenseDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <ExpenseDialog
        open={!!editExpense}
        onOpenChange={(open) => !open && setEditExpense(null)}
        expense={editExpense}
      />

      <DeleteExpenseDialog
        open={!!deleteExpense}
        onOpenChange={(open) => !open && setDeleteExpense(null)}
        expense={deleteExpense}
      />
    </div>
  );
}
