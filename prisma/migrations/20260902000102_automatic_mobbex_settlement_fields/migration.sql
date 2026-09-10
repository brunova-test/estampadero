-- AUTOMATIC was added and committed by the previous migration.
ALTER TABLE "Agreement"
  ALTER COLUMN "settlementFrequency" SET DEFAULT 'AUTOMATIC';

ALTER TABLE "Settlement"
  ADD COLUMN "transferProvider" TEXT,
  ADD COLUMN "transferId" TEXT,
  ADD COLUMN "transferStatus" TEXT,
  ADD COLUMN "transferLastEventAt" TIMESTAMP(3),
  ADD COLUMN "transferAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "transferLastError" TEXT;

