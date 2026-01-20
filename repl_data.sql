--
-- PostgreSQL database dump
--

\restrict 3vdtndvwfTflUAcWujZaESQpKytAcc17P8hVAg90aBu31ybj1Pg18gsgCedzfNd

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: adjustment_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.adjustment_type AS ENUM (
    'discount',
    'write_off',
    'refund',
    'fee',
    'correction'
);


ALTER TYPE public.adjustment_type OWNER TO postgres;

--
-- Name: appointment_category; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.appointment_category AS ENUM (
    'new_visit',
    'follow_up',
    'discussion',
    'surgery',
    'checkup',
    'cleaning'
);


ALTER TYPE public.appointment_category OWNER TO postgres;

--
-- Name: appointment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.appointment_status AS ENUM (
    'confirmed',
    'pending',
    'canceled',
    'completed'
);


ALTER TYPE public.appointment_status OWNER TO postgres;

--
-- Name: doctor_specialty; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.doctor_specialty AS ENUM (
    'general_dentistry',
    'orthodontics',
    'periodontics',
    'endodontics',
    'prosthodontics',
    'oral_surgery',
    'pediatric_dentistry',
    'cosmetic_dentistry',
    'implantology',
    'oral_pathology'
);


ALTER TYPE public.doctor_specialty OWNER TO postgres;

--
-- Name: expense_category; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.expense_category AS ENUM (
    'supplies',
    'equipment',
    'lab_fees',
    'utilities',
    'rent',
    'salaries',
    'marketing',
    'insurance',
    'maintenance',
    'software',
    'training',
    'other'
);


ALTER TYPE public.expense_category OWNER TO postgres;

--
-- Name: gender; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.gender AS ENUM (
    'male',
    'female',
    'other'
);


ALTER TYPE public.gender OWNER TO postgres;

--
-- Name: insurance_claim_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.insurance_claim_status AS ENUM (
    'draft',
    'submitted',
    'pending',
    'approved',
    'denied',
    'paid',
    'appealed'
);


ALTER TYPE public.insurance_claim_status OWNER TO postgres;

--
-- Name: inventory_category; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.inventory_category AS ENUM (
    'consumables',
    'equipment',
    'instruments',
    'medications',
    'office_supplies'
);


ALTER TYPE public.inventory_category OWNER TO postgres;

--
-- Name: inventory_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.inventory_status AS ENUM (
    'available',
    'low_stock',
    'out_of_stock'
);


ALTER TYPE public.inventory_status OWNER TO postgres;

--
-- Name: invoice_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.invoice_status AS ENUM (
    'draft',
    'sent',
    'paid',
    'partial',
    'overdue',
    'canceled'
);


ALTER TYPE public.invoice_status OWNER TO postgres;

--
-- Name: lab_case_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.lab_case_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'delivered'
);


ALTER TYPE public.lab_case_status OWNER TO postgres;

--
-- Name: payment_method; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_method AS ENUM (
    'cash',
    'card',
    'bank_transfer',
    'insurance',
    'other'
);


ALTER TYPE public.payment_method OWNER TO postgres;

--
-- Name: payment_plan_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_plan_status AS ENUM (
    'active',
    'completed',
    'canceled',
    'defaulted'
);


ALTER TYPE public.payment_plan_status OWNER TO postgres;

--
-- Name: service_category; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.service_category AS ENUM (
    'endodontics',
    'restorative',
    'preventative',
    'fixed_prosthodontics',
    'removable_prosthodontics',
    'surgery',
    'orthodontics',
    'periodontics',
    'cosmetic',
    'diagnostics',
    'pediatric'
);


ALTER TYPE public.service_category OWNER TO postgres;

--
-- Name: treatment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.treatment_status AS ENUM (
    'planned',
    'in_progress',
    'completed',
    'canceled'
);


ALTER TYPE public.treatment_status OWNER TO postgres;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'doctor',
    'staff',
    'student'
);


ALTER TYPE public.user_role OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_log (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(36),
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id character varying(36),
    details text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.activity_log OWNER TO postgres;

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointments (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    patient_id character varying(36) NOT NULL,
    doctor_id character varying(36),
    title text NOT NULL,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone NOT NULL,
    status public.appointment_status DEFAULT 'pending'::public.appointment_status,
    category public.appointment_category DEFAULT 'checkup'::public.appointment_category,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    created_by_id character varying(36)
);


ALTER TABLE public.appointments OWNER TO postgres;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    patient_id character varying(36) NOT NULL,
    file_name text NOT NULL,
    file_type text NOT NULL,
    file_url text NOT NULL,
    file_size integer,
    category text,
    description text,
    uploaded_by_id character varying(36),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expenses (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    description text NOT NULL,
    category public.expense_category NOT NULL,
    amount numeric(10,2) NOT NULL,
    expense_date date NOT NULL,
    vendor text,
    reference_number text,
    notes text,
    receipt_url text,
    is_recurring boolean DEFAULT false,
    recurring_frequency text,
    created_by_id character varying(36),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.expenses OWNER TO postgres;

--
-- Name: insurance_claims; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.insurance_claims (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    claim_number text NOT NULL,
    patient_id character varying(36) NOT NULL,
    invoice_id character varying(36),
    insurance_provider text NOT NULL,
    policy_number text NOT NULL,
    subscriber_name text,
    subscriber_dob date,
    subscriber_relation text,
    status public.insurance_claim_status DEFAULT 'draft'::public.insurance_claim_status NOT NULL,
    claim_amount numeric(10,2) NOT NULL,
    approved_amount numeric(10,2),
    paid_amount numeric(10,2),
    denial_reason text,
    submitted_date date,
    processed_date date,
    notes text,
    created_by_id character varying(36),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.insurance_claims OWNER TO postgres;

--
-- Name: inventory_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_items (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    category public.inventory_category NOT NULL,
    current_quantity integer DEFAULT 0 NOT NULL,
    minimum_quantity integer DEFAULT 5 NOT NULL,
    unit text NOT NULL,
    unit_cost numeric(10,2),
    supplier text,
    location text,
    description text,
    last_restocked date,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.inventory_items OWNER TO postgres;

--
-- Name: invoice_adjustments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_adjustments (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    invoice_id character varying(36) NOT NULL,
    type public.adjustment_type NOT NULL,
    amount numeric(10,2) NOT NULL,
    reason text NOT NULL,
    applied_date date NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    created_by_id character varying(36)
);


ALTER TABLE public.invoice_adjustments OWNER TO postgres;

--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_items (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    invoice_id character varying(36) NOT NULL,
    patient_treatment_id character varying(36),
    description text NOT NULL,
    quantity integer DEFAULT 1,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(10,2) NOT NULL
);


ALTER TABLE public.invoice_items OWNER TO postgres;

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    invoice_number text NOT NULL,
    patient_id character varying(36) NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    discount_type text,
    discount_value numeric(10,2),
    final_amount numeric(10,2) NOT NULL,
    paid_amount numeric(10,2) DEFAULT '0'::numeric,
    status public.invoice_status DEFAULT 'draft'::public.invoice_status,
    issued_date date NOT NULL,
    due_date date,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    created_by_id character varying(36)
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- Name: lab_cases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lab_cases (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    patient_id character varying(36) NOT NULL,
    doctor_id character varying(36),
    case_type text NOT NULL,
    lab_name text NOT NULL,
    tooth_numbers integer[],
    sent_date date NOT NULL,
    expected_return_date date,
    actual_return_date date,
    status public.lab_case_status DEFAULT 'pending'::public.lab_case_status,
    cost numeric(10,2),
    is_paid boolean DEFAULT false,
    description text,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.lab_cases OWNER TO postgres;

--
-- Name: orthodontic_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orthodontic_notes (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    patient_id character varying(36) NOT NULL,
    appointment_id character varying(36),
    stage text NOT NULL,
    notes text,
    image_urls text[],
    created_by_id character varying(36),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.orthodontic_notes OWNER TO postgres;

--
-- Name: patient_treatments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.patient_treatments (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    patient_id character varying(36) NOT NULL,
    treatment_id character varying(36) NOT NULL,
    appointment_id character varying(36),
    doctor_id character varying(36),
    status public.treatment_status DEFAULT 'planned'::public.treatment_status,
    tooth_number integer,
    price numeric(10,2) NOT NULL,
    discount_type text,
    discount_value numeric(10,2),
    scheduled_date date,
    completion_date date,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.patient_treatments OWNER TO postgres;

--
-- Name: patients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.patients (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text,
    phone text NOT NULL,
    date_of_birth date,
    gender public.gender,
    address text,
    emergency_contact text,
    emergency_phone text,
    allergies text[],
    chronic_conditions text[],
    current_medications text[],
    medical_notes text,
    insurance_provider text,
    insurance_policy_number text,
    dental_history text,
    last_visit date,
    assigned_doctor_id character varying(36),
    assigned_student_id character varying(36),
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    created_by_id character varying(36),
    photo_url text
);


ALTER TABLE public.patients OWNER TO postgres;

--
-- Name: payment_plan_installments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_plan_installments (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    payment_plan_id character varying(36) NOT NULL,
    installment_number integer NOT NULL,
    due_date date NOT NULL,
    amount numeric(10,2) NOT NULL,
    paid_amount numeric(10,2) DEFAULT '0'::numeric,
    is_paid boolean DEFAULT false,
    paid_date date,
    notes text
);


ALTER TABLE public.payment_plan_installments OWNER TO postgres;

--
-- Name: payment_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_plans (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    invoice_id character varying(36) NOT NULL,
    patient_id character varying(36) NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    down_payment numeric(10,2) DEFAULT '0'::numeric,
    number_of_installments integer NOT NULL,
    installment_amount numeric(10,2) NOT NULL,
    frequency text NOT NULL,
    start_date date NOT NULL,
    status public.payment_plan_status DEFAULT 'active'::public.payment_plan_status,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    created_by_id character varying(36)
);


ALTER TABLE public.payment_plans OWNER TO postgres;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    invoice_id character varying(36) NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_date date NOT NULL,
    payment_method public.payment_method NOT NULL,
    reference_number text,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    created_by_id character varying(36),
    payment_plan_installment_id character varying(36),
    is_refunded boolean DEFAULT false,
    refunded_at timestamp without time zone,
    refund_reason text
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: treatments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.treatments (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    category public.service_category NOT NULL,
    description text,
    default_price numeric(10,2) NOT NULL,
    duration_minutes integer DEFAULT 30,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.treatments OWNER TO postgres;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    email text,
    first_name text NOT NULL,
    last_name text NOT NULL,
    role public.user_role DEFAULT 'staff'::public.user_role NOT NULL,
    phone text,
    avatar_url text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    specialty public.doctor_specialty,
    license_number text,
    bio text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: activity_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_log (id, user_id, action, entity_type, entity_id, details, created_at) FROM stdin;
4283cad1-6661-4d7d-b079-64d098d2c0b4	e5d198fb-5de0-44bc-b0a2-441e888b7202	created	patient	15c82e7f-0569-4be2-aa35-54022e526087	Added patient patient a	2026-01-17 00:04:18.236252
950eaeb4-387d-4007-b5b3-94b039258eaf	e5d198fb-5de0-44bc-b0a2-441e888b7202	created	patient	64500664-eb71-47d7-9828-7b743a996df2	Added patient patient  b	2026-01-17 00:08:45.880071
bf9fae48-d897-4e67-9f7c-b89ac5fb1402	e5d198fb-5de0-44bc-b0a2-441e888b7202	created	lab_case	761941ff-8d95-4963-a552-9b292695af68	Created lab case for patient  b	2026-01-17 00:42:55.279975
5db81a4d-1fe8-4637-a8c8-fc57fee46426	e5d198fb-5de0-44bc-b0a2-441e888b7202	created	user	e237e588-5b38-45a0-991c-41b5da775d1a	Created user MHD TEST	2026-01-17 00:44:34.539123
07c337cc-3bfc-4d5f-add8-24cb86518a94	e5d198fb-5de0-44bc-b0a2-441e888b7202	created	appointment	f776b072-011f-4035-8200-97c7ab398f58	Scheduled appointment for patient  b	2026-01-17 03:14:26.31668
7373ba6b-f25d-4491-aa80-40b400d0f81b	e5d198fb-5de0-44bc-b0a2-441e888b7202	exported	backup	\N	Exported backup with 2 patients, 1 appointments, 2 services	2026-01-17 03:48:23.513422
3d998bff-10f2-4494-9e82-bcc81739a322	e5d198fb-5de0-44bc-b0a2-441e888b7202	created	doctor	03efbed6-c401-4e08-9e5a-d4a72a2114a6	Added doctor Ahmad Saleh	2026-01-17 04:42:02.375346
2dff2145-42dd-474d-ac50-6d41fea5da52	e5d198fb-5de0-44bc-b0a2-441e888b7202	created	patient	af45c227-7cbb-425b-b7a7-5d636c1f85e3	Added patient patient c	2026-01-17 04:43:05.450123
9066356c-bd96-46ef-ae84-b37e7c559d82	e5d198fb-5de0-44bc-b0a2-441e888b7202	created	appointment	9e8acea4-1044-4f2b-8c1c-6e223239eab0	Scheduled appointment for patient c	2026-01-18 01:33:19.611121
601a5141-d920-43bc-bf04-be47692dd5ac	c7d73612-30eb-47ce-a205-8cd8ff7067fd	created	appointment	ca53a47c-7057-4db5-88dc-5d76bd90703c	Scheduled appointment for patient c	2026-01-18 01:37:26.223114
16573e86-ace5-4ccf-9fb1-6028644b02ab	294cd3c5-e852-459c-ad7c-642296073921	created	invoice	1dcf05d2-04b8-4f1a-a7f6-fc7e2de5e82c	Created invoice INV-MKJ3IN77 for $100.00	2026-01-18 02:07:02.965561
23e98589-b65d-4bf0-9120-c2dbb07b6eb6	7461f001-b91a-4a06-8a2b-21446103bf21	created	invoice	5a5c8f46-fe6a-4c9d-b828-70b2f32aa737	Created invoice INV-MKJ3K8V6 for $250.00	2026-01-18 02:08:17.645796
bae7d478-96af-4d01-ac06-6ceac2656d87	7461f001-b91a-4a06-8a2b-21446103bf21	sent	invoice	5a5c8f46-fe6a-4c9d-b828-70b2f32aa737	Sent invoice INV-MKJ3K8V6 to patient	2026-01-18 02:08:47.520704
451b39e9-99ff-40e4-8c79-12b6bbaa72b3	14547720-7a10-42a9-93f4-1d90dda795e3	created	invoice	ddd1197a-3ef8-4719-96f3-796a704c6314	Created invoice INV-MKJ3MXTP for $200.00	2026-01-18 02:10:23.306795
91855e53-bb0c-4cf9-82e1-c46929f138fc	14547720-7a10-42a9-93f4-1d90dda795e3	sent	invoice	ddd1197a-3ef8-4719-96f3-796a704c6314	Sent invoice INV-MKJ3MXTP to patient	2026-01-18 02:10:23.329761
e6228409-fa27-4d17-842e-7880f1664a9c	14547720-7a10-42a9-93f4-1d90dda795e3	created	payment	589db757-842e-45eb-b74f-17605f8c0506	Recorded payment of $200.00	2026-01-18 02:11:50.869176
7169b99e-7edd-4568-97ba-a6f99a2faeff	d72084d6-4d33-42ea-bddf-d8a30259ae36	created	invoice	bf8dbd64-33d7-46a9-813b-39210fdc9184	Created invoice INV-MKJ3QVEB for $100.00	2026-01-18 02:13:26.814027
b799b716-78ff-474a-9d67-c0080507129c	d72084d6-4d33-42ea-bddf-d8a30259ae36	voided	invoice	bf8dbd64-33d7-46a9-813b-39210fdc9184	Voided invoice INV-MKJ3QVEB	2026-01-18 02:14:04.771462
8a742920-8e51-4e19-84ca-f801990508b7	e5d198fb-5de0-44bc-b0a2-441e888b7202	sent	invoice	1dcf05d2-04b8-4f1a-a7f6-fc7e2de5e82c	Sent invoice INV-MKJ3IN77 to patient	2026-01-18 02:43:33.001318
f028c449-9c29-428d-bc4f-8a45a74a129c	e5d198fb-5de0-44bc-b0a2-441e888b7202	created	payment	c3a3f102-f062-4bd4-82e7-19f5958da568	Recorded payment of $500.00	2026-01-18 02:45:18.163602
cc459bc3-cdd5-4c27-b6c4-619b9b63bc59	e5d198fb-5de0-44bc-b0a2-441e888b7202	created	invoice	e48ff0a8-af54-463d-984c-2851bd609095	Created invoice INV-MKJ4Y6HZ for $1140.00	2026-01-18 02:47:07.407566
2c2539fb-9599-420b-8fa2-0a24e682777e	e5d198fb-5de0-44bc-b0a2-441e888b7202	sent	invoice	e48ff0a8-af54-463d-984c-2851bd609095	Sent invoice INV-MKJ4Y6HZ to patient	2026-01-18 02:47:20.680564
fbe2cc53-a239-4a6c-9467-9da78b7503b8	e5d198fb-5de0-44bc-b0a2-441e888b7202	created	payment	5da1b054-e4ac-441a-9c4e-e01ae0341ad8	Recorded payment of $500.00	2026-01-18 02:47:49.065683
85d0c586-1744-4e8e-bfed-b751569f4f13	e5d198fb-5de0-44bc-b0a2-441e888b7202	created	payment	7de7c034-933b-4a1c-9b14-b6205fcb4f9d	Recorded payment of $400.00	2026-01-18 02:48:07.831896
147bf03d-a50d-42b8-be43-9e32aeeddf64	e5d198fb-5de0-44bc-b0a2-441e888b7202	created	payment	2b56c2b9-8a17-4f2b-88d0-14dc9ee65cdb	Recorded payment of $240.00	2026-01-18 02:48:25.42492
8966b7d4-397c-42c1-9136-35a18f2e3087	e5d198fb-5de0-44bc-b0a2-441e888b7202	deleted	user	54f789d2-4eec-40b3-ba88-b018d538e2e8	Deleted user Mobile Tester	2026-01-18 03:34:56.358267
c881a373-4bdd-4d9f-b851-63945625b559	e5d198fb-5de0-44bc-b0a2-441e888b7202	updated	user	7461f001-b91a-4a06-8a2b-21446103bf21	Updated user Finance Tester	2026-01-18 03:35:10.215931
1cb0d739-f46c-4677-8594-b89357b501f1	e5d198fb-5de0-44bc-b0a2-441e888b7202	deleted	user	235faa3e-5f8e-4130-afc9-8b83b9107643	Deleted user asdf1234 asdf1234	2026-01-18 03:35:19.394619
74bef744-f353-49fa-bb8b-bccf08caa0b5	7b8b13fc-fa1d-4895-9893-cfddcb25e967	created	expense	d8bddd8e-f5af-4fe4-982d-638e54aa896b	Created expense: Test Office Supplies fCaS01 ($150.00)	2026-01-18 03:58:45.808321
e1f5a293-b5e8-4a29-8a29-332239638bc8	7b8b13fc-fa1d-4895-9893-cfddcb25e967	created	expense	d0d6dd7c-5863-4599-ab19-28e93cad8c84	Created expense: Fixed Query Test H2dCM- ($75.50)	2026-01-18 04:02:43.438953
7a561298-4771-456b-a89a-17661e6eba6a	e5d198fb-5de0-44bc-b0a2-441e888b7202	updated	user	e237e588-5b38-45a0-991c-41b5da775d1a	Updated user MHD TEST	2026-01-18 04:55:05.943901
\.


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.appointments (id, patient_id, doctor_id, title, start_time, end_time, status, category, notes, created_at, created_by_id) FROM stdin;
ca53a47c-7057-4db5-88dc-5d76bd90703c	af45c227-7cbb-425b-b7a7-5d636c1f85e3	\N	E2E Test Appt	2026-01-18 14:00:00	2026-01-18 14:30:00	pending	checkup	\N	2026-01-18 01:37:26.217805	c7d73612-30eb-47ce-a205-8cd8ff7067fd
9e8acea4-1044-4f2b-8c1c-6e223239eab0	af45c227-7cbb-425b-b7a7-5d636c1f85e3	\N	Test Appointment	2026-01-18 14:00:00	2026-01-18 14:30:00	completed	checkup	\N	2026-01-18 01:33:19.514613	e5d198fb-5de0-44bc-b0a2-441e888b7202
f776b072-011f-4035-8200-97c7ab398f58	64500664-eb71-47d7-9828-7b743a996df2	\N	561	2026-01-17 12:00:00	2026-01-17 12:30:00	pending	checkup	\N	2026-01-17 03:14:26.310724	e5d198fb-5de0-44bc-b0a2-441e888b7202
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, patient_id, file_name, file_type, file_url, file_size, category, description, uploaded_by_id, created_at) FROM stdin;
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id, description, category, amount, expense_date, vendor, reference_number, notes, receipt_url, is_recurring, recurring_frequency, created_by_id, created_at) FROM stdin;
d8bddd8e-f5af-4fe4-982d-638e54aa896b	Test Office Supplies fCaS01	supplies	150.00	2026-01-18	Office Depot			\N	f		7b8b13fc-fa1d-4895-9893-cfddcb25e967	2026-01-18 03:58:45.772146
d0d6dd7c-5863-4599-ab19-28e93cad8c84	Fixed Query Test H2dCM-	utilities	75.50	2026-01-18	Electric Company			\N	f		7b8b13fc-fa1d-4895-9893-cfddcb25e967	2026-01-18 04:02:43.434628
\.


--
-- Data for Name: insurance_claims; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.insurance_claims (id, claim_number, patient_id, invoice_id, insurance_provider, policy_number, subscriber_name, subscriber_dob, subscriber_relation, status, claim_amount, approved_amount, paid_amount, denial_reason, submitted_date, processed_date, notes, created_by_id, created_at) FROM stdin;
9099ce3d-291c-4e08-a4c2-04927bc188ba	CLM-2026-00001	af45c227-7cbb-425b-b7a7-5d636c1f85e3	\N	Blue Cross	POL-123	\N	\N	\N	draft	1500.00	\N	\N	\N	\N	\N	\N	e5d198fb-5de0-44bc-b0a2-441e888b7202	2026-01-18 04:41:07.375314
\.


--
-- Data for Name: inventory_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_items (id, name, category, current_quantity, minimum_quantity, unit, unit_cost, supplier, location, description, last_restocked, created_at) FROM stdin;
\.


--
-- Data for Name: invoice_adjustments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoice_adjustments (id, invoice_id, type, amount, reason, applied_date, created_at, created_by_id) FROM stdin;
\.


--
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoice_items (id, invoice_id, patient_treatment_id, description, quantity, unit_price, total_price) FROM stdin;
7e3b4be5-4dfb-4ed8-b3d7-63f543cdaf60	1dcf05d2-04b8-4f1a-a7f6-fc7e2de5e82c	\N	Test Service	1	100.00	100.00
6991260d-8f8d-4678-a27f-6ae36caebb78	5a5c8f46-fe6a-4c9d-b828-70b2f32aa737	\N	Root Canal Treatment	1	250.00	250.00
27f8b391-624d-44ca-8b10-5f796a1da945	ddd1197a-3ef8-4719-96f3-796a704c6314	\N	Dental Filling	1	200.00	200.00
5dce7020-269f-4d36-9ec9-784b1391fbc1	bf8dbd64-33d7-46a9-813b-39210fdc9184	\N	Consultation Fee	1	100.00	100.00
ac9e7889-888c-475f-b75d-a424d28c1639	e48ff0a8-af54-463d-984c-2851bd609095	\N	implant	1	1200.00	1200.00
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (id, invoice_number, patient_id, total_amount, discount_type, discount_value, final_amount, paid_amount, status, issued_date, due_date, notes, created_at, created_by_id) FROM stdin;
ddd1197a-3ef8-4719-96f3-796a704c6314	INV-MKJ3MXTP	af45c227-7cbb-425b-b7a7-5d636c1f85e3	200.00	\N	\N	200.00	200.00	paid	2026-01-18	\N	\N	2026-01-18 02:10:23.295183	14547720-7a10-42a9-93f4-1d90dda795e3
bf8dbd64-33d7-46a9-813b-39210fdc9184	INV-MKJ3QVEB	af45c227-7cbb-425b-b7a7-5d636c1f85e3	100.00	\N	\N	100.00	0.00	canceled	2026-01-18	\N	\N	2026-01-18 02:13:26.774285	d72084d6-4d33-42ea-bddf-d8a30259ae36
1dcf05d2-04b8-4f1a-a7f6-fc7e2de5e82c	INV-MKJ3IN77	af45c227-7cbb-425b-b7a7-5d636c1f85e3	100.00	\N	\N	100.00	0.00	sent	2026-01-18	\N	\N	2026-01-18 02:07:02.901573	294cd3c5-e852-459c-ad7c-642296073921
5a5c8f46-fe6a-4c9d-b828-70b2f32aa737	INV-MKJ3K8V6	af45c227-7cbb-425b-b7a7-5d636c1f85e3	250.00	\N	\N	250.00	500.00	paid	2026-01-18	\N	\N	2026-01-18 02:08:17.63723	7461f001-b91a-4a06-8a2b-21446103bf21
e48ff0a8-af54-463d-984c-2851bd609095	INV-MKJ4Y6HZ	15c82e7f-0569-4be2-aa35-54022e526087	1200.00	percentage	5.00	1140.00	1140.00	paid	2026-01-18	2026-03-09	should be paid 3 payments\n	2026-01-18 02:47:07.36822	e5d198fb-5de0-44bc-b0a2-441e888b7202
\.


--
-- Data for Name: lab_cases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lab_cases (id, patient_id, doctor_id, case_type, lab_name, tooth_numbers, sent_date, expected_return_date, actual_return_date, status, cost, is_paid, description, notes, created_at) FROM stdin;
761941ff-8d95-4963-a552-9b292695af68	64500664-eb71-47d7-9828-7b743a996df2	\N	Crown	mhd	\N	2026-01-17	\N	\N	pending	500.00	f	\N	\N	2026-01-17 00:42:55.273954
\.


--
-- Data for Name: orthodontic_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orthodontic_notes (id, patient_id, appointment_id, stage, notes, image_urls, created_by_id, created_at) FROM stdin;
\.


--
-- Data for Name: patient_treatments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.patient_treatments (id, patient_id, treatment_id, appointment_id, doctor_id, status, tooth_number, price, discount_type, discount_value, scheduled_date, completion_date, notes, created_at) FROM stdin;
b6edccce-1352-41d7-9cb3-9b15b00802b8	64500664-eb71-47d7-9828-7b743a996df2	570b5673-f958-4440-994f-d13fe889ca0e	\N	\N	planned	12	2500.00	\N	\N	\N	\N		2026-01-17 03:12:40.289164
e9d58169-316b-470c-a179-3f9ff6723bf2	64500664-eb71-47d7-9828-7b743a996df2	570b5673-f958-4440-994f-d13fe889ca0e	\N	\N	in_progress	14	2500.00	\N	\N	\N	\N		2026-01-17 03:12:54.737877
a934f0e7-baad-47cd-aaf3-7957e839fd59	af45c227-7cbb-425b-b7a7-5d636c1f85e3	fe4eb51b-dc19-4d7c-acca-541749edbf37	\N	\N	planned	12	15000.00	\N	\N	\N	\N		2026-01-17 04:43:28.755519
3df329d5-2dbe-40fa-8a3b-c5167e462b4e	64500664-eb71-47d7-9828-7b743a996df2	fe4eb51b-dc19-4d7c-acca-541749edbf37	\N	\N	planned	41	15000.00	\N	\N	\N	\N		2026-01-17 20:51:54.196797
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.patients (id, first_name, last_name, email, phone, date_of_birth, gender, address, emergency_contact, emergency_phone, allergies, chronic_conditions, current_medications, medical_notes, insurance_provider, insurance_policy_number, dental_history, last_visit, assigned_doctor_id, assigned_student_id, notes, created_at, created_by_id, photo_url) FROM stdin;
15c82e7f-0569-4be2-aa35-54022e526087	patient	a	ahmed.sa.569@gmail.com	0100000000	2000-01-17	male	شارع 42	Ahmad Saleh	+201096889713	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-17 00:04:18.218935	e5d198fb-5de0-44bc-b0a2-441e888b7202	\N
64500664-eb71-47d7-9828-7b743a996df2	patient 	b	\N	0100000001	2000-01-01	male	\N	\N	\N	{Penicillin,NSAIDs}	{Diabetes,Hypertension}	{DDS}	DDS	\N	\N	\N	\N	\N	\N	\N	2026-01-17 00:08:45.872457	e5d198fb-5de0-44bc-b0a2-441e888b7202	\N
af45c227-7cbb-425b-b7a7-5d636c1f85e3	patient	c	\N	010000003	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	03efbed6-c401-4e08-9e5a-d4a72a2114a6	\N	\N	2026-01-17 04:43:05.411694	e5d198fb-5de0-44bc-b0a2-441e888b7202	\N
\.


--
-- Data for Name: payment_plan_installments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_plan_installments (id, payment_plan_id, installment_number, due_date, amount, paid_amount, is_paid, paid_date, notes) FROM stdin;
\.


--
-- Data for Name: payment_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_plans (id, invoice_id, patient_id, total_amount, down_payment, number_of_installments, installment_amount, frequency, start_date, status, notes, created_at, created_by_id) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at, created_by_id, payment_plan_installment_id, is_refunded, refunded_at, refund_reason) FROM stdin;
589db757-842e-45eb-b74f-17605f8c0506	ddd1197a-3ef8-4719-96f3-796a704c6314	200.00	2026-01-18	cash	\N	\N	2026-01-18 02:11:50.855608	14547720-7a10-42a9-93f4-1d90dda795e3	\N	f	\N	\N
c3a3f102-f062-4bd4-82e7-19f5958da568	5a5c8f46-fe6a-4c9d-b828-70b2f32aa737	500.00	2026-01-18	cash	\N	\N	2026-01-18 02:45:18.153272	e5d198fb-5de0-44bc-b0a2-441e888b7202	\N	f	\N	\N
5da1b054-e4ac-441a-9c4e-e01ae0341ad8	e48ff0a8-af54-463d-984c-2851bd609095	500.00	2026-01-18	cash	\N	\N	2026-01-18 02:47:49.016704	e5d198fb-5de0-44bc-b0a2-441e888b7202	\N	f	\N	\N
7de7c034-933b-4a1c-9b14-b6205fcb4f9d	e48ff0a8-af54-463d-984c-2851bd609095	400.00	2026-01-18	cash	\N	\N	2026-01-18 02:48:07.823793	e5d198fb-5de0-44bc-b0a2-441e888b7202	\N	f	\N	\N
2b56c2b9-8a17-4f2b-88d0-14dc9ee65cdb	e48ff0a8-af54-463d-984c-2851bd609095	240.00	2026-01-18	cash	\N	\N	2026-01-18 02:48:25.370932	e5d198fb-5de0-44bc-b0a2-441e888b7202	\N	f	\N	\N
\.


--
-- Data for Name: treatments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.treatments (id, code, name, category, description, default_price, duration_minutes, is_active, created_at) FROM stdin;
570b5673-f958-4440-994f-d13fe889ca0e	SVC-MKHKGPAH	Root Canal Treatment	endodontics	Molar RCT	2500.00	60	t	2026-01-17 00:25:53.418594
fe4eb51b-dc19-4d7c-acca-541749edbf37	SVC-MKHL0JJD	Implant	surgery	Implant	15000.00	60	t	2026-01-17 00:41:19.082042
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_sessions (sid, sess, expire) FROM stdin;
xGQG2mXiKHYTKGU03OO8h_kZK5JbUESs	{"cookie":{"originalMaxAge":86400000,"expires":"2026-01-19T04:45:39.087Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":"e5d198fb-5de0-44bc-b0a2-441e888b7202"}}	2026-01-19 04:45:53
epihpHxv5q-OYwFbB3j-hr3Jf4uvlygE	{"cookie":{"originalMaxAge":86400000,"expires":"2026-01-19T04:25:31.212Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":"e5d198fb-5de0-44bc-b0a2-441e888b7202"}}	2026-01-19 04:25:56
8LrDwYXZuS-Z1K73pWnm6vr94kXmp22_	{"cookie":{"originalMaxAge":86400000,"expires":"2026-01-19T04:38:15.854Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":"e5d198fb-5de0-44bc-b0a2-441e888b7202"}}	2026-01-19 04:39:38
B7dDlf4mmeM5S-FuzovBLS3Tl408g5dn	{"cookie":{"originalMaxAge":86400000,"expires":"2026-01-19T04:54:13.406Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":"e5d198fb-5de0-44bc-b0a2-441e888b7202"}}	2026-01-19 20:54:36
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password, email, first_name, last_name, role, phone, avatar_url, is_active, created_at, specialty, license_number, bio) FROM stdin;
e5d198fb-5de0-44bc-b0a2-441e888b7202	JTest	$2b$10$REQcw8cpAMBcBSNc7vn9auyEbUTjiqYt9Akna90aK3s.wzWIm4Xuu	ahmed.loka.569@gmail.com	John	Test	admin	\N	\N	t	2026-01-16 23:59:43.758158	\N	\N	\N
febf57ae-7af3-4641-94d1-bc4fcd1088ff	testuserKCUpZb	$2b$10$7V2cezf1TD.AJnrREdUD.OABVc8B2NdAHSCnzadp73w2UdARN27Qa	testKCUpZb@example.com	Test	User	staff	\N	\N	t	2026-01-17 03:39:00.429795	\N	\N	\N
85f75a62-525b-4472-8c0b-1123221077dc	e2e_tester	$2b$10$DPLAtDM64LzQ1XAsTXN...80N1UHFezTfs/99R1ofcb7IW9tGCyIu	e2e.tester@example.com	E2E	Tester	staff	\N	\N	t	2026-01-17 04:28:21.898449	\N	\N	\N
03efbed6-c401-4e08-9e5a-d4a72a2114a6	AhmedSaleh	$2b$10$iFXwuxqw7IUSCLy8k6leQO/LAkAUBEStz76dVSYiVTahFfEYCjdZS	ahmed.sa.569@gmail.com	Ahmad	Saleh	doctor	01096889713	\N	t	2026-01-17 04:42:02.328091	oral_surgery	123456789	
c7d73612-30eb-47ce-a205-8cd8ff7067fd	testuser_fzFXmZ	$2b$10$JM.q62HafrD/og9aTf1Wh.u9SMjc9pr/.T.E9vc2J9C5Z0IzCOtpG	testuser_fzFXmZ@example.com	Test	User	staff	\N	\N	t	2026-01-18 01:36:28.020201	\N	\N	\N
e55fb9a3-102d-4b64-839b-7bf39c16ae9a	asd123	$2b$10$LpXR7BCww/zAyXOpYq.EFebp7smegzw.dyfV9cHJf4UPBHYFmPolu	\N	Test	Bist	staff	\N	\N	t	2026-01-18 01:44:29.189484	\N	\N	\N
dd499a6c-b7e6-4e02-81cd-302b8b80e918	asdf1234	$2b$10$b5uzXe7bRiDKQ2hnAqvsiOyxaztTPin7otO/kGmYl0p1j1jHTAB/W	\N	test	fist	staff	\N	\N	t	2026-01-18 01:45:10.046806	\N	\N	\N
294cd3c5-e852-459c-ad7c-642296073921	Qjdif-_testuser	$2b$10$Hpic92kA1N9zg8C5N6DGp.vGzrH8hkNncGyaRwKWUM4ykKzYO1Iq2	Qjdif-_testuser@example.com	Test	User	staff	\N	\N	t	2026-01-18 02:06:20.599949	\N	\N	\N
14547720-7a10-42a9-93f4-1d90dda795e3	E3fp0S_paytest	$2b$10$mJ03sZp4opsp.Q7D1rkkzuM5Cw7.juzYDg6ODujqGfqDu9YA.X/b.	\N	Payment	Tester	staff	\N	\N	t	2026-01-18 02:10:06.084501	\N	\N	\N
d72084d6-4d33-42ea-bddf-d8a30259ae36	CPSCFM_voidtest	$2b$10$QMLHdfpG3BPP/TJcxwfqB.kktVwO8frIOMQJsPswv5BjMuq9HduSq	CPSCFM_voidtest@example.com	Void	Tester	staff	\N	\N	t	2026-01-18 02:12:52.243121	\N	\N	\N
7461f001-b91a-4a06-8a2b-21446103bf21	wUEur__fintest	$2b$10$gmy8BePU/jfZD6yhGrmao./nUEQeJDmDmfFtQ18k7V5Sz4Cg8r7um	\N	Finance	Tester	admin	\N	\N	t	2026-01-18 02:07:59.545004	\N	\N	\N
7b8b13fc-fa1d-4895-9893-cfddcb25e967	testadmin	$2b$10$WkVd4Aha42fFm8vvI2fjWehyDwYgpi7CuGeTdMs.GyuailFjqom8u	testadmin@dentalclinic.com	Test	Admin	admin	\N	\N	t	2026-01-18 03:56:25.434239	\N	\N	\N
400f0e0c-20ce-4775-808f-77e9449e89d2	admin	admin123	\N	admin	admin	admin	\N	\N	t	2026-01-18 04:43:45.113536	\N	\N	\N
e237e588-5b38-45a0-991c-41b5da775d1a	MHD TEST	$2b$10$1C9dKkB0RZH4PPdnTmo6seKJW0VgDE7CmcA.EBOC11GFzOBKRNas2	ahmed.sa.569@gmail.com	MHD	TEST	student	+201096889713	\N	f	2026-01-17 00:44:34.522365	\N	\N	\N
\.


--
-- Name: activity_log activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: insurance_claims insurance_claims_claim_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurance_claims
    ADD CONSTRAINT insurance_claims_claim_number_unique UNIQUE (claim_number);


--
-- Name: insurance_claims insurance_claims_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurance_claims
    ADD CONSTRAINT insurance_claims_pkey PRIMARY KEY (id);


--
-- Name: inventory_items inventory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);


--
-- Name: invoice_adjustments invoice_adjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_adjustments
    ADD CONSTRAINT invoice_adjustments_pkey PRIMARY KEY (id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_invoice_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_unique UNIQUE (invoice_number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: lab_cases lab_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lab_cases
    ADD CONSTRAINT lab_cases_pkey PRIMARY KEY (id);


--
-- Name: orthodontic_notes orthodontic_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orthodontic_notes
    ADD CONSTRAINT orthodontic_notes_pkey PRIMARY KEY (id);


--
-- Name: patient_treatments patient_treatments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_treatments
    ADD CONSTRAINT patient_treatments_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: payment_plan_installments payment_plan_installments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_plan_installments
    ADD CONSTRAINT payment_plan_installments_pkey PRIMARY KEY (id);


--
-- Name: payment_plans payment_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_plans
    ADD CONSTRAINT payment_plans_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: user_sessions session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: treatments treatments_code_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.treatments
    ADD CONSTRAINT treatments_code_unique UNIQUE (code);


--
-- Name: treatments treatments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.treatments
    ADD CONSTRAINT treatments_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_session_expire" ON public.user_sessions USING btree (expire);


--
-- Name: activity_log activity_log_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: appointments appointments_doctor_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_doctor_id_users_id_fk FOREIGN KEY (doctor_id) REFERENCES public.users(id);


--
-- Name: appointments appointments_patient_id_patients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_patient_id_patients_id_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: documents documents_patient_id_patients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_patient_id_patients_id_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: expenses expenses_created_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_created_by_id_users_id_fk FOREIGN KEY (created_by_id) REFERENCES public.users(id);


--
-- Name: insurance_claims insurance_claims_created_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurance_claims
    ADD CONSTRAINT insurance_claims_created_by_id_users_id_fk FOREIGN KEY (created_by_id) REFERENCES public.users(id);


--
-- Name: insurance_claims insurance_claims_invoice_id_invoices_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurance_claims
    ADD CONSTRAINT insurance_claims_invoice_id_invoices_id_fk FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);


--
-- Name: insurance_claims insurance_claims_patient_id_patients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurance_claims
    ADD CONSTRAINT insurance_claims_patient_id_patients_id_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: invoice_adjustments invoice_adjustments_invoice_id_invoices_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_adjustments
    ADD CONSTRAINT invoice_adjustments_invoice_id_invoices_id_fk FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);


--
-- Name: invoice_items invoice_items_invoice_id_invoices_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_invoices_id_fk FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);


--
-- Name: invoices invoices_patient_id_patients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_patient_id_patients_id_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: lab_cases lab_cases_doctor_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lab_cases
    ADD CONSTRAINT lab_cases_doctor_id_users_id_fk FOREIGN KEY (doctor_id) REFERENCES public.users(id);


--
-- Name: lab_cases lab_cases_patient_id_patients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lab_cases
    ADD CONSTRAINT lab_cases_patient_id_patients_id_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: orthodontic_notes orthodontic_notes_patient_id_patients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orthodontic_notes
    ADD CONSTRAINT orthodontic_notes_patient_id_patients_id_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: patient_treatments patient_treatments_doctor_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_treatments
    ADD CONSTRAINT patient_treatments_doctor_id_users_id_fk FOREIGN KEY (doctor_id) REFERENCES public.users(id);


--
-- Name: patient_treatments patient_treatments_patient_id_patients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_treatments
    ADD CONSTRAINT patient_treatments_patient_id_patients_id_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: patient_treatments patient_treatments_treatment_id_treatments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_treatments
    ADD CONSTRAINT patient_treatments_treatment_id_treatments_id_fk FOREIGN KEY (treatment_id) REFERENCES public.treatments(id);


--
-- Name: payment_plan_installments payment_plan_installments_payment_plan_id_payment_plans_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_plan_installments
    ADD CONSTRAINT payment_plan_installments_payment_plan_id_payment_plans_id_fk FOREIGN KEY (payment_plan_id) REFERENCES public.payment_plans(id);


--
-- Name: payment_plans payment_plans_invoice_id_invoices_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_plans
    ADD CONSTRAINT payment_plans_invoice_id_invoices_id_fk FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);


--
-- Name: payment_plans payment_plans_patient_id_patients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_plans
    ADD CONSTRAINT payment_plans_patient_id_patients_id_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: payments payments_invoice_id_invoices_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_invoice_id_invoices_id_fk FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 3vdtndvwfTflUAcWujZaESQpKytAcc17P8hVAg90aBu31ybj1Pg18gsgCedzfNd

