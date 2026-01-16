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

  // Activity log
  app.get("/api/activity", requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const activity = await storage.getRecentActivity(limit);
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity" });
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

  app.post("/api/patients/:id/treatments", requireAuth, async (req, res) => {
    try {
      const parsed = insertPatientTreatmentSchema.safeParse({
        ...req.body,
        patientId: req.params.id,
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

      const parsed = insertInvoiceSchema.safeParse({
        ...req.body,
        invoiceNumber,
        createdById: (req.user as any).id,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const invoice = await storage.createInvoice(parsed.data);
      res.status(201).json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to create invoice" });
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
      const parsed = insertPaymentSchema.safeParse({
        ...req.body,
        createdById: (req.user as any).id,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const payment = await storage.createPayment(parsed.data);

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "created",
        entityType: "payment",
        entityId: payment.id,
        details: `Recorded payment of $${payment.amount}`,
      });

      res.status(201).json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to record payment" });
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
        quantity: true,
        unit: true,
        minQuantity: true,
        maxQuantity: true,
        unitCost: true,
        supplier: true,
        expiryDate: true,
        location: true,
        notes: true,
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

  return httpServer;
}
