import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { LabCaseWithPatient, Patient } from "@shared/schema";

const STATUS_CONFIG: Record<string, { icon: React.ComponentType<any>; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-amber-500", label: "Pending" },
  in_progress: { icon: FlaskConical, color: "text-blue-500", label: "In Progress" },
  completed: { icon: CheckCircle2, color: "text-emerald-500", label: "Completed" },
  delivered: { icon: Truck, color: "text-primary", label: "Delivered" },
};

const labCaseSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  caseType: z.string().min(1, "Case type is required"),
  labName: z.string().min(1, "Lab name is required"),
  sentDate: z.date({ required_error: "Sent date is required" }),
  expectedReturnDate: z.date().optional(),
  cost: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

type LabCaseFormValues = z.infer<typeof labCaseSchema>;

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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();

  const form = useForm<LabCaseFormValues>({
    resolver: zodResolver(labCaseSchema),
    defaultValues: {
      patientId: "",
      caseType: "",
      labName: "",
      sentDate: new Date(),
      cost: "",
      description: "",
      notes: "",
    },
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const createLabCaseMutation = useMutation({
    mutationFn: async (data: LabCaseFormValues) => {
      const res = await apiRequest("POST", "/api/lab-cases", {
        patientId: data.patientId,
        caseType: data.caseType,
        labName: data.labName,
        sentDate: data.sentDate.toISOString().split("T")[0],
        expectedReturnDate: data.expectedReturnDate?.toISOString().split("T")[0] || null,
        cost: data.cost || null,
        description: data.description || null,
        notes: data.notes || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lab-cases"] });
      toast({
        title: "Lab case created",
        description: "The lab case has been sent to the lab.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create lab case",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LabCaseFormValues) => {
    createLabCaseMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Lab Case</DialogTitle>
          <DialogDescription>
            Send a new case to an external dental lab.
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="caseType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Case Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
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
                name="labName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lab Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Lab name" {...field} />
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

            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost ($)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
                    <Textarea placeholder="Additional notes..." className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLabCaseMutation.isPending}>
                {createLabCaseMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Case"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function LabWorkPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: cases = [], isLoading } = useQuery<LabCaseWithPatient[]>({
    queryKey: ["/api/lab-cases"],
  });

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
        <Button onClick={() => setDialogOpen(true)}>
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
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
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
                  <Card key={labCase.id} className="hover-elevate">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
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
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
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

      <AddLabCaseDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
