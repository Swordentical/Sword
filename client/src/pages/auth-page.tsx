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
      
      {/* Left Side - Sign In Form (70% on desktop) */}
      <div className="flex-1 lg:w-[70%] flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 justify-center lg:justify-start">
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

      {/* Right Side - Feature Panel (30% on desktop) */}
      <div className="hidden lg:flex lg:w-[30%] bg-gradient-to-b from-primary/90 to-primary dark:from-primary/80 dark:to-primary/90 items-center justify-center p-8 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-20 left-5 w-24 h-24 bg-white/10 rounded-full blur-xl" />
        <div className="absolute top-1/2 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 text-primary-foreground max-w-xs">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium opacity-90">Professional Solution</span>
          </div>
          
          <h2 className="text-2xl font-bold mb-4">
            Modern Practice Management
          </h2>
          <p className="text-sm opacity-80 mb-8">
            Everything you need to run your dental practice efficiently.
          </p>
          
          {/* Feature List */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20">
                  <feature.icon className="h-4 w-4" />
                </div>
                <span className="font-medium text-sm">{feature.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
