
CREATE TYPE "ProductionBatchStatus" AS ENUM ('OPEN', 'CLOSED');


ALTER TABLE "Order" ADD COLUMN     "productionBatchId" TEXT;


CREATE TABLE "ProductionBatch" (
    "id" TEXT NOT NULL,
    "batchNumber" SERIAL NOT NULL,
    "periodDays" INTEGER NOT NULL DEFAULT 10,
    "status" "ProductionBatchStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "ProductionBatch_pkey" PRIMARY KEY ("id")
);


CREATE INDEX "ProductionBatch_status_idx" ON "ProductionBatch"("status");


CREATE INDEX "Order_productionBatchId_idx" ON "Order"("productionBatchId");


ALTER TABLE "Order" ADD CONSTRAINT "Order_productionBatchId_fkey" FOREIGN KEY ("productionBatchId") REFERENCES "ProductionBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
