import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PatientTreatment, Treatment, PatientTreatmentWithDetails } from "@shared/schema";

const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const TREATMENT_STATUSES = [
  { value: "planned", label: "Planned", color: "bg-blue-500" },
  { value: "in_progress", label: "In Progress", color: "bg-amber-500" },
  { value: "completed", label: "Completed", color: "bg-emerald-500" },
  { value: "canceled", label: "Canceled", color: "bg-gray-500" },
];

interface ToothProps {
  number: number;
  treatments: PatientTreatmentWithDetails[];
  isSelected: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  canAddTreatments: boolean;
}

function Tooth({ number, treatments, isSelected, onClick, onDoubleClick, canAddTreatments }: ToothProps) {
  const toothTreatments = treatments.filter((t) => t.toothNumber === number);
  const hasPlanned = toothTreatments.some((t) => t.status === "planned");
  const hasInProgress = toothTreatments.some((t) => t.status === "in_progress");
  const hasCompleted = toothTreatments.some((t) => t.status === "completed");

  const getToothColor = () => {
    if (hasInProgress) return "bg-amber-500 text-white border-amber-600";
    if (hasPlanned) return "bg-blue-500 text-white border-blue-600";
    if (hasCompleted) return "bg-emerald-500 text-white border-emerald-600";
    return "bg-card border-border hover:bg-muted";
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          className={cn(
            "w-10 h-12 rounded-md border-2 flex items-center justify-center text-xs font-medium transition-all",
            getToothColor(),
            isSelected && "ring-2 ring-primary ring-offset-2"
          )}
          data-testid={`tooth-${number}`}
        >
          {number}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-center">
          <p className="font-medium">Tooth #{number}</p>
          {canAddTreatments && (
            <p className="text-xs text-muted-foreground mb-1">Double-click to add treatment</p>
          )}
          {toothTreatments.length > 0 ? (
            <div className="mt-1 space-y-1">
              {toothTreatments.map((t, i) => (
                <div key={i} className="text-xs">
                  <span className="font-medium">{t.treatment?.name || "Treatment"}</span>
                  <Badge
                    variant={
                      t.status === "completed"
                        ? "default"
                        : t.status === "in_progress"
                        ? "secondary"
                        : "outline"
                    }
                    className="ml-1 text-xs"
                  >
                    {t.status?.replace(/_/g, " ")}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No treatments</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

interface AddTreatmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  toothNumber: number;
  existingTreatments: PatientTreatmentWithDetails[];
}

function AddTreatmentModal({ open, onOpenChange, patientId, toothNumber, existingTreatments }: AddTreatmentModalProps) {
  const { toast } = useToast();
  const [treatmentId, setTreatmentId] = useState("");
  const [status, setStatus] = useState<string>("planned");
  const [notes, setNotes] = useState("");

  const { data: treatments = [], isLoading: loadingTreatments } = useQuery<Treatment[]>({
    queryKey: ["/api/treatments"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { treatmentId: string; status: string; notes: string }) => {
      const selectedTreatment = treatments.find(t => t.id === data.treatmentId);
      const res = await apiRequest("POST", `/api/patients/${patientId}/treatments`, {
        treatmentId: data.treatmentId,
        toothNumber,
        status: data.status,
        notes: data.notes,
        price: selectedTreatment?.defaultPrice || "0",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", patientId, "treatments"] });
      toast({
        title: "Treatment added",
        description: `Treatment added to tooth #${toothNumber}`,
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add treatment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTreatmentId("");
    setStatus("planned");
    setNotes("");
  };

  const selectedTreatment = treatments.find(t => t.id === treatmentId);
  const toothTreatments = existingTreatments.filter(t => t.toothNumber === toothNumber);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Treatment to Tooth #{toothNumber}</DialogTitle>
          <DialogDescription>
            Select a treatment from the services catalog and set its status.
          </DialogDescription>
        </DialogHeader>

        {toothTreatments.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <Label className="text-xs text-muted-foreground">Existing Treatments</Label>
            {toothTreatments.map((t, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span>{t.treatment?.name || "Unknown"}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">${t.price}</span>
                  <Badge
                    variant={
                      t.status === "completed" ? "default" :
                      t.status === "in_progress" ? "secondary" : "outline"
                    }
                    className="text-xs"
                  >
                    {t.status?.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Treatment *</Label>
            <Select value={treatmentId} onValueChange={setTreatmentId}>
              <SelectTrigger data-testid="select-treatment">
                <SelectValue placeholder="Select a treatment" />
              </SelectTrigger>
              <SelectContent>
                {loadingTreatments ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : treatments.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    No treatments available. Add some in Services.
                  </div>
                ) : (
                  treatments.map((treatment) => (
                    <SelectItem key={treatment.id} value={treatment.id}>
                      <div className="flex items-center justify-between gap-4 w-full">
                        <span>{treatment.name}</span>
                        <span className="text-muted-foreground">${treatment.defaultPrice}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedTreatment && (
            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">${selectedTreatment.defaultPrice}</p>
                <p className="text-xs text-muted-foreground">{selectedTreatment.category?.replace(/_/g, " ")}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger data-testid="select-treatment-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TREATMENT_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", s.color)} />
                      {s.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Add any notes about this treatment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              data-testid="input-treatment-notes"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => createMutation.mutate({ treatmentId, status, notes })}
            disabled={!treatmentId || createMutation.isPending}
            data-testid="button-add-treatment"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Add Treatment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ToothChartProps {
  patientId: string;
  onToothSelect?: (toothNumber: number) => void;
}

export function ToothChart({ patientId, onToothSelect }: ToothChartProps) {
  const { user } = useAuth();
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [treatmentModalOpen, setTreatmentModalOpen] = useState(false);
  const [treatmentToothNumber, setTreatmentToothNumber] = useState<number>(11);

  const { data: treatments = [] } = useQuery<PatientTreatmentWithDetails[]>({
    queryKey: ["/api/patients", patientId, "treatments"],
  });

  // Students cannot add treatments
  const canAddTreatments = user?.role !== "student";

  const handleToothClick = (toothNumber: number) => {
    setSelectedTooth(toothNumber === selectedTooth ? null : toothNumber);
    onToothSelect?.(toothNumber);
  };

  const handleToothDoubleClick = (toothNumber: number) => {
    if (!canAddTreatments) return;
    setTreatmentToothNumber(toothNumber);
    setTreatmentModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-medium">Dental Chart</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span>Planned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-500" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span>Completed</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 p-6 bg-muted/30 rounded-lg">
        <div className="text-center">
          <span className="text-xs text-muted-foreground font-medium">UPPER</span>
          <div className="flex gap-1 mt-2">
            <div className="flex gap-1">
              {UPPER_TEETH.slice(0, 8).map((num) => (
                <Tooth
                  key={num}
                  number={num}
                  treatments={treatments}
                  isSelected={selectedTooth === num}
                  onClick={() => handleToothClick(num)}
                  onDoubleClick={() => handleToothDoubleClick(num)}
                  canAddTreatments={canAddTreatments}
                />
              ))}
            </div>
            <div className="w-4" />
            <div className="flex gap-1">
              {UPPER_TEETH.slice(8).map((num) => (
                <Tooth
                  key={num}
                  number={num}
                  treatments={treatments}
                  isSelected={selectedTooth === num}
                  onClick={() => handleToothClick(num)}
                  onDoubleClick={() => handleToothDoubleClick(num)}
                  canAddTreatments={canAddTreatments}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="w-full border-t border-dashed border-border" />

        <div className="text-center">
          <div className="flex gap-1 mb-2">
            <div className="flex gap-1">
              {LOWER_TEETH.slice(0, 8).map((num) => (
                <Tooth
                  key={num}
                  number={num}
                  treatments={treatments}
                  isSelected={selectedTooth === num}
                  onClick={() => handleToothClick(num)}
                  onDoubleClick={() => handleToothDoubleClick(num)}
                  canAddTreatments={canAddTreatments}
                />
              ))}
            </div>
            <div className="w-4" />
            <div className="flex gap-1">
              {LOWER_TEETH.slice(8).map((num) => (
                <Tooth
                  key={num}
                  number={num}
                  treatments={treatments}
                  isSelected={selectedTooth === num}
                  onClick={() => handleToothClick(num)}
                  onDoubleClick={() => handleToothDoubleClick(num)}
                  canAddTreatments={canAddTreatments}
                />
              ))}
            </div>
          </div>
          <span className="text-xs text-muted-foreground font-medium">LOWER</span>
        </div>
      </div>

      {canAddTreatments && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-muted-foreground">
            {selectedTooth 
              ? `Tooth #${selectedTooth} selected - click button below to add treatment`
              : "Select a tooth, then click the button below to add a treatment"}
          </p>
          <Button
            size="sm"
            onClick={() => {
              if (selectedTooth) {
                setTreatmentToothNumber(selectedTooth);
                setTreatmentModalOpen(true);
              }
            }}
            disabled={!selectedTooth}
            data-testid="button-add-tooth-treatment"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Treatment to {selectedTooth ? `Tooth #${selectedTooth}` : "Selected Tooth"}
          </Button>
        </div>
      )}

      {!canAddTreatments && (
        <p className="text-xs text-center text-muted-foreground">
          View-only mode. Contact a doctor or staff member to modify treatments.
        </p>
      )}

      <AddTreatmentModal
        open={treatmentModalOpen}
        onOpenChange={setTreatmentModalOpen}
        patientId={patientId}
        toothNumber={treatmentToothNumber}
        existingTreatments={treatments}
      />
    </div>
  );
}
