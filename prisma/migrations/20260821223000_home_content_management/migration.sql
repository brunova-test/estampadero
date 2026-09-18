CREATE TABLE "HomeContentPiece" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "section" TEXT NOT NULL DEFAULT 'HERO',
    "title" TEXT NOT NULL,
    "eyebrow" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "desktopImageUrl" TEXT NOT NULL,
    "mobileImageUrl" TEXT NOT NULL,
    "ctaLabel" TEXT NOT NULL,
    "ctaHref" TEXT NOT NULL,
    "secondaryCtaLabel" TEXT,
    "secondaryCtaHref" TEXT,
    "tags" TEXT[] NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'VISIBLE',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HomeContentPiece_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SiteContentSetting" (
    "id" TEXT NOT NULL DEFAULT 'home',
    "carouselEnabled" BOOLEAN NOT NULL DEFAULT true,
    "carouselIntervalMs" INTEGER NOT NULL DEFAULT 4000,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SiteContentSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HomeContentPiece_code_key" ON "HomeContentPiece"("code");
CREATE INDEX "HomeContentPiece_section_sortOrder_idx" ON "HomeContentPiece"("section", "sortOrder");
CREATE INDEX "HomeContentPiece_status_idx" ON "HomeContentPiece"("status");
