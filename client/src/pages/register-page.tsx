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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Loader2, GraduationCap, Stethoscope, Building2, Check, ArrowLeft, ArrowRight, CreditCard } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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

const YEARS_OF_STUDY = [
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" },
  { value: "5", label: "5th Year" },
  { value: "6", label: "6th Year" },
  { value: "intern", label: "Intern" },
];

const planDescriptions = {
  student: {
    icon: GraduationCap,
    title: "Student",
    price: "$1/year",
    description: "Perfect for dental students learning practice management",
    features: ["Up to 50 patients", "1 user account", "Basic patient management", "Appointment scheduling", "Treatment plans", "Basic reports"],
  },
  doctor: {
    icon: Stethoscope,
    title: "Doctor",
    price: "$5/month or $50/year",
    description: "For individual dentists running their practice",
    features: ["Up to 200 patients", "2 user accounts", "Full patient management", "Appointment scheduling", "Treatment plans", "Basic reports", "Lab work coordination"],
  },
  clinic: {
    icon: Building2,
    title: "Clinic Manager",
    price: "$150/year (15-day free trial)",
    description: "Complete solution for dental clinics",
    features: ["Unlimited patients", "Unlimited users", "All features included", "Advanced reporting", "Inventory management", "Insurance claims", "Expense tracking", "Full audit logs"],
  },
};

const studentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(6, "Phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  university: z.string().min(1, "University is required"),
  yearOfStudy: z.string().min(1, "Year of study is required"),
  promoCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const doctorSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(6, "Phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  specialty: z.string().min(1, "Specialty is required"),
  promoCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const clinicSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  clinicName: z.string().min(1, "Clinic name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(6, "Phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  city: z.string().min(1, "City is required"),
  promoCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type StudentFormValues = z.infer<typeof studentSchema>;
type DoctorFormValues = z.infer<typeof doctorSchema>;
type ClinicFormValues = z.infer<typeof clinicSchema>;
type PlanType = "student" | "doctor" | "clinic";

interface StripeProduct {
  id: string;
  name: string;
  description: string | null;
  metadata: { planType?: string };
  prices: Array<{
    id: string;
    unitAmount: number | null;
    currency: string;
    recurring: { interval: string } | null;
  }>;
}

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [validPromo, setValidPromo] = useState<{
    discountType: string;
    discountValue: string;
    finalAmount: number;
  } | null>(null);
  const [formData, setFormData] = useState<StudentFormValues | DoctorFormValues | ClinicFormValues | null>(null);

  const { data: productsData } = useQuery<{ products: StripeProduct[] }>({
    queryKey: ["/api/stripe/products"],
  });

  const products = productsData?.products || [];

  const studentForm = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      university: "",
      yearOfStudy: "",
      promoCode: "",
    },
  });

  const doctorForm = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      specialty: "",
      promoCode: "",
    },
  });

  const clinicForm = useForm<ClinicFormValues>({
    resolver: zodResolver(clinicSchema),
    defaultValues: {
      fullName: "",
      clinicName: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      city: "",
      promoCode: "",
    },
  });

  const validatePromoMutation = useMutation({
    mutationFn: async ({ code, planType, priceId }: { code: string; planType: string; priceId: string }) => {
      const response = await apiRequest("POST", "/api/registration/validate-promo", {
        code,
        planType,
        priceId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.valid) {
        setValidPromo({
          discountType: data.promoCode.discountType,
          discountValue: data.promoCode.discountValue,
          finalAmount: data.finalAmount,
        });
        toast({
          title: "Promo Code Applied",
          description: data.finalAmount === 0 
            ? "Your subscription is now free!" 
            : `Discount applied! New price: $${(data.finalAmount / 100).toFixed(2)}`,
        });
      } else {
        setValidPromo(null);
        toast({
          title: "Invalid Code",
          description: data.message,
          variant: "destructive",
        });
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: {
      planType: PlanType;
      formData: StudentFormValues | DoctorFormValues | ClinicFormValues;
      priceId: string;
      promoCode?: string;
    }) => {
      const response = await apiRequest("POST", "/api/registration/start", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.freeRegistration) {
        toast({
          title: "Account Created!",
          description: "Your account has been created successfully. Please sign in.",
        });
        setLocation("/auth");
      } else if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const getSelectedProduct = () => {
    if (!selectedPlan) return null;
    return products.find(p => p.metadata.planType === selectedPlan);
  };

  const getSelectedPrice = () => {
    const product = getSelectedProduct();
    if (!product) return null;
    
    if (selectedPlan === "student") {
      return product.prices.find(p => p.recurring?.interval === "year");
    }
    
    const interval = billingCycle === "monthly" ? "month" : "year";
    return product.prices.find(p => p.recurring?.interval === interval);
  };

  const handlePlanSelect = (plan: PlanType) => {
    setSelectedPlan(plan);
    setStep(2);
    setValidPromo(null);
  };

  const handleFormSubmit = (data: StudentFormValues | DoctorFormValues | ClinicFormValues) => {
    setFormData(data);
    setStep(3);
  };

  const getPromoCode = (): string | undefined => {
    if (selectedPlan === "student") return studentForm.getValues("promoCode");
    if (selectedPlan === "doctor") return doctorForm.getValues("promoCode");
    if (selectedPlan === "clinic") return clinicForm.getValues("promoCode");
    return undefined;
  };

  const handlePromoValidate = () => {
    const promoCode = getPromoCode();
    // Use a dummy ID if price isn't loaded yet to allow bypass
    const priceId = getSelectedPrice()?.id || "dev_bypass_id";
    
    if (promoCode && selectedPlan) {
      validatePromoMutation.mutate({ code: promoCode, planType: selectedPlan, priceId });
    }
  };

  const handleProceedToPayment = () => {
    if (!selectedPlan || !formData) return;
    
    const price = getSelectedPrice();
    const finalAmount = validPromo?.finalAmount ?? (price?.unitAmount || 0);
    const isFree = finalAmount === 0;

    const promoCode = getPromoCode();

    registerMutation.mutate({
      planType: selectedPlan,
      formData,
      priceId: price?.id || "dev_bypass_price", // Use a placeholder if no price is loaded
      promoCode: promoCode || undefined,
    });
  };

  const renderPlanSelection = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">How would you describe yourself?</h2>
        <p className="text-muted-foreground">Choose the plan that best fits your needs</p>
      </div>

      <div className="grid gap-4">
        {(["student", "doctor", "clinic"] as PlanType[]).map((planType) => {
          const plan = planDescriptions[planType];
          const Icon = plan.icon;
          
          return (
            <Tooltip key={planType}>
              <TooltipTrigger asChild>
                <Card
                  className="cursor-pointer hover-elevate transition-all"
                  onClick={() => handlePlanSelect(planType)}
                  data-testid={`card-plan-${planType}`}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg dental-gradient">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{plan.title}</h3>
                        <Badge variant="secondary">{plan.price}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <div className="space-y-2">
                  <p className="font-semibold">{plan.title} Plan Features:</p>
                  <ul className="text-sm space-y-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <div className="text-center pt-4">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Button variant="ghost" className="p-0 h-auto text-primary underline-offset-4 hover:underline" onClick={() => setLocation("/auth")} data-testid="link-signin">
            Sign in
          </Button>
        </p>
      </div>
    </div>
  );

  const renderStudentForm = () => (
    <Form {...studentForm}>
      <form onSubmit={studentForm.handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={studentForm.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} data-testid="input-firstname" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={studentForm.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} data-testid="input-lastname" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={studentForm.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="johndoe" {...field} data-testid="input-username" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={studentForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@university.edu" {...field} data-testid="input-email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={studentForm.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone *</FormLabel>
              <FormControl>
                <Input placeholder="+1 234 567 8900" {...field} data-testid="input-phone" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={studentForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Min. 6 characters" {...field} data-testid="input-password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={studentForm.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Confirm password" {...field} data-testid="input-confirm-password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={studentForm.control}
          name="university"
          render={({ field }) => (
            <FormItem>
              <FormLabel>University</FormLabel>
              <FormControl>
                <Input placeholder="University of Dental Sciences" {...field} data-testid="input-university" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={studentForm.control}
          name="yearOfStudy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year of Study</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-year">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {YEARS_OF_STUDY.map((year) => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={studentForm.control}
          name="promoCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Promo Code (optional)</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input placeholder="Enter code" {...field} data-testid="input-promo" />
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePromoValidate}
                  disabled={!field.value || validatePromoMutation.isPending}
                  data-testid="button-validate-promo"
                >
                  {validatePromoMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                </Button>
              </div>
      {validPromo && (
        <p className="text-sm text-green-600 mt-1">
          {validPromo.finalAmount === 0 
            ? "Development Bypass Active: Use FREE2026 to skip payment" 
            : `Discount applied: ${validPromo.discountType === "percentage" ? `${validPromo.discountValue}%` : `$${validPromo.discountValue}`}`}
        </p>
      )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => setStep(1)} data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button type="submit" className="flex-1" data-testid="button-continue">
            Continue to Payment
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </form>
    </Form>
  );

  const renderDoctorForm = () => (
    <Form {...doctorForm}>
      <form onSubmit={doctorForm.handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={doctorForm.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} data-testid="input-firstname" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={doctorForm.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} data-testid="input-lastname" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={doctorForm.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="drjohndoe" {...field} data-testid="input-username" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={doctorForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl>
                <Input type="email" placeholder="doctor@clinic.com" {...field} data-testid="input-email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={doctorForm.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone *</FormLabel>
              <FormControl>
                <Input placeholder="+1 234 567 8900" {...field} data-testid="input-phone" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={doctorForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Min. 6 characters" {...field} data-testid="input-password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={doctorForm.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Confirm password" {...field} data-testid="input-confirm-password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={doctorForm.control}
          name="specialty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Specialty</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-specialty">
                    <SelectValue placeholder="Select your specialty" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DENTAL_SPECIALTIES.map((specialty) => (
                    <SelectItem key={specialty.value} value={specialty.value}>
                      {specialty.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Billing Cycle</FormLabel>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={billingCycle === "monthly" ? "default" : "outline"}
              onClick={() => setBillingCycle("monthly")}
              className="flex-1"
              data-testid="button-monthly"
            >
              Monthly ($5/mo)
            </Button>
            <Button
              type="button"
              variant={billingCycle === "annual" ? "default" : "outline"}
              onClick={() => setBillingCycle("annual")}
              className="flex-1"
              data-testid="button-annual"
            >
              Annual ($50/yr)
              <Badge variant="secondary" className="ml-2">Save $10</Badge>
            </Button>
          </div>
        </div>

        <FormField
          control={doctorForm.control}
          name="promoCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Promo Code (optional)</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input placeholder="Enter code" {...field} data-testid="input-promo" />
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePromoValidate}
                  disabled={!field.value || validatePromoMutation.isPending}
                  data-testid="button-validate-promo"
                >
                  {validatePromoMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                </Button>
              </div>
      {validPromo && (
        <p className="text-sm text-green-600 mt-1">
          {validPromo.finalAmount === 0 
            ? "Development Bypass Active: Use FREE2026 to skip payment" 
            : `Discount applied: ${validPromo.discountType === "percentage" ? `${validPromo.discountValue}%` : `$${validPromo.discountValue}`}`}
        </p>
      )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => setStep(1)} data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button type="submit" className="flex-1" data-testid="button-continue">
            Continue to Payment
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </form>
    </Form>
  );

  const renderClinicForm = () => (
    <Form {...clinicForm}>
      <form onSubmit={clinicForm.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={clinicForm.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Dr. John Doe" {...field} data-testid="input-fullname" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={clinicForm.control}
          name="clinicName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Clinic Name</FormLabel>
              <FormControl>
                <Input placeholder="Smile Dental Clinic" {...field} data-testid="input-clinicname" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={clinicForm.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="smileclinic" {...field} data-testid="input-username" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={clinicForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl>
                <Input type="email" placeholder="contact@smileclinic.com" {...field} data-testid="input-email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={clinicForm.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone *</FormLabel>
              <FormControl>
                <Input placeholder="+1 234 567 8900" {...field} data-testid="input-phone" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={clinicForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Min. 6 characters" {...field} data-testid="input-password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={clinicForm.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Confirm password" {...field} data-testid="input-confirm-password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={clinicForm.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input placeholder="New York" {...field} data-testid="input-city" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={clinicForm.control}
          name="promoCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Promo Code (optional)</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input placeholder="Enter code" {...field} data-testid="input-promo" />
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePromoValidate}
                  disabled={!field.value || validatePromoMutation.isPending}
                  data-testid="button-validate-promo"
                >
                  {validatePromoMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                </Button>
              </div>
      {validPromo && (
        <p className="text-sm text-green-600 mt-1">
          {validPromo.finalAmount === 0 
            ? "Development Bypass Active: Use FREE2026 to skip payment" 
            : `Discount applied: ${validPromo.discountType === "percentage" ? `${validPromo.discountValue}%` : `$${validPromo.discountValue}`}`}
        </p>
      )}
              <FormMessage />
            </FormItem>
          )}
        />

        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              <span>15-day free trial included</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => setStep(1)} data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button type="submit" className="flex-1" data-testid="button-continue">
            Continue to Payment
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </form>
    </Form>
  );

  const renderPaymentConfirmation = () => {
    const price = getSelectedPrice();
    const plan = selectedPlan ? planDescriptions[selectedPlan] : null;
    
    // For student plan, if price is not loaded yet, default to 100 cents ($1.00) for display
    const displayOriginalAmount = price?.unitAmount ?? (selectedPlan === 'student' ? 100 : 0);
    const finalAmount = validPromo?.finalAmount ?? displayOriginalAmount;
    const isFree = finalAmount === 0;
    const isLoadingPrices = !productsData || products.length === 0;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Confirm Your Subscription</h2>
          <p className="text-muted-foreground">Review your order before proceeding</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {plan && <plan.icon className="h-6 w-6 text-primary" />}
              <div>
                <CardTitle>{plan?.title} Plan</CardTitle>
                <CardDescription>{plan?.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-t">
              <span className="text-muted-foreground">Billing</span>
              <span className="font-medium">
                {selectedPlan === "student" ? "Annual" : billingCycle === "monthly" ? "Monthly" : "Annual"}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-t">
              <span className="text-muted-foreground">Original Price</span>
              <span className={validPromo ? "line-through text-muted-foreground" : "font-medium"}>
                {isLoadingPrices ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Calculating...
                  </span>
                ) : (
                  `$${(displayOriginalAmount / 100).toFixed(2)}`
                )}
              </span>
            </div>

            {validPromo && (
              <div className="flex justify-between items-center py-2 border-t">
                <span className="text-green-600">Discount Applied</span>
                <span className="text-green-600 font-medium">
                  -{validPromo.discountType === "percentage" 
                    ? `${validPromo.discountValue}%` 
                    : `$${validPromo.discountValue}`}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center py-2 border-t border-t-2">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold">
                {isLoadingPrices ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isFree ? (
                  "FREE"
                ) : (
                  `$${(finalAmount / 100).toFixed(2)}`
                )}
              </span>
            </div>

            {selectedPlan === "clinic" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                <Check className="h-4 w-4 text-green-500" />
                <span>Includes 15-day free trial. You won't be charged today.</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => setStep(2)} data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button 
            className="flex-1" 
            onClick={handleProceedToPayment}
            disabled={registerMutation.isPending || isLoadingPrices || (!price && !isFree)}
            data-testid="button-pay"
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : isLoadingPrices ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading Prices...
              </>
            ) : isFree ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Create Free Account
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Proceed to Payment
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex relative">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl dental-gradient">
              <Stethoscope className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">DentalCare</h1>
              <p className="text-sm text-muted-foreground">Create your account</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  s <= step ? "dental-gradient" : "bg-muted"
                }`}
              />
            ))}
          </div>

          <Card>
            <CardContent className="pt-6">
              {step === 1 && renderPlanSelection()}
              {step === 2 && selectedPlan === "student" && renderStudentForm()}
              {step === 2 && selectedPlan === "doctor" && renderDoctorForm()}
              {step === 2 && selectedPlan === "clinic" && renderClinicForm()}
              {step === 3 && renderPaymentConfirmation()}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 dental-gradient items-center justify-center p-12">
        <div className="max-w-lg text-white">
          <h2 className="text-3xl font-bold mb-4">
            Start Managing Your Dental Practice Today
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Join thousands of dental professionals who trust DentalCare for their practice management needs.
          </p>
          {selectedPlan && (
            <div className="space-y-3">
              <p className="font-semibold">Your {planDescriptions[selectedPlan].title} plan includes:</p>
              <ul className="space-y-2">
                {planDescriptions[selectedPlan].features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
