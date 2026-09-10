ALTER TABLE "Order"
ADD COLUMN "deliveredAt" TIMESTAMP(3);

ALTER TABLE "Payment"
ADD COLUMN "paymentMethodType" TEXT,
ADD COLUMN "paymentMethodId" TEXT,
ADD COLUMN "installments" INTEGER,
ADD COLUMN "moneyReleaseDate" TIMESTAMP(3),
ADD COLUMN "moneyReleasedAt" TIMESTAMP(3),
ADD COLUMN "netReceivedInCents" INTEGER,
ADD COLUMN "feeInCents" INTEGER,
ADD COLUMN "financingFeeInCents" INTEGER,
ADD COLUMN "amountRefundedInCents" INTEGER NOT NULL DEFAULT 0;

CREATE TYPE "CommissionStatus_new" AS ENUM (
  'ACCRUED',
  'PENDING_RELEASE',
  'PENDING_DELIVERY',
  'RETURN_WINDOW',
  'AVAILABLE',
  'IN_SETTLEMENT',
  'SETTLED',
  'REVERSED'
);

ALTER TABLE "CommissionEntry"
ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "CommissionEntry"
ALTER COLUMN "status" TYPE "CommissionStatus_new"
USING ("status"::text::"CommissionStatus_new");

DROP TYPE "CommissionStatus";
ALTER TYPE "CommissionStatus_new" RENAME TO "CommissionStatus";

CREATE TYPE "CommissionEntryType" AS ENUM ('SALE', 'REFUND_ADJUSTMENT');

DROP INDEX "CommissionEntry_orderItemId_key";

ALTER TABLE "CommissionEntry"
ADD COLUMN "paymentId" TEXT,
ADD COLUMN "entryType" "CommissionEntryType" NOT NULL DEFAULT 'SALE',
ADD COLUMN "sourceKey" TEXT,
ADD COLUMN "releasedAt" TIMESTAMP(3),
ADD COLUMN "returnWindowEndsAt" TIMESTAMP(3),
ADD COLUMN "availableAt" TIMESTAMP(3),
ADD COLUMN "reversedAt" TIMESTAMP(3),
ADD COLUMN "reversalReason" TEXT;

UPDATE "CommissionEntry"
SET "sourceKey" = 'sale:' || "orderItemId";

UPDATE "CommissionEntry" ce
SET "paymentId" = (
  SELECT p2."id"
  FROM "Payment" p2
  WHERE p2."orderId" = ce."orderId"
    AND p2."status" IN ('APPROVED', 'PARTIALLY_REFUNDED', 'REFUNDED')
  ORDER BY p2."updatedAt" DESC
  LIMIT 1
);

ALTER TABLE "CommissionEntry"
ALTER COLUMN "sourceKey" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING_RELEASE';

CREATE UNIQUE INDEX "CommissionEntry_sourceKey_key" ON "CommissionEntry"("sourceKey");
CREATE INDEX "CommissionEntry_paymentId_idx" ON "CommissionEntry"("paymentId");
CREATE INDEX "CommissionEntry_orderItemId_idx" ON "CommissionEntry"("orderItemId");
CREATE INDEX "CommissionEntry_availableAt_idx" ON "CommissionEntry"("availableAt");

ALTER TABLE "CommissionEntry"
ADD CONSTRAINT "CommissionEntry_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT "CommissionEntry_orderItemId_fkey"
FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT "CommissionEntry_paymentId_fkey"
FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TYPE "CustomerRequestType" AS ENUM ('WITHDRAWAL', 'RETURN', 'CLAIM');
CREATE TYPE "CustomerRequestStatus" AS ENUM (
  'REQUESTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'REFUND_PROCESSING',
  'REFUNDED',
  'CLOSED'
);

CREATE TABLE "CustomerRequest" (
  "id" TEXT NOT NULL,
  "publicCode" TEXT NOT NULL,
  "type" "CustomerRequestType" NOT NULL,
  "status" "CustomerRequestStatus" NOT NULL DEFAULT 'REQUESTED',
  "orderId" TEXT NOT NULL,
  "paymentId" TEXT,
  "customerEmail" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "details" TEXT,
  "requestedRefundInCents" INTEGER NOT NULL,
  "approvedRefundInCents" INTEGER,
  "providerRefundId" TEXT,
  "providerRefundStatus" TEXT,
  "refundIdempotencyKey" TEXT,
  "eligibilitySnapshot" JSONB,
  "reviewedByUserId" TEXT,
  "reviewNote" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "refundedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CustomerRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerRequestItem" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "orderItemId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitAmountInCents" INTEGER NOT NULL,
  "lineAmountInCents" INTEGER NOT NULL,

  CONSTRAINT "CustomerRequestItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CustomerRequest_publicCode_key" ON "CustomerRequest"("publicCode");
CREATE UNIQUE INDEX "CustomerRequest_refundIdempotencyKey_key" ON "CustomerRequest"("refundIdempotencyKey");
CREATE INDEX "CustomerRequest_orderId_idx" ON "CustomerRequest"("orderId");
CREATE INDEX "CustomerRequest_status_idx" ON "CustomerRequest"("status");
CREATE INDEX "CustomerRequest_createdAt_idx" ON "CustomerRequest"("createdAt");
CREATE UNIQUE INDEX "CustomerRequestItem_requestId_orderItemId_key" ON "CustomerRequestItem"("requestId", "orderItemId");
CREATE INDEX "CustomerRequestItem_orderItemId_idx" ON "CustomerRequestItem"("orderItemId");

ALTER TABLE "CustomerRequest"
ADD CONSTRAINT "CustomerRequest_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT "CustomerRequest_paymentId_fkey"
FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CustomerRequestItem"
ADD CONSTRAINT "CustomerRequestItem_requestId_fkey"
FOREIGN KEY ("requestId") REFERENCES "CustomerRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "CustomerRequestItem_orderItemId_fkey"
FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SiteContentSetting"
ADD COLUMN "returnWindowDays" INTEGER NOT NULL DEFAULT 10;
