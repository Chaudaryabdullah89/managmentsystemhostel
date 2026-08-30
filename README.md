# 🏢 Hostel Management System (HMS)

> **Enterprise-Grade Full-Stack Hostel & Student Housing Management Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.1.6-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?logo=postgresql)](https://www.postgresql.org/)
[![Live Demo](https://img.shields.io/badge/Live-portalhms.vercel.app-brightgreen)](https://portalhms.vercel.app)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [User Roles & Permissions](#user-roles--permissions)
- [Core Modules](#core-modules)
- [API Documentation](#api-documentation)
- [Security Features](#security-features)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**Hostel Management System (HMS)** is a comprehensive, enterprise-grade web application designed for managing multi-hostel residential facilities, student housing, and managed accommodation. The platform streamlines operations across multiple physical properties while maintaining strict role-based access control and financial integrity.

### 🎯 Primary Use Cases

✅ **Student Housing Management** - Managing university/college hostels with multiple properties  
✅ **Residential Facilities** - PG accommodations, co-living spaces, and shared housing  
✅ **Multi-Tenant Operations** - Support for independent warden-managed properties  
✅ **Financial Administration** - Automated invoicing, payment tracking, and payroll management  
✅ **Maintenance & Support** - Complaint tracking, ticket resolution, and maintenance scheduling  
✅ **Dietary Management** - Weekly mess planning, inventory tracking, and meal feedback  

### 🏗️ Architectural Highlights

- **Full-Stack Monolith**: Next.js 16 App Router with serverless API endpoints
- **Multi-Hostel Support**: Single platform managing multiple independent properties
- **Multi-Role RBAC**: 5 distinct roles with granular permission flags
- **AI-Powered Assistant**: Built-in RAG engine powered by Ollama/Google Gemini
- **Financial Hardening**: Payment idempotency, status transition safety, audit trails
- **Real-Time Tracking**: Redis caching, optimistic updates, live occupancy monitoring
- **Production Ready**: Enterprise security standards, comprehensive error handling

---

## ✨ Key Features

### 🏢 1. **Hostel & Room Operations**
- 🏗️ Multi-floor hostel creation with amenities and location specifications
- 🛏️ Room inventory management (Single/Double/Triple/Dormitory types)
- ��� Real-time occupancy tracking with automatic bed status updates
- 🔄 Interactive room swap approval workflow between residents and wardens
- 📸 Property image galleries and amenity showcases
- 🌍 Multi-hostel management dashboard for admins

### 💳 2. **Financial Management & Invoicing**
- 🧾 **Automated Monthly Invoicing**: Auto-generated rent invoices on the 1st of every month
- 💰 **Multi-Channel Payments**: Cash, Bank Transfer, Online, or Cheque payment logging
- 🧠 **Smart Payment Tracking**: Overdue detection, partial payment handling, refund management
- 📄 **PDF Generation**: Instant downloadable receipts and invoices
- 📈 **Financial Analytics**: Revenue charts, unpaid bill tracking, financial reports by property
- 🔐 **Idempotency Guards**: Double-submission protection on sensitive transactions

### 💸 3. **Expense Tracking & Payroll**
- 📊 **Categorized Expense Ledger**: Mess, Utilities, Maintenance, General, Salary tracking
- ✅ **Dual-Step Approval Workflow**: Submit → Review → Approve/Reject with conflict safety
- 👥 **Staff & Warden Payroll**: Automated monthly salary slips with allowances and deductions
- 🎯 **Bonus & Deduction Management**: Fine-grained salary component control
- 📤 **Payment Method Tracking**: Cash, Bank Transfer, Cheque record-keeping
- 📋 **Salary Slip Generation**: PDF salary slip distribution

### 🛠️ 4. **Maintenance & Resident Complaints**
- 🎫 **Smart Ticket Lifecycle**: Log, assign, resolve with full conversation history
- 📷 **Image Uploads**: Attach photos to complaint tickets for context
- 🚨 **Priority Levels**: LOW, MEDIUM, HIGH, URGENT categorization
- 👤 **Staff Assignment**: Warden-to-staff ticket assignment with task tracking
- 💬 **Real-Time Comments**: Staff-resident communication on individual tickets
- 🔧 **Parts & Inventory Linkage**: Track spare parts used during resolution

### 🍽️ 5. **Mess & Housekeeping Management**
- 📅 **Weekly Meal Planner**: Schedule breakfast, lunch, dinner with precise timings
- ⭐ **Meal Feedback System**: Residents rate (1-5 stars) with quality feedback
- 📦 **Inventory Control**: Real-time supply tracking with minimum threshold alerts
- 🧹 **Cleaning Schedules**: Room cleaning interval enforcement and log management
- 👔 **Laundry Tracking**: Item count logs and laundry service management
- 📊 **Analytics Dashboard**: Food cost trends, inventory waste analysis

### 📢 6. **Notice Board & Announcements**
- 📣 **Targeted Broadcasting**: Send announcements to specific roles or global audiences
- 🏢 **Hostel-Specific Notices**: Broadcast to all properties or filter by specific hostel
- ⏰ **Expiration Controls**: Auto-expire notices on scheduled dates
- 🎨 **Rich Content Support**: Markdown formatting, file attachments
- 📱 **Multi-Channel Delivery**: Email notifications, in-app alerts, WhatsApp bot integration

### 🤖 7. **AI Assistant & RAG Engine**
- 🧠 **Intelligent Query Resolution**: Answer resident questions using live database context
- 💭 **Zero-Hallucination Guards**: RAG context fetched directly from Prisma
- 🔄 **Dual LLM Support**: Local Ollama (Mistral/LLaMA) + Cloud Google Gemini fallback
- 🎯 **Intent Detection**: Automatic categorization of user queries
- 📚 **Context-Aware Responses**: Personalized answers based on user role and data

### 🔒 8. **Authentication & Security**
- 🔐 **JWT Authentication**: HTTP-only, SameSite cookies with rotating tokens
- 🔑 **Passkey/Biometric Auth**: WebAuthn browser biometric login support
- 📱 **Two-Factor Authentication (2FA)**: TOTP-based OTP with QR code provisioning
- 🛡️ **Role-Based Access Control (RBAC)**: Multi-tier authorization hierarchy
- 📝 **Granular Permissions**: Fine-grained permission flags for sub-roles
- 🚫 **Rate Limiting**: Redis-backed sliding window protection
- 🔒 **Password Hashing**: bcrypt with configurable salt rounds
- 📊 **Audit Logging**: Comprehensive trails for sensitive operations

---

## 🛠️ Technology Stack

### 🎨 **Frontend**
| Component | Technology | Version |
|-----------|-----------|---------|
| **Framework** | Next.js App Router | 16.1.6 |
| **UI Library** | React | 19.2.4 |
| **Styling** | Tailwind CSS v4 | 4.0 |
| **UI Components** | Radix UI | 1.x |
| **Icons** | Lucide React | 0.554.0 |
| **State Management** | Zustand | 5.0.9 |
| **Server State** | TanStack React Query | 5.90.12 |
| **Animations** | Framer Motion | 12.34.3 |
| **Charts & Visualizations** | Recharts | 3.7.0 |
| **PDF Generation** | jsPDF + @react-pdf/renderer | 4.2.0 |
| **Form Validation** | Zod | 4.3.6 |
| **Notifications** | Sonner | 2.0.7 |

### ⚙️ **Backend & Database**
| Component | Technology | Version |
|-----------|-----------|---------|
| **Runtime** | Node.js | 20+ |
| **Framework** | Next.js API Routes | 16.1.6 |
| **Database ORM** | Prisma | 5.22.0 |
| **Database Engine** | PostgreSQL (Neon) | Latest |
| **Adapter** | @prisma/adapter-pg | 7.0.0 |
| **Caching & Rate Limit** | Redis | Latest |
| **HTTP Client** | Axios | 1.13.5 |

### 🔒 **Security & Authentication**
| Component | Technology | Version |
|-----------|-----------|---------|
| **JWT Signing** | jose | 6.1.3 |
| **WebAuthn** | @simplewebauthn | 13.3.x |
| **2FA/TOTP** | otplib | 13.4.1 |
| **Password Hashing** | bcrypt | 6.0.0 |
| **QR Code Generation** | qrcode | 1.5.4 |

### 🤖 **AI & Communication**
| Component | Technology | Version |
|-----------|-----------|---------|
| **Local LLM** | Ollama (Mistral/LLaMA) | Latest |
| **Cloud AI** | Google Generative AI | 0.24.1 |
| **Email Service** | Nodemailer | 7.0.11 |
| **Fuzzy Search** | fuse.js | 7.1.0 |
| **String Similarity** | string-similarity-js | 2.1.4 |

### 📱 **Mobile**
| Component | Technology | Version |
|-----------|-----------|---------|
| **Framework** | Expo + React Native | Latest |
| **Routing** | Expo Router | 6.0.24 |
| **Biometric** | expo-local-authentication | 17.0.8 |
| **Secure Storage** | expo-secure-store | 15.0.8 |
| **Notifications** | expo-notifications | 0.32.17 |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (Browser)                   │
│         Next.js Frontend + React 19 + Tailwind CSS          │
├─────────────────────────────────────────────────────────────┤
│                  MIDDLEWARE & ROUTING LAYER                 │
│        Auth Middleware • Rate Limiter • CORS Guard          │
├─────────────────────────────────────────────────────────────┤
│                   API LAYER (Next.js Routes)                │
│     ┌──────────────┬──────────────┬──────────────┐          │
│     │   Auth API   │ Hostel API   │ Payment API  │          │
│     ├──────────────┼──────────────┼──────────────┤          │
│     │Booking API   │ Complaint API│  Expense API │          │
│     └──────────────┴──────────────┴──────────────┘          │
├─────────────────────────────────────────────────────────────┤
│              SECURITY & RBAC ENFORCEMENT LAYER              │
│    Role Validator • Permission Guards • Audit Logger        │
├─────────────────────────────────────────────────────────────┤
│                  BUSINESS LOGIC LAYER                       │
│    Service Classes • State Transition Validators            │
├────────────────────────────────────────────���────────────────┤
│                   DATA ACCESS LAYER                         │
│         Prisma ORM • Query Builders • Repositories          │
├─────────────────────────────────────────────────────────────┤
│           ┌──────────────┬──────────┬──────────┐            │
│           │  PostgreSQL  │  Redis   │  Ollama  │            │
│           │   Database   │  Cache   │   AI     │            │
│           └──────────────┴──────────┴──────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow - Payment Processing Example

```
User Submits Payment Form
        ↓
[React Form Validation - Zod]
        ↓
[Axios HTTP POST to /api/payments]
        ↓
[Middleware: Auth Verification, Rate Limit Check]
        ↓
[Route Handler: validatePaymentRequest()]
        ↓
[RBAC Guard: checkUserPermission('payment:create')]
        ↓
[Service Layer: processPayment() with Idempotency Key]
        ↓
[Prisma: Create Payment Record + Update Booking Status]
        ↓
[Audit Logger: Log Transaction]
        ↓
[Email Service: Send Receipt + Notification]
        ↓
[Response: 200 JSON + PDF Receipt Link]
        ↓
[React Query: Invalidate Cache + Show Toast]
        ↓
Dashboard Updated with Fresh Data
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v20 or higher
- **npm** or **yarn**: Latest version
- **PostgreSQL**: Neon or local PostgreSQL instance
- **Redis**: Local or managed Redis instance
- **Git**: For cloning the repository

### Installation Steps

#### 1. **Clone Repository**

```bash
git clone https://github.com/Chaudaryabdullah89/managmentsystemhostel.git
cd managmentsystemhostel
```

#### 2. **Install Root Dependencies**

```bash
npm install
```

#### 3. **Install Mobile Dependencies (Optional)**

```bash
cd mobile
npm install
cd ..
```

#### 4. **Install WhatsApp Bot Dependencies (Optional)**

```bash
cd whatsapp-bot
npm install
cd ..
```

#### 5. **Configure Environment Variables**

Create a `.env.local` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@neon-host.neon.tech/hosteldb?sslmode=require"

# Authentication & Security
JWT_SECRET="your-super-secret-random-key-minimum-32-characters"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Redis Configuration (Caching & Rate Limiting)
REDIS_URL="redis://localhost:6379"

# Email Configuration (Nodemailer)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-specific-password"
SMTP_FROM="Hostel Management System <noreply@hms.local>"

# AI Integration
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="mistral"
GEMINI_API_KEY="your-google-gemini-api-key"

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID="your-vercel-analytics-id"

# Internal Security (IDS self-reporting)
INTERNAL_API_SECRET="another-random-32-character-string"
```

#### 6. **Setup Database**

Generate Prisma client and run migrations:

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Generate AI schema for RAG
npx prisma generate --schema=prisma/ai-schema.prisma

# Seed database with initial data (optional)
node prisma/seed.js
```

#### 7. **Start Development Server**

```bash
npm run dev
```

Access the application at **[http://localhost:3000](http://localhost:3000)**

#### 8. **Run Tests (Optional)**

```bash
npm run test
```

---

## 🔧 Environment Variables

### Database
- `DATABASE_URL`: PostgreSQL connection string (Neon recommended)

### Authentication
- `JWT_SECRET`: 32+ character random string for JWT signing
- `NEXT_PUBLIC_BASE_URL`: Application base URL for redirects

### Caching & Rate Limiting
- `REDIS_URL`: Redis connection string

### Email Service
- `SMTP_HOST`: SMTP server hostname
- `SMTP_PORT`: SMTP port (usually 587 for TLS)
- `SMTP_USER`: Email account username
- `SMTP_PASS`: Email account password or app-specific password
- `SMTP_FROM`: From address for outgoing emails

### AI Integration
- `OLLAMA_BASE_URL`: Local Ollama server URL (optional)
- `OLLAMA_MODEL`: Model name (e.g., "mistral", "llama2")
- `GEMINI_API_KEY`: Google Generative AI API key (optional)

### Internal Security
- `INTERNAL_API_SECRET`: Shared secret the edge middleware attaches (as `x-internal-secret`) when it self-reports detected threats to `/api/admin/security/report-threat`. Without it, that endpoint only trusts the IP it is actually called from, so an external caller can't get an arbitrary IP auto-blocked.

---

## 📁 Project Structure

```
managmentsystemhostel/
├── app/
│   ├── (Dashboard)/              # Role-specific dashboards
│   │   ├── admin/                # Admin dashboard
│   │   ├── warden/               # Warden hostel control center
│   │   ├── staff/                # Staff task execution view
│   │   └── guest/                # Resident portal
│   ├── api/
│   │   └── (Backend)/            # API routes
│   │       ├── auth/             # Authentication endpoints
│   │       ├── hostels/          # Hostel management
│   │       ├── rooms/            # Room management
│   │       ├── bookings/         # Booking operations
│   │       ├── payments/         # Payment processing
│   │       ├── expenses/         # Expense tracking
│   │       ├── complaints/       # Complaint tickets
│   │       ├── tasks/            # Staff tasks
│   │       ├── ai/               # AI assistant endpoints
│   │       └── cron/             # Automated tasks
│   ├── layout.tsx                # Global layout
│   └── page.tsx                  # Home page
├── components/
│   ├── appsidebar.tsx            # Navigation sidebar
│   ├── auth-forms/               # Login/signup components
│   ├── dashboard-cards/          # Dashboard widgets
│   ├── modals/                   # Modal dialogs
│   └── ui/                       # Reusable UI components
├── lib/
│   ├── apiAuth.ts                # JWT authentication logic
│   ├── permissions.js            # Permission checking
│   ├── statusTransitions.js      # Financial state machine
│   ├── idempotency.js            # Idempotency key handling
│   ├── rateLimit.ts              # Rate limiting middleware
│   ├── auditLogger.js            # Audit trail logging
│   ├── notificationTelemetry.js  # Email delivery tracking
│   ├── ollama.js                 # Ollama LLM integration
│   ├── ragContext.ts             # RAG context builder
│   └── db.ts                     # Database utilities
├── prisma/
│   ├── schema.prisma             # Main database schema
│   ├── ai-schema.prisma          # AI/RAG data schema
│   ├── migrations/               # Database migrations
│   └── seed.js                   # Seeding script
├── public/
│   ├── images/                   # Static images
│   └── uploads/                  # User uploads
├── mobile/                       # Expo React Native app
│   ├── app/                      # Mobile screens
│   ├── lib/                      # Mobile utilities
│   └── package.json
├── whatsapp-bot/                 # WhatsApp broadcast bot
│   ├── server.js                 # Bot entry point
│   ├── handlers/                 # Message handlers
│   └── package.json
├── docs/
│   └── PROJECT_DOCUMENTATION.md  # Detailed technical docs
├── package.json                  # Root dependencies
├── tailwind.config.js            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── .env.local                    # Environment variables
```

---

## 👥 User Roles & Permissions

### Role Hierarchy & Responsibilities

| Role | Scope | Key Responsibilities |
|------|-------|----------------------|
| **ADMIN** | System-Wide | Global management, multi-property oversight, system configuration, financial dashboard, salary approvals |
| **WARDEN** | Hostel-Scoped | Day-to-day hostel admin, room management, resident complaints, expense submission, staff task assignment |
| **STAFF** | Task-Based | Maintenance resolution, cleaning/laundry processing, task execution, complaint comment updates |
| **RESIDENT** | Self-Service | Room booking, rent payment, mess feedback, complaint submission, room swap requests |
| **GUEST** | Public/Applicant | Browse listings, submit guest booking applications, track application status |

### Granular Permission Flags

Sub-permissions can be granted to WARDEN & STAFF roles:

- 🏦 **canManageExpenses**: Create and submit expense claims
- 🍽️ **canManageMess**: Modify mess menus and inventory
- 💰 **canManageSalaries**: Process staff payroll
- 🔧 **canManageMaintenance**: Update maintenance tasks and inventory
- 💡 **canManageUtilities**: Log utility bill expenses
- ⚙️ **canManageGeneral**: Administrative settings access

---

## 🎯 Core Modules

### 1. **Hostel & Room Operations Module**
- ✅ Multi-floor hostel setup with amenity configuration
- ✅ Room type variants (Single, Double, Triple, Dormitory)
- ✅ Dynamic pricing (monthly and per-night rates)
- ✅ Real-time occupancy tracking
- ✅ Room swap approval workflow
- ✅ Property availability calendar

**Routes**: `/admin/hostels`, `/admin/rooms`, `/warden/rooms`

### 2. **Financial Management Module**
- ✅ Automated monthly rent invoice generation (1st of month)
- ✅ Multi-channel payment recording
- ✅ Refund request processing with approval workflow
- ✅ Payment reconciliation and audit trails
- ✅ Financial reports and revenue analytics
- ✅ Overdue payment notifications

**Routes**: `/admin/payments`, `/admin/finances`, `/resident/payments`, `/warden/payments`

### 3. **Expense & Payroll Module**
- ✅ Categorized expense submission (Mess, Utilities, Maintenance, General, Salary)
- ✅ Dual-approval workflow (Submit → Review → Approve/Reject)
- ✅ Staff salary slip generation
- ✅ Warden bonus/deduction management
- ✅ Monthly payroll automation
- ✅ Payment method tracking

**Routes**: `/admin/expenses`, `/warden/expenses`, `/admin/payroll`

### 4. **Maintenance & Complaints Module**
- ✅ Complaint ticket creation with image uploads
- ✅ Priority level assignment (LOW to URGENT)
- ✅ Staff assignment workflow
- ✅ Real-time comment threads
- ✅ Status tracking (Open → In-Progress → Resolved)
- ✅ Inventory parts usage logging

**Routes**: `/resident/complaints`, `/warden/complaints`, `/staff/tasks`

### 5. **Mess & Housekeeping Module**
- ✅ Weekly meal planner with meal timings
- ✅ Meal quality feedback ratings (1-5 stars)
- ✅ Inventory management with threshold alerts
- ✅ Cleaning schedule and log management
- ✅ Laundry item tracking
- ✅ Food cost analytics

**Routes**: `/warden/mess`, `/resident/mess`, `/warden/inventory`

### 6. **Notice Board Module**
- ✅ Targeted role-based announcements
- ✅ Hostel-specific broadcasting
- ✅ Notice expiration scheduling
- ✅ Multi-channel delivery (in-app, email, WhatsApp)
- ✅ Read receipt tracking

**Routes**: `/admin/notices`, `/warden/notices`, `/resident/notices`

---

## 📡 API Documentation

### Authentication Endpoints

```
POST   /api/auth/signin              - Login with email/password
POST   /api/auth/signup              - Register new account
POST   /api/auth/logout              - Logout and clear session
GET    /api/auth/me                  - Get current user profile
POST   /api/auth/2fa/setup           - Initialize 2FA
POST   /api/auth/2fa/verify          - Verify 2FA code
POST   /api/auth/webauthn/register   - Register biometric passkey
POST   /api/auth/webauthn/authenticate - Biometric login
```

### Hostel & Room Endpoints

```
GET    /api/hostels                  - List all hostels
POST   /api/hostels                  - Create new hostel (admin)
GET    /api/hostels/[id]             - Get hostel details
PATCH  /api/hostels/[id]             - Update hostel
GET    /api/rooms                    - List rooms (with filters)
POST   /api/rooms                    - Add room to hostel
GET    /api/rooms/[id]               - Get room details
PATCH  /api/rooms/[id]               - Update room info
```

### Booking Endpoints

```
GET    /api/bookings                 - Get user/hostel bookings
POST   /api/bookings                 - Create booking request
GET    /api/bookings/[id]            - Get booking details
PATCH  /api/bookings/[id]            - Update booking status
GET    /api/bookings/availability    - Check room availability
```

### Payment Endpoints

```
GET    /api/payments                 - Get payment records
POST   /api/payments                 - Record new payment
PATCH  /api/payments/[id]            - Approve/reject payment
POST   /api/payments/reconcile       - Reconcile payments (admin)
POST   /api/payments/refund          - Process refund
GET    /api/payments/analytics       - Financial analytics
```

### Expense Endpoints

```
GET    /api/expenses                 - List expenses
POST   /api/expenses                 - Submit expense
PATCH  /api/expenses/[id]            - Approve/reject expense
GET    /api/expenses/report          - Expense reports
```

### Complaint Endpoints

```
GET    /api/complaints               - Get complaint tickets
POST   /api/complaints               - Create complaint
GET    /api/complaints/[id]          - Get complaint details
PATCH  /api/complaints/[id]          - Update status/assign staff
POST   /api/complaints/[id]/comment  - Add comment to ticket
```

### AI Assistant Endpoints

```
POST   /api/ai/chat                  - Send query to AI assistant
```

---

## 🔐 Security Features

### 1. **JWT Authentication Engine**
- HTTP-only cookies prevent XSS token theft
- SameSite=Lax prevents CSRF attacks
- Token rotation on each request
- Secure flag enforced on HTTPS

### 2. **Financial Status Transition Safety**
```
Payment States:   PENDING → PAID/OVERDUE/REJECTED → REFUNDED
Expense States:   PENDING → APPROVED/REJECTED → PAID
```
Invalid transitions are rejected with HTTP 409 Conflict.

### 3. **Idempotency Guards**
- Unique idempotency keys prevent double-submission
- Protected routes: `/api/payments/*`, `/api/expenses/*`
- 24-hour idempotency key cache

### 4. **Rate Limiting**
- Redis-backed sliding window algorithm
- Protects auth endpoints: 5 attempts/15 minutes
- Protects API endpoints: 100 requests/15 minutes per user
- Prevents brute-force and DDoS attacks

### 5. **RBAC & Granular Permissions**
- Role checks on every protected route
- Granular permission flags for sub-roles
- Permission cascade prevents privilege escalation
- Audit logging on permission changes

### 6. **Audit Logging**
- Logs all sensitive operations (payments, permissions, deletions)
- Includes user ID, timestamp, action, and result
- Immutable audit trail for compliance
- Email delivery telemetry tracking

### 7. **Data Encryption**
- TLS/SSL for all data in transit
- Password hashing with bcrypt
- JWT encryption with HMAC-SHA256
- Secure random token generation

### 8. **Advanced Authentication**
- 📱 Two-Factor Authentication (TOTP-based OTP)
- 🔐 WebAuthn biometric passkey support
- 🔑 Fallback password authentication
- 📧 Email verification workflow

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Import GitHub repository
   - Configure environment variables
   - Deploy!

### Deploy to Alternative Platforms

#### Docker Deployment
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t hms:latest .
docker run -p 3000:3000 --env-file .env.local hms:latest
```

#### Self-Hosted (Linux Server)
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup
git clone https://github.com/Chaudaryabdullah89/managmentsystemhostel.git
cd managmentsystemhostel
npm ci

# Build and start
npm run build
npm start
```

---

## 📱 Mobile App

### Expo React Native Application

Located in `mobile/` directory

**Features:**
- 📱 Resident portal on mobile
- 🔐 Biometric authentication
- 🔔 Push notifications
- 📡 Offline-first architecture
- 🎨 Native iOS/Android UI

**Development:**
```bash
cd mobile
npm install
npm start
```

---

## 🤖 WhatsApp Bot

### Baileys-based WhatsApp Integration

Located in `whatsapp-bot/` directory

**Features:**
- 📢 Automated notice broadcasting
- 💬 Two-way messaging
- 🔐 QR-code authentication
- 📊 Message delivery tracking

**Development:**
```bash
cd whatsapp-bot
npm install
npm run dev
```

---

## 🧪 Testing

### Run Test Suite

```bash
npm run test
```

### Run Tests in Watch Mode

```bash
npm run test -- --watch
```

### Run Tests with Coverage

```bash
npm run test -- --coverage
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the Repository**
   ```bash
   git clone https://github.com/YOUR-USERNAME/managmentsystemhostel.git
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes & Commit**
   ```bash
   git add .
   git commit -m "Add your feature description"
   ```

4. **Push to Branch**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open Pull Request**
   - Describe changes clearly
   - Include any breaking changes
   - Reference related issues

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🌐 Live Demo

**Explore the live application**: [https://portalhms.vercel.app](https://portalhms.vercel.app)

---

## 📞 Support & Contact

- 📧 **Email**: For support inquiries
- 💬 **Issues**: Report bugs on GitHub Issues
- 📖 **Documentation**: See `docs/PROJECT_DOCUMENTATION.md` for detailed technical docs
- 🐛 **Bug Reports**: Use GitHub Issues with detailed reproduction steps

---

## 🎓 Learning Resources

- 📚 [Complete Project Documentation](docs/PROJECT_DOCUMENTATION.md)
- 📖 [Next.js Documentation](https://nextjs.org/docs)
- 🗄️ [Prisma ORM Guide](https://www.prisma.io/docs/)
- 🎨 [Tailwind CSS Reference](https://tailwindcss.com/docs)
- 🔐 [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)

---

## 🙏 Acknowledgments

Built with modern web technologies and best practices for enterprise-grade hostel management solutions.

---

**Last Updated**: July 2026  
**Status**: Active Development  
**Maintainer**: [Chaudaryabdullah89](https://github.com/Chaudaryabdullah89)
