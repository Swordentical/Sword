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