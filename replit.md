# Dental Clinic Management System

## Overview

A comprehensive, full-stack TypeScript application designed for single-clinic dental operations. This system streamlines patient management, appointment scheduling, treatment tracking, financial operations, inventory control, and lab work coordination. Its primary purpose is to enhance efficiency and organization within a dental practice, offering a robust solution for managing all aspects of clinic operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Design Principles
The system is built as a full-stack TypeScript application, emphasizing type safety, modularity, and maintainability. It follows a RESTful API design pattern for clear separation between frontend and backend concerns. Role-Based Access Control (RBAC) is fundamental, ensuring secure and appropriate access levels for different user roles (Admin, Doctor, Staff, Student).

### Frontend
- **Framework**: React 18 with TypeScript, bundled using Vite.
- **UI/UX**: Utilizes `shadcn/ui` components built on Radix UI for an accessible and modern interface. Styling is managed with Tailwind CSS, supporting dark/light modes and custom themes.
- **State Management**: `TanStack React Query` is used for server state management and caching.
- **Routing**: `Wouter` provides client-side navigation with protected routes based on user roles.
- **Forms**: `React Hook Form` is integrated with `Zod` for robust form validation.
- **Interactive Dashboards**: Features customizable widgets, real-time data display, and smooth UI transitions for a dynamic user experience.

### Backend
- **Framework**: Express.js with TypeScript.
- **Authentication**: `Passport.js` with a local strategy and session-based authentication stored in PostgreSQL.
- **API**: RESTful API endpoints are consistently prefixed under `/api/*`.
- **Build System**: Vite for development with Hot Module Replacement (HMR) and esbuild for production bundling.

### Data Layer
- **Database**: PostgreSQL is used for data persistence.
- **ORM**: `Drizzle ORM` provides type-safe database queries and schema management.
- **Schema & Migrations**: All table definitions are in `shared/schema.ts`, with `Drizzle Kit` handling push-based schema updates and migrations. `Drizzle-Zod` facilitates automatic schema-to-validation inference.

### Key Features & Technical Implementations
- **Patient Management**: Comprehensive patient profiles, medical history, document storage (X-rays, reports) with base64 photo upload.
- **Appointment Scheduling**: Categorized appointments with status tracking and room assignment.
- **Treatment Management**: Service catalog with categories, treatment plans linked to specific teeth, and cost/price/profit tracking.
- **Financial Management**:
    - Invoicing, payments, payment refunds, and payment plans.
    - Invoice adjustments (discounts, write-offs).
    - Detailed financial breakdowns per patient.
    - **Reporting**: Revenue, AR Aging, Production by Doctor, and Expense reports with various period selectors and visualizations.
    - **Expense Tracking**: Full CRUD for clinic expenses across predefined categories.
    - **Insurance Claims**: Full CRUD for claim submissions with auto-generated numbers, status tracking, and subscriber information.
- **Inventory Control**: Stock management with low-stock alerts, quick quantity updates, and printable reports.
- **Lab Work Coordination**: Management of external labs and lab-specific services, integrating with lab case creation.
- **User & Role Management**: CRUD operations for users, role assignment, activation/deactivation, and profile management.
- **Audit Logging**: An immutable, append-only audit trail in a dedicated database table, capturing user actions, IP addresses, and JSON diffs of changes for enhanced security and accountability. Admin-only access to a comprehensive audit log interface with filtering and export capabilities.
- **Clinic Settings**: Centralized management of clinic information, logo upload, and social media links.
- **Room Management**: CRUD operations for clinic rooms, enabling assignment to appointments.

### Project Structure
The repository is organized into `client/` (React frontend), `server/` (Express backend), `shared/` (shared types and schema), and `migrations/` for clear separation of concerns.

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
- **date-fns**: Date manipulation utilities.
- **Recharts**: Data visualization.
- **Lucide React**: Icon library.
- **class-variance-authority**: Component styling utility.
- **react-day-picker**: Calendar component.

### Development Tools
- **Vite**: Development server and build tool.
- **tsx**: TypeScript execution for backend.
- **drizzle-kit**: Database migration tooling.

## Recent Changes

### Appearance Customization System (January 2026)
- **Animated Background Wallpapers**: 5 presets (Geometric, Waves, Particles, Gradient, None)
- **Enhanced light mode visibility**: Increased contrast and opacity for wallpaper patterns
- **Improved theme toggle**: Slightly larger (w-12 h-6) with better alignment
- **Transparency & Blur Controls** in Settings > Appearance:
  - Sidebar transparency slider (default: 20%)
  - Sidebar blur effect slider (default: 50%)
  - Elements transparency slider (default: 15%)
  - Elements blur effect slider (default: 30%)
  - Reset to recommended defaults button
- **CSS Custom Properties**: Dynamic --sidebar-transparency, --sidebar-blur, --elements-transparency, --elements-blur
- **Components Updated**: Card, Header, and Sidebar now use CSS variables for transparency/blur effects
- **AppearanceSettingsProvider**: Context-based state management with localStorage persistence

### Services Cost Tracking & Management (January 2026)
- **Cost field**: Added `cost` column to treatments table for calculating net profit
- **Full CRUD for services**: Edit and delete functionality with Zod validation
- **Print functionality**: Print filtered service list with cost/price/profit breakdown
- **Enhanced table columns**: Cost, Price, and Profit columns with color-coded profit display
- **API Endpoints**:
  - PATCH /api/treatments/:id (admin, doctor) - update service with Zod validation
  - DELETE /api/treatments/:id (admin only) - remove service from catalog

### Net Profit Reporting (January 2026)
- **Comprehensive net profit calculation**: Collections - Service Costs - Operating Expenses = Net Profit
- **Net Profit tab in Reports**: New dedicated tab with full profit breakdown
- **Profit calculation breakdown card**: Visual breakdown showing Collections → Gross Profit → Net Profit
- **Monthly net profit trend chart**: Bar chart showing collections, costs, expenses, and net profit by month
- **Monthly profit details table**: Tabular view of all profit components by month
- **Overview enhancement**: Net Profit card added to overview with profit margin percentage
- **Cash-basis accounting**: Uses actual collections (payments received) for accurate profit calculation
- **API Endpoint**: GET /api/reports/net-profit (admin only) with date range filtering

### Stripe Subscription System (January 2026)
- **Multi-tenant SaaS Model**: Organizations-based subscription management with plan limits
- **Three Subscription Tiers**:
  - Student Plan: $1/year, 50 patients, 1 user, basic features
  - Doctor Plan: $5/month or $50/year, 200 patients, 2 users, expanded features
  - Clinic Plan: $150/year with 15-day trial, unlimited patients/users, full features
- **Stripe Integration**:
  - Products synced via stripe-replit-sync package
  - Checkout sessions with Stripe-hosted payment page
  - Customer portal for subscription management
  - Webhook handling for subscription events
- **Feature Gating**: Sidebar and routes gated based on subscription plan features
- **Promo Code System**: Percentage or fixed discount codes with validation and usage limits
- **Subscription Context Hook**: `useSubscription()` provides plan info, limits, and feature access
- **Key Files**:
  - server/stripeClient.ts - Stripe client and sync initialization
  - server/subscription.ts - Subscription service with plan management
  - client/src/pages/subscription/pricing-page.tsx - Plan selection and checkout
  - client/src/pages/subscription/manage-page.tsx - Subscription management
  - client/src/hooks/use-subscription.tsx - Subscription state hook

### Payment-First Registration System (January 2026)
- **Complete Registration Redesign**: Payment MUST occur before account creation
- **3-Step Registration Flow**:
  1. Role Selection: Choose between Student, Doctor, or Clinic Manager with hover tooltips showing features
  2. Role-Specific Form: Collect appropriate information based on selected plan type
  3. Payment Confirmation: Review order and proceed to Stripe checkout
- **Role-Specific Registration Fields**:
  - **Student ($1/year)**: First Name, Last Name, Username, Email*, Phone*, Password, University, Year of Study, Promo Code
  - **Doctor ($5/month or $50/year)**: First Name, Last Name, Username, Email*, Phone*, Password, Specialty (dropdown), Promo Code
  - **Clinic Manager ($150/year with 15-day trial)**: Full Name, Clinic Name, Username, Email*, Phone*, Password, City, Promo Code
- **Free Registration with Promo Codes**: If promo code reduces price to $0, account is created immediately without payment
- **Multi-Tenant Data Isolation**: Each subscriber gets their own organization with isolated data via organizationId
- **Security Features**:
  - Pending registrations stored temporarily before payment with 24-hour expiration
  - Session metadata verification to prevent payment bypass
  - Plan type and price ID validation against Stripe session
  - Server-side validation for all role-specific required fields
  - Password hashing before storage
- **New Database Tables**:
  - `pending_registrations`: Stores registration data before payment completion
- **New Schema Fields**:
  - `users.university`: University name for students
  - `users.year_of_study`: Year of study for students  
  - `organizations.city`: City/location for clinics
- **API Endpoints**:
  - POST /api/registration/validate-promo - Validate promo code and calculate final amount
  - POST /api/registration/start - Start registration flow, create pending registration, redirect to Stripe
  - POST /api/registration/complete - Complete registration after successful payment
- **Key Files**:
  - client/src/pages/register-page.tsx - New registration page with 3-step flow
  - client/src/pages/registration-success.tsx - Success page after payment
  - client/src/pages/auth-page.tsx - Updated to redirect to new registration flow