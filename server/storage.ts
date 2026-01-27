import { eq, and, gte, lte, desc, sql, or, ilike } from "drizzle-orm";
import { db } from "./db";
import {
  users, patients, treatments, patientTreatments, appointments,
  invoices, invoiceItems, payments, paymentPlans, paymentPlanInstallments,
  invoiceAdjustments, expenses, doctorPayments, insuranceClaims, inventoryItems, labCases,
  documents, orthodonticNotes, activityLog, auditLogs, clinicSettings, clinicRooms,
  externalLabs, labServices, organizations,
  type User, type InsertUser,
  type Patient, type InsertPatient,
  type Treatment, type InsertTreatment,
  type PatientTreatment, type InsertPatientTreatment,
  type Appointment, type InsertAppointment,
  type Invoice, type InsertInvoice,
  type InvoiceItem, type InsertInvoiceItem,
  type Payment, type InsertPayment,
  type PaymentPlan, type InsertPaymentPlan,
  type PaymentPlanInstallment, type InsertPaymentPlanInstallment,
  type InvoiceAdjustment, type InsertInvoiceAdjustment,
  type Expense, type InsertExpense,
  type DoctorPayment, type InsertDoctorPayment,
  type InsuranceClaim, type InsertInsuranceClaim,
  type InventoryItem, type InsertInventoryItem,
  type LabCase, type InsertLabCase,
  type Document, type InsertDocument,
  type OrthodonticNote, type InsertOrthodonticNote,
  type ActivityLog, type InsertActivityLog,
  type AuditLog, type InsertAuditLog,
  type ClinicSettings, type InsertClinicSettings,
  type ClinicRoom, type InsertClinicRoom,
  type ExternalLab, type InsertExternalLab,
  type LabService, type InsertLabService,
  type Organization, type InsertOrganization,
} from "@shared/schema";

export interface ClinicScopeOptions {
  clinicId?: string;
  isSuperAdmin?: boolean;
}

export interface IStorage {
  // Organizations
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizationBySlug(slug: string): Promise<Organization | undefined>;
  getOrganizations(): Promise<Organization[]>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, data: Partial<InsertOrganization>): Promise<Organization | undefined>;

  // Users
  getUser(id: string, scope?: ClinicScopeOptions): Promise<User | undefined>;
  getUserByUsername(username: string, scope?: ClinicScopeOptions): Promise<User | undefined>;
  getUsers(filters?: { role?: string }, scope?: ClinicScopeOptions): Promise<User[]>;
  getUsersByClinic(clinicId: string, scope?: ClinicScopeOptions): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>, scope?: ClinicScopeOptions): Promise<User | undefined>;
  deleteUser(id: string, scope?: ClinicScopeOptions): Promise<boolean>;

  // Patients
  getPatient(id: string, scope?: ClinicScopeOptions): Promise<Patient | undefined>;
  getPatients(filters?: { search?: string; assignedDoctorId?: string; assignedStudentId?: string }, scope?: ClinicScopeOptions): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: string, data: Partial<InsertPatient>, scope?: ClinicScopeOptions): Promise<Patient | undefined>;
  deletePatient(id: string, scope?: ClinicScopeOptions): Promise<boolean>;

  // Treatments (Services catalog)
  getTreatment(id: string, scope?: ClinicScopeOptions): Promise<Treatment | undefined>;
  getTreatments(scope?: ClinicScopeOptions): Promise<Treatment[]>;
  createTreatment(treatment: InsertTreatment): Promise<Treatment>;
  updateTreatment(id: string, data: Partial<InsertTreatment>, scope?: ClinicScopeOptions): Promise<Treatment | undefined>;
  deleteTreatment(id: string, scope?: ClinicScopeOptions): Promise<boolean>;

  // Patient Treatments
  getPatientTreatments(patientId: string, scope?: ClinicScopeOptions): Promise<PatientTreatment[]>;
  getPatientTreatment(id: string, scope?: ClinicScopeOptions): Promise<PatientTreatment | undefined>;
  createPatientTreatment(treatment: InsertPatientTreatment): Promise<PatientTreatment>;
  updatePatientTreatment(id: string, data: Partial<InsertPatientTreatment>, scope?: ClinicScopeOptions): Promise<PatientTreatment | undefined>;

  // Appointments
  getAppointment(id: string, scope?: ClinicScopeOptions): Promise<Appointment | undefined>;
  getAppointments(filters?: { start?: Date; end?: Date; status?: string; doctorId?: string }, scope?: ClinicScopeOptions): Promise<Appointment[]>;
  getTodayAppointments(scope?: ClinicScopeOptions): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, data: Partial<InsertAppointment>, scope?: ClinicScopeOptions): Promise<Appointment | undefined>;
  deleteAppointment(id: string, scope?: ClinicScopeOptions): Promise<boolean>;

  // Invoices
  getInvoice(id: string, scope?: ClinicScopeOptions): Promise<Invoice | undefined>;
  getInvoices(filters?: { patientId?: string; status?: string }, scope?: ClinicScopeOptions): Promise<Invoice[]>;
  getPatientInvoices(patientId: string, scope?: ClinicScopeOptions): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, data: Partial<InsertInvoice>, scope?: ClinicScopeOptions): Promise<Invoice | undefined>;

  // Invoice Items
  getInvoiceItems(invoiceId: string, scope?: ClinicScopeOptions): Promise<InvoiceItem[]>;
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  deleteInvoiceItem(id: string, scope?: ClinicScopeOptions): Promise<void>;

  // Payments
  getPayment(id: string, scope?: ClinicScopeOptions): Promise<Payment | undefined>;
  getPayments(filters?: { invoiceId?: string }, scope?: ClinicScopeOptions): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, data: Partial<InsertPayment>, scope?: ClinicScopeOptions): Promise<Payment | undefined>;
  refundPayment(id: string, reason: string, scope?: ClinicScopeOptions): Promise<Payment | undefined>;

  // Payment Plans
  getPaymentPlan(id: string, scope?: ClinicScopeOptions): Promise<PaymentPlan | undefined>;
  getPaymentPlans(filters?: { invoiceId?: string; patientId?: string; status?: string }, scope?: ClinicScopeOptions): Promise<PaymentPlan[]>;
  createPaymentPlan(plan: InsertPaymentPlan): Promise<PaymentPlan>;
  updatePaymentPlan(id: string, data: Partial<InsertPaymentPlan>, scope?: ClinicScopeOptions): Promise<PaymentPlan | undefined>;

  // Payment Plan Installments
  getPaymentPlanInstallments(paymentPlanId: string, scope?: ClinicScopeOptions): Promise<PaymentPlanInstallment[]>;
  createPaymentPlanInstallment(installment: InsertPaymentPlanInstallment): Promise<PaymentPlanInstallment>;
  updatePaymentPlanInstallment(id: string, data: Partial<InsertPaymentPlanInstallment>, scope?: ClinicScopeOptions): Promise<PaymentPlanInstallment | undefined>;

  // Invoice Adjustments
  getInvoiceAdjustments(invoiceId: string, scope?: ClinicScopeOptions): Promise<InvoiceAdjustment[]>;
  createInvoiceAdjustment(adjustment: InsertInvoiceAdjustment): Promise<InvoiceAdjustment>;

  // Expenses
  getExpense(id: string, scope?: ClinicScopeOptions): Promise<Expense | undefined>;
  getExpenses(filters?: { category?: string; startDate?: string; endDate?: string }, scope?: ClinicScopeOptions): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, data: Partial<InsertExpense>, scope?: ClinicScopeOptions): Promise<Expense | undefined>;
  deleteExpense(id: string, scope?: ClinicScopeOptions): Promise<boolean>;

  // Doctor Payments
  getDoctorPayment(id: string, scope?: ClinicScopeOptions): Promise<DoctorPayment | undefined>;
  getDoctorPayments(filters?: { doctorId?: string; startDate?: string; endDate?: string; paymentType?: string }, scope?: ClinicScopeOptions): Promise<(DoctorPayment & { doctor?: User })[]>;
  createDoctorPayment(payment: InsertDoctorPayment): Promise<DoctorPayment>;
  updateDoctorPayment(id: string, data: Partial<InsertDoctorPayment>, scope?: ClinicScopeOptions): Promise<DoctorPayment | undefined>;
  deleteDoctorPayment(id: string, scope?: ClinicScopeOptions): Promise<boolean>;

  // Insurance Claims
  getInsuranceClaim(id: string, scope?: ClinicScopeOptions): Promise<InsuranceClaim | undefined>;
  getInsuranceClaims(filters?: { status?: string; patientId?: string }, scope?: ClinicScopeOptions): Promise<InsuranceClaim[]>;
  createInsuranceClaim(claim: InsertInsuranceClaim): Promise<InsuranceClaim>;
  updateInsuranceClaim(id: string, data: Partial<InsertInsuranceClaim>, scope?: ClinicScopeOptions): Promise<InsuranceClaim | undefined>;
  deleteInsuranceClaim(id: string, scope?: ClinicScopeOptions): Promise<boolean>;
  generateClaimNumber(scope?: ClinicScopeOptions): Promise<string>;

  // Financial Reports
  getRevenueReport(startDate: string, endDate: string, scope?: ClinicScopeOptions): Promise<{
    totalRevenue: number;
    totalCollections: number;
    totalAdjustments: number;
    byMonth: { month: string; revenue: number; collections: number }[];
  }>;
  getARAgingReport(scope?: ClinicScopeOptions): Promise<{
    current: number;
    thirtyDays: number;
    sixtyDays: number;
    ninetyDays: number;
    overNinety: number;
    total: number;
  }>;
  getProductionByDoctorReport(startDate: string, endDate: string, scope?: ClinicScopeOptions): Promise<{
    doctorId: string;
    doctorName: string;
    totalProduction: number;
    treatmentCount: number;
    patientCount: number;
    avgProductionPerPatient: number;
    treatmentBreakdown: { treatmentName: string; count: number; revenue: number }[];
  }[]>;
  
  getDoctorDetailedReport(doctorId: string, startDate: string, endDate: string, scope?: ClinicScopeOptions): Promise<{
    doctorId: string;
    doctorName: string;
    totalProduction: number;
    totalCollected: number;
    treatmentCount: number;
    patientCount: number;
    patientDetails: {
      patientId: string;
      patientName: string;
      treatments: { name: string; date: string; price: number; status: string }[];
      totalAmount: number;
      amountPaid: number;
    }[];
    treatmentBreakdown: { treatmentName: string; count: number; revenue: number }[];
    monthlyBreakdown: { month: string; production: number; treatments: number; patients: number }[];
  }>;
  getExpenseReport(startDate: string, endDate: string, scope?: ClinicScopeOptions): Promise<{
    total: number;
    byCategory: { category: string; amount: number }[];
    byMonth: { month: string; amount: number }[];
  }>;
  getNetProfitReport(startDate: string, endDate: string, scope?: ClinicScopeOptions): Promise<{
    grossRevenue: number;
    totalCollections: number;
    serviceCosts: number;
    operatingExpenses: number;
    grossProfit: number;
    netProfit: number;
    profitMargin: number;
    byMonth: { month: string; collections: number; costs: number; expenses: number; netProfit: number }[];
  }>;

  // Inventory
  getInventoryItem(id: string, scope?: ClinicScopeOptions): Promise<InventoryItem | undefined>;
  getInventoryItems(filters?: { category?: string; status?: string }, scope?: ClinicScopeOptions): Promise<InventoryItem[]>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: string, data: Partial<InsertInventoryItem>, scope?: ClinicScopeOptions): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: string, scope?: ClinicScopeOptions): Promise<boolean>;

  // Lab Cases
  getLabCase(id: string, scope?: ClinicScopeOptions): Promise<LabCase | undefined>;
  getLabCases(filters?: { status?: string; patientId?: string }, scope?: ClinicScopeOptions): Promise<LabCase[]>;
  createLabCase(labCase: InsertLabCase): Promise<LabCase>;
  updateLabCase(id: string, data: Partial<InsertLabCase>, scope?: ClinicScopeOptions): Promise<LabCase | undefined>;

  // Documents
  getPatientDocuments(patientId: string, scope?: ClinicScopeOptions): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: string, scope?: ClinicScopeOptions): Promise<boolean>;

  // Activity Log
  getRecentActivity(limit?: number, scope?: ClinicScopeOptions): Promise<ActivityLog[]>;
  logActivity(log: InsertActivityLog): Promise<ActivityLog>;

  // Clinic Settings
  getClinicSettings(scope?: ClinicScopeOptions): Promise<ClinicSettings>;
  updateClinicSettings(data: Partial<InsertClinicSettings>, scope?: ClinicScopeOptions): Promise<ClinicSettings>;

  // Clinic Rooms
  getClinicRooms(scope?: ClinicScopeOptions): Promise<ClinicRoom[]>;
  getClinicRoom(id: string, scope?: ClinicScopeOptions): Promise<ClinicRoom | undefined>;
  createClinicRoom(room: InsertClinicRoom): Promise<ClinicRoom>;
  updateClinicRoom(id: string, data: Partial<InsertClinicRoom>, scope?: ClinicScopeOptions): Promise<ClinicRoom | undefined>;
  deleteClinicRoom(id: string, scope?: ClinicScopeOptions): Promise<boolean>;

  // Audit Logs (Immutable - admin only access)
  getAuditLogs(filters?: { 
    entityType?: string; 
    entityId?: string; 
    userId?: string; 
    actionType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number 
  }, scope?: ClinicScopeOptions): Promise<(AuditLog & { user?: User })[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;

  // Dashboard stats
  getDashboardStats(scope?: ClinicScopeOptions): Promise<{
    totalPatients: number;
    todayAppointments: number;
    monthlyRevenue: number;
    pendingPayments: number;
  }>;

  // External Labs
  getExternalLab(id: string, scope?: ClinicScopeOptions): Promise<ExternalLab | undefined>;
  getExternalLabs(scope?: ClinicScopeOptions): Promise<ExternalLab[]>;
  createExternalLab(lab: InsertExternalLab): Promise<ExternalLab>;
  updateExternalLab(id: string, data: Partial<InsertExternalLab>, scope?: ClinicScopeOptions): Promise<ExternalLab | undefined>;
  deleteExternalLab(id: string, scope?: ClinicScopeOptions): Promise<boolean>;

  // Lab Services
  getLabService(id: string, scope?: ClinicScopeOptions): Promise<LabService | undefined>;
  getLabServices(labId?: string, scope?: ClinicScopeOptions): Promise<LabService[]>;
  createLabService(service: InsertLabService): Promise<LabService>;
  updateLabService(id: string, data: Partial<InsertLabService>, scope?: ClinicScopeOptions): Promise<LabService | undefined>;
  deleteLabService(id: string, scope?: ClinicScopeOptions): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Organizations
  async getOrganization(id: string): Promise<Organization | undefined> {
    const result = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
    return result[0];
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    const result = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
    return result[0];
  }

  async getOrganizations(): Promise<Organization[]> {
    return db.select().from(organizations).orderBy(organizations.name);
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const result = await db.insert(organizations).values(org).returning();
    return result[0];
  }

  async updateOrganization(id: string, data: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const result = await db.update(organizations).set(data).where(eq(organizations.id, id)).returning();
    return result[0];
  }

  // Users
  async getUser(id: string, scope?: ClinicScopeOptions): Promise<User | undefined> {
    let conditions = [eq(users.id, id)];
    
    // For scoped access, filter by organizationId
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(users.organizationId, scope.clinicId));
    }
    // Note: Unscoped access is allowed for authentication flows (login/session restore)
    // where the user's org is not yet known. Routes should pass scope after authentication.
    
    const result = await db.select().from(users).where(and(...conditions)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string, scope?: ClinicScopeOptions): Promise<User | undefined> {
    let conditions = [eq(users.username, username)];
    
    // For scoped access, filter by organizationId
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(users.organizationId, scope.clinicId));
    }
    // Note: Unscoped access is allowed for authentication flows (login)
    // where the user's org is not yet known.
    
    const result = await db.select().from(users).where(and(...conditions)).limit(1);
    return result[0];
  }

  async getUsers(filters?: { role?: string }, scope?: ClinicScopeOptions): Promise<User[]> {
    let conditions = [];
    
    if (filters?.role) {
      conditions.push(eq(users.role, filters.role as any));
    }
    
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(users.organizationId, scope.clinicId));
    }
    
    if (conditions.length > 0) {
      return db.select().from(users).where(and(...conditions));
    }
    return db.select().from(users);
  }

  async getUsersByClinic(clinicId: string, scope?: ClinicScopeOptions): Promise<User[]> {
    // Scope is required for this operation
    if (!scope) {
      throw new Error('getUsersByClinic requires scope parameter for multi-tenant security');
    }
    
    // For non-super admins, always use scope.clinicId to prevent arbitrary clinic access
    if (scope.clinicId && !scope.isSuperAdmin) {
      // Ignore passed clinicId and use scope.clinicId instead for security
      return db.select().from(users).where(eq(users.organizationId, scope.clinicId));
    }
    // Super admin can query any clinic
    return db.select().from(users).where(eq(users.organizationId, clinicId));
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, data: Partial<InsertUser>, scope?: ClinicScopeOptions): Promise<User | undefined> {
    // Scope is required for this operation
    if (!scope) {
      throw new Error('updateUser requires scope parameter for multi-tenant security');
    }
    
    let conditions = [eq(users.id, id)];
    
    if (scope.clinicId && !scope.isSuperAdmin) {
      conditions.push(eq(users.organizationId, scope.clinicId));
      // Prevent non-super admins from changing organizationId
      if ('organizationId' in data) {
        delete (data as any).organizationId;
      }
    }
    
    const result = await db.update(users).set(data).where(and(...conditions)).returning();
    return result[0];
  }

  async deleteUser(id: string, scope?: ClinicScopeOptions): Promise<boolean> {
    // Scope is required for this operation
    if (!scope) {
      throw new Error('deleteUser requires scope parameter for multi-tenant security');
    }
    
    let conditions = [eq(users.id, id)];
    
    if (scope.clinicId && !scope.isSuperAdmin) {
      conditions.push(eq(users.organizationId, scope.clinicId));
    }
    
    const result = await db.delete(users).where(and(...conditions)).returning();
    return result.length > 0;
  }

  // Patients
  async getPatient(id: string, scope?: ClinicScopeOptions): Promise<Patient | undefined> {
    let conditions = [eq(patients.id, id)];
    
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(patients.organizationId, scope.clinicId));
    }
    
    const result = await db.select().from(patients).where(and(...conditions)).limit(1);
    return result[0];
  }

  async getPatients(filters?: { search?: string; assignedDoctorId?: string; assignedStudentId?: string }, scope?: ClinicScopeOptions): Promise<Patient[]> {
    let conditions = [];

    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(patients.organizationId, scope.clinicId));
    }

    if (filters?.search) {
      conditions.push(
        or(
          ilike(patients.firstName, `%${filters.search}%`),
          ilike(patients.lastName, `%${filters.search}%`),
          ilike(patients.phone, `%${filters.search}%`),
          ilike(patients.email, `%${filters.search}%`)
        )
      );
    }

    if (filters?.assignedDoctorId) {
      conditions.push(eq(patients.assignedDoctorId, filters.assignedDoctorId));
    }

    if (filters?.assignedStudentId) {
      conditions.push(eq(patients.assignedStudentId, filters.assignedStudentId));
    }

    if (conditions.length > 0) {
      return db.select().from(patients).where(and(...conditions)).orderBy(desc(patients.createdAt));
    }

    return db.select().from(patients).orderBy(desc(patients.createdAt));
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const result = await db.insert(patients).values(patient).returning();
    return result[0];
  }

  async updatePatient(id: string, data: Partial<InsertPatient>, scope?: ClinicScopeOptions): Promise<Patient | undefined> {
    let conditions = [eq(patients.id, id)];
    
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(patients.organizationId, scope.clinicId));
    }
    
    const result = await db.update(patients).set(data).where(and(...conditions)).returning();
    return result[0];
  }

  async deletePatient(id: string, scope?: ClinicScopeOptions): Promise<boolean> {
    let conditions = [eq(patients.id, id)];
    
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(patients.organizationId, scope.clinicId));
    }
    
    const result = await db.delete(patients).where(and(...conditions)).returning();
    return result.length > 0;
  }

  // Treatments (Services catalog)
  async getTreatment(id: string, scope?: ClinicScopeOptions): Promise<Treatment | undefined> {
    let conditions = [eq(treatments.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(treatments.organizationId, scope.clinicId));
    }
    const result = await db.select().from(treatments).where(and(...conditions)).limit(1);
    return result[0];
  }

  async getTreatments(scope?: ClinicScopeOptions): Promise<Treatment[]> {
    let conditions = [eq(treatments.isActive, true)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(treatments.organizationId, scope.clinicId));
    }
    return db.select().from(treatments).where(and(...conditions)).orderBy(treatments.category, treatments.name);
  }

  async createTreatment(treatment: InsertTreatment): Promise<Treatment> {
    const result = await db.insert(treatments).values(treatment).returning();
    return result[0];
  }

  async updateTreatment(id: string, data: Partial<InsertTreatment>, scope?: ClinicScopeOptions): Promise<Treatment | undefined> {
    let conditions = [eq(treatments.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(treatments.organizationId, scope.clinicId));
    }
    const result = await db.update(treatments).set(data).where(and(...conditions)).returning();
    return result[0];
  }

  async deleteTreatment(id: string, scope?: ClinicScopeOptions): Promise<boolean> {
    let conditions = [eq(treatments.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(treatments.organizationId, scope.clinicId));
    }
    const result = await db.delete(treatments).where(and(...conditions)).returning();
    return result.length > 0;
  }

  // Patient Treatments
  async getPatientTreatments(patientId: string, scope?: ClinicScopeOptions): Promise<PatientTreatment[]> {
    let conditions = [eq(patientTreatments.patientId, patientId)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(patientTreatments.organizationId, scope.clinicId));
    }
    return db.select().from(patientTreatments).where(and(...conditions)).orderBy(desc(patientTreatments.createdAt));
  }

  async getPatientTreatment(id: string, scope?: ClinicScopeOptions): Promise<PatientTreatment | undefined> {
    let conditions = [eq(patientTreatments.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(patientTreatments.organizationId, scope.clinicId));
    }
    const result = await db.select().from(patientTreatments).where(and(...conditions)).limit(1);
    return result[0];
  }

  async createPatientTreatment(treatment: InsertPatientTreatment): Promise<PatientTreatment> {
    const result = await db.insert(patientTreatments).values(treatment).returning();
    return result[0];
  }

  async updatePatientTreatment(id: string, data: Partial<InsertPatientTreatment>, scope?: ClinicScopeOptions): Promise<PatientTreatment | undefined> {
    let conditions = [eq(patientTreatments.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(patientTreatments.organizationId, scope.clinicId));
    }
    const result = await db.update(patientTreatments).set(data).where(and(...conditions)).returning();
    return result[0];
  }

  async deletePatientTreatment(id: string): Promise<void> {
    await db.delete(patientTreatments).where(eq(patientTreatments.id, id));
  }

  // Appointments
  async getAppointment(id: string, scope?: ClinicScopeOptions): Promise<Appointment | undefined> {
    let conditions = [eq(appointments.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(appointments.organizationId, scope.clinicId));
    }
    const result = await db.select().from(appointments).where(and(...conditions)).limit(1);
    return result[0];
  }

  async getAppointments(filters?: { start?: Date; end?: Date; status?: string; doctorId?: string }, scope?: ClinicScopeOptions): Promise<Appointment[]> {
    let conditions = [];

    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(appointments.organizationId, scope.clinicId));
    }

    if (filters?.start) {
      conditions.push(gte(appointments.startTime, filters.start));
    }
    if (filters?.end) {
      conditions.push(lte(appointments.startTime, filters.end));
    }
    if (filters?.status) {
      conditions.push(eq(appointments.status, filters.status as any));
    }
    if (filters?.doctorId) {
      conditions.push(eq(appointments.doctorId, filters.doctorId));
    }

    if (conditions.length > 0) {
      return db.select().from(appointments).where(and(...conditions)).orderBy(appointments.startTime);
    }

    return db.select().from(appointments).orderBy(appointments.startTime);
  }

  async getTodayAppointments(scope?: ClinicScopeOptions): Promise<Appointment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let conditions = [gte(appointments.startTime, today), lte(appointments.startTime, tomorrow)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(appointments.organizationId, scope.clinicId));
    }

    return db.select().from(appointments)
      .where(and(...conditions))
      .orderBy(appointments.startTime);
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const result = await db.insert(appointments).values(appointment).returning();
    return result[0];
  }

  async updateAppointment(id: string, data: Partial<InsertAppointment>, scope?: ClinicScopeOptions): Promise<Appointment | undefined> {
    let conditions = [eq(appointments.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(appointments.organizationId, scope.clinicId));
    }
    const result = await db.update(appointments).set(data).where(and(...conditions)).returning();
    return result[0];
  }

  async deleteAppointment(id: string, scope?: ClinicScopeOptions): Promise<boolean> {
    let conditions = [eq(appointments.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(appointments.organizationId, scope.clinicId));
    }
    const result = await db.delete(appointments).where(and(...conditions)).returning();
    return result.length > 0;
  }

  // Invoices
  async getInvoice(id: string, scope?: ClinicScopeOptions): Promise<Invoice | undefined> {
    let conditions = [eq(invoices.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(invoices.organizationId, scope.clinicId));
    }
    const result = await db.select().from(invoices).where(and(...conditions)).limit(1);
    return result[0];
  }

  async getInvoices(filters?: { patientId?: string; status?: string }, scope?: ClinicScopeOptions): Promise<Invoice[]> {
    let conditions = [];

    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(invoices.organizationId, scope.clinicId));
    }

    if (filters?.patientId) {
      conditions.push(eq(invoices.patientId, filters.patientId));
    }
    if (filters?.status) {
      conditions.push(eq(invoices.status, filters.status as any));
    }

    if (conditions.length > 0) {
      return db.select().from(invoices).where(and(...conditions)).orderBy(desc(invoices.issuedDate));
    }

    return db.select().from(invoices).orderBy(desc(invoices.issuedDate));
  }

  async getPatientInvoices(patientId: string, scope?: ClinicScopeOptions): Promise<Invoice[]> {
    let conditions = [eq(invoices.patientId, patientId)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(invoices.organizationId, scope.clinicId));
    }
    return db.select().from(invoices).where(and(...conditions)).orderBy(desc(invoices.issuedDate));
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const result = await db.insert(invoices).values(invoice).returning();
    return result[0];
  }

  async updateInvoice(id: string, data: Partial<InsertInvoice>, scope?: ClinicScopeOptions): Promise<Invoice | undefined> {
    let conditions = [eq(invoices.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(invoices.organizationId, scope.clinicId));
    }
    const result = await db.update(invoices).set(data).where(and(...conditions)).returning();
    return result[0];
  }

  // Invoice Items
  async getInvoiceItems(invoiceId: string, scope?: ClinicScopeOptions): Promise<InvoiceItem[]> {
    let conditions = [eq(invoiceItems.invoiceId, invoiceId)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(invoiceItems.organizationId, scope.clinicId));
    }
    return db.select().from(invoiceItems).where(and(...conditions));
  }

  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    const result = await db.insert(invoiceItems).values(item).returning();
    return result[0];
  }

  async deleteInvoiceItem(id: string, scope?: ClinicScopeOptions): Promise<void> {
    let conditions = [eq(invoiceItems.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(invoiceItems.organizationId, scope.clinicId));
    }
    await db.delete(invoiceItems).where(and(...conditions));
  }

  // Payments
  async getPayment(id: string, scope?: ClinicScopeOptions): Promise<Payment | undefined> {
    let conditions = [eq(payments.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(payments.organizationId, scope.clinicId));
    }
    const result = await db.select().from(payments).where(and(...conditions)).limit(1);
    return result[0];
  }

  async getPayments(filters?: { invoiceId?: string }, scope?: ClinicScopeOptions): Promise<Payment[]> {
    let conditions = [];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(payments.organizationId, scope.clinicId));
    }
    if (filters?.invoiceId) {
      conditions.push(eq(payments.invoiceId, filters.invoiceId));
    }
    if (conditions.length > 0) {
      return db.select().from(payments).where(and(...conditions)).orderBy(desc(payments.paymentDate));
    }
    return db.select().from(payments).orderBy(desc(payments.paymentDate));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await db.insert(payments).values(payment).returning();

    // Update invoice paid amount
    const invoice = await this.getInvoice(payment.invoiceId);
    if (invoice) {
      const currentPaid = Number(invoice.paidAmount || 0);
      const newPaid = currentPaid + Number(payment.amount);
      const finalAmount = Number(invoice.finalAmount);

      let status = invoice.status;
      if (newPaid >= finalAmount) {
        status = "paid";
      } else if (newPaid > 0) {
        status = "partial";
      }

      await this.updateInvoice(payment.invoiceId, {
        paidAmount: String(newPaid),
        status,
      });
    }

    // Update installment if linked
    if (payment.paymentPlanInstallmentId) {
      const installment = await db.select().from(paymentPlanInstallments)
        .where(eq(paymentPlanInstallments.id, payment.paymentPlanInstallmentId)).limit(1);
      if (installment[0]) {
        const newPaidAmount = Number(installment[0].paidAmount || 0) + Number(payment.amount);
        const isPaid = newPaidAmount >= Number(installment[0].amount);
        await this.updatePaymentPlanInstallment(payment.paymentPlanInstallmentId, {
          paidAmount: String(newPaidAmount),
          isPaid,
          paidDate: isPaid ? payment.paymentDate : undefined,
        });
      }
    }

    return result[0];
  }

  async updatePayment(id: string, data: Partial<InsertPayment>, scope?: ClinicScopeOptions): Promise<Payment | undefined> {
    let conditions = [eq(payments.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(payments.organizationId, scope.clinicId));
    }
    const result = await db.update(payments).set(data).where(and(...conditions)).returning();
    return result[0];
  }

  async refundPayment(id: string, reason: string, scope?: ClinicScopeOptions): Promise<Payment | undefined> {
    const payment = await this.getPayment(id, scope);
    if (!payment || payment.isRefunded) return undefined;

    let conditions = [eq(payments.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(payments.organizationId, scope.clinicId));
    }

    const result = await db.update(payments).set({
      isRefunded: true,
      refundedAt: new Date(),
      refundReason: reason,
    }).where(and(...conditions)).returning();

    const invoice = await this.getInvoice(payment.invoiceId, scope);
    if (invoice) {
      const currentPaid = Number(invoice.paidAmount || 0);
      const newPaid = Math.max(0, currentPaid - Number(payment.amount));
      const finalAmount = Number(invoice.finalAmount);

      let status: "draft" | "sent" | "paid" | "partial" | "overdue" | "canceled" = invoice.status as any;
      if (newPaid >= finalAmount) {
        status = "paid";
      } else if (newPaid > 0) {
        status = "partial";
      } else {
        status = "sent";
      }

      await this.updateInvoice(payment.invoiceId, {
        paidAmount: String(newPaid),
        status,
      }, scope);
    }

    return result[0];
  }

  // Payment Plans
  async getPaymentPlan(id: string, scope?: ClinicScopeOptions): Promise<PaymentPlan | undefined> {
    let conditions = [eq(paymentPlans.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(paymentPlans.organizationId, scope.clinicId));
    }
    const result = await db.select().from(paymentPlans).where(and(...conditions)).limit(1);
    return result[0];
  }

  async getPaymentPlans(filters?: { invoiceId?: string; patientId?: string; status?: string }, scope?: ClinicScopeOptions): Promise<PaymentPlan[]> {
    let conditions = [];

    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(paymentPlans.organizationId, scope.clinicId));
    }

    if (filters?.invoiceId) {
      conditions.push(eq(paymentPlans.invoiceId, filters.invoiceId));
    }
    if (filters?.patientId) {
      conditions.push(eq(paymentPlans.patientId, filters.patientId));
    }
    if (filters?.status) {
      conditions.push(eq(paymentPlans.status, filters.status as any));
    }

    if (conditions.length > 0) {
      return db.select().from(paymentPlans).where(and(...conditions)).orderBy(desc(paymentPlans.createdAt));
    }

    return db.select().from(paymentPlans).orderBy(desc(paymentPlans.createdAt));
  }

  async createPaymentPlan(plan: InsertPaymentPlan): Promise<PaymentPlan> {
    const result = await db.insert(paymentPlans).values(plan).returning();
    return result[0];
  }

  async updatePaymentPlan(id: string, data: Partial<InsertPaymentPlan>, scope?: ClinicScopeOptions): Promise<PaymentPlan | undefined> {
    let conditions = [eq(paymentPlans.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(paymentPlans.organizationId, scope.clinicId));
    }
    const result = await db.update(paymentPlans).set(data).where(and(...conditions)).returning();
    return result[0];
  }

  // Payment Plan Installments
  async getPaymentPlanInstallments(paymentPlanId: string, scope?: ClinicScopeOptions): Promise<PaymentPlanInstallment[]> {
    let conditions = [eq(paymentPlanInstallments.paymentPlanId, paymentPlanId)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(paymentPlanInstallments.organizationId, scope.clinicId));
    }
    return db.select().from(paymentPlanInstallments)
      .where(and(...conditions))
      .orderBy(paymentPlanInstallments.installmentNumber);
  }

  async createPaymentPlanInstallment(installment: InsertPaymentPlanInstallment): Promise<PaymentPlanInstallment> {
    const result = await db.insert(paymentPlanInstallments).values(installment).returning();
    return result[0];
  }

  async updatePaymentPlanInstallment(id: string, data: Partial<InsertPaymentPlanInstallment>, scope?: ClinicScopeOptions): Promise<PaymentPlanInstallment | undefined> {
    let conditions = [eq(paymentPlanInstallments.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(paymentPlanInstallments.organizationId, scope.clinicId));
    }
    const result = await db.update(paymentPlanInstallments).set(data).where(and(...conditions)).returning();
    return result[0];
  }

  // Invoice Adjustments
  async getInvoiceAdjustments(invoiceId: string, scope?: ClinicScopeOptions): Promise<InvoiceAdjustment[]> {
    let conditions = [eq(invoiceAdjustments.invoiceId, invoiceId)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(invoiceAdjustments.organizationId, scope.clinicId));
    }
    return db.select().from(invoiceAdjustments)
      .where(and(...conditions))
      .orderBy(desc(invoiceAdjustments.appliedDate));
  }

  async createInvoiceAdjustment(adjustment: InsertInvoiceAdjustment): Promise<InvoiceAdjustment> {
    const result = await db.insert(invoiceAdjustments).values(adjustment).returning();

    // Update invoice final amount based on adjustment type
    const invoice = await this.getInvoice(adjustment.invoiceId);
    if (invoice) {
      const currentFinal = Number(invoice.finalAmount);
      let newFinal = currentFinal;

      // Adjustments that reduce the amount owed
      if (adjustment.type === 'discount' || adjustment.type === 'write_off' || adjustment.type === 'refund') {
        newFinal = Math.max(0, currentFinal - Number(adjustment.amount));
      }
      // Adjustments that increase the amount owed
      else if (adjustment.type === 'fee') {
        newFinal = currentFinal + Number(adjustment.amount);
      }
      // Corrections can go either way based on sign of amount
      else if (adjustment.type === 'correction') {
        newFinal = currentFinal + Number(adjustment.amount);
      }

      // Update invoice status if write-off brings balance to zero
      const paidAmount = Number(invoice.paidAmount || 0);
      let status = invoice.status;
      if (paidAmount >= newFinal) {
        status = 'paid';
      }

      await this.updateInvoice(adjustment.invoiceId, {
        finalAmount: String(newFinal),
        status,
      });
    }

    return result[0];
  }

  // Expenses
  async getExpense(id: string, scope?: ClinicScopeOptions): Promise<Expense | undefined> {
    let conditions = [eq(expenses.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(expenses.organizationId, scope.clinicId));
    }
    const result = await db.select().from(expenses).where(and(...conditions)).limit(1);
    return result[0];
  }

  async getExpenses(filters?: { category?: string; startDate?: string; endDate?: string }, scope?: ClinicScopeOptions): Promise<Expense[]> {
    let conditions = [];

    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(expenses.organizationId, scope.clinicId));
    }

    if (filters?.category) {
      conditions.push(eq(expenses.category, filters.category as any));
    }
    if (filters?.startDate) {
      conditions.push(gte(expenses.expenseDate, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(expenses.expenseDate, filters.endDate));
    }

    if (conditions.length > 0) {
      return db.select().from(expenses).where(and(...conditions)).orderBy(desc(expenses.expenseDate));
    }

    return db.select().from(expenses).orderBy(desc(expenses.expenseDate));
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const result = await db.insert(expenses).values(expense).returning();
    return result[0];
  }

  async updateExpense(id: string, data: Partial<InsertExpense>, scope?: ClinicScopeOptions): Promise<Expense | undefined> {
    let conditions = [eq(expenses.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(expenses.organizationId, scope.clinicId));
    }
    const result = await db.update(expenses).set(data).where(and(...conditions)).returning();
    return result[0];
  }

  async deleteExpense(id: string, scope?: ClinicScopeOptions): Promise<boolean> {
    let conditions = [eq(expenses.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(expenses.organizationId, scope.clinicId));
    }
    const result = await db.delete(expenses).where(and(...conditions)).returning();
    return result.length > 0;
  }

  // Doctor Payments
  async getDoctorPayment(id: string, scope?: ClinicScopeOptions): Promise<DoctorPayment | undefined> {
    let conditions = [eq(doctorPayments.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(doctorPayments.organizationId, scope.clinicId));
    }
    const result = await db.select().from(doctorPayments).where(and(...conditions)).limit(1);
    return result[0];
  }

  async getDoctorPayments(filters?: { doctorId?: string; startDate?: string; endDate?: string; paymentType?: string }, scope?: ClinicScopeOptions): Promise<(DoctorPayment & { doctor?: User })[]> {
    let query = db.select({
      payment: doctorPayments,
      doctor: users,
    }).from(doctorPayments)
      .leftJoin(users, eq(doctorPayments.doctorId, users.id));

    const conditions = [];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(doctorPayments.organizationId, scope.clinicId));
    }
    if (filters?.doctorId) {
      conditions.push(eq(doctorPayments.doctorId, filters.doctorId));
    }
    if (filters?.startDate) {
      conditions.push(gte(doctorPayments.paymentDate, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(doctorPayments.paymentDate, filters.endDate));
    }
    if (filters?.paymentType) {
      conditions.push(eq(doctorPayments.paymentType, filters.paymentType as any));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const results = await query.orderBy(desc(doctorPayments.paymentDate));
    return results.map(r => ({
      ...r.payment,
      doctor: r.doctor || undefined,
    }));
  }

  async createDoctorPayment(payment: InsertDoctorPayment): Promise<DoctorPayment> {
    const result = await db.insert(doctorPayments).values(payment).returning();
    return result[0];
  }

  async updateDoctorPayment(id: string, data: Partial<InsertDoctorPayment>, scope?: ClinicScopeOptions): Promise<DoctorPayment | undefined> {
    let conditions = [eq(doctorPayments.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(doctorPayments.organizationId, scope.clinicId));
    }
    const result = await db.update(doctorPayments).set(data).where(and(...conditions)).returning();
    return result[0];
  }

  async deleteDoctorPayment(id: string, scope?: ClinicScopeOptions): Promise<boolean> {
    let conditions = [eq(doctorPayments.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(doctorPayments.organizationId, scope.clinicId));
    }
    const result = await db.delete(doctorPayments).where(and(...conditions)).returning();
    return result.length > 0;
  }

  // Insurance Claims
  async getInsuranceClaim(id: string, scope?: ClinicScopeOptions): Promise<InsuranceClaim | undefined> {
    let conditions = [eq(insuranceClaims.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(insuranceClaims.organizationId, scope.clinicId));
    }
    const result = await db.select().from(insuranceClaims).where(and(...conditions)).limit(1);
    return result[0];
  }

  async getInsuranceClaims(filters?: { status?: string; patientId?: string }, scope?: ClinicScopeOptions): Promise<InsuranceClaim[]> {
    let conditions = [];

    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(insuranceClaims.organizationId, scope.clinicId));
    }

    if (filters?.status) {
      conditions.push(eq(insuranceClaims.status, filters.status as any));
    }
    if (filters?.patientId) {
      conditions.push(eq(insuranceClaims.patientId, filters.patientId));
    }

    if (conditions.length > 0) {
      return db.select().from(insuranceClaims).where(and(...conditions)).orderBy(desc(insuranceClaims.createdAt));
    }

    return db.select().from(insuranceClaims).orderBy(desc(insuranceClaims.createdAt));
  }

  async createInsuranceClaim(claim: InsertInsuranceClaim): Promise<InsuranceClaim> {
    const result = await db.insert(insuranceClaims).values(claim).returning();
    return result[0];
  }

  async updateInsuranceClaim(id: string, data: Partial<InsertInsuranceClaim>, scope?: ClinicScopeOptions): Promise<InsuranceClaim | undefined> {
    let conditions = [eq(insuranceClaims.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(insuranceClaims.organizationId, scope.clinicId));
    }
    const result = await db.update(insuranceClaims).set(data).where(and(...conditions)).returning();
    return result[0];
  }

  async deleteInsuranceClaim(id: string, scope?: ClinicScopeOptions): Promise<boolean> {
    let conditions = [eq(insuranceClaims.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(insuranceClaims.organizationId, scope.clinicId));
    }
    const result = await db.delete(insuranceClaims).where(and(...conditions)).returning();
    return result.length > 0;
  }

  async generateClaimNumber(scope?: ClinicScopeOptions): Promise<string> {
    const year = new Date().getFullYear();
    let conditions = [];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(insuranceClaims.organizationId, scope.clinicId));
    }
    const result = conditions.length > 0
      ? await db.select({ count: sql<number>`COUNT(*)` }).from(insuranceClaims).where(and(...conditions))
      : await db.select({ count: sql<number>`COUNT(*)` }).from(insuranceClaims);
    const count = Number(result[0].count) + 1;
    return `CLM-${year}-${String(count).padStart(5, '0')}`;
  }

  // Financial Reports
  async getRevenueReport(startDate: string, endDate: string): Promise<{
    totalRevenue: number;
    totalCollections: number;
    totalAdjustments: number;
    byMonth: { month: string; revenue: number; collections: number }[];
  }> {
    // Total revenue (sum of all invoice final amounts in date range)
    const revenueResult = await db.select({
      total: sql<string>`COALESCE(SUM(CAST(final_amount AS DECIMAL)), 0)`
    }).from(invoices)
      .where(and(
        gte(invoices.issuedDate, startDate),
        lte(invoices.issuedDate, endDate)
      ));

    // Total collections (sum of payments in date range, excluding refunded)
    const collectionsResult = await db.select({
      total: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`
    }).from(payments)
      .where(and(
        gte(payments.paymentDate, startDate),
        lte(payments.paymentDate, endDate),
        eq(payments.isRefunded, false)
      ));

    // Total adjustments
    const adjustmentsResult = await db.select({
      total: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`
    }).from(invoiceAdjustments)
      .where(and(
        gte(invoiceAdjustments.appliedDate, startDate),
        lte(invoiceAdjustments.appliedDate, endDate)
      ));

    // Monthly breakdown
    const monthlyRevenue = await db.select({
      month: sql<string>`TO_CHAR(issued_date, 'YYYY-MM')`,
      revenue: sql<string>`COALESCE(SUM(CAST(final_amount AS DECIMAL)), 0)`
    }).from(invoices)
      .where(and(
        gte(invoices.issuedDate, startDate),
        lte(invoices.issuedDate, endDate)
      ))
      .groupBy(sql`TO_CHAR(issued_date, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(issued_date, 'YYYY-MM')`);

    const monthlyCollections = await db.select({
      month: sql<string>`TO_CHAR(payment_date, 'YYYY-MM')`,
      collections: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`
    }).from(payments)
      .where(and(
        gte(payments.paymentDate, startDate),
        lte(payments.paymentDate, endDate),
        eq(payments.isRefunded, false)
      ))
      .groupBy(sql`TO_CHAR(payment_date, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(payment_date, 'YYYY-MM')`);

    // Merge monthly data
    const monthMap = new Map<string, { month: string; revenue: number; collections: number }>();
    
    for (const row of monthlyRevenue) {
      monthMap.set(row.month, { month: row.month, revenue: Number(row.revenue), collections: 0 });
    }
    
    for (const row of monthlyCollections) {
      const existing = monthMap.get(row.month);
      if (existing) {
        existing.collections = Number(row.collections);
      } else {
        monthMap.set(row.month, { month: row.month, revenue: 0, collections: Number(row.collections) });
      }
    }

    return {
      totalRevenue: Number(revenueResult[0]?.total || 0),
      totalCollections: Number(collectionsResult[0]?.total || 0),
      totalAdjustments: Number(adjustmentsResult[0]?.total || 0),
      byMonth: Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month)),
    };
  }

  async getARAgingReport(): Promise<{
    current: number;
    thirtyDays: number;
    sixtyDays: number;
    ninetyDays: number;
    overNinety: number;
    total: number;
  }> {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Get all unpaid/partial invoices
    const unpaidInvoices = await db.select().from(invoices)
      .where(or(eq(invoices.status, 'sent'), eq(invoices.status, 'partial'), eq(invoices.status, 'overdue')));

    let current = 0, thirtyDays = 0, sixtyDays = 0, ninetyDays = 0, overNinety = 0;

    for (const inv of unpaidInvoices) {
      const balance = Number(inv.finalAmount) - Number(inv.paidAmount || 0);
      const dueDate = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.issuedDate);

      if (dueDate >= thirtyDaysAgo) {
        current += balance;
      } else if (dueDate >= sixtyDaysAgo) {
        thirtyDays += balance;
      } else if (dueDate >= ninetyDaysAgo) {
        sixtyDays += balance;
      } else {
        const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
        if (daysDiff <= 90) {
          ninetyDays += balance;
        } else {
          overNinety += balance;
        }
      }
    }

    return {
      current,
      thirtyDays,
      sixtyDays,
      ninetyDays,
      overNinety,
      total: current + thirtyDays + sixtyDays + ninetyDays + overNinety,
    };
  }

  async getProductionByDoctorReport(startDate: string, endDate: string): Promise<{
    doctorId: string;
    doctorName: string;
    totalProduction: number;
    treatmentCount: number;
    patientCount: number;
    avgProductionPerPatient: number;
    treatmentBreakdown: { treatmentName: string; count: number; revenue: number }[];
  }[]> {
    // Get all doctors (including those with zero production)
    const allDoctors = await db.select().from(users).where(eq(users.role, 'doctor'));

    const doctorProductions = [];
    
    for (const doctor of allDoctors) {
      // Get production stats for this doctor
      const productionResult = await db.select({
        totalProduction: sql<string>`COALESCE(SUM(CAST(patient_treatments.price AS DECIMAL)), 0)`,
        treatmentCount: sql<number>`COUNT(*)`,
        patientCount: sql<number>`COUNT(DISTINCT patient_treatments.patient_id)`
      })
        .from(patientTreatments)
        .where(and(
          eq(patientTreatments.doctorId, doctor.id),
          eq(patientTreatments.status, 'completed'),
          gte(patientTreatments.completionDate, startDate),
          lte(patientTreatments.completionDate, endDate)
        ));

      const stats = productionResult[0] || { totalProduction: '0', treatmentCount: 0, patientCount: 0 };
      const totalProduction = Number(stats.totalProduction);
      const patientCount = Number(stats.patientCount);

      // Get treatment breakdown for this doctor
      const treatmentBreakdownResult = await db.select({
        treatmentName: treatments.name,
        count: sql<number>`COUNT(*)`,
        revenue: sql<string>`COALESCE(SUM(CAST(patient_treatments.price AS DECIMAL)), 0)`
      })
        .from(patientTreatments)
        .leftJoin(treatments, eq(patientTreatments.treatmentId, treatments.id))
        .where(and(
          eq(patientTreatments.doctorId, doctor.id),
          eq(patientTreatments.status, 'completed'),
          gte(patientTreatments.completionDate, startDate),
          lte(patientTreatments.completionDate, endDate)
        ))
        .groupBy(treatments.name);

      doctorProductions.push({
        doctorId: doctor.id,
        doctorName: `${doctor.firstName} ${doctor.lastName}`,
        totalProduction,
        treatmentCount: Number(stats.treatmentCount),
        patientCount,
        avgProductionPerPatient: patientCount > 0 ? totalProduction / patientCount : 0,
        treatmentBreakdown: treatmentBreakdownResult.map(t => ({
          treatmentName: t.treatmentName || 'Unknown',
          count: Number(t.count),
          revenue: Number(t.revenue)
        }))
      });
    }

    return doctorProductions.sort((a, b) => b.totalProduction - a.totalProduction);
  }
  
  async getDoctorDetailedReport(doctorId: string, startDate: string, endDate: string): Promise<{
    doctorId: string;
    doctorName: string;
    totalProduction: number;
    totalCollected: number;
    treatmentCount: number;
    patientCount: number;
    patientDetails: {
      patientId: string;
      patientName: string;
      treatments: { name: string; date: string; price: number; status: string }[];
      totalAmount: number;
      amountPaid: number;
    }[];
    treatmentBreakdown: { treatmentName: string; count: number; revenue: number }[];
    monthlyBreakdown: { month: string; production: number; treatments: number; patients: number }[];
  }> {
    const doctor = await this.getUser(doctorId);
    if (!doctor) throw new Error('Doctor not found');

    // Get all treatments by this doctor in the date range
    const doctorTreatments = await db.select({
      id: patientTreatments.id,
      patientId: patientTreatments.patientId,
      treatmentId: patientTreatments.treatmentId,
      price: patientTreatments.price,
      status: patientTreatments.status,
      completionDate: patientTreatments.completionDate,
      treatmentName: treatments.name,
    })
      .from(patientTreatments)
      .leftJoin(treatments, eq(patientTreatments.treatmentId, treatments.id))
      .where(and(
        eq(patientTreatments.doctorId, doctorId),
        gte(patientTreatments.completionDate, startDate),
        lte(patientTreatments.completionDate, endDate)
      ))
      .orderBy(patientTreatments.completionDate);

    // Group by patient
    const patientMap = new Map<string, {
      patientId: string;
      patientName: string;
      treatments: { name: string; date: string; price: number; status: string }[];
      totalAmount: number;
    }>();

    for (const t of doctorTreatments) {
      if (!t.patientId) continue;
      
      if (!patientMap.has(t.patientId)) {
        const patient = await this.getPatient(t.patientId);
        patientMap.set(t.patientId, {
          patientId: t.patientId,
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
          treatments: [],
          totalAmount: 0,
        });
      }
      
      const patientData = patientMap.get(t.patientId)!;
      patientData.treatments.push({
        name: t.treatmentName || 'Unknown',
        date: t.completionDate || '',
        price: Number(t.price) || 0,
        status: t.status || 'unknown',
      });
      if (t.status === 'completed') {
        patientData.totalAmount += Number(t.price) || 0;
      }
    }

    // Calculate collected amounts per patient (from invoices/payments)
    const patientDetails = [];
    for (const [patientId, data] of Array.from(patientMap.entries())) {
      // Get payments for this patient's invoices
      const patientInvoices = await db.select({ id: invoices.id })
        .from(invoices)
        .where(eq(invoices.patientId, patientId));
      
      let amountPaid = 0;
      for (const inv of patientInvoices) {
        const paymentsResult = await db.select({
          total: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`
        }).from(payments).where(eq(payments.invoiceId, inv.id));
        amountPaid += Number(paymentsResult[0]?.total || 0);
      }
      
      patientDetails.push({
        ...data,
        amountPaid,
      });
    }

    // Treatment breakdown
    const treatmentBreakdownResult = await db.select({
      treatmentName: treatments.name,
      count: sql<number>`COUNT(*)`,
      revenue: sql<string>`COALESCE(SUM(CAST(patient_treatments.price AS DECIMAL)), 0)`
    })
      .from(patientTreatments)
      .leftJoin(treatments, eq(patientTreatments.treatmentId, treatments.id))
      .where(and(
        eq(patientTreatments.doctorId, doctorId),
        eq(patientTreatments.status, 'completed'),
        gte(patientTreatments.completionDate, startDate),
        lte(patientTreatments.completionDate, endDate)
      ))
      .groupBy(treatments.name);

    // Monthly breakdown
    const monthlyResult = await db.select({
      month: sql<string>`TO_CHAR(completion_date, 'YYYY-MM')`,
      production: sql<string>`COALESCE(SUM(CAST(price AS DECIMAL)), 0)`,
      treatments: sql<number>`COUNT(*)`,
      patients: sql<number>`COUNT(DISTINCT patient_id)`
    })
      .from(patientTreatments)
      .where(and(
        eq(patientTreatments.doctorId, doctorId),
        eq(patientTreatments.status, 'completed'),
        gte(patientTreatments.completionDate, startDate),
        lte(patientTreatments.completionDate, endDate)
      ))
      .groupBy(sql`TO_CHAR(completion_date, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(completion_date, 'YYYY-MM')`);

    // Calculate totals
    const totalProduction = patientDetails.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalCollected = patientDetails.reduce((sum, p) => sum + p.amountPaid, 0);

    return {
      doctorId,
      doctorName: `${doctor.firstName} ${doctor.lastName}`,
      totalProduction,
      totalCollected,
      treatmentCount: doctorTreatments.filter(t => t.status === 'completed').length,
      patientCount: patientMap.size,
      patientDetails,
      treatmentBreakdown: treatmentBreakdownResult.map(t => ({
        treatmentName: t.treatmentName || 'Unknown',
        count: Number(t.count),
        revenue: Number(t.revenue)
      })),
      monthlyBreakdown: monthlyResult.map(m => ({
        month: m.month,
        production: Number(m.production),
        treatments: Number(m.treatments),
        patients: Number(m.patients)
      }))
    };
  }

  async getExpenseReport(startDate: string, endDate: string): Promise<{
    total: number;
    byCategory: { category: string; amount: number }[];
    byMonth: { month: string; amount: number }[];
  }> {
    // Total regular expenses
    const totalResult = await db.select({
      total: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`
    }).from(expenses)
      .where(and(
        gte(expenses.expenseDate, startDate),
        lte(expenses.expenseDate, endDate)
      ));

    // Total doctor payments (salary, bonus, commission, reimbursement - but not deductions which reduce expenses)
    const doctorPaymentsResult = await db.select({
      total: sql<string>`COALESCE(SUM(CASE WHEN payment_type != 'deduction' THEN CAST(amount AS DECIMAL) ELSE -CAST(amount AS DECIMAL) END), 0)`
    }).from(doctorPayments)
      .where(and(
        gte(doctorPayments.paymentDate, startDate),
        lte(doctorPayments.paymentDate, endDate)
      ));

    // By category (regular expenses)
    const byCategory = await db.select({
      category: expenses.category,
      amount: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`
    }).from(expenses)
      .where(and(
        gte(expenses.expenseDate, startDate),
        lte(expenses.expenseDate, endDate)
      ))
      .groupBy(expenses.category)
      .orderBy(sql`SUM(CAST(amount AS DECIMAL)) DESC`);

    // Doctor payments by type as categories
    const doctorPaymentsByType = await db.select({
      category: doctorPayments.paymentType,
      amount: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`
    }).from(doctorPayments)
      .where(and(
        gte(doctorPayments.paymentDate, startDate),
        lte(doctorPayments.paymentDate, endDate)
      ))
      .groupBy(doctorPayments.paymentType)
      .orderBy(sql`SUM(CAST(amount AS DECIMAL)) DESC`);

    // By month (regular expenses)
    const byMonth = await db.select({
      month: sql<string>`TO_CHAR(expense_date, 'YYYY-MM')`,
      amount: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`
    }).from(expenses)
      .where(and(
        gte(expenses.expenseDate, startDate),
        lte(expenses.expenseDate, endDate)
      ))
      .groupBy(sql`TO_CHAR(expense_date, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(expense_date, 'YYYY-MM')`);

    // Doctor payments by month
    const doctorPaymentsByMonth = await db.select({
      month: sql<string>`TO_CHAR(payment_date, 'YYYY-MM')`,
      amount: sql<string>`COALESCE(SUM(CASE WHEN payment_type != 'deduction' THEN CAST(amount AS DECIMAL) ELSE -CAST(amount AS DECIMAL) END), 0)`
    }).from(doctorPayments)
      .where(and(
        gte(doctorPayments.paymentDate, startDate),
        lte(doctorPayments.paymentDate, endDate)
      ))
      .groupBy(sql`TO_CHAR(payment_date, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(payment_date, 'YYYY-MM')`);

    // Merge categories - add doctor payment types with "Doctor: " prefix
    const allCategories = [
      ...byCategory.map(c => ({ category: c.category, amount: Number(c.amount) })),
      ...doctorPaymentsByType.map(c => ({ 
        category: `Doctor ${c.category.charAt(0).toUpperCase() + c.category.slice(1).replace('_', ' ')}`, 
        amount: c.category === 'deduction' ? -Number(c.amount) : Number(c.amount) 
      }))
    ].sort((a, b) => b.amount - a.amount);

    // Merge monthly data
    const monthsSet = new Set<string>();
    byMonth.forEach(m => monthsSet.add(m.month));
    doctorPaymentsByMonth.forEach(m => monthsSet.add(m.month));

    const expensesMap = new Map(byMonth.map(m => [m.month, Number(m.amount)]));
    const doctorPaymentsMap = new Map(doctorPaymentsByMonth.map(m => [m.month, Number(m.amount)]));

    const mergedByMonth = Array.from(monthsSet).sort().map(month => ({
      month,
      amount: (expensesMap.get(month) || 0) + (doctorPaymentsMap.get(month) || 0)
    }));

    const totalExpenses = Number(totalResult[0]?.total || 0);
    const totalDoctorPayments = Number(doctorPaymentsResult[0]?.total || 0);

    return {
      total: totalExpenses + totalDoctorPayments,
      byCategory: allCategories,
      byMonth: mergedByMonth,
    };
  }

  async getNetProfitReport(startDate: string, endDate: string): Promise<{
    grossRevenue: number;
    totalCollections: number;
    serviceCosts: number;
    operatingExpenses: number;
    grossProfit: number;
    netProfit: number;
    profitMargin: number;
    byMonth: { month: string; collections: number; costs: number; expenses: number; netProfit: number }[];
  }> {
    // Total collections (payments received, excluding refunded) - this is cash-based income
    const collectionsResult = await db.select({
      total: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`
    }).from(payments)
      .where(and(
        gte(payments.paymentDate, startDate),
        lte(payments.paymentDate, endDate),
        eq(payments.isRefunded, false)
      ));

    // Gross revenue from invoices (accrual basis - for reference)
    const revenueResult = await db.select({
      total: sql<string>`COALESCE(SUM(CAST(final_amount AS DECIMAL)), 0)`
    }).from(invoices)
      .where(and(
        gte(invoices.issuedDate, startDate),
        lte(invoices.issuedDate, endDate)
      ));

    // Service costs (from completed patient treatments - using treatment cost field)
    const serviceCostsResult = await db.select({
      total: sql<string>`COALESCE(SUM(CAST(${treatments.cost} AS DECIMAL)), 0)`
    }).from(patientTreatments)
      .innerJoin(treatments, eq(patientTreatments.treatmentId, treatments.id))
      .where(and(
        eq(patientTreatments.status, 'completed'),
        gte(patientTreatments.completionDate, startDate),
        lte(patientTreatments.completionDate, endDate)
      ));

    // Operating expenses
    const expensesResult = await db.select({
      total: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`
    }).from(expenses)
      .where(and(
        gte(expenses.expenseDate, startDate),
        lte(expenses.expenseDate, endDate)
      ));

    // Doctor payments (salary, bonus, commission, reimbursement - deductions reduce expenses)
    const doctorPaymentsExpenseResult = await db.select({
      total: sql<string>`COALESCE(SUM(CASE WHEN payment_type != 'deduction' THEN CAST(amount AS DECIMAL) ELSE -CAST(amount AS DECIMAL) END), 0)`
    }).from(doctorPayments)
      .where(and(
        gte(doctorPayments.paymentDate, startDate),
        lte(doctorPayments.paymentDate, endDate)
      ));

    const grossRevenue = Number(revenueResult[0]?.total || 0);
    const totalCollections = Number(collectionsResult[0]?.total || 0);
    const serviceCosts = Number(serviceCostsResult[0]?.total || 0);
    const regularExpenses = Number(expensesResult[0]?.total || 0);
    const doctorPaymentsExpense = Number(doctorPaymentsExpenseResult[0]?.total || 0);
    const operatingExpenses = regularExpenses + doctorPaymentsExpense;
    const grossProfit = totalCollections - serviceCosts;
    const netProfit = grossProfit - operatingExpenses;
    const profitMargin = totalCollections > 0 ? (netProfit / totalCollections) * 100 : 0;

    // Monthly breakdown
    const monthlyCollections = await db.select({
      month: sql<string>`TO_CHAR(payment_date, 'YYYY-MM')`,
      collections: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`
    }).from(payments)
      .where(and(
        gte(payments.paymentDate, startDate),
        lte(payments.paymentDate, endDate),
        eq(payments.isRefunded, false)
      ))
      .groupBy(sql`TO_CHAR(payment_date, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(payment_date, 'YYYY-MM')`);

    const monthlyServiceCosts = await db.select({
      month: sql<string>`TO_CHAR(completion_date, 'YYYY-MM')`,
      costs: sql<string>`COALESCE(SUM(CAST(${treatments.cost} AS DECIMAL)), 0)`
    }).from(patientTreatments)
      .innerJoin(treatments, eq(patientTreatments.treatmentId, treatments.id))
      .where(and(
        eq(patientTreatments.status, 'completed'),
        gte(patientTreatments.completionDate, startDate),
        lte(patientTreatments.completionDate, endDate)
      ))
      .groupBy(sql`TO_CHAR(completion_date, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(completion_date, 'YYYY-MM')`);

    const monthlyExpenses = await db.select({
      month: sql<string>`TO_CHAR(expense_date, 'YYYY-MM')`,
      expenses: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`
    }).from(expenses)
      .where(and(
        gte(expenses.expenseDate, startDate),
        lte(expenses.expenseDate, endDate)
      ))
      .groupBy(sql`TO_CHAR(expense_date, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(expense_date, 'YYYY-MM')`);

    // Monthly doctor payments
    const monthlyDoctorPayments = await db.select({
      month: sql<string>`TO_CHAR(payment_date, 'YYYY-MM')`,
      amount: sql<string>`COALESCE(SUM(CASE WHEN payment_type != 'deduction' THEN CAST(amount AS DECIMAL) ELSE -CAST(amount AS DECIMAL) END), 0)`
    }).from(doctorPayments)
      .where(and(
        gte(doctorPayments.paymentDate, startDate),
        lte(doctorPayments.paymentDate, endDate)
      ))
      .groupBy(sql`TO_CHAR(payment_date, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(payment_date, 'YYYY-MM')`);

    // Merge monthly data
    const monthsSet = new Set<string>();
    monthlyCollections.forEach(m => monthsSet.add(m.month));
    monthlyServiceCosts.forEach(m => monthsSet.add(m.month));
    monthlyExpenses.forEach(m => monthsSet.add(m.month));
    monthlyDoctorPayments.forEach(m => monthsSet.add(m.month));

    const collectionsMap = new Map(monthlyCollections.map(m => [m.month, Number(m.collections)]));
    const costsMap = new Map(monthlyServiceCosts.map(m => [m.month, Number(m.costs)]));
    const expensesMap = new Map(monthlyExpenses.map(m => [m.month, Number(m.expenses)]));
    const doctorPaymentsMap = new Map(monthlyDoctorPayments.map(m => [m.month, Number(m.amount)]));

    const byMonth = Array.from(monthsSet).sort().map(month => {
      const collections = collectionsMap.get(month) || 0;
      const costs = costsMap.get(month) || 0;
      const exp = (expensesMap.get(month) || 0) + (doctorPaymentsMap.get(month) || 0);
      return {
        month,
        collections,
        costs,
        expenses: exp,
        netProfit: collections - costs - exp,
      };
    });

    return {
      grossRevenue,
      totalCollections,
      serviceCosts,
      operatingExpenses,
      grossProfit,
      netProfit,
      profitMargin,
      byMonth,
    };
  }

  // Inventory
  async getInventoryItem(id: string, scope?: ClinicScopeOptions): Promise<InventoryItem | undefined> {
    let conditions = [eq(inventoryItems.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(inventoryItems.organizationId, scope.clinicId));
    }
    const result = await db.select().from(inventoryItems).where(and(...conditions)).limit(1);
    return result[0];
  }

  async getInventoryItems(filters?: { category?: string; status?: string }, scope?: ClinicScopeOptions): Promise<InventoryItem[]> {
    let conditions = [];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(inventoryItems.organizationId, scope.clinicId));
    }
    if (filters?.category) {
      conditions.push(eq(inventoryItems.category, filters.category as any));
    }
    if (conditions.length > 0) {
      return db.select().from(inventoryItems).where(and(...conditions)).orderBy(inventoryItems.name);
    }
    return db.select().from(inventoryItems).orderBy(inventoryItems.name);
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const result = await db.insert(inventoryItems).values(item).returning();
    return result[0];
  }

  async updateInventoryItem(id: string, data: Partial<InsertInventoryItem>, scope?: ClinicScopeOptions): Promise<InventoryItem | undefined> {
    let conditions = [eq(inventoryItems.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(inventoryItems.organizationId, scope.clinicId));
    }
    const result = await db.update(inventoryItems).set(data).where(and(...conditions)).returning();
    return result[0];
  }

  async deleteInventoryItem(id: string, scope?: ClinicScopeOptions): Promise<boolean> {
    let conditions = [eq(inventoryItems.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(inventoryItems.organizationId, scope.clinicId));
    }
    const result = await db.delete(inventoryItems).where(and(...conditions)).returning();
    return result.length > 0;
  }

  // Lab Cases
  async getLabCase(id: string, scope?: ClinicScopeOptions): Promise<LabCase | undefined> {
    let conditions = [eq(labCases.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(labCases.organizationId, scope.clinicId));
    }
    const result = await db.select().from(labCases).where(and(...conditions)).limit(1);
    return result[0];
  }

  async getLabCases(filters?: { status?: string; patientId?: string }, scope?: ClinicScopeOptions): Promise<LabCase[]> {
    let conditions = [];

    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(labCases.organizationId, scope.clinicId));
    }

    if (filters?.status) {
      conditions.push(eq(labCases.status, filters.status as any));
    }
    if (filters?.patientId) {
      conditions.push(eq(labCases.patientId, filters.patientId));
    }

    if (conditions.length > 0) {
      return db.select().from(labCases).where(and(...conditions)).orderBy(desc(labCases.sentDate));
    }

    return db.select().from(labCases).orderBy(desc(labCases.sentDate));
  }

  async createLabCase(labCase: InsertLabCase): Promise<LabCase> {
    const result = await db.insert(labCases).values(labCase).returning();
    return result[0];
  }

  async updateLabCase(id: string, data: Partial<InsertLabCase>, scope?: ClinicScopeOptions): Promise<LabCase | undefined> {
    let conditions = [eq(labCases.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(labCases.organizationId, scope.clinicId));
    }
    const result = await db.update(labCases).set(data).where(and(...conditions)).returning();
    return result[0];
  }

  // Documents
  async getPatientDocuments(patientId: string, scope?: ClinicScopeOptions): Promise<Document[]> {
    let conditions = [eq(documents.patientId, patientId)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(documents.organizationId, scope.clinicId));
    }
    return db.select().from(documents).where(and(...conditions)).orderBy(desc(documents.createdAt));
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const result = await db.insert(documents).values(document).returning();
    return result[0];
  }

  async deleteDocument(id: string, scope?: ClinicScopeOptions): Promise<boolean> {
    let conditions = [eq(documents.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(documents.organizationId, scope.clinicId));
    }
    const result = await db.delete(documents).where(and(...conditions)).returning();
    return result.length > 0;
  }

  // Activity Log
  async getRecentActivity(limit: number = 20, scope?: ClinicScopeOptions): Promise<ActivityLog[]> {
    let conditions = [];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(activityLog.organizationId, scope.clinicId));
    }
    if (conditions.length > 0) {
      return db.select().from(activityLog).where(and(...conditions)).orderBy(desc(activityLog.createdAt)).limit(limit);
    }
    return db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(limit);
  }

  async logActivity(log: InsertActivityLog): Promise<ActivityLog> {
    const result = await db.insert(activityLog).values(log).returning();
    return result[0];
  }

  // Dashboard stats
  async getDashboardStats(scope?: ClinicScopeOptions): Promise<{
    totalPatients: number;
    todayAppointments: number;
    monthlyRevenue: number;
    pendingPayments: number;
  }> {
    let patientConditions = [];
    let appointmentConditions = [];
    let invoiceConditions = [];
    let pendingConditions = [];
    
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      patientConditions.push(eq(patients.organizationId, scope.clinicId));
      appointmentConditions.push(eq(appointments.organizationId, scope.clinicId));
      invoiceConditions.push(eq(invoices.organizationId, scope.clinicId));
      pendingConditions.push(eq(invoices.organizationId, scope.clinicId));
    }

    const [patientCount] = patientConditions.length > 0 
      ? await db.select({ count: sql<number>`count(*)` }).from(patients).where(and(...patientConditions))
      : await db.select({ count: sql<number>`count(*)` }).from(patients);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    appointmentConditions.push(gte(appointments.startTime, today), lte(appointments.startTime, tomorrow));
    const [todayCount] = await db.select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(and(...appointmentConditions));

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    invoiceConditions.push(gte(invoices.issuedDate, monthStart.toISOString().split('T')[0]));
    const [revenueResult] = await db.select({ total: sql<number>`COALESCE(SUM(CAST(paid_amount as DECIMAL)), 0)` })
      .from(invoices)
      .where(and(...invoiceConditions));

    pendingConditions.push(or(eq(invoices.status, 'sent'), eq(invoices.status, 'partial'), eq(invoices.status, 'overdue')));
    const [pendingResult] = await db.select({ total: sql<number>`COALESCE(SUM(CAST(final_amount as DECIMAL) - CAST(paid_amount as DECIMAL)), 0)` })
      .from(invoices)
      .where(and(...pendingConditions));

    return {
      totalPatients: Number(patientCount?.count || 0),
      todayAppointments: Number(todayCount?.count || 0),
      monthlyRevenue: Number(revenueResult?.total || 0),
      pendingPayments: Number(pendingResult?.total || 0),
    };
  }

  // Audit Logs - Immutable logging for financial integrity
  async getAuditLogs(filters?: { 
    entityType?: string; 
    entityId?: string; 
    userId?: string; 
    actionType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number 
  }, scope?: ClinicScopeOptions): Promise<(AuditLog & { user?: User })[]> {
    const conditions = [];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(auditLogs.organizationId, scope.clinicId));
    }
    if (filters?.entityType) {
      conditions.push(eq(auditLogs.entityType, filters.entityType as any));
    }
    if (filters?.entityId) {
      conditions.push(eq(auditLogs.entityId, filters.entityId));
    }
    if (filters?.userId) {
      conditions.push(eq(auditLogs.userId, filters.userId));
    }
    if (filters?.actionType) {
      conditions.push(eq(auditLogs.actionType, filters.actionType as any));
    }
    if (filters?.startDate) {
      conditions.push(gte(auditLogs.timestamp, new Date(filters.startDate)));
    }
    if (filters?.endDate) {
      conditions.push(lte(auditLogs.timestamp, new Date(filters.endDate)));
    }
    
    let logs: AuditLog[];
    
    if (conditions.length > 0) {
      logs = await db.select().from(auditLogs)
        .where(and(...conditions))
        .orderBy(desc(auditLogs.timestamp))
        .limit(filters?.limit || 200);
    } else {
      logs = await db.select().from(auditLogs)
        .orderBy(desc(auditLogs.timestamp))
        .limit(filters?.limit || 200);
    }
    
    // Fetch users for enrichment
    const userIds = Array.from(new Set(logs.map(l => l.userId)));
    const usersList = await db.select().from(users).where(
      userIds.length > 0 ? or(...userIds.map(id => eq(users.id, id))) : sql`false`
    );
    const userMap = new Map(usersList.map(u => [u.id, u]));
    
    return logs.map(log => ({
      ...log,
      user: userMap.get(log.userId),
    }));
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const result = await db.insert(auditLogs).values(log).returning();
    return result[0];
  }

  // Clinic Settings
  async getClinicSettings(scope?: ClinicScopeOptions): Promise<ClinicSettings> {
    let conditions = [];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(clinicSettings.organizationId, scope.clinicId));
    }
    const result = conditions.length > 0 
      ? await db.select().from(clinicSettings).where(and(...conditions)).limit(1)
      : await db.select().from(clinicSettings).limit(1);
    if (result.length === 0) {
      const initial = await db.insert(clinicSettings).values({
        organizationId: scope?.clinicId
      }).returning();
      return initial[0];
    }
    return result[0];
  }

  async updateClinicSettings(data: Partial<InsertClinicSettings>, scope?: ClinicScopeOptions): Promise<ClinicSettings> {
    const settings = await this.getClinicSettings(scope);
    let conditions = [eq(clinicSettings.id, settings.id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(clinicSettings.organizationId, scope.clinicId));
    }
    const result = await db.update(clinicSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(and(...conditions))
      .returning();
    return result[0];
  }

  // Clinic Rooms
  async getClinicRooms(scope?: ClinicScopeOptions): Promise<ClinicRoom[]> {
    let conditions = [eq(clinicRooms.isActive, true)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(clinicRooms.organizationId, scope.clinicId));
    }
    return db.select().from(clinicRooms).where(and(...conditions)).orderBy(clinicRooms.name);
  }

  async getClinicRoom(id: string, scope?: ClinicScopeOptions): Promise<ClinicRoom | undefined> {
    let conditions = [eq(clinicRooms.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(clinicRooms.organizationId, scope.clinicId));
    }
    const result = await db.select().from(clinicRooms).where(and(...conditions)).limit(1);
    return result[0];
  }

  async createClinicRoom(room: InsertClinicRoom): Promise<ClinicRoom> {
    const result = await db.insert(clinicRooms).values(room).returning();
    return result[0];
  }

  async updateClinicRoom(id: string, data: Partial<InsertClinicRoom>, scope?: ClinicScopeOptions): Promise<ClinicRoom | undefined> {
    let conditions = [eq(clinicRooms.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(clinicRooms.organizationId, scope.clinicId));
    }
    const result = await db.update(clinicRooms).set(data).where(and(...conditions)).returning();
    return result[0];
  }

  async deleteClinicRoom(id: string, scope?: ClinicScopeOptions): Promise<boolean> {
    let conditions = [eq(clinicRooms.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(clinicRooms.organizationId, scope.clinicId));
    }
    const result = await db.update(clinicRooms).set({ isActive: false }).where(and(...conditions)).returning();
    return result.length > 0;
  }

  // External Labs
  async getExternalLab(id: string, scope?: ClinicScopeOptions): Promise<ExternalLab | undefined> {
    let conditions = [eq(externalLabs.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(externalLabs.organizationId, scope.clinicId));
    }
    const result = await db.select().from(externalLabs).where(and(...conditions)).limit(1);
    return result[0];
  }

  async getExternalLabs(scope?: ClinicScopeOptions): Promise<ExternalLab[]> {
    let conditions = [eq(externalLabs.isActive, true)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(externalLabs.organizationId, scope.clinicId));
    }
    return db.select().from(externalLabs).where(and(...conditions)).orderBy(externalLabs.name);
  }

  async createExternalLab(lab: InsertExternalLab): Promise<ExternalLab> {
    const result = await db.insert(externalLabs).values(lab).returning();
    return result[0];
  }

  async updateExternalLab(id: string, data: Partial<InsertExternalLab>, scope?: ClinicScopeOptions): Promise<ExternalLab | undefined> {
    let conditions = [eq(externalLabs.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(externalLabs.organizationId, scope.clinicId));
    }
    const result = await db.update(externalLabs).set(data).where(and(...conditions)).returning();
    return result[0];
  }

  async deleteExternalLab(id: string, scope?: ClinicScopeOptions): Promise<boolean> {
    let conditions = [eq(externalLabs.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(externalLabs.organizationId, scope.clinicId));
    }
    const result = await db.update(externalLabs).set({ isActive: false }).where(and(...conditions)).returning();
    return result.length > 0;
  }

  // Lab Services
  async getLabService(id: string, scope?: ClinicScopeOptions): Promise<LabService | undefined> {
    let conditions = [eq(labServices.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(labServices.organizationId, scope.clinicId));
    }
    const result = await db.select().from(labServices).where(and(...conditions)).limit(1);
    return result[0];
  }

  async getLabServices(labId?: string, scope?: ClinicScopeOptions): Promise<LabService[]> {
    let conditions = [eq(labServices.isActive, true)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(labServices.organizationId, scope.clinicId));
    }
    if (labId) {
      conditions.push(eq(labServices.labId, labId));
    }
    return db.select().from(labServices).where(and(...conditions)).orderBy(labServices.name);
  }

  async createLabService(service: InsertLabService): Promise<LabService> {
    const result = await db.insert(labServices).values(service).returning();
    return result[0];
  }

  async updateLabService(id: string, data: Partial<InsertLabService>, scope?: ClinicScopeOptions): Promise<LabService | undefined> {
    let conditions = [eq(labServices.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(labServices.organizationId, scope.clinicId));
    }
    const result = await db.update(labServices).set(data).where(and(...conditions)).returning();
    return result[0];
  }

  async deleteLabService(id: string, scope?: ClinicScopeOptions): Promise<boolean> {
    let conditions = [eq(labServices.id, id)];
    if (scope?.clinicId && !scope?.isSuperAdmin) {
      conditions.push(eq(labServices.organizationId, scope.clinicId));
    }
    const result = await db.update(labServices).set({ isActive: false }).where(and(...conditions)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
