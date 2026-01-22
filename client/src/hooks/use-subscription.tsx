import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import type { PlanFeatures, SubscriptionPlan, Organization } from "@shared/schema";

export interface SubscriptionContext {
  organization: Organization | null;
  plan: SubscriptionPlan | null;
  features: PlanFeatures;
  limits: {
    patientLimit: number | null;
    userLimit: number | null;
    currentPatientCount: number;
    currentUserCount: number;
  };
  status: {
    isActive: boolean;
    isTrial: boolean;
    isExpired: boolean;
    daysRemaining: number | null;
  };
}

const DEFAULT_FEATURES: PlanFeatures = {
  dashboard: false,
  patients: false,
  appointments: false,
  financials: false,
  expenses: false,
  labWork: false,
  services: false,
  inventory: false,
  insuranceClaims: false,
  users: false,
  settings: false,
  reports: false,
  documents: false,
};

const FULL_FEATURES: PlanFeatures = {
  dashboard: true,
  patients: true,
  appointments: true,
  financials: true,
  expenses: true,
  labWork: true,
  services: true,
  inventory: true,
  insuranceClaims: true,
  users: true,
  settings: true,
  reports: true,
  documents: true,
};

const DEFAULT_CONTEXT: SubscriptionContext = {
  organization: null,
  plan: null,
  features: DEFAULT_FEATURES,
  limits: {
    patientLimit: 0,
    userLimit: 0,
    currentPatientCount: 0,
    currentUserCount: 0,
  },
  status: {
    isActive: false,
    isTrial: false,
    isExpired: true,
    daysRemaining: null,
  },
};

export function useSubscription() {
  const { user } = useAuth();

  const { data: subscriptionContext, isLoading, error } = useQuery<SubscriptionContext>({
    queryKey: ["/api/subscription/context"],
    enabled: !!user,
  });

  const hasFeature = (feature: keyof PlanFeatures): boolean => {
    if (!subscriptionContext) {
      if (!user?.organizationId) {
        return true;
      }
      return false;
    }
    return subscriptionContext.features[feature] ?? false;
  };

  const canAddPatient = (): boolean => {
    if (!subscriptionContext) return true;
    const { patientLimit, currentPatientCount } = subscriptionContext.limits;
    if (patientLimit === null) return true;
    return currentPatientCount < patientLimit;
  };

  const canAddUser = (): boolean => {
    if (!subscriptionContext) return true;
    const { userLimit, currentUserCount } = subscriptionContext.limits;
    if (userLimit === null) return true;
    return currentUserCount < userLimit;
  };

  const getPlanType = (): "clinic" | "doctor" | "student" | null => {
    return (subscriptionContext?.plan?.type as "clinic" | "doctor" | "student") ?? null;
  };

  const isSubscriptionActive = (): boolean => {
    if (!subscriptionContext) return false;
    return subscriptionContext.status.isActive || subscriptionContext.status.isTrial;
  };

  const getRemainingPatients = (): number | null => {
    if (!subscriptionContext) return null;
    const { patientLimit, currentPatientCount } = subscriptionContext.limits;
    if (patientLimit === null) return null;
    return Math.max(0, patientLimit - currentPatientCount);
  };

  const getRemainingUsers = (): number | null => {
    if (!subscriptionContext) return null;
    const { userLimit, currentUserCount } = subscriptionContext.limits;
    if (userLimit === null) return null;
    return Math.max(0, userLimit - currentUserCount);
  };

  return {
    subscriptionContext: subscriptionContext ?? DEFAULT_CONTEXT,
    isLoading,
    error,
    hasFeature,
    canAddPatient,
    canAddUser,
    getPlanType,
    isSubscriptionActive,
    getRemainingPatients,
    getRemainingUsers,
    FULL_FEATURES,
    DEFAULT_FEATURES,
  };
}
