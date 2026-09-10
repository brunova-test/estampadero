CREATE TYPE "SettlementFrequency" AS ENUM ('BIWEEKLY', 'MONTHLY');

ALTER TABLE "Agreement"
ADD COLUMN "settlementFrequency" "SettlementFrequency" NOT NULL DEFAULT 'MONTHLY';

ALTER TABLE "Settlement"
ADD COLUMN "periodStart" TIMESTAMP(3),
ADD COLUMN "periodEnd" TIMESTAMP(3),
ADD COLUMN "createdByUserId" TEXT;

UPDATE "Settlement"
SET
  "periodStart" = date_trunc('month', "createdAt"),
  "periodEnd" = date_trunc('month', "createdAt") + interval '1 month' - interval '1 millisecond';

ALTER TABLE "Settlement"
ALTER COLUMN "periodStart" SET NOT NULL,
ALTER COLUMN "periodEnd" SET NOT NULL;

CREATE UNIQUE INDEX "Settlement_clubId_periodStart_periodEnd_key"
ON "Settlement"("clubId", "periodStart", "periodEnd");

CREATE TABLE "SettlementEvent" (
    "id" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "changedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettlementEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SettlementEvent_settlementId_createdAt_idx"
ON "SettlementEvent"("settlementId", "createdAt");

ALTER TABLE "SettlementEvent"
ADD CONSTRAINT "SettlementEvent_settlementId_fkey"
FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "UploadedDocument" (
    "id" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadedDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UploadedDocument_createdAt_idx"
ON "UploadedDocument"("createdAt");
