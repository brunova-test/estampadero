ALTER TYPE "PaymentChannel" ADD VALUE 'MOBBEX_CHECKOUT';
ALTER TYPE "PaymentProvider" ADD VALUE 'MOBBEX';
ALTER TYPE "PaymentProcessor" ADD VALUE 'MOBBEX';

ALTER TABLE "Club" ADD COLUMN "mobbexEntityId" TEXT;
CREATE UNIQUE INDEX "Club_mobbexEntityId_key" ON "Club"("mobbexEntityId");
