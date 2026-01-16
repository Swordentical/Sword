import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { format } from "date-fns";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { AddPatientDialog } from "./add-patient-dialog";
import type { Patient } from "@shared/schema";

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

export default function PatientsList() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  const showNewDialog = urlParams.get("action") === "new";

  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(showNewDialog);
  const pageSize = 10;

  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients", { search: searchTerm, gender: genderFilter }],
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

  const totalPages = Math.ceil((filteredPatients?.length || 0) / pageSize);
  const paginatedPatients = filteredPatients?.slice((page - 1) * pageSize, page * pageSize);

  const handleCloseDialog = () => {
    setDialogOpen(false);
    if (showNewDialog) {
      setLocation("/patients");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-patient-search"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-gender-filter">
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
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : paginatedPatients && paginatedPatients.length > 0 ? (
            <>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Last Visit</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPatients.map((patient) => {
                      const initials = `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`;
                      return (
                        <TableRow
                          key={patient.id}
                          className="hover-elevate cursor-pointer"
                          onClick={() => setLocation(`/patients/${patient.id}`)}
                          data-testid={`row-patient-${patient.id}`}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
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
                          <TableCell>
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
                          <TableCell>{calculateAge(patient.dateOfBirth)}</TableCell>
                          <TableCell>
                            {patient.gender ? (
                              <Badge variant="secondary" className="capitalize">
                                {patient.gender}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
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
                                  onClick={(e) => e.stopPropagation()}
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
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * pageSize + 1} to{" "}
                    {Math.min(page * pageSize, filteredPatients?.length || 0)} of{" "}
                    {filteredPatients?.length || 0} patients
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      Next
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

      <AddPatientDialog open={dialogOpen} onOpenChange={handleCloseDialog} />
    </div>
  );
}
