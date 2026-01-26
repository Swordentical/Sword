import { useState, useEffect } from "react";
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
  Package,
  AlertTriangle,
  Printer,
  Minus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { ExportDropdown } from "@/components/export-dropdown";
import glazerLogo from "@/assets/glazer-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { cn } from "@/lib/utils";
import type { InventoryItem } from "@shared/schema";

const CATEGORIES = [
  { value: "consumables", label: "Consumables" },
  { value: "equipment", label: "Equipment" },
  { value: "instruments", label: "Instruments" },
  { value: "medications", label: "Medications" },
  { value: "office_supplies", label: "Office Supplies" },
];

const inventorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  currentQuantity: z.number().min(0, "Quantity must be positive"),
  minimumQuantity: z.number().min(1, "Minimum quantity is required"),
  unit: z.string().min(1, "Unit is required"),
  unitCost: z.string().optional(),
  supplier: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
});

type InventoryFormValues = z.infer<typeof inventorySchema>;

function getStockStatus(current: number, minimum: number) {
  if (current === 0) return { status: "out_of_stock", label: "Out of Stock", color: "destructive" as const };
  if (current <= minimum) return { status: "low_stock", label: "Low Stock", color: "secondary" as const };
  return { status: "available", label: "Available", color: "default" as const };
}

function AddInventoryDialog({
  open,
  onOpenChange,
  editItem,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: InventoryItem | null;
}) {
  const { toast } = useToast();

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      name: "",
      category: "",
      currentQuantity: 0,
      minimumQuantity: 5,
      unit: "pcs",
      unitCost: "",
      supplier: "",
      location: "",
      description: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (editItem) {
        form.reset({
          name: editItem.name,
          category: editItem.category,
          currentQuantity: editItem.currentQuantity,
          minimumQuantity: editItem.minimumQuantity,
          unit: editItem.unit,
          unitCost: editItem.unitCost || "",
          supplier: editItem.supplier || "",
          location: editItem.location || "",
          description: editItem.description || "",
        });
      } else {
        form.reset({
          name: "",
          category: "",
          currentQuantity: 0,
          minimumQuantity: 5,
          unit: "pcs",
          unitCost: "",
          supplier: "",
          location: "",
          description: "",
        });
      }
    }
  }, [open, editItem, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: InventoryFormValues) => {
      const payload = {
        name: data.name,
        category: data.category,
        currentQuantity: data.currentQuantity,
        minimumQuantity: data.minimumQuantity,
        unit: data.unit,
        unitCost: data.unitCost || null,
        supplier: data.supplier || null,
        location: data.location || null,
        description: data.description || null,
      };

      if (editItem) {
        const res = await apiRequest("PATCH", `/api/inventory/${editItem.id}`, payload);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/inventory", payload);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      toast({
        title: editItem ? "Item updated" : "Item added",
        description: editItem ? "The inventory item has been updated." : "The inventory item has been added.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: editItem ? "Failed to update item" : "Failed to add item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InventoryFormValues) => {
    saveMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editItem ? "Edit Inventory Item" : "Add Inventory Item"}</DialogTitle>
          <DialogDescription>
            {editItem ? "Update the inventory item details." : "Add a new item to your inventory."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Dental Gloves" {...field} data-testid="input-item-name" />
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select" />
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

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-unit">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pcs">Pieces</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="pack">Pack</SelectItem>
                        <SelectItem value="set">Set</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="g">g</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currentQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Qty *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        data-testid="input-current-qty"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minimumQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Qty *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        data-testid="input-min-qty"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unitCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Cost ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-unit-cost" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Cabinet A" {...field} data-testid="input-location" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <FormControl>
                    <Input placeholder="Supplier name" {...field} data-testid="input-supplier" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-item">
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editItem ? "Updating..." : "Saving..."}
                  </>
                ) : (
                  editItem ? "Update Item" : "Add Item"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function UpdateQuantityDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
}) {
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(0);
  const [adjustment, setAdjustment] = useState<"add" | "subtract" | "set">("add");

  useEffect(() => {
    if (open && item) {
      setQuantity(0);
      setAdjustment("add");
    }
  }, [open, item]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!item) return;
      
      let newQuantity = item.currentQuantity;
      if (adjustment === "add") {
        newQuantity = item.currentQuantity + quantity;
      } else if (adjustment === "subtract") {
        newQuantity = Math.max(0, item.currentQuantity - quantity);
      } else {
        newQuantity = quantity;
      }

      const res = await apiRequest("PATCH", `/api/inventory/${item.id}`, {
        currentQuantity: newQuantity,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      toast({
        title: "Quantity updated",
        description: "The inventory quantity has been updated.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update quantity",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Update Quantity</DialogTitle>
          <DialogDescription>
            Adjust the stock level for {item.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Current Stock</p>
            <p className="text-3xl font-bold">{item.currentQuantity} {item.unit}</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={adjustment === "add" ? "default" : "outline"}
              onClick={() => setAdjustment("add")}
              data-testid="button-add-qty"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
            <Button
              variant={adjustment === "subtract" ? "default" : "outline"}
              onClick={() => setAdjustment("subtract")}
              data-testid="button-subtract-qty"
            >
              <Minus className="h-4 w-4 mr-1" />
              Remove
            </Button>
            <Button
              variant={adjustment === "set" ? "default" : "outline"}
              onClick={() => setAdjustment("set")}
              data-testid="button-set-qty"
            >
              Set
            </Button>
          </div>

          <div>
            <label className="text-sm font-medium">
              {adjustment === "add" ? "Add Amount" : adjustment === "subtract" ? "Remove Amount" : "New Quantity"}
            </label>
            <Input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="mt-1"
              data-testid="input-qty-amount"
            />
          </div>

          {adjustment !== "set" && quantity > 0 && (
            <div className="text-center p-2 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground">New Stock Level</p>
              <p className="text-xl font-bold">
                {adjustment === "add" 
                  ? item.currentQuantity + quantity 
                  : Math.max(0, item.currentQuantity - quantity)} {item.unit}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => updateMutation.mutate()} 
            disabled={updateMutation.isPending || (adjustment !== "set" && quantity === 0)}
            data-testid="button-confirm-qty"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Confirm"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PrintLowStockDialog({
  open,
  onOpenChange,
  items,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItem[];
}) {
  const lowStockItems = items.filter(
    (item) => item.currentQuantity <= item.minimumQuantity
  );

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Low Stock Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .out-of-stock { background-color: #fee2e2; }
            .low-stock { background-color: #fef3c7; }
            .footer { margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h1>Low Stock & Out of Stock Items</h1>
          <p>Report generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Current Qty</th>
                <th>Min Qty</th>
                <th>Unit</th>
                <th>Status</th>
                <th>Supplier</th>
              </tr>
            </thead>
            <tbody>
              ${lowStockItems.map(item => {
                const isOutOfStock = item.currentQuantity === 0;
                return `
                  <tr class="${isOutOfStock ? 'out-of-stock' : 'low-stock'}">
                    <td>${item.name}</td>
                    <td>${item.category?.replace(/_/g, " ") || ""}</td>
                    <td>${item.currentQuantity}</td>
                    <td>${item.minimumQuantity}</td>
                    <td>${item.unit}</td>
                    <td>${isOutOfStock ? 'OUT OF STOCK' : 'Low Stock'}</td>
                    <td>${item.supplier || "-"}</td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
          <div class="footer">
            <p>Total items needing attention: ${lowStockItems.length}</p>
            <p>Out of stock: ${lowStockItems.filter(i => i.currentQuantity === 0).length}</p>
            <p>Low stock: ${lowStockItems.filter(i => i.currentQuantity > 0).length}</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Print Low Stock Report</DialogTitle>
          <DialogDescription>
            Generate a printable report of items that need to be restocked.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-64 overflow-y-auto">
          {lowStockItems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Min</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.map((item) => {
                  const stockStatus = getStockStatus(item.currentQuantity, item.minimumQuantity);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.currentQuantity} {item.unit}</TableCell>
                      <TableCell>{item.minimumQuantity} {item.unit}</TableCell>
                      <TableCell>
                        <Badge variant={stockStatus.color}>{stockStatus.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>All items are well stocked!</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handlePrint} disabled={lowStockItems.length === 0} data-testid="button-print-report">
            <Printer className="h-4 w-4 mr-2" />
            Print Report ({lowStockItems.length} items)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type InventorySortField = "name" | "category" | "quantity" | "price";
type SortDirection = "asc" | "desc";

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false);
  const [quantityItem, setQuantityItem] = useState<InventoryItem | null>(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [sortField, setSortField] = useState<InventorySortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const { toast } = useToast();

  const { data: items = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/inventory/${id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      toast({
        title: "Item deleted",
        description: "The inventory item has been deleted.",
      });
      setDeleteDialogOpen(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditItem = (item: InventoryItem) => {
    setEditItem(item);
    setDialogOpen(true);
  };

  const handleUpdateQuantity = (item: InventoryItem) => {
    setQuantityItem(item);
    setQuantityDialogOpen(true);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const stockStatus = getStockStatus(item.currentQuantity, item.minimumQuantity);
    const matchesStatus = statusFilter === "all" || stockStatus.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleSort = (field: InventorySortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedItems = [...filteredItems].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "name":
        comparison = (a.name || "").localeCompare(b.name || "");
        break;
      case "category":
        comparison = (a.category || "").localeCompare(b.category || "");
        break;
      case "quantity":
        comparison = a.currentQuantity - b.currentQuantity;
        break;
      case "price":
        comparison = Number(a.unitPrice || 0) - Number(b.unitPrice || 0);
        break;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const lowStockCount = items.filter(
    (item) => item.currentQuantity <= item.minimumQuantity && item.currentQuantity > 0
  ).length;
  const outOfStockCount = items.filter((item) => item.currentQuantity === 0).length;

  const handleExportHTML = () => {
    const groupedByCategory = filteredItems.reduce((acc: Record<string, typeof filteredItems>, item) => {
      const cat = item.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>GLAZER - Inventory Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f8fafc; padding: 40px; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #12a3b0; }
    .logo { height: 60px; margin-bottom: 10px; }
    .brand { font-size: 28px; font-weight: bold; background: linear-gradient(90deg, #12a3b0, #2089de, #9b59b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .subtitle { color: #64748b; font-size: 14px; margin-top: 5px; }
    .stats { display: flex; gap: 20px; margin-bottom: 30px; justify-content: center; }
    .stat-card { background: white; padding: 15px 25px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #1e293b; }
    .stat-label { font-size: 12px; color: #64748b; }
    .stat-warning { color: #f59e0b; }
    .stat-danger { color: #ef4444; }
    .category-section { margin-bottom: 30px; }
    .category-title { font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 15px; padding: 10px; background: linear-gradient(90deg, #12a3b0, #2089de); color: white; border-radius: 6px; text-transform: capitalize; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px; }
    th { background: #f1f5f9; color: #475569; font-weight: 600; text-align: left; padding: 12px 15px; font-size: 12px; text-transform: uppercase; }
    td { padding: 12px 15px; border-top: 1px solid #e2e8f0; }
    tr:hover { background: #f8fafc; }
    .status-ok { color: #16a34a; }
    .status-low { color: #f59e0b; }
    .status-out { color: #ef4444; font-weight: 600; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
    @media print { body { padding: 20px; } .stats { flex-wrap: wrap; } }
  </style>
</head>
<body>
  <div class="header">
    <img src="${glazerLogo}" class="logo" alt="GLAZER" onerror="this.style.display='none'" />
    <div class="brand">GLAZER</div>
    <div class="subtitle">Inventory Report | Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
  </div>
  <div class="stats">
    <div class="stat-card">
      <div class="stat-value">${items.length}</div>
      <div class="stat-label">Total Items</div>
    </div>
    <div class="stat-card">
      <div class="stat-value stat-warning">${lowStockCount}</div>
      <div class="stat-label">Low Stock</div>
    </div>
    <div class="stat-card">
      <div class="stat-value stat-danger">${outOfStockCount}</div>
      <div class="stat-label">Out of Stock</div>
    </div>
  </div>
  ${Object.entries(groupedByCategory).map(([category, categoryItems]) => `
    <div class="category-section">
      <div class="category-title">${category.replace(/_/g, ' ')}</div>
      <table>
        <thead>
          <tr>
            <th>Item Name</th>
            <th>Location</th>
            <th>Supplier</th>
            <th style="text-align: right">Quantity</th>
            <th style="text-align: right">Min. Qty</th>
            <th style="text-align: right">Unit Cost</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${(categoryItems as typeof filteredItems).map(item => {
            const status = item.currentQuantity === 0 ? 'out' : item.currentQuantity <= item.minimumQuantity ? 'low' : 'ok';
            const statusText = status === 'out' ? 'Out of Stock' : status === 'low' ? 'Low Stock' : 'In Stock';
            return `
              <tr>
                <td>${item.name}</td>
                <td>${item.location || '-'}</td>
                <td>${item.supplier || '-'}</td>
                <td style="text-align: right">${item.currentQuantity} ${item.unit}</td>
                <td style="text-align: right">${item.minimumQuantity} ${item.unit}</td>
                <td style="text-align: right">$${Number(item.unitCost).toFixed(2)}</td>
                <td class="status-${status}">${statusText}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `).join('')}
  <div class="footer">
    <p>GLAZER - Dental Clinic Management System</p>
    <p>This document was generated automatically. For questions, contact your administrator.</p>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintInventory = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>GLAZER - Inventory</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; padding: 20px; }
    h1 { text-align: center; color: #12a3b0; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f1f5f9; }
    .low { color: #f59e0b; }
    .out { color: #ef4444; font-weight: bold; }
  </style>
</head>
<body>
  <h1>GLAZER - Inventory Report</h1>
  <p style="text-align: center; color: #666;">Generated: ${new Date().toLocaleDateString()}</p>
  <table>
    <tr>
      <th>Name</th>
      <th>Category</th>
      <th>Quantity</th>
      <th>Min. Qty</th>
      <th>Unit Cost</th>
      <th>Status</th>
    </tr>
    ${filteredItems.map(item => {
      const status = item.currentQuantity === 0 ? 'out' : item.currentQuantity <= item.minimumQuantity ? 'low' : '';
      const statusText = item.currentQuantity === 0 ? 'Out of Stock' : item.currentQuantity <= item.minimumQuantity ? 'Low Stock' : 'In Stock';
      return `<tr>
        <td>${item.name}</td>
        <td>${item.category}</td>
        <td>${item.currentQuantity} ${item.unit}</td>
        <td>${item.minimumQuantity}</td>
        <td>$${Number(item.unitCost).toFixed(2)}</td>
        <td class="${status}">${statusText}</td>
      </tr>`;
    }).join('')}
  </table>
</body>
</html>`);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground">
            Manage your clinic's supplies and materials
          </p>
        </div>
        <div className="flex gap-2">
          <ExportDropdown
            onExportHTML={handleExportHTML}
            onExportJSON={() => {
              const jsonContent = JSON.stringify(filteredItems, null, 2);
              const blob = new Blob([jsonContent], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `inventory-${new Date().toISOString().split('T')[0]}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            onPrint={handlePrintInventory}
            data={filteredItems}
            filename="inventory-report"
          />
          <Button variant="outline" onClick={() => setPrintDialogOpen(true)} data-testid="button-print-low-stock">
            <Printer className="h-4 w-4 mr-2" />
            Print Low Stock
          </Button>
          <Button onClick={() => { setEditItem(null); setDialogOpen(true); }} data-testid="button-add-item">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{items.length}</p>
                <p className="text-xs text-muted-foreground">Total Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={cn("cursor-pointer hover-elevate", statusFilter === "low_stock" && "ring-2 ring-amber-500")}
          onClick={() => setStatusFilter(statusFilter === "low_stock" ? "all" : "low_stock")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{lowStockCount}</p>
                <p className="text-xs text-muted-foreground">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={cn("cursor-pointer hover-elevate", statusFilter === "out_of_stock" && "ring-2 ring-destructive")}
          onClick={() => setStatusFilter(statusFilter === "out_of_stock" ? "all" : "out_of_stock")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Package className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{outOfStockCount}</p>
                <p className="text-xs text-muted-foreground">Out of Stock</p>
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
                placeholder="Search items..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search"
              />
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]" data-testid="select-category-filter">
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
              <Select value={`${sortField}-${sortDirection}`} onValueChange={(v) => {
                const [field, dir] = v.split("-") as [InventorySortField, SortDirection];
                setSortField(field);
                setSortDirection(dir);
              }}>
                <SelectTrigger className="w-[150px]" data-testid="select-sort">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name A-Z</SelectItem>
                  <SelectItem value="name-desc">Name Z-A</SelectItem>
                  <SelectItem value="quantity-asc">Quantity Low-High</SelectItem>
                  <SelectItem value="quantity-desc">Quantity High-Low</SelectItem>
                  <SelectItem value="category-asc">Category A-Z</SelectItem>
                  <SelectItem value="price-asc">Price Low-High</SelectItem>
                  <SelectItem value="price-desc">Price High-Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sortedItems.length > 0 ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((item) => {
                    const stockStatus = getStockStatus(item.currentQuantity, item.minimumQuantity);
                    const stockPercent = Math.min((item.currentQuantity / item.minimumQuantity) * 50, 100);
                    return (
                      <TableRow key={item.id} data-testid={`row-item-${item.id}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            {item.supplier && (
                              <p className="text-xs text-muted-foreground">{item.supplier}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {item.category?.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="w-32 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>{item.currentQuantity}</span>
                              <span className="text-muted-foreground">
                                min: {item.minimumQuantity}
                              </span>
                            </div>
                            <Progress
                              value={stockPercent}
                              className={cn(
                                "h-1.5",
                                stockStatus.status === "out_of_stock" && "[&>div]:bg-destructive",
                                stockStatus.status === "low_stock" && "[&>div]:bg-amber-500"
                              )}
                            />
                          </div>
                        </TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>
                          <Badge variant={stockStatus.color}>{stockStatus.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-item-menu-${item.id}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleUpdateQuantity(item)}>
                                <Package className="h-4 w-4 mr-2" />
                                Update Quantity
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditItem(item)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setDeleteDialogOpen(item.id)}
                                className="text-destructive"
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
              <Package className="h-16 w-16 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-1">No items found</h3>
              <p className="text-sm mb-4">Add inventory items to track your supplies</p>
              <Button onClick={() => { setEditItem(null); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AddInventoryDialog 
        open={dialogOpen} 
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditItem(null);
        }}
        editItem={editItem}
      />

      <UpdateQuantityDialog
        open={quantityDialogOpen}
        onOpenChange={setQuantityDialogOpen}
        item={quantityItem}
      />

      <PrintLowStockDialog
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        items={items}
      />

      <AlertDialog open={!!deleteDialogOpen} onOpenChange={() => setDeleteDialogOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this inventory item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialogOpen && deleteMutation.mutate(deleteDialogOpen)}
              className="bg-destructive text-destructive-foreground"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
