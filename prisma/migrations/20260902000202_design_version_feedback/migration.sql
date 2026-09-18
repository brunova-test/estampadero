ALTER TABLE "DesignComment"
ADD COLUMN "versionId" TEXT;

CREATE INDEX "DesignComment_versionId_idx"
ON "DesignComment"("versionId");

ALTER TABLE "DesignComment"
ADD CONSTRAINT "DesignComment_versionId_fkey"
FOREIGN KEY ("versionId") REFERENCES "DesignVersion"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
