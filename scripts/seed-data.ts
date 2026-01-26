import { db } from "../server/db";
import { 
  patients, users, appointments, treatments, patientTreatments,
  invoices, invoiceItems, payments, expenses, inventoryItems, labCases
} from "../shared/schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcrypt";

const maleFirstNames = ["Ahmed", "Mohammed", "Omar", "Yusuf", "Ali", "Hassan", "Khalid", "Ibrahim", "Tariq", "Zaid", "Faisal", "Rashid", "Salem", "Nasser", "Hamad", "Saeed", "Majid", "Waleed", "Fahad", "Sultan"];
const femaleFirstNames = ["Fatima", "Sara", "Layla", "Maryam", "Noor", "Aisha", "Hana", "Rania", "Dina", "Salma", "Noura", "Hessa", "Mariam", "Amina", "Zahra", "Khadija", "Lina", "Yasmin", "Samira", "Dana"];
const lastNames = ["Al-Rashid", "Hassan", "Ahmed", "Salem", "Al-Farsi", "Mahmoud", "Khalil", "Nasser", "Al-Sayed", "Yousef", "Al-Bakri", "Osman", "Al-Zahrani", "Farouk", "Al-Ghamdi", "Al-Otaibi", "Al-Qahtani", "Al-Dosari", "Al-Harbi", "Al-Shammari"];

const treatmentCatalog = [
  { code: "D0120", name: "Periodic Oral Evaluation", category: "diagnostics", price: 85, duration: 20 },
  { code: "D0150", name: "Comprehensive Oral Evaluation", category: "diagnostics", price: 150, duration: 30 },
  { code: "D0210", name: "Full Mouth X-rays", category: "diagnostics", price: 180, duration: 25 },
  { code: "D0330", name: "Panoramic X-ray", category: "diagnostics", price: 120, duration: 15 },
  { code: "D1110", name: "Prophylaxis - Adult Cleaning", category: "preventative", price: 120, duration: 45 },
  { code: "D1120", name: "Prophylaxis - Child Cleaning", category: "preventative", price: 80, duration: 30 },
  { code: "D1206", name: "Fluoride Varnish Application", category: "preventative", price: 45, duration: 15 },
  { code: "D1351", name: "Dental Sealant", category: "preventative", price: 55, duration: 20 },
  { code: "D2140", name: "Amalgam Filling - 1 Surface", category: "restorative", price: 180, duration: 30 },
  { code: "D2150", name: "Amalgam Filling - 2 Surfaces", category: "restorative", price: 230, duration: 40 },
  { code: "D2391", name: "Composite Filling - 1 Surface", category: "restorative", price: 250, duration: 35 },
  { code: "D2392", name: "Composite Filling - 2 Surfaces", category: "restorative", price: 320, duration: 45 },
  { code: "D2393", name: "Composite Filling - 3 Surfaces", category: "restorative", price: 390, duration: 55 },
  { code: "D2740", name: "Crown - Porcelain/Ceramic", category: "fixed_prosthodontics", price: 1400, duration: 90 },
  { code: "D2750", name: "Crown - Porcelain Fused to Metal", category: "fixed_prosthodontics", price: 1200, duration: 90 },
  { code: "D2751", name: "Crown - Full Cast Metal", category: "fixed_prosthodontics", price: 1100, duration: 80 },
  { code: "D2950", name: "Core Buildup", category: "restorative", price: 350, duration: 40 },
  { code: "D3310", name: "Root Canal - Anterior", category: "endodontics", price: 900, duration: 75 },
  { code: "D3320", name: "Root Canal - Premolar", category: "endodontics", price: 1100, duration: 90 },
  { code: "D3330", name: "Root Canal - Molar", category: "endodontics", price: 1400, duration: 120 },
  { code: "D4341", name: "Periodontal Scaling - Per Quadrant", category: "periodontics", price: 300, duration: 45 },
  { code: "D4342", name: "Periodontal Scaling - 1-3 Teeth", category: "periodontics", price: 150, duration: 30 },
  { code: "D4910", name: "Periodontal Maintenance", category: "periodontics", price: 180, duration: 45 },
  { code: "D5110", name: "Complete Denture - Upper", category: "removable_prosthodontics", price: 2500, duration: 60 },
  { code: "D5120", name: "Complete Denture - Lower", category: "removable_prosthodontics", price: 2500, duration: 60 },
  { code: "D5213", name: "Partial Denture - Upper", category: "removable_prosthodontics", price: 1800, duration: 60 },
  { code: "D6010", name: "Dental Implant", category: "surgery", price: 3500, duration: 120 },
  { code: "D7140", name: "Extraction - Simple", category: "surgery", price: 200, duration: 30 },
  { code: "D7210", name: "Extraction - Surgical", category: "surgery", price: 400, duration: 45 },
  { code: "D7240", name: "Wisdom Tooth Extraction", category: "surgery", price: 550, duration: 60 },
  { code: "D8080", name: "Comprehensive Orthodontic Treatment", category: "orthodontics", price: 5500, duration: 45 },
  { code: "D8090", name: "Orthodontic Retainer", category: "orthodontics", price: 350, duration: 30 },
  { code: "D9110", name: "Emergency Treatment", category: "diagnostics", price: 120, duration: 30 },
  { code: "D9310", name: "Consultation", category: "diagnostics", price: 100, duration: 30 },
  { code: "D9440", name: "Office Visit After Hours", category: "diagnostics", price: 180, duration: 30 },
  { code: "D2962", name: "Dental Veneer - Porcelain", category: "cosmetic", price: 1500, duration: 90 },
  { code: "D9972", name: "Teeth Whitening - In Office", category: "cosmetic", price: 450, duration: 60 },
];

const expenseDescriptions: Record<string, string[]> = {
  rent: ["Monthly Office Rent", "Clinic Space Lease Payment"],
  salaries: ["Staff Salaries", "Dental Assistant Wages", "Receptionist Salary", "Hygienist Salary"],
  utilities: ["Electricity Bill", "Water Bill", "Internet Service", "Phone Service", "Gas Bill"],
  supplies: ["Dental Supplies Order", "PPE Supplies", "Cleaning Supplies", "Office Supplies"],
  equipment: ["Dental Chair Maintenance", "X-Ray Machine Service", "Autoclave Maintenance", "Computer Equipment"],
  lab_fees: ["Dental Lab Services", "Crown Fabrication", "Denture Lab Work", "Implant Components"],
  marketing: ["Google Ads Campaign", "Social Media Marketing", "Local Newspaper Ad", "Website Maintenance"],
  insurance: ["Liability Insurance", "Equipment Insurance", "Malpractice Insurance"],
  maintenance: ["HVAC Service", "Plumbing Repair", "General Building Maintenance", "Equipment Repair"],
  software: ["Practice Management Software", "Cloud Backup Service", "Antivirus License"],
  training: ["Continuing Education Course", "Staff Training Workshop", "Certification Renewal"],
};

const inventoryItemsList = [
  { name: "Nitrile Examination Gloves (Box of 100)", category: "consumables", unit: "box", unitCost: 25, minQty: 20 },
  { name: "Disposable Face Masks (Box of 50)", category: "consumables", unit: "box", unitCost: 18, minQty: 15 },
  { name: "Dental Mirrors", category: "instruments", unit: "piece", unitCost: 15, minQty: 10 },
  { name: "Dental Explorer Probes", category: "instruments", unit: "piece", unitCost: 12, minQty: 10 },
  { name: "Composite Resin Kit - A2 Shade", category: "consumables", unit: "kit", unitCost: 180, minQty: 5 },
  { name: "Composite Resin Kit - A3 Shade", category: "consumables", unit: "kit", unitCost: 180, minQty: 5 },
  { name: "Anesthetic Cartridges - Lidocaine", category: "medications", unit: "box", unitCost: 45, minQty: 10 },
  { name: "Anesthetic Cartridges - Articaine", category: "medications", unit: "box", unitCost: 55, minQty: 8 },
  { name: "Cotton Rolls (Pack of 1000)", category: "consumables", unit: "pack", unitCost: 12, minQty: 10 },
  { name: "Gauze Pads (Pack of 200)", category: "consumables", unit: "pack", unitCost: 15, minQty: 15 },
  { name: "Sterilization Pouches (Pack of 200)", category: "consumables", unit: "pack", unitCost: 35, minQty: 10 },
  { name: "Diamond Burs Set", category: "instruments", unit: "set", unitCost: 120, minQty: 3 },
  { name: "Carbide Burs Set", category: "instruments", unit: "set", unitCost: 95, minQty: 3 },
  { name: "Digital X-Ray Sensor Covers", category: "consumables", unit: "box", unitCost: 65, minQty: 8 },
  { name: "Impression Material - Alginate", category: "consumables", unit: "kit", unitCost: 45, minQty: 6 },
  { name: "Impression Material - Silicone", category: "consumables", unit: "kit", unitCost: 95, minQty: 4 },
  { name: "Fluoride Gel - Mint", category: "medications", unit: "bottle", unitCost: 28, minQty: 8 },
  { name: "Fluoride Gel - Bubble Gum (Pediatric)", category: "medications", unit: "bottle", unitCost: 28, minQty: 5 },
  { name: "Bonding Agent", category: "consumables", unit: "bottle", unitCost: 85, minQty: 4 },
  { name: "Temporary Crown Material", category: "consumables", unit: "kit", unitCost: 65, minQty: 3 },
  { name: "Dental Cement - Glass Ionomer", category: "consumables", unit: "kit", unitCost: 120, minQty: 3 },
  { name: "Suture Kit 4-0", category: "consumables", unit: "box", unitCost: 45, minQty: 5 },
  { name: "Hemostatic Agent", category: "medications", unit: "box", unitCost: 55, minQty: 4 },
  { name: "Disposable Syringes", category: "consumables", unit: "box", unitCost: 22, minQty: 10 },
  { name: "Patient Bibs (Roll of 100)", category: "consumables", unit: "roll", unitCost: 18, minQty: 20 },
];

const labTypes = ["Crown", "Bridge", "Denture", "Partial Denture", "Implant Abutment", "Veneer", "Night Guard", "Orthodontic Retainer", "Implant Crown"];
const labNames = ["Precision Dental Lab", "MasterCraft Dental Laboratory", "Al-Noor Dental Lab", "Elite Prosthetics Lab", "Dubai Dental Ceramics"];

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePhone(): string {
  return `+971${randomInt(500000000, 599999999)}`;
}

function generateEmail(firstName: string, lastName: string): string {
  const domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"];
  const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, "");
  const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, "");
  return `${cleanFirst}.${cleanLast}${randomInt(1, 99)}@${randomChoice(domains)}`;
}

async function seed() {
  console.log("Starting comprehensive data generation...");
  
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const oneMonthAhead = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  const doctorData = [
    { username: "dr.ahmed.rashid", firstName: "Ahmed", lastName: "Al-Rashid", specialty: "general_dentistry" as const, licenseNumber: "DH-2018-4521" },
    { username: "dr.fatima.hassan", firstName: "Fatima", lastName: "Hassan", specialty: "orthodontics" as const, licenseNumber: "DH-2015-3287" },
    { username: "dr.omar.salem", firstName: "Omar", lastName: "Salem", specialty: "endodontics" as const, licenseNumber: "DH-2019-5643" },
    { username: "dr.layla.mahmoud", firstName: "Layla", lastName: "Mahmoud", specialty: "periodontics" as const, licenseNumber: "DH-2017-4098" },
    { username: "dr.khalid.nasser", firstName: "Khalid", lastName: "Nasser", specialty: "oral_surgery" as const, licenseNumber: "DH-2016-3756" },
  ];

  const hashedPassword = await bcrypt.hash("doctor123", 10);
  
  console.log("Creating doctors...");
  const createdDoctors: { id: string; name: string }[] = [];
  for (const doc of doctorData) {
    const existing = await db.select().from(users).where(sql`username = ${doc.username}`);
    if (existing.length === 0) {
      const [newDoc] = await db.insert(users).values({
        username: doc.username,
        password: hashedPassword,
        firstName: doc.firstName,
        lastName: doc.lastName,
        email: `${doc.firstName.toLowerCase()}.${doc.lastName.toLowerCase()}@glazerclinic.com`,
        role: "doctor",
        specialty: doc.specialty,
        licenseNumber: doc.licenseNumber,
        bio: `Dr. ${doc.firstName} ${doc.lastName} is a specialist in ${doc.specialty.replace("_", " ")} with over ${randomInt(5, 20)} years of experience.`,
        isActive: true,
      }).returning();
      createdDoctors.push({ id: newDoc.id, name: `Dr. ${doc.firstName} ${doc.lastName}` });
    } else {
      createdDoctors.push({ id: existing[0].id, name: `Dr. ${existing[0].firstName} ${existing[0].lastName}` });
    }
  }
  console.log(`Created ${createdDoctors.length} doctors`);

  console.log("Creating treatments catalog...");
  const createdTreatments: { id: string; code: string; price: number; category: string }[] = [];
  for (const t of treatmentCatalog) {
    const existing = await db.select().from(treatments).where(sql`code = ${t.code}`);
    if (existing.length === 0) {
      const [newT] = await db.insert(treatments).values({
        code: t.code,
        name: t.name,
        category: t.category as any,
        defaultPrice: t.price.toString(),
        cost: (t.price * 0.3).toFixed(2),
        durationMinutes: t.duration,
        isActive: true,
      }).returning();
      createdTreatments.push({ id: newT.id, code: t.code, price: t.price, category: t.category });
    } else {
      createdTreatments.push({ id: existing[0].id, code: t.code, price: t.price, category: t.category });
    }
  }
  console.log(`Created ${createdTreatments.length} treatments`);

  console.log("Creating 75 patients...");
  const createdPatients: { id: string; name: string; doctorId: string }[] = [];
  for (let i = 0; i < 75; i++) {
    const isMale = Math.random() > 0.5;
    const firstName = randomChoice(isMale ? maleFirstNames : femaleFirstNames);
    const lastName = randomChoice(lastNames);
    const birthYear = randomInt(1950, 2015);
    const assignedDoctor = randomChoice(createdDoctors);
    
    const [patient] = await db.insert(patients).values({
      fileNumber: `P${String(2000 + i).padStart(5, "0")}`,
      firstName,
      lastName,
      email: generateEmail(firstName, lastName),
      phone: generatePhone(),
      dateOfBirth: `${birthYear}-${String(randomInt(1, 12)).padStart(2, "0")}-${String(randomInt(1, 28)).padStart(2, "0")}`,
      gender: isMale ? "male" : "female",
      address: `${randomInt(1, 500)} ${randomChoice(["Al Wasl Road", "Sheikh Zayed Road", "Jumeirah Beach Road", "Al Maktoum Street", "Dubai Marina Walk"])}, Dubai, UAE`,
      emergencyContact: `${randomChoice(maleFirstNames)} ${randomChoice(lastNames)}`,
      emergencyPhone: generatePhone(),
      assignedDoctorId: assignedDoctor.id,
      insuranceProvider: Math.random() > 0.4 ? randomChoice(["Daman", "AXA", "Cigna", "MetLife", "Oman Insurance", "Dubai Insurance"]) : null,
      insurancePolicyNumber: Math.random() > 0.4 ? `POL-${randomInt(100000, 999999)}` : null,
      allergies: Math.random() > 0.7 ? [randomChoice(["Penicillin", "Latex", "Lidocaine", "Aspirin", "Ibuprofen"])] : null,
      chronicConditions: Math.random() > 0.8 ? [randomChoice(["Diabetes", "Hypertension", "Asthma", "Heart Disease"])] : null,
    }).returning();
    createdPatients.push({ id: patient.id, name: `${firstName} ${lastName}`, doctorId: assignedDoctor.id });
  }
  console.log(`Created ${createdPatients.length} patients`);

  console.log("Creating inventory items...");
  for (const item of inventoryItemsList) {
    const existing = await db.select().from(inventoryItems).where(sql`name = ${item.name}`);
    if (existing.length === 0) {
      await db.insert(inventoryItems).values({
        name: item.name,
        category: item.category as any,
        currentQuantity: randomInt(item.minQty, item.minQty * 5),
        minimumQuantity: item.minQty,
        unit: item.unit,
        unitCost: item.unitCost.toString(),
        supplier: randomChoice(["MedSupply Co", "DentalPro International", "HealthCare Distributors", "Al-Noor Medical Supplies", "Gulf Dental Supply"]),
        location: randomChoice(["Storage Room A", "Storage Room B", "Main Cabinet", "Sterilization Area"]),
        lastRestocked: randomDate(new Date(oneYearAgo.getTime() - 30 * 24 * 60 * 60 * 1000), now).toISOString().split("T")[0],
      });
    }
  }
  console.log(`Created ${inventoryItemsList.length} inventory items`);

  console.log("Creating appointments, treatments, invoices, and payments for the past year...");
  let invoiceCounter = 10000;
  const doctorEarnings: Record<string, number> = {};
  createdDoctors.forEach(d => doctorEarnings[d.id] = 0);
  
  for (let dayOffset = -365; dayOffset <= 30; dayOffset++) {
    const currentDate = new Date(now);
    currentDate.setDate(currentDate.getDate() + dayOffset);
    
    if (currentDate.getDay() === 5) continue;
    
    const isPast = dayOffset < 0;
    const appointmentsToday = isPast ? randomInt(8, 18) : randomInt(4, 12);
    
    for (let a = 0; a < appointmentsToday; a++) {
      const patient = randomChoice(createdPatients);
      const doctor = createdDoctors.find(d => d.id === patient.doctorId) || randomChoice(createdDoctors);
      
      const startHour = 8 + Math.floor(a / 2);
      const startMinute = (a % 2) * 30;
      const startTime = new Date(currentDate);
      startTime.setHours(startHour, startMinute, 0, 0);
      
      const treatment = randomChoice(treatmentCatalog);
      const duration = treatment.duration;
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + duration);
      
      const categories: Array<"new_visit" | "follow_up" | "checkup" | "cleaning" | "surgery" | "discussion"> = ["new_visit", "follow_up", "checkup", "cleaning", "surgery", "discussion"];
      const categoryWeights = [0.15, 0.25, 0.25, 0.2, 0.1, 0.05];
      let category = categories[0];
      const rand = Math.random();
      let cumulative = 0;
      for (let i = 0; i < categories.length; i++) {
        cumulative += categoryWeights[i];
        if (rand <= cumulative) {
          category = categories[i];
          break;
        }
      }
      
      let status: "completed" | "confirmed" | "pending" | "canceled";
      if (isPast) {
        const statusRand = Math.random();
        if (statusRand < 0.85) status = "completed";
        else if (statusRand < 0.95) status = "canceled";
        else status = "completed";
      } else {
        status = Math.random() > 0.3 ? "confirmed" : "pending";
      }
      
      const [appointment] = await db.insert(appointments).values({
        patientId: patient.id,
        doctorId: doctor.id,
        title: treatment.name,
        startTime,
        endTime,
        status,
        category,
        roomNumber: randomInt(1, 6),
        notes: status === "canceled" ? randomChoice(["Patient requested reschedule", "No show", "Emergency cancellation"]) : null,
      }).returning();

      if (status === "completed") {
        const treatmentData = createdTreatments.find(t => t.code === treatment.code)!;
        
        const [patientTreatment] = await db.insert(patientTreatments).values({
          patientId: patient.id,
          treatmentId: treatmentData.id,
          appointmentId: appointment.id,
          doctorId: doctor.id,
          status: "completed",
          toothNumber: treatment.category === "diagnostics" || treatment.category === "preventative" ? null : randomInt(1, 32),
          price: treatment.price.toString(),
          discountType: Math.random() > 0.85 ? "percentage" : null,
          discountValue: Math.random() > 0.85 ? randomInt(5, 15).toString() : null,
          completionDate: currentDate.toISOString().split("T")[0],
        }).returning();

        const invoiceNum = `INV-${invoiceCounter++}`;
        const totalAmount = treatment.price;
        const hasDiscount = Math.random() > 0.8;
        const discountPercent = hasDiscount ? randomInt(5, 15) : 0;
        const discountValue = Math.round(totalAmount * discountPercent / 100);
        const finalAmount = totalAmount - discountValue;
        
        const statusOptions: Array<"paid" | "partial" | "sent"> = ["paid", "paid", "paid", "paid", "partial", "sent"];
        const invoiceStatus = randomChoice(statusOptions);
        const paidAmount = invoiceStatus === "paid" ? finalAmount : 
                          invoiceStatus === "partial" ? Math.round(finalAmount * randomInt(30, 70) / 100) : 0;
        
        const [invoice] = await db.insert(invoices).values({
          invoiceNumber: invoiceNum,
          patientId: patient.id,
          totalAmount: totalAmount.toString(),
          discountType: hasDiscount ? "percentage" : null,
          discountValue: hasDiscount ? discountPercent.toString() : null,
          finalAmount: finalAmount.toString(),
          paidAmount: paidAmount.toString(),
          status: invoiceStatus,
          issuedDate: currentDate.toISOString().split("T")[0],
          dueDate: new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        }).returning();

        await db.insert(invoiceItems).values({
          invoiceId: invoice.id,
          patientTreatmentId: patientTreatment.id,
          description: treatment.name,
          quantity: 1,
          unitPrice: treatment.price.toString(),
          totalPrice: treatment.price.toString(),
        });

        if (paidAmount > 0) {
          const paymentMethods: Array<"cash" | "card" | "bank_transfer" | "insurance"> = ["cash", "card", "card", "bank_transfer", "insurance"];
          await db.insert(payments).values({
            invoiceId: invoice.id,
            amount: paidAmount.toString(),
            paymentDate: currentDate.toISOString().split("T")[0],
            paymentMethod: randomChoice(paymentMethods),
            referenceNumber: Math.random() > 0.5 ? `REF-${randomInt(100000, 999999)}` : null,
          });
          
          doctorEarnings[doctor.id] = (doctorEarnings[doctor.id] || 0) + paidAmount;
        }
      }
    }
    
    if (dayOffset % 30 === 0) {
      console.log(`  Processed ${dayOffset + 365} of 395 days...`);
    }
  }

  console.log("\nDoctor earnings summary:");
  for (const doc of createdDoctors) {
    console.log(`  ${doc.name}: $${doctorEarnings[doc.id]?.toLocaleString() || 0}`);
  }

  console.log("\nCreating monthly expenses...");
  for (let month = 0; month < 13; month++) {
    const monthDate = new Date(oneYearAgo.getFullYear(), oneYearAgo.getMonth() + month, 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    
    await db.insert(expenses).values({
      description: "Monthly Office Rent - Main Clinic",
      category: "rent",
      amount: "15000",
      expenseDate: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).toISOString().split("T")[0],
      vendor: "Dubai Properties LLC",
      referenceNumber: `RENT-${monthDate.getFullYear()}${String(monthDate.getMonth() + 1).padStart(2, "0")}`,
      isRecurring: true,
      recurringFrequency: "monthly",
    });

    for (const doc of createdDoctors) {
      const salary = 25000 + randomInt(-2000, 5000);
      await db.insert(expenses).values({
        description: `Salary - ${doc.name}`,
        category: "salaries",
        amount: salary.toString(),
        expenseDate: new Date(monthDate.getFullYear(), monthDate.getMonth(), 28).toISOString().split("T")[0],
        vendor: "Payroll",
        isRecurring: true,
        recurringFrequency: "monthly",
      });
    }

    await db.insert(expenses).values({
      description: "Staff Salaries - Support Team",
      category: "salaries",
      amount: (35000 + randomInt(-1000, 3000)).toString(),
      expenseDate: new Date(monthDate.getFullYear(), monthDate.getMonth(), 28).toISOString().split("T")[0],
      vendor: "Payroll",
      isRecurring: true,
      recurringFrequency: "monthly",
    });

    const utilitiesAmount = 2500 + randomInt(-300, 500);
    await db.insert(expenses).values({
      description: "Utilities - Electricity, Water, Internet",
      category: "utilities",
      amount: utilitiesAmount.toString(),
      expenseDate: randomDate(monthDate, monthEnd).toISOString().split("T")[0],
      vendor: "DEWA / Etisalat",
      isRecurring: true,
      recurringFrequency: "monthly",
    });

    const suppliesOrders = randomInt(2, 4);
    for (let s = 0; s < suppliesOrders; s++) {
      await db.insert(expenses).values({
        description: randomChoice(expenseDescriptions.supplies),
        category: "supplies",
        amount: (randomInt(500, 3000)).toString(),
        expenseDate: randomDate(monthDate, monthEnd).toISOString().split("T")[0],
        vendor: randomChoice(["MedSupply Co", "DentalPro", "Gulf Medical Supplies"]),
        referenceNumber: `PO-${randomInt(10000, 99999)}`,
      });
    }

    const labOrders = randomInt(3, 8);
    for (let l = 0; l < labOrders; l++) {
      await db.insert(expenses).values({
        description: `Lab Work - ${randomChoice(labTypes)}`,
        category: "lab_fees",
        amount: (randomInt(200, 1500)).toString(),
        expenseDate: randomDate(monthDate, monthEnd).toISOString().split("T")[0],
        vendor: randomChoice(labNames),
        referenceNumber: `LAB-${randomInt(10000, 99999)}`,
      });
    }

    if (Math.random() > 0.5) {
      await db.insert(expenses).values({
        description: randomChoice(expenseDescriptions.maintenance),
        category: "maintenance",
        amount: (randomInt(200, 2000)).toString(),
        expenseDate: randomDate(monthDate, monthEnd).toISOString().split("T")[0],
        vendor: randomChoice(["Building Services", "EquipCare", "TechFix"]),
      });
    }

    if (Math.random() > 0.7) {
      await db.insert(expenses).values({
        description: randomChoice(expenseDescriptions.marketing),
        category: "marketing",
        amount: (randomInt(500, 3000)).toString(),
        expenseDate: randomDate(monthDate, monthEnd).toISOString().split("T")[0],
        vendor: randomChoice(["Digital Marketing Agency", "Print Media", "Social Boost"]),
      });
    }

    if (month % 3 === 0) {
      await db.insert(expenses).values({
        description: "Practice Management Software - Quarterly",
        category: "software",
        amount: "450",
        expenseDate: monthDate.toISOString().split("T")[0],
        vendor: "DentalSoft Inc",
        isRecurring: true,
        recurringFrequency: "quarterly",
      });
    }

    if (month === 0 || month === 6) {
      await db.insert(expenses).values({
        description: "Professional Liability Insurance - Semi-Annual",
        category: "insurance",
        amount: "8500",
        expenseDate: monthDate.toISOString().split("T")[0],
        vendor: "Gulf Insurance Co",
        isRecurring: true,
        recurringFrequency: "semi-annually",
      });
    }
  }

  console.log("Creating lab cases...");
  for (let i = 0; i < 60; i++) {
    const caseDate = randomDate(oneYearAgo, now);
    const patient = randomChoice(createdPatients);
    const doctor = createdDoctors.find(d => d.id === patient.doctorId) || randomChoice(createdDoctors);
    const caseType = randomChoice(labTypes);
    const estimatedCost = randomInt(300, 2500);
    
    const daysSinceCreation = Math.floor((now.getTime() - caseDate.getTime()) / (24 * 60 * 60 * 1000));
    let status: "pending" | "in_progress" | "completed" | "delivered";
    if (daysSinceCreation > 21) status = "delivered";
    else if (daysSinceCreation > 14) status = Math.random() > 0.3 ? "delivered" : "completed";
    else if (daysSinceCreation > 7) status = randomChoice(["in_progress", "completed"] as const);
    else status = randomChoice(["pending", "in_progress"] as const);
    
    await db.insert(labCases).values({
      patientId: patient.id,
      doctorId: doctor.id,
      caseType,
      labName: randomChoice(labNames),
      status,
      estimatedCost: estimatedCost.toString(),
      actualCost: (status === "completed" || status === "delivered") ? (estimatedCost + randomInt(-50, 100)).toString() : null,
      sentDate: caseDate.toISOString().split("T")[0],
      expectedReturnDate: new Date(caseDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      returnedDate: (status === "completed" || status === "delivered") ? new Date(caseDate.getTime() + randomInt(10, 16) * 24 * 60 * 60 * 1000).toISOString().split("T")[0] : null,
      notes: randomChoice([null, "Rush order", "Patient preference noted", "Shade matching required", null, null]),
    });
  }

  console.log("\n=== Data Generation Complete ===");
  console.log("Summary:");
  const patientCount = await db.select({ count: sql<number>`count(*)` }).from(patients);
  const appointmentCount = await db.select({ count: sql<number>`count(*)` }).from(appointments);
  const invoiceCount = await db.select({ count: sql<number>`count(*)` }).from(invoices);
  const paymentCount = await db.select({ count: sql<number>`count(*)` }).from(payments);
  const expenseCount = await db.select({ count: sql<number>`count(*)` }).from(expenses);
  const labCount = await db.select({ count: sql<number>`count(*)` }).from(labCases);
  
  console.log(`  Patients: ${patientCount[0].count}`);
  console.log(`  Appointments: ${appointmentCount[0].count}`);
  console.log(`  Invoices: ${invoiceCount[0].count}`);
  console.log(`  Payments: ${paymentCount[0].count}`);
  console.log(`  Expenses: ${expenseCount[0].count}`);
  console.log(`  Lab Cases: ${labCount[0].count}`);
  
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
