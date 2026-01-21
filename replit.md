# Dental Clinic Management System

## Overview

A comprehensive dental clinic management system designed for single-clinic operations. The application provides patient management, appointment scheduling, treatment tracking, financial management, inventory control, and lab work coordination. Built as a full-stack TypeScript application with a React frontend and Express backend, using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite bundler
- **Routing**: Wouter for client-side navigation with protected routes
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme system supporting light/dark modes and multiple color schemes
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Passport.js with local strategy, session-based auth stored in PostgreSQL
- **API Design**: RESTful endpoints under `/api/*` prefix
- **Build System**: Vite for development with HMR, esbuild for production server bundling

### Data Layer
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` - contains all table definitions using Drizzle's PostgreSQL adapter
- **Migrations**: Drizzle Kit with push-based schema updates (`npm run db:push`)
- **Validation**: Drizzle-Zod for automatic schema-to-validation inference

### Role-Based Access Control
The system supports four user roles with different permission levels:
- **Admin**: Full system access
- **Doctor**: Patient management, appointments, treatments
- **Staff**: Basic patient and scheduling operations
- **Student**: Limited access under supervision

### Key Domain Entities
- **Patients**: Personal info, medical history, assigned doctor/student
- **Appointments**: Scheduling with categories (new visit, follow-up, surgery, etc.) and statuses
- **Treatments**: Service catalog with categories (endodontics, restorative, preventative, etc.)
- **Patient Treatments**: Treatment plans linked to specific teeth with status tracking
- **Invoices/Payments**: Financial tracking per patient
- **Inventory**: Stock management with low-stock alerts
- **Lab Cases**: External lab work coordination
- **Documents**: Patient file storage (X-rays, reports, consent forms)

### Project Structure
```
├── client/           # React frontend
│   ├── src/
│   │   ├── components/   # UI components including shadcn/ui
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities and query client
│   │   └── pages/        # Route components
├── server/           # Express backend
│   ├── auth.ts       # Authentication setup
│   ├── db.ts         # Database connection
│   ├── routes.ts     # API route definitions
│   └── storage.ts    # Data access layer
├── shared/           # Shared types and schema
│   └── schema.ts     # Drizzle schema definitions
└── migrations/       # Database migrations
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database via `DATABASE_URL` environment variable
- **connect-pg-simple**: Session storage in PostgreSQL

### Core Libraries
- **Drizzle ORM**: Type-safe database queries and schema management
- **bcrypt**: Password hashing for authentication
- **express-session**: Server-side session management
- **Passport.js**: Authentication middleware

### Frontend Libraries
- **@tanstack/react-query**: Data fetching and caching
- **Radix UI**: Accessible component primitives (dialog, dropdown, tabs, etc.)
- **date-fns**: Date manipulation
- **Recharts**: Data visualization
- **Lucide React**: Icon library
- **class-variance-authority**: Component variant management
- **react-day-picker**: Calendar component

### Development Tools
- **Vite**: Development server and build tool
- **tsx**: TypeScript execution for server
- **drizzle-kit**: Database migration tooling

## Recent Changes

### User Management Enhancements (January 2026)
- Added edit user functionality with EditUserDialog (firstName, lastName, email, phone, role)
- Added activate/deactivate user toggle in dropdown menu
- Added delete user option with confirmation
- Profile picture in sidebar footer now clickable - links to Settings > Users tab
- API endpoints: PATCH /api/users/:id, DELETE /api/users/:id (admin only)
- Protection against self-deletion and self-deactivation

### Phase 2 Financial System (January 2026)
- Payment refunds: RefundPaymentDialog with reason tracking, updates invoice balance
- Payment plans: CreatePaymentPlanDialog with weekly/biweekly/monthly frequency options
- Invoice adjustments: AdjustmentDialog for discounts, write-offs, fees, corrections
- Enhanced InvoiceDetailsDialog shows refunded payments with badges and refund buttons

### Dashboard Widget Customization (January 2026)
- Implemented slot-based widget system for the dashboard
- Widget slots: header, fullWidth, main (2/3 width), sidebar (1/3 width)
- Users can toggle widgets on/off and reorder within each slot
- Preferences persisted to localStorage ("dashboard-widgets-config-v2")
- Available widgets: Clock, Statistics Cards, Today's Appointments, Quick Actions, Recent Activity, Low Stock Alerts

### Patient Photo Upload (January 2026)
- Added base64-encoded photo storage in patients.photoUrl field
- 5MB client-side limit with JPEG/PNG/GIF/WebP support
- Hover-to-upload interface on patient detail page
- Role-based access: admin, doctor, and staff only (students blocked)

### Patient Financial Breakdown (January 2026)
- New Financials tab on patient detail page
- Shows total cost, total paid, and balance summary
- Breakdown by treatment category with progress bars
- Invoice and payment history lists with status indicators

### Doctors Management (January 2026)
- Dedicated Doctors page with CRUD operations (admin only for create/edit/delete)
- Specialty multi-select from predefined list
- Grid display with doctor cards showing specialties and contact info

### Phase 3 Financial System - Reports & Expenses (January 2026)
- **Financial Reports Page** (`/reports`) - admin only
  - Revenue report with monthly breakdown and line charts
  - AR Aging report showing outstanding balances by age bucket (Current, 1-30, 31-60, 61-90, 90+ days)
  - Production by doctor report with pie charts
  - Expense report with category breakdown
  - Period selector (This Month, Last Month, Last 3 Months, This Year, Last 12 Months)
- **Expense Tracking Page** (`/expenses`) - admin only
  - Full CRUD for clinic expenses
  - 12 expense categories: supplies, equipment, lab_fees, utilities, rent, salaries, marketing, insurance, maintenance, software, training, other
  - Category filtering and recurring expense support
  - API endpoints: GET/POST/PATCH/DELETE /api/expenses
- **Report API Endpoints** (admin only):
  - GET /api/reports/revenue?startDate=&endDate=
  - GET /api/reports/ar-aging
  - GET /api/reports/production-by-doctor?startDate=&endDate=
  - GET /api/reports/expenses?startDate=&endDate=

### Phase 4 Financial System - Insurance Claims (January 2026)
- **Insurance Claims Page** (`/insurance-claims`) - admin, doctor, staff access
  - Full CRUD for insurance claim submissions
  - Auto-generated claim numbers (CLM-YYYY-#####)
  - 7 claim statuses: draft, submitted, pending, approved, denied, paid, appealed
  - Link claims to patients and invoices
  - Subscriber information support (for when patient is not the policyholder)
  - Status workflow: draft → submitted → pending → approved/denied → paid
  - Update status with approved/paid amounts and denial reasons
  - Summary statistics: total claims, pending, approved, pending amount
- **API Endpoints** (admin/doctor/staff):
  - GET /api/insurance-claims - list claims with status/patientId filters
  - GET /api/insurance-claims/:id - get single claim
  - POST /api/insurance-claims - create claim (auto-generates claim number)
  - PATCH /api/insurance-claims/:id - update claim
  - DELETE /api/insurance-claims/:id - delete claim (admin only)

### Audit Logs System (January 2026)
- **Immutable, Append-Only Audit Trail** - Uses dedicated `audit_logs` table (not activity_log)
  - Tamper-proof design: logs cannot be modified or deleted via API
  - Captures user role at time of action for historical accuracy
  - Records IP address for security tracking
  - JSON diff storage: previousValue and newValue for full change history
- **Admin-Only Audit Logs Page** (`/audit-logs`)
  - Advanced filtering: user, action type (CREATE/UPDATE/DELETE), entity type, date range
  - Expandable rows showing full JSON diff of changes
  - CSV export and print functionality
  - Summary statistics with entry count
- **Comprehensive Audit Logging** across all major operations:
  - Patients: create, update, delete
  - Appointments: create, update
  - Inventory: create, update
  - Lab Cases: create, update
  - Invoices: create
  - Payments: create
  - Expenses: create
- **API Endpoints** (admin only):
  - GET /api/audit-logs - list with filters (userId, actionType, entityType, startDate, endDate)
  - GET /api/audit-logs/users - get users for filter dropdown
- **Database Schema** (`audit_logs` table):
  - id, userId, userRole, actionType, entityType, entityId
  - previousValue (JSONB), newValue (JSONB), description, ipAddress, timestamp

### Clinic Settings & Room Management (January 2026)
- **Clinic Settings** (Settings > Clinic tab)
  - Basic info: clinic name, phone, email, website, address
  - Logo upload with base64 encoding (max 2MB)
  - Individual social media fields: Facebook, Instagram, Twitter/X, LinkedIn, YouTube, TikTok
  - Admin-only editing, view for all authenticated users
- **Room Management**
  - CRUD for clinic rooms (admin only)
  - Rooms list with edit/delete dropdown menu
  - Add/edit room dialogs with name and description
  - Soft delete (isActive flag) to preserve historical data
- **Appointment Room Assignment**
  - Room selection dropdown in Add Appointment dialog
  - Rooms stored as roomNumber (integer) in appointments table
- **API Endpoints**:
  - GET/PATCH /api/clinic-settings (authenticated/admin)
  - GET/POST /api/clinic-rooms (authenticated/admin for create)
  - PATCH/DELETE /api/clinic-rooms/:id (admin only)
- **Database Tables**:
  - clinic_settings: singleton for clinic configuration
  - clinic_rooms: room entries with name, description, isActive

### External Labs & Lab Services Management (January 2026)
- **External Labs Page** (`/lab-work` - "Manage Labs" tab)
  - Full CRUD for external dental labs (admin only for create/edit/delete)
  - Lab details: name, phone, email, address, contact person
  - Soft delete (isActive flag) to preserve historical data
  - Labs displayed in card grid with services per lab
- **Lab Services Management**
  - CRUD for lab-specific services with pricing
  - Services tied to specific labs via foreign key
  - Service details: name, description, price
- **Lab Case Integration**
  - Lab case creation now selects from database of labs
  - Service selection auto-populates case type and cost
  - Lab cases reference externalLabId and labServiceId
- **API Endpoints**:
  - GET /api/external-labs (authenticated)
  - POST /api/external-labs (admin only)
  - PATCH/DELETE /api/external-labs/:id (admin only)
  - GET /api/external-labs/:id/services (authenticated)
  - GET /api/lab-services (authenticated)
  - POST /api/lab-services (admin only)
  - PATCH/DELETE /api/lab-services/:id (admin only)
- **Database Tables**:
  - external_labs: lab entries with contact info and isActive flag
  - lab_services: service entries with labId, name, description, price, isActive