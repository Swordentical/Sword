import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Stethoscope } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiRequest } from "@/lib/queryClient";
import glazerLogo from "@/assets/glazer-logo.png";

export default function RegistrationSuccessPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const sessionId = params.get("session_id");
  const pendingId = params.get("pending_id");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const completeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/registration/complete", {
        sessionId,
        pendingId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setStatus("success");
        setMessage("Your account has been created successfully!");
      } else {
        setStatus("error");
        setMessage(data.message || "Failed to complete registration");
      }
    },
    onError: (error: Error) => {
      setStatus("error");
      setMessage(error.message || "Failed to complete registration");
    },
  });

  useEffect(() => {
    if (sessionId && pendingId) {
      completeMutation.mutate();
    } else {
      setStatus("error");
      setMessage("Invalid registration link");
    }
  }, [sessionId, pendingId]);

  return (
    <div className="min-h-screen flex relative">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-lg overflow-hidden">
              <img src={glazerLogo} alt="GLAZER" className="h-12 w-12 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">GLAZER</h1>
              <p className="text-sm text-muted-foreground">By Dr. Ahmad Saleh</p>
            </div>
          </div>

          <Card>
            <CardHeader className="text-center">
              {status === "loading" && (
                <>
                  <div className="mx-auto mb-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  </div>
                  <CardTitle>Creating Your Account</CardTitle>
                  <CardDescription>
                    Please wait while we set up your account...
                  </CardDescription>
                </>
              )}
              {status === "success" && (
                <>
                  <div className="mx-auto mb-4">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                  </div>
                  <CardTitle>Welcome to GLAZER!</CardTitle>
                  <CardDescription>
                    {message}
                  </CardDescription>
                </>
              )}
              {status === "error" && (
                <>
                  <div className="mx-auto mb-4">
                    <XCircle className="h-12 w-12 text-red-500" />
                  </div>
                  <CardTitle>Registration Error</CardTitle>
                  <CardDescription>
                    {message}
                  </CardDescription>
                </>
              )}
            </CardHeader>
            <CardContent>
              {status === "success" && (
                <div className="space-y-4">
                  <p className="text-center text-sm text-muted-foreground">
                    Your account is ready. You can now sign in and start managing your dental practice.
                  </p>
                  <Button
                    className="w-full"
                    onClick={() => setLocation("/auth")}
                    data-testid="button-go-to-login"
                  >
                    Sign In to Your Account
                  </Button>
                </div>
              )}
              {status === "error" && (
                <div className="space-y-4">
                  <p className="text-center text-sm text-muted-foreground">
                    There was a problem completing your registration. Please try again or contact support.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setLocation("/register")}
                      data-testid="button-try-again"
                    >
                      Try Again
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => setLocation("/auth")}
                      data-testid="button-go-to-login"
                    >
                      Sign In
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 dental-gradient items-center justify-center p-12">
        <div className="max-w-lg text-white text-center">
          {status === "success" && (
            <>
              <h2 className="text-3xl font-bold mb-4">
                You're All Set!
              </h2>
              <p className="text-lg opacity-90">
                Thank you for choosing GLAZER. We're excited to help you manage your dental practice more efficiently.
              </p>
            </>
          )}
          {status === "loading" && (
            <>
              <h2 className="text-3xl font-bold mb-4">
                Almost There...
              </h2>
              <p className="text-lg opacity-90">
                We're setting up your personalized workspace and configuring your account.
              </p>
            </>
          )}
          {status === "error" && (
            <>
              <h2 className="text-3xl font-bold mb-4">
                Need Help?
              </h2>
              <p className="text-lg opacity-90">
                If you continue experiencing issues, please contact our support team for assistance.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
