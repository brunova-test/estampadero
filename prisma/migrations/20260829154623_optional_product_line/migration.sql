-- Products can exist without belonging to a commercial line.
ALTER TABLE "Product" ALTER COLUMN "line" DROP NOT NULL;
