import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Archive,
  Loader2,
  FlaskConical,
  Clock,
  CheckCircle2,
  Truck,
  CalendarIcon,
  Building2,
  Trash2,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
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
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { LabCaseWithPatient, Patient, ExternalLab, LabService } from "@shared/schema";

const STATUS_CONFIG: Record<string, { icon: React.ComponentType<any>; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-amber-500", label: "Pending" },
  in_progress: { icon: FlaskConical, color: "text-blue-500", label: "In Progress" },
  completed: { icon: CheckCircle2, color: "text-emerald-500", label: "Completed" },
  delivered: { icon: Truck, color: "text-primary", label: "Delivered" },
};

const labCaseSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  externalLabId: z.string().min(1, "Lab is required"),
  labServiceId: z.string().optional(),
  caseType: z.string().min(1, "Case type is required"),
  sentDate: z.date({ required_error: "Sent date is required" }),
  expectedReturnDate: z.date().optional(),
  status: z.string().optional(),
  isPaid: z.boolean().optional(),
  cost: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

type LabCaseFormValues = z.infer<typeof labCaseSchema>;

const externalLabSchema = z.object({
  name: z.string().min(1, "Lab name is required"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
});

type ExternalLabFormValues = z.infer<typeof externalLabSchema>;

const labServiceSchema = z.object({
  labId: z.string().min(1, "Lab is required"),
  name: z.string().min(1, "Service name is required"),
  description: z.string().optional(),
  price: z.string().min(1, "Price is required"),
});

type LabServiceFormValues = z.infer<typeof labServiceSchema>;

const CASE_TYPES = [
  "Crown",
  "Bridge",
  "Denture",
  "Veneer",
  "Implant Crown",
  "Night Guard",
  "Retainer",
  "Orthodontic Appliance",
  "Other",
];

function AddLabCaseDialog({
  open,
  onOpenChange,
  editCase,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editCase?: LabCaseWithPatient | null;
}) {
  const { toast } = useToast();

  const form = useForm<LabCaseFormValues>({
    resolver: zodResolver(labCaseSchema),
    defaultValues: {
      patientId: "",
      externalLabId: "",
      labServiceId: "",
      caseType: "",
      sentDate: new Date(),
      status: "pending",
      isPaid: false,
      cost: "",
      description: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (editCase) {
        form.reset({
          patientId: editCase.patientId,
          externalLabId: editCase.externalLabId || "",
          labServiceId: editCase.labServiceId || "",
          caseType: editCase.caseType,
          sentDate: editCase.sentDate ? new Date(editCase.sentDate) : new Date(),
          expectedReturnDate: editCase.expectedReturnDate ? new Date(editCase.expectedReturnDate) : undefined,
          status: editCase.status || "pending",
          isPaid: !!editCase.isPaid,
          cost: editCase.cost || "",
          description: editCase.description || "",
          notes: editCase.notes || "",
        });
      } else {
        form.reset({
          patientId: "",
          externalLabId: "",
          labServiceId: "",
          caseType: "",
          sentDate: new Date(),
          status: "pending",
          isPaid: false,
          cost: "",
          description: "",
          notes: "",
        });
      }
    }
  }, [open, editCase, form]);

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: labs = [] } = useQuery<ExternalLab[]>({
    queryKey: ["/api/external-labs"],
  });

  const selectedLabId = form.watch("externalLabId");

  const { data: labServices = [] } = useQuery<LabService[]>({
    queryKey: ["/api/external-labs", selectedLabId, "services"],
    queryFn: async () => {
      const res = await fetch(`/api/external-labs/${selectedLabId}/services`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch services");
      return res.json();
    },
    enabled: !!selectedLabId,
  });

  const createLabCaseMutation = useMutation({
    mutationFn: async (data: LabCaseFormValues) => {
      const selectedLab = labs.find(l => l.id === data.externalLabId);
      const payload = {
        patientId: data.patientId,
        externalLabId: data.externalLabId,
        labServiceId: data.labServiceId || null,
        caseType: data.caseType,
        labName: selectedLab?.name || "Unknown Lab",
        sentDate: data.sentDate.toISOString().split("T")[0],
        expectedReturnDate: data.expectedReturnDate?.toISOString().split("T")[0] || null,
        status: data.status,
        isPaid: data.isPaid,
        cost: data.cost || null,
        description: data.description || null,
        notes: data.notes || null,
      };

      if (editCase) {
        const res = await apiRequest("PATCH", `/api/lab-cases/${editCase.id}`, payload);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/lab-cases", payload);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lab-cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/external-labs"] });
      toast({
        title: editCase ? "Lab case updated" : "Lab case created",
        description: editCase ? "The lab case has been updated." : "The lab case has been sent to the lab.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: editCase ? "Failed to update lab case" : "Failed to create lab case",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLabChange = (labId: string) => {
    form.setValue("externalLabId", labId);
    form.setValue("labServiceId", "");
    form.setValue("cost", "");
  };

  const handleServiceChange = (serviceId: string) => {
    form.setValue("labServiceId", serviceId);
    const service = labServices.find(s => s.id === serviceId);
    if (service) {
      form.setValue("cost", service.price);
      form.setValue("caseType", service.name);
    }
  };

  const onSubmit = (data: LabCaseFormValues) => {
    createLabCaseMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editCase ? "Edit Lab Case" : "Create Lab Case"}</DialogTitle>
          <DialogDescription>
            {editCase ? "Update the lab case details." : "Send a new case to an external dental lab."}
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

            <FormField
              control={form.control}
              name="externalLabId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lab *</FormLabel>
                  <Select onValueChange={handleLabChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-lab">
                        <SelectValue placeholder="Select lab" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {labs.map((lab) => (
                        <SelectItem key={lab.id} value={lab.id}>
                          {lab.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedLabId && labServices.length > 0 && (
              <FormField
                control={form.control}
                name="labServiceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service</FormLabel>
                    <Select onValueChange={handleServiceChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-service">
                          <SelectValue placeholder="Select service (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {labServices.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} - ${service.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="caseType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Case Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-case-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CASE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
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
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-cost" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sentDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Sent Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="button-sent-date"
                          >
                            {field.value ? format(field.value, "PP") : "Pick date"}
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
                name="expectedReturnDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expected Return</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="button-expected-return"
                          >
                            {field.value ? format(field.value, "PP") : "Pick date"}
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-case-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                          <SelectItem key={status} value={status}>
                            {config.label}
                          </SelectItem>
                        ))}
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPaid"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-is-paid"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Paid</FormLabel>
                      <FormDescription>
                        Mark if lab fees are paid
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes..." className="resize-none" {...field} data-testid="input-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLabCaseMutation.isPending} data-testid="button-save-case">
                {createLabCaseMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editCase ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  editCase ? "Update Case" : "Create Case"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AddLabDialog({
  open,
  onOpenChange,
  editLab,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editLab?: ExternalLab | null;
}) {
  const { toast } = useToast();

  const form = useForm<ExternalLabFormValues>({
    resolver: zodResolver(externalLabSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      contactPerson: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: editLab?.name || "",
        phone: editLab?.phone || "",
        email: editLab?.email || "",
        address: editLab?.address || "",
        contactPerson: editLab?.contactPerson || "",
      });
    }
  }, [open, editLab, form]);

  const createLabMutation = useMutation({
    mutationFn: async (data: ExternalLabFormValues) => {
      if (editLab) {
        const res = await apiRequest("PATCH", `/api/external-labs/${editLab.id}`, data);
        return res.json();
      }
      const res = await apiRequest("POST", "/api/external-labs", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-labs"] });
      toast({
        title: editLab ? "Lab updated" : "Lab created",
        description: editLab ? "The lab has been updated." : "The lab has been added.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: editLab ? "Failed to update lab" : "Failed to create lab",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ExternalLabFormValues) => {
    createLabMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editLab ? "Edit Lab" : "Add External Lab"}</DialogTitle>
          <DialogDescription>
            {editLab ? "Update lab information." : "Add a new dental lab to your list."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lab Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Lab name" {...field} data-testid="input-lab-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone number" {...field} data-testid="input-lab-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Email" {...field} data-testid="input-lab-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Lab address" className="resize-none" {...field} data-testid="input-lab-address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>
                  <FormControl>
                    <Input placeholder="Contact person name" {...field} data-testid="input-lab-contact" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLabMutation.isPending} data-testid="button-save-lab">
                {createLabMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {editLab ? "Update Lab" : "Add Lab"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AddServiceDialog({
  open,
  onOpenChange,
  labs,
  preselectedLabId,
  editService,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labs: ExternalLab[];
  preselectedLabId?: string;
  editService?: LabService | null;
}) {
  const { toast } = useToast();

  const form = useForm<LabServiceFormValues>({
    resolver: zodResolver(labServiceSchema),
    defaultValues: {
      labId: "",
      name: "",
      description: "",
      price: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        labId: editService?.labId || preselectedLabId || "",
        name: editService?.name || "",
        description: editService?.description || "",
        price: editService?.price || "",
      });
    }
  }, [open, editService, preselectedLabId, form]);

  const createServiceMutation = useMutation({
    mutationFn: async (data: LabServiceFormValues) => {
      if (editService) {
        const res = await apiRequest("PATCH", `/api/lab-services/${editService.id}`, data);
        return res.json();
      }
      const res = await apiRequest("POST", "/api/lab-services", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lab-services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/external-labs"] });
      toast({
        title: editService ? "Service updated" : "Service created",
        description: editService ? "The service has been updated." : "The service has been added.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: editService ? "Failed to update service" : "Failed to create service",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LabServiceFormValues) => {
    createServiceMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editService ? "Edit Service" : "Add Lab Service"}</DialogTitle>
          <DialogDescription>
            {editService ? "Update service information." : "Add a new service to a lab."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="labId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lab *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!!preselectedLabId || !!editService}>
                    <FormControl>
                      <SelectTrigger data-testid="select-service-lab">
                        <SelectValue placeholder="Select lab" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {labs.map((lab) => (
                        <SelectItem key={lab.id} value={lab.id}>
                          {lab.name}
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Porcelain Crown" {...field} data-testid="input-service-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Service description" className="resize-none" {...field} data-testid="input-service-desc" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price ($) *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-service-price" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createServiceMutation.isPending} data-testid="button-save-service">
                {createServiceMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {editService ? "Update Service" : "Add Service"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ManageLabsTab() {
  const [labDialogOpen, setLabDialogOpen] = useState(false);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editLab, setEditLab] = useState<ExternalLab | null>(null);
  const [editService, setEditService] = useState<LabService | null>(null);
  const [selectedLabId, setSelectedLabId] = useState<string | undefined>(undefined);
  const [deleteLabDialog, setDeleteLabDialog] = useState<string | null>(null);
  const [deleteServiceDialog, setDeleteServiceDialog] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: labs = [], isLoading: labsLoading } = useQuery<ExternalLab[]>({
    queryKey: ["/api/external-labs"],
  });

  const { data: allServices = [] } = useQuery<LabService[]>({
    queryKey: ["/api/lab-services"],
  });

  const deleteLabMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/external-labs/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-labs"] });
      toast({ title: "Lab deleted", description: "The lab has been removed." });
      setDeleteLabDialog(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete lab", description: error.message, variant: "destructive" });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/lab-services/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lab-services"] });
      toast({ title: "Service deleted", description: "The service has been removed." });
      setDeleteServiceDialog(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete service", description: error.message, variant: "destructive" });
    },
  });

  const handleEditLab = (lab: ExternalLab) => {
    setEditLab(lab);
    setLabDialogOpen(true);
  };

  const handleAddService = (labId: string) => {
    setSelectedLabId(labId);
    setEditService(null);
    setServiceDialogOpen(true);
  };

  const handleEditService = (service: LabService) => {
    setEditService(service);
    setSelectedLabId(service.labId);
    setServiceDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">External Labs</h2>
          <p className="text-sm text-muted-foreground">Manage your dental labs and their services</p>
        </div>
        <Button onClick={() => { setEditLab(null); setLabDialogOpen(true); }} data-testid="button-add-lab">
          <Plus className="h-4 w-4 mr-2" />
          Add Lab
        </Button>
      </div>

      {labsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : labs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Building2 className="h-16 w-16 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-1">No labs added yet</h3>
            <p className="text-sm mb-4">Add external dental labs to manage their services</p>
            <Button onClick={() => setLabDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Lab
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {labs.map((lab) => {
            const labServices = allServices.filter(s => s.labId === lab.id);
            return (
              <Card key={lab.id} data-testid={`card-lab-${lab.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {lab.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{lab.name}</CardTitle>
                        {lab.contactPerson && (
                          <CardDescription>{lab.contactPerson}</CardDescription>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`button-lab-menu-${lab.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditLab(lab)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Lab
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAddService(lab.id)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Service
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setDeleteLabDialog(lab.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Lab
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(lab.phone || lab.email) && (
                    <div className="text-sm text-muted-foreground">
                      {lab.phone && <p>{lab.phone}</p>}
                      {lab.email && <p>{lab.email}</p>}
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-medium">Services ({labServices.length})</h4>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleAddService(lab.id)}
                        data-testid={`button-add-service-${lab.id}`}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                    {labServices.length > 0 ? (
                      <div className="space-y-1">
                        {labServices.map((service) => (
                          <div 
                            key={service.id} 
                            className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50 hover-elevate"
                            data-testid={`service-${service.id}`}
                          >
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{service.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">${service.price}</Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditService(service)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => setDeleteServiceDialog(service.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No services defined</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AddLabDialog 
        open={labDialogOpen} 
        onOpenChange={(open) => { setLabDialogOpen(open); if (!open) setEditLab(null); }} 
        editLab={editLab}
      />

      <AddServiceDialog
        open={serviceDialogOpen}
        onOpenChange={(open) => { setServiceDialogOpen(open); if (!open) { setEditService(null); setSelectedLabId(undefined); } }}
        labs={labs}
        preselectedLabId={selectedLabId}
        editService={editService}
      />

      <AlertDialog open={!!deleteLabDialog} onOpenChange={() => setDeleteLabDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lab</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lab? This will also remove all its services.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteLabDialog && deleteLabMutation.mutate(deleteLabDialog)}
              className="bg-destructive text-destructive-foreground"
            >
              {deleteLabMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteServiceDialog} onOpenChange={() => setDeleteServiceDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this service?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteServiceDialog && deleteServiceMutation.mutate(deleteServiceDialog)}
              className="bg-destructive text-destructive-foreground"
            >
              {deleteServiceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function LabWorkPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCase, setEditCase] = useState<LabCaseWithPatient | null>(null);
  const [activeTab, setActiveTab] = useState("cases");

  const { data: cases = [], isLoading } = useQuery<LabCaseWithPatient[]>({
    queryKey: ["/api/lab-cases"],
  });

  const handleEditCase = (labCase: LabCaseWithPatient) => {
    setEditCase(labCase);
    setDialogOpen(true);
  };

  const filteredCases = cases.filter((labCase) => {
    const matchesSearch =
      !searchTerm ||
      labCase.patient?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      labCase.patient?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      labCase.labName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      labCase.caseType?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || labCase.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    pending: cases.filter((c) => c.status === "pending").length,
    in_progress: cases.filter((c) => c.status === "in_progress").length,
    completed: cases.filter((c) => c.status === "completed").length,
    delivered: cases.filter((c) => c.status === "delivered").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lab Work</h1>
          <p className="text-muted-foreground">
            Track cases sent to external dental labs
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="cases" data-testid="tab-cases">Lab Cases</TabsTrigger>
          <TabsTrigger value="labs" data-testid="tab-labs">Manage Labs</TabsTrigger>
        </TabsList>

        <TabsContent value="cases" className="mt-6 space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setDialogOpen(true)} data-testid="button-new-case">
              <Plus className="h-4 w-4 mr-2" />
              New Lab Case
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {Object.entries(STATUS_CONFIG).map(([status, config]) => {
              const Icon = config.icon;
              return (
                <Card
                  key={status}
                  className={cn(
                    "cursor-pointer transition-colors",
                    statusFilter === status && "ring-2 ring-primary"
                  )}
                  onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
                  data-testid={`card-status-${status}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Icon className={cn("h-5 w-5", config.color)} />
                      <div>
                        <p className="text-2xl font-bold">
                          {statusCounts[status as keyof typeof statusCounts]}
                        </p>
                        <p className="text-xs text-muted-foreground">{config.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search lab cases..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="input-search"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]" data-testid="select-status-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredCases.length > 0 ? (
                <div className="space-y-3">
                  {filteredCases.map((labCase) => {
                    const statusConfig = STATUS_CONFIG[labCase.status || "pending"];
                    const StatusIcon = statusConfig.icon;
                    const initials = labCase.patient
                      ? `${labCase.patient.firstName?.charAt(0)}${labCase.patient.lastName?.charAt(0)}`
                      : "?";

                    return (
                      <Card key={labCase.id} className="hover-elevate" data-testid={`card-case-${labCase.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={labCase.patient?.photoUrl || undefined} alt={`${labCase.patient?.firstName} ${labCase.patient?.lastName}`} />
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {initials}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">
                                  {labCase.patient?.firstName} {labCase.patient?.lastName}
                                </p>
                                <Badge variant="outline">{labCase.caseType}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {labCase.labName} • Sent {labCase.sentDate && format(new Date(labCase.sentDate), "MMM d")}
                              </p>
                            </div>

                            <div className="text-right">
                              <div className="flex items-center gap-1.5">
                                <StatusIcon className={cn("h-4 w-4", statusConfig.color)} />
                                <span className="text-sm font-medium">{statusConfig.label}</span>
                              </div>
                              {labCase.expectedReturnDate && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Due: {format(new Date(labCase.expectedReturnDate), "MMM d")}
                                </p>
                              )}
                            </div>

                            {labCase.cost && (
                              <div className="text-right">
                                <p className="font-medium">${labCase.cost}</p>
                                <Badge variant={labCase.isPaid ? "default" : "secondary"} className="text-xs">
                                  {labCase.isPaid ? "Paid" : "Unpaid"}
                                </Badge>
                              </div>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" data-testid={`button-case-menu-${labCase.id}`}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditCase(labCase)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
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
                  <FlaskConical className="h-16 w-16 mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-1">No lab cases found</h3>
                  <p className="text-sm mb-4">Create a new lab case to track external work</p>
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Lab Case
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="labs" className="mt-6">
          <ManageLabsTab />
        </TabsContent>
      </Tabs>

      <AddLabCaseDialog 
        open={dialogOpen} 
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditCase(null);
        }} 
        editCase={editCase}
      />
    </div>
  );
}
