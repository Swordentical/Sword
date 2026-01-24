import { db } from "../server/db";
import { 
  patients, users, appointments, treatments, patientTreatments,
  invoices, invoiceItems, payments, expenses, inventoryItems, labCases
} from "../shared/schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcrypt";

const firstNames = ["Ahmed", "Mohammed", "Fatima", "Sara", "Omar", "Layla", "Yusuf", "Maryam", "Ali", "Noor", "Hassan", "Aisha", "Khalid", "Hana", "Ibrahim", "Salma", "Tariq", "Rania", "Zaid", "Dina"];
const lastNames = ["Al-Rashid", "Hassan", "Ahmed", "Salem", "Al-Farsi", "Mahmoud", "Khalil", "Nasser", "Al-Sayed", "Yousef", "Al-Bakri", "Osman", "Al-Zahrani", "Farouk", "Al-Ghamdi"];

const treatmentCatalog = [
  { code: "D0150", name: "Comprehensive Oral Evaluation", category: "diagnostics", price: 150 },
  { code: "D1110", name: "Prophylaxis - Adult", category: "preventative", price: 120 },
  { code: "D2391", name: "Resin-Based Composite - 1 Surface", category: "restorative", price: 250 },
  { code: "D2392", name: "Resin-Based Composite - 2 Surfaces", category: "restorative", price: 320 },
  { code: "D2750", name: "Crown - Porcelain Fused to Metal", category: "fixed_prosthodontics", price: 1200 },
  { code: "D3310", name: "Root Canal - Anterior", category: "endodontics", price: 900 },
  { code: "D3320", name: "Root Canal - Premolar", category: "endodontics", price: 1100 },
  { code: "D4341", name: "Periodontal Scaling - Per Quadrant", category: "periodontics", price: 300 },
  { code: "D5110", name: "Complete Denture - Upper", category: "removable_prosthodontics", price: 2500 },
  { code: "D7140", name: "Extraction - Erupted Tooth", category: "surgery", price: 200 },
  { code: "D8080", name: "Comprehensive Orthodontic Treatment", category: "orthodontics", price: 5000 },
  { code: "D9310", name: "Consultation", category: "diagnostics", price: 100 },
];

const expenseCategories: Array<"supplies" | "equipment" | "lab_fees" | "utilities" | "rent" | "salaries" | "marketing" | "insurance" | "maintenance" | "software" | "training" | "other"> = [
  "supplies", "equipment", "lab_fees", "utilities", "rent", "salaries", "marketing", "insurance", "maintenance", "software", "training"
];

const inventoryItemsList = [
  { name: "Disposable Gloves (Box)", category: "consumables", unit: "box", unitCost: 25 },
  { name: "Dental Mirrors", category: "instruments", unit: "piece", unitCost: 15 },
  { name: "Composite Resin Kit", category: "consumables", unit: "kit", unitCost: 180 },
  { name: "Anesthetic Cartridges", category: "medications", unit: "box", unitCost: 45 },
  { name: "Cotton Rolls", category: "consumables", unit: "pack", unitCost: 12 },
  { name: "Sterilization Pouches", category: "consumables", unit: "pack", unitCost: 35 },
  { name: "Dental Burs Set", category: "instruments", unit: "set", unitCost: 120 },
  { name: "X-Ray Film", category: "consumables", unit: "box", unitCost: 85 },
  { name: "Impression Material", category: "consumables", unit: "kit", unitCost: 95 },
  { name: "Fluoride Gel", category: "medications", unit: "bottle", unitCost: 28 },
];

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePhone(): string {
  return `+971${Math.floor(Math.random() * 900000000 + 100000000)}`;
}

async function seed() {
  console.log("Starting data generation...");
  
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const oneMonthAhead = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  // Create doctors
  const doctorData = [
    { username: "dr.ahmed", firstName: "Ahmed", lastName: "Al-Rashid", specialty: "general_dentistry" as const },
    { username: "dr.fatima", firstName: "Fatima", lastName: "Hassan", specialty: "orthodontics" as const },
    { username: "dr.omar", firstName: "Omar", lastName: "Salem", specialty: "endodontics" as const },
  ];

  const hashedPassword = await bcrypt.hash("doctor123", 10);
  
  console.log("Creating doctors...");
  const createdDoctors: string[] = [];
  for (const doc of doctorData) {
    const existing = await db.select().from(users).where(sql`username = ${doc.username}`);
    if (existing.length === 0) {
      const [newDoc] = await db.insert(users).values({
        username: doc.username,
        password: hashedPassword,
        firstName: doc.firstName,
        lastName: doc.lastName,
        role: "doctor",
        specialty: doc.specialty,
        isActive: true,
      }).returning();
      createdDoctors.push(newDoc.id);
    } else {
      createdDoctors.push(existing[0].id);
    }
  }

  // Create treatments catalog
  console.log("Creating treatments catalog...");
  const createdTreatments: string[] = [];
  for (const t of treatmentCatalog) {
    const existing = await db.select().from(treatments).where(sql`code = ${t.code}`);
    if (existing.length === 0) {
      const [newT] = await db.insert(treatments).values({
        code: t.code,
        name: t.name,
        category: t.category as any,
        defaultPrice: t.price.toString(),
        durationMinutes: 30 + Math.floor(Math.random() * 60),
        isActive: true,
      }).returning();
      createdTreatments.push(newT.id);
    } else {
      createdTreatments.push(existing[0].id);
    }
  }

  // Create 30 patients
  console.log("Creating patients...");
  const createdPatients: string[] = [];
  for (let i = 0; i < 30; i++) {
    const firstName = randomChoice(firstNames);
    const lastName = randomChoice(lastNames);
    const [patient] = await db.insert(patients).values({
      fileNumber: `P${String(1000 + i).padStart(4, "0")}`,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
      phone: generatePhone(),
      dateOfBirth: randomDate(new Date(1960, 0, 1), new Date(2005, 0, 1)).toISOString().split("T")[0],
      gender: randomChoice(["male", "female"] as const),
      address: `${Math.floor(Math.random() * 500) + 1} Main Street, Dubai`,
      assignedDoctorId: randomChoice(createdDoctors),
    }).returning();
    createdPatients.push(patient.id);
  }

  // Create inventory items
  console.log("Creating inventory items...");
  for (const item of inventoryItemsList) {
    const existing = await db.select().from(inventoryItems).where(sql`name = ${item.name}`);
    if (existing.length === 0) {
      await db.insert(inventoryItems).values({
        name: item.name,
        category: item.category as any,
        currentQuantity: Math.floor(Math.random() * 100) + 10,
        minimumQuantity: 5,
        unit: item.unit,
        unitCost: item.unitCost.toString(),
        supplier: randomChoice(["MedSupply Co", "DentalPro", "HealthCare Distributors", "Al-Noor Medical"]),
        lastRestocked: randomDate(oneYearAgo, now).toISOString().split("T")[0],
      });
    }
  }

  // Generate appointments, treatments, invoices, payments for past year
  console.log("Creating appointments, treatments, and invoices...");
  let invoiceCounter = 1000;
  
  for (let month = 0; month < 13; month++) {
    const monthStart = new Date(oneYearAgo.getFullYear(), oneYearAgo.getMonth() + month, 1);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    
    // 15-25 appointments per month
    const appointmentsThisMonth = 15 + Math.floor(Math.random() * 10);
    
    for (let a = 0; a < appointmentsThisMonth; a++) {
      const patientId = randomChoice(createdPatients);
      const doctorId = randomChoice(createdDoctors);
      const appointmentDate = randomDate(monthStart, monthEnd > now ? now : monthEnd);
      const isPast = appointmentDate < now;
      
      const startHour = 9 + Math.floor(Math.random() * 8);
      const startTime = new Date(appointmentDate);
      startTime.setHours(startHour, 0, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 30 + Math.floor(Math.random() * 30));
      
      const categories: Array<"new_visit" | "follow_up" | "checkup" | "cleaning" | "surgery"> = ["new_visit", "follow_up", "checkup", "cleaning", "surgery"];
      
      const [appointment] = await db.insert(appointments).values({
        patientId,
        doctorId,
        title: randomChoice(["Regular Checkup", "Follow-up Visit", "Treatment Session", "Consultation", "Emergency Visit"]),
        startTime,
        endTime,
        status: isPast ? randomChoice(["completed", "completed", "completed", "canceled"] as const) : randomChoice(["confirmed", "pending"] as const),
        category: randomChoice(categories),
        roomNumber: Math.floor(Math.random() * 5) + 1,
      }).returning();

      // For completed appointments, create treatments and invoices
      if (appointment.status === "completed") {
        const treatment = randomChoice(treatmentCatalog);
        const treatmentId = createdTreatments[treatmentCatalog.indexOf(treatment)];
        
        const [patientTreatment] = await db.insert(patientTreatments).values({
          patientId,
          treatmentId,
          appointmentId: appointment.id,
          doctorId,
          status: "completed",
          price: treatment.price.toString(),
          completionDate: appointmentDate.toISOString().split("T")[0],
        }).returning();

        // Create invoice
        const invoiceNum = `INV-${invoiceCounter++}`;
        const totalAmount = treatment.price;
        const hasDiscount = Math.random() > 0.7;
        const discountValue = hasDiscount ? Math.floor(totalAmount * 0.1) : 0;
        const finalAmount = totalAmount - discountValue;
        
        const [invoice] = await db.insert(invoices).values({
          invoiceNumber: invoiceNum,
          patientId,
          totalAmount: totalAmount.toString(),
          discountType: hasDiscount ? "percentage" : null,
          discountValue: hasDiscount ? "10" : null,
          finalAmount: finalAmount.toString(),
          paidAmount: finalAmount.toString(),
          status: "paid",
          issuedDate: appointmentDate.toISOString().split("T")[0],
          dueDate: new Date(appointmentDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        }).returning();

        // Create invoice item
        await db.insert(invoiceItems).values({
          invoiceId: invoice.id,
          patientTreatmentId: patientTreatment.id,
          description: treatment.name,
          quantity: 1,
          unitPrice: treatment.price.toString(),
          totalPrice: treatment.price.toString(),
        });

        // Create payment
        await db.insert(payments).values({
          invoiceId: invoice.id,
          amount: finalAmount.toString(),
          paymentDate: appointmentDate.toISOString().split("T")[0],
          paymentMethod: randomChoice(["cash", "card", "bank_transfer", "insurance"] as const),
        });
      }
    }
  }

  // Create future appointments
  console.log("Creating future appointments...");
  for (let day = 1; day <= 30; day++) {
    const futureDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + day);
    const appointmentsThisDay = Math.floor(Math.random() * 5) + 1;
    
    for (let a = 0; a < appointmentsThisDay; a++) {
      const startHour = 9 + Math.floor(Math.random() * 8);
      const startTime = new Date(futureDate);
      startTime.setHours(startHour, 0, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 30 + Math.floor(Math.random() * 30));
      
      await db.insert(appointments).values({
        patientId: randomChoice(createdPatients),
        doctorId: randomChoice(createdDoctors),
        title: randomChoice(["Scheduled Checkup", "Follow-up", "Treatment", "Consultation"]),
        startTime,
        endTime,
        status: randomChoice(["confirmed", "pending"] as const),
        category: randomChoice(["checkup", "follow_up", "new_visit"] as const),
        roomNumber: Math.floor(Math.random() * 5) + 1,
      });
    }
  }

  // Create expenses throughout the year
  console.log("Creating expenses...");
  for (let month = 0; month < 12; month++) {
    const monthDate = new Date(oneYearAgo.getFullYear(), oneYearAgo.getMonth() + month, 15);
    
    // 5-10 expenses per month
    const expensesThisMonth = 5 + Math.floor(Math.random() * 5);
    
    for (let e = 0; e < expensesThisMonth; e++) {
      const category = randomChoice(expenseCategories);
      const amounts: Record<string, [number, number]> = {
        rent: [5000, 10000],
        salaries: [3000, 8000],
        utilities: [500, 1500],
        supplies: [200, 800],
        equipment: [500, 5000],
        lab_fees: [100, 500],
        marketing: [200, 1000],
        insurance: [300, 800],
        maintenance: [100, 500],
        software: [50, 300],
        training: [100, 500],
        other: [50, 300],
      };
      
      const [min, max] = amounts[category] || [100, 500];
      const amount = min + Math.floor(Math.random() * (max - min));
      
      await db.insert(expenses).values({
        description: `${category.charAt(0).toUpperCase() + category.slice(1).replace("_", " ")} - ${monthDate.toLocaleString("default", { month: "long" })}`,
        category,
        amount: amount.toString(),
        expenseDate: randomDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1), new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)).toISOString().split("T")[0],
        vendor: randomChoice(["Local Supplier", "MedSupply Co", "Service Provider", "Utility Company"]),
        isRecurring: category === "rent" || category === "salaries" || category === "utilities",
        recurringFrequency: (category === "rent" || category === "salaries" || category === "utilities") ? "monthly" : null,
      });
    }
  }

  // Create lab cases
  console.log("Creating lab cases...");
  for (let i = 0; i < 25; i++) {
    const caseDate = randomDate(oneYearAgo, now);
    const status = randomChoice(["pending", "in_progress", "completed", "delivered"] as const);
    
    await db.insert(labCases).values({
      patientId: randomChoice(createdPatients),
      doctorId: randomChoice(createdDoctors),
      caseType: randomChoice(["Crown", "Bridge", "Denture", "Implant", "Veneer", "Night Guard"]),
      labName: randomChoice(["DentalLab Pro", "Precision Dental Lab", "Al-Noor Lab", "MasterCraft Dental"]),
      status,
      estimatedCost: (500 + Math.floor(Math.random() * 2000)).toString(),
      actualCost: status === "completed" || status === "delivered" ? (500 + Math.floor(Math.random() * 2000)).toString() : null,
      sentDate: caseDate.toISOString().split("T")[0],
      expectedReturnDate: new Date(caseDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      returnedDate: (status === "completed" || status === "delivered") ? new Date(caseDate.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] : null,
    });
  }

  console.log("Data generation complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
