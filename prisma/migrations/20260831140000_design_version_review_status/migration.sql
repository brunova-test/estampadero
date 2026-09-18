ALTER TABLE "DesignVersion"
ADD COLUMN "status" "DesignStatus" NOT NULL DEFAULT 'SENT_TO_CLUB',
ADD COLUMN "changeNote" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "DesignVersion" AS version
SET "status" = design."status"
FROM "Design" AS design
WHERE version."designId" = design."id"
  AND version."versionNumber" = (
    SELECT MAX(latest."versionNumber")
    FROM "DesignVersion" AS latest
    WHERE latest."designId" = version."designId"
  );
