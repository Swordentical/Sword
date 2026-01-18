import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, date, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "doctor", "staff", "student"]);
export const genderEnum = pgEnum("gender", ["male", "female", "other"]);
export const appointmentStatusEnum = pgEnum("appointment_status", ["confirmed", "pending", "canceled", "completed"]);
export const appointmentCategoryEnum = pgEnum("appointment_category", ["new_visit", "follow_up", "discussion", "surgery", "checkup", "cleaning"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "sent", "paid", "partial", "overdue", "canceled"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "card", "bank_transfer", "insurance", "other"]);
export const adjustmentTypeEnum = pgEnum("adjustment_type", ["discount", "write_off", "refund", "fee", "correction"]);
export const paymentPlanStatusEnum = pgEnum("payment_plan_status", ["active", "completed", "canceled", "defaulted"]);
export const inventoryStatusEnum = pgEnum("inventory_status", ["available", "low_stock", "out_of_stock"]);
export const inventoryCategoryEnum = pgEnum("inventory_category", ["consumables", "equipment", "instruments", "medications", "office_supplies"]);
export const labCaseStatusEnum = pgEnum("lab_case_status", ["pending", "in_progress", "completed", "delivered"]);
export const treatmentStatusEnum = pgEnum("treatment_status", ["planned", "in_progress", "completed", "canceled"]);
export const expenseCategoryEnum = pgEnum("expense_category", [
  "supplies", "equipment", "lab_fees", "utilities", "rent", "salaries", 
  "marketing", "insurance", "maintenance", "software", "training", "other"
]);

export const insuranceClaimStatusEnum = pgEnum("insurance_claim_status", [
  "draft", "submitted", "pending", "approved", "denied", "paid", "appealed"
]);

// Service categories
export const serviceCategoryEnum = pgEnum("service_category", [
  "endodontics", "restorative", "preventative", "fixed_prosthodontics", 
  "removable_prosthodontics", "surgery", "orthodontics", "periodontics", 
  "cosmetic", "diagnostics", "pediatric"
]);

// Doctor specialties enum
export const doctorSpecialtyEnum = pgEnum("doctor_specialty", [
  "general_dentistry", "orthodontics", "periodontics", "endodontics", 
  "prosthodontics", "oral_surgery", "pediatric_dentistry", "cosmetic_dentistry",
  "implantology", "oral_pathology"
]);

// Users/Profiles table
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: userRoleEnum("role").notNull().default("staff"),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  // Doctor-specific fields
  specialty: doctorSpecialtyEnum("specialty"),
  licenseNumber: text("license_number"),
  bio: text("bio"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Patients table
export const patients = pgTable("patients", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  dateOfBirth: date("date_of_birth"),
  gender: genderEnum("gender"),
  address: text("address"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  // Photo
  photoUrl: text("photo_url"),
  // Medical history
  allergies: text("allergies").array(),
  chronicConditions: text("chronic_conditions").array(),
  currentMedications: text("current_medications").array(),
  medicalNotes: text("medical_notes"),
  // Insurance
  insuranceProvider: text("insurance_provider"),
  insurancePolicyNumber: text("insurance_policy_number"),
  // Dental specific
  dentalHistory: text("dental_history"),
  lastVisit: date("last_visit"),
  // Assignment
  assignedDoctorId: varchar("assigned_doctor_id", { length: 36 }),
  assignedStudentId: varchar("assigned_student_id", { length: 36 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdById: varchar("created_by_id", { length: 36 }),
});

// Treatments/Services catalog
export const treatments = pgTable("treatments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  category: serviceCategoryEnum("category").notNull(),
  description: text("description"),
  defaultPrice: decimal("default_price", { precision: 10, scale: 2 }).notNull(),
  durationMinutes: integer("duration_minutes").default(30),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Patient treatments (treatment history and plans)
export const patientTreatments = pgTable("patient_treatments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patients.id),
  treatmentId: varchar("treatment_id", { length: 36 }).notNull().references(() => treatments.id),
  appointmentId: varchar("appointment_id", { length: 36 }),
  doctorId: varchar("doctor_id", { length: 36 }).references(() => users.id),
  status: treatmentStatusEnum("status").default("planned"),
  toothNumber: integer("tooth_number"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  discountType: text("discount_type"), // 'percentage' or 'value'
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }),
  scheduledDate: date("scheduled_date"),
  completionDate: date("completion_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Appointments
export const appointments = pgTable("appointments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patients.id),
  doctorId: varchar("doctor_id", { length: 36 }).references(() => users.id),
  title: text("title").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: appointmentStatusEnum("status").default("pending"),
  category: appointmentCategoryEnum("category").default("checkup"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdById: varchar("created_by_id", { length: 36 }),
});

// Invoices
export const invoices = pgTable("invoices", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull().unique(),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patients.id),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  discountType: text("discount_type"),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }),
  finalAmount: decimal("final_amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0"),
  status: invoiceStatusEnum("status").default("draft"),
  issuedDate: date("issued_date").notNull(),
  dueDate: date("due_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdById: varchar("created_by_id", { length: 36 }),
});

// Invoice items
export const invoiceItems = pgTable("invoice_items", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id", { length: 36 }).notNull().references(() => invoices.id),
  patientTreatmentId: varchar("patient_treatment_id", { length: 36 }),
  description: text("description").notNull(),
  quantity: integer("quantity").default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

// Payments
export const payments = pgTable("payments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id", { length: 36 }).notNull().references(() => invoices.id),
  paymentPlanInstallmentId: varchar("payment_plan_installment_id", { length: 36 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: date("payment_date").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  referenceNumber: text("reference_number"),
  notes: text("notes"),
  isRefunded: boolean("is_refunded").default(false),
  refundedAt: timestamp("refunded_at"),
  refundReason: text("refund_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  createdById: varchar("created_by_id", { length: 36 }),
});

// Payment Plans
export const paymentPlans = pgTable("payment_plans", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id", { length: 36 }).notNull().references(() => invoices.id),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patients.id),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  downPayment: decimal("down_payment", { precision: 10, scale: 2 }).default("0"),
  numberOfInstallments: integer("number_of_installments").notNull(),
  installmentAmount: decimal("installment_amount", { precision: 10, scale: 2 }).notNull(),
  frequency: text("frequency").notNull(), // 'weekly', 'biweekly', 'monthly'
  startDate: date("start_date").notNull(),
  status: paymentPlanStatusEnum("status").default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdById: varchar("created_by_id", { length: 36 }),
});

// Payment Plan Installments
export const paymentPlanInstallments = pgTable("payment_plan_installments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  paymentPlanId: varchar("payment_plan_id", { length: 36 }).notNull().references(() => paymentPlans.id),
  installmentNumber: integer("installment_number").notNull(),
  dueDate: date("due_date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0"),
  isPaid: boolean("is_paid").default(false),
  paidDate: date("paid_date"),
  notes: text("notes"),
});

// Invoice Adjustments (discounts, write-offs, corrections, fees)
export const invoiceAdjustments = pgTable("invoice_adjustments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id", { length: 36 }).notNull().references(() => invoices.id),
  type: adjustmentTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  appliedDate: date("applied_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  createdById: varchar("created_by_id", { length: 36 }),
});

// Expenses for clinic operations
export const expenses = pgTable("expenses", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  description: text("description").notNull(),
  category: expenseCategoryEnum("category").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  expenseDate: date("expense_date").notNull(),
  vendor: text("vendor"),
  referenceNumber: text("reference_number"),
  notes: text("notes"),
  receiptUrl: text("receipt_url"),
  isRecurring: boolean("is_recurring").default(false),
  recurringFrequency: text("recurring_frequency"),
  createdById: varchar("created_by_id", { length: 36 }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insurance claims
export const insuranceClaims = pgTable("insurance_claims", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  claimNumber: text("claim_number").notNull().unique(),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patients.id),
  invoiceId: varchar("invoice_id", { length: 36 }).references(() => invoices.id),
  insuranceProvider: text("insurance_provider").notNull(),
  policyNumber: text("policy_number").notNull(),
  subscriberName: text("subscriber_name"),
  subscriberDob: date("subscriber_dob"),
  subscriberRelation: text("subscriber_relation"),
  status: insuranceClaimStatusEnum("status").notNull().default("draft"),
  claimAmount: decimal("claim_amount", { precision: 10, scale: 2 }).notNull(),
  approvedAmount: decimal("approved_amount", { precision: 10, scale: 2 }),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }),
  denialReason: text("denial_reason"),
  submittedDate: date("submitted_date"),
  processedDate: date("processed_date"),
  notes: text("notes"),
  createdById: varchar("created_by_id", { length: 36 }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inventory items
export const inventoryItems = pgTable("inventory_items", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: inventoryCategoryEnum("category").notNull(),
  currentQuantity: integer("current_quantity").notNull().default(0),
  minimumQuantity: integer("minimum_quantity").notNull().default(5),
  unit: text("unit").notNull(),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  supplier: text("supplier"),
  location: text("location"),
  description: text("description"),
  lastRestocked: date("last_restocked"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Lab cases
export const labCases = pgTable("lab_cases", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patients.id),
  doctorId: varchar("doctor_id", { length: 36 }).references(() => users.id),
  caseType: text("case_type").notNull(),
  labName: text("lab_name").notNull(),
  toothNumbers: integer("tooth_numbers").array(),
  sentDate: date("sent_date").notNull(),
  expectedReturnDate: date("expected_return_date"),
  actualReturnDate: date("actual_return_date"),
  status: labCaseStatusEnum("status").default("pending"),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  isPaid: boolean("is_paid").default(false),
  description: text("description"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Documents (for patient files, X-rays, photos)
export const documents = pgTable("documents", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patients.id),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  category: text("category"), // 'xray', 'photo', 'document', 'orthodontic'
  description: text("description"),
  uploadedById: varchar("uploaded_by_id", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Orthodontic progress notes
export const orthodonticNotes = pgTable("orthodontic_notes", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patients.id),
  appointmentId: varchar("appointment_id", { length: 36 }),
  stage: text("stage").notNull(),
  notes: text("notes"),
  imageUrls: text("image_urls").array(),
  createdById: varchar("created_by_id", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity log for dashboard
export const activityLog = pgTable("activity_log", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id", { length: 36 }),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  appointments: many(appointments),
  patientTreatments: many(patientTreatments),
  labCases: many(labCases),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  assignedDoctor: one(users, {
    fields: [patients.assignedDoctorId],
    references: [users.id],
  }),
  appointments: many(appointments),
  treatments: many(patientTreatments),
  invoices: many(invoices),
  labCases: many(labCases),
  documents: many(documents),
  orthodonticNotes: many(orthodonticNotes),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  doctor: one(users, {
    fields: [appointments.doctorId],
    references: [users.id],
  }),
}));

export const patientTreatmentsRelations = relations(patientTreatments, ({ one }) => ({
  patient: one(patients, {
    fields: [patientTreatments.patientId],
    references: [patients.id],
  }),
  treatment: one(treatments, {
    fields: [patientTreatments.treatmentId],
    references: [treatments.id],
  }),
  doctor: one(users, {
    fields: [patientTreatments.doctorId],
    references: [users.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  patient: one(patients, {
    fields: [invoices.patientId],
    references: [patients.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  installment: one(paymentPlanInstallments, {
    fields: [payments.paymentPlanInstallmentId],
    references: [paymentPlanInstallments.id],
  }),
}));

export const paymentPlansRelations = relations(paymentPlans, ({ one, many }) => ({
  invoice: one(invoices, {
    fields: [paymentPlans.invoiceId],
    references: [invoices.id],
  }),
  patient: one(patients, {
    fields: [paymentPlans.patientId],
    references: [patients.id],
  }),
  installments: many(paymentPlanInstallments),
}));

export const paymentPlanInstallmentsRelations = relations(paymentPlanInstallments, ({ one, many }) => ({
  paymentPlan: one(paymentPlans, {
    fields: [paymentPlanInstallments.paymentPlanId],
    references: [paymentPlans.id],
  }),
  payments: many(payments),
}));

export const invoiceAdjustmentsRelations = relations(invoiceAdjustments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceAdjustments.invoiceId],
    references: [invoices.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  createdBy: one(users, {
    fields: [expenses.createdById],
    references: [users.id],
  }),
}));

export const insuranceClaimsRelations = relations(insuranceClaims, ({ one }) => ({
  patient: one(patients, {
    fields: [insuranceClaims.patientId],
    references: [patients.id],
  }),
  invoice: one(invoices, {
    fields: [insuranceClaims.invoiceId],
    references: [invoices.id],
  }),
  createdBy: one(users, {
    fields: [insuranceClaims.createdById],
    references: [users.id],
  }),
}));

export const labCasesRelations = relations(labCases, ({ one }) => ({
  patient: one(patients, {
    fields: [labCases.patientId],
    references: [patients.id],
  }),
  doctor: one(users, {
    fields: [labCases.doctorId],
    references: [users.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  patient: one(patients, {
    fields: [documents.patientId],
    references: [patients.id],
  }),
}));

export const orthodonticNotesRelations = relations(orthodonticNotes, ({ one }) => ({
  patient: one(patients, {
    fields: [orthodonticNotes.patientId],
    references: [patients.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertPatientSchema = createInsertSchema(patients).omit({ id: true, createdAt: true });
export const insertTreatmentSchema = createInsertSchema(treatments).omit({ id: true, createdAt: true });
export const insertPatientTreatmentSchema = createInsertSchema(patientTreatments).omit({ id: true, createdAt: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true, createdAt: true }).extend({
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
});
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });
export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({ id: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });
export const insertPaymentPlanSchema = createInsertSchema(paymentPlans).omit({ id: true, createdAt: true });
export const insertPaymentPlanInstallmentSchema = createInsertSchema(paymentPlanInstallments).omit({ id: true });
export const insertInvoiceAdjustmentSchema = createInsertSchema(invoiceAdjustments).omit({ id: true, createdAt: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true });
export const insertInsuranceClaimSchema = createInsertSchema(insuranceClaims).omit({ id: true, createdAt: true });
export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({ id: true, createdAt: true });
export const insertLabCaseSchema = createInsertSchema(labCases).omit({ id: true, createdAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true });
export const insertOrthodonticNoteSchema = createInsertSchema(orthodonticNotes).omit({ id: true, createdAt: true });
export const insertActivityLogSchema = createInsertSchema(activityLog).omit({ id: true, createdAt: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

export type InsertTreatment = z.infer<typeof insertTreatmentSchema>;
export type Treatment = typeof treatments.$inferSelect;

export type InsertPatientTreatment = z.infer<typeof insertPatientTreatmentSchema>;
export type PatientTreatment = typeof patientTreatments.$inferSelect;

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type InsertPaymentPlan = z.infer<typeof insertPaymentPlanSchema>;
export type PaymentPlan = typeof paymentPlans.$inferSelect;

export type InsertPaymentPlanInstallment = z.infer<typeof insertPaymentPlanInstallmentSchema>;
export type PaymentPlanInstallment = typeof paymentPlanInstallments.$inferSelect;

export type InsertInvoiceAdjustment = z.infer<typeof insertInvoiceAdjustmentSchema>;
export type InvoiceAdjustment = typeof invoiceAdjustments.$inferSelect;

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

export type InsertInsuranceClaim = z.infer<typeof insertInsuranceClaimSchema>;
export type InsuranceClaim = typeof insuranceClaims.$inferSelect;

export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;

export type InsertLabCase = z.infer<typeof insertLabCaseSchema>;
export type LabCase = typeof labCases.$inferSelect;

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export type InsertOrthodonticNote = z.infer<typeof insertOrthodonticNoteSchema>;
export type OrthodonticNote = typeof orthodonticNotes.$inferSelect;

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLog.$inferSelect;

// Role type
export type UserRole = "admin" | "doctor" | "staff" | "student";

// Helper types for frontend
export type AppointmentWithPatient = Appointment & { patient: Patient };
export type AppointmentWithDetails = Appointment & { patient: Patient; doctor?: User };
export type PatientTreatmentWithDetails = PatientTreatment & { treatment: Treatment; doctor?: User };
export type InvoiceWithPatient = Invoice & { patient: Patient };
export type LabCaseWithPatient = LabCase & { patient: Patient };
export type PaymentPlanWithDetails = PaymentPlan & { 
  patient: Patient; 
  invoice: Invoice;
  installments: PaymentPlanInstallment[];
};
