

CREATE TYPE "ProductionItemStatus" AS ENUM (
  'WAITING',
  'SCHEDULED',
  'IN_PRODUCTION',
  'READY',
  'SHIPPED',
  'DELIVERED'
);

ALTER TABLE "OrderItem"
ADD COLUMN "productionStatus" "ProductionItemStatus" NOT NULL DEFAULT 'WAITING',
ADD COLUMN "productionScheduledAt" TIMESTAMP(3),
ADD COLUMN "productionStartedAt" TIMESTAMP(3),
ADD COLUMN "productionReadyAt" TIMESTAMP(3),
ADD COLUMN "productionShippedAt" TIMESTAMP(3),
ADD COLUMN "productionDeliveredAt" TIMESTAMP(3);

UPDATE "OrderItem" AS item
SET
  "productionStatus" = CASE
    WHEN orders."status" = 'DELIVERED' THEN 'DELIVERED'::"ProductionItemStatus"
    WHEN orders."status" IN ('READY_FOR_SHIPPING', 'SHIPPED') THEN 'READY'::"ProductionItemStatus"
    WHEN orders."status" = 'IN_PRODUCTION' THEN 'IN_PRODUCTION'::"ProductionItemStatus"
    ELSE 'WAITING'::"ProductionItemStatus"
  END,
  "productionStartedAt" = CASE
    WHEN orders."status" IN ('IN_PRODUCTION', 'READY_FOR_SHIPPING', 'SHIPPED', 'DELIVERED')
      THEN orders."updatedAt"
    ELSE NULL
  END,
  "productionReadyAt" = CASE
    WHEN orders."status" IN ('READY_FOR_SHIPPING', 'SHIPPED', 'DELIVERED')
      THEN orders."updatedAt"
    ELSE NULL
  END,
  "productionDeliveredAt" = CASE
    WHEN orders."status" = 'DELIVERED'
      THEN COALESCE(orders."deliveredAt", orders."updatedAt")
    ELSE NULL
  END
FROM "Order" AS orders
WHERE orders."id" = item."orderId";

CREATE INDEX "OrderItem_productionStatus_idx" ON "OrderItem"("productionStatus");
CREATE INDEX "OrderItem_productionScheduledAt_idx" ON "OrderItem"("productionScheduledAt");
