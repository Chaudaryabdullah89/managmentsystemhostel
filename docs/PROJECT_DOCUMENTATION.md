# 🏢 Hostel Management System (HMS) — Complete A to Z Project Documentation

---

## 📋 Table of Contents

1. [System Overview & Architecture](#1-system-overview--architecture)
2. [Technology Stack & Core Dependencies](#2-technology-stack--core-dependencies)
3. [Database Schema & Data Models (Prisma)](#3-database-schema--data-models-prisma)
4. [User Roles, RBAC & Granular Security Permissions](#4-user-roles-rbac--granular-security-permissions)
5. [Core Features & Functional Modules](#5-core-features--functional-modules)
6. [API Reference & Route Specifications](#6-api-reference--route-specifications)
7. [Frontend Architecture & UI Engineering](#7-frontend-architecture--ui-engineering)
8. [Security, Hardening & Governance Mechanisms](#8-security-hardening--governance-mechanisms)
9. [AI Integration & Automated RAG Engine](#9-ai-integration--automated-rag-engine)
10. [Automation, Cron Jobs & Background Tasks](#10-automation-cron-jobs--background-tasks)
11. [Project Setup, Environment Variables & Deployment](#11-project-setup-environment-variables--deployment)

---

## 1. System Overview & Architecture

The **Hostel Management System (HMS / Hostel Portal)** is an enterprise-grade, full-stack web application engineered for managing multi-hostel residential facilities, student housing, warden operations, financial accounting, and resident services.

### Key Architectural Highlights
- **Architecture Pattern**: Next.js 16 App Router (Full-Stack Monolith with Serverless API Endpoints).
- **Multi-Tenant / Multi-Hostel Multi-Role Support**: Single platform capable of serving Admins, Wardens, Staff, Residents, and Guests across multiple physical hostel properties.
- **Role-Based Access Control (RBAC) & Fine-Grained Permissions**: Strict security enforcement combining role checks with granular permissions (`canManageExpenses`, `canManageMess`, `canManageSalaries`, etc.).
- **Local AI & RAG Engine**: Native AI support powered by local Ollama (Mistral/LLaMA) or Google Gemini API integrated with Retrieval-Augmented Generation (RAG) over real-time database state.
- **Financial Integrity & Hardening**: Built-in payment idempotency guards, status transition safety engines, email notification delivery telemetry, and audit trail generation.

```mermaid
graph TD
    User([User / Browser]) --> UI[Next.js 16 Frontend / React 19]
    UI --> Middleware[Middleware Auth & Rate Limiter]
    Middleware --> API[Next.js API Routes / Serverless Functions]
    API --> Security[RBAC & Granular Permission Guards]
    Security --> Service[Business Logic & Service Layer]
    Service --> Prisma[Prisma ORM 5.22]
    Prisma --> DB[(PostgreSQL / Neon Database)]
    Service --> Redis[(Redis Cache & Rate Limiting)]
    Service --> AI[Ollama / Gemini RAG Assistant]
    Service --> Mail[Nodemailer Email Telemetry]
```

---

## 2. Technology Stack & Core Dependencies

### 🎨 Frontend Stack
- **Framework**: Next.js 16.1.6 (App Router, Server Components & Client Components)
- **Library**: React 19.2.4 & React DOM 19.2.4
- **Styling**: Tailwind CSS v4, PostCSS, Class Variance Authority (`cva`), `clsx`, `tailwind-merge`
- **UI Components**: Radix UI primitives (Dialog, Tabs, Dropdown Menu, Select, Progress, Avatar, Alert Dialog, Tooltip, Separator)
- **Icons**: Lucide React (`lucide-react`)
- **State Management**: Zustand v5.0.9 (Client global state), TanStack React Query v5.90.12 (Server state & caching)
- **Animations**: Framer Motion v12.34.3
- **Data Visualization**: Recharts v3.7.0
- **Toast Notifications**: Sonner v2.0.7
- **PDF Generation**: `@react-pdf/renderer` v4.3.2, `jspdf` v4.2.0, `jspdf-autotable`

### ⚙️ Backend & Database Stack
- **Runtime**: Node.js v20+ with TypeScript / ES Modules
- **ORM**: Prisma ORM v5.22.0 (`@prisma/client` & `@prisma/adapter-pg`)
- **Database Engine**: PostgreSQL (Neon Serverless PostgreSQL Database)
- **Caching & Rate Limiting**: Redis via `ioredis` v5.11.1
- **Validation**: Zod v4.3.6 (API request body and query validations)

### 🔒 Authentication & Security
- **JWT Authentication**: `jose` v6.1.3 (HTTP-Only Secure SameSite Cookies)
- **Passkey / Biometric Auth**: `@simplewebauthn/browser` v13.3.0 & `@simplewebauthn/server` v13.3.1 (WebAuthn Passkeys)
- **Two-Factor Authentication (2FA)**: `otplib` v13.4.1 (TOTP authentication), `qrcode` v1.5.4
- **Password Hashing**: `bcrypt` v6.0.0

### 🤖 AI & Communications
- **AI Core**: Ollama local LLM (Mistral/LLaMA) & `@google/generative-ai` v0.24.1
- **Search & RAG**: Context Builder (`lib/ragContext.ts`), `string-similarity-js`, `fuse.js`
- **Email Dispatch**: `nodemailer` v7.0.11 with custom notification telemetry

---

## 3. Database Schema & Data Models (Prisma)

The application utilizes PostgreSQL managed via **Prisma ORM**. Below is the detailed breakdown of the primary domain models and their relationships.

### Core Data Models

#### 1. `User`
Central identity model for all platform actors.
- **Fields**: `id`, `name`, `email`, `password`, `cnic`, `phone`, `role` (`ADMIN`, `WARDEN`, `STAFF`, `RESIDENT`, `GUEST`), `image`, `isActive`, `hostelId`, `basicSalary`, `allowances`, `wardens` (array of managed warden IDs), `regNumber`, `twoFactorSecret`, `twoFactorEnabled`, `twoFactorMethod`, `backupCodes`.
- **Granular Permissions**: `canManageExpenses`, `canManageGeneral`, `canManageMaintenance`, `canManageMess`, `canManageSalaries`, `canManageUtilities`.
- **Relations**: Associated with `Hostel`, `Booking`, `Payment`, `Expense`, `Complaint`, `Notice`, `ResidentProfile`, `StaffProfile`, `Session`, `WebAuthnCredential`, `StaffTask`.

#### 2. `Hostel`
Physical hostel property representation.
- **Fields**: `id`, `name`, `type` (`BOYS`, `GIRLS`, `MIXED`), `address`, `city`, `state`, `country`, `phone`, `email`, `floors`, `totalRooms`, `amenities`, `images`, `managerId`, `laundryavailable`, `messavailable`, `monthlyrent`, `pernightrent`, `status`.
- **Relations**: Has many `Room`, `Notice`, `Expense`, `Complaint`, `MessMenu`, `InventoryItem`, `CleaningLog`, `LaundryLog`, `Maintenance`.

#### 3. `Room`
Individual room within a hostel property.
- **Fields**: `id`, `hostelId`, `roomNumber`, `floor`, `type` (`SINGLE`, `DOUBLE`, `TRIPLE`, `DORMITORY`), `capacity`, `price`, `status` (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`, `CLEANING`), `amenities`, `images`, `cleaningInterval`, `laundryInterval`, `monthlyrent`, `pernightrent`.
- **Relations**: Belongs to `Hostel`, has many `Booking`, `CleaningLog`, `LaundryLog`, `Maintenance`, `RoomSwapRequest`.

#### 4. `Booking`
Resident room reservation and stay record.
- **Fields**: `id`, `userId`, `roomId`, `checkIn`, `checkOut`, `status` (`PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`, `REJECTED`, `CHECKED_IN`, `CHECKED_OUT`), `totalAmount`, `securityDeposit`, `monthlyRent`, `uid`.
- **Relations**: Belongs to `User` and `Room`, has many `Payment`.

#### 5. `Payment`
Financial collection transactions for rent, deposits, and fees.
- **Fields**: `id`, `userId`, `bookingId`, `amount`, `date`, `dueDate`, `type`, `status` (`PENDING`, `PAID`, `OVERDUE`, `PARTIAL`, `FAILED`, `REFUNDED`, `REJECTED`), `method` (`CASH`, `BANK_TRANSFER`, `ONLINE`, `CHEQUE`, `OTHER`), `transactionId`, `receiptUrl`, `month`, `year`, `uid`.
- **Relations**: Belongs to `User` and `Booking`, has many `RefundRequest`.

#### 6. `Expense`
Operational expenditure logged by warden/admin for a hostel.
- **Fields**: `id`, `hostelId`, `title`, `description`, `amount`, `date`, `category` (`MESS`, `GENERAL`, `UTILITY_BILL`, `MAINTENANCE`, `SALARY`), `status` (`PENDING`, `APPROVED`, `REJECTED`, `PAID`), `receiptUrl`, `submittedById`, `approvedById`, `rejectedById`, `userId`.
- **Relations**: Belongs to `Hostel` and `User` (submitter/approver/rejecter).

#### 7. `Complaint`
Resident support issues and maintenance tickets.
- **Fields**: `id`, `userId`, `hostelId`, `roomNumber`, `title`, `description`, `category` (`MAINTENANCE`, `CLEANLINESS`, `NOISE`, `SECURITY`, `INTERNET`, `ELECTRICAL`, `PLUMBING`, `MESS`, `BEHAVIOR`, `OTHER`), `priority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), `status` (`PENDING`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`), `assignedToId`, `resolutionNotes`, `resolvedAt`, `images`, `uid`.
- **Relations**: Belongs to `User` and `Hostel`, has many `ComplaintComment`.

#### 8. `MessMenu` & `MessFeedback`
Weekly meal planner and resident meal ratings.
- **MessMenu Fields**: `id`, `hostelId`, `dayOfWeek`, `breakfast`, `breakfastTime`, `lunch`, `lunchTime`, `dinner`, `dinnerTime`.
- **MessFeedback Fields**: `id`, `userId`, `hostelId`, `date`, `mealType`, `rating` (1 to 5), `comments`.

#### 9. `StaffProfile`, `Salary` & `WardenPayment`
HR management and payroll system for staff and wardens.
- **StaffProfile**: `id`, `userId`, `designation`, `department`, `shift`, `basicSalary`, `allowances`, `joiningDate`, `documents`.
- **Salary**: `id`, `staffProfileId`, `month`, `amount`, `basicSalary`, `allowances`, `bonuses`, `deductions`, `status`, `paymentDate`, `paymentMethod`.
- **WardenPayment**: `id`, `wardenId`, `amount`, `basicSalary`, `bonuses`, `deductions`, `month`, `paymentMethod`, `paymentDate`, `status`, `type`.

#### 10. `StaffTask` & `TaskComment`
Internal task board for hostel wardens and workers.
- **Fields**: `id`, `title`, `description`, `status` (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`), `priority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), `category`, `hostelId`, `assignedToId`, `createdById`, `dueDate`, `completedAt`.

#### 11. `InventoryItem` (`MessInventory`)
Hostel supplies and mess inventory tracking.
- **Fields**: `id`, `hostelId`, `itemName`, `category` (`MESS`, `MAINTENANCE`, `STATIONERY`, `OTHER`), `quantity`, `unit`, `minThreshold`, `expiryDate`.

#### 12. `SystemSettings` & `RolePermission`
System-wide global toggles and dynamic RBAC configurations.
- **SystemSettings**: `maintenanceMode`, `enableLaundry`, `enableMess`, `enableGuestBookings`, `enableComplaintsSystem`, `enableNoticeBoard`, `enableAiAssistant`, `autoGenerateRentInvoices`, `enableEmailService`, `companyName`.
- **RolePermission**: `role`, `permissions` (JSON map of overrides).

#### 13. `RoomSwapRequest` & `RefundRequest`
- **RoomSwapRequest**: Transfer resident between `fromRoomId` and `toRoomId`.
- **RefundRequest**: Process payment refund applications submitted by residents.

---

## 4. User Roles, RBAC & Granular Security Permissions

The system implements a multi-tier authorization hierarchy managed via `lib/apiAuth.ts`, `lib/permissions.js`, and `lib/checkRole.ts`.

### Role Definitions

| Role | Access Level & Scope | Key Responsibilities |
| :--- | :--- | :--- |
| **`ADMIN`** | System-Wide Full Access | Global management of all hostels, financial dashboards, wardens, system configuration, global reporting, salary approvals. |
| **`WARDEN`** | Hostel-Scoped Authority | Day-to-day administration of assigned hostel(s). Manages rooms, residents, complaints, expenses, cleaning/laundry, staff tasks, and mess menus. |
| **`STAFF`** | Task-Based Operational Scope | Housekeeping, laundry processing, maintenance ticket resolution, task updates. |
| **`RESIDENT`** | Self-Service Resident Scope | Views assigned room/booking, pays monthly rent, views mess menu, submits feedback, logs complaints, requests room swaps, chats with AI. |
| **`GUEST`** | Public / Applicant Scope | Views public hostel listings, submits guest booking requests, tracks application status. |

### Granular Permission Flags (for WARDEN & STAFF Roles)
In addition to basic role checks, admins can grant specific sub-permissions to users:
- `canManageExpenses`: Grants permission to create and submit hostel expense claims.
- `canManageMess`: Grants permission to modify mess menus and inventory.
- `canManageSalaries`: Grants access to process staff payroll within their hostel.
- `canManageMaintenance`: Grants permission to update maintenance tasks and inventory usage.
- `canManageUtilities`: Allows entry of utility bill expenses.
- `canManageGeneral`: Grants administrative general settings permissions.

---

## 5. Core Features & Functional Modules

### 🏢 1. Hostel & Room Operations
- **Property Management**: Create, edit, and configure multi-floor hostels with amenities, location specs, and rent rules.
- **Room Inventory**: Track room numbers, bed capacities, room types (Single/Double/Triple/Dormitory), monthly and per-night pricing.
- **Real-Time Occupancy**: Monitor available vs occupied beds with automatic status updates upon check-in/check-out.
- **Room Swaps**: Interactive room transfer approval flow between residents and wardens.

### 💳 2. Financial Management & Invoicing
- **Rent Invoicing**: Automated monthly rent invoice generation for active resident bookings.
- **Payment Collection**: Log payments via Cash, Bank Transfer, Online, or Cheque with receipt upload support.
- **Automated PDF Receipts & Invoices**: Generate instant downloadable PDF receipts using `@react-pdf/renderer` and `jspdf`.
- **Refund Requests**: Resident-initiated refund portal with admin/warden review and approval workflow.
- **Financial Analytics**: Revenue charts, unpaid bill tracking, financial reports by hostel property.

### 💰 3. Expense Tracking & Payroll
- **Hostel Expense Ledger**: Categorized expense logs (Mess, Utilities, Maintenance, General, Salary) with receipt attachments.
- **Approval Workflow**: Dual-step expense submission and approval/rejection process with conflict safety.
- **Warden & Staff Payroll**: Automated monthly salary slips, allowances, bonuses, deductions, and payment status updates.

### 🛠️ 4. Maintenance & Resident Complaints
- **Ticket Lifecycle**: Log complaints with image uploads, priority levels (`LOW` to `URGENT`), and categories.
- **Assignment & Resolution**: Wardens assign tickets to specific staff members with resolution notes.
- **Comment Threads**: Real-time communication on individual complaint tickets between residents and staff.
- **Parts & Inventory Linkage**: Track inventory parts used during maintenance ticket resolution.

### 🍽️ 5. Mess & Housekeeping Management
- **Weekly Mess Planner**: Schedule daily menus (Breakfast, Lunch, Dinner) with precise meal timings.
- **Mess Feedback**: Residents rate meal quality (1-5 stars) and provide actionable feedback.
- **Inventory Control**: Real-time tracking of food and hostel supplies with minimum threshold alerts.
- **Cleaning & Laundry Logs**: Room cleaning schedules, interval enforcement, and laundry item count logs.

### 📢 6. Notice Board & Announcements
- **Targeted Broadcasts**: Create announcements targeted to specific roles (`RESIDENT`, `STAFF`, `WARDEN`) or global audiences.
- **Hostel Specificity**: Broadcast notices to all hostels or filter by specific hostel property.
- **Expiration Controls**: Schedule automated notice expiration dates.

---

## 6. API Reference & Route Specifications

All backend APIs reside under `app/api/(Backend)/` and enforce JSON request/response contracts with structured HTTP status codes.

### 🔑 Auth & Identity APIs (`/api/(Backend)/auth/`)
- `POST /api/auth/signin`: Authenticate credentials, set HTTP-Only JWT cookie, record user session.
- `POST /api/auth/signup`: Self-registration for residents/guests.
- `POST /api/auth/logout`: Invalidate user session and clear authentication cookies.
- `GET /api/auth/me`: Fetch current authenticated user session and permission scope.
- `POST /api/auth/2fa/setup`: Generate 2FA TOTP secret and QR code.
- `POST /api/auth/2fa/verify`: Verify 2FA TOTP code and enable 2FA.
- `POST /api/auth/webauthn/register-options` & `register-verify`: Register WebAuthn biometric passkeys.
- `POST /api/auth/webauthn/authenticate-options` & `authenticate-verify`: Biometric passkey login.

### 🏛️ Hostel & Room APIs (`/api/(Backend)/hostels/` & `/api/(Backend)/rooms/`)
- `GET /api/hostels`: List hostels (filtered by role and hostel assignment).
- `POST /api/hostels`: Create new hostel property (Admin only).
- `GET /api/hostels/[hostelId]`: Detailed hostel view with rooms, wardens, and stats.
- `GET /api/rooms`: List rooms with availability filter.
- `POST /api/rooms`: Add room to hostel property.

### 📅 Booking APIs (`/api/(Backend)/bookings/`)
- `GET /api/bookings`: Fetch user or hostel bookings.
- `POST /api/bookings`: Create room reservation request.
- `PATCH /api/bookings/[id]`: Update status (`CONFIRMED`, `CHECKED_IN`, `CHECKED_OUT`, `CANCELLED`).

### 💸 Payments & Expenses APIs (`/api/(Backend)/payments/` & `/api/(Backend)/expenses/`)
- `GET /api/payments`: Query payment records with pagination and month/year filters.
- `POST /api/payments`: Log manual or online rent payment.
- `PATCH /api/payments/[paymentId]`: Approve/reject payment with status transition validation.
- `GET /api/expenses`: List hostel expenses.
- `POST /api/expenses`: Submit operational expense item.
- `PATCH /api/expenses/[expenseId]`: Approve or reject expense.

### 🛠️ Complaints & Tasks APIs (`/api/(Backend)/complaints/` & `/api/(Backend)/tasks/`)
- `GET /api/complaints`: Fetch complaint tickets.
- `POST /api/complaints`: Log new resident complaint.
- `PATCH /api/complaints/[id]`: Assign staff, update status (`RESOLVED`, `IN_PROGRESS`).
- `POST /api/tasks`: Assign staff operational task.

### 🤖 AI Assistant APIs (`/api/(Backend)/ai/`)
- `POST /api/ai/chat`: Execute user prompt against local Ollama or Gemini model with RAG database context.

---

## 7. Frontend Architecture & UI Engineering

### Layout System & Navigation
- **App Layout**: `app/layout.tsx` embeds global contexts, React Query provider (`ReactQueryProvider`), and Sonner toast containers.
- **Dashboard Shell**: `app/(Dashboard)/layout.tsx` wraps role-specific dashboards with the dynamic sidebar (`components/appsidebar.tsx`), top bar, and session timeout watcher.
- **Role-Based Routing Directories**:
  - `app/(Dashboard)/admin/*`: Admin dashboard and management modules.
  - `app/(Dashboard)/warden/*`: Warden hostel control center.
  - `app/(Dashboard)/staff/*`: Staff task execute view.
  - `app/(Dashboard)/guest/*`: Resident portal & self-service application.

### State Management Strategy
1. **Server State**: Managed via **TanStack React Query v5** for automatic refetching, background invalidation, optimistic updates, and response caching.
2. **Client Global State**: Managed via **Zustand** stores for UI theme, active hostel selection, sidebar state, and authentication context.

---

## 8. Security, Hardening & Governance Mechanisms

### 1. Unified JWT Auth Engine (`lib/apiAuth.ts`)
- Uses `jose` for cryptographically signing and verifying JWT tokens.
- Restricts token exposure by storing JWT exclusively inside `httpOnly`, `SameSite=Lax`, `Secure` cookies.
- Prevents secret fallbacks by throwing explicit runtime errors if `JWT_SECRET` is missing.

### 2. Strict Financial Status Transition Safety (`lib/statusTransitions.js`)
- Enforces valid transition paths for payments and expenses.
- Normalizes status aliases (e.g., `APPROVED` $\rightarrow$ `PAID`).
- Rejects invalid state jumps (e.g., transitioning a `REFUNDED` payment directly to `PAID`) with HTTP `409 Conflict`.

```
Payment Lifecycle:  PENDING -> PAID / OVERDUE / REJECTED -> REFUNDED
Expense Lifecycle:  PENDING -> APPROVED / REJECTED -> PAID
```

### 3. Idempotency Guard Middleware (`lib/idempotency.js`)
- Protects critical financial routes (`/api/payments/reconcile`, `/api/payments/refund`) from double-submission glitches using unique idempotency keys.

### 4. Audit Logging & Notification Telemetry (`lib/auditLogger.js` & `lib/notificationTelemetry.js`)
- Records structured logs for sensitive actions (payment approvals, permission changes, expense updates).
- Tracks email delivery telemetry outcomes (`[NOTIFY_TELEMETRY]`) to ensure reliability.

### 5. Rate Limiting (`lib/rateLimit.ts`)
- Implements sliding window rate limiting backed by Redis (with memory fallback) to prevent brute-force attacks on auth and financial routes.

---

## 9. AI Integration & Automated RAG Engine

The system features a built-in Intelligent Assistant (`lib/ollama.js` and `lib/ragContext.ts`) designed to answer resident and admin queries based on live system state.

```
User Query ("When is my next rent payment due?")
      │
      ▼
Intent Detection (lib/ragContext.ts -> "payment")
      │
      ▼
Database Retrieval (Fetch user's pending payments & bookings)
      │
      ▼
Context Assembly (Inject structured JSON context into LLM prompt)
      │
      ▼
LLM Generation (Ollama / Mistral or Google Gemini)
      │
      ▼
Structured Response to User
```

### Key Technical Aspects:
- **Zero-Hallucination Guard**: RAG context builder fetches user-specific records directly from Prisma before invoking the LLM.
- **Fallback Capability**: Supports both local offline Ollama models (`http://localhost:11434`) and cloud-based Google Gemini API.

---

## 10. Automation, Cron Jobs & Background Tasks

### Automated Monthly Rent Invoice Generation (`app/api/(Backend)/cron/route.js`)
- Evaluates active bookings on the 1st of every month.
- Creates new `Payment` records for due rent.
- Logs execution results to the `BillingLog` database model for complete auditability.

### Automated Staff & Warden Payroll
- Computes monthly base salaries, allowances, and deductions automatically based on `StaffProfile` entries.

---

## 11. Project Setup, Environment Variables & Deployment

### ⚙️ Environment Variables Setup (`.env`)
Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@ep-cool-host-123456.us-east-1.aws.neon.tech/hosteldb?sslmode=require"

# Auth & Security
JWT_SECRET="super-secret-random-32-character-key-here"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Redis (Caching & Rate Limiting)
REDIS_URL="redis://localhost:6379"

# Email Configuration (Nodemailer)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="notifications@hostelportal.com"
SMTP_PASS="app-specific-password"
SMTP_FROM="Hostel Management System <notifications@hostelportal.com>"

# AI Integration (Optional)
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="mistral"
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"
```

### 🚀 Local Development Commands

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Prisma Database Migrations**:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

3. **Seed Database with Initial Data**:
   ```bash
   node prisma/seed.js
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Run Test Suite**:
   ```bash
   npm run test
   ```

---

*Document generated for Hostel Management System (HMS) codebase.*
