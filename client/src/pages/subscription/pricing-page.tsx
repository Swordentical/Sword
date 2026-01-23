import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, Star, Building2, GraduationCap, Stethoscope, Loader2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useLocation } from "wouter";

interface PlanPrice {
  id: string;
  unit_amount: number | null;
  recurring: {
    interval: string;
    interval_count: number;
  } | null;
}

interface StripeProduct {
  id: string;
  name: string;
  description: string | null;
  metadata: {
    planType?: string;
    patientLimit?: string;
    userLimit?: string;
    features?: string;
  };
  prices: PlanPrice[];
}

const planIcons: Record<string, typeof Building2> = {
  clinic: Building2,
  doctor: Stethoscope,
  student: GraduationCap,
};

const planColors: Record<string, string> = {
  clinic: "border-primary bg-primary/5",
  doctor: "border-blue-500 bg-blue-500/5",
  student: "border-green-500 bg-green-500/5",
};

const planFeatures: Record<string, string[]> = {
  student: [
    "Up to 50 patients",
    "1 user account",
    "Basic patient management",
    "Appointment scheduling",
    "Treatment plans",
    "Email support",
  ],
  doctor: [
    "Up to 200 patients",
    "2 user accounts",
    "Full patient management",
    "Appointment scheduling",
    "Treatment plans",
    "Basic reports",
    "Lab work coordination",
    "Priority email support",
  ],
  clinic: [
    "Unlimited patients",
    "Unlimited users",
    "All features included",
    "Advanced reporting",
    "Inventory management",
    "Insurance claims",
    "Expense tracking",
    "Full audit logs",
    "15-day free trial",
    "Priority support",
  ],
};

function formatPrice(amount: number | null, interval: string | undefined): string {
  if (amount === null) return "Free";
  const price = amount / 100;
  if (interval === "year") {
    return `$${price}/year`;
  }
  return `$${price}/month`;
}

export default function PricingPage() {
  const { user } = useAuth();
  const { subscriptionContext } = useSubscription();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [promoCode, setPromoCode] = useState("");
  const [validPromo, setValidPromo] = useState<{ discountType: string; discountValue: string } | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const { data: productsData, isLoading } = useQuery<{ products: StripeProduct[] }>({
    queryKey: ["/api/stripe/products"],
  });
  
  const products = productsData?.products || [];

  const checkoutMutation = useMutation({
    mutationFn: async ({ priceId, planType }: { priceId: string; planType: string }) => {
      const response = await apiRequest("POST", "/api/stripe/checkout", {
        priceId,
        planType,
        promoCode: validPromo ? promoCode : undefined,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.freeUpgrade) {
        toast({
          title: "Plan Updated!",
          description: "Your subscription has been updated successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        setSelectedPlan(null);
        setSelectedPriceId(null);
        setValidPromo(null);
        setPromoCode("");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to start checkout. Please try again.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const validatePromoMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/subscription/validate-promo", {
        code,
        planType: selectedPlan,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.valid) {
        setValidPromo({
          discountType: data.promoCode.discountType,
          discountValue: data.promoCode.discountValue,
        });
        toast({
          title: "Promo Code Applied",
          description: `Discount: ${data.promoCode.discountType === "percentage" ? `${data.promoCode.discountValue}%` : `$${data.promoCode.discountValue}`}`,
        });
      } else {
        toast({
          title: "Invalid Code",
          description: data.message,
          variant: "destructive",
        });
      }
    },
  });

  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);

  const handleSelectPlan = (priceId: string, planType: string) => {
    if (!user) {
      setLocation("/auth");
      return;
    }
    setSelectedPlan(planType);
    setSelectedPriceId(priceId);
  };

  const handleProceedToCheckout = () => {
    if (selectedPriceId && selectedPlan) {
      checkoutMutation.mutate({ priceId: selectedPriceId, planType: selectedPlan });
    }
  };

  const handleValidatePromo = () => {
    if (promoCode.trim() && selectedPlan) {
      validatePromoMutation.mutate(promoCode.trim());
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const sortedProducts = products.length > 0 ? [...products].sort((a, b) => {
    const order = { student: 0, doctor: 1, clinic: 2 };
    const aType = a.metadata.planType || "";
    const bType = b.metadata.planType || "";
    return (order[aType as keyof typeof order] || 0) - (order[bType as keyof typeof order] || 0);
  }) : [
    {
      id: "prod_student",
      name: "Student",
      description: "Perfect for dental students learning practice management",
      metadata: { planType: "student" },
      prices: [{ id: "price_student", unit_amount: 100, recurring: { interval: "year", interval_count: 1 } }]
    },
    {
      id: "prod_doctor",
      name: "Doctor",
      description: "For individual dentists running their practice",
      metadata: { planType: "doctor" },
      prices: [{ id: "price_doctor", unit_amount: 5000, recurring: { interval: "year", interval_count: 1 } }]
    },
    {
      id: "prod_clinic",
      name: "Clinic Manager",
      description: "Complete solution for dental clinics",
      metadata: { planType: "clinic" },
      prices: [{ id: "price_clinic", unit_amount: 15000, recurring: { interval: "year", interval_count: 1 } }]
    }
  ];

  const currentPlanType = subscriptionContext.plan?.type;

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Select the perfect plan for your dental practice. All plans include our core features 
          with varying capacity and advanced options.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {sortedProducts.map((product) => {
          const planType = product.metadata.planType || "student";
          const Icon = planIcons[planType] || GraduationCap;
          const features = planFeatures[planType] || [];
          const isPopular = planType === "clinic";
          const isCurrent = currentPlanType === planType;
          const yearlyPrice = product.prices.find((p) => p.recurring?.interval === "year");
          const monthlyPrice = product.prices.find((p) => p.recurring?.interval === "month");
          const displayPrice = yearlyPrice || monthlyPrice;

          return (
            <Card
              key={product.id}
              data-testid={`card-plan-${planType}`}
              className={`relative flex flex-col ${isPopular ? planColors.clinic : ""} ${isCurrent ? "ring-2 ring-primary" : ""}`}
            >
              {isPopular && (
                <Badge
                  className="absolute -top-3 left-1/2 -translate-x-1/2"
                  data-testid="badge-popular"
                >
                  <Crown className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              )}
              {isCurrent && (
                <Badge
                  variant="outline"
                  className="absolute -top-3 right-4"
                  data-testid="badge-current-plan"
                >
                  Current Plan
                </Badge>
              )}
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 rounded-full bg-muted">
                  <Icon className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl">{product.name}</CardTitle>
                <CardDescription className="min-h-[3rem]">
                  {product.description || `Perfect for ${planType} level users`}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold">
                    {displayPrice ? formatPrice(displayPrice.unit_amount, displayPrice.recurring?.interval) : "Contact Us"}
                  </span>
                  {yearlyPrice && monthlyPrice && (
                    <p className="text-sm text-muted-foreground mt-1">
                      or {formatPrice(monthlyPrice.unit_amount, "month")}
                    </p>
                  )}
                </div>
                <ul className="space-y-3">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-4">
                <Button
                  className="w-full"
                  size="lg"
                  variant={selectedPlan === planType ? "default" : isPopular ? "default" : "outline"}
                  disabled={isCurrent}
                  onClick={() => {
                    if (displayPrice) {
                      handleSelectPlan(displayPrice.id, planType);
                    }
                  }}
                  data-testid={`button-select-${planType}`}
                >
                  {isCurrent ? (
                    "Current Plan"
                  ) : selectedPlan === planType ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Selected
                    </>
                  ) : planType === "clinic" ? (
                    "Start Free Trial"
                  ) : (
                    "Get Started"
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {selectedPlan && (
        <Card className="max-w-md mx-auto" data-testid="card-checkout">
          <CardHeader>
            <CardTitle className="text-lg">Complete Your Order</CardTitle>
            <CardDescription>
              You've selected the {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="promo" className="sr-only">Promo Code</Label>
                <Input
                  id="promo"
                  placeholder="Enter promo code (optional)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  data-testid="input-promo-code"
                />
              </div>
              <Button
                variant="outline"
                onClick={handleValidatePromo}
                disabled={!promoCode.trim() || validatePromoMutation.isPending}
                data-testid="button-apply-promo"
              >
                {validatePromoMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Apply"
                )}
              </Button>
            </div>
            {validPromo && (
              <p className="text-sm text-green-600" data-testid="text-promo-applied">
                Promo applied: {validPromo.discountType === "percentage" 
                  ? `${validPromo.discountValue}% off` 
                  : `$${validPromo.discountValue} off`}
              </p>
            )}
            <Button
              className="w-full"
              size="lg"
              onClick={handleProceedToCheckout}
              disabled={checkoutMutation.isPending}
              data-testid="button-proceed-checkout"
            >
              {checkoutMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting to Checkout...
                </>
              ) : (
                "Proceed to Checkout"
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
