-- DropForeignKey
ALTER TABLE "Design" DROP CONSTRAINT "Design_clubId_fkey";

-- AddForeignKey
ALTER TABLE "Design" ADD CONSTRAINT "Design_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;
