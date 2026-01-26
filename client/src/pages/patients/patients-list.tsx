import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { format, differenceInYears } from "date-fns";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  Loader2,
  Users,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Calendar,
  AlertCircle,
  X,
  User,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { AddPatientDialog } from "./add-patient-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Patient } from "@shared/schema";

const DESKTOP_BREAKPOINT = 1024;

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const onChange = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isDesktop;
}

function calculateAge(dateOfBirth: string | null | undefined): string {
  if (!dateOfBirth) return "N/A";
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return `${age} years`;
}

function calculateAgeNumber(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth) return null;
  return differenceInYears(new Date(), new Date(dateOfBirth));
}

interface PatientPreviewPanelProps {
  patient: Patient;
  onClose: () => void;
  onViewFullProfile: () => void;
  onScheduleAppointment: () => void;
}

function PatientPreviewPanel({
  patient,
  onClose,
  onViewFullProfile,
  onScheduleAppointment,
}: PatientPreviewPanelProps) {
  const initials = `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`;
  const age = calculateAgeNumber(patient.dateOfBirth);
  const allergies = patient.allergies || [];
  const conditions = patient.chronicConditions || [];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">Patient Preview</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-testid="button-close-preview"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <ScrollArea className="flex-1">
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={patient.photoUrl || undefined} alt={`${patient.firstName} ${patient.lastName}`} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold" data-testid="text-preview-patient-name">
                {patient.firstName} {patient.lastName}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                {age !== null && (
                  <span data-testid="text-preview-patient-age">{age} years old</span>
                )}
                {age !== null && patient.gender && <span>·</span>}
                {patient.gender && (
                  <Badge variant="secondary" className="capitalize" data-testid="text-preview-patient-gender">
                    {patient.gender}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Contact Information
            </h4>
            <div className="space-y-2 pl-6">
              {patient.phone && (
                <div className="flex items-center gap-2 text-sm" data-testid="text-preview-patient-phone">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{patient.phone}</span>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-2 text-sm" data-testid="text-preview-patient-email">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate">{patient.email}</span>
                </div>
              )}
              {patient.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate">{patient.address}</span>
                </div>
              )}
              {!patient.phone && !patient.email && !patient.address && (
                <p className="text-sm text-muted-foreground">No contact information available</p>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              Medical History Summary
            </h4>
            <div className="space-y-4 pl-6">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Allergies</p>
                {allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5" data-testid="preview-allergies">
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
              <div>
                <p className="text-xs text-muted-foreground mb-2">Chronic Conditions</p>
                {conditions.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5" data-testid="preview-conditions">
                    {conditions.map((condition, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No chronic conditions</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Last Visit
            </h4>
            <p className="text-sm pl-6" data-testid="text-preview-last-visit">
              {patient.lastVisit
                ? format(new Date(patient.lastVisit), "MMMM d, yyyy")
                : "No previous visits"}
            </p>
          </div>

          <Separator />

          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={onViewFullProfile} data-testid="button-view-full-profile">
              <Eye className="h-4 w-4 mr-2" />
              View Full Profile
            </Button>
            <Button variant="outline" onClick={onScheduleAppointment} data-testid="button-schedule-appointment">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Appointment
            </Button>
          </div>
        </CardContent>
      </ScrollArea>
    </Card>
  );
}

export default function PatientsList() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  const showNewDialog = urlParams.get("action") === "new";
  const isDesktop = useIsDesktop();

  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"name" | "age" | "date">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(showNewDialog);
  const [deletePatient, setDeletePatient] = useState<Patient | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const pageSize = 10;

  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients", { search: searchTerm, gender: genderFilter }],
  });

  const deletePatientMutation = useMutation({
    mutationFn: async (patientId: string) => {
      await apiRequest("DELETE", `/api/patients/${patientId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Patient deleted",
        description: "The patient record has been permanently removed.",
      });
      if (selectedPatient && selectedPatient.id === deletePatient?.id) {
        setSelectedPatient(null);
      }
      setDeletePatient(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete patient",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredPatients = patients?.filter((patient) => {
    const matchesSearch =
      !searchTerm ||
      `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone?.includes(searchTerm) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = genderFilter === "all" || patient.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  const sortedPatients = [...(filteredPatients || [])].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "name":
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        comparison = nameA.localeCompare(nameB);
        break;
      case "age":
        const ageA = a.dateOfBirth ? differenceInYears(new Date(), new Date(a.dateOfBirth)) : 0;
        const ageB = b.dateOfBirth ? differenceInYears(new Date(), new Date(b.dateOfBirth)) : 0;
        comparison = ageA - ageB;
        break;
      case "date":
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        comparison = dateA - dateB;
        break;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const totalPages = Math.ceil((sortedPatients?.length || 0) / pageSize);
  const paginatedPatients = sortedPatients?.slice((page - 1) * pageSize, page * pageSize);

  const handleCloseDialog = () => {
    setDialogOpen(false);
    if (showNewDialog) {
      setLocation("/patients");
    }
  };

  const handlePatientClick = (patient: Patient) => {
    if (isDesktop) {
      setSelectedPatient(patient);
    } else {
      setLocation(`/patients/${patient.id}`);
    }
  };

  const handleViewFullProfile = () => {
    if (selectedPatient) {
      setLocation(`/patients/${selectedPatient.id}`);
    }
  };

  const handleScheduleAppointment = () => {
    if (selectedPatient) {
      setLocation(`/appointments?action=new&patientId=${selectedPatient.id}`);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patients</h1>
          <p className="text-muted-foreground">
            Manage your patient records and information
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-add-patient">
          <Plus className="h-4 w-4 mr-2" />
          Add Patient
        </Button>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        <div className={`flex flex-col min-h-0 ${isDesktop && selectedPatient ? "flex-1" : "w-full"}`}>
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="pb-4 flex-shrink-0">
              <div className="flex flex-col gap-3">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, phone, or email..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="input-patient-search"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={`${sortField}-${sortOrder}`} onValueChange={(v) => {
                    const [field, order] = v.split("-") as ["name" | "age" | "date", "asc" | "desc"];
                    setSortField(field);
                    setSortOrder(order);
                  }}>
                    <SelectTrigger className="w-[140px]" data-testid="select-sort-patients">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name-asc">Name A-Z</SelectItem>
                      <SelectItem value="name-desc">Name Z-A</SelectItem>
                      <SelectItem value="age-asc">Age Young-Old</SelectItem>
                      <SelectItem value="age-desc">Age Old-Young</SelectItem>
                      <SelectItem value="date-asc">Date Oldest First</SelectItem>
                      <SelectItem value="date-desc">Date Newest First</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={genderFilter} onValueChange={setGenderFilter}>
                    <SelectTrigger className="w-[120px] sm:w-[140px]" data-testid="select-gender-filter">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genders</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : paginatedPatients && paginatedPatients.length > 0 ? (
                <>
                  <div className="rounded-lg border flex-1 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Patient</TableHead>
                          <TableHead className="hidden md:table-cell">Contact</TableHead>
                          <TableHead className="hidden lg:table-cell">Age</TableHead>
                          <TableHead className="hidden lg:table-cell">Gender</TableHead>
                          <TableHead className="hidden sm:table-cell">Last Visit</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedPatients.map((patient) => {
                          const initials = `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`;
                          const isSelected = selectedPatient?.id === patient.id;
                          return (
                            <TableRow
                              key={patient.id}
                              className={`hover-elevate cursor-pointer ${isSelected ? "bg-accent" : ""}`}
                              onClick={() => handlePatientClick(patient)}
                              onDoubleClick={() => setLocation(`/patients/${patient.id}`)}
                              data-testid={`row-patient-${patient.id}`}
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                    <AvatarImage src={patient.photoUrl || undefined} alt={`${patient.firstName} ${patient.lastName}`} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                                      {initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">
                                      {patient.firstName} {patient.lastName}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      ID: {patient.id.slice(0, 8)}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <div className="flex flex-col gap-1">
                                  {patient.phone && (
                                    <div className="flex items-center gap-1.5 text-sm">
                                      <Phone className="h-3 w-3 text-muted-foreground" />
                                      {patient.phone}
                                    </div>
                                  )}
                                  {patient.email && (
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                      <Mail className="h-3 w-3" />
                                      <span className="truncate max-w-[150px]">{patient.email}</span>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">{calculateAge(patient.dateOfBirth)}</TableCell>
                              <TableCell className="hidden lg:table-cell">
                                {patient.gender ? (
                                  <Badge variant="secondary" className="capitalize">
                                    {patient.gender}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                {patient.lastVisit ? (
                                  format(new Date(patient.lastVisit), "MMM d, yyyy")
                                ) : (
                                  <span className="text-muted-foreground">Never</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" data-testid={`button-patient-actions-${patient.id}`}>
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setLocation(`/patients/${patient.id}`);
                                      }}
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setLocation(`/patients/${patient.id}?edit=true`);
                                      }}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeletePatient(patient);
                                      }}
                                      data-testid={`button-delete-patient-${patient.id}`}
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

                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4 flex-shrink-0">
                      <p className="text-sm text-muted-foreground text-center sm:text-left">
                        Showing {(page - 1) * pageSize + 1} to{" "}
                        {Math.min(page * pageSize, sortedPatients?.length || 0)} of{" "}
                        {sortedPatients?.length || 0} patients
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page - 1)}
                          disabled={page === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="hidden sm:inline">Previous</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page + 1)}
                          disabled={page === totalPages}
                        >
                          <span className="hidden sm:inline">Next</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Users className="h-16 w-16 mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-1">No patients found</h3>
                  <p className="text-sm mb-4">
                    {searchTerm || genderFilter !== "all"
                      ? "Try adjusting your search or filters"
                      : "Get started by adding your first patient"}
                  </p>
                  {!searchTerm && genderFilter === "all" && (
                    <Button onClick={() => setDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Patient
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {isDesktop && selectedPatient && (
          <div className="w-96 flex-shrink-0" data-testid="patient-preview-panel">
            <PatientPreviewPanel
              patient={selectedPatient}
              onClose={() => setSelectedPatient(null)}
              onViewFullProfile={handleViewFullProfile}
              onScheduleAppointment={handleScheduleAppointment}
            />
          </div>
        )}
      </div>

      <AddPatientDialog open={dialogOpen} onOpenChange={handleCloseDialog} />

      <AlertDialog open={!!deletePatient} onOpenChange={(open) => !open && setDeletePatient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {deletePatient?.firstName} {deletePatient?.lastName}
              </span>
              ? This action cannot be undone and will permanently remove all associated records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePatient && deletePatientMutation.mutate(deletePatient.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deletePatientMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
