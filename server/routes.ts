import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { db } from "./db";
import {
  insertPatientSchema,
  insertTreatmentSchema,
  insertPatientTreatmentSchema,
  insertAppointmentSchema,
  insertInvoiceSchema,
  insertInvoiceItemSchema,
  insertPaymentSchema,
  insertPaymentPlanSchema,
  insertPaymentPlanInstallmentSchema,
  insertInvoiceAdjustmentSchema,
  insertExpenseSchema,
  insertInsuranceClaimSchema,
  insertInventoryItemSchema,
  insertLabCaseSchema,
  insertDocumentSchema,
  insertUserSchema,
  patients,
  appointments,
  invoices,
  labCases,
  users,
} from "@shared/schema";
import { eq } from "drizzle-orm";

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = req.user as any;
    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Clinic Settings
  app.get("/api/clinic-settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getClinicSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clinic settings" });
    }
  });

  app.patch("/api/clinic-settings", requireRole("admin"), async (req, res) => {
    try {
      const settings = await storage.updateClinicSettings(req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update clinic settings" });
    }
  });

  // Set up authentication
  setupAuth(app);

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Activity log - admin only access
  app.get("/api/activity", requireRole("admin"), async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const activity = await storage.getRecentActivity(limit);
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  // Audit logs - admin only, immutable records for financial integrity
  app.get("/api/audit-logs", requireRole("admin"), async (req, res) => {
    try {
      const { entityType, entityId, userId, limit } = req.query;
      const auditLogs = await storage.getAuditLogs({
        entityType: entityType as string,
        entityId: entityId as string,
        userId: userId as string,
        limit: limit ? parseInt(limit as string) : 100,
      });
      res.json(auditLogs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Users
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const role = req.query.role as string | undefined;
      const usersList = await storage.getUsers({ role });
      res.json(usersList.map(u => ({ ...u, password: undefined })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireRole("admin"), async (req, res) => {
    try {
      const parsed = insertUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const existingUser = await storage.getUserByUsername(parsed.data.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const bcrypt = await import("bcrypt");
      const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

      const user = await storage.createUser({
        ...parsed.data,
        password: hashedPassword,
      });

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "created",
        entityType: "user",
        entityId: user.id,
        details: `Created user ${user.firstName} ${user.lastName}`,
      });

      res.status(201).json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", requireRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Don't allow password updates through this endpoint
      delete updates.password;
      delete updates.username;
      
      const user = await storage.updateUser(id, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "updated",
        entityType: "user",
        entityId: user.id,
        details: `Updated user ${user.firstName} ${user.lastName}`,
      });

      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requireRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
      const currentUserId = (req.user as any).id;
      
      if (id === currentUserId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.deleteUser(id);

      await storage.logActivity({
        userId: currentUserId,
        action: "deleted",
        entityType: "user",
        entityId: id,
        details: `Deleted user ${user.firstName} ${user.lastName}`,
      });

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Get pending users for admin approval
  app.get("/api/users/pending", requireRole("admin"), async (req, res) => {
    try {
      const pendingUsers = await storage.getUsers({ role: "pending" });
      res.json(pendingUsers.map(u => ({ ...u, password: undefined })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });

  // Approve user and assign role (admin only)
  app.post("/api/users/:id/approve", requireRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      const validRoles = ["admin", "doctor", "staff", "student"];
      if (!role || !validRoles.includes(role)) {
        return res.status(400).json({ 
          message: "Invalid role. Must be one of: admin, doctor, staff, student" 
        });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.role !== "pending") {
        return res.status(400).json({ message: "User is already approved" });
      }
      
      const previousRole = user.role;
      const updatedUser = await storage.updateUser(id, { role });
      
      // Log the role assignment with full audit trail
      await storage.logActivity({
        userId: (req.user as any).id,
        action: "approved",
        entityType: "user",
        entityId: id,
        details: `Approved user ${user.firstName} ${user.lastName} and assigned role: ${role}`,
      });
      
      res.json({ 
        message: `User approved and assigned role: ${role}`,
        user: { ...updatedUser, password: undefined }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to approve user" });
    }
  });

  // Change user role (admin only) - for users already approved
  app.post("/api/users/:id/role", requireRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      const validRoles = ["admin", "doctor", "staff", "student", "pending"];
      if (!role || !validRoles.includes(role)) {
        return res.status(400).json({ 
          message: "Invalid role. Must be one of: admin, doctor, staff, student, pending" 
        });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const currentUserId = (req.user as any).id;
      if (id === currentUserId && role === "pending") {
        return res.status(400).json({ message: "Cannot demote your own account to pending" });
      }
      
      const previousRole = user.role;
      const updatedUser = await storage.updateUser(id, { role });
      
      // Log the role change with full audit trail
      await storage.logActivity({
        userId: currentUserId,
        action: "role_changed",
        entityType: "user",
        entityId: id,
        details: `Changed role for ${user.firstName} ${user.lastName} from ${previousRole} to ${role}`,
      });
      
      res.json({ 
        message: `User role changed from ${previousRole} to ${role}`,
        user: { ...updatedUser, password: undefined }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to change user role" });
    }
  });

  // Patients
  app.get("/api/patients", requireAuth, async (req, res) => {
    try {
      const { search, assignedDoctorId, assignedStudentId } = req.query;
      const patientsList = await storage.getPatients({
        search: search as string,
        assignedDoctorId: assignedDoctorId as string,
        assignedStudentId: assignedStudentId as string,
      });
      res.json(patientsList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  app.get("/api/patients/:id", requireAuth, async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient" });
    }
  });

  app.post("/api/patients", requireAuth, async (req, res) => {
    try {
      const parsed = insertPatientSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const patient = await storage.createPatient({
        ...parsed.data,
        createdById: (req.user as any).id,
      });

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "created",
        entityType: "patient",
        entityId: patient.id,
        details: `Added patient ${patient.firstName} ${patient.lastName}`,
      });

      res.status(201).json(patient);
    } catch (error) {
      res.status(500).json({ message: "Failed to create patient" });
    }
  });

  app.patch("/api/patients/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (user.role === "student") {
        return res.status(403).json({ message: "Students cannot update patient records" });
      }

      const updateSchema = insertPatientSchema.pick({
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        emergencyContact: true,
        emergencyPhone: true,
        photoUrl: true,
        allergies: true,
        chronicConditions: true,
        currentMedications: true,
        medicalNotes: true,
        insuranceProvider: true,
        insurancePolicyNumber: true,
        dentalHistory: true,
        lastVisit: true,
        assignedDoctorId: true,
        assignedStudentId: true,
        notes: true,
      }).partial().strict();
      
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const patient = await storage.updatePatient(req.params.id, parsed.data);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Failed to update patient" });
    }
  });

  app.delete("/api/patients/:id", requireRole("admin", "doctor"), async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Check for related records that would prevent deletion
      const treatments = await storage.getPatientTreatments(req.params.id);
      const invoices = await storage.getPatientInvoices(req.params.id);
      const appointments = await storage.getAppointments({});
      const patientAppointments = appointments.filter(a => a.patientId === req.params.id);

      if (treatments.length > 0 || invoices.length > 0 || patientAppointments.length > 0) {
        const relatedItems = [];
        if (treatments.length > 0) relatedItems.push(`${treatments.length} treatment(s)`);
        if (invoices.length > 0) relatedItems.push(`${invoices.length} invoice(s)`);
        if (patientAppointments.length > 0) relatedItems.push(`${patientAppointments.length} appointment(s)`);
        
        return res.status(409).json({ 
          message: `Cannot delete patient. This patient has related records: ${relatedItems.join(", ")}. Please remove or archive these records first.`
        });
      }

      const deleted = await storage.deletePatient(req.params.id);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete patient" });
      }

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "deleted",
        entityType: "patient",
        entityId: req.params.id,
        details: `Deleted patient ${patient.firstName} ${patient.lastName}`,
      });

      res.json({ message: "Patient deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete patient" });
    }
  });

  // Patient treatments
  app.get("/api/patients/:id/treatments", requireAuth, async (req, res) => {
    try {
      const treatments = await storage.getPatientTreatments(req.params.id);
      
      // Get treatment details for each
      const treatmentsList = await storage.getTreatments();
      const treatmentMap = new Map(treatmentsList.map(t => [t.id, t]));
      
      const enriched = treatments.map(pt => ({
        ...pt,
        treatment: treatmentMap.get(pt.treatmentId),
      }));
      
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient treatments" });
    }
  });

  app.post("/api/patients/:id/treatments", requireRole("admin", "doctor", "staff"), async (req, res) => {
    try {
      const parsed = insertPatientTreatmentSchema.safeParse({
        ...req.body,
        patientId: req.params.id,
        doctorId: (req.user as any).role === 'doctor' ? (req.user as any).id : req.body.doctorId,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const treatment = await storage.createPatientTreatment(parsed.data);
      res.status(201).json(treatment);
    } catch (error) {
      res.status(500).json({ message: "Failed to add treatment" });
    }
  });

  // Patient invoices
  app.get("/api/patients/:id/invoices", requireAuth, async (req, res) => {
    try {
      const invoicesList = await storage.getPatientInvoices(req.params.id);
      res.json(invoicesList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient invoices" });
    }
  });

  // Patient documents
  app.get("/api/patients/:id/documents", requireAuth, async (req, res) => {
    try {
      const docs = await storage.getPatientDocuments(req.params.id);
      res.json(docs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient documents" });
    }
  });

  app.post("/api/patients/:id/documents", requireAuth, async (req, res) => {
    try {
      const parsed = insertDocumentSchema.safeParse({
        ...req.body,
        patientId: req.params.id,
        uploadedById: (req.user as any).id,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const doc = await storage.createDocument(parsed.data);
      res.status(201).json(doc);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Treatments (Services catalog)
  app.get("/api/treatments", requireAuth, async (req, res) => {
    try {
      const treatmentsList = await storage.getTreatments();
      res.json(treatmentsList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch treatments" });
    }
  });

  app.post("/api/treatments", requireRole("admin", "doctor"), async (req, res) => {
    try {
      // Generate unique code
      const code = `SVC-${Date.now().toString(36).toUpperCase()}`;
      
      const parsed = insertTreatmentSchema.safeParse({
        ...req.body,
        code,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const treatment = await storage.createTreatment(parsed.data);
      res.status(201).json(treatment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create treatment" });
    }
  });

  // Appointments
  app.get("/api/appointments", requireAuth, async (req, res) => {
    try {
      const { start, end, status, doctorId } = req.query;
      const appointmentsList = await storage.getAppointments({
        start: start ? new Date(start as string) : undefined,
        end: end ? new Date(end as string) : undefined,
        status: status as string,
        doctorId: doctorId as string,
      });

      // Enrich with patient data
      const patientsList = await storage.getPatients({});
      const patientMap = new Map(patientsList.map(p => [p.id, p]));

      const enriched = appointmentsList.map(apt => ({
        ...apt,
        patient: patientMap.get(apt.patientId),
      }));

      res.json(enriched);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments/today", requireAuth, async (req, res) => {
    try {
      const appointmentsList = await storage.getTodayAppointments();
      
      // Enrich with patient data
      const patientsList = await storage.getPatients({});
      const patientMap = new Map(patientsList.map(p => [p.id, p]));

      const enriched = appointmentsList.map(apt => ({
        ...apt,
        patient: patientMap.get(apt.patientId),
      }));

      res.json(enriched);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch today's appointments" });
    }
  });

  app.get("/api/appointments/:id", requireAuth, async (req, res) => {
    try {
      const appointment = await storage.getAppointment(req.params.id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointment" });
    }
  });

  app.post("/api/appointments", requireAuth, async (req, res) => {
    try {
      const parsed = insertAppointmentSchema.safeParse({
        ...req.body,
        createdById: (req.user as any).id,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const appointment = await storage.createAppointment(parsed.data);

      // Get patient for activity log
      const patient = await storage.getPatient(parsed.data.patientId);

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "created",
        entityType: "appointment",
        entityId: appointment.id,
        details: `Scheduled appointment for ${patient?.firstName} ${patient?.lastName}`,
      });

      res.status(201).json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.patch("/api/appointments/:id", requireAuth, async (req, res) => {
    try {
      const updateSchema = insertAppointmentSchema.pick({
        title: true,
        startTime: true,
        endTime: true,
        status: true,
        category: true,
        notes: true,
        doctorId: true,
      }).partial().strict();
      
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const appointment = await storage.updateAppointment(req.params.id, parsed.data);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  // Invoices - restricted to admin, doctor, staff (not students)
  app.get("/api/invoices", requireRole("admin", "doctor", "staff"), async (req, res) => {
    try {
      const { patientId, status } = req.query;
      const invoicesList = await storage.getInvoices({
        patientId: patientId as string,
        status: status as string,
      });

      // Enrich with patient data
      const patientsList = await storage.getPatients({});
      const patientMap = new Map(patientsList.map(p => [p.id, p]));

      const enriched = invoicesList.map(inv => ({
        ...inv,
        patient: patientMap.get(inv.patientId),
      }));

      res.json(enriched);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.post("/api/invoices", requireRole("admin", "doctor", "staff"), async (req, res) => {
    try {
      // Generate unique invoice number
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
      const { items, ...invoiceData } = req.body;

      const parsed = insertInvoiceSchema.safeParse({
        ...invoiceData,
        invoiceNumber,
        createdById: (req.user as any).id,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const invoice = await storage.createInvoice(parsed.data);

      // Create invoice items if provided
      if (items && Array.isArray(items)) {
        for (const item of items) {
          const itemParsed = insertInvoiceItemSchema.safeParse({
            ...item,
            invoiceId: invoice.id,
          });
          if (itemParsed.success) {
            await storage.createInvoiceItem(itemParsed.data);
          }
        }
      }

      const user = req.user as any;
      
      // Activity log for dashboard
      await storage.logActivity({
        userId: user.id,
        action: "created",
        entityType: "invoice",
        entityId: invoice.id,
        details: `Created invoice ${invoice.invoiceNumber} for $${invoice.finalAmount}`,
      });

      // Immutable audit log for financial integrity
      await storage.createAuditLog({
        userId: user.id,
        userRole: user.role,
        actionType: "CREATE",
        entityType: "invoice",
        entityId: invoice.id,
        previousValue: null,
        newValue: invoice,
        description: `Created invoice ${invoice.invoiceNumber} for $${invoice.finalAmount}`,
        ipAddress: req.ip || null,
      });

      res.status(201).json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  // Get single invoice with items
  app.get("/api/invoices/:id", requireRole("admin", "doctor", "staff"), async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const items = await storage.getInvoiceItems(invoice.id);
      const payments = await storage.getPayments({ invoiceId: invoice.id });
      const patientsList = await storage.getPatients({});
      const patient = patientsList.find(p => p.id === invoice.patientId);

      res.json({ ...invoice, items, payments, patient });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  // Update invoice (status changes, send/void, etc.)
  app.patch("/api/invoices/:id", requireRole("admin", "doctor", "staff"), async (req, res) => {
    try {
      const updateSchema = insertInvoiceSchema.pick({
        status: true,
        notes: true,
        dueDate: true,
        discountType: true,
        discountValue: true,
        totalAmount: true,
        finalAmount: true,
      }).partial().strict();

      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      // Get previous state for audit log
      const previousInvoice = await storage.getInvoice(req.params.id);
      if (!previousInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const invoice = await storage.updateInvoice(req.params.id, parsed.data);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const user = req.user as any;
      
      await storage.logActivity({
        userId: user.id,
        action: "updated",
        entityType: "invoice",
        entityId: invoice.id,
        details: `Updated invoice ${invoice.invoiceNumber}`,
      });

      // Immutable audit log for financial integrity
      await storage.createAuditLog({
        userId: user.id,
        userRole: user.role,
        actionType: "UPDATE",
        entityType: "invoice",
        entityId: invoice.id,
        previousValue: previousInvoice,
        newValue: invoice,
        description: `Updated invoice ${invoice.invoiceNumber}`,
        ipAddress: req.ip || null,
      });

      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  // Send invoice (change status from draft to sent)
  app.post("/api/invoices/:id/send", requireRole("admin", "doctor", "staff"), async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      if (invoice.status !== "draft") {
        return res.status(400).json({ message: "Only draft invoices can be sent" });
      }

      const updated = await storage.updateInvoice(req.params.id, { status: "sent" });

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "sent",
        entityType: "invoice",
        entityId: invoice.id,
        details: `Sent invoice ${invoice.invoiceNumber} to patient`,
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to send invoice" });
    }
  });

  // Void/cancel invoice
  app.post("/api/invoices/:id/void", requireRole("admin", "doctor", "staff"), async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      if (invoice.status === "paid") {
        return res.status(400).json({ message: "Cannot void a paid invoice" });
      }

      const updated = await storage.updateInvoice(req.params.id, { status: "canceled" });

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "voided",
        entityType: "invoice",
        entityId: invoice.id,
        details: `Voided invoice ${invoice.invoiceNumber}`,
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to void invoice" });
    }
  });

  // Invoice items management
  app.post("/api/invoices/:id/items", requireRole("admin", "doctor", "staff"), async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      if (invoice.status !== "draft") {
        return res.status(400).json({ message: "Can only add items to draft invoices" });
      }

      const parsed = insertInvoiceItemSchema.safeParse({
        ...req.body,
        invoiceId: req.params.id,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const item = await storage.createInvoiceItem(parsed.data);

      // Recalculate invoice totals
      const items = await storage.getInvoiceItems(invoice.id);
      const totalAmount = items.reduce((sum, i) => sum + Number(i.totalPrice), 0);
      let finalAmount = totalAmount;
      if (invoice.discountType && invoice.discountValue) {
        if (invoice.discountType === "percentage") {
          finalAmount = totalAmount * (1 - Number(invoice.discountValue) / 100);
        } else {
          finalAmount = totalAmount - Number(invoice.discountValue);
        }
      }
      await storage.updateInvoice(invoice.id, { 
        totalAmount: totalAmount.toFixed(2),
        finalAmount: finalAmount.toFixed(2)
      });

      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to add invoice item" });
    }
  });

  app.delete("/api/invoices/:invoiceId/items/:itemId", requireRole("admin", "doctor", "staff"), async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      if (invoice.status !== "draft") {
        return res.status(400).json({ message: "Can only remove items from draft invoices" });
      }

      await storage.deleteInvoiceItem(req.params.itemId);

      // Recalculate invoice totals
      const items = await storage.getInvoiceItems(invoice.id);
      const totalAmount = items.reduce((sum, i) => sum + Number(i.totalPrice), 0);
      let finalAmount = totalAmount;
      if (invoice.discountType && invoice.discountValue) {
        if (invoice.discountType === "percentage") {
          finalAmount = totalAmount * (1 - Number(invoice.discountValue) / 100);
        } else {
          finalAmount = totalAmount - Number(invoice.discountValue);
        }
      }
      await storage.updateInvoice(invoice.id, { 
        totalAmount: totalAmount.toFixed(2),
        finalAmount: finalAmount.toFixed(2)
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove invoice item" });
    }
  });

  // Payments - restricted to admin, doctor, staff (not students)
  app.get("/api/payments", requireRole("admin", "doctor", "staff"), async (req, res) => {
    try {
      const { invoiceId } = req.query;
      const paymentsList = await storage.getPayments({
        invoiceId: invoiceId as string,
      });
      res.json(paymentsList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post("/api/payments", requireRole("admin", "doctor", "staff"), async (req, res) => {
    try {
      const user = req.user as any;
      const parsed = insertPaymentSchema.safeParse({
        ...req.body,
        createdById: user.id,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const payment = await storage.createPayment(parsed.data);

      await storage.logActivity({
        userId: user.id,
        action: "created",
        entityType: "payment",
        entityId: payment.id,
        details: `Recorded payment of $${payment.amount}`,
      });

      // Immutable audit log for financial integrity
      await storage.createAuditLog({
        userId: user.id,
        userRole: user.role,
        actionType: "CREATE",
        entityType: "payment",
        entityId: payment.id,
        previousValue: null,
        newValue: payment,
        description: `Recorded payment of $${payment.amount} via ${payment.paymentMethod}`,
        ipAddress: req.ip || null,
      });

      res.status(201).json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to record payment" });
    }
  });

  // Refund payment
  app.post("/api/payments/:id/refund", requireRole("admin", "doctor"), async (req, res) => {
    try {
      const { reason } = req.body;
      if (!reason || typeof reason !== 'string') {
        return res.status(400).json({ message: "Refund reason is required" });
      }

      // Get previous state for audit log
      const previousPayment = await storage.getPayment(req.params.id);
      if (!previousPayment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      const payment = await storage.refundPayment(req.params.id, reason);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found or already refunded" });
      }

      const user = req.user as any;

      await storage.logActivity({
        userId: user.id,
        action: "refunded",
        entityType: "payment",
        entityId: payment.id,
        details: `Refunded payment of $${payment.amount}: ${reason}`,
      });

      // Immutable audit log for financial integrity
      await storage.createAuditLog({
        userId: user.id,
        userRole: user.role,
        actionType: "UPDATE",
        entityType: "payment",
        entityId: payment.id,
        previousValue: previousPayment,
        newValue: payment,
        description: `Refunded payment of $${payment.amount}: ${reason}`,
        ipAddress: req.ip || null,
      });

      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to refund payment" });
    }
  });

  // Payment Plans
  app.get("/api/payment-plans", requireRole("admin", "doctor", "staff"), async (req, res) => {
    try {
      const { invoiceId, patientId, status } = req.query;
      const plans = await storage.getPaymentPlans({
        invoiceId: invoiceId as string,
        patientId: patientId as string,
        status: status as string,
      });

      // Enrich with patient and invoice data
      const enrichedPlans = await Promise.all(plans.map(async (plan) => {
        const [patient, invoice, installments] = await Promise.all([
          storage.getPatient(plan.patientId),
          storage.getInvoice(plan.invoiceId),
          storage.getPaymentPlanInstallments(plan.id),
        ]);
        return { ...plan, patient, invoice, installments };
      }));

      res.json(enrichedPlans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment plans" });
    }
  });

  app.get("/api/payment-plans/:id", requireRole("admin", "doctor", "staff"), async (req, res) => {
    try {
      const plan = await storage.getPaymentPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Payment plan not found" });
      }

      const [patient, invoice, installments] = await Promise.all([
        storage.getPatient(plan.patientId),
        storage.getInvoice(plan.invoiceId),
        storage.getPaymentPlanInstallments(plan.id),
      ]);

      res.json({ ...plan, patient, invoice, installments });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment plan" });
    }
  });

  app.post("/api/payment-plans", requireRole("admin", "doctor", "staff"), async (req, res) => {
    try {
      const { installments: installmentDates, ...planData } = req.body;

      const parsed = insertPaymentPlanSchema.safeParse({
        ...planData,
        createdById: (req.user as any).id,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const plan = await storage.createPaymentPlan(parsed.data);

      // Create installments if provided
      if (installmentDates && Array.isArray(installmentDates)) {
        for (let i = 0; i < installmentDates.length; i++) {
          await storage.createPaymentPlanInstallment({
            paymentPlanId: plan.id,
            installmentNumber: i + 1,
            dueDate: installmentDates[i].dueDate,
            amount: installmentDates[i].amount || parsed.data.installmentAmount,
          });
        }
      } else {
        // Auto-generate installments based on frequency
        const startDate = new Date(parsed.data.startDate);
        const frequency = parsed.data.frequency;
        const numInstallments = parsed.data.numberOfInstallments;
        const amount = parsed.data.installmentAmount;

        for (let i = 0; i < numInstallments; i++) {
          const dueDate = new Date(startDate);
          if (frequency === 'weekly') {
            dueDate.setDate(dueDate.getDate() + (i * 7));
          } else if (frequency === 'biweekly') {
            dueDate.setDate(dueDate.getDate() + (i * 14));
          } else if (frequency === 'monthly') {
            dueDate.setMonth(dueDate.getMonth() + i);
          }

          await storage.createPaymentPlanInstallment({
            paymentPlanId: plan.id,
            installmentNumber: i + 1,
            dueDate: dueDate.toISOString().split('T')[0],
            amount: amount,
          });
        }
      }

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "created",
        entityType: "payment_plan",
        entityId: plan.id,
        details: `Created payment plan with ${parsed.data.numberOfInstallments} installments`,
      });

      // Return enriched plan
      const installments = await storage.getPaymentPlanInstallments(plan.id);
      res.status(201).json({ ...plan, installments });
    } catch (error) {
      res.status(500).json({ message: "Failed to create payment plan" });
    }
  });

  app.patch("/api/payment-plans/:id", requireRole("admin", "doctor"), async (req, res) => {
    try {
      const updateSchema = insertPaymentPlanSchema.pick({
        status: true,
        notes: true,
      }).partial().strict();

      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const plan = await storage.updatePaymentPlan(req.params.id, parsed.data);
      if (!plan) {
        return res.status(404).json({ message: "Payment plan not found" });
      }

      res.json(plan);
    } catch (error) {
      res.status(500).json({ message: "Failed to update payment plan" });
    }
  });

  // Payment plan installments - pay an installment
  app.post("/api/payment-plans/:planId/installments/:installmentId/pay", requireRole("admin", "doctor", "staff"), async (req, res) => {
    try {
      const { amount, paymentMethod, referenceNumber, notes } = req.body;
      
      const plan = await storage.getPaymentPlan(req.params.planId);
      if (!plan) {
        return res.status(404).json({ message: "Payment plan not found" });
      }

      // Create payment linked to installment
      const payment = await storage.createPayment({
        invoiceId: plan.invoiceId,
        paymentPlanInstallmentId: req.params.installmentId,
        amount: amount,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: paymentMethod || 'cash',
        referenceNumber,
        notes,
        createdById: (req.user as any).id,
      });

      // Check if all installments are paid
      const installments = await storage.getPaymentPlanInstallments(plan.id);
      const allPaid = installments.every(inst => inst.isPaid);
      if (allPaid) {
        await storage.updatePaymentPlan(plan.id, { status: 'completed' });
      }

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "paid",
        entityType: "installment",
        entityId: req.params.installmentId,
        details: `Paid installment of $${amount}`,
      });

      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to record installment payment" });
    }
  });

  // Invoice Adjustments (write-offs, discounts, corrections, fees)
  app.get("/api/invoices/:id/adjustments", requireRole("admin", "doctor", "staff"), async (req, res) => {
    try {
      const adjustments = await storage.getInvoiceAdjustments(req.params.id);
      res.json(adjustments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch adjustments" });
    }
  });

  app.post("/api/invoices/:id/adjustments", requireRole("admin", "doctor"), async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Cannot adjust paid or canceled invoices
      if (invoice.status === 'paid' || invoice.status === 'canceled') {
        return res.status(400).json({ message: "Cannot adjust paid or canceled invoices" });
      }

      const parsed = insertInvoiceAdjustmentSchema.safeParse({
        ...req.body,
        invoiceId: req.params.id,
        appliedDate: req.body.appliedDate || new Date().toISOString().split('T')[0],
        createdById: (req.user as any).id,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const adjustment = await storage.createInvoiceAdjustment(parsed.data);

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "adjusted",
        entityType: "invoice",
        entityId: req.params.id,
        details: `Applied ${adjustment.type} of $${adjustment.amount}: ${adjustment.reason}`,
      });

      res.status(201).json(adjustment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create adjustment" });
    }
  });

  // Write-off invoice balance (shorthand for creating write-off adjustment)
  app.post("/api/invoices/:id/write-off", requireRole("admin"), async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      if (invoice.status === 'paid' || invoice.status === 'canceled') {
        return res.status(400).json({ message: "Cannot write off paid or canceled invoices" });
      }

      const balance = Number(invoice.finalAmount) - Number(invoice.paidAmount || 0);
      if (balance <= 0) {
        return res.status(400).json({ message: "No balance to write off" });
      }

      const { reason } = req.body;
      if (!reason) {
        return res.status(400).json({ message: "Write-off reason is required" });
      }

      const adjustment = await storage.createInvoiceAdjustment({
        invoiceId: req.params.id,
        type: 'write_off',
        amount: balance.toFixed(2),
        reason,
        appliedDate: new Date().toISOString().split('T')[0],
        createdById: (req.user as any).id,
      });

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "wrote_off",
        entityType: "invoice",
        entityId: req.params.id,
        details: `Wrote off $${balance.toFixed(2)}: ${reason}`,
      });

      res.json(adjustment);
    } catch (error) {
      res.status(500).json({ message: "Failed to write off invoice" });
    }
  });

  // Expenses - restricted to admin only
  app.get("/api/expenses", requireRole("admin"), async (req, res) => {
    try {
      const { category, startDate, endDate } = req.query;
      const expensesList = await storage.getExpenses({
        category: category as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });
      res.json(expensesList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.get("/api/expenses/:id", requireRole("admin"), async (req, res) => {
    try {
      const expense = await storage.getExpense(req.params.id);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expense" });
    }
  });

  app.post("/api/expenses", requireRole("admin"), async (req, res) => {
    try {
      const user = req.user as any;
      const parsed = insertExpenseSchema.safeParse({
        ...req.body,
        createdById: user.id,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const expense = await storage.createExpense(parsed.data);

      await storage.logActivity({
        userId: user.id,
        action: "created",
        entityType: "expense",
        entityId: expense.id,
        details: `Created expense: ${expense.description} ($${expense.amount})`,
      });

      // Immutable audit log for financial integrity
      await storage.createAuditLog({
        userId: user.id,
        userRole: user.role,
        actionType: "CREATE",
        entityType: "expense",
        entityId: expense.id,
        previousValue: null,
        newValue: expense,
        description: `Created expense: ${expense.description} ($${expense.amount})`,
        ipAddress: req.ip || null,
      });

      res.status(201).json(expense);
    } catch (error) {
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.patch("/api/expenses/:id", requireRole("admin"), async (req, res) => {
    try {
      const user = req.user as any;
      
      // Get previous state for audit log
      const previousExpense = await storage.getExpense(req.params.id);
      if (!previousExpense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      const expense = await storage.updateExpense(req.params.id, req.body);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      await storage.logActivity({
        userId: user.id,
        action: "updated",
        entityType: "expense",
        entityId: expense.id,
        details: `Updated expense: ${expense.description}`,
      });

      // Immutable audit log for financial integrity
      await storage.createAuditLog({
        userId: user.id,
        userRole: user.role,
        actionType: "UPDATE",
        entityType: "expense",
        entityId: expense.id,
        previousValue: previousExpense,
        newValue: expense,
        description: `Updated expense: ${expense.description}`,
        ipAddress: req.ip || null,
      });

      res.json(expense);
    } catch (error) {
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", requireRole("admin"), async (req, res) => {
    try {
      const user = req.user as any;
      
      // Get previous state for audit log
      const previousExpense = await storage.getExpense(req.params.id);
      if (!previousExpense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      const success = await storage.deleteExpense(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Expense not found" });
      }

      await storage.logActivity({
        userId: user.id,
        action: "deleted",
        entityType: "expense",
        entityId: req.params.id,
        details: "Deleted expense record",
      });

      // Immutable audit log for financial integrity
      await storage.createAuditLog({
        userId: user.id,
        userRole: user.role,
        actionType: "DELETE",
        entityType: "expense",
        entityId: req.params.id,
        previousValue: previousExpense,
        newValue: null,
        description: `Deleted expense: ${previousExpense.description} ($${previousExpense.amount})`,
        ipAddress: req.ip || null,
      });

      res.json({ message: "Expense deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Financial Reports - restricted to admin only
  app.get("/api/reports/revenue", requireRole("admin"), async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start and end dates are required" });
      }
      const report = await storage.getRevenueReport(startDate as string, endDate as string);
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate revenue report" });
    }
  });

  app.get("/api/reports/ar-aging", requireRole("admin"), async (req, res) => {
    try {
      const report = await storage.getARAgingReport();
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate AR aging report" });
    }
  });

  app.get("/api/reports/production-by-doctor", requireRole("admin"), async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start and end dates are required" });
      }
      const report = await storage.getProductionByDoctorReport(startDate as string, endDate as string);
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate production report" });
    }
  });

  app.get("/api/reports/expenses", requireRole("admin"), async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start and end dates are required" });
      }
      const report = await storage.getExpenseReport(startDate as string, endDate as string);
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate expense report" });
    }
  });

  // Insurance Claims - restricted to admin and staff
  app.get("/api/insurance-claims", requireRole("admin", "doctor", "staff"), async (req, res) => {
    try {
      const { status, patientId } = req.query;
      const claims = await storage.getInsuranceClaims({
        status: status as string,
        patientId: patientId as string,
      });
      res.json(claims);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch insurance claims" });
    }
  });

  app.get("/api/insurance-claims/:id", requireRole("admin", "doctor", "staff"), async (req, res) => {
    try {
      const claim = await storage.getInsuranceClaim(req.params.id);
      if (!claim) {
        return res.status(404).json({ message: "Insurance claim not found" });
      }
      res.json(claim);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch insurance claim" });
    }
  });

  app.post("/api/insurance-claims", requireRole("admin", "doctor", "staff"), async (req, res) => {
    try {
      const claimNumber = await storage.generateClaimNumber();
      const parsed = insertInsuranceClaimSchema.safeParse({
        ...req.body,
        claimNumber,
        createdById: (req.user as any).id,
      });
      if (!parsed.success) {
        console.error("Insurance claim validation error:", parsed.error.message);
        return res.status(400).json({ message: parsed.error.message });
      }

      const claim = await storage.createInsuranceClaim(parsed.data);

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "created",
        entityType: "insurance_claim",
        entityId: claim.id,
        details: `Created insurance claim ${claim.claimNumber} for $${claim.claimAmount}`,
      });

      res.status(201).json(claim);
    } catch (error) {
      console.error("Error creating insurance claim:", error);
      res.status(500).json({ message: "Failed to create insurance claim" });
    }
  });

  app.patch("/api/insurance-claims/:id", requireRole("admin", "doctor", "staff"), async (req, res) => {
    try {
      const claim = await storage.updateInsuranceClaim(req.params.id, req.body);
      if (!claim) {
        return res.status(404).json({ message: "Insurance claim not found" });
      }

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "updated",
        entityType: "insurance_claim",
        entityId: claim.id,
        details: `Updated insurance claim ${claim.claimNumber} - status: ${claim.status}`,
      });

      res.json(claim);
    } catch (error) {
      res.status(500).json({ message: "Failed to update insurance claim" });
    }
  });

  app.delete("/api/insurance-claims/:id", requireRole("admin"), async (req, res) => {
    try {
      const success = await storage.deleteInsuranceClaim(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Insurance claim not found" });
      }

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "deleted",
        entityType: "insurance_claim",
        entityId: req.params.id,
        details: "Deleted insurance claim record",
      });

      res.json({ message: "Insurance claim deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete insurance claim" });
    }
  });

  // Inventory - restricted to admin, doctor, staff (not students)
  app.get("/api/inventory", requireRole("admin", "doctor", "staff"), async (req, res) => {
    try {
      const { category, status } = req.query;
      const items = await storage.getInventoryItems({
        category: category as string,
        status: status as string,
      });
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.post("/api/inventory", requireRole("admin", "doctor", "staff"), async (req, res) => {
    try {
      const parsed = insertInventoryItemSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const item = await storage.createInventoryItem(parsed.data);
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  app.patch("/api/inventory/:id", requireRole("admin", "doctor", "staff"), async (req, res) => {
    try {
      const updateSchema = insertInventoryItemSchema.pick({
        name: true,
        category: true,
        currentQuantity: true,
        minimumQuantity: true,
        unit: true,
        unitCost: true,
        supplier: true,
        location: true,
        description: true,
        lastRestocked: true,
      }).partial().strict();
      
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const item = await storage.updateInventoryItem(req.params.id, parsed.data);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  // Lab Cases - restricted to admin and doctor (not students or staff)
  app.get("/api/lab-cases", requireRole("admin", "doctor"), async (req, res) => {
    try {
      const { status, patientId } = req.query;
      const cases = await storage.getLabCases({
        status: status as string,
        patientId: patientId as string,
      });

      // Enrich with patient data
      const patientsList = await storage.getPatients({});
      const patientMap = new Map(patientsList.map(p => [p.id, p]));

      const enriched = cases.map(c => ({
        ...c,
        patient: patientMap.get(c.patientId),
      }));

      res.json(enriched);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lab cases" });
    }
  });

  app.post("/api/lab-cases", requireRole("admin", "doctor"), async (req, res) => {
    try {
      const parsed = insertLabCaseSchema.safeParse({
        ...req.body,
        doctorId: (req.user as any).role === 'doctor' ? (req.user as any).id : req.body.doctorId,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const labCase = await storage.createLabCase(parsed.data);

      const patient = await storage.getPatient(parsed.data.patientId);

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "created",
        entityType: "lab_case",
        entityId: labCase.id,
        details: `Created lab case for ${patient?.firstName} ${patient?.lastName}`,
      });

      res.status(201).json(labCase);
    } catch (error) {
      res.status(500).json({ message: "Failed to create lab case" });
    }
  });

  app.patch("/api/lab-cases/:id", requireRole("admin", "doctor"), async (req, res) => {
    try {
      const updateSchema = insertLabCaseSchema.pick({
        labName: true,
        caseType: true,
        status: true,
        sentDate: true,
        expectedReturnDate: true,
        actualReturnDate: true,
        cost: true,
        notes: true,
        toothNumbers: true,
      }).partial().strict();
      
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const labCase = await storage.updateLabCase(req.params.id, parsed.data);
      if (!labCase) {
        return res.status(404).json({ message: "Lab case not found" });
      }
      res.json(labCase);
    } catch (error) {
      res.status(500).json({ message: "Failed to update lab case" });
    }
  });

  // Doctors management - admin only for modifications
  app.get("/api/doctors", requireAuth, async (req, res) => {
    try {
      const doctors = await storage.getUsers({ role: "doctor" });
      res.json(doctors.map(d => ({ ...d, password: undefined })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch doctors" });
    }
  });

  app.post("/api/doctors", requireRole("admin"), async (req, res) => {
    try {
      const parsed = insertUserSchema.safeParse({
        ...req.body,
        role: "doctor",
      });
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const existingUser = await storage.getUserByUsername(parsed.data.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const bcrypt = await import("bcrypt");
      const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

      const doctor = await storage.createUser({
        ...parsed.data,
        password: hashedPassword,
      });

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "created",
        entityType: "doctor",
        entityId: doctor.id,
        details: `Added doctor ${doctor.firstName} ${doctor.lastName}`,
      });

      res.status(201).json({ ...doctor, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to create doctor" });
    }
  });

  app.patch("/api/doctors/:id", requireRole("admin"), async (req, res) => {
    try {
      const updateSchema = insertUserSchema.pick({
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        specialty: true,
        licenseNumber: true,
        bio: true,
        isActive: true,
      }).partial().strict();
      
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const doctor = await storage.updateUser(req.params.id, parsed.data);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      res.json({ ...doctor, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to update doctor" });
    }
  });

  app.delete("/api/doctors/:id", requireRole("admin"), async (req, res) => {
    try {
      // Check for assigned patients
      const assignedPatients = await storage.getPatients({ assignedDoctorId: req.params.id });
      if (assignedPatients.length > 0) {
        return res.status(409).json({
          message: `Cannot delete doctor. There are ${assignedPatients.length} patient(s) assigned to this doctor. Please reassign them first.`
        });
      }

      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "deleted",
        entityType: "doctor",
        entityId: req.params.id,
        details: `Deleted doctor`,
      });

      res.json({ message: "Doctor deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete doctor" });
    }
  });

  // Patient financial summary
  app.get("/api/patients/:id/financials", requireAuth, async (req, res) => {
    try {
      const patientId = req.params.id;
      
      // Get all treatments for this patient
      const treatments = await storage.getPatientTreatments(patientId);
      const treatmentsList = await storage.getTreatments();
      const treatmentMap = new Map(treatmentsList.map(t => [t.id, t]));
      
      // Get all invoices for this patient
      const invoicesList = await storage.getPatientInvoices(patientId);
      
      // Get all payments for patient's invoices
      const allPayments = await storage.getPayments({});
      const invoiceIds = new Set(invoicesList.map(inv => inv.id));
      const patientPayments = allPayments.filter(p => invoiceIds.has(p.invoiceId));
      
      // Calculate totals
      const totalTreatmentCost = treatments.reduce((sum, t) => sum + parseFloat(t.price || "0"), 0);
      const completedTreatments = treatments.filter(t => t.status === "completed");
      const completedCost = completedTreatments.reduce((sum, t) => sum + parseFloat(t.price || "0"), 0);
      const pendingTreatments = treatments.filter(t => t.status === "planned" || t.status === "in_progress");
      const pendingCost = pendingTreatments.reduce((sum, t) => sum + parseFloat(t.price || "0"), 0);
      
      const totalInvoiced = invoicesList.reduce((sum, inv) => sum + parseFloat(inv.finalAmount || "0"), 0);
      const totalPaid = patientPayments.reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
      const outstandingBalance = totalInvoiced - totalPaid;
      
      // Group treatments by category
      const treatmentsByCategory: Record<string, { count: number; total: number }> = {};
      treatments.forEach(t => {
        const treatment = treatmentMap.get(t.treatmentId);
        const category = treatment?.category || "other";
        if (!treatmentsByCategory[category]) {
          treatmentsByCategory[category] = { count: 0, total: 0 };
        }
        treatmentsByCategory[category].count++;
        treatmentsByCategory[category].total += parseFloat(t.price || "0");
      });

      res.json({
        summary: {
          totalTreatmentCost,
          completedCost,
          pendingCost,
          totalInvoiced,
          totalPaid,
          outstandingBalance,
          treatmentCount: treatments.length,
          completedCount: completedTreatments.length,
          pendingCount: pendingTreatments.length,
          invoiceCount: invoicesList.length,
          paymentCount: patientPayments.length,
        },
        treatmentsByCategory,
        treatments: treatments.map(t => ({
          ...t,
          treatment: treatmentMap.get(t.treatmentId),
        })),
        invoices: invoicesList,
        payments: patientPayments,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient financials" });
    }
  });

  // Backup - Export all data as JSON (admin only)
  app.post("/api/backup", requireRole("admin"), async (req, res) => {
    try {
      const patientsList = await storage.getPatients({});
      const appointmentsList = await storage.getAppointments({});
      const treatmentsList = await storage.getTreatments();
      const invoicesList = await storage.getInvoices({});
      const paymentsList = await storage.getPayments({});
      const inventoryList = await storage.getInventoryItems({});
      const labCasesList = await storage.getLabCases({});

      const backupData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        data: {
          patients: patientsList,
          appointments: appointmentsList,
          treatments: treatmentsList,
          invoices: invoicesList,
          payments: paymentsList,
          inventory: inventoryList,
          labCases: labCasesList,
        },
      };

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "exported",
        entityType: "backup",
        entityId: null,
        details: `Exported backup with ${patientsList.length} patients, ${appointmentsList.length} appointments, ${treatmentsList.length} services`,
      });

      res.json(backupData);
    } catch (error) {
      res.status(500).json({ message: "Failed to create backup" });
    }
  });

  // Restore - Import data from JSON backup (admin only)
  app.post("/api/restore", requireRole("admin"), async (req, res) => {
    try {
      const { data } = req.body;

      if (!data) {
        return res.status(400).json({ message: "No backup data provided" });
      }

      let counts = {
        patients: 0,
        appointments: 0,
        treatments: 0,
        invoices: 0,
        payments: 0,
        inventory: 0,
        labCases: 0,
      };

      // Import treatments/services first (they don't depend on other entities)
      if (data.treatments && Array.isArray(data.treatments)) {
        for (const treatment of data.treatments) {
          try {
            const { id, createdAt, ...treatmentData } = treatment;
            await storage.createTreatment(treatmentData);
            counts.treatments++;
          } catch (e) {
            // Skip duplicates or invalid entries
          }
        }
      }

      // Import patients
      if (data.patients && Array.isArray(data.patients)) {
        for (const patient of data.patients) {
          try {
            const { id, createdAt, ...patientData } = patient;
            await storage.createPatient(patientData);
            counts.patients++;
          } catch (e) {
            // Skip duplicates or invalid entries
          }
        }
      }

      // Import inventory items
      if (data.inventory && Array.isArray(data.inventory)) {
        for (const item of data.inventory) {
          try {
            const { id, createdAt, ...itemData } = item;
            await storage.createInventoryItem(itemData);
            counts.inventory++;
          } catch (e) {
            // Skip duplicates or invalid entries
          }
        }
      }

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "restored",
        entityType: "backup",
        entityId: null,
        details: `Restored backup: ${counts.patients} patients, ${counts.treatments} services, ${counts.inventory} inventory items`,
      });

      res.json({
        message: "Backup restored successfully",
        counts,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to restore backup" });
    }
  });

  return httpServer;
}
