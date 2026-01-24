import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Stethoscope, Users, Calendar, ClipboardList, Shield, Sparkles, Lightbulb, TrendingUp, FileText, DollarSign, KeyRound } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { AnimatedBackground } from "@/components/animated-background";
import { useToast } from "@/hooks/use-toast";
import glazerLogo from "@/assets/glazer-logo.png";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const features = [
  { icon: Users, title: "Patient Management" },
  { icon: Calendar, title: "Smart Scheduling" },
  { icon: ClipboardList, title: "Treatment Plans" },
  { icon: Shield, title: "Secure Access" },
];

const systemFeatures = [
  { icon: FileText, title: "Digital Records", desc: "Paperless patient files" },
  { icon: DollarSign, title: "Financial Tracking", desc: "Invoices & payments" },
  { icon: TrendingUp, title: "Analytics", desc: "Practice insights" },
];

const tips = [
  "A dental software you can rely on",
  "Schedule appointments with drag & drop",
  "Track treatment progress visually",
];

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation } = useAuth();
  const [isExiting, setIsExiting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordIdentifier, setForgotPasswordIdentifier] = useState("");
  const [forgotPasswordResult, setForgotPasswordResult] = useState<{ message: string; hint?: string } | null>(null);
  const { toast } = useToast();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (identifier: string) => {
      const response = await apiRequest("POST", "/api/password/forgot", { identifier });
      return response.json();
    },
    onSuccess: (data) => {
      setForgotPasswordResult(data);
      toast({
        title: "Request Submitted",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process request",
        variant: "destructive",
      });
    },
  });

  if (user) {
    setLocation("/");
    return null;
  }

  const onLogin = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const handleForgotPassword = () => {
    if (!forgotPasswordIdentifier.trim()) {
      toast({
        title: "Required",
        description: "Please enter your email, phone, or username",
        variant: "destructive",
      });
      return;
    }
    forgotPasswordMutation.mutate(forgotPasswordIdentifier);
  };

  const handleCreateAccount = () => {
    setIsExiting(true);
    setTimeout(() => {
      setLocation("/register");
    }, 300);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Live Animated Background */}
      <AnimatedBackground />
      
      
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Centered Sign In Form */}
      <div className={`min-h-screen flex items-center justify-center p-6 relative z-10 transition-all duration-300 ${isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <img src={glazerLogo} alt="GLAZER" className="h-20 w-auto object-contain" />
            <p className="text-sm text-muted-foreground mt-1">By Dr. Ahmad Saleh</p>
          </div>

          <Card className="border-border/50 shadow-xl backdrop-blur-sm bg-card/95">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-5">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your username"
                            className="h-11"
                            autoComplete="username"
                            {...field}
                            data-testid="input-login-username"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Password</FormLabel>
                          <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-xs text-primary hover:underline"
                            data-testid="link-forgot-password"
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter your password"
                            className="h-11"
                            autoComplete="current-password"
                            {...field}
                            data-testid="input-login-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-medium"
                    disabled={loginMutation.isPending}
                    data-testid="button-login-submit"
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </Form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    New to GLAZER?
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full h-11"
                onClick={handleCreateAccount}
                data-testid="link-create-account"
              >
                Create Account
              </Button>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>

      {/* Left Side Panel - System Features & Tips */}
      <div className={`hidden lg:flex fixed left-4 top-16 bottom-16 w-[22%] rounded-3xl bg-gradient-to-b from-primary/60 via-primary/40 to-primary/20 dark:from-primary/50 dark:via-primary/30 dark:to-primary/10 backdrop-blur-md items-center justify-center p-6 overflow-hidden border border-primary/20 transition-all duration-300 ${isExiting ? 'opacity-0 -translate-x-10' : 'opacity-100 translate-x-0'}`}>
        {/* Decorative circles */}
        <div className="absolute top-8 left-5 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-12 right-2 w-16 h-16 bg-white/10 rounded-full blur-xl" />
        
        <div className="relative z-10 text-primary-foreground w-full max-w-xs">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-4 w-4" />
            <span className="text-xs font-medium opacity-90">System Features</span>
          </div>
          
          <h2 className="text-lg font-bold mb-2">
            All-in-One Solution
          </h2>
          <p className="text-xs opacity-80 mb-5">
            Everything you need to manage your practice.
          </p>
          
          {/* System Features */}
          <div className="space-y-2 mb-6">
            {systemFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-white/10 backdrop-blur-sm"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20">
                  <feature.icon className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-medium text-sm block">{feature.title}</span>
                  <span className="text-xs opacity-70">{feature.desc}</span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Tips Section */}
          <div className="border-t border-white/20 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-3 w-3" />
              <span className="text-xs font-medium">Quick Tips</span>
            </div>
            <ul className="space-y-2">
              {tips.map((tip, index) => (
                <li key={index} className="text-xs opacity-80 flex items-start gap-2">
                  <span className="text-primary-foreground/60">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Right Side Feature Panel */}
      <div className={`hidden lg:flex fixed right-4 top-16 bottom-16 w-[22%] rounded-3xl bg-gradient-to-b from-primary/60 via-primary/40 to-primary/20 dark:from-primary/50 dark:via-primary/30 dark:to-primary/10 backdrop-blur-md items-center justify-center p-6 overflow-hidden border border-primary/20 transition-all duration-300 ${isExiting ? 'opacity-0 translate-x-10' : 'opacity-100 translate-x-0'}`}>
        {/* Decorative circles */}
        <div className="absolute top-10 right-5 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-16 left-2 w-16 h-16 bg-white/10 rounded-full blur-xl" />
        
        <div className="relative z-10 text-primary-foreground w-full max-w-xs">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-medium opacity-90">Professional</span>
          </div>
          
          <h2 className="text-lg font-bold mb-2">
            Practice Management
          </h2>
          <p className="text-xs opacity-80 mb-6">
            Run your dental practice efficiently.
          </p>
          
          {/* Feature List */}
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-white/10 backdrop-blur-sm"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20">
                  <feature.icon className="h-4 w-4" />
                </div>
                <span className="font-medium text-sm">{feature.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={(open) => {
        setShowForgotPassword(open);
        if (!open) {
          setForgotPasswordIdentifier("");
          setForgotPasswordResult(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Enter your email, phone number, or username to request a password reset.
            </DialogDescription>
          </DialogHeader>
          
          {!forgotPasswordResult ? (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email, Phone, or Username</label>
                <Input
                  placeholder="Enter your identifier"
                  value={forgotPasswordIdentifier}
                  onChange={(e) => setForgotPasswordIdentifier(e.target.value)}
                  data-testid="input-forgot-identifier"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowForgotPassword(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleForgotPassword}
                  disabled={forgotPasswordMutation.isPending}
                  data-testid="button-forgot-submit"
                >
                  {forgotPasswordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Request Reset"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <p className="text-sm">{forgotPasswordResult.message}</p>
                {forgotPasswordResult.hint && (
                  <p className="text-xs text-muted-foreground">{forgotPasswordResult.hint}</p>
                )}
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setShowForgotPassword(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
