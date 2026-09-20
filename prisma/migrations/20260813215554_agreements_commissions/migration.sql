
CREATE TYPE "SettlementMethod" AS ENUM ('TRANSFER', 'SPLIT_MP');


CREATE TYPE "AgreementStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');


CREATE TYPE "CommissionStatus" AS ENUM ('ACCRUED', 'SETTLED');


CREATE TABLE "Agreement" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "AgreementStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "basePercentage" INTEGER NOT NULL,
    "settlementMethod" "SettlementMethod" NOT NULL DEFAULT 'TRANSFER',
    "contractUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agreement_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "AgreementProductRate" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "percentage" INTEGER NOT NULL,

    CONSTRAINT "AgreementProductRate_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "CommissionEntry" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "orderNumber" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "baseAmountInCents" INTEGER NOT NULL,
    "percentageApplied" INTEGER NOT NULL,
    "amountInCents" INTEGER NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'ACCRUED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionEntry_pkey" PRIMARY KEY ("id")
);


CREATE UNIQUE INDEX "Agreement_code_key" ON "Agreement"("code");


CREATE INDEX "Agreement_clubId_idx" ON "Agreement"("clubId");


CREATE INDEX "Agreement_status_idx" ON "Agreement"("status");


CREATE UNIQUE INDEX "AgreementProductRate_agreementId_productId_key" ON "AgreementProductRate"("agreementId", "productId");


CREATE UNIQUE INDEX "CommissionEntry_orderItemId_key" ON "CommissionEntry"("orderItemId");


CREATE INDEX "CommissionEntry_clubId_idx" ON "CommissionEntry"("clubId");


CREATE INDEX "CommissionEntry_status_idx" ON "CommissionEntry"("status");


ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "AgreementProductRate" ADD CONSTRAINT "AgreementProductRate_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;


ALTER TABLE "CommissionEntry" ADD CONSTRAINT "CommissionEntry_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "CommissionEntry" ADD CONSTRAINT "CommissionEntry_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
