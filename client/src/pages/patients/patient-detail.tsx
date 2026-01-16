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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToothChart } from "@/components/tooth-chart";
import type { Patient, PatientTreatmentWithDetails, Invoice, Document as PatientDocument } from "@shared/schema";

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

function MedicalHistorySection({ patient }: { patient: Patient }) {
  const allergies = patient.allergies || [];
  const conditions = patient.chronicConditions || [];
  const medications = patient.currentMedications || [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3">Allergies</h3>
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
        {medications.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {medications.map((medication, index) => (
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
    </div>
  );
}

function TreatmentHistorySection({ patientId }: { patientId: string }) {
  const { data: treatments, isLoading } = useQuery<PatientTreatmentWithDetails[]>({
    queryKey: ["/api/patients", patientId, "treatments"],
  });

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
      {treatments.map((treatment) => (
        <Card key={treatment.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{treatment.treatment?.name}</span>
                  {treatment.toothNumber && (
                    <Badge variant="outline" className="text-xs">
                      Tooth #{treatment.toothNumber}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {treatment.treatment?.category?.replace(/_/g, " ")}
                </p>
                {treatment.notes && (
                  <p className="text-sm text-muted-foreground">{treatment.notes}</p>
                )}
              </div>
              <div className="text-right">
                <Badge
                  variant={
                    treatment.status === "completed"
                      ? "default"
                      : treatment.status === "in_progress"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {treatment.status?.replace(/_/g, " ")}
                </Badge>
                <p className="text-sm font-medium mt-2">${treatment.price}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function FinancialsSection({ patientId }: { patientId: string }) {
  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/patients", patientId, "invoices"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const totalBilled = invoices?.reduce((sum, inv) => sum + Number(inv.finalAmount || 0), 0) || 0;
  const totalPaid = invoices?.reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0) || 0;
  const balance = totalBilled - totalPaid;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Billed</p>
            <p className="text-xl font-bold">${totalBilled.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
            <p className="text-xl font-bold text-emerald-600">${totalPaid.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Outstanding</p>
            <p className={`text-xl font-bold ${balance > 0 ? "text-amber-600" : "text-emerald-600"}`}>
              ${balance.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Invoice History</h3>
        {invoices && invoices.length > 0 ? (
          invoices.map((invoice) => (
            <Card key={invoice.id} className="hover-elevate cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.issuedDate && format(new Date(invoice.issuedDate), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${invoice.finalAmount}</p>
                    <Badge
                      variant={
                        invoice.status === "paid"
                          ? "default"
                          : invoice.status === "overdue"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No invoices found</p>
        )}
      </div>
    </div>
  );
}

function DocumentsSection({ patientId }: { patientId: string }) {
  const { data: documents, isLoading } = useQuery<PatientDocument[]>({
    queryKey: ["/api/patients", patientId, "documents"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Patient Documents</h3>
        <Button size="sm" variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
      </div>

      {documents && documents.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover-elevate cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {doc.fileType?.startsWith("image") ? (
                    <Camera className="h-8 w-8 text-primary" />
                  ) : (
                    <FileText className="h-8 w-8 text-primary" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.createdAt && format(new Date(doc.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mb-3 opacity-50" />
          <p>No documents uploaded</p>
          <Button variant="link" className="mt-2">
            Upload first document
          </Button>
        </div>
      )}
    </div>
  );
}

export default function PatientDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("personal");

  const { data: patient, isLoading } = useQuery<Patient>({
    queryKey: ["/api/patients", params.id],
  });

  if (isLoading) {
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
        <Button variant="outline" data-testid="button-edit-patient">
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">
                {patient.firstName} {patient.lastName}
              </h2>
              <p className="text-sm text-muted-foreground">
                ID: {patient.id.slice(0, 8)}
              </p>
              {patient.gender && (
                <Badge variant="secondary" className="mt-2 capitalize">
                  {patient.gender} {age && `• ${age} years old`}
                </Badge>
              )}
            </div>

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
              </TabsList>

              <div className="p-6">
                <TabsContent value="personal" className="m-0">
                  <MedicalHistorySection patient={patient} />
                </TabsContent>

                <TabsContent value="treatments" className="m-0">
                  <div className="space-y-6">
                    <ToothChart patientId={patient.id} />
                    <Separator />
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium">Treatment History</h3>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Treatment
                        </Button>
                      </div>
                      <TreatmentHistorySection patientId={patient.id} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="financials" className="m-0">
                  <FinancialsSection patientId={patient.id} />
                </TabsContent>

                <TabsContent value="documents" className="m-0">
                  <DocumentsSection patientId={patient.id} />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
