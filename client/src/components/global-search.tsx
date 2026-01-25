import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Search, Calendar, Package, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Patient, InventoryItem, Appointment } from "@shared/schema";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: appointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: inventory } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const filteredPatients = patients?.filter((p) =>
    `${p.firstName} ${p.lastName} ${p.phone || ""} ${p.email || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  ).slice(0, 5) || [];

  const filteredAppointments = appointments?.filter((a) =>
    (a.title || "").toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5) || [];

  const filteredInventory = inventory?.filter((item) =>
    `${item.name} ${item.category || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  ).slice(0, 5) || [];

  const handleSelectPatient = (id: string) => {
    setOpen(false);
    setSearch("");
    navigate(`/patients/${id}`);
  };

  const handleSelectAppointment = () => {
    setOpen(false);
    setSearch("");
    navigate("/appointments");
  };

  const handleSelectInventory = () => {
    setOpen(false);
    setSearch("");
    navigate("/inventory");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="justify-start text-muted-foreground gap-2 w-10 sm:w-auto px-2 sm:px-3"
          data-testid="button-global-search"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline truncate">Search...</span>
          <kbd className="hidden lg:inline-flex pointer-events-none ml-auto select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground">
            Ctrl+K
          </kbd>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[90vw] max-w-md p-0" align="end">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search patients, appointments, inventory..." 
            value={search}
            onValueChange={setSearch}
            data-testid="input-global-search"
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {filteredPatients.length > 0 && (
              <CommandGroup heading="Patients">
                {filteredPatients.map((patient) => (
                  <CommandItem
                    key={patient.id}
                    onSelect={() => handleSelectPatient(patient.id)}
                    className="gap-3 cursor-pointer"
                    data-testid={`search-result-patient-${patient.id}`}
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={patient.photoUrl || undefined} alt={`${patient.firstName} ${patient.lastName}`} />
                      <AvatarFallback className="bg-primary/10 text-foreground text-xs">
                        {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {patient.firstName} {patient.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {patient.phone || patient.email || "No contact info"}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {filteredAppointments.length > 0 && (
              <CommandGroup heading="Appointments">
                {filteredAppointments.map((appointment) => (
                  <CommandItem
                    key={appointment.id}
                    onSelect={handleSelectAppointment}
                    className="gap-3 cursor-pointer"
                    data-testid={`search-result-appointment-${appointment.id}`}
                  >
                    <div className="rounded-full bg-emerald-500/10 p-1.5">
                      <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {appointment.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(appointment.startTime), "MMM d, h:mm a")}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {filteredInventory.length > 0 && (
              <CommandGroup heading="Inventory">
                {filteredInventory.map((item) => (
                  <CommandItem
                    key={item.id}
                    onSelect={handleSelectInventory}
                    className="gap-3 cursor-pointer"
                    data-testid={`search-result-inventory-${item.id}`}
                  >
                    <div className="rounded-full bg-amber-500/10 p-1.5">
                      <Package className="h-3.5 w-3.5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.currentQuantity} {item.unit} in stock
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
