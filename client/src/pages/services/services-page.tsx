import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  ClipboardList,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Treatment } from "@shared/schema";

const CATEGORIES = [
  { value: "endodontics", label: "Endodontics" },
  { value: "restorative", label: "Restorative" },
  { value: "preventative", label: "Preventative" },
  { value: "fixed_prosthodontics", label: "Fixed Prosthodontics" },
  { value: "removable_prosthodontics", label: "Removable Prosthodontics" },
  { value: "surgery", label: "Surgery" },
  { value: "orthodontics", label: "Orthodontics" },
  { value: "periodontics", label: "Periodontics" },
  { value: "cosmetic", label: "Cosmetic" },
  { value: "diagnostics", label: "Diagnostics" },
  { value: "pediatric", label: "Pediatric" },
];

const serviceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  cost: z.string().min(1, "Cost is required"),
  defaultPrice: z.string().min(1, "Price is required"),
  durationMinutes: z.number().min(5, "Minimum duration is 5 minutes"),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

function AddServiceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      cost: "0",
      defaultPrice: "",
      durationMinutes: 30,
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: async (data: ServiceFormValues) => {
      const res = await apiRequest("POST", "/api/treatments", {
        name: data.name,
        category: data.category,
        description: data.description || null,
        cost: data.cost,
        defaultPrice: data.defaultPrice,
        durationMinutes: data.durationMinutes,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/treatments"] });
      toast({
        title: "Service added",
        description: "The service has been added to your catalog.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add service",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ServiceFormValues) => {
    createServiceMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Service</DialogTitle>
          <DialogDescription>
            Add a new dental service to your catalog.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Root Canal Treatment"
                      {...field}
                      data-testid="input-service-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-service-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost ($) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        data-testid="input-service-cost"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        data-testid="input-service-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="durationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (min)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      data-testid="input-service-duration"
                    />
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
                    <Textarea
                      placeholder="Service description..."
                      className="resize-none"
                      {...field}
                      data-testid="input-service-description"
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
              <Button
                type="submit"
                disabled={createServiceMutation.isPending}
                data-testid="button-save-service"
              >
                {createServiceMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Add Service"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function EditServiceDialog({
  service,
  open,
  onOpenChange,
}: {
  service: Treatment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    values: service
      ? {
          name: service.name,
          category: service.category,
          description: service.description || "",
          cost: service.cost || "0",
          defaultPrice: service.defaultPrice,
          durationMinutes: service.durationMinutes || 30,
        }
      : {
          name: "",
          category: "",
          description: "",
          cost: "0",
          defaultPrice: "",
          durationMinutes: 30,
        },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async (data: ServiceFormValues) => {
      const res = await apiRequest("PATCH", `/api/treatments/${service?.id}`, {
        name: data.name,
        category: data.category,
        description: data.description || null,
        cost: data.cost,
        defaultPrice: data.defaultPrice,
        durationMinutes: data.durationMinutes,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/treatments"] });
      toast({
        title: "Service updated",
        description: "The service has been updated successfully.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update service",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ServiceFormValues) => {
    updateServiceMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Service</DialogTitle>
          <DialogDescription>
            Update this dental service in your catalog.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Root Canal Treatment"
                      {...field}
                      data-testid="input-edit-service-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-edit-service-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost ($) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        data-testid="input-edit-service-cost"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        data-testid="input-edit-service-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="durationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (min)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      data-testid="input-edit-service-duration"
                    />
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
                    <Textarea
                      placeholder="Service description..."
                      className="resize-none"
                      {...field}
                      data-testid="input-edit-service-description"
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
              <Button
                type="submit"
                disabled={updateServiceMutation.isPending}
                data-testid="button-update-service"
              >
                {updateServiceMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Update Service"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteServiceDialog({
  service,
  open,
  onOpenChange,
}: {
  service: Treatment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();

  const deleteServiceMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/treatments/${service?.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/treatments"] });
      toast({
        title: "Service deleted",
        description: "The service has been removed from your catalog.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete service",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Service</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{service?.name}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteServiceMutation.mutate()}
            className="bg-destructive text-destructive-foreground"
            data-testid="button-confirm-delete-service"
          >
            {deleteServiceMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function calculateProfit(price: string | null, cost: string | null): number {
  const priceNum = parseFloat(price || "0");
  const costNum = parseFloat(cost || "0");
  return priceNum - costNum;
}

function printServices(services: Treatment[]) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const categoryServices = services.filter((s) => s.category === cat.value);
    if (categoryServices.length > 0) {
      acc[cat.label] = categoryServices;
    }
    return acc;
  }, {} as Record<string, Treatment[]>);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Services Price List</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          padding: 20px;
          max-width: 900px;
          margin: 0 auto;
        }
        h1 { text-align: center; margin-bottom: 30px; }
        h2 { 
          margin-top: 30px; 
          padding-bottom: 8px;
          border-bottom: 2px solid #333;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th, td {
          padding: 10px 8px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th { 
          background: #f5f5f5;
          font-weight: 600;
        }
        .text-right { text-align: right; }
        .code { 
          font-family: monospace;
          font-size: 0.85em;
          color: #666;
        }
        .profit-positive { color: #16a34a; }
        .profit-negative { color: #dc2626; }
        @media print {
          body { padding: 0; }
          h2 { page-break-after: avoid; }
        }
      </style>
    </head>
    <body>
      <h1>Services Price List</h1>
      <p style="text-align: center; color: #666;">Generated on ${new Date().toLocaleDateString()}</p>
      ${Object.entries(grouped)
        .map(
          ([category, categoryServices]) => `
        <h2>${category}</h2>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Service</th>
              <th>Duration</th>
              <th class="text-right">Cost</th>
              <th class="text-right">Price</th>
              <th class="text-right">Profit</th>
            </tr>
          </thead>
          <tbody>
            ${categoryServices
              .map((s) => {
                const profit = calculateProfit(s.defaultPrice, s.cost);
                const profitClass = profit >= 0 ? "profit-positive" : "profit-negative";
                return `
              <tr>
                <td class="code">${s.code}</td>
                <td>${s.name}</td>
                <td>${s.durationMinutes} min</td>
                <td class="text-right">$${parseFloat(s.cost || "0").toFixed(2)}</td>
                <td class="text-right">$${parseFloat(s.defaultPrice).toFixed(2)}</td>
                <td class="text-right ${profitClass}">$${profit.toFixed(2)}</td>
              </tr>
            `;
              })
              .join("")}
          </tbody>
        </table>
      `
        )
        .join("")}
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
}

export default function ServicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Treatment | null>(null);

  const { data: services = [], isLoading } = useQuery<Treatment[]>({
    queryKey: ["/api/treatments"],
  });

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      !searchTerm ||
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || service.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (service: Treatment) => {
    setSelectedService(service);
    setEditDialogOpen(true);
  };

  const handleDelete = (service: Treatment) => {
    setSelectedService(service);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Services & Price List</h1>
          <p className="text-muted-foreground">
            Manage your dental services catalog
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => printServices(filteredServices)}
            data-testid="button-print-services"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={() => setDialogOpen(true)} data-testid="button-add-service">
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-service-search"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-category-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
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
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredServices.length > 0 ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Service Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => {
                    const profit = calculateProfit(service.defaultPrice, service.cost);
                    return (
                      <TableRow key={service.id} data-testid={`row-service-${service.id}`}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {service.code}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{service.name}</p>
                            {service.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {service.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {service.category?.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>{service.durationMinutes} min</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          ${Number(service.cost || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${Number(service.defaultPrice).toFixed(2)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            profit >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          ${profit.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                data-testid={`button-service-menu-${service.id}`}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEdit(service)}
                                data-testid={`button-edit-service-${service.id}`}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(service)}
                                className="text-destructive"
                                data-testid={`button-delete-service-${service.id}`}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ClipboardList className="h-16 w-16 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-1">No services found</h3>
              <p className="text-sm mb-4">
                {searchTerm || categoryFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first service"}
              </p>
              {!searchTerm && categoryFilter === "all" && (
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AddServiceDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <EditServiceDialog
        service={selectedService}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
      <DeleteServiceDialog
        service={selectedService}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </div>
  );
}
