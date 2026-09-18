ALTER TABLE "Order" ADD COLUMN "productionRemovedAt" TIMESTAMP(3);

CREATE TABLE "ManualProductionItem" (
    "id" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "notes" TEXT,
    "productionStatus" "ProductionItemStatus" NOT NULL DEFAULT 'WAITING',
    "productionScheduledAt" TIMESTAMP(3),
    "productionStartedAt" TIMESTAMP(3),
    "productionReadyAt" TIMESTAMP(3),
    "productionShippedAt" TIMESTAMP(3),
    "productionDeliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ManualProductionItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ManualProductionItem_productionStatus_idx"
ON "ManualProductionItem"("productionStatus");

CREATE INDEX "ManualProductionItem_productionScheduledAt_idx"
ON "ManualProductionItem"("productionScheduledAt");

CREATE INDEX "Order_productionRemovedAt_idx"
ON "Order"("productionRemovedAt");
