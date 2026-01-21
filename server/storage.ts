import { eq, and, gte, lte, desc, sql, or, ilike } from "drizzle-orm";
import { db } from "./db";
import {
  users, patients, treatments, patientTreatments, appointments,
  invoices, invoiceItems, payments, paymentPlans, paymentPlanInstallments,
  invoiceAdjustments, expenses, insuranceClaims, inventoryItems, labCases,
  documents, orthodonticNotes, activityLog, auditLogs,
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
  type InsuranceClaim, type InsertInsuranceClaim,
  type InventoryItem, type InsertInventoryItem,
  type LabCase, type InsertLabCase,
  type Document, type InsertDocument,
  type OrthodonticNote, type InsertOrthodonticNote,
  type ActivityLog, type InsertActivityLog,
  type AuditLog, type InsertAuditLog,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(filters?: { role?: string }): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // Patients
  getPatient(id: string): Promise<Patient | undefined>;
  getPatients(filters?: { search?: string; assignedDoctorId?: string; assignedStudentId?: string }): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: string, data: Partial<InsertPatient>): Promise<Patient | undefined>;
  deletePatient(id: string): Promise<boolean>;

  // Treatments (Services catalog)
  getTreatment(id: string): Promise<Treatment | undefined>;
  getTreatments(): Promise<Treatment[]>;
  createTreatment(treatment: InsertTreatment): Promise<Treatment>;
  updateTreatment(id: string, data: Partial<InsertTreatment>): Promise<Treatment | undefined>;

  // Patient Treatments
  getPatientTreatments(patientId: string): Promise<PatientTreatment[]>;
  createPatientTreatment(treatment: InsertPatientTreatment): Promise<PatientTreatment>;
  updatePatientTreatment(id: string, data: Partial<InsertPatientTreatment>): Promise<PatientTreatment | undefined>;

  // Appointments
  getAppointment(id: string): Promise<Appointment | undefined>;
  getAppointments(filters?: { start?: Date; end?: Date; status?: string; doctorId?: string }): Promise<Appointment[]>;
  getTodayAppointments(): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, data: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: string): Promise<boolean>;

  // Invoices
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoices(filters?: { patientId?: string; status?: string }): Promise<Invoice[]>;
  getPatientInvoices(patientId: string): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, data: Partial<InsertInvoice>): Promise<Invoice | undefined>;

  // Invoice Items
  getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]>;
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  deleteInvoiceItem(id: string): Promise<void>;

  // Payments
  getPayment(id: string): Promise<Payment | undefined>;
  getPayments(filters?: { invoiceId?: string }): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, data: Partial<InsertPayment>): Promise<Payment | undefined>;
  refundPayment(id: string, reason: string): Promise<Payment | undefined>;

  // Payment Plans
  getPaymentPlan(id: string): Promise<PaymentPlan | undefined>;
  getPaymentPlans(filters?: { invoiceId?: string; patientId?: string; status?: string }): Promise<PaymentPlan[]>;
  createPaymentPlan(plan: InsertPaymentPlan): Promise<PaymentPlan>;
  updatePaymentPlan(id: string, data: Partial<InsertPaymentPlan>): Promise<PaymentPlan | undefined>;

  // Payment Plan Installments
  getPaymentPlanInstallments(paymentPlanId: string): Promise<PaymentPlanInstallment[]>;
  createPaymentPlanInstallment(installment: InsertPaymentPlanInstallment): Promise<PaymentPlanInstallment>;
  updatePaymentPlanInstallment(id: string, data: Partial<InsertPaymentPlanInstallment>): Promise<PaymentPlanInstallment | undefined>;

  // Invoice Adjustments
  getInvoiceAdjustments(invoiceId: string): Promise<InvoiceAdjustment[]>;
  createInvoiceAdjustment(adjustment: InsertInvoiceAdjustment): Promise<InvoiceAdjustment>;

  // Expenses
  getExpense(id: string): Promise<Expense | undefined>;
  getExpenses(filters?: { category?: string; startDate?: string; endDate?: string }): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, data: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;

  // Insurance Claims
  getInsuranceClaim(id: string): Promise<InsuranceClaim | undefined>;
  getInsuranceClaims(filters?: { status?: string; patientId?: string }): Promise<InsuranceClaim[]>;
  createInsuranceClaim(claim: InsertInsuranceClaim): Promise<InsuranceClaim>;
  updateInsuranceClaim(id: string, data: Partial<InsertInsuranceClaim>): Promise<InsuranceClaim | undefined>;
  deleteInsuranceClaim(id: string): Promise<boolean>;
  generateClaimNumber(): Promise<string>;

  // Financial Reports
  getRevenueReport(startDate: string, endDate: string): Promise<{
    totalRevenue: number;
    totalCollections: number;
    totalAdjustments: number;
    byMonth: { month: string; revenue: number; collections: number }[];
  }>;
  getARAgingReport(): Promise<{
    current: number;
    thirtyDays: number;
    sixtyDays: number;
    ninetyDays: number;
    overNinety: number;
    total: number;
  }>;
  getProductionByDoctorReport(startDate: string, endDate: string): Promise<{
    doctorId: string;
    doctorName: string;
    totalProduction: number;
    treatmentCount: number;
  }[]>;
  getExpenseReport(startDate: string, endDate: string): Promise<{
    total: number;
    byCategory: { category: string; amount: number }[];
    byMonth: { month: string; amount: number }[];
  }>;

  // Inventory
  getInventoryItem(id: string): Promise<InventoryItem | undefined>;
  getInventoryItems(filters?: { category?: string; status?: string }): Promise<InventoryItem[]>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: string, data: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: string): Promise<boolean>;

  // Lab Cases
  getLabCase(id: string): Promise<LabCase | undefined>;
  getLabCases(filters?: { status?: string; patientId?: string }): Promise<LabCase[]>;
  createLabCase(labCase: InsertLabCase): Promise<LabCase>;
  updateLabCase(id: string, data: Partial<InsertLabCase>): Promise<LabCase | undefined>;

  // Documents
  getPatientDocuments(patientId: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: string): Promise<boolean>;

  // Activity Log
  getRecentActivity(limit?: number): Promise<ActivityLog[]>;
  logActivity(log: InsertActivityLog): Promise<ActivityLog>;

  // Clinic Settings
  getClinicSettings(): Promise<any>;
  updateClinicSettings(data: any): Promise<any>;

  // Clinic Settings
  async getClinicSettings(): Promise<any> {
    const result = await db.select().from(clinicSettings).limit(1);
    if (result.length === 0) {
      const initial = await db.insert(clinicSettings).values({}).returning();
      return initial[0];
    }
    return result[0];
  }

  async updateClinicSettings(data: any): Promise<any> {
    const settings = await this.getClinicSettings();
    const result = await db.update(clinicSettings).set({ ...data, updatedAt: new Date() }).where(eq(clinicSettings.id, settings.id)).returning();
    return result[0];
  }

  // Audit Logs (Immutable - admin only access)
  getAuditLogs(filters?: { entityType?: string; entityId?: string; userId?: string; limit?: number }): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    totalPatients: number;
    todayAppointments: number;
    monthlyRevenue: number;
    pendingPayments: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUsers(filters?: { role?: string }): Promise<User[]> {
    let query = db.select().from(users);
    if (filters?.role) {
      return db.select().from(users).where(eq(users.role, filters.role as any));
    }
    return db.select().from(users);
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // Patients
  async getPatient(id: string): Promise<Patient | undefined> {
    const result = await db.select().from(patients).where(eq(patients.id, id)).limit(1);
    return result[0];
  }

  async getPatients(filters?: { search?: string; assignedDoctorId?: string; assignedStudentId?: string }): Promise<Patient[]> {
    let conditions = [];

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

  async updatePatient(id: string, data: Partial<InsertPatient>): Promise<Patient | undefined> {
    const result = await db.update(patients).set(data).where(eq(patients.id, id)).returning();
    return result[0];
  }

  async deletePatient(id: string): Promise<boolean> {
    const result = await db.delete(patients).where(eq(patients.id, id)).returning();
    return result.length > 0;
  }

  // Treatments (Services catalog)
  async getTreatment(id: string): Promise<Treatment | undefined> {
    const result = await db.select().from(treatments).where(eq(treatments.id, id)).limit(1);
    return result[0];
  }

  async getTreatments(): Promise<Treatment[]> {
    return db.select().from(treatments).where(eq(treatments.isActive, true)).orderBy(treatments.category, treatments.name);
  }

  async createTreatment(treatment: InsertTreatment): Promise<Treatment> {
    const result = await db.insert(treatments).values(treatment).returning();
    return result[0];
  }

  async updateTreatment(id: string, data: Partial<InsertTreatment>): Promise<Treatment | undefined> {
    const result = await db.update(treatments).set(data).where(eq(treatments.id, id)).returning();
    return result[0];
  }

  // Patient Treatments
  async getPatientTreatments(patientId: string): Promise<PatientTreatment[]> {
    return db.select().from(patientTreatments).where(eq(patientTreatments.patientId, patientId)).orderBy(desc(patientTreatments.createdAt));
  }

  async createPatientTreatment(treatment: InsertPatientTreatment): Promise<PatientTreatment> {
    const result = await db.insert(patientTreatments).values(treatment).returning();
    return result[0];
  }

  async updatePatientTreatment(id: string, data: Partial<InsertPatientTreatment>): Promise<PatientTreatment | undefined> {
    const result = await db.update(patientTreatments).set(data).where(eq(patientTreatments.id, id)).returning();
    return result[0];
  }

  // Appointments
  async getAppointment(id: string): Promise<Appointment | undefined> {
    const result = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
    return result[0];
  }

  async getAppointments(filters?: { start?: Date; end?: Date; status?: string; doctorId?: string }): Promise<Appointment[]> {
    let conditions = [];

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

  async getTodayAppointments(): Promise<Appointment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return db.select().from(appointments)
      .where(and(gte(appointments.startTime, today), lte(appointments.startTime, tomorrow)))
      .orderBy(appointments.startTime);
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const result = await db.insert(appointments).values(appointment).returning();
    return result[0];
  }

  async updateAppointment(id: string, data: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const result = await db.update(appointments).set(data).where(eq(appointments.id, id)).returning();
    return result[0];
  }

  async deleteAppointment(id: string): Promise<boolean> {
    const result = await db.delete(appointments).where(eq(appointments.id, id)).returning();
    return result.length > 0;
  }

  // Invoices
  async getInvoice(id: string): Promise<Invoice | undefined> {
    const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    return result[0];
  }

  async getInvoices(filters?: { patientId?: string; status?: string }): Promise<Invoice[]> {
    let conditions = [];

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

  async getPatientInvoices(patientId: string): Promise<Invoice[]> {
    return db.select().from(invoices).where(eq(invoices.patientId, patientId)).orderBy(desc(invoices.issuedDate));
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const result = await db.insert(invoices).values(invoice).returning();
    return result[0];
  }

  async updateInvoice(id: string, data: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const result = await db.update(invoices).set(data).where(eq(invoices.id, id)).returning();
    return result[0];
  }

  // Invoice Items
  async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
    return db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  }

  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    const result = await db.insert(invoiceItems).values(item).returning();
    return result[0];
  }

  async deleteInvoiceItem(id: string): Promise<void> {
    await db.delete(invoiceItems).where(eq(invoiceItems.id, id));
  }

  // Payments
  async getPayment(id: string): Promise<Payment | undefined> {
    const result = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
    return result[0];
  }

  async getPayments(filters?: { invoiceId?: string }): Promise<Payment[]> {
    if (filters?.invoiceId) {
      return db.select().from(payments).where(eq(payments.invoiceId, filters.invoiceId)).orderBy(desc(payments.paymentDate));
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

  async updatePayment(id: string, data: Partial<InsertPayment>): Promise<Payment | undefined> {
    const result = await db.update(payments).set(data).where(eq(payments.id, id)).returning();
    return result[0];
  }

  async refundPayment(id: string, reason: string): Promise<Payment | undefined> {
    const payment = await this.getPayment(id);
    if (!payment || payment.isRefunded) return undefined;

    // Mark payment as refunded
    const result = await db.update(payments).set({
      isRefunded: true,
      refundedAt: new Date(),
      refundReason: reason,
    }).where(eq(payments.id, id)).returning();

    // Reduce invoice paid amount
    const invoice = await this.getInvoice(payment.invoiceId);
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
      });
    }

    return result[0];
  }

  // Payment Plans
  async getPaymentPlan(id: string): Promise<PaymentPlan | undefined> {
    const result = await db.select().from(paymentPlans).where(eq(paymentPlans.id, id)).limit(1);
    return result[0];
  }

  async getPaymentPlans(filters?: { invoiceId?: string; patientId?: string; status?: string }): Promise<PaymentPlan[]> {
    let conditions = [];

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

  async updatePaymentPlan(id: string, data: Partial<InsertPaymentPlan>): Promise<PaymentPlan | undefined> {
    const result = await db.update(paymentPlans).set(data).where(eq(paymentPlans.id, id)).returning();
    return result[0];
  }

  // Payment Plan Installments
  async getPaymentPlanInstallments(paymentPlanId: string): Promise<PaymentPlanInstallment[]> {
    return db.select().from(paymentPlanInstallments)
      .where(eq(paymentPlanInstallments.paymentPlanId, paymentPlanId))
      .orderBy(paymentPlanInstallments.installmentNumber);
  }

  async createPaymentPlanInstallment(installment: InsertPaymentPlanInstallment): Promise<PaymentPlanInstallment> {
    const result = await db.insert(paymentPlanInstallments).values(installment).returning();
    return result[0];
  }

  async updatePaymentPlanInstallment(id: string, data: Partial<InsertPaymentPlanInstallment>): Promise<PaymentPlanInstallment | undefined> {
    const result = await db.update(paymentPlanInstallments).set(data).where(eq(paymentPlanInstallments.id, id)).returning();
    return result[0];
  }

  // Invoice Adjustments
  async getInvoiceAdjustments(invoiceId: string): Promise<InvoiceAdjustment[]> {
    return db.select().from(invoiceAdjustments)
      .where(eq(invoiceAdjustments.invoiceId, invoiceId))
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
  async getExpense(id: string): Promise<Expense | undefined> {
    const result = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
    return result[0];
  }

  async getExpenses(filters?: { category?: string; startDate?: string; endDate?: string }): Promise<Expense[]> {
    let conditions = [];

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

  async updateExpense(id: string, data: Partial<InsertExpense>): Promise<Expense | undefined> {
    const result = await db.update(expenses).set(data).where(eq(expenses.id, id)).returning();
    return result[0];
  }

  async deleteExpense(id: string): Promise<boolean> {
    const result = await db.delete(expenses).where(eq(expenses.id, id)).returning();
    return result.length > 0;
  }

  // Insurance Claims
  async getInsuranceClaim(id: string): Promise<InsuranceClaim | undefined> {
    const result = await db.select().from(insuranceClaims).where(eq(insuranceClaims.id, id)).limit(1);
    return result[0];
  }

  async getInsuranceClaims(filters?: { status?: string; patientId?: string }): Promise<InsuranceClaim[]> {
    let conditions = [];

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

  async updateInsuranceClaim(id: string, data: Partial<InsertInsuranceClaim>): Promise<InsuranceClaim | undefined> {
    const result = await db.update(insuranceClaims).set(data).where(eq(insuranceClaims.id, id)).returning();
    return result[0];
  }

  async deleteInsuranceClaim(id: string): Promise<boolean> {
    const result = await db.delete(insuranceClaims).where(eq(insuranceClaims.id, id)).returning();
    return result.length > 0;
  }

  async generateClaimNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await db.select({ count: sql<number>`COUNT(*)` }).from(insuranceClaims);
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
  }[]> {
    // Get completed treatments with their doctor info
    const result = await db.select({
      doctorId: patientTreatments.doctorId,
      totalProduction: sql<string>`COALESCE(SUM(CAST(patient_treatments.price AS DECIMAL)), 0)`,
      treatmentCount: sql<number>`COUNT(*)`
    })
      .from(patientTreatments)
      .where(and(
        eq(patientTreatments.status, 'completed'),
        gte(patientTreatments.completionDate, startDate),
        lte(patientTreatments.completionDate, endDate)
      ))
      .groupBy(patientTreatments.doctorId);

    // Fetch doctor names
    const doctorProductions = [];
    for (const row of result) {
      if (row.doctorId) {
        const doctor = await this.getUser(row.doctorId);
        doctorProductions.push({
          doctorId: row.doctorId,
          doctorName: doctor ? `${doctor.firstName} ${doctor.lastName}` : 'Unknown',
          totalProduction: Number(row.totalProduction),
          treatmentCount: Number(row.treatmentCount),
        });
      }
    }

    return doctorProductions.sort((a, b) => b.totalProduction - a.totalProduction);
  }

  async getExpenseReport(startDate: string, endDate: string): Promise<{
    total: number;
    byCategory: { category: string; amount: number }[];
    byMonth: { month: string; amount: number }[];
  }> {
    // Total expenses
    const totalResult = await db.select({
      total: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`
    }).from(expenses)
      .where(and(
        gte(expenses.expenseDate, startDate),
        lte(expenses.expenseDate, endDate)
      ));

    // By category
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

    // By month
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

    return {
      total: Number(totalResult[0]?.total || 0),
      byCategory: byCategory.map(c => ({ category: c.category, amount: Number(c.amount) })),
      byMonth: byMonth.map(m => ({ month: m.month, amount: Number(m.amount) })),
    };
  }

  // Inventory
  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    const result = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).limit(1);
    return result[0];
  }

  async getInventoryItems(filters?: { category?: string; status?: string }): Promise<InventoryItem[]> {
    if (filters?.category) {
      return db.select().from(inventoryItems).where(eq(inventoryItems.category, filters.category as any)).orderBy(inventoryItems.name);
    }
    return db.select().from(inventoryItems).orderBy(inventoryItems.name);
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const result = await db.insert(inventoryItems).values(item).returning();
    return result[0];
  }

  async updateInventoryItem(id: string, data: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const result = await db.update(inventoryItems).set(data).where(eq(inventoryItems.id, id)).returning();
    return result[0];
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    const result = await db.delete(inventoryItems).where(eq(inventoryItems.id, id)).returning();
    return result.length > 0;
  }

  // Lab Cases
  async getLabCase(id: string): Promise<LabCase | undefined> {
    const result = await db.select().from(labCases).where(eq(labCases.id, id)).limit(1);
    return result[0];
  }

  async getLabCases(filters?: { status?: string; patientId?: string }): Promise<LabCase[]> {
    let conditions = [];

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

  async updateLabCase(id: string, data: Partial<InsertLabCase>): Promise<LabCase | undefined> {
    const result = await db.update(labCases).set(data).where(eq(labCases.id, id)).returning();
    return result[0];
  }

  // Documents
  async getPatientDocuments(patientId: string): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.patientId, patientId)).orderBy(desc(documents.createdAt));
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const result = await db.insert(documents).values(document).returning();
    return result[0];
  }

  async deleteDocument(id: string): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id)).returning();
    return result.length > 0;
  }

  // Activity Log
  async getRecentActivity(limit: number = 20): Promise<ActivityLog[]> {
    return db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(limit);
  }

  async logActivity(log: InsertActivityLog): Promise<ActivityLog> {
    const result = await db.insert(activityLog).values(log).returning();
    return result[0];
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalPatients: number;
    todayAppointments: number;
    monthlyRevenue: number;
    pendingPayments: number;
  }> {
    const [patientCount] = await db.select({ count: sql<number>`count(*)` }).from(patients);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayCount] = await db.select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(and(gte(appointments.startTime, today), lte(appointments.startTime, tomorrow)));

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const [revenueResult] = await db.select({ total: sql<number>`COALESCE(SUM(CAST(paid_amount as DECIMAL)), 0)` })
      .from(invoices)
      .where(gte(invoices.issuedDate, monthStart.toISOString().split('T')[0]));

    const [pendingResult] = await db.select({ total: sql<number>`COALESCE(SUM(CAST(final_amount as DECIMAL) - CAST(paid_amount as DECIMAL)), 0)` })
      .from(invoices)
      .where(and(
        or(eq(invoices.status, 'sent'), eq(invoices.status, 'partial'), eq(invoices.status, 'overdue')),
      ));

    return {
      totalPatients: Number(patientCount?.count || 0),
      todayAppointments: Number(todayCount?.count || 0),
      monthlyRevenue: Number(revenueResult?.total || 0),
      pendingPayments: Number(pendingResult?.total || 0),
    };
  }

  // Audit Logs - Immutable logging for financial integrity
  async getAuditLogs(filters?: { entityType?: string; entityId?: string; userId?: string; limit?: number }): Promise<AuditLog[]> {
    const conditions = [];
    if (filters?.entityType) {
      conditions.push(eq(auditLogs.entityType, filters.entityType as any));
    }
    if (filters?.entityId) {
      conditions.push(eq(auditLogs.entityId, filters.entityId));
    }
    if (filters?.userId) {
      conditions.push(eq(auditLogs.userId, filters.userId));
    }
    
    const query = db.select().from(auditLogs);
    
    if (conditions.length > 0) {
      return query
        .where(and(...conditions))
        .orderBy(desc(auditLogs.timestamp))
        .limit(filters?.limit || 100);
    }
    
    return query
      .orderBy(desc(auditLogs.timestamp))
      .limit(filters?.limit || 100);
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const result = await db.insert(auditLogs).values(log).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
