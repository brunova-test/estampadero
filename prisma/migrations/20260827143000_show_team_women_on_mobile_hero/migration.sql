-- Keep the strongest team photo in the first hero on both desktop and mobile.
-- The condition preserves any custom mobile image uploaded from the content editor.
UPDATE "HomeContentPiece"
SET "mobileImageUrl" = '/images/equipo-main.png',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'HERO-01'
  AND "mobileImageUrl" = '/images/equipo-t2.png';
