

UPDATE "HomeContentPiece"
SET "mobileImageUrl" = '/images/equipo-main.png',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'HERO-01'
  AND "mobileImageUrl" = '/images/equipo-t2.png';
