-- CreateEnum
CREATE TYPE "LanguageStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'PLANNED', 'NATIVE');

-- CreateEnum
CREATE TYPE "RoutineFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT '',
    "goal" TEXT NOT NULL DEFAULT '',
    "status" "LanguageStatus" NOT NULL DEFAULT 'PLANNED',
    "targetHours" INTEGER,
    "position" INTEGER NOT NULL,
    "topicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "languageId" TEXT,
    "title" TEXT NOT NULL,
    "details" TEXT,
    "frequency" "RoutineFrequency" NOT NULL DEFAULT 'DAILY',
    "weekdays" INTEGER[],
    "minutes" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoutineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineCheck" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" DATE NOT NULL,
    "minutes" INTEGER NOT NULL DEFAULT 0,
    "studyLogId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoutineCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LanguagePlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LanguagePlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Language_topicId_key" ON "Language"("topicId");

-- CreateIndex
CREATE INDEX "Language_userId_position_idx" ON "Language"("userId", "position");

-- CreateIndex
CREATE INDEX "RoutineItem_userId_frequency_position_idx" ON "RoutineItem"("userId", "frequency", "position");

-- CreateIndex
CREATE UNIQUE INDEX "RoutineCheck_studyLogId_key" ON "RoutineCheck"("studyLogId");

-- CreateIndex
CREATE INDEX "RoutineCheck_userId_period_idx" ON "RoutineCheck"("userId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "RoutineCheck_itemId_period_key" ON "RoutineCheck"("itemId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "LanguagePlan_userId_key" ON "LanguagePlan"("userId");

-- AddForeignKey
ALTER TABLE "Language" ADD CONSTRAINT "Language_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Language" ADD CONSTRAINT "Language_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineItem" ADD CONSTRAINT "RoutineItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineItem" ADD CONSTRAINT "RoutineItem_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineCheck" ADD CONSTRAINT "RoutineCheck_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "RoutineItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineCheck" ADD CONSTRAINT "RoutineCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineCheck" ADD CONSTRAINT "RoutineCheck_studyLogId_fkey" FOREIGN KEY ("studyLogId") REFERENCES "StudyLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LanguagePlan" ADD CONSTRAINT "LanguagePlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
