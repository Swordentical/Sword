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
  FileCheck,
  FileX,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  Loader2,
  Search,
  Shield,
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
  DropdownMenuSeparator,
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { InsuranceClaim, Patient, Invoice } from "@shared/schema";

const CLAIM_STATUSES = [
  { value: "draft", label: "Draft", icon: FileCheck, color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
  { value: "submitted", label: "Submitted", icon: Send, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  { value: "pending", label: "Pending", icon: Clock, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
  { value: "approved", label: "Approved", icon: CheckCircle, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  { value: "denied", label: "Denied", icon: XCircle, color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
  { value: "paid", label: "Paid", icon: DollarSign, color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300" },
  { value: "appealed", label: "Appealed", icon: AlertTriangle, color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
] as const;

const claimFormSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  invoiceId: z.string().optional(),
  insuranceProvider: z.string().min(1, "Insurance provider is required"),
  policyNumber: z.string().min(1, "Policy number is required"),
  subscriberName: z.string().optional(),
  subscriberDob: z.string().optional(),
  subscriberRelation: z.string().optional(),
  claimAmount: z.string().min(1, "Claim amount is required"),
  notes: z.string().optional(),
});

type ClaimFormValues = z.infer<typeof claimFormSchema>;

function ClaimDialog({
  open,
  onOpenChange,
  claim,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  claim?: InsuranceClaim | null;
}) {
  const { toast } = useToast();
  const isEditing = !!claim;

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      patientId: claim?.patientId || "",
      invoiceId: claim?.invoiceId || "",
      insuranceProvider: claim?.insuranceProvider || "",
      policyNumber: claim?.policyNumber || "",
      subscriberName: claim?.subscriberName || "",
      subscriberDob: claim?.subscriberDob || "",
      subscriberRelation: claim?.subscriberRelation || "",
      claimAmount: claim?.claimAmount || "",
      notes: claim?.notes || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ClaimFormValues) => {
      const cleanedData = {
        ...data,
        invoiceId: data.invoiceId || null,
        subscriberName: data.subscriberName || null,
        subscriberDob: data.subscriberDob || null,
        subscriberRelation: data.subscriberRelation || null,
        notes: data.notes || null,
      };
      const res = await apiRequest("POST", "/api/insurance-claims", cleanedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insurance-claims"] });
      toast({ title: "Claim created", description: "Insurance claim has been created successfully." });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ClaimFormValues) => {
      const cleanedData = {
        ...data,
        invoiceId: data.invoiceId || null,
        subscriberName: data.subscriberName || null,
        subscriberDob: data.subscriberDob || null,
        subscriberRelation: data.subscriberRelation || null,
        notes: data.notes || null,
      };
      const res = await apiRequest("PATCH", `/api/insurance-claims/${claim?.id}`, cleanedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insurance-claims"] });
      toast({ title: "Claim updated", description: "Insurance claim has been updated successfully." });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: ClaimFormValues) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const selectedPatient = patients?.find(p => p.id === form.watch("patientId"));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Insurance Claim" : "New Insurance Claim"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the claim details." : "Create a new insurance claim for a patient."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-patient">
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {patients?.map((patient) => (
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

            <FormField
              control={form.control}
              name="invoiceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice (Optional)</FormLabel>
                  <Select 
                    value={field.value || "__none__"} 
                    onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-invoice">
                        <SelectValue placeholder="Select invoice" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">No invoice</SelectItem>
                      {invoices?.filter(inv => inv.patientId === form.watch("patientId")).map((invoice) => (
                        <SelectItem key={invoice.id} value={invoice.id}>
                          {invoice.invoiceNumber} - ${invoice.finalAmount}
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
                name="insuranceProvider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance Provider *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Blue Cross" {...field} data-testid="input-provider" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="policyNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policy Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="Policy #" {...field} data-testid="input-policy" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="claimAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Claim Amount *</FormLabel>
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

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Subscriber Information (if different from patient)</h4>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="subscriberName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subscriber Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Primary insurance holder" {...field} data-testid="input-subscriber" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="subscriberDob"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-subscriber-dob" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subscriberRelation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-relation">
                              <SelectValue placeholder="Relation" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="self">Self</SelectItem>
                            <SelectItem value="spouse">Spouse</SelectItem>
                            <SelectItem value="child">Child</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

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
              <Button type="submit" disabled={isPending} data-testid="button-save-claim">
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? "Save Changes" : "Create Claim"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

type ClaimStatus = "draft" | "submitted" | "pending" | "approved" | "denied" | "paid" | "appealed";

function UpdateStatusDialog({
  open,
  onOpenChange,
  claim,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  claim: InsuranceClaim | null;
}) {
  const { toast } = useToast();
  const [status, setStatus] = useState<ClaimStatus>(claim?.status as ClaimStatus || "draft");
  const [approvedAmount, setApprovedAmount] = useState(claim?.approvedAmount || "");
  const [paidAmount, setPaidAmount] = useState(claim?.paidAmount || "");
  const [denialReason, setDenialReason] = useState(claim?.denialReason || "");

  const updateMutation = useMutation({
    mutationFn: async () => {
      const data: any = { 
        status,
        processedDate: status !== "draft" && status !== "submitted" ? format(new Date(), "yyyy-MM-dd") : null,
      };
      if (status === "submitted" && !claim?.submittedDate) {
        data.submittedDate = format(new Date(), "yyyy-MM-dd");
      }
      if (approvedAmount) data.approvedAmount = approvedAmount;
      if (paidAmount) data.paidAmount = paidAmount;
      if (denialReason) data.denialReason = denialReason;
      
      const res = await apiRequest("PATCH", `/api/insurance-claims/${claim?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insurance-claims"] });
      toast({ title: "Status updated", description: "Claim status has been updated." });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (!claim) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Claim Status</DialogTitle>
          <DialogDescription>
            Update the status for claim {claim.claimNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ClaimStatus)}>
              <SelectTrigger data-testid="select-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLAIM_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(status === "approved" || status === "paid") && (
            <div>
              <Label>Approved Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="0.00"
                  className="pl-9"
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                  data-testid="input-approved-amount"
                />
              </div>
            </div>
          )}

          {status === "paid" && (
            <div>
              <Label>Paid Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="0.00"
                  className="pl-9"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  data-testid="input-paid-amount"
                />
              </div>
            </div>
          )}

          {status === "denied" && (
            <div>
              <Label>Denial Reason</Label>
              <Textarea
                placeholder="Enter reason for denial..."
                value={denialReason}
                onChange={(e) => setDenialReason(e.target.value)}
                data-testid="input-denial-reason"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} data-testid="button-update-status">
            {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteClaimDialog({
  open,
  onOpenChange,
  claim,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  claim: InsuranceClaim | null;
}) {
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/insurance-claims/${claim?.id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insurance-claims"] });
      toast({ title: "Claim deleted", description: "Insurance claim has been deleted." });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (!claim) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Insurance Claim</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this claim? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm">
            <span className="font-medium">{claim.claimNumber}</span>
            <span className="text-muted-foreground"> - ${claim.claimAmount}</span>
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

type ClaimSortField = "date" | "patient" | "status" | "amount";
type SortDirection = "asc" | "desc";

export default function InsuranceClaimsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editClaim, setEditClaim] = useState<InsuranceClaim | null>(null);
  const [updateStatusClaim, setUpdateStatusClaim] = useState<InsuranceClaim | null>(null);
  const [deleteClaim, setDeleteClaim] = useState<InsuranceClaim | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<ClaimSortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const queryParams = useMemo(
    () => (statusFilter !== "all" ? { status: statusFilter } : {}),
    [statusFilter]
  );

  const { data: claims, isLoading } = useQuery<InsuranceClaim[]>({
    queryKey: ["/api/insurance-claims", queryParams],
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const formatCurrency = (amount: string | number | null | undefined) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(amount));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = CLAIM_STATUSES.find(s => s.value === status);
    if (!statusConfig) return null;
    const Icon = statusConfig.icon;
    return (
      <Badge className={statusConfig.color}>
        <Icon className="h-3 w-3 mr-1" />
        {statusConfig.label}
      </Badge>
    );
  };

  const getPatientName = (patientId: string) => {
    const patient = patients?.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : "Unknown";
  };

  const stats = useMemo(() => {
    if (!claims) return { total: 0, pending: 0, approved: 0, pendingAmount: 0 };
    return {
      total: claims.length,
      pending: claims.filter(c => c.status === "pending" || c.status === "submitted").length,
      approved: claims.filter(c => c.status === "approved" || c.status === "paid").length,
      pendingAmount: claims
        .filter(c => c.status === "pending" || c.status === "submitted")
        .reduce((sum, c) => sum + Number(c.claimAmount), 0),
    };
  }, [claims]);

  const handleSort = (field: ClaimSortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedClaims = useMemo(() => {
    if (!claims) return [];
    return [...claims].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "date":
          comparison = new Date(a.submissionDate || 0).getTime() - new Date(b.submissionDate || 0).getTime();
          break;
        case "patient":
          comparison = getPatientName(a.patientId).localeCompare(getPatientName(b.patientId));
          break;
        case "status":
          comparison = (a.status || "").localeCompare(b.status || "");
          break;
        case "amount":
          comparison = Number(a.claimAmount) - Number(b.claimAmount);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [claims, sortField, sortDirection, patients]);

  const SortHeader = ({ field, children }: { field: ClaimSortField; children: React.ReactNode }) => (
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

  return (
    <div className="flex-1 p-4 md:p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-claims-title">Insurance Claims</h1>
            <p className="text-muted-foreground">Track and manage insurance claim submissions</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-new-claim">
            <Plus className="h-4 w-4 mr-2" />
            New Claim
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-claims">
                {stats.total}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600" data-testid="text-pending-claims">
                {stats.pending}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="text-approved-claims">
                {stats.approved}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-pending-amount">
                {formatCurrency(stats.pendingAmount)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Claims</CardTitle>
              <CardDescription>All insurance claim submissions</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="status-filter">Status:</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40" id="status-filter" data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {CLAIM_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
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
            ) : claims && claims.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim #</TableHead>
                      <SortHeader field="patient">Patient</SortHeader>
                      <TableHead>Provider</TableHead>
                      <SortHeader field="status">Status</SortHeader>
                      <SortHeader field="amount">Claim Amount</SortHeader>
                      <TableHead className="text-right">Approved</TableHead>
                      <SortHeader field="date">Submitted</SortHeader>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedClaims.map((claim) => (
                      <TableRow key={claim.id} data-testid={`row-claim-${claim.id}`}>
                        <TableCell className="font-medium">{claim.claimNumber}</TableCell>
                        <TableCell>{getPatientName(claim.patientId)}</TableCell>
                        <TableCell>{claim.insuranceProvider}</TableCell>
                        <TableCell>{getStatusBadge(claim.status)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(claim.claimAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(claim.approvedAmount)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {claim.submittedDate ? format(new Date(claim.submittedDate), "MMM d, yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-claim-menu-${claim.id}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setUpdateStatusClaim(claim)}>
                                <Send className="h-4 w-4 mr-2" />
                                Update Status
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditClaim(claim)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteClaim(claim)}
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
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No insurance claims found</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setCreateDialogOpen(true)}
                  data-testid="button-add-first-claim"
                >
                  Create your first claim
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ClaimDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <ClaimDialog
        open={!!editClaim}
        onOpenChange={(open) => !open && setEditClaim(null)}
        claim={editClaim}
      />

      <UpdateStatusDialog
        open={!!updateStatusClaim}
        onOpenChange={(open) => !open && setUpdateStatusClaim(null)}
        claim={updateStatusClaim}
      />

      <DeleteClaimDialog
        open={!!deleteClaim}
        onOpenChange={(open) => !open && setDeleteClaim(null)}
        claim={deleteClaim}
      />
    </div>
  );
}
