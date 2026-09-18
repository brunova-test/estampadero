-- Stock is optional because most products are manufactured after payment.
ALTER TABLE "Product" ADD COLUMN "showStock" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "ProductVariant" ALTER COLUMN "stock" DROP NOT NULL;
ALTER TABLE "ProductVariant" ALTER COLUMN "stock" DROP DEFAULT;
