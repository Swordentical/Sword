import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Loader2, Stethoscope, Users, Calendar, ClipboardList, Shield, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { AnimatedBackground } from "@/components/animated-background";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const features = [
  {
    icon: Users,
    title: "Patient Management",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
  },
  {
    icon: ClipboardList,
    title: "Treatment Plans",
  },
  {
    icon: Shield,
    title: "Secure Access",
  },
];

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation } = useAuth();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  if (user) {
    setLocation("/");
    return null;
  }

  const onLogin = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative">
      {/* Live Animated Background */}
      <AnimatedBackground />
      
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      {/* Main Content - Sign In Form (Centered, 80% on desktop) */}
      <div className="flex-1 lg:w-[80%] flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg">
              <Stethoscope className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">DentalCare</h1>
              <p className="text-sm text-muted-foreground">Clinic Management</p>
            </div>
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
                        <FormLabel>Password</FormLabel>
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
                    New to DentalCare?
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full h-11"
                onClick={() => setLocation("/register")}
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

      {/* Right Side - Feature Panel (20% on desktop, transparent gradient, rounded corners) */}
      <div className="hidden lg:flex lg:w-[20%] m-4 rounded-3xl bg-gradient-to-b from-primary/60 via-primary/40 to-primary/20 dark:from-primary/50 dark:via-primary/30 dark:to-primary/10 backdrop-blur-md items-center justify-center p-6 relative overflow-hidden border border-primary/20">
        {/* Decorative circles */}
        <div className="absolute top-10 right-5 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-16 left-2 w-16 h-16 bg-white/10 rounded-full blur-xl" />
        
        <div className="relative z-10 text-primary-foreground max-w-xs">
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
                className="flex items-center gap-2 p-2 rounded-xl bg-white/10 backdrop-blur-sm"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/20">
                  <feature.icon className="h-3.5 w-3.5" />
                </div>
                <span className="font-medium text-xs">{feature.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
