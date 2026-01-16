import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { PatientTreatment } from "@shared/schema";

const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

interface ToothProps {
  number: number;
  treatments: PatientTreatment[];
  isSelected: boolean;
  onClick: () => void;
}

function Tooth({ number, treatments, isSelected, onClick }: ToothProps) {
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
          {toothTreatments.length > 0 ? (
            <div className="mt-1 space-y-1">
              {toothTreatments.map((t, i) => (
                <Badge
                  key={i}
                  variant={
                    t.status === "completed"
                      ? "default"
                      : t.status === "in_progress"
                      ? "secondary"
                      : "outline"
                  }
                  className="text-xs"
                >
                  {t.status?.replace(/_/g, " ")}
                </Badge>
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

interface ToothChartProps {
  patientId: string;
  onToothSelect?: (toothNumber: number) => void;
}

export function ToothChart({ patientId, onToothSelect }: ToothChartProps) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

  const { data: treatments = [] } = useQuery<PatientTreatment[]>({
    queryKey: ["/api/patients", patientId, "treatments"],
  });

  const handleToothClick = (toothNumber: number) => {
    setSelectedTooth(toothNumber === selectedTooth ? null : toothNumber);
    onToothSelect?.(toothNumber);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
                />
              ))}
            </div>
          </div>
          <span className="text-xs text-muted-foreground font-medium">LOWER</span>
        </div>
      </div>
    </div>
  );
}
