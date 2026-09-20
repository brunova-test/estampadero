
CREATE TYPE "DesignStatus" AS ENUM ('SENT_TO_CLUB', 'CHANGES_REQUESTED', 'APPROVED');


CREATE TABLE "Design" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "DesignStatus" NOT NULL DEFAULT 'SENT_TO_CLUB',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Design_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "DesignVersion" (
    "id" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesignVersion_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "DesignComment" (
    "id" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesignComment_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "ProductDesign" (
    "id" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductDesign_pkey" PRIMARY KEY ("id")
);


CREATE INDEX "Design_clubId_idx" ON "Design"("clubId");


CREATE INDEX "Design_status_idx" ON "Design"("status");


CREATE UNIQUE INDEX "DesignVersion_designId_versionNumber_key" ON "DesignVersion"("designId", "versionNumber");


CREATE INDEX "DesignComment_designId_idx" ON "DesignComment"("designId");


CREATE UNIQUE INDEX "ProductDesign_designId_productId_key" ON "ProductDesign"("designId", "productId");


ALTER TABLE "Design" ADD CONSTRAINT "Design_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "DesignVersion" ADD CONSTRAINT "DesignVersion_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE CASCADE ON UPDATE CASCADE;


ALTER TABLE "DesignComment" ADD CONSTRAINT "DesignComment_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE CASCADE ON UPDATE CASCADE;


ALTER TABLE "ProductDesign" ADD CONSTRAINT "ProductDesign_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE CASCADE ON UPDATE CASCADE;


ALTER TABLE "ProductDesign" ADD CONSTRAINT "ProductDesign_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
