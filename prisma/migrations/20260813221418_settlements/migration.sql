
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'CANCELLED');


ALTER TABLE "Club" ADD COLUMN     "payoutCbu" TEXT;


ALTER TABLE "CommissionEntry" ADD COLUMN     "settlementId" TEXT;


CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "totalInCents" INTEGER NOT NULL,
    "receiptUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "confirmedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);


CREATE INDEX "Settlement_clubId_idx" ON "Settlement"("clubId");


CREATE INDEX "Settlement_status_idx" ON "Settlement"("status");


CREATE INDEX "CommissionEntry_settlementId_idx" ON "CommissionEntry"("settlementId");


ALTER TABLE "CommissionEntry" ADD CONSTRAINT "CommissionEntry_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;


ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
