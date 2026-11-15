-- AlterTable
ALTER TABLE "RoadmapItem" ADD COLUMN     "parentId" TEXT;

-- CreateIndex
CREATE INDEX "RoadmapItem_parentId_position_idx" ON "RoadmapItem"("parentId", "position");

-- AddForeignKey
ALTER TABLE "RoadmapItem" ADD CONSTRAINT "RoadmapItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "RoadmapItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
