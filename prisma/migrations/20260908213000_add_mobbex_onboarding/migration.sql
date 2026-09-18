CREATE TYPE "MobbexOnboardingStatus" AS ENUM (
  'NOT_STARTED',
  'REGISTRATION_PENDING',
  'DETAILS_SUBMITTED',
  'ACCESS_REQUESTED',
  'AUTHORIZATION_CONFIRMED',
  'ACTIVE'
);

ALTER TABLE "Club"
  ADD COLUMN "mobbexOnboardingStatus" "MobbexOnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
  ADD COLUMN "mobbexSubmittedEntityId" TEXT,
  ADD COLUMN "mobbexTaxId" TEXT,
  ADD COLUMN "mobbexLegalName" TEXT,
  ADD COLUMN "mobbexContactName" TEXT,
  ADD COLUMN "mobbexContactEmail" TEXT,
  ADD COLUMN "mobbexContactPhone" TEXT,
  ADD COLUMN "mobbexSubmittedAt" TIMESTAMP(3),
  ADD COLUMN "mobbexAccessRequestedAt" TIMESTAMP(3),
  ADD COLUMN "mobbexAuthorizationConfirmedAt" TIMESTAMP(3),
  ADD COLUMN "mobbexActivatedAt" TIMESTAMP(3);

UPDATE "Club"
SET
  "mobbexOnboardingStatus" = 'ACTIVE',
  "mobbexActivatedAt" = CURRENT_TIMESTAMP
WHERE "mobbexEntityId" IS NOT NULL;
