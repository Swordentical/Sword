import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeTransitionLayer } from "@/components/theme-transition-layer";
import { AnimatedBackground } from "@/components/animated-background";
import { AppearanceSettingsProvider } from "@/hooks/use-appearance-settings";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationCenter } from "@/components/notification-center";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import PatientsList from "@/pages/patients/patients-list";
import PatientDetail from "@/pages/patients/patient-detail";
import AppointmentsPage from "@/pages/appointments/appointments-page";
import DoctorsPage from "@/pages/doctors/doctors-page";
import ServicesPage from "@/pages/services/services-page";
import InventoryPage from "@/pages/inventory/inventory-page";
import LabWorkPage from "@/pages/lab-work/lab-work-page";
import FinancialsPage from "@/pages/financials/financials-page";
import ReportsPage from "@/pages/financials/reports-page";
import ExpensesPage from "@/pages/financials/expenses-page";
import InsuranceClaimsPage from "@/pages/financials/insurance-claims-page";
import SettingsPage from "@/pages/settings/settings-page";
import UserManagement from "@/pages/admin/user-management";
import AuditLogsPage from "@/pages/audit-logs-page";
import PricingPage from "@/pages/subscription/pricing-page";
import ManageSubscriptionPage from "@/pages/subscription/manage-page";
import RegisterPage from "@/pages/register-page";
import RegistrationSuccessPage from "@/pages/registration-success";

function MainLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 h-14 px-4 border-b shrink-0 bg-background backdrop-blur-[var(--elements-blur,2px)] [background-color:hsl(var(--background)/var(--elements-transparency,0.5))]">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <NotificationCenter />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function DashboardPage() {
  return (
    <MainLayout>
      <Dashboard />
    </MainLayout>
  );
}

function PatientsListPage() {
  return (
    <MainLayout>
      <PatientsList />
    </MainLayout>
  );
}

function PatientDetailPage() {
  return (
    <MainLayout>
      <PatientDetail />
    </MainLayout>
  );
}

function AppointmentsPageWrapper() {
  return (
    <MainLayout>
      <AppointmentsPage />
    </MainLayout>
  );
}

function ServicesPageWrapper() {
  return (
    <MainLayout>
      <ServicesPage />
    </MainLayout>
  );
}

function InventoryPageWrapper() {
  return (
    <MainLayout>
      <InventoryPage />
    </MainLayout>
  );
}

function LabWorkPageWrapper() {
  return (
    <MainLayout>
      <LabWorkPage />
    </MainLayout>
  );
}

function FinancialsPageWrapper() {
  return (
    <MainLayout>
      <FinancialsPage />
    </MainLayout>
  );
}

function ReportsPageWrapper() {
  return (
    <MainLayout>
      <ReportsPage />
    </MainLayout>
  );
}

function ExpensesPageWrapper() {
  return (
    <MainLayout>
      <ExpensesPage />
    </MainLayout>
  );
}

function InsuranceClaimsPageWrapper() {
  return (
    <MainLayout>
      <InsuranceClaimsPage />
    </MainLayout>
  );
}

function SettingsPageWrapper() {
  return (
    <MainLayout>
      <SettingsPage />
    </MainLayout>
  );
}

function UserManagementPageWrapper() {
  return (
    <MainLayout>
      <UserManagement />
    </MainLayout>
  );
}

function DoctorsPageWrapper() {
  return (
    <MainLayout>
      <DoctorsPage />
    </MainLayout>
  );
}

function AuditLogsPageWrapper() {
  return (
    <MainLayout>
      <AuditLogsPage />
    </MainLayout>
  );
}

function PricingPageWrapper() {
  return (
    <MainLayout>
      <PricingPage />
    </MainLayout>
  );
}

function ManageSubscriptionPageWrapper() {
  return (
    <MainLayout>
      <ManageSubscriptionPage />
    </MainLayout>
  );
}

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/patients" component={PatientsListPage} />
      <ProtectedRoute path="/patients/:id" component={PatientDetailPage} />
      <ProtectedRoute path="/appointments" component={AppointmentsPageWrapper} />
      <ProtectedRoute path="/doctors" component={DoctorsPageWrapper} />
      <ProtectedRoute path="/services" component={ServicesPageWrapper} />
      <ProtectedRoute path="/inventory" component={InventoryPageWrapper} />
      <ProtectedRoute path="/lab-work" component={LabWorkPageWrapper} />
      <ProtectedRoute path="/financials" component={FinancialsPageWrapper} />
      <ProtectedRoute path="/reports" component={ReportsPageWrapper} />
      <ProtectedRoute path="/expenses" component={ExpensesPageWrapper} />
      <ProtectedRoute path="/insurance-claims" component={InsuranceClaimsPageWrapper} />
      <ProtectedRoute path="/audit-logs" component={AuditLogsPageWrapper} />
      <ProtectedRoute path="/settings" component={SettingsPageWrapper} />
      <ProtectedRoute path="/admin/users" component={UserManagementPageWrapper} />
      <ProtectedRoute path="/pricing" component={PricingPageWrapper} />
      <ProtectedRoute path="/subscription" component={ManageSubscriptionPageWrapper} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/registration/success" component={RegistrationSuccessPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="dental-clinic-theme">
      <AppearanceSettingsProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <AnimatedBackground />
              <Router />
              <Toaster />
              <ThemeTransitionLayer />
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </AppearanceSettingsProvider>
    </ThemeProvider>
  );
}

export default App;
