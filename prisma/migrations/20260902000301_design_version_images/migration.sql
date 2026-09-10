CREATE TABLE "DesignVersionImage" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesignVersionImage_pkey" PRIMARY KEY ("id")
);

INSERT INTO "DesignVersionImage" ("id", "versionId", "url", "position")
SELECT 'legacy-' || "id", "id", "imageUrl", 0
FROM "DesignVersion";

CREATE UNIQUE INDEX "DesignVersionImage_versionId_position_key"
ON "DesignVersionImage"("versionId", "position");

CREATE INDEX "DesignVersionImage_versionId_idx"
ON "DesignVersionImage"("versionId");

ALTER TABLE "DesignVersionImage"
ADD CONSTRAINT "DesignVersionImage_versionId_fkey"
FOREIGN KEY ("versionId") REFERENCES "DesignVersion"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
