import { db } from "./db";
import { organizations, subscriptionPlans, promoCodes, users, patients } from "@shared/schema";
import { eq, and, sql, gte, lte, or, isNull } from "drizzle-orm";
import type { PlanFeatures, Organization, SubscriptionPlan, PromoCode } from "@shared/schema";

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

export class SubscriptionService {
  async getSubscriptionContext(userId: string): Promise<SubscriptionContext> {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (!user[0] || !user[0].organizationId) {
      return {
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
    }

    const org = await db.select().from(organizations).where(eq(organizations.id, user[0].organizationId)).limit(1);
    
    if (!org[0]) {
      return {
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
    }

    const organization = org[0];
    let plan: SubscriptionPlan | null = null;
    let features: PlanFeatures = FULL_FEATURES; // Default to full features (free registration)

    if (organization.subscriptionPlanId) {
      const planResult = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, organization.subscriptionPlanId)).limit(1);
      if (planResult[0]) {
        plan = planResult[0];
        features = (plan.features as PlanFeatures) || FULL_FEATURES;
      }
    }

    const now = new Date();
    const isTrial = organization.subscriptionStatus === "trial";
    // If no subscription plan, treat as active (free registration model)
    const hasNoSubscription = !organization.subscriptionPlanId;
    const isActive = hasNoSubscription || organization.subscriptionStatus === "active" || (isTrial && organization.trialEndsAt && new Date(organization.trialEndsAt) > now);
    const isExpired = !hasNoSubscription && (organization.subscriptionStatus === "expired" || 
                     (organization.subscriptionEndDate && new Date(organization.subscriptionEndDate) < now) ||
                     (isTrial && organization.trialEndsAt && new Date(organization.trialEndsAt) <= now));

    let daysRemaining: number | null = null;
    if (isTrial && organization.trialEndsAt) {
      daysRemaining = Math.ceil((new Date(organization.trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    } else if (organization.subscriptionEndDate) {
      daysRemaining = Math.ceil((new Date(organization.subscriptionEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
      organization,
      plan,
      features: isActive || isTrial || hasNoSubscription ? features : DEFAULT_FEATURES,
      limits: {
        patientLimit: plan?.patientLimit ?? null, // null means unlimited
        userLimit: plan?.userLimit ?? null, // null means unlimited
        currentPatientCount: organization.currentPatientCount ?? 0,
        currentUserCount: organization.currentUserCount ?? 1,
      },
      status: {
        isActive: Boolean(isActive && !isExpired),
        isTrial: Boolean(isTrial),
        isExpired: Boolean(isExpired),
        daysRemaining: daysRemaining && daysRemaining > 0 ? daysRemaining : null,
      },
    };
  }

  async canAddPatient(organizationId: string): Promise<{ allowed: boolean; message?: string }> {
    const org = await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1);
    if (!org[0]) return { allowed: false, message: "Organization not found" };

    const organization = org[0];
    
    // If no subscription plan, allow unlimited (free registration model)
    if (!organization.subscriptionPlanId) {
      return { allowed: true };
    }

    const planResult = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, organization.subscriptionPlanId)).limit(1);
    const plan = planResult[0];
    
    if (!plan) return { allowed: true }; // No plan means unlimited
    
    if (plan.patientLimit === null) return { allowed: true };
    
    const currentCount = organization.currentPatientCount ?? 0;
    if (currentCount >= plan.patientLimit) {
      return { 
        allowed: false, 
        message: `Patient limit reached (${currentCount}/${plan.patientLimit}). Please upgrade your plan.` 
      };
    }

    return { allowed: true };
  }

  async canAddUser(organizationId: string): Promise<{ allowed: boolean; message?: string }> {
    const org = await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1);
    if (!org[0]) return { allowed: false, message: "Organization not found" };

    const organization = org[0];
    
    // If no subscription plan, allow unlimited (free registration model)
    if (!organization.subscriptionPlanId) {
      return { allowed: true };
    }

    const planResult = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, organization.subscriptionPlanId)).limit(1);
    const plan = planResult[0];
    
    if (!plan) return { allowed: true }; // No plan means unlimited
    
    if (plan.userLimit === null) return { allowed: true };
    
    const currentCount = organization.currentUserCount ?? 1;
    if (currentCount >= plan.userLimit) {
      return { 
        allowed: false, 
        message: `User limit reached (${currentCount}/${plan.userLimit}). Please upgrade your plan.` 
      };
    }

    return { allowed: true };
  }

  async hasFeature(organizationId: string, feature: keyof PlanFeatures): Promise<boolean> {
    const org = await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1);
    // If no subscription plan, return true (free registration model - all features enabled)
    if (!org[0] || !org[0].subscriptionPlanId) return true;

    const organization = org[0];
    
    const now = new Date();
    const isTrial = organization.subscriptionStatus === "trial";
    const isActive = organization.subscriptionStatus === "active" || (isTrial && organization.trialEndsAt && new Date(organization.trialEndsAt) > now);
    
    if (!isActive && !isTrial) return false;

    const subPlanId = organization.subscriptionPlanId;
    if (!subPlanId) return false;
    const planResult = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, subPlanId)).limit(1);
    const plan = planResult[0];
    
    if (!plan) return false;
    
    const features = plan.features as PlanFeatures;
    return features[feature] ?? false;
  }

  async incrementPatientCount(organizationId: string): Promise<void> {
    await db.update(organizations)
      .set({ 
        currentPatientCount: sql`COALESCE(current_patient_count, 0) + 1`,
        updatedAt: new Date()
      })
      .where(eq(organizations.id, organizationId));
  }

  async decrementPatientCount(organizationId: string): Promise<void> {
    await db.update(organizations)
      .set({ 
        currentPatientCount: sql`GREATEST(COALESCE(current_patient_count, 0) - 1, 0)`,
        updatedAt: new Date()
      })
      .where(eq(organizations.id, organizationId));
  }

  async incrementUserCount(organizationId: string): Promise<void> {
    await db.update(organizations)
      .set({ 
        currentUserCount: sql`COALESCE(current_user_count, 1) + 1`,
        updatedAt: new Date()
      })
      .where(eq(organizations.id, organizationId));
  }

  async decrementUserCount(organizationId: string): Promise<void> {
    await db.update(organizations)
      .set({ 
        currentUserCount: sql`GREATEST(COALESCE(current_user_count, 1) - 1, 1)`,
        updatedAt: new Date()
      })
      .where(eq(organizations.id, organizationId));
  }

  async getAllPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
  }

  async validatePromoCode(code: string, planType: string): Promise<{ valid: boolean; promoCode?: PromoCode; message?: string }> {
    const promoResult = await db.select().from(promoCodes).where(
      and(
        eq(promoCodes.code, code.toUpperCase()),
        eq(promoCodes.isActive, true)
      )
    ).limit(1);

    if (!promoResult[0]) {
      return { valid: false, message: "Invalid promo code" };
    }

    const promo = promoResult[0];
    const now = new Date();

    if (promo.validFrom && new Date(promo.validFrom) > now) {
      return { valid: false, message: "Promo code is not yet active" };
    }

    if (promo.validUntil && new Date(promo.validUntil) < now) {
      return { valid: false, message: "Promo code has expired" };
    }

    if (promo.maxUses !== null && (promo.currentUses ?? 0) >= promo.maxUses) {
      return { valid: false, message: "Promo code has reached maximum uses" };
    }

    if (promo.applicablePlans && promo.applicablePlans.length > 0 && !promo.applicablePlans.includes(planType)) {
      return { valid: false, message: "Promo code is not valid for this plan" };
    }

    return { valid: true, promoCode: promo };
  }

  async applyPromoCode(promoCodeId: string): Promise<void> {
    await db.update(promoCodes)
      .set({ currentUses: sql`COALESCE(current_uses, 0) + 1` })
      .where(eq(promoCodes.id, promoCodeId));
  }

  calculateDiscountedPrice(originalPrice: number, promoCode: PromoCode): number {
    const discountValue = parseFloat(promoCode.discountValue?.toString() || "0");
    if (promoCode.discountType === "percentage") {
      return originalPrice * (1 - discountValue / 100);
    } else {
      return Math.max(0, originalPrice - discountValue);
    }
  }

  async createOrganization(
    name: string, 
    ownerId: string, 
    planType: "clinic" | "doctor" | "student",
    promoCodeId?: string
  ): Promise<Organization> {
    const planResult = await db.select().from(subscriptionPlans).where(
      and(
        eq(subscriptionPlans.type, planType),
        eq(subscriptionPlans.isActive, true)
      )
    ).limit(1);

    if (!planResult[0]) {
      throw new Error(`Plan type '${planType}' not found`);
    }

    const plan = planResult[0];
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').substring(0, 50) + '-' + Date.now().toString(36);
    
    const trialDays = plan.trialDays ?? 0;
    const now = new Date();
    const trialEndsAt = trialDays > 0 ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000) : null;

    const orgResult = await db.insert(organizations).values({
      name,
      slug,
      ownerId,
      subscriptionPlanId: plan.id,
      subscriptionStatus: trialDays > 0 ? "trial" : "active",
      billingCycle: "annual",
      trialEndsAt,
      subscriptionStartDate: trialDays > 0 ? null : now,
      subscriptionEndDate: trialDays > 0 ? null : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
      promoCodeId: promoCodeId || null,
      currentPatientCount: 0,
      currentUserCount: 1,
    }).returning();

    await db.update(users)
      .set({ 
        organizationId: orgResult[0].id,
        isOrganizationOwner: true 
      })
      .where(eq(users.id, ownerId));

    return orgResult[0];
  }
}

export const subscriptionService = new SubscriptionService();
