import { eq, and, gte, lte, desc, sql, or, ilike } from "drizzle-orm";
import { db } from "./db";
import {
  users, patients, treatments, patientTreatments, appointments,
  invoices, invoiceItems, payments, inventoryItems, labCases,
  documents, orthodonticNotes, activityLog,
  type User, type InsertUser,
  type Patient, type InsertPatient,
  type Treatment, type InsertTreatment,
  type PatientTreatment, type InsertPatientTreatment,
  type Appointment, type InsertAppointment,
  type Invoice, type InsertInvoice,
  type InvoiceItem, type InsertInvoiceItem,
  type Payment, type InsertPayment,
  type InventoryItem, type InsertInventoryItem,
  type LabCase, type InsertLabCase,
  type Document, type InsertDocument,
  type OrthodonticNote, type InsertOrthodonticNote,
  type ActivityLog, type InsertActivityLog,
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

  // Payments
  getPayments(filters?: { invoiceId?: string }): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;

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

  // Payments
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

    return result[0];
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
}

export const storage = new DatabaseStorage();
