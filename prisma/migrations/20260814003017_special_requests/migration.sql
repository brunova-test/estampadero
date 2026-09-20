
CREATE TYPE "SpecialRequestStatus" AS ENUM ('NEW', 'CONTACTED', 'CONVERTED', 'DECLINED');


CREATE TABLE "SpecialRequest" (
    "id" TEXT NOT NULL,
    "status" "SpecialRequestStatus" NOT NULL DEFAULT 'NEW',
    "contactName" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "garmentType" TEXT NOT NULL,
    "estimatedQty" TEXT NOT NULL,
    "sizesAndColors" TEXT NOT NULL,
    "neededBy" TEXT,
    "comments" TEXT,
    "attachmentName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpecialRequest_pkey" PRIMARY KEY ("id")
);


CREATE INDEX "SpecialRequest_status_idx" ON "SpecialRequest"("status");
