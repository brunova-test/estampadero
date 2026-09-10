CREATE TABLE "CatalogLine" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CatalogLine_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CatalogLine_name_key" ON "CatalogLine"("name");
CREATE UNIQUE INDEX "CatalogLine_slug_key" ON "CatalogLine"("slug");

ALTER TABLE "Product" ADD COLUMN "lineId" TEXT;
CREATE INDEX "Product_lineId_idx" ON "Product"("lineId");
ALTER TABLE "Product" ADD CONSTRAINT "Product_lineId_fkey"
  FOREIGN KEY ("lineId") REFERENCES "CatalogLine"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
