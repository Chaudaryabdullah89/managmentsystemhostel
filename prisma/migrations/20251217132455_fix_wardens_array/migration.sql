-- AlterTable
ALTER TABLE "Hostel" ADD COLUMN     "completeaddress" TEXT,
ADD COLUMN     "laundaryavailable" BOOLEAN DEFAULT false,
ADD COLUMN     "messavailable" BOOLEAN DEFAULT false,
ADD COLUMN     "montlyrent" DOUBLE PRECISION,
ADD COLUMN     "pernightrent" DOUBLE PRECISION,
ADD COLUMN     "status" TEXT DEFAULT 'ACTIVE',
ADD COLUMN     "totalRooms" INTEGER DEFAULT 0,
ADD COLUMN     "wardens" TEXT[],
ADD COLUMN     "zip" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "city" TEXT,
ADD COLUMN     "hostelId" TEXT,
ADD COLUMN     "wardens" TEXT[];

-- AlterTable
ALTER TABLE "maintanance" ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "OtpVerification" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EMAIL_UPDATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpVerification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintanance" ADD CONSTRAINT "maintanance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
