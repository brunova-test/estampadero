ALTER TABLE "Order"
ADD COLUMN "checkoutRequestId" TEXT,
ADD COLUMN "stockReleasedAt" TIMESTAMP(3);

ALTER TABLE "OrderItem"
ADD COLUMN "stockReserved" BOOLEAN NOT NULL DEFAULT false;




UPDATE "OrderItem" AS item
SET "stockReserved" = true
FROM "Order" AS orders, "Product" AS product
WHERE item."orderId" = orders."id"
  AND item."productId" = product."id"
  AND orders."status" = 'PENDING_PAYMENT'
  AND product."showStock" = true;

CREATE UNIQUE INDEX "Order_checkoutRequestId_key"
ON "Order"("checkoutRequestId");

CREATE INDEX "Order_status_stockReleasedAt_createdAt_idx"
ON "Order"("status", "stockReleasedAt", "createdAt");

CREATE INDEX "Payment_orderId_status_updatedAt_idx"
ON "Payment"("orderId", "status", "updatedAt");

CREATE INDEX "Payment_provider_status_createdAt_idx"
ON "Payment"("provider", "status", "createdAt");

CREATE TABLE "RateLimitBucket" (
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key", "windowStart")
);

CREATE INDEX "RateLimitBucket_expiresAt_idx"
ON "RateLimitBucket"("expiresAt");
