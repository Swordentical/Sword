import { db, pool } from "../db";
import { sql } from "drizzle-orm";
import {
  organizations, users, patients, treatments, patientTreatments, appointments,
  invoices, invoiceItems, payments, paymentPlans, paymentPlanInstallments,
  invoiceAdjustments, expenses, doctorPayments, insuranceClaims, inventoryItems,
  labCases, externalLabs, labServices, documents, orthodonticNotes, activityLog,
  auditLogs, clinicSettings, clinicRooms
} from "@shared/schema";

const DEFAULT_CLINIC_NAME = "Default Clinic";
const DEFAULT_CLINIC_SLUG = "default-clinic";

async function migrateToMultiTenant() {
  console.log("Starting multi-tenant migration...\n");

  try {
    let defaultOrgId: string;

    const existingOrg = await db.select().from(organizations).where(sql`slug = ${DEFAULT_CLINIC_SLUG}`).limit(1);
    
    if (existingOrg.length > 0) {
      defaultOrgId = existingOrg[0].id;
      console.log(`Using existing default organization: ${defaultOrgId}`);
    } else {
      const [newOrg] = await db.insert(organizations).values({
        name: DEFAULT_CLINIC_NAME,
        slug: DEFAULT_CLINIC_SLUG,
        subscriptionStatus: "active",
        isActive: true,
      }).returning();
      defaultOrgId = newOrg.id;
      console.log(`Created default organization: ${defaultOrgId}`);
    }

    console.log("\nUpdating records to associate with default clinic...\n");

    const tablesToUpdate = [
      { table: "users", name: "Users" },
      { table: "patients", name: "Patients" },
      { table: "treatments", name: "Treatments" },
      { table: "patient_treatments", name: "Patient Treatments" },
      { table: "appointments", name: "Appointments" },
      { table: "invoices", name: "Invoices" },
      { table: "invoice_items", name: "Invoice Items" },
      { table: "payments", name: "Payments" },
      { table: "payment_plans", name: "Payment Plans" },
      { table: "payment_plan_installments", name: "Payment Plan Installments" },
      { table: "invoice_adjustments", name: "Invoice Adjustments" },
      { table: "expenses", name: "Expenses" },
      { table: "doctor_payments", name: "Doctor Payments" },
      { table: "insurance_claims", name: "Insurance Claims" },
      { table: "inventory_items", name: "Inventory Items" },
      { table: "lab_cases", name: "Lab Cases" },
      { table: "external_labs", name: "External Labs" },
      { table: "lab_services", name: "Lab Services" },
      { table: "documents", name: "Documents" },
      { table: "orthodontic_notes", name: "Orthodontic Notes" },
      { table: "activity_log", name: "Activity Log" },
      { table: "audit_logs", name: "Audit Logs" },
      { table: "clinic_settings", name: "Clinic Settings" },
      { table: "clinic_rooms", name: "Clinic Rooms" },
    ];

    for (const { table, name } of tablesToUpdate) {
      try {
        const result = await pool.query(`
          UPDATE ${table} 
          SET organization_id = $1 
          WHERE organization_id IS NULL
        `, [defaultOrgId]);
        
        console.log(`  ${name}: Updated ${result.rowCount} records`);
      } catch (error: any) {
        if (error.message?.includes("does not exist")) {
          console.log(`  ${name}: Skipped (column not found)`);
        } else {
          console.error(`  ${name}: Error - ${error.message}`);
        }
      }
    }

    const firstAdmin = await db.select().from(users)
      .where(sql`role = 'admin' OR role = 'clinic_admin'`)
      .limit(1);

    if (firstAdmin.length > 0 && !existingOrg[0]?.ownerId) {
      await db.update(organizations)
        .set({ ownerId: firstAdmin[0].id })
        .where(sql`id = ${defaultOrgId}`);
      console.log(`\nSet organization owner to: ${firstAdmin[0].firstName} ${firstAdmin[0].lastName}`);
    }

    console.log("\n✓ Multi-tenant migration completed successfully!");
    console.log(`  Default organization ID: ${defaultOrgId}`);

  } catch (error) {
    console.error("\n✗ Migration failed:", error);
    throw error;
  }
}

migrateToMultiTenant()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
