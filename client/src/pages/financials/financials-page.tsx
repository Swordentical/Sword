import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  DollarSign,
  Loader2,
  FileText,
  TrendingUp,
  CreditCard,
  CalendarIcon,
  Receipt,
  Send,
  Ban,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { Invoice, InvoiceItem, Payment, Patient } from "@shared/schema";

type InvoiceWithPatient = Invoice & { patient?: Patient };
type InvoiceDetails = Invoice & { 
  patient?: Patient; 
  items: InvoiceItem[]; 
  payments: Payment[];
};

const invoiceSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  items: z.array(z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unitPrice: z.number().min(0, "Price must be 0 or more"),
  })).min(1, "At least one item is required"),
  discountType: z.enum(["percentage", "value"]).optional().nullable(),
  discountValue: z.number().optional().nullable(),
  dueDate: z.date().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

const paymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice is required"),
  amount: z.string().min(1, "Amount is required"),
  paymentDate: z.date({ required_error: "Date is required" }),
  paymentMethod: z.enum(["cash", "card", "bank_transfer", "insurance", "other"]),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

const STATUS_BADGES: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  draft: { variant: "outline", label: "Draft" },
  sent: { variant: "secondary", label: "Sent" },
  paid: { variant: "default", label: "Paid" },
  partial: { variant: "secondary", label: "Partial" },
  overdue: { variant: "destructive", label: "Overdue" },
  canceled: { variant: "outline", label: "Canceled" },
};

function CreateInvoiceDialog({
  open,
  onOpenChange,
  patients,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patients: Patient[];
}) {
  const { toast } = useToast();

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      patientId: "",
      items: [{ description: "", quantity: 1, unitPrice: 0 }],
      discountType: null,
      discountValue: null,
      dueDate: null,
      notes: null,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const items = form.watch("items");
  const discountType = form.watch("discountType");
  const discountValue = form.watch("discountValue");

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  let discount = 0;
  if (discountType && discountValue) {
    if (discountType === "percentage") {
      discount = subtotal * (discountValue / 100);
    } else {
      discount = discountValue;
    }
  }
  const total = Math.max(0, subtotal - discount);

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormValues) => {
      const invoiceItems = data.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        totalPrice: (item.quantity * item.unitPrice).toFixed(2),
      }));

      const res = await apiRequest("POST", "/api/invoices", {
        patientId: data.patientId,
        totalAmount: subtotal.toFixed(2),
        discountType: data.discountType,
        discountValue: data.discountValue?.toFixed(2),
        finalAmount: total.toFixed(2),
        issuedDate: new Date().toISOString().split("T")[0],
        dueDate: data.dueDate?.toISOString().split("T")[0] || null,
        notes: data.notes,
        status: "draft",
        items: invoiceItems,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Invoice created",
        description: "The invoice has been created as a draft.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create invoice",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InvoiceFormValues) => {
    createInvoiceMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
          <DialogDescription>
            Create a new invoice with line items.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-patient">
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.firstName} {patient.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Line Items *</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
                  data-testid="button-add-item"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Description</TableHead>
                      <TableHead className="w-[15%]">Qty</TableHead>
                      <TableHead className="w-[20%]">Unit Price</TableHead>
                      <TableHead className="w-[15%]">Total</TableHead>
                      <TableHead className="w-[10%]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell className="p-2">
                          <Input
                            placeholder="Service description"
                            {...form.register(`items.${index}.description`)}
                            data-testid={`input-item-description-${index}`}
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input
                            type="number"
                            min="1"
                            {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                            data-testid={`input-item-quantity-${index}`}
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                            data-testid={`input-item-price-${index}`}
                          />
                        </TableCell>
                        <TableCell className="p-2 text-right font-medium">
                          ${((items[index]?.quantity || 0) * (items[index]?.unitPrice || 0)).toFixed(2)}
                        </TableCell>
                        <TableCell className="p-2">
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                              data-testid={`button-remove-item-${index}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {form.formState.errors.items && (
                <p className="text-sm text-destructive">{form.formState.errors.items.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Type</FormLabel>
                    <Select 
                      onValueChange={(val) => field.onChange(val === "none" ? null : val)} 
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-discount-type">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="value">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {discountType && discountType !== "none" && (
                <FormField
                  control={form.control}
                  name="discountValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Discount {discountType === "percentage" ? "(%)" : "($)"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          data-testid="input-discount-value"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          data-testid="button-due-date"
                        >
                          {field.value ? format(field.value, "PPP") : "Pick a due date"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                    <Textarea
                      placeholder="Additional notes for this invoice..."
                      {...field}
                      value={field.value || ""}
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>Discount:</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createInvoiceMutation.isPending} data-testid="button-create-invoice">
                {createInvoiceMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Invoice"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function InvoiceDetailsDialog({
  open,
  onOpenChange,
  invoiceId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string | null;
}) {
  const { toast } = useToast();
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);

  const { data: invoice, isLoading } = useQuery<InvoiceDetails>({
    queryKey: ["/api/invoices", invoiceId],
    enabled: !!invoiceId && open,
  });

  const sendInvoiceMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/invoices/${invoiceId}/send`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", invoiceId] });
      toast({
        title: "Invoice sent",
        description: "The invoice status has been updated to sent.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send invoice",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const voidInvoiceMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/invoices/${invoiceId}/void`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", invoiceId] });
      toast({
        title: "Invoice voided",
        description: "The invoice has been canceled.",
      });
      setVoidDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to void invoice",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!invoiceId) return null;

  const statusConfig = invoice ? STATUS_BADGES[invoice.status || "draft"] : STATUS_BADGES.draft;
  const balance = invoice ? Number(invoice.finalAmount || 0) - Number(invoice.paidAmount || 0) : 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : invoice ? (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-xl">{invoice.invoiceNumber}</DialogTitle>
                    <DialogDescription>
                      {invoice.patient?.firstName} {invoice.patient?.lastName}
                    </DialogDescription>
                  </div>
                  <Badge variant={statusConfig.variant} className="ml-2">
                    {statusConfig.label}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Issued Date</p>
                  <p className="font-medium">
                    {invoice.issuedDate && format(new Date(invoice.issuedDate), "PPP")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Due Date</p>
                  <p className="font-medium">
                    {invoice.dueDate ? format(new Date(invoice.dueDate), "PPP") : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Patient Phone</p>
                  <p className="font-medium">{invoice.patient?.phone || "—"}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold">Line Items</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.length > 0 ? (
                      invoice.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">${item.unitPrice}</TableCell>
                          <TableCell className="text-right font-medium">${item.totalPrice}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No line items
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${invoice.totalAmount}</span>
                </div>
                {invoice.discountValue && Number(invoice.discountValue) > 0 && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>
                      Discount ({invoice.discountType === "percentage" ? `${invoice.discountValue}%` : `$${invoice.discountValue}`}):
                    </span>
                    <span>-${(Number(invoice.totalAmount) - Number(invoice.finalAmount)).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>${invoice.finalAmount}</span>
                </div>
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Paid:</span>
                  <span>${invoice.paidAmount || "0.00"}</span>
                </div>
                {balance > 0 && (
                  <div className="flex justify-between text-sm text-amber-600 font-medium">
                    <span>Balance Due:</span>
                    <span>${balance.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {invoice.payments.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Payment History</h4>
                  <div className="space-y-2">
                    {invoice.payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div>
                          <p className="font-medium">${payment.amount}</p>
                          <p className="text-sm text-muted-foreground">
                            {payment.paymentDate && format(new Date(payment.paymentDate), "PPP")} • {payment.paymentMethod}
                          </p>
                        </div>
                        {payment.referenceNumber && (
                          <p className="text-sm text-muted-foreground">Ref: {payment.referenceNumber}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {invoice.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                </div>
              )}

              <DialogFooter className="flex flex-wrap gap-2">
                {invoice.status === "draft" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setVoidDialogOpen(true)}
                      disabled={voidInvoiceMutation.isPending}
                      data-testid="button-void-invoice"
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Void Invoice
                    </Button>
                    <Button
                      onClick={() => sendInvoiceMutation.mutate()}
                      disabled={sendInvoiceMutation.isPending}
                      data-testid="button-send-invoice"
                    >
                      {sendInvoiceMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Send Invoice
                    </Button>
                  </>
                )}
                {(invoice.status === "sent" || invoice.status === "partial") && (
                  <Button
                    variant="outline"
                    onClick={() => setVoidDialogOpen(true)}
                    disabled={voidInvoiceMutation.isPending}
                    data-testid="button-void-invoice"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Void Invoice
                  </Button>
                )}
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Invoice not found
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to void this invoice? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => voidInvoiceMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {voidInvoiceMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Void Invoice"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function RecordPaymentDialog({
  open,
  onOpenChange,
  invoices,
  preselectedInvoiceId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: InvoiceWithPatient[];
  preselectedInvoiceId?: string;
}) {
  const { toast } = useToast();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoiceId: preselectedInvoiceId || "",
      amount: "",
      paymentDate: new Date(),
      paymentMethod: "cash",
      referenceNumber: "",
      notes: "",
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormValues) => {
      const res = await apiRequest("POST", "/api/payments", {
        invoiceId: data.invoiceId,
        amount: data.amount,
        paymentDate: data.paymentDate.toISOString().split("T")[0],
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber || null,
        notes: data.notes || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({
        title: "Payment recorded",
        description: "The payment has been recorded successfully.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to record payment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PaymentFormValues) => {
    recordPaymentMutation.mutate(data);
  };

  const unpaidInvoices = invoices.filter(
    (inv) => inv.status !== "paid" && inv.status !== "canceled"
  );

  const selectedInvoice = invoices.find(inv => inv.id === form.watch("invoiceId"));
  const maxAmount = selectedInvoice 
    ? Number(selectedInvoice.finalAmount || 0) - Number(selectedInvoice.paidAmount || 0)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for an invoice.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="invoiceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-payment-invoice">
                        <SelectValue placeholder="Select invoice" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {unpaidInvoices.map((invoice) => (
                        <SelectItem key={invoice.id} value={invoice.id}>
                          {invoice.invoiceNumber} - {invoice.patient?.firstName} {invoice.patient?.lastName} (${invoice.finalAmount})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedInvoice && maxAmount > 0 && (
              <p className="text-sm text-muted-foreground">
                Balance due: ${maxAmount.toFixed(2)}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field} 
                        data-testid="input-payment-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Method *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-payment-method">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="insurance">Insurance</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          data-testid="button-payment-date"
                        >
                          {field.value ? format(field.value, "PPP") : "Pick date"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="referenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Number</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Transaction ID" 
                      {...field} 
                      data-testid="input-payment-reference"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={recordPaymentMutation.isPending} data-testid="button-record-payment">
                {recordPaymentMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  "Record Payment"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function FinancialsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<InvoiceWithPatient[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      !searchTerm ||
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.patient?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.patient?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);
  const totalOutstanding = invoices.reduce(
    (sum, inv) => sum + (Number(inv.finalAmount || 0) - Number(inv.paidAmount || 0)),
    0
  );
  const paidCount = invoices.filter((inv) => inv.status === "paid").length;

  const handleViewDetails = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setDetailsDialogOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financials</h1>
          <p className="text-muted-foreground">
            Manage invoices and track payments
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setPaymentDialogOpen(true)} data-testid="button-record-payment-open">
            <CreditCard className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Record Payment</span>
            <span className="sm:hidden">Payment</span>
          </Button>
          <Button onClick={() => setInvoiceDialogOpen(true)} data-testid="button-new-invoice">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">New Invoice</span>
            <span className="sm:hidden">Invoice</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold truncate">${totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-amber-600 truncate">${totalOutstanding.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Outstanding</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold">{invoices.length}</p>
                <p className="text-xs text-muted-foreground">Total Invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold">{paidCount}</p>
                <p className="text-xs text-muted-foreground">Paid Invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-invoices"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredInvoices.length > 0 ? (
            <div className="space-y-3">
              {filteredInvoices.map((invoice) => {
                const statusConfig = STATUS_BADGES[invoice.status || "draft"];
                const initials = invoice.patient
                  ? `${invoice.patient.firstName?.charAt(0)}${invoice.patient.lastName?.charAt(0)}`
                  : "?";
                const balance = Number(invoice.finalAmount || 0) - Number(invoice.paidAmount || 0);

                return (
                  <Card 
                    key={invoice.id} 
                    className="hover-elevate cursor-pointer"
                    onClick={() => handleViewDetails(invoice.id)}
                    data-testid={`card-invoice-${invoice.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 hidden sm:flex">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {initials}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">{invoice.invoiceNumber}</p>
                            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {invoice.patient?.firstName} {invoice.patient?.lastName}
                            <span className="hidden sm:inline">
                              {" "}• {invoice.issuedDate && format(new Date(invoice.issuedDate), "MMM d, yyyy")}
                            </span>
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-bold">${invoice.finalAmount}</p>
                          {balance > 0 && invoice.status !== "paid" && (
                            <p className="text-xs text-amber-600">
                              ${balance.toFixed(2)} due
                            </p>
                          )}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" data-testid={`button-invoice-menu-${invoice.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewDetails(invoice.id); }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {invoice.status !== "paid" && invoice.status !== "canceled" && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setPaymentDialogOpen(true); }}>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Record Payment
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-16 w-16 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-1">No invoices found</h3>
              <p className="text-sm mb-4">Create your first invoice to get started</p>
              <Button onClick={() => setInvoiceDialogOpen(true)} data-testid="button-empty-new-invoice">
                <Plus className="h-4 w-4 mr-2" />
                New Invoice
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateInvoiceDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        patients={patients}
      />

      <InvoiceDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        invoiceId={selectedInvoiceId}
      />

      <RecordPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        invoices={invoices}
      />
    </div>
  );
}
