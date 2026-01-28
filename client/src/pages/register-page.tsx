import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Loader2, Building2, Users, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AnimatedBackground } from "@/components/animated-background";
import glazerLogo from "@/assets/glazer-logo.png";

const DENTAL_SPECIALTIES = [
  { value: "general_dentistry", label: "General Dentistry" },
  { value: "orthodontics", label: "Orthodontics" },
  { value: "periodontics", label: "Periodontics" },
  { value: "endodontics", label: "Endodontics" },
  { value: "prosthodontics", label: "Prosthodontics" },
  { value: "oral_surgery", label: "Oral Surgery" },
  { value: "pediatric_dentistry", label: "Pediatric Dentistry" },
  { value: "cosmetic_dentistry", label: "Cosmetic Dentistry" },
  { value: "implantology", label: "Implantology" },
  { value: "oral_pathology", label: "Oral Pathology" },
];

type RegistrationMode = "create_clinic" | "join_clinic";

const createClinicSchema = z.object({
  clinicName: z.string().min(2, "Clinic name must be at least 2 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  specialty: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const joinClinicSchema = z.object({
  clinicSlug: z.string().min(1, "Please select a clinic"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  specialty: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type CreateClinicFormValues = z.infer<typeof createClinicSchema>;
type JoinClinicFormValues = z.infer<typeof joinClinicSchema>;

interface Clinic {
  id: string;
  name: string;
  slug: string;
}

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [mode, setMode] = useState<RegistrationMode | null>(null);

  const { data: clinicsData } = useQuery<{ clinics: Clinic[] }>({
    queryKey: ["/api/clinics"],
  });

  const clinics = clinicsData?.clinics || [];

  const createClinicForm = useForm<CreateClinicFormValues>({
    resolver: zodResolver(createClinicSchema),
    defaultValues: {
      clinicName: "",
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      specialty: "",
    },
  });

  const joinClinicForm = useForm<JoinClinicFormValues>({
    resolver: zodResolver(joinClinicSchema),
    defaultValues: {
      clinicSlug: "",
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      specialty: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Registration Successful",
        description: data.message,
      });
      setLocation("/auth");
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleModeSelect = (selectedMode: RegistrationMode) => {
    setMode(selectedMode);
    setStep(2);
  };

  const handleCreateClinicSubmit = (data: CreateClinicFormValues) => {
    registerMutation.mutate({
      mode: "create_clinic",
      clinicName: data.clinicName,
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      email: data.email || undefined,
      phone: data.phone || undefined,
      password: data.password,
      specialty: data.specialty || undefined,
    });
  };

  const handleJoinClinicSubmit = (data: JoinClinicFormValues) => {
    registerMutation.mutate({
      mode: "join_clinic",
      clinicSlug: data.clinicSlug,
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      email: data.email || undefined,
      phone: data.phone || undefined,
      password: data.password,
      specialty: data.specialty || undefined,
    });
  };

  const goBack = () => {
    if (step === 2) {
      setStep(1);
      setMode(null);
    } else {
      setLocation("/auth");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground preset="geometric" />
      
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-lg relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={glazerLogo} alt="GLAZER" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl">
            {step === 1 ? "Create Your Account" : mode === "create_clinic" ? "Create New Clinic" : "Join Existing Clinic"}
          </CardTitle>
          <CardDescription>
            {step === 1 
              ? "Choose how you want to get started with GLAZER"
              : mode === "create_clinic"
              ? "Set up your clinic and become the administrator"
              : "Request to join an existing clinic"
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <button
                onClick={() => handleModeSelect("create_clinic")}
                className="w-full p-6 border rounded-lg hover-elevate flex items-start gap-4 text-left transition-all"
                data-testid="button-create-clinic"
              >
                <div className="p-3 rounded-full bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Create New Clinic</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start fresh with your own dental practice. You'll be the clinic administrator with full control.
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleModeSelect("join_clinic")}
                className="w-full p-6 border rounded-lg hover-elevate flex items-start gap-4 text-left transition-all"
                data-testid="button-join-clinic"
              >
                <div className="p-3 rounded-full bg-secondary/10">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Join Existing Clinic</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Request to join a clinic that's already using GLAZER. An administrator will approve your request.
                  </p>
                </div>
              </button>

              <div className="pt-4">
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setLocation("/auth")}
                  data-testid="button-back-to-login"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Button>
              </div>
            </div>
          )}

          {step === 2 && mode === "create_clinic" && (
            <Form {...createClinicForm}>
              <form onSubmit={createClinicForm.handleSubmit(handleCreateClinicSubmit)} className="space-y-4">
                <FormField
                  control={createClinicForm.control}
                  name="clinicName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clinic Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your clinic name" {...field} data-testid="input-clinic-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createClinicForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="First name" {...field} data-testid="input-first-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createClinicForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Last name" {...field} data-testid="input-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={createClinicForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username *</FormLabel>
                      <FormControl>
                        <Input placeholder="Choose a username" {...field} data-testid="input-username" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createClinicForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your@email.com" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createClinicForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone number" {...field} data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createClinicForm.control}
                  name="specialty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialty</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-specialty">
                            <SelectValue placeholder="Select specialty (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DENTAL_SPECIALTIES.map((spec) => (
                            <SelectItem key={spec.value} value={spec.value}>
                              {spec.label}
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
                    control={createClinicForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Password" {...field} data-testid="input-password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createClinicForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirm" {...field} data-testid="input-confirm-password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={goBack} className="flex-1" data-testid="button-back">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={registerMutation.isPending} data-testid="button-submit">
                    {registerMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Create Clinic
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {step === 2 && mode === "join_clinic" && (
            <Form {...joinClinicForm}>
              <form onSubmit={joinClinicForm.handleSubmit(handleJoinClinicSubmit)} className="space-y-4">
                <FormField
                  control={joinClinicForm.control}
                  name="clinicSlug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Clinic *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-clinic">
                            <SelectValue placeholder="Choose a clinic to join" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clinics.map((clinic) => (
                            <SelectItem key={clinic.id} value={clinic.slug}>
                              {clinic.name}
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
                    control={joinClinicForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="First name" {...field} data-testid="input-first-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={joinClinicForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Last name" {...field} data-testid="input-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={joinClinicForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username *</FormLabel>
                      <FormControl>
                        <Input placeholder="Choose a username" {...field} data-testid="input-username" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={joinClinicForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your@email.com" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={joinClinicForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone number" {...field} data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={joinClinicForm.control}
                  name="specialty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialty</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-specialty">
                            <SelectValue placeholder="Select specialty (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DENTAL_SPECIALTIES.map((spec) => (
                            <SelectItem key={spec.value} value={spec.value}>
                              {spec.label}
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
                    control={joinClinicForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Password" {...field} data-testid="input-password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={joinClinicForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirm" {...field} data-testid="input-confirm-password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
                  Your registration will be reviewed by a clinic administrator. You'll be able to sign in once approved.
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={goBack} className="flex-1" data-testid="button-back">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={registerMutation.isPending} data-testid="button-submit">
                    {registerMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="mr-2 h-4 w-4" />
                    )}
                    Request to Join
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
