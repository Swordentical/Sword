# GLAZER - Dental Clinic Management System
## By Dr. Ahmad Saleh

## Overview

GLAZER is a comprehensive, full-stack TypeScript application designed for single-clinic dental operations. Its primary purpose is to streamline patient management, appointment scheduling, treatment tracking, financial operations, inventory control, and lab work coordination. The system aims to enhance efficiency and organization within a dental practice, offering a robust solution for managing all aspects of clinic operations. Key capabilities include managing patient profiles, scheduling and tracking appointments, overseeing treatment plans, handling invoicing and payments, controlling inventory, coordinating lab work, and managing user roles.

## User Preferences

Preferred communication style: Simple, everyday language.

## Brand Identity

GLAZER uses a distinctive teal-blue-purple color gradient extracted from the logo:
- **Primary (Teal)**: HSL 187 85% 42% - Used for buttons, links, focus rings, active states
- **Secondary (Blue)**: HSL 207 90% 54% - Used in gradients and chart colors
- **Accent (Purple)**: HSL 280 70% 55% - Used for highlights and secondary accents
- **Logo**: Located at `client/src/assets/glazer-logo.png`
- **Brand Gradient**: `.glazer-gradient` class provides the teal→blue→purple gradient

## System Architecture

### Core Design Principles
The system is a full-stack TypeScript application, emphasizing type safety, modularity, and maintainability. It uses a RESTful API design pattern and implements Role-Based Access Control (RBAC) for secure access management across Admin, Doctor, Staff, and Student roles.

### Frontend
- **Framework**: React 18 with TypeScript, bundled using Vite.
- **UI/UX**: `shadcn/ui` components built on Radix UI, styled with Tailwind CSS, supporting dark/light modes and custom themes. Features customizable widgets and real-time data display.
- **State Management**: `TanStack React Query` for server state management.
- **Routing**: `Wouter` for client-side navigation with protected routes.
- **Forms**: `React Hook Form` integrated with `Zod` for validation.

### Backend
- **Framework**: Express.js with TypeScript.
- **Authentication**: `Passport.js` with a local strategy and session-based authentication stored in PostgreSQL.
- **API**: RESTful API endpoints prefixed under `/api/*`.
- **Build System**: Vite for development and esbuild for production.

### Data Layer
- **Database**: PostgreSQL.
- **ORM**: `Drizzle ORM` for type-safe queries and schema management.
- **Schema & Migrations**: Table definitions in `shared/schema.ts`, with `Drizzle Kit` handling schema updates and migrations. `Drizzle-Zod` for schema-to-validation inference.

### Key Features & Technical Implementations
- **Patient Management**: Profiles, medical history, document storage, base64 photo upload.
- **Appointment Scheduling**: Categorized appointments with status tracking and room assignment.
- **Treatment Management**: Service catalog, treatment plans linked to teeth, cost/price/profit tracking.
- **Financial Management**: Invoicing, payments, refunds, payment plans, adjustments, and comprehensive financial reporting (Revenue, AR Aging, Production by Doctor, Expense reports, Net Profit). Includes full CRUD for clinic expenses and insurance claims.
- **Doctor Payment Management**: Admin interface for managing doctor salary payments (salary, bonus, commission, deduction, reimbursement). Payments are automatically included as expenses in financial reports (Expense Report and Net Profit). Deductions reduce total expenses while other payment types add to expenses. Doctors can view their own payments in the My Production page.
- **Inventory Control**: Stock management with low-stock alerts.
- **Lab Work Coordination**: Management of external labs and services.
- **User & Role Management**: CRUD for users, role assignment, activation/deactivation, profile management.
- **Audit Logging**: Immutable, append-only audit trail capturing user actions and changes.
- **Clinic Settings**: Centralized management of clinic information.
- **Room Management**: CRUD operations for clinic rooms.
- **Appearance Customization**: Animated background wallpapers (geometric, waves, particles, gradient), floating dental illustration elements with calm space-like animations (18-24 second cycles), transparency and blur controls for UI elements with dynamic CSS custom properties. Toggle for floating elements in Settings > Appearance.
- **Multi-tenant SaaS Model**: Organizations-based subscription management with Student, Doctor, and Clinic plans, integrated with Stripe for checkout, customer portal, and webhooks. Features are gated based on subscription.
- **Payment-First Registration System**: A three-step registration flow requiring payment before account creation, with role-specific forms and promo code validation. Ensures multi-tenant data isolation.
- **Password Management System**: Forgot password flow via email/phone/username, password reset tokens, logged-in user password change, and admin-initiated password resets with audit logging.
- **Notification Center**: In-app notification system for alerts (e.g., password reset requests, low stock, appointments, security), with user-configurable preferences.
- **Flexible Data Export**: ExportDropdown component provides three export options for reports: HTML file download, JSON data download, and browser print. Available in financial reports and doctor production pages.
- **Comprehensive Data Backup**: Full system backup (v2.2) includes all clinical data (patients, treatments, appointments, documents), financial data (invoices, payments, payment plans with installments, expenses, insurance claims, doctor payments), lab data, users (without passwords), and clinic settings/rooms.
- **Delete All Data**: Admin-only destructive action in Settings > Data that permanently deletes all clinic data with double confirmation (type "DELETE ALL DATA" + re-enter password). Uses database transaction for atomicity.

## External Dependencies

### Database & Session Management
- **PostgreSQL**: Primary data store.
- **connect-pg-simple**: PostgreSQL-based session storage.

### Backend Core
- **Drizzle ORM**: Database interaction.
- **bcrypt**: Password hashing.
- **express-session**: Server-side session management.
- **Passport.js**: Authentication middleware.

### Frontend Libraries
- **@tanstack/react-query**: Data fetching and caching.
- **Radix UI**: Accessible UI primitives.
- **date-fns**: Date manipulation.
- **Recharts**: Data visualization.
- **Lucide React**: Icon library.
- **class-variance-authority**: Component styling.
- **react-day-picker**: Calendar component.

### Development Tools
- **Vite**: Development server and build tool.
- **tsx**: TypeScript execution for backend.
- **drizzle-kit**: Database migration tooling.