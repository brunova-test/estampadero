-- CreateEnum
CREATE TYPE "DesignStatus" AS ENUM ('SENT_TO_CLUB', 'CHANGES_REQUESTED', 'APPROVED');

-- CreateTable
CREATE TABLE "Design" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "DesignStatus" NOT NULL DEFAULT 'SENT_TO_CLUB',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Design_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignVersion" (
    "id" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesignVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignComment" (
    "id" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesignComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductDesign" (
    "id" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductDesign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Design_clubId_idx" ON "Design"("clubId");

-- CreateIndex
CREATE INDEX "Design_status_idx" ON "Design"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DesignVersion_designId_versionNumber_key" ON "DesignVersion"("designId", "versionNumber");

-- CreateIndex
CREATE INDEX "DesignComment_designId_idx" ON "DesignComment"("designId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductDesign_designId_productId_key" ON "ProductDesign"("designId", "productId");

-- AddForeignKey
ALTER TABLE "Design" ADD CONSTRAINT "Design_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignVersion" ADD CONSTRAINT "DesignVersion_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignComment" ADD CONSTRAINT "DesignComment_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDesign" ADD CONSTRAINT "ProductDesign_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDesign" ADD CONSTRAINT "ProductDesign_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
