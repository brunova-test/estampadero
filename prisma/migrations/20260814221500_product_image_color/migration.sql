
ALTER TABLE "ProductImage" ADD COLUMN "color" TEXT;

UPDATE "ProductImage" AS image
SET "color" = CASE product."code"
  WHEN 'BZ-1042' THEN 'Negro'
  WHEN 'CM-208' THEN 'Azul'
  WHEN 'RT-311' THEN 'Gris'
  WHEN 'CH-115' THEN 'Azul marino'
  WHEN 'SH-201' THEN 'Negro'
  WHEN 'GO-020' THEN 'Negro'
  ELSE NULL
END
FROM "Product" AS product
WHERE image."productId" = product."id";
