import { db } from "./db";
import { 
  users, patients, treatments, appointments, patientTreatments,
  invoices, invoiceItems, payments, paymentPlans, paymentPlanInstallments,
  invoiceAdjustments, expenses, insuranceClaims, inventoryItems,
  externalLabs, labServices, labCases, clinicSettings, clinicRooms,
  activityLog
} from "@shared/schema";
import bcrypt from "bcrypt";
import { sql } from "drizzle-orm";

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

const FIRST_NAMES = [
  "Ahmed", "Fatima", "Mohammed", "Sarah", "Omar", "Layla", "Youssef", "Nour",
  "Ali", "Hana", "Khalid", "Amina", "Hassan", "Maryam", "Ibrahim", "Zeynab",
  "Mustafa", "Reem", "Tariq", "Dina", "Rashid", "Salma", "Jamal", "Lina",
  "Sami", "Aya", "Nasser", "Mariam", "Faisal", "Jana", "Walid", "Rania",
  "Adel", "Noura", "Karim", "Huda", "Bassam", "Yasmin", "Majid", "Samira"
];

const LAST_NAMES = [
  "Al-Hassan", "Abdullah", "Al-Rashid", "Mohamed", "Al-Fahad", "Al-Sayed",
  "Al-Qasim", "Al-Mansour", "Al-Bakri", "Al-Zahrani", "Al-Otaibi", "Al-Harbi",
  "Al-Ghamdi", "Al-Shehri", "Al-Malki", "Al-Dossari", "Al-Amri", "Al-Qahtani",
  "Al-Sulaiman", "Al-Tamimi", "Al-Jasim", "Al-Khaldi", "Al-Mutairi", "Al-Shamri"
];

const ALLERGIES = ["Penicillin", "Latex", "Lidocaine", "Aspirin", "Sulfa", "Codeine", "NSAIDs"];
const CONDITIONS = ["Diabetes", "Hypertension", "Heart Disease", "Asthma", "Epilepsy", "Thyroid Disorder"];
const MEDICATIONS = ["Metformin", "Lisinopril", "Aspirin", "Omeprazole", "Amlodipine", "Atorvastatin"];
const INSURANCE_PROVIDERS = ["Blue Shield", "Aetna", "Cigna", "United Healthcare", "MetLife", "Delta Dental"];

function randomItem<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomItems<T>(arr: readonly T[] | T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function generatePhone(): string {
  return `+1${Math.floor(Math.random() * 900 + 100)}${Math.floor(Math.random() * 900 + 100)}${Math.floor(Math.random() * 9000 + 1000)}`;
}

function generateFileNumber(index: number): string {
  return `P${String(index + 1).padStart(5, '0')}`;
}

export async function seedDatabase() {
  console.log("Starting database seed...");
  
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
  
  try {
    console.log("Seeding clinic settings...");
    await db.insert(clinicSettings).values({
      clinicName: "DentalCare Premium Clinic",
      phone: "+1-555-DENTAL",
      email: "info@dentalcare.com",
      website: "https://dentalcare.com",
      address: "123 Medical Center Drive, Suite 100, Healthcare City, HC 12345",
      facebook: "https://facebook.com/dentalcare",
      instagram: "https://instagram.com/dentalcare",
    }).onConflictDoNothing();

    console.log("Seeding clinic rooms...");
    for (let i = 1; i <= 6; i++) {
      await db.insert(clinicRooms).values({
        roomNumber: i,
        name: `Treatment Room ${i}`,
        isActive: true,
      }).onConflictDoNothing();
    }

    console.log("Seeding users...");
    const hashedPassword = await hashPassword("password123");
    
    const adminUser = await db.insert(users).values({
      username: "admin",
      password: hashedPassword,
      email: "admin@dentalcare.com",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      phone: "+1-555-0001",
      isActive: true,
    }).onConflictDoNothing().returning();

    const doctorData = [
      { username: "dr.ahmed", firstName: "Ahmed", lastName: "Al-Hassan", specialty: "general_dentistry" as const },
      { username: "dr.fatima", firstName: "Fatima", lastName: "Abdullah", specialty: "orthodontics" as const },
      { username: "dr.omar", firstName: "Omar", lastName: "Al-Rashid", specialty: "endodontics" as const },
      { username: "dr.sarah", firstName: "Sarah", lastName: "Mohamed", specialty: "periodontics" as const },
      { username: "dr.khalid", firstName: "Khalid", lastName: "Al-Fahad", specialty: "prosthodontics" as const },
    ];

    const doctorIds: string[] = [];
    for (const doc of doctorData) {
      const result = await db.insert(users).values({
        username: doc.username,
        password: hashedPassword,
        email: `${doc.username}@dentalcare.com`,
        firstName: doc.firstName,
        lastName: doc.lastName,
        role: "doctor",
        specialty: doc.specialty,
        licenseNumber: `DDS-${Math.floor(Math.random() * 90000 + 10000)}`,
        phone: generatePhone(),
        isActive: true,
      }).onConflictDoNothing().returning();
      if (result[0]) doctorIds.push(result[0].id);
    }

    const staffData = [
      { username: "receptionist1", firstName: "Nour", lastName: "Al-Sayed" },
      { username: "receptionist2", firstName: "Hana", lastName: "Al-Qasim" },
      { username: "assistant1", firstName: "Amina", lastName: "Al-Mansour" },
    ];

    const staffIds: string[] = [];
    for (const staff of staffData) {
      const result = await db.insert(users).values({
        username: staff.username,
        password: hashedPassword,
        email: `${staff.username}@dentalcare.com`,
        firstName: staff.firstName,
        lastName: staff.lastName,
        role: "staff",
        phone: generatePhone(),
        isActive: true,
      }).onConflictDoNothing().returning();
      if (result[0]) staffIds.push(result[0].id);
    }

    const studentData = [
      { username: "student1", firstName: "Youssef", lastName: "Al-Bakri" },
      { username: "student2", firstName: "Layla", lastName: "Al-Zahrani" },
    ];

    const studentIds: string[] = [];
    for (const student of studentData) {
      const result = await db.insert(users).values({
        username: student.username,
        password: hashedPassword,
        email: `${student.username}@dentalcare.com`,
        firstName: student.firstName,
        lastName: student.lastName,
        role: "student",
        phone: generatePhone(),
        isActive: true,
      }).onConflictDoNothing().returning();
      if (result[0]) studentIds.push(result[0].id);
    }

    console.log("Seeding treatments catalog...");
    const treatmentData = [
      { code: "D0120", name: "Periodic Oral Evaluation", category: "diagnostics" as const, cost: "15", defaultPrice: "50", duration: 15 },
      { code: "D0150", name: "Comprehensive Oral Evaluation", category: "diagnostics" as const, cost: "25", defaultPrice: "85", duration: 30 },
      { code: "D0210", name: "Full Mouth X-rays", category: "diagnostics" as const, cost: "30", defaultPrice: "120", duration: 20 },
      { code: "D0274", name: "Bitewing X-rays (4 films)", category: "diagnostics" as const, cost: "15", defaultPrice: "55", duration: 10 },
      { code: "D1110", name: "Adult Prophylaxis (Cleaning)", category: "preventative" as const, cost: "25", defaultPrice: "95", duration: 45 },
      { code: "D1120", name: "Child Prophylaxis", category: "preventative" as const, cost: "20", defaultPrice: "65", duration: 30 },
      { code: "D1351", name: "Dental Sealant", category: "preventative" as const, cost: "12", defaultPrice: "45", duration: 15 },
      { code: "D1206", name: "Fluoride Treatment", category: "preventative" as const, cost: "10", defaultPrice: "35", duration: 10 },
      { code: "D2140", name: "Amalgam Filling - One Surface", category: "restorative" as const, cost: "35", defaultPrice: "150", duration: 30 },
      { code: "D2150", name: "Amalgam Filling - Two Surfaces", category: "restorative" as const, cost: "45", defaultPrice: "185", duration: 40 },
      { code: "D2330", name: "Composite Filling - One Surface", category: "restorative" as const, cost: "50", defaultPrice: "195", duration: 35 },
      { code: "D2331", name: "Composite Filling - Two Surfaces", category: "restorative" as const, cost: "65", defaultPrice: "250", duration: 45 },
      { code: "D2391", name: "Composite Filling - Posterior", category: "restorative" as const, cost: "75", defaultPrice: "275", duration: 50 },
      { code: "D2740", name: "Porcelain Crown", category: "fixed_prosthodontics" as const, cost: "250", defaultPrice: "1200", duration: 90 },
      { code: "D2750", name: "Crown - Porcelain Fused to Metal", category: "fixed_prosthodontics" as const, cost: "200", defaultPrice: "950", duration: 90 },
      { code: "D2950", name: "Core Buildup", category: "fixed_prosthodontics" as const, cost: "80", defaultPrice: "350", duration: 30 },
      { code: "D3310", name: "Root Canal - Anterior", category: "endodontics" as const, cost: "150", defaultPrice: "750", duration: 60 },
      { code: "D3320", name: "Root Canal - Premolar", category: "endodontics" as const, cost: "200", defaultPrice: "900", duration: 75 },
      { code: "D3330", name: "Root Canal - Molar", category: "endodontics" as const, cost: "280", defaultPrice: "1200", duration: 90 },
      { code: "D4341", name: "Scaling and Root Planing (per quadrant)", category: "periodontics" as const, cost: "75", defaultPrice: "275", duration: 45 },
      { code: "D4910", name: "Periodontal Maintenance", category: "periodontics" as const, cost: "45", defaultPrice: "150", duration: 45 },
      { code: "D5110", name: "Complete Upper Denture", category: "removable_prosthodontics" as const, cost: "400", defaultPrice: "1800", duration: 60 },
      { code: "D5120", name: "Complete Lower Denture", category: "removable_prosthodontics" as const, cost: "400", defaultPrice: "1800", duration: 60 },
      { code: "D5213", name: "Partial Denture - Upper", category: "removable_prosthodontics" as const, cost: "350", defaultPrice: "1500", duration: 60 },
      { code: "D7140", name: "Simple Extraction", category: "surgery" as const, cost: "50", defaultPrice: "175", duration: 30 },
      { code: "D7210", name: "Surgical Extraction", category: "surgery" as const, cost: "100", defaultPrice: "350", duration: 45 },
      { code: "D7240", name: "Impacted Tooth Removal", category: "surgery" as const, cost: "200", defaultPrice: "550", duration: 60 },
      { code: "D8080", name: "Comprehensive Orthodontic Treatment", category: "orthodontics" as const, cost: "1500", defaultPrice: "5500", duration: 60 },
      { code: "D8090", name: "Orthodontic Retainer", category: "orthodontics" as const, cost: "100", defaultPrice: "350", duration: 30 },
      { code: "D9110", name: "Emergency Treatment", category: "diagnostics" as const, cost: "40", defaultPrice: "125", duration: 30 },
      { code: "D9230", name: "Nitrous Oxide Sedation", category: "diagnostics" as const, cost: "30", defaultPrice: "85", duration: 15 },
      { code: "D9310", name: "Consultation", category: "diagnostics" as const, cost: "20", defaultPrice: "75", duration: 30 },
      { code: "D2960", name: "Dental Implant", category: "fixed_prosthodontics" as const, cost: "800", defaultPrice: "3500", duration: 120 },
      { code: "D9940", name: "Occlusal Guard", category: "preventative" as const, cost: "150", defaultPrice: "450", duration: 30 },
      { code: "D9972", name: "Teeth Whitening", category: "cosmetic" as const, cost: "100", defaultPrice: "400", duration: 60 },
    ];

    const treatmentIds: string[] = [];
    for (const t of treatmentData) {
      const result = await db.insert(treatments).values({
        code: t.code,
        name: t.name,
        category: t.category,
        description: `Professional ${t.name.toLowerCase()} procedure`,
        cost: t.cost,
        defaultPrice: t.defaultPrice,
        durationMinutes: t.duration,
        isActive: true,
      }).onConflictDoNothing().returning();
      if (result[0]) treatmentIds.push(result[0].id);
    }

    console.log("Seeding patients...");
    const patientIds: string[] = [];
    for (let i = 0; i < 100; i++) {
      const firstName = randomItem(FIRST_NAMES);
      const lastName = randomItem(LAST_NAMES);
      const birthYear = 1950 + Math.floor(Math.random() * 60);
      const birthMonth = Math.floor(Math.random() * 12);
      const birthDay = Math.floor(Math.random() * 28) + 1;
      const hasAllergies = Math.random() > 0.7;
      const hasConditions = Math.random() > 0.6;
      const hasMeds = Math.random() > 0.5;
      const hasInsurance = Math.random() > 0.3;

      const result = await db.insert(patients).values({
        fileNumber: generateFileNumber(i),
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace("al-", "")}${i}@email.com`,
        phone: generatePhone(),
        dateOfBirth: formatDate(new Date(birthYear, birthMonth, birthDay)),
        gender: Math.random() > 0.5 ? "male" : "female",
        address: `${Math.floor(Math.random() * 9999) + 1} ${randomItem(["Oak", "Maple", "Cedar", "Palm", "Pine"])} Street, City ${Math.floor(Math.random() * 100)}`,
        emergencyContact: `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`,
        emergencyPhone: generatePhone(),
        allergies: hasAllergies ? randomItems(ALLERGIES, Math.floor(Math.random() * 3) + 1) : null,
        chronicConditions: hasConditions ? randomItems(CONDITIONS, Math.floor(Math.random() * 2) + 1) : null,
        currentMedications: hasMeds ? randomItems(MEDICATIONS, Math.floor(Math.random() * 3) + 1) : null,
        insuranceProvider: hasInsurance ? randomItem(INSURANCE_PROVIDERS) : null,
        insurancePolicyNumber: hasInsurance ? `POL-${Math.floor(Math.random() * 900000 + 100000)}` : null,
        assignedDoctorId: doctorIds.length > 0 ? randomItem(doctorIds) : null,
        lastVisit: Math.random() > 0.3 ? formatDate(randomDate(sixMonthsAgo, now)) : null,
        notes: Math.random() > 0.7 ? "Regular patient with good oral hygiene habits." : null,
      }).returning();
      if (result[0]) patientIds.push(result[0].id);
    }

    console.log("Seeding external labs...");
    const labData = [
      { name: "Premier Dental Lab", phone: "+1-555-LAB1", email: "orders@premierlab.com", contact: "John Smith" },
      { name: "Precision Prosthetics", phone: "+1-555-LAB2", email: "info@precisionpros.com", contact: "Maria Garcia" },
      { name: "Crown Masters Lab", phone: "+1-555-LAB3", email: "orders@crownmasters.com", contact: "David Chen" },
    ];

    const labIds: string[] = [];
    for (const lab of labData) {
      const result = await db.insert(externalLabs).values({
        name: lab.name,
        phone: lab.phone,
        email: lab.email,
        contactPerson: lab.contact,
        address: `${Math.floor(Math.random() * 999) + 1} Industrial Blvd, Lab City`,
        isActive: true,
      }).returning();
      if (result[0]) labIds.push(result[0].id);
    }

    console.log("Seeding lab services...");
    const labServiceData = [
      { name: "PFM Crown", price: "180" },
      { name: "Zirconia Crown", price: "280" },
      { name: "Full Denture", price: "350" },
      { name: "Partial Denture", price: "300" },
      { name: "Night Guard", price: "120" },
      { name: "Implant Abutment", price: "250" },
      { name: "Veneer", price: "200" },
      { name: "Orthodontic Retainer", price: "80" },
    ];

    const labServiceIds: string[] = [];
    for (const labId of labIds) {
      for (const service of labServiceData) {
        const result = await db.insert(labServices).values({
          labId,
          name: service.name,
          description: `High-quality ${service.name.toLowerCase()} fabrication`,
          price: service.price,
          isActive: true,
        }).returning();
        if (result[0]) labServiceIds.push(result[0].id);
      }
    }

    console.log("Seeding inventory items...");
    const inventoryData = [
      { name: "Dental Gloves (Box)", category: "consumables" as const, quantity: 50, min: 20, unit: "boxes", cost: "8.50" },
      { name: "Face Masks (Box)", category: "consumables" as const, quantity: 30, min: 15, unit: "boxes", cost: "12.00" },
      { name: "Composite Resin", category: "consumables" as const, quantity: 25, min: 10, unit: "syringes", cost: "45.00" },
      { name: "Anesthetic Carpules", category: "medications" as const, quantity: 100, min: 50, unit: "carpules", cost: "2.50" },
      { name: "Disposable Syringes", category: "consumables" as const, quantity: 200, min: 100, unit: "pieces", cost: "0.35" },
      { name: "Cotton Rolls", category: "consumables" as const, quantity: 500, min: 200, unit: "pieces", cost: "0.05" },
      { name: "Dental Mirrors", category: "instruments" as const, quantity: 20, min: 10, unit: "pieces", cost: "8.00" },
      { name: "Explorers", category: "instruments" as const, quantity: 15, min: 8, unit: "pieces", cost: "12.00" },
      { name: "Scalers Set", category: "instruments" as const, quantity: 10, min: 5, unit: "sets", cost: "85.00" },
      { name: "Handpiece Burs", category: "instruments" as const, quantity: 100, min: 50, unit: "pieces", cost: "3.50" },
      { name: "Impression Material", category: "consumables" as const, quantity: 15, min: 8, unit: "cartridges", cost: "35.00" },
      { name: "Bonding Agent", category: "consumables" as const, quantity: 8, min: 4, unit: "bottles", cost: "65.00" },
      { name: "Etch Gel", category: "consumables" as const, quantity: 12, min: 6, unit: "syringes", cost: "15.00" },
      { name: "Temporary Cement", category: "consumables" as const, quantity: 6, min: 3, unit: "tubes", cost: "25.00" },
      { name: "Sterilization Pouches", category: "consumables" as const, quantity: 500, min: 200, unit: "pieces", cost: "0.12" },
      { name: "High-Speed Handpiece", category: "equipment" as const, quantity: 4, min: 2, unit: "pieces", cost: "450.00" },
      { name: "Slow-Speed Handpiece", category: "equipment" as const, quantity: 4, min: 2, unit: "pieces", cost: "280.00" },
      { name: "Light Cure Unit", category: "equipment" as const, quantity: 3, min: 2, unit: "pieces", cost: "350.00" },
      { name: "Apex Locator", category: "equipment" as const, quantity: 2, min: 1, unit: "pieces", cost: "800.00" },
      { name: "Printer Paper (Ream)", category: "office_supplies" as const, quantity: 10, min: 5, unit: "reams", cost: "8.00" },
    ];

    for (const item of inventoryData) {
      await db.insert(inventoryItems).values({
        name: item.name,
        category: item.category,
        currentQuantity: item.quantity,
        minimumQuantity: item.min,
        unit: item.unit,
        unitCost: item.cost,
        supplier: randomItem(["Dental Supplies Co", "MedEquip Direct", "ProDental Distributors", "HealthCare Supply"]),
        location: `Storage ${randomItem(["A", "B", "C"])}-${Math.floor(Math.random() * 20) + 1}`,
        lastRestocked: formatDate(randomDate(sixMonthsAgo, now)),
      });
    }

    console.log("Seeding appointments and financial data for past 12 months...");
    let invoiceCounter = 1000;
    let claimCounter = 1000;

    for (let monthOffset = 12; monthOffset >= 0; monthOffset--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 0);
      
      const appointmentsThisMonth = 80 + Math.floor(Math.random() * 40);
      
      for (let a = 0; a < appointmentsThisMonth; a++) {
        const appointmentDate = randomDate(monthStart, monthEnd);
        if (appointmentDate > now) continue;
        
        const patientId = randomItem(patientIds);
        const doctorId = doctorIds.length > 0 ? randomItem(doctorIds) : null;
        const hour = 8 + Math.floor(Math.random() * 9);
        const minute = randomItem([0, 15, 30, 45]);
        const startTime = new Date(appointmentDate);
        startTime.setHours(hour, minute, 0, 0);
        
        const duration = randomItem([30, 45, 60, 90]);
        const endTime = new Date(startTime.getTime() + duration * 60000);
        
        const categories = ["checkup", "cleaning", "follow_up", "new_visit", "surgery", "discussion"] as const;
        const category = randomItem(categories);
        
        const statuses: ("confirmed" | "pending" | "completed" | "canceled")[] = monthOffset === 0 
          ? ["confirmed", "pending", "completed", "canceled"]
          : ["completed", "canceled"];
        const status = randomItem(statuses);
        
        const appointmentResult = await db.insert(appointments).values({
          patientId,
          doctorId,
          title: category === "checkup" ? "Regular Checkup" : 
                 category === "cleaning" ? "Dental Cleaning" :
                 category === "surgery" ? "Surgical Procedure" :
                 category === "new_visit" ? "New Patient Exam" :
                 category === "follow_up" ? "Follow-up Visit" : "Consultation",
          startTime: startTime,
          endTime: endTime,
          status,
          category,
          roomNumber: Math.floor(Math.random() * 6) + 1,
          notes: Math.random() > 0.8 ? "Patient has requested morning appointments" : null,
        }).returning();

        if (status === "completed" && treatmentIds.length > 0 && Math.random() > 0.2) {
          const numTreatments = Math.floor(Math.random() * 3) + 1;
          const selectedTreatments = randomItems(treatmentIds, numTreatments);
          let totalAmount = 0;
          const treatmentRecords: Array<{ id: string; price: number }> = [];

          for (const treatmentId of selectedTreatments) {
            const treatment = treatmentData.find((_, i) => treatmentIds[i] === treatmentId);
            const price = treatment ? parseFloat(treatment.defaultPrice) : 100;
            const toothNum = Math.random() > 0.5 ? Math.floor(Math.random() * 32) + 1 : null;
            
            const ptResult = await db.insert(patientTreatments).values({
              patientId,
              treatmentId,
              appointmentId: appointmentResult[0]?.id,
              doctorId,
              status: "completed",
              toothNumber: toothNum,
              price: price.toString(),
              completionDate: formatDate(appointmentDate),
            }).returning();

            if (ptResult[0]) {
              treatmentRecords.push({ id: ptResult[0].id, price });
              totalAmount += price;
            }
          }

          if (treatmentRecords.length > 0 && Math.random() > 0.1) {
            invoiceCounter++;
            const hasDiscount = Math.random() > 0.7;
            const discountValue = hasDiscount ? Math.floor(Math.random() * 15) + 5 : 0;
            const finalAmount = totalAmount * (1 - discountValue / 100);
            
            const invoiceStatuses = ["paid", "partial", "sent", "overdue"] as const;
            const invoiceStatus = monthOffset > 1 
              ? (Math.random() > 0.1 ? "paid" : randomItem(invoiceStatuses))
              : randomItem(invoiceStatuses);
            
            const paidAmount = invoiceStatus === "paid" ? finalAmount :
                              invoiceStatus === "partial" ? finalAmount * (0.3 + Math.random() * 0.5) :
                              0;

            const invoiceResult = await db.insert(invoices).values({
              invoiceNumber: `INV-${invoiceCounter}`,
              patientId,
              totalAmount: totalAmount.toString(),
              discountType: hasDiscount ? "percentage" : null,
              discountValue: hasDiscount ? discountValue.toString() : null,
              finalAmount: finalAmount.toString(),
              paidAmount: paidAmount.toString(),
              status: invoiceStatus,
              issuedDate: formatDate(appointmentDate),
              dueDate: formatDate(new Date(appointmentDate.getTime() + 30 * 24 * 60 * 60 * 1000)),
            }).returning();

            if (invoiceResult[0]) {
              for (const tr of treatmentRecords) {
                const treatment = treatmentData.find((_, i) => treatmentIds[i] === tr.id.slice(0, 36)) || { name: "Dental Service" };
                await db.insert(invoiceItems).values({
                  invoiceId: invoiceResult[0].id,
                  patientTreatmentId: tr.id,
                  description: typeof treatment === 'object' ? treatment.name : "Dental Service",
                  quantity: 1,
                  unitPrice: tr.price.toString(),
                  totalPrice: tr.price.toString(),
                });
              }

              if (paidAmount > 0) {
                await db.insert(payments).values({
                  invoiceId: invoiceResult[0].id,
                  amount: paidAmount.toString(),
                  paymentDate: formatDate(new Date(appointmentDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000)),
                  paymentMethod: randomItem(["cash", "card", "bank_transfer", "insurance"]),
                  referenceNumber: `REF-${Math.floor(Math.random() * 900000 + 100000)}`,
                });
              }

              if (Math.random() > 0.85) {
                claimCounter++;
                const claimStatuses = ["submitted", "pending", "approved", "paid", "denied"] as const;
                const claimStatus = randomItem(claimStatuses);
                const claimAmount = finalAmount * (0.5 + Math.random() * 0.4);

                await db.insert(insuranceClaims).values({
                  claimNumber: `CLM-${claimCounter}`,
                  patientId,
                  invoiceId: invoiceResult[0].id,
                  insuranceProvider: randomItem(INSURANCE_PROVIDERS),
                  policyNumber: `POL-${Math.floor(Math.random() * 900000 + 100000)}`,
                  subscriberName: `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`,
                  subscriberRelation: randomItem(["self", "spouse", "child", "parent"]),
                  status: claimStatus,
                  claimAmount: claimAmount.toString(),
                  approvedAmount: claimStatus === "approved" || claimStatus === "paid" ? (claimAmount * 0.8).toString() : null,
                  paidAmount: claimStatus === "paid" ? (claimAmount * 0.8).toString() : null,
                  submittedDate: formatDate(new Date(appointmentDate.getTime() + 3 * 24 * 60 * 60 * 1000)),
                  processedDate: claimStatus !== "submitted" ? formatDate(new Date(appointmentDate.getTime() + 21 * 24 * 60 * 60 * 1000)) : null,
                });
              }
            }
          }
        }
      }

      const expenseCategories = ["supplies", "equipment", "utilities", "rent", "salaries", "lab_fees", "marketing", "maintenance", "software"] as const;
      const numExpenses = 8 + Math.floor(Math.random() * 8);
      
      for (let e = 0; e < numExpenses; e++) {
        const category = randomItem(expenseCategories);
        const amount = category === "rent" ? 5000 + Math.random() * 2000 :
                      category === "salaries" ? 15000 + Math.random() * 10000 :
                      category === "utilities" ? 500 + Math.random() * 500 :
                      category === "equipment" ? 200 + Math.random() * 2000 :
                      50 + Math.random() * 500;

        await db.insert(expenses).values({
          description: `${category.charAt(0).toUpperCase() + category.slice(1).replace("_", " ")} - ${monthStart.toLocaleString('default', { month: 'long' })}`,
          category,
          amount: amount.toFixed(2),
          expenseDate: formatDate(randomDate(monthStart, monthEnd > now ? now : monthEnd)),
          vendor: randomItem(["Dental Supplies Co", "City Utilities", "Property Management", "Staff Payroll", "Marketing Agency", "Premier Lab"]),
          referenceNumber: `EXP-${Math.floor(Math.random() * 900000 + 100000)}`,
          isRecurring: category === "rent" || category === "salaries" || category === "utilities",
        });
      }
    }

    console.log("Seeding future appointments for next week...");
    for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + dayOffset);
      
      // Skip weekends
      if (futureDate.getDay() === 0 || futureDate.getDay() === 6) continue;
      
      // 10-18 appointments per day
      const appointmentsPerDay = 10 + Math.floor(Math.random() * 9);
      
      for (let i = 0; i < appointmentsPerDay; i++) {
        const patientId = randomItem(patientIds);
        const doctorId = doctorIds.length > 0 ? randomItem(doctorIds) : null;
        const hour = 8 + Math.floor(i / 2);
        const minute = (i % 2) * 30;
        
        const startTime = new Date(futureDate);
        startTime.setHours(hour, minute, 0, 0);
        
        const duration = randomItem([30, 45, 60]);
        const endTime = new Date(startTime.getTime() + duration * 60000);
        
        const categories = ["checkup", "cleaning", "follow_up", "new_visit"] as const;
        const category = randomItem(categories);
        const statuses: ("confirmed" | "pending")[] = ["confirmed", "pending"];
        
        await db.insert(appointments).values({
          patientId,
          doctorId,
          title: category === "checkup" ? "Regular Checkup" : 
                 category === "cleaning" ? "Dental Cleaning" :
                 category === "new_visit" ? "New Patient Exam" : "Follow-up Visit",
          startTime: startTime,
          endTime: endTime,
          status: randomItem(statuses),
          category,
          roomNumber: Math.floor(Math.random() * 6) + 1,
          notes: Math.random() > 0.8 ? "Scheduled appointment" : null,
        });
      }
    }

    console.log("Seeding lab cases...");
    for (let i = 0; i < 50; i++) {
      const sentDate = randomDate(sixMonthsAgo, now);
      const returnDate = new Date(sentDate.getTime() + (7 + Math.random() * 14) * 24 * 60 * 60 * 1000);
      const labStatuses: ("pending" | "in_progress" | "completed" | "delivered")[] = ["pending", "in_progress", "completed", "delivered"];
      const completedStatuses: ("completed" | "delivered")[] = ["completed", "delivered"];
      const labStatus = returnDate < now ? randomItem(completedStatuses) : randomItem(labStatuses);

      await db.insert(labCases).values({
        patientId: randomItem(patientIds),
        doctorId: doctorIds.length > 0 ? randomItem(doctorIds) : null,
        externalLabId: labIds.length > 0 ? randomItem(labIds) : null,
        caseType: randomItem(["Crown", "Bridge", "Denture", "Veneer", "Implant Abutment", "Night Guard"]),
        labName: randomItem(["Premier Dental Lab", "Precision Prosthetics", "Crown Masters Lab"]),
        toothNumbers: [Math.floor(Math.random() * 32) + 1],
        sentDate: formatDate(sentDate),
        expectedReturnDate: formatDate(returnDate),
        actualReturnDate: labStatus === "delivered" || labStatus === "completed" ? formatDate(new Date(returnDate.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000)) : null,
        status: labStatus,
        cost: (150 + Math.random() * 300).toFixed(2),
        isPaid: labStatus === "delivered" || Math.random() > 0.3,
        description: "Lab fabrication case",
      });
    }

    console.log("Seeding activity log...");
    const actions = [
      { action: "Created new patient record", entityType: "patient" },
      { action: "Updated patient information", entityType: "patient" },
      { action: "Scheduled appointment", entityType: "appointment" },
      { action: "Completed appointment", entityType: "appointment" },
      { action: "Created invoice", entityType: "invoice" },
      { action: "Recorded payment", entityType: "payment" },
      { action: "Updated inventory", entityType: "inventory" },
      { action: "Submitted lab case", entityType: "lab_case" },
    ];

    for (let i = 0; i < 200; i++) {
      const action = randomItem(actions);
      const allUserIds = [...(adminUser[0] ? [adminUser[0].id] : []), ...doctorIds, ...staffIds];
      
      await db.insert(activityLog).values({
        userId: allUserIds.length > 0 ? randomItem(allUserIds) : null,
        action: action.action,
        entityType: action.entityType,
        entityId: action.entityType === "patient" ? randomItem(patientIds) : null,
        details: `Automated activity log entry`,
        createdAt: randomDate(oneYearAgo, now),
      });
    }

    console.log("Database seeding completed successfully!");
    console.log(`Created: ~100 patients, ~1000+ appointments (past year + next week future appointments)`);
    console.log(`Financial data: invoices, payments, payment plans, expenses, insurance claims`);
    console.log(`Users: 1 admin, 5 doctors, 3 staff, 2 students`);
    console.log(`Password for all users: password123`);
    console.log(`All data is backupable via /api/backup endpoint`);

  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
