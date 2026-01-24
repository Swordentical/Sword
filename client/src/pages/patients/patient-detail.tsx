import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { format, differenceInYears } from "date-fns";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Edit,
  Loader2,
  User,
  Stethoscope,
  FileText,
  DollarSign,
  Camera,
  Plus,
  Upload,
  X,
  Folder,
  FolderOpen,
  Image,
  FileImage,
  FileScan,
  Pill,
  ChevronLeft,
  File,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToothChart } from "@/components/tooth-chart";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Patient, PatientTreatmentWithDetails, Invoice, Document as PatientDocument, AppointmentWithDetails, User as UserType } from "@shared/schema";

const PRESET_ALLERGIES = ["Penicillin", "Latex", "Local Anesthetic", "NSAIDs", "Aspirin"];
const PRESET_CONDITIONS = ["Diabetes", "Hypertension", "Heart Disease", "Asthma", "Epilepsy"];

function InfoRow({ label, value, icon: Icon }: { label: string; value: string | null | undefined; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />}
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || "-"}</p>
      </div>
    </div>
  );
}

function PatientPhotoSection({ patient, initials, age }: { patient: Patient; initials: string; age: number | null }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const canUpload = user?.role === "admin" || user?.role === "doctor" || user?.role === "staff";
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useState<HTMLInputElement | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (photoUrl: string) => {
      const res = await apiRequest("PATCH", `/api/patients/${patient.id}`, { photoUrl });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", patient.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({ title: "Photo updated", description: "Patient photo has been updated successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image under 5MB", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        await uploadMutation.mutateAsync(base64);
        setIsUploading(false);
      };
      reader.onerror = () => {
        toast({ title: "Error reading file", variant: "destructive" });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsUploading(false);
    }
  };

  const removePhoto = () => {
    uploadMutation.mutate("");
  };

  return (
    <div className="flex flex-col items-center text-center mb-6">
      <div className="relative group">
        <Avatar className="h-24 w-24 mb-4">
          <AvatarImage src={(patient as any).photoUrl || undefined} alt={`${patient.firstName} ${patient.lastName}`} />
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        {canUpload && (
          <div className="absolute inset-0 mb-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute inset-0 bg-black/50 rounded-full" />
            <label className="relative cursor-pointer p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
              {isUploading ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
                data-testid="input-patient-photo"
              />
            </label>
          </div>
        )}
      </div>
      <h2 className="text-xl font-bold">
        {patient.firstName} {patient.lastName}
      </h2>
      <p className="text-sm text-muted-foreground">
        ID: {patient.id.slice(0, 8)}
      </p>
      <div className="flex items-center gap-2 mt-2">
        {patient.gender && (
          <Badge variant="secondary" className="capitalize">
            {patient.gender} {age && `• ${age} years old`}
          </Badge>
        )}
        {(patient as any).photoUrl && canUpload && (
          <Button
            variant="ghost"
            size="sm"
            onClick={removePhoto}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
            disabled={uploadMutation.isPending}
            data-testid="button-remove-photo"
          >
            <X className="h-3 w-3 mr-1" />
            Remove photo
          </Button>
        )}
      </div>
    </div>
  );
}

function MedicalHistorySection({ patient, canEdit }: { patient: Patient; canEdit: boolean }) {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState("");
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [customCondition, setCustomCondition] = useState("");
  const [medications, setMedications] = useState<string[]>([]);
  const [customMedication, setCustomMedication] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");

  const updateMutation = useMutation({
    mutationFn: async (data: {
      allergies: string[];
      chronicConditions: string[];
      currentMedications: string[];
      medicalNotes: string;
    }) => {
      const res = await apiRequest("PATCH", `/api/patients/${patient.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", patient.id] });
      setIsModalOpen(false);
      toast({
        title: "Medical history updated",
        description: "Patient medical history has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openModal = () => {
    setSelectedAllergies(patient.allergies || []);
    setSelectedConditions(patient.chronicConditions || []);
    setMedications(patient.currentMedications || []);
    setMedicalNotes(patient.medicalNotes || "");
    setCustomAllergy("");
    setCustomCondition("");
    setCustomMedication("");
    setIsModalOpen(true);
  };

  const handleAllergyToggle = (allergy: string, checked: boolean) => {
    if (checked) {
      setSelectedAllergies((prev) => [...prev, allergy]);
    } else {
      setSelectedAllergies((prev) => prev.filter((a) => a !== allergy));
    }
  };

  const handleConditionToggle = (condition: string, checked: boolean) => {
    if (checked) {
      setSelectedConditions((prev) => [...prev, condition]);
    } else {
      setSelectedConditions((prev) => prev.filter((c) => c !== condition));
    }
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim() && !selectedAllergies.includes(customAllergy.trim())) {
      setSelectedAllergies((prev) => [...prev, customAllergy.trim()]);
      setCustomAllergy("");
    }
  };

  const addCustomCondition = () => {
    if (customCondition.trim() && !selectedConditions.includes(customCondition.trim())) {
      setSelectedConditions((prev) => [...prev, customCondition.trim()]);
      setCustomCondition("");
    }
  };

  const addMedication = () => {
    if (customMedication.trim() && !medications.includes(customMedication.trim())) {
      setMedications((prev) => [...prev, customMedication.trim()]);
      setCustomMedication("");
    }
  };

  const removeMedication = (med: string) => {
    setMedications((prev) => prev.filter((m) => m !== med));
  };

  const removeCustomAllergy = (allergy: string) => {
    setSelectedAllergies((prev) => prev.filter((a) => a !== allergy));
  };

  const removeCustomCondition = (condition: string) => {
    setSelectedConditions((prev) => prev.filter((c) => c !== condition));
  };

  const handleSave = () => {
    updateMutation.mutate({
      allergies: selectedAllergies,
      chronicConditions: selectedConditions,
      currentMedications: medications,
      medicalNotes,
    });
  };

  const allergies = patient.allergies || [];
  const conditions = patient.chronicConditions || [];
  const currentMedications = patient.currentMedications || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Allergies</h3>
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={openModal}
            data-testid="button-edit-medical-history"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Medical History
          </Button>
        )}
      </div>
      <div>
        {allergies.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {allergies.map((allergy, index) => (
              <Badge key={index} variant="destructive" className="text-xs">
                {allergy}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No known allergies</p>
        )}
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-medium mb-3">Chronic Conditions</h3>
        {conditions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {conditions.map((condition, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {condition}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No chronic conditions recorded</p>
        )}
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-medium mb-3">Current Medications</h3>
        {currentMedications.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {currentMedications.map((medication, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {medication}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No current medications</p>
        )}
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-medium mb-3">Medical Notes</h3>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {patient.medicalNotes || "No medical notes recorded"}
        </p>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Medical History</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <Label className="text-sm font-medium mb-3 block">Allergies</Label>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_ALLERGIES.map((allergy) => (
                    <div key={allergy} className="flex items-center space-x-2">
                      <Checkbox
                        id={`allergy-${allergy}`}
                        checked={selectedAllergies.includes(allergy)}
                        onCheckedChange={(checked) => handleAllergyToggle(allergy, !!checked)}
                        data-testid={`checkbox-allergy-${allergy.toLowerCase().replace(/\s+/g, "-")}`}
                      />
                      <label htmlFor={`allergy-${allergy}`} className="text-sm cursor-pointer">
                        {allergy}
                      </label>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom allergy..."
                    value={customAllergy}
                    onChange={(e) => setCustomAllergy(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomAllergy())}
                    data-testid="input-custom-allergy"
                  />
                  <Button type="button" variant="outline" onClick={addCustomAllergy} data-testid="button-add-allergy">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {selectedAllergies.filter((a) => !PRESET_ALLERGIES.includes(a)).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedAllergies
                      .filter((a) => !PRESET_ALLERGIES.includes(a))
                      .map((allergy) => (
                        <Badge key={allergy} variant="destructive" className="text-xs">
                          {allergy}
                          <button
                            type="button"
                            className="ml-1"
                            onClick={() => removeCustomAllergy(allergy)}
                            data-testid={`button-remove-allergy-${allergy.toLowerCase().replace(/\s+/g, "-")}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-medium mb-3 block">Chronic Conditions</Label>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_CONDITIONS.map((condition) => (
                    <div key={condition} className="flex items-center space-x-2">
                      <Checkbox
                        id={`condition-${condition}`}
                        checked={selectedConditions.includes(condition)}
                        onCheckedChange={(checked) => handleConditionToggle(condition, !!checked)}
                        data-testid={`checkbox-condition-${condition.toLowerCase().replace(/\s+/g, "-")}`}
                      />
                      <label htmlFor={`condition-${condition}`} className="text-sm cursor-pointer">
                        {condition}
                      </label>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom condition..."
                    value={customCondition}
                    onChange={(e) => setCustomCondition(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomCondition())}
                    data-testid="input-custom-condition"
                  />
                  <Button type="button" variant="outline" onClick={addCustomCondition} data-testid="button-add-condition">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {selectedConditions.filter((c) => !PRESET_CONDITIONS.includes(c)).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedConditions
                      .filter((c) => !PRESET_CONDITIONS.includes(c))
                      .map((condition) => (
                        <Badge key={condition} variant="secondary" className="text-xs">
                          {condition}
                          <button
                            type="button"
                            className="ml-1"
                            onClick={() => removeCustomCondition(condition)}
                            data-testid={`button-remove-condition-${condition.toLowerCase().replace(/\s+/g, "-")}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-medium mb-3 block">Current Medications</Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add medication..."
                    value={customMedication}
                    onChange={(e) => setCustomMedication(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMedication())}
                    data-testid="input-medication"
                  />
                  <Button type="button" variant="outline" onClick={addMedication} data-testid="button-add-medication">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {medications.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {medications.map((med) => (
                      <Badge key={med} variant="outline" className="text-xs">
                        {med}
                        <button
                          type="button"
                          className="ml-1"
                          onClick={() => removeMedication(med)}
                          data-testid={`button-remove-medication-${med.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <Label htmlFor="medical-notes" className="text-sm font-medium mb-3 block">
                Medical Notes
              </Label>
              <Textarea
                id="medical-notes"
                placeholder="Enter any medical notes..."
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
                rows={4}
                data-testid="textarea-medical-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} data-testid="button-cancel-medical-history">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending} data-testid="button-save-medical-history">
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TreatmentHistorySection({ 
  patientId,
  patientName,
  financials
}: { 
  patientId: string;
  patientName: string;
  financials: PatientFinancials | undefined;
}) {
  const { toast } = useToast();
  const [editingTreatment, setEditingTreatment] = useState<PatientTreatmentWithDetails | null>(null);
  const [deletingTreatmentId, setDeletingTreatmentId] = useState<string | null>(null);

  const { data: treatments, isLoading: treatmentsLoading } = useQuery<PatientTreatmentWithDetails[]>({
    queryKey: ["/api/patients", patientId, "treatments"],
  });

  const isLoading = treatmentsLoading;

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string | null }) => {
      const res = await apiRequest("PATCH", `/api/patients/${patientId}/treatments/${id}`, { status, notes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", patientId, "treatments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: "Treatment updated", description: "The treatment status has been updated." });
      setEditingTreatment(null);
    },
    onError: (error: Error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/patients/${patientId}/treatments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", patientId, "treatments"] });
      toast({ title: "Treatment removed", description: "The treatment has been deleted from history." });
      setDeletingTreatmentId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    },
  });

  const handlePrintFinancials = () => {
    window.print();
  };

  const handlePrintInvoice = (invoice: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Get all payments for this invoice (both active and refunded)
    const allInvoicePayments = (financials?.payments || []).filter((p: any) => p.invoiceId === invoice.id);
    const activePayments = allInvoicePayments.filter((p: any) => !p.isRefunded);
    const refundedPayments = allInvoicePayments.filter((p: any) => p.isRefunded);
    const totalPaid = activePayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
    const totalRefunded = refundedPayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
    const balanceRemaining = parseFloat(invoice.finalAmount) - totalPaid;

    const invoiceHtml = `
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #333; line-height: 1.6; max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid; border-image: linear-gradient(90deg, #12a3b0, #2089de, #9b59b6) 1; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 32px; font-weight: bold; background: linear-gradient(90deg, #12a3b0, #2089de, #9b59b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
            .logo-subtitle { font-size: 12px; color: #666; margin-top: 2px; }
            .invoice-title { text-align: right; }
            .invoice-title h2 { margin: 0; font-size: 28px; color: #333; letter-spacing: 2px; }
            .invoice-title p { margin: 5px 0 0; color: #666; font-weight: bold; }
            .details { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .section-title { font-weight: bold; text-transform: uppercase; font-size: 12px; color: #12a3b0; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; border-bottom: 2px solid #eee; padding: 12px 10px; font-size: 12px; color: #666; text-transform: uppercase; background: #f8f9fa; }
            td { padding: 12px 10px; border-bottom: 1px solid #eee; font-size: 14px; }
            .totals { margin-left: auto; width: 320px; background: #f8f9fa; border-radius: 8px; padding: 15px 20px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
            .grand-total { border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; font-weight: bold; font-size: 18px; color: #000; }
            .payment-row { color: #1e7e34; font-size: 13px; }
            .refunded-row { background: #fdf2f2; }
            .refunded-row td { color: #c81e1e; text-decoration: line-through; }
            .refund-badge { display: inline-block; background: #c81e1e; color: white; font-size: 9px; padding: 2px 6px; border-radius: 3px; margin-left: 8px; text-transform: uppercase; font-weight: bold; text-decoration: none; }
            .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
            .status-paid { background: #e6f4ea; color: #1e7e34; border: 1px solid #1e7e34; }
            .status-pending { background: #fff4e5; color: #b7791f; border: 1px solid #b7791f; }
            .status-overdue { background: #fdf2f2; color: #c81e1e; border: 1px solid #c81e1e; }
            .status-draft { background: #f0f0f0; color: #666; border: 1px solid #999; }
            .footer { margin-top: 60px; border-top: 1px solid #eee; padding-top: 20px; font-size: 11px; color: #999; text-align: center; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">GLAZER</div>
              <div class="logo-subtitle">Dental Clinic Management</div>
            </div>
            <div class="invoice-title">
              <h2>INVOICE</h2>
              <p># ${invoice.invoiceNumber}</p>
            </div>
          </div>
          
          <div class="details">
            <div>
              <div class="section-title">Bill To</div>
              <div style="font-size: 18px; font-weight: bold; color: #12a3b0;">${patientName}</div>
              <div style="color: #666; margin-top: 4px;">Patient ID: ${patientId}</div>
            </div>
            <div style="text-align: right;">
              <div class="section-title">Invoice Details</div>
              <div><strong>Date:</strong> ${invoice.issuedDate ? new Date(invoice.issuedDate).toLocaleDateString() : 'N/A'}</div>
              <div><strong>Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</div>
              <div style="margin-top: 12px;">
                <span class="status-badge status-${invoice.status}">${invoice.status}</span>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Dental Services and Treatments</td>
                <td style="text-align: right;">$${parseFloat(invoice.totalAmount).toFixed(2)}</td>
              </tr>
              ${activePayments.map((p: any) => `
                <tr class="payment-row">
                  <td style="font-style: italic;">Payment - ${new Date(p.paymentDate).toLocaleDateString()} (${(p.paymentMethod || '').replace(/_/g, ' ')})</td>
                  <td style="text-align: right;">-$${parseFloat(p.amount).toFixed(2)}</td>
                </tr>
              `).join('')}
              ${refundedPayments.map((p: any) => `
                <tr class="refunded-row">
                  <td>
                    <span style="text-decoration: line-through;">Payment - ${new Date(p.paymentDate).toLocaleDateString()} (${(p.paymentMethod || '').replace(/_/g, ' ')})</span>
                    <span class="refund-badge">Refunded</span>
                    ${p.refundReason ? `<div style="font-size: 11px; color: #c81e1e; text-decoration: none; margin-top: 4px;">Reason: ${p.refundReason}</div>` : ''}
                  </td>
                  <td style="text-align: right; text-decoration: line-through;">-$${parseFloat(p.amount).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Total Charges</span>
              <span>$${parseFloat(invoice.totalAmount).toFixed(2)}</span>
            </div>
            <div class="total-row" style="color: #1e7e34;">
              <span>Total Paid</span>
              <span>-$${totalPaid.toFixed(2)}</span>
            </div>
            ${totalRefunded > 0 ? `
            <div class="total-row" style="color: #c81e1e;">
              <span>Refunded</span>
              <span>$${totalRefunded.toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="total-row grand-total">
              <span>Balance Remaining</span>
              <span>$${Math.max(0, balanceRemaining).toFixed(2)}</span>
            </div>
          </div>

          <div class="footer">
            <p>Please include the invoice number ${invoice.invoiceNumber} with your payment.</p>
            <p>Thank you for choosing GLAZER Dental Clinic!</p>
          </div>

          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!treatments || treatments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Stethoscope className="h-12 w-12 mb-3 opacity-50" />
        <p>No treatments recorded</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end print:hidden">
        <Button variant="outline" size="sm" onClick={handlePrintFinancials}>
          <FileText className="h-4 w-4 mr-2" />
          Print Treatment History
        </Button>
      </div>
      {treatments.map((pt) => (
        <Card key={pt.id} className="hover-elevate break-inside-avoid">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium">{pt.treatment?.name}</span>
                  {pt.toothNumber && (
                    <Badge variant="outline" className="text-xs">
                      Tooth #{pt.toothNumber}
                    </Badge>
                  )}
                  <Badge
                    variant={
                      pt.status === "completed"
                        ? "default"
                        : pt.status === "in_progress"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {pt.status?.replace(/_/g, " ") || "planned"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {pt.treatment?.category?.replace(/_/g, " ")}
                </p>
                {pt.notes && (
                  <p className="text-sm text-muted-foreground">{pt.notes}</p>
                )}
                <p className="text-sm font-medium mt-2">${pt.price}</p>
              </div>
              <div className="flex gap-1 print:hidden">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8" 
                  onClick={() => setEditingTreatment(pt)}
                  data-testid={`button-edit-treatment-${pt.id}`}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-destructive hover:text-destructive" 
                  onClick={() => setDeletingTreatmentId(pt.id)}
                  data-testid={`button-delete-treatment-${pt.id}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Edit Dialog */}
      <Dialog open={!!editingTreatment} onOpenChange={(open) => !open && setEditingTreatment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Treatment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={editingTreatment?.status || "planned"} 
                onValueChange={(status) => setEditingTreatment(prev => prev ? { ...prev, status: status as any } : null)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Add notes about this treatment..."
                value={editingTreatment?.notes || ""}
                onChange={(e) => setEditingTreatment(prev => prev ? { ...prev, notes: e.target.value } : null)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTreatment(null)}>Cancel</Button>
            <Button 
              onClick={() => editingTreatment && updateMutation.mutate({ 
                id: editingTreatment.id, 
                status: editingTreatment.status || "planned", 
                notes: editingTreatment.notes 
              })}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingTreatmentId} onOpenChange={(open) => !open && setDeletingTreatmentId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            Are you sure you want to remove this treatment from history? This action cannot be undone.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingTreatmentId(null)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => deletingTreatmentId && deleteMutation.mutate(deletingTreatmentId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type PatientFinancials = {
  summary: {
    totalTreatmentCost: number;
    completedCost: number;
    pendingCost: number;
    totalInvoiced: number;
    totalPaid: number;
    outstandingBalance: number;
    treatmentCount: number;
    completedCount: number;
    pendingCount: number;
    invoiceCount: number;
    paymentCount: number;
  };
  treatmentsByCategory: Record<string, { count: number; total: number }>;
  treatments: PatientTreatmentWithDetails[];
  invoices: Invoice[];
  payments: any[];
};

const CATEGORY_LABELS: Record<string, string> = {
  endodontics: "Endodontics",
  restorative: "Restorative",
  preventative: "Preventative",
  fixed_prosthodontics: "Fixed Prosthodontics",
  removable_prosthodontics: "Removable Prosthodontics",
  surgery: "Surgery",
  orthodontics: "Orthodontics",
  periodontics: "Periodontics",
  cosmetic: "Cosmetic",
  diagnostics: "Diagnostics",
  pediatric: "Pediatric",
  other: "Other",
};

function FinancialsSection({ 
  patientId, 
  patientName,
  financials 
}: { 
  patientId: string; 
  patientName: string;
  financials: PatientFinancials | undefined;
}) {
  const { data: fetchedFinancials, isLoading: financialsLoading } = useQuery<PatientFinancials>({
    queryKey: ["/api/patients", patientId, "financials"],
    enabled: !financials
  });

  const handlePrintFinancials = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const currentData = financials || fetchedFinancials;
    if (!currentData) return;

    const { summary, invoices, payments } = currentData;
    
    // Separate refunded and non-refunded payments
    const activePayments = (payments || []).filter((p: any) => !p.isRefunded);
    const refundedPayments = (payments || []).filter((p: any) => p.isRefunded);
    const totalRefunded = refundedPayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);

    const statementHtml = `
      <html>
        <head>
          <title>Financial Statement - ${patientName}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #333; line-height: 1.6; max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid; border-image: linear-gradient(90deg, #12a3b0, #2089de, #9b59b6) 1; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 32px; font-weight: bold; background: linear-gradient(90deg, #12a3b0, #2089de, #9b59b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
            .logo-subtitle { font-size: 12px; color: #666; margin-top: 2px; }
            .doc-title { text-align: right; }
            .doc-title h2 { margin: 0; font-size: 24px; color: #333; letter-spacing: 2px; }
            .doc-title p { margin: 5px 0 0; color: #666; }
            .patient-info { background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
            .patient-name { font-size: 20px; font-weight: bold; color: #12a3b0; margin-bottom: 5px; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
            .summary-card { background: #f8f9fa; border-radius: 8px; padding: 15px; text-align: center; }
            .summary-card.highlight { background: linear-gradient(135deg, #12a3b010, #2089de10); border: 1px solid #12a3b030; }
            .summary-label { font-size: 11px; text-transform: uppercase; color: #666; margin-bottom: 5px; }
            .summary-value { font-size: 22px; font-weight: bold; color: #333; }
            .summary-value.positive { color: #1e7e34; }
            .summary-value.negative { color: #c81e1e; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 14px; font-weight: 600; text-transform: uppercase; color: #12a3b0; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; color: #666; background: #f8f9fa; border-bottom: 2px solid #eee; }
            td { padding: 10px; border-bottom: 1px solid #eee; font-size: 13px; }
            .text-right { text-align: right; }
            .payment-row { }
            .refunded-row { background: #fdf2f2; }
            .refunded-row td { color: #c81e1e; text-decoration: line-through; }
            .refund-badge { display: inline-block; background: #c81e1e; color: white; font-size: 9px; padding: 2px 6px; border-radius: 3px; margin-left: 8px; text-transform: uppercase; font-weight: bold; text-decoration: none; }
            .status-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
            .status-paid { background: #e6f4ea; color: #1e7e34; }
            .status-pending { background: #fff4e5; color: #b7791f; }
            .status-overdue { background: #fdf2f2; color: #c81e1e; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #999; text-align: center; }
            @media print { 
              body { padding: 20px; }
              .no-print { display: none; } 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">GLAZER</div>
              <div class="logo-subtitle">Dental Clinic Management</div>
            </div>
            <div class="doc-title">
              <h2>FINANCIAL STATEMENT</h2>
              <p>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          <div class="patient-info">
            <div class="patient-name">${patientName}</div>
            <div style="color: #666; font-size: 13px;">Patient ID: ${patientId}</div>
          </div>

          <div class="summary-grid">
            <div class="summary-card highlight">
              <div class="summary-label">Total Invoiced</div>
              <div class="summary-value">$${summary.totalInvoiced.toFixed(2)}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Total Paid</div>
              <div class="summary-value positive">$${summary.totalPaid.toFixed(2)}</div>
            </div>
            ${totalRefunded > 0 ? `
            <div class="summary-card">
              <div class="summary-label">Total Refunded</div>
              <div class="summary-value negative">$${totalRefunded.toFixed(2)}</div>
            </div>
            ` : ''}
            <div class="summary-card highlight">
              <div class="summary-label">Outstanding Balance</div>
              <div class="summary-value ${summary.outstandingBalance > 0 ? 'negative' : 'positive'}">$${summary.outstandingBalance.toFixed(2)}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Invoices (${(invoices || []).length})</div>
            ${(invoices || []).length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${(invoices || []).map((inv: any) => `
                  <tr>
                    <td>${inv.invoiceNumber}</td>
                    <td>${inv.issuedDate ? new Date(inv.issuedDate).toLocaleDateString() : 'N/A'}</td>
                    <td><span class="status-badge status-${inv.status}">${inv.status}</span></td>
                    <td class="text-right">$${parseFloat(inv.finalAmount).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ` : '<p style="color: #666; font-size: 13px;">No invoices recorded.</p>'}
          </div>

          <div class="section">
            <div class="section-title">Payment History (${activePayments.length} active${refundedPayments.length > 0 ? `, ${refundedPayments.length} refunded` : ''})</div>
            ${(payments || []).length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${(payments || []).map((p: any) => `
                  <tr class="${p.isRefunded ? 'refunded-row' : 'payment-row'}">
                    <td>
                      ${p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'N/A'}
                      ${p.isRefunded ? '<span class="refund-badge">Refunded</span>' : ''}
                    </td>
                    <td>${(p.paymentMethod || 'unknown').replace(/_/g, ' ')}</td>
                    <td>${p.referenceNumber || '-'}</td>
                    <td class="text-right">$${parseFloat(p.amount).toFixed(2)}</td>
                  </tr>
                  ${p.isRefunded && p.refundReason ? `
                  <tr class="refunded-row">
                    <td colspan="4" style="font-size: 11px; font-style: italic; text-decoration: none; padding-top: 0;">
                      Refund reason: ${p.refundReason} ${p.refundedAt ? `(${new Date(p.refundedAt).toLocaleDateString()})` : ''}
                    </td>
                  </tr>
                  ` : ''}
                `).join('')}
              </tbody>
            </table>
            ` : '<p style="color: #666; font-size: 13px;">No payments recorded.</p>'}
          </div>

          <div class="footer">
            <p>This is an official financial statement from GLAZER Dental Clinic.</p>
            <p>For questions, please contact our billing department.</p>
          </div>

          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(statementHtml);
    printWindow.document.close();
  };

  const currentFinancials = financials || fetchedFinancials;

  const handlePrintInvoice = (invoice: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Get all payments for this invoice (both active and refunded)
    const allInvoicePayments = (currentFinancials?.payments || []).filter((p: any) => p.invoiceId === invoice.id);
    const activePayments = allInvoicePayments.filter((p: any) => !p.isRefunded);
    const refundedPayments = allInvoicePayments.filter((p: any) => p.isRefunded);
    const totalPaid = activePayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
    const totalRefunded = refundedPayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
    const balanceRemaining = parseFloat(invoice.finalAmount) - totalPaid;

    const invoiceHtml = `
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #333; line-height: 1.6; max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid; border-image: linear-gradient(90deg, #12a3b0, #2089de, #9b59b6) 1; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 32px; font-weight: bold; background: linear-gradient(90deg, #12a3b0, #2089de, #9b59b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
            .logo-subtitle { font-size: 12px; color: #666; margin-top: 2px; }
            .invoice-title { text-align: right; }
            .invoice-title h2 { margin: 0; font-size: 28px; color: #333; letter-spacing: 2px; }
            .invoice-title p { margin: 5px 0 0; color: #666; font-weight: bold; }
            .details { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .section-title { font-weight: bold; text-transform: uppercase; font-size: 12px; color: #12a3b0; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; border-bottom: 2px solid #eee; padding: 12px 10px; font-size: 12px; color: #666; text-transform: uppercase; background: #f8f9fa; }
            td { padding: 12px 10px; border-bottom: 1px solid #eee; font-size: 14px; }
            .totals { margin-left: auto; width: 320px; background: #f8f9fa; border-radius: 8px; padding: 15px 20px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
            .grand-total { border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; font-weight: bold; font-size: 18px; color: #000; }
            .payment-row { color: #1e7e34; font-size: 13px; }
            .refunded-row { background: #fdf2f2; }
            .refunded-row td { color: #c81e1e; text-decoration: line-through; }
            .refund-badge { display: inline-block; background: #c81e1e; color: white; font-size: 9px; padding: 2px 6px; border-radius: 3px; margin-left: 8px; text-transform: uppercase; font-weight: bold; text-decoration: none; }
            .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
            .status-paid { background: #e6f4ea; color: #1e7e34; border: 1px solid #1e7e34; }
            .status-pending { background: #fff4e5; color: #b7791f; border: 1px solid #b7791f; }
            .status-overdue { background: #fdf2f2; color: #c81e1e; border: 1px solid #c81e1e; }
            .status-draft { background: #f0f0f0; color: #666; border: 1px solid #999; }
            .footer { margin-top: 60px; border-top: 1px solid #eee; padding-top: 20px; font-size: 11px; color: #999; text-align: center; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">GLAZER</div>
              <div class="logo-subtitle">Dental Clinic Management</div>
            </div>
            <div class="invoice-title">
              <h2>INVOICE</h2>
              <p># ${invoice.invoiceNumber}</p>
            </div>
          </div>
          
          <div class="details">
            <div>
              <div class="section-title">Bill To</div>
              <div style="font-size: 18px; font-weight: bold; color: #12a3b0;">${patientName}</div>
              <div style="color: #666; margin-top: 4px;">Patient ID: ${patientId}</div>
            </div>
            <div style="text-align: right;">
              <div class="section-title">Invoice Details</div>
              <div><strong>Date:</strong> ${invoice.issuedDate ? new Date(invoice.issuedDate).toLocaleDateString() : 'N/A'}</div>
              <div><strong>Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</div>
              <div style="margin-top: 12px;">
                <span class="status-badge status-${invoice.status}">${invoice.status}</span>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Dental Services and Treatments</td>
                <td style="text-align: right;">$${parseFloat(invoice.totalAmount).toFixed(2)}</td>
              </tr>
              ${activePayments.map((p: any) => `
                <tr class="payment-row">
                  <td style="font-style: italic;">Payment - ${new Date(p.paymentDate).toLocaleDateString()} (${(p.paymentMethod || '').replace(/_/g, ' ')})</td>
                  <td style="text-align: right;">-$${parseFloat(p.amount).toFixed(2)}</td>
                </tr>
              `).join('')}
              ${refundedPayments.map((p: any) => `
                <tr class="refunded-row">
                  <td>
                    <span style="text-decoration: line-through;">Payment - ${new Date(p.paymentDate).toLocaleDateString()} (${(p.paymentMethod || '').replace(/_/g, ' ')})</span>
                    <span class="refund-badge">Refunded</span>
                    ${p.refundReason ? `<div style="font-size: 11px; color: #c81e1e; text-decoration: none; margin-top: 4px;">Reason: ${p.refundReason}</div>` : ''}
                  </td>
                  <td style="text-align: right; text-decoration: line-through;">-$${parseFloat(p.amount).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Total Charges</span>
              <span>$${parseFloat(invoice.totalAmount).toFixed(2)}</span>
            </div>
            <div class="total-row" style="color: #1e7e34;">
              <span>Total Paid</span>
              <span>-$${totalPaid.toFixed(2)}</span>
            </div>
            ${totalRefunded > 0 ? `
            <div class="total-row" style="color: #c81e1e;">
              <span>Refunded</span>
              <span>$${totalRefunded.toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="total-row grand-total">
              <span>Balance Remaining</span>
              <span>$${Math.max(0, balanceRemaining).toFixed(2)}</span>
            </div>
          </div>

          <div class="footer">
            <p>Please include the invoice number ${invoice.invoiceNumber} with your payment.</p>
            <p>Thank you for choosing GLAZER Dental Clinic!</p>
          </div>

          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
  };


  if (financialsLoading && !currentFinancials) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentFinancials) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <DollarSign className="h-12 w-12 mb-3 opacity-50" />
        <p>No financial data available</p>
      </div>
    );
  }

  const { summary, treatmentsByCategory, invoices, payments } = currentFinancials;

  return (
    <div className="space-y-6">
      <div className="hidden print:block border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold">Financial Statement</h1>
        <p className="text-lg font-medium text-primary">{patientName}</p>
        <p className="text-sm text-muted-foreground">Generated on {format(new Date(), "PPP")}</p>
      </div>
      <div className="flex justify-end print:hidden">
        <Button variant="outline" size="sm" onClick={handlePrintFinancials}>
          <FileText className="h-4 w-4 mr-2" />
          Print Financial Statement
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-transparent">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Treatment Cost</p>
            <p className="text-xl font-bold">${summary.totalTreatmentCost.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">{summary.treatmentCount} treatments</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Completed</p>
            <p className="text-xl font-bold text-emerald-600">${summary.completedCost.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">{summary.completedCount} completed</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-transparent">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Pending</p>
            <p className="text-xl font-bold text-amber-600">${summary.pendingCost.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">{summary.pendingCount} pending</p>
          </CardContent>
        </Card>
        <Card className={`bg-gradient-to-br ${summary.outstandingBalance > 0 ? 'from-destructive/10' : 'from-emerald-500/10'} to-transparent`}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Outstanding Balance</p>
            <p className={`text-xl font-bold ${summary.outstandingBalance > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
              ${summary.outstandingBalance.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ${summary.totalPaid.toFixed(2)} paid of ${summary.totalInvoiced.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {Object.keys(treatmentsByCategory).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Treatments by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(treatmentsByCategory).map(([category, data]) => {
                const percentage = summary.totalTreatmentCost > 0 
                  ? (data.total / summary.totalTreatmentCost) * 100 
                  : 0;
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{CATEGORY_LABELS[category] || category}</span>
                      <span className="font-medium">${data.total.toFixed(2)} ({data.count})</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Invoices ({summary.invoiceCount})</CardTitle>
          </CardHeader>
          <CardContent>
            {invoices && invoices.length > 0 ? (
              <ScrollArea className="h-[200px]">
                <div className="space-y-3 pr-4">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg border group hover:border-primary transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{invoice.invoiceNumber}</p>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                            onClick={() => handlePrintInvoice(invoice)}
                            title="Print Invoice"
                          >
                            <Printer className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {invoice.issuedDate && format(new Date(invoice.issuedDate), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">${invoice.finalAmount}</p>
                        <Badge
                          variant={
                            invoice.status === "paid" ? "default" :
                            invoice.status === "overdue" ? "destructive" : "secondary"
                          }
                          className="text-xs"
                        >
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No invoices yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Payments ({summary.paymentCount})</CardTitle>
          </CardHeader>
          <CardContent>
            {payments && payments.length > 0 ? (
              <ScrollArea className="h-[200px]">
                <div className="space-y-3 pr-4">
                  {payments.map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm text-emerald-600">+${payment.amount}</p>
                        <p className="text-xs text-muted-foreground">
                          {payment.paymentDate && format(new Date(payment.paymentDate), "MMM d, yyyy")}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">
                        {payment.paymentMethod?.replace(/_/g, " ") || "unknown"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No payments recorded</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type DocumentFolder = {
  id: string;
  name: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

const DOCUMENT_FOLDERS: DocumentFolder[] = [
  { id: "xray", name: "X-rays", category: "xray", icon: FileScan, color: "text-blue-500" },
  { id: "photo", name: "Photos", category: "photo", icon: Image, color: "text-green-500" },
  { id: "lab_report", name: "Lab Reports", category: "lab_report", icon: FileText, color: "text-purple-500" },
  { id: "prescription", name: "Prescriptions", category: "prescription", icon: Pill, color: "text-amber-500" },
  { id: "other", name: "Other", category: "other", icon: Folder, color: "text-muted-foreground" },
];

const ACCEPTED_FILE_TYPES = {
  images: ".jpg,.jpeg,.png,.gif",
  documents: ".pdf",
};

function getFileIcon(fileType: string | null, category: string | null) {
  if (fileType?.startsWith("image")) {
    return { icon: FileImage, color: "text-green-500" };
  }
  if (fileType === "application/pdf") {
    return { icon: FileText, color: "text-red-500" };
  }
  const folder = DOCUMENT_FOLDERS.find(f => f.category === category);
  if (folder) {
    return { icon: folder.icon, color: folder.color };
  }
  return { icon: File, color: "text-muted-foreground" };
}

function DocumentsSection({ patientId }: { patientId: string }) {
  const { toast } = useToast();
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<string>("other");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const { data: documents, isLoading } = useQuery<PatientDocument[]>({
    queryKey: ["/api/patients", patientId, "documents"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(`/api/patients/${patientId}/documents`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to upload document");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", patientId, "documents"] });
      setIsUploadDialogOpen(false);
      setSelectedFiles(null);
      setUploadCategory("other");
      toast({
        title: "Upload successful",
        description: "Document has been uploaded successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getDocumentCountByCategory = (category: string) => {
    if (!documents) return 0;
    if (category === "other") {
      const knownCategories = DOCUMENT_FOLDERS.filter(f => f.id !== "other").map(f => f.category);
      return documents.filter(doc => !doc.category || !knownCategories.includes(doc.category)).length;
    }
    return documents.filter(doc => doc.category === category).length;
  };

  const getDocumentsInFolder = (category: string) => {
    if (!documents) return [];
    if (category === "other") {
      const knownCategories = DOCUMENT_FOLDERS.filter(f => f.id !== "other").map(f => f.category);
      return documents.filter(doc => !doc.category || !knownCategories.includes(doc.category));
    }
    return documents.filter(doc => doc.category === category);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(e.target.files);
    }
  };

  const handleUpload = () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append("files", selectedFiles[i]);
    }
    formData.append("category", uploadCategory);

    uploadMutation.mutate(formData);
  };

  const openUploadDialog = (category?: string) => {
    if (category) {
      setUploadCategory(category);
    }
    setSelectedFiles(null);
    setIsUploadDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const selectedFolderData = selectedFolder ? DOCUMENT_FOLDERS.find(f => f.id === selectedFolder) : null;
  const folderDocuments = selectedFolder ? getDocumentsInFolder(selectedFolder) : [];

  if (selectedFolder && selectedFolderData) {
    const FolderIcon = selectedFolderData.icon;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedFolder(null)}
              data-testid="button-back-to-folders"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <FolderIcon className={`h-5 w-5 ${selectedFolderData.color}`} />
            <h3 className="text-sm font-medium">{selectedFolderData.name}</h3>
            <Badge variant="secondary" className="ml-2">
              {folderDocuments.length} {folderDocuments.length === 1 ? "file" : "files"}
            </Badge>
          </div>
          <Button size="sm" variant="outline" onClick={() => openUploadDialog(selectedFolder)} data-testid="button-upload-to-folder">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>

        {folderDocuments.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {folderDocuments.map((doc) => {
              const { icon: DocIcon, color } = getFileIcon(doc.fileType, doc.category);
              return (
                <Card key={doc.id} className="hover-elevate cursor-pointer" data-testid={`card-document-${doc.id}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-muted">
                        <DocIcon className={`h-6 w-6 ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0 w-full">
                        <p className="text-sm font-medium truncate" title={doc.fileName}>
                          {doc.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doc.createdAt && format(new Date(doc.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mb-3 opacity-50" />
            <p>No documents in this folder</p>
            <Button variant="ghost" className="mt-2" onClick={() => openUploadDialog(selectedFolder)} data-testid="button-upload-first-in-folder">
              Upload document
            </Button>
          </div>
        )}

        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Folder</Label>
                <Select value={uploadCategory} onValueChange={setUploadCategory}>
                  <SelectTrigger data-testid="select-upload-folder">
                    <SelectValue placeholder="Select folder" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_FOLDERS.map((folder) => {
                      const Icon = folder.icon;
                      return (
                        <SelectItem key={folder.id} value={folder.category} data-testid={`option-folder-${folder.id}`}>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${folder.color}`} />
                            {folder.name}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">File</Label>
                <Input
                  type="file"
                  accept={`${ACCEPTED_FILE_TYPES.images},${ACCEPTED_FILE_TYPES.documents}`}
                  onChange={handleFileChange}
                  multiple
                  data-testid="input-file-upload"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Supported formats: JPG, PNG, GIF, PDF
                </p>
              </div>
              {selectedFiles && selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Selected files:</Label>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(selectedFiles).map((file, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {file.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)} data-testid="button-cancel-upload">
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploadMutation.isPending || !selectedFiles || selectedFiles.length === 0}
                data-testid="button-confirm-upload"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-medium">Patient Documents</h3>
        <Button size="sm" variant="outline" onClick={() => openUploadDialog()} data-testid="button-upload-document">
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {DOCUMENT_FOLDERS.map((folder) => {
          const Icon = folder.icon;
          const count = getDocumentCountByCategory(folder.category);
          return (
            <Card
              key={folder.id}
              className="hover-elevate cursor-pointer"
              onClick={() => setSelectedFolder(folder.id)}
              data-testid={`card-folder-${folder.id}`}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-muted">
                    <Icon className={`h-6 w-6 ${folder.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{folder.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {count} {count === 1 ? "file" : "files"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(!documents || documents.length === 0) && (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border-t mt-4 pt-8">
          <FileText className="h-12 w-12 mb-3 opacity-50" />
          <p>No documents uploaded yet</p>
          <Button variant="ghost" className="mt-2" onClick={() => openUploadDialog()} data-testid="button-upload-first-document">
            Upload first document
          </Button>
        </div>
      )}

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Folder</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger data-testid="select-upload-folder">
                  <SelectValue placeholder="Select folder" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_FOLDERS.map((folder) => {
                    const Icon = folder.icon;
                    return (
                      <SelectItem key={folder.id} value={folder.category} data-testid={`option-folder-${folder.id}`}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${folder.color}`} />
                          {folder.name}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">File</Label>
              <Input
                type="file"
                accept={`${ACCEPTED_FILE_TYPES.images},${ACCEPTED_FILE_TYPES.documents}`}
                onChange={handleFileChange}
                multiple
                data-testid="input-file-upload"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Supported formats: JPG, PNG, GIF, PDF
              </p>
            </div>
            {selectedFiles && selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Selected files:</Label>
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedFiles).map((file, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {file.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)} data-testid="button-cancel-upload">
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploadMutation.isPending || !selectedFiles || selectedFiles.length === 0}
              data-testid="button-confirm-upload"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AppointmentsSection({ patientId }: { patientId: string }) {
  const [, setLocation] = useLocation();
  const { data: appointments, isLoading } = useQuery<AppointmentWithDetails[]>({
    queryKey: ["/api/appointments"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const patientAppointments = appointments?.filter(
    (apt) => apt.patientId === patientId
  ) || [];

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const pastAppointments = patientAppointments.filter((apt) => {
    const aptDate = new Date(apt.startTime);
    return aptDate < today || apt.status === "completed";
  });

  const todayAppointments = patientAppointments.filter((apt) => {
    const aptDate = new Date(apt.startTime);
    return aptDate >= today && aptDate < tomorrow && apt.status !== "completed";
  });

  const upcomingAppointments = patientAppointments.filter((apt) => {
    const aptDate = new Date(apt.startTime);
    return aptDate >= tomorrow && apt.status !== "completed";
  });

  const getStatusBadgeClass = (status: string | null) => {
    switch (status) {
      case "confirmed":
        return "bg-emerald-500 text-white";
      case "pending":
        return "bg-amber-500 text-white";
      case "canceled":
        return "bg-red-500 text-white";
      case "completed":
        return "bg-blue-500 text-white";
      default:
        return "";
    }
  };

  const renderAppointmentCard = (apt: AppointmentWithDetails) => (
    <Card key={apt.id} className="hover-elevate cursor-pointer" data-testid={`card-appointment-${apt.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium" data-testid={`text-appointment-title-${apt.id}`}>{apt.title}</span>
              {apt.category && (
                <Badge variant="outline" className="text-xs">
                  {apt.category.replace(/_/g, " ")}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground" data-testid={`text-appointment-datetime-${apt.id}`}>
              {format(new Date(apt.startTime), "MMM d, yyyy 'at' h:mm a")}
            </p>
            {apt.doctor && (
              <p className="text-sm text-muted-foreground mt-1" data-testid={`text-appointment-doctor-${apt.id}`}>
                Dr. {apt.doctor.firstName} {apt.doctor.lastName}
              </p>
            )}
            {apt.notes && (
              <p className="text-sm text-muted-foreground mt-2">{apt.notes}</p>
            )}
          </div>
          <Badge className={getStatusBadgeClass(apt.status)} data-testid={`badge-appointment-status-${apt.id}`}>
            {apt.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Patient Appointments</h3>
        <Button
          size="sm"
          onClick={() => setLocation(`/appointments?patientId=${patientId}`)}
          data-testid="button-new-appointment"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Appointment
        </Button>
      </div>

      {patientAppointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mb-3 opacity-50" />
          <p>No appointments scheduled</p>
          <Button
            variant="ghost"
            className="mt-2"
            onClick={() => setLocation(`/appointments?patientId=${patientId}`)}
            data-testid="button-schedule-first-appointment"
          >
            Schedule first appointment
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {todayAppointments.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3" data-testid="text-section-today">
                Today
              </h4>
              <div className="space-y-3">
                {todayAppointments.map(renderAppointmentCard)}
              </div>
            </div>
          )}

          {upcomingAppointments.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3" data-testid="text-section-upcoming">
                Upcoming
              </h4>
              <div className="space-y-3">
                {upcomingAppointments
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  .map(renderAppointmentCard)}
              </div>
            </div>
          )}

          {pastAppointments.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3" data-testid="text-section-past">
                Past
              </h4>
              <div className="space-y-3">
                {pastAppointments
                  .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                  .map(renderAppointmentCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface QuickPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
}

function QuickPaymentDialog({ open, onOpenChange, patientId, patientName }: QuickPaymentDialogProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [notes, setNotes] = useState("");
  const [invoiceId, setInvoiceId] = useState<string>("");

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/patients", patientId, "invoices"],
    enabled: open && !!patientId,
  });

  const unpaidInvoices = invoices.filter(inv => 
    inv.status !== "paid" && inv.status !== "canceled"
  );

  const paymentMutation = useMutation({
    mutationFn: async (data: { amount: string; paymentMethod: string; notes: string; invoiceId: string }) => {
      const res = await apiRequest("POST", "/api/payments", {
        invoiceId: data.invoiceId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentDate: new Date().toISOString().split("T")[0],
        notes: data.notes || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", patientId, "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: "Payment recorded", description: `Payment of $${amount} recorded successfully.` });
      setAmount("");
      setPaymentMethod("cash");
      setNotes("");
      setInvoiceId("");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to record payment", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!amount || !invoiceId) {
      toast({ title: "Missing information", description: "Please select an invoice and enter an amount", variant: "destructive" });
      return;
    }
    paymentMutation.mutate({ amount, paymentMethod, notes, invoiceId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment for {patientName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Invoice *</Label>
            <Select value={invoiceId} onValueChange={setInvoiceId}>
              <SelectTrigger data-testid="select-quick-invoice">
                <SelectValue placeholder="Select an invoice" />
              </SelectTrigger>
              <SelectContent>
                {unpaidInvoices.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">No unpaid invoices</div>
                ) : (
                  unpaidInvoices.map((inv) => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} - ${inv.finalAmount} ({inv.status})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Amount *</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              data-testid="input-quick-payment-amount"
            />
          </div>
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger data-testid="select-quick-payment-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Optional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              data-testid="input-quick-payment-notes"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={paymentMutation.isPending} data-testid="button-submit-quick-payment">
            {paymentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface QuickAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
  doctorId?: string;
}

function QuickAppointmentDialog({ open, onOpenChange, patientId, patientName, doctorId }: QuickAppointmentDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState(30);
  const [category, setCategory] = useState("follow_up");
  const [notes, setNotes] = useState("");

  const { data: doctors = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users", { role: "doctor" }],
    enabled: open,
  });

  const [selectedDoctorId, setSelectedDoctorId] = useState(doctorId || "");

  const appointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const dateStr = data.date.toISOString().split("T")[0];
      const startDateTime = new Date(`${dateStr}T${data.startTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + data.duration * 60 * 1000);
      
      const res = await apiRequest("POST", "/api/appointments", {
        patientId: data.patientId,
        doctorId: data.doctorId || null,
        title: data.title,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        category: data.category,
        status: "pending",
        notes: data.notes || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients", patientId, "appointments"] });
      toast({ title: "Appointment created", description: "Appointment scheduled successfully." });
      setTitle("");
      setDate(undefined);
      setStartTime("09:00");
      setDuration(30);
      setCategory("follow_up");
      setNotes("");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create appointment", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!title || !date) {
      toast({ title: "Missing information", description: "Please enter a title and select a date", variant: "destructive" });
      return;
    }
    appointmentMutation.mutate({ 
      patientId, 
      doctorId: selectedDoctorId, 
      title, 
      date, 
      startTime, 
      duration, 
      category, 
      notes 
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Appointment for {patientName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              placeholder="e.g., Follow-up checkup"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-quick-appointment-title"
            />
          </div>
          <div className="space-y-2">
            <Label>Doctor</Label>
            <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
              <SelectTrigger data-testid="select-quick-appointment-doctor">
                <SelectValue placeholder="Select a doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.firstName} {doc.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={date ? date.toISOString().split("T")[0] : ""}
                onChange={(e) => setDate(e.target.value ? new Date(e.target.value) : undefined)}
                data-testid="input-quick-appointment-date"
              />
            </div>
            <div className="space-y-2">
              <Label>Time *</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                data-testid="input-quick-appointment-time"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={duration.toString()} onValueChange={(v) => setDuration(parseInt(v))}>
                <SelectTrigger data-testid="select-quick-appointment-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger data-testid="select-quick-appointment-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_visit">New Visit</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="discussion">Discussion</SelectItem>
                  <SelectItem value="surgery">Surgery</SelectItem>
                  <SelectItem value="checkup">Checkup</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Optional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              data-testid="input-quick-appointment-notes"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={appointmentMutation.isPending} data-testid="button-submit-quick-appointment">
            {appointmentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create Appointment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface EditPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
}

function EditPatientDialog({ open, onOpenChange, patient }: EditPatientDialogProps) {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState(patient.firstName);
  const [lastName, setLastName] = useState(patient.lastName);
  const [phone, setPhone] = useState(patient.phone);
  const [email, setEmail] = useState(patient.email || "");
  const [dateOfBirth, setDateOfBirth] = useState(patient.dateOfBirth || "");
  const [gender, setGender] = useState(patient.gender || "");
  const [address, setAddress] = useState(patient.address || "");
  const [emergencyContact, setEmergencyContact] = useState(patient.emergencyContact || "");
  const [emergencyPhone, setEmergencyPhone] = useState(patient.emergencyPhone || "");
  const [insuranceProvider, setInsuranceProvider] = useState(patient.insuranceProvider || "");
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState(patient.insurancePolicyNumber || "");
  const [assignedDoctorId, setAssignedDoctorId] = useState(patient.assignedDoctorId || "");
  const [notes, setNotes] = useState(patient.notes || "");

  const { data: doctors = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users", { role: "doctor" }],
    enabled: open,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Patient>) => {
      const res = await apiRequest("PATCH", `/api/patients/${patient.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", patient.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({ title: "Patient updated", description: "Patient information has been saved successfully." });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update patient", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      toast({ title: "Missing required fields", description: "First name, last name, and phone are required", variant: "destructive" });
      return;
    }
    updateMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      dateOfBirth: dateOfBirth || null,
      gender: gender as "male" | "female" | "other" | null,
      address: address.trim() || null,
      emergencyContact: emergencyContact.trim() || null,
      emergencyPhone: emergencyPhone.trim() || null,
      insuranceProvider: insuranceProvider.trim() || null,
      insurancePolicyNumber: insurancePolicyNumber.trim() || null,
      assignedDoctorId: assignedDoctorId || null,
      notes: notes.trim() || null,
    });
  };

  // Reset form when patient changes or dialog opens
  const resetForm = () => {
    setFirstName(patient.firstName);
    setLastName(patient.lastName);
    setPhone(patient.phone);
    setEmail(patient.email || "");
    setDateOfBirth(patient.dateOfBirth || "");
    setGender(patient.gender || "");
    setAddress(patient.address || "");
    setEmergencyContact(patient.emergencyContact || "");
    setEmergencyPhone(patient.emergencyPhone || "");
    setInsuranceProvider(patient.insuranceProvider || "");
    setInsurancePolicyNumber(patient.insurancePolicyNumber || "");
    setAssignedDoctorId(patient.assignedDoctorId || "");
    setNotes(patient.notes || "");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (isOpen) resetForm(); onOpenChange(isOpen); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Patient Information</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} data-testid="input-edit-firstname" />
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} data-testid="input-edit-lastname" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="input-edit-phone" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="input-edit-email" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} data-testid="input-edit-dob" />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger data-testid="select-edit-gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} data-testid="input-edit-address" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Emergency Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} data-testid="input-edit-emergency-contact" />
              </div>
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} data-testid="input-edit-emergency-phone" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Insurance Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Insurance Provider</Label>
                <Input value={insuranceProvider} onChange={(e) => setInsuranceProvider(e.target.value)} data-testid="input-edit-insurance-provider" />
              </div>
              <div className="space-y-2">
                <Label>Policy Number</Label>
                <Input value={insurancePolicyNumber} onChange={(e) => setInsurancePolicyNumber(e.target.value)} data-testid="input-edit-insurance-policy" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Assignment</h3>
            <div className="space-y-2">
              <Label>Assigned Doctor</Label>
              <Select value={assignedDoctorId} onValueChange={setAssignedDoctorId}>
                <SelectTrigger data-testid="select-edit-assigned-doctor">
                  <SelectValue placeholder="Select a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.filter(d => d.isActive).map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      Dr. {doctor.firstName} {doctor.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} data-testid="input-edit-notes" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending} data-testid="button-save-patient">
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PatientDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("personal");
  const [quickPaymentOpen, setQuickPaymentOpen] = useState(false);
  const [quickAppointmentOpen, setQuickAppointmentOpen] = useState(false);
  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
  const [editPatientOpen, setEditPatientOpen] = useState(false);
  const { user } = useAuth();

  const canEditMedicalHistory = user?.role === "admin" || user?.role === "doctor" || user?.role === "staff";

  const { data: patient, isLoading } = useQuery<Patient>({
    queryKey: ["/api/patients", params.id],
  });

  const { data: financials, isLoading: financialsLoading } = useQuery<PatientFinancials>({
    queryKey: ["/api/patients", params.id, "financials"],
  });

  if (isLoading || financialsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <User className="h-16 w-16 mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-xl font-semibold mb-2">Patient not found</h2>
        <Button variant="outline" onClick={() => setLocation("/patients")}>
          Back to Patients
        </Button>
      </div>
    );
  }

  const age = patient.dateOfBirth
    ? differenceInYears(new Date(), new Date(patient.dateOfBirth))
    : null;
  const initials = `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/patients")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Patient Profile</h1>
          <p className="text-muted-foreground">View and manage patient information</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={() => window.print()} data-testid="button-print-profile">
            <FileText className="h-4 w-4 mr-2" />
            Print Profile
          </Button>
          <Button variant="outline" onClick={() => setQuickAppointmentOpen(true)} data-testid="button-quick-appointment">
            <Calendar className="h-4 w-4 mr-2" />
            Add Appointment
          </Button>
          <Button variant="outline" onClick={() => setQuickPaymentOpen(true)} data-testid="button-quick-payment">
            <DollarSign className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
          <Button variant="outline" onClick={() => setEditPatientOpen(true)} data-testid="button-edit-patient">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      <QuickPaymentDialog 
        open={quickPaymentOpen} 
        onOpenChange={setQuickPaymentOpen} 
        patientId={patient?.id || ""} 
        patientName={patient ? `${patient.firstName} ${patient.lastName}` : ""}
      />
      <QuickAppointmentDialog 
        open={quickAppointmentOpen} 
        onOpenChange={setQuickAppointmentOpen} 
        patientId={patient?.id || ""}
        patientName={patient ? `${patient.firstName} ${patient.lastName}` : ""}
        doctorId={patient?.assignedDoctorId || undefined}
      />
      {patient && (
        <EditPatientDialog
          open={editPatientOpen}
          onOpenChange={setEditPatientOpen}
          patient={patient}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <PatientPhotoSection patient={patient} initials={initials} age={age} />

            <Separator className="my-4" />

            <div className="space-y-1">
              <InfoRow label="Phone" value={patient.phone} icon={Phone} />
              <InfoRow label="Email" value={patient.email} icon={Mail} />
              <InfoRow label="Address" value={patient.address} icon={MapPin} />
              <InfoRow
                label="Last Visit"
                value={patient.lastVisit ? format(new Date(patient.lastVisit), "MMM d, yyyy") : null}
                icon={Calendar}
              />
            </div>

            {(patient.emergencyContact || patient.emergencyPhone) && (
              <>
                <Separator className="my-4" />
                <div>
                  <h3 className="text-sm font-medium mb-2">Emergency Contact</h3>
                  <p className="text-sm">{patient.emergencyContact}</p>
                  <p className="text-sm text-muted-foreground">{patient.emergencyPhone}</p>
                </div>
              </>
            )}

            {(patient.insuranceProvider || patient.insurancePolicyNumber) && (
              <>
                <Separator className="my-4" />
                <div>
                  <h3 className="text-sm font-medium mb-2">Insurance</h3>
                  <p className="text-sm">{patient.insuranceProvider}</p>
                  <p className="text-sm text-muted-foreground">{patient.insurancePolicyNumber}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                <TabsTrigger
                  value="personal"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  data-testid="tab-personal"
                >
                  Medical History
                </TabsTrigger>
                <TabsTrigger
                  value="treatments"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  data-testid="tab-treatments"
                >
                  Treatment Chart
                </TabsTrigger>
                <TabsTrigger
                  value="financials"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  data-testid="tab-financials"
                >
                  Financials
                </TabsTrigger>
                <TabsTrigger
                  value="documents"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  data-testid="tab-documents"
                >
                  Documents
                </TabsTrigger>
                <TabsTrigger
                  value="appointments"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  data-testid="tab-appointments"
                >
                  Appointments
                </TabsTrigger>
              </TabsList>

              <div className="p-6">
                <TabsContent value="personal" className="m-0">
                  <MedicalHistorySection patient={patient} canEdit={canEditMedicalHistory} />
                </TabsContent>

                <TabsContent value="treatments" className="m-0">
                  <div className="space-y-6">
                    <ToothChart patientId={patient.id} />
                    <Separator />
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium">Treatment History</h3>
                        <Button size="sm" onClick={() => setIsTreatmentModalOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Treatment
                        </Button>
                      </div>
                      <TreatmentHistorySection 
                        patientId={patient.id} 
                        patientName={`${patient.firstName} ${patient.lastName}`}
                        financials={financials}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="financials" className="m-0">
                  <FinancialsSection 
                    patientId={patient.id} 
                    patientName={`${patient.firstName} ${patient.lastName}`} 
                    financials={financials}
                  />
                </TabsContent>

                <TabsContent value="documents" className="m-0">
                  <DocumentsSection patientId={patient.id} />
                </TabsContent>

                <TabsContent value="appointments" className="m-0">
                  <AppointmentsSection patientId={patient.id} />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
