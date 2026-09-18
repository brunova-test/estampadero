ALTER TYPE "AgreementStatus" ADD VALUE IF NOT EXISTS 'PAUSED';

CREATE TABLE "AgreementChange" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "changedByUserId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgreementChange_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AgreementChange_agreementId_createdAt_idx"
ON "AgreementChange"("agreementId", "createdAt");

ALTER TABLE "AgreementChange"
ADD CONSTRAINT "AgreementChange_agreementId_fkey"
FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
