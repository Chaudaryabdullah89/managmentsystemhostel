-- AlterTable User: Add uid field
ALTER TABLE "User" ADD COLUMN "uid" TEXT;

-- AlterTable Booking: Add uid field
ALTER TABLE "Booking" ADD COLUMN "uid" TEXT;

-- AlterTable Payment: Add uid field
ALTER TABLE "Payment" ADD COLUMN "uid" TEXT;

-- AlterTable Complaint: Add uid field
ALTER TABLE "Complaint" ADD COLUMN "uid" TEXT;

-- AlterTable maintanance: Add uid field
ALTER TABLE "maintanance" ADD COLUMN "uid" TEXT;

-- Create unique indexes for uid fields
CREATE UNIQUE INDEX "User_uid_key" ON "User"("uid");
CREATE UNIQUE INDEX "Booking_uid_key" ON "Booking"("uid");
CREATE UNIQUE INDEX "Payment_uid_key" ON "Payment"("uid");
CREATE UNIQUE INDEX "Complaint_uid_key" ON "Complaint"("uid");
CREATE UNIQUE INDEX "maintanance_uid_key" ON "maintanance"("uid");

-- Generate UIDs for existing records
-- User UIDs: USR-XXXXXX
UPDATE "User" SET "uid" = 'USR-' || UPPER(SUBSTRING(id FROM 1 FOR 6)) WHERE "uid" IS NULL;

-- Booking UIDs: BKG-XXXXXX
UPDATE "Booking" SET "uid" = 'BKG-' || UPPER(SUBSTRING(id FROM 1 FOR 6)) WHERE "uid" IS NULL;

-- Payment UIDs: PAY-XXXXXX
UPDATE "Payment" SET "uid" = 'PAY-' || UPPER(SUBSTRING(id FROM 1 FOR 6)) WHERE "uid" IS NULL;

-- Complaint UIDs: CMP-XXXXXX
UPDATE "Complaint" SET "uid" = 'CMP-' || UPPER(SUBSTRING(id FROM 1 FOR 6)) WHERE "uid" IS NULL;

-- Maintenance UIDs: MNT-XXXXXX
UPDATE "maintanance" SET "uid" = 'MNT-' || UPPER(SUBSTRING(id FROM 1 FOR 6)) WHERE "uid" IS NULL;
