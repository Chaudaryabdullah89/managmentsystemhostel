# Hostel Management System - Database Schema Design

Based on the frontend requirements and feature analysis, here is the proposed Prisma Schema.

## key Enums

```prisma
enum UserRole {
  SUPER_ADMIN
  ADMIN
  WARDEN
  STAFF
  RESIDENT
  GUEST
}

enum HostelType {
  BOYS
  GIRLS
  MIXED
}

enum RoomType {
  SINGLE
  DOUBLE
  TRIPLE
  DORMITORY
}

enum RoomStatus {
  AVAILABLE
  OCCUPIED
  MAINTENANCE
  CLEANING
}

enum BookingStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
  REJECTED
}

enum PaymentStatus {
  PENDING
  PAID
  OVERDUE
  PARTIAL
  FAILED
  REFUNDED
}

enum PaymentMethod {
  CASH
  BANK_TRANSFER
  ONLINE
  CHEQUE
  OTHER
}

enum ComplaintStatus {
  PENDING
  IN_PROGRESS
  RESOLVED
  REJECTED
}

enum ComplaintPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum ComplaintCategory {
  MAINTENANCE
  CLEANLINESS
  NOISE
  SECURITY
  INTERNET
  OTHER
}

enum ExpenseCategory {
  UTILITIES
  MAINTENANCE
  SALARIES
  SUPPLIES
  GROCERIES
  OTHER
}

enum ExpenseStatus {
  PENDING
  APPROVED
  REJECTED
  PAID
}
```

## Models

### 1. User & Profiles
Centralized user management with specific profiles for residents and staff to keep the main table clean.

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String    // Hashed
  name          String
  phone         String?
  cnic          String?   // National ID (useful for all adult users)
  image         String?   // Avatar URL
  role          UserRole  @default(GUEST)
  isActive      Boolean   @default(true)
  
  // Relations
  residentProfile ResidentProfile?
  staffProfile    StaffProfile?
  
  bookings        Booking[]
  payments        Payment[]      // Payments made by this user
  complaints      Complaint[]    // Complaints filed by this user
  
  // Admin/Staff specific relations
  managedHostels  Hostel[]       @relation("HostelManager") // If user is warden/manager
  handledComplaints Complaint[]  @relation("ComplaintHandler")
  createdExpenses   Expense[]    @relation("ExpenseCreator")
  approvedExpenses  Expense[]    @relation("ExpenseApprover")

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model ResidentProfile {
  id              String    @id @default(cuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  guardianName    String?
  guardianPhone   String?
  emergencyContact String?
  address         String?
  city            String?
  
  // Hostel Info
  currentHostelId String?
  currentRoomId   String?
  
  // Documents
  documents       Json?     // Array of document URLs (CNIC, Student Card etc)
}

model StaffProfile {
  id              String    @id @default(cuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  designation     String    // Manager, Cleaner, Guard, etc.
  department      String?
  shift           String?   // Morning, Evening, Night
  
  // Salary Info
  basicSalary     Float     @default(0)
  allowances      Float     @default(0)
  
  // Employment Info
  joiningDate     DateTime  @default(now())
  documents       Json?
  
  salaries        Salary[]
}
```

### 2. Hostel & Rooms

```prisma
model Hostel {
  id          String      @id @default(cuid())
  name        String
  type        HostelType  @default(BOYS)
  address     String
  city        String
  state       String?
  country     String      @default("Pakistan")
  phone       String?
  email       String?
  description String?      @db.Text
  
  // Facilities
  floors      Int         @default(1)
  amenities   String[]    // Array of strings ["WiFi", "Generator"]
  images      String[]
  
  // Relations
  managerId   String?
  manager     User?       @relation("HostelManager", fields: [managerId], references: [id])
  rooms       Room[]
  expenses    Expense[]
  complaints  Complaint[]
  
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model Room {
  id          String      @id @default(cuid())
  hostelId    String
  hostel      Hostel      @relation(fields: [hostelId], references: [id], onDelete: Cascade)
  
  roomNumber  String
  floor       Int
  type        RoomType    @default(TRIPLE)
  capacity    Int         @default(3)
  price       Float       // Monthly Rent
  
  status      RoomStatus  @default(AVAILABLE)
  
  // Features
  amenities   String[]
  images      String[]
  
  // Relations
  bookings    Booking[]
  
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@unique([hostelId, roomNumber]) // Room 101 in Hostel A is unique
}
```

### 3. Bookings

```prisma
model Booking {
  id          String        @id @default(cuid())
  
  userId      String
  user        User          @relation(fields: [userId], references: [id])
  
  roomId      String
  room        Room          @relation(fields: [roomId], references: [id])
  
  // Booking Details
  checkIn     DateTime
  checkOut    DateTime?
  status      BookingStatus @default(PENDING)
  
  // Financials
  totalAmount Float
  securityDeposit Float   @default(0)
  
  // Relations
  payments    Payment[]
  
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}
```

### 4. Finance (Payments, Expenses, Salaries)

```prisma
model Payment {
  id            String        @id @default(cuid())
  
  // Payer
  userId        String
  user          User          @relation(fields: [userId], references: [id])
  
  // Context
  bookingId     String?
  booking       Booking?      @relation(fields: [bookingId], references: [id])
  
  amount        Float
  date          DateTime      @default(now())
  dueDate       DateTime?
  
  type          String        // Rent, Security, Fine, Mess fee
  status        PaymentStatus @default(PENDING)
  method        PaymentMethod @default(CASH)
  
  transactionId String?
  receiptUrl    String?
  notes         String?
  
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}

model Expense {
  id            String          @id @default(cuid())
  hostelId      String
  hostel        Hostel          @relation(fields: [hostelId], references: [id])
  
  title         String
  description   String?
  amount        Float
  date          DateTime        @default(now())
  category      ExpenseCategory
  
  status        ExpenseStatus   @default(PENDING)
  receiptUrl    String?
  
  // Approvals
  submittedById String
  submittedBy   User            @relation("ExpenseCreator", fields: [submittedById], references: [id])
  
  approvedById  String?
  approvedBy    User?           @relation("ExpenseApprover", fields: [approvedById], references: [id])
  
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
}

model Salary {
  id            String          @id @default(cuid())
  
  staffId       String
  staff         StaffProfile    @relation(fields: [staffId], references: [id])
  
  month         String          // e.g. "2025-01"
  amount        Float           // Total amount
  
  // Breakdown
  basicSalary   Float
  allowances    Float           @default(0)
  bonuses       Float           @default(0)
  deductions    Float           @default(0)
  
  status        PaymentStatus   @default(PENDING)
  paymentDate   DateTime?
  paymentMethod PaymentMethod?
  
  notes         String?
  
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
}
```

### 5. Operations (Complaints)

```prisma
model Complaint {
  id            String            @id @default(cuid())
  
  // Reporter
  userId        String
  user          User              @relation(fields: [userId], references: [id])
  
  // Location
  hostelId      String
  hostel        Hostel            @relation(fields: [hostelId], references: [id])
  roomNumber    String?           // Optional, if room specific
  
  title         String
  description   String
  category      ComplaintCategory
  priority      ComplaintPriority @default(MEDIUM)
  
  status        ComplaintStatus   @default(PENDING)
  
  // Resolution
  assignedToId  String?
  assignedTo    User?             @relation("ComplaintHandler", fields: [assignedToId], references: [id])
  
  resolutionNotes String?
  resolvedAt      DateTime?
  
  images        String[]          // Evidence
  
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
}
```
