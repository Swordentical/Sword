CREATE TYPE "public"."adjustment_type" AS ENUM('discount', 'write_off', 'refund', 'fee', 'correction');--> statement-breakpoint
CREATE TYPE "public"."appointment_category" AS ENUM('new_visit', 'follow_up', 'discussion', 'surgery', 'checkup', 'cleaning');--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('confirmed', 'pending', 'canceled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."doctor_specialty" AS ENUM('general_dentistry', 'orthodontics', 'periodontics', 'endodontics', 'prosthodontics', 'oral_surgery', 'pediatric_dentistry', 'cosmetic_dentistry', 'implantology', 'oral_pathology');--> statement-breakpoint
CREATE TYPE "public"."expense_category" AS ENUM('supplies', 'equipment', 'lab_fees', 'utilities', 'rent', 'salaries', 'marketing', 'insurance', 'maintenance', 'software', 'training', 'other');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."insurance_claim_status" AS ENUM('draft', 'submitted', 'pending', 'approved', 'denied', 'paid', 'appealed');--> statement-breakpoint
CREATE TYPE "public"."inventory_category" AS ENUM('consumables', 'equipment', 'instruments', 'medications', 'office_supplies');--> statement-breakpoint
CREATE TYPE "public"."inventory_status" AS ENUM('available', 'low_stock', 'out_of_stock');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'paid', 'partial', 'overdue', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."lab_case_status" AS ENUM('pending', 'in_progress', 'completed', 'delivered');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'card', 'bank_transfer', 'insurance', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_plan_status" AS ENUM('active', 'completed', 'canceled', 'defaulted');--> statement-breakpoint
CREATE TYPE "public"."service_category" AS ENUM('endodontics', 'restorative', 'preventative', 'fixed_prosthodontics', 'removable_prosthodontics', 'surgery', 'orthodontics', 'periodontics', 'cosmetic', 'diagnostics', 'pediatric');--> statement-breakpoint
CREATE TYPE "public"."treatment_status" AS ENUM('planned', 'in_progress', 'completed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'doctor', 'staff', 'student');--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36),
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" varchar(36),
	"details" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" varchar(36) NOT NULL,
	"doctor_id" varchar(36),
	"title" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"status" "appointment_status" DEFAULT 'pending',
	"category" "appointment_category" DEFAULT 'checkup',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by_id" varchar(36)
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" varchar(36) NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"category" text,
	"description" text,
	"uploaded_by_id" varchar(36),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"description" text NOT NULL,
	"category" "expense_category" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"expense_date" date NOT NULL,
	"vendor" text,
	"reference_number" text,
	"notes" text,
	"receipt_url" text,
	"is_recurring" boolean DEFAULT false,
	"recurring_frequency" text,
	"created_by_id" varchar(36),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "insurance_claims" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_number" text NOT NULL,
	"patient_id" varchar(36) NOT NULL,
	"invoice_id" varchar(36),
	"insurance_provider" text NOT NULL,
	"policy_number" text NOT NULL,
	"subscriber_name" text,
	"subscriber_dob" date,
	"subscriber_relation" text,
	"status" "insurance_claim_status" DEFAULT 'draft' NOT NULL,
	"claim_amount" numeric(10, 2) NOT NULL,
	"approved_amount" numeric(10, 2),
	"paid_amount" numeric(10, 2),
	"denial_reason" text,
	"submitted_date" date,
	"processed_date" date,
	"notes" text,
	"created_by_id" varchar(36),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "insurance_claims_claim_number_unique" UNIQUE("claim_number")
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" "inventory_category" NOT NULL,
	"current_quantity" integer DEFAULT 0 NOT NULL,
	"minimum_quantity" integer DEFAULT 5 NOT NULL,
	"unit" text NOT NULL,
	"unit_cost" numeric(10, 2),
	"supplier" text,
	"location" text,
	"description" text,
	"last_restocked" date,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invoice_adjustments" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" varchar(36) NOT NULL,
	"type" "adjustment_type" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"reason" text NOT NULL,
	"applied_date" date NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"created_by_id" varchar(36)
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" varchar(36) NOT NULL,
	"patient_treatment_id" varchar(36),
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" text NOT NULL,
	"patient_id" varchar(36) NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"discount_type" text,
	"discount_value" numeric(10, 2),
	"final_amount" numeric(10, 2) NOT NULL,
	"paid_amount" numeric(10, 2) DEFAULT '0',
	"status" "invoice_status" DEFAULT 'draft',
	"issued_date" date NOT NULL,
	"due_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by_id" varchar(36),
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "lab_cases" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" varchar(36) NOT NULL,
	"doctor_id" varchar(36),
	"case_type" text NOT NULL,
	"lab_name" text NOT NULL,
	"tooth_numbers" integer[],
	"sent_date" date NOT NULL,
	"expected_return_date" date,
	"actual_return_date" date,
	"status" "lab_case_status" DEFAULT 'pending',
	"cost" numeric(10, 2),
	"is_paid" boolean DEFAULT false,
	"description" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orthodontic_notes" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" varchar(36) NOT NULL,
	"appointment_id" varchar(36),
	"stage" text NOT NULL,
	"notes" text,
	"image_urls" text[],
	"created_by_id" varchar(36),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "patient_treatments" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" varchar(36) NOT NULL,
	"treatment_id" varchar(36) NOT NULL,
	"appointment_id" varchar(36),
	"doctor_id" varchar(36),
	"status" "treatment_status" DEFAULT 'planned',
	"tooth_number" integer,
	"price" numeric(10, 2) NOT NULL,
	"discount_type" text,
	"discount_value" numeric(10, 2),
	"scheduled_date" date,
	"completion_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text NOT NULL,
	"date_of_birth" date,
	"gender" "gender",
	"address" text,
	"emergency_contact" text,
	"emergency_phone" text,
	"photo_url" text,
	"allergies" text[],
	"chronic_conditions" text[],
	"current_medications" text[],
	"medical_notes" text,
	"insurance_provider" text,
	"insurance_policy_number" text,
	"dental_history" text,
	"last_visit" date,
	"assigned_doctor_id" varchar(36),
	"assigned_student_id" varchar(36),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by_id" varchar(36)
);
--> statement-breakpoint
CREATE TABLE "payment_plan_installments" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_plan_id" varchar(36) NOT NULL,
	"installment_number" integer NOT NULL,
	"due_date" date NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"paid_amount" numeric(10, 2) DEFAULT '0',
	"is_paid" boolean DEFAULT false,
	"paid_date" date,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "payment_plans" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" varchar(36) NOT NULL,
	"patient_id" varchar(36) NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"down_payment" numeric(10, 2) DEFAULT '0',
	"number_of_installments" integer NOT NULL,
	"installment_amount" numeric(10, 2) NOT NULL,
	"frequency" text NOT NULL,
	"start_date" date NOT NULL,
	"status" "payment_plan_status" DEFAULT 'active',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by_id" varchar(36)
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" varchar(36) NOT NULL,
	"payment_plan_installment_id" varchar(36),
	"amount" numeric(10, 2) NOT NULL,
	"payment_date" date NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"reference_number" text,
	"notes" text,
	"is_refunded" boolean DEFAULT false,
	"refunded_at" timestamp,
	"refund_reason" text,
	"created_at" timestamp DEFAULT now(),
	"created_by_id" varchar(36)
);
--> statement-breakpoint
CREATE TABLE "treatments" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"category" "service_category" NOT NULL,
	"description" text,
	"default_price" numeric(10, 2) NOT NULL,
	"duration_minutes" integer DEFAULT 30,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "treatments_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"role" "user_role" DEFAULT 'staff' NOT NULL,
	"phone" text,
	"avatar_url" text,
	"specialty" "doctor_specialty",
	"license_number" text,
	"bio" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_adjustments" ADD CONSTRAINT "invoice_adjustments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_cases" ADD CONSTRAINT "lab_cases_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_cases" ADD CONSTRAINT "lab_cases_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orthodontic_notes" ADD CONSTRAINT "orthodontic_notes_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_treatments" ADD CONSTRAINT "patient_treatments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_treatments" ADD CONSTRAINT "patient_treatments_treatment_id_treatments_id_fk" FOREIGN KEY ("treatment_id") REFERENCES "public"."treatments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_treatments" ADD CONSTRAINT "patient_treatments_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_plan_installments" ADD CONSTRAINT "payment_plan_installments_payment_plan_id_payment_plans_id_fk" FOREIGN KEY ("payment_plan_id") REFERENCES "public"."payment_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_plans" ADD CONSTRAINT "payment_plans_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_plans" ADD CONSTRAINT "payment_plans_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;