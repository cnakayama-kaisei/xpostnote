-- CreateTable
CREATE TABLE "Benchmark" (
    "id" SERIAL NOT NULL,
    "url" TEXT,
    "text" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "reposts" INTEGER NOT NULL DEFAULT 0,
    "replies" INTEGER NOT NULL DEFAULT 0,
    "quotes" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "postedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Benchmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StyleProfile" (
    "id" SERIAL NOT NULL,
    "hookType" TEXT NOT NULL,
    "structureType" TEXT NOT NULL,
    "toneFeatures" TEXT NOT NULL,
    "avgLength" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StyleProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Generation" (
    "id" SERIAL NOT NULL,
    "theme" TEXT NOT NULL,
    "claim" TEXT NOT NULL,
    "episode" TEXT,
    "target" TEXT,
    "tone" TEXT NOT NULL,
    "ngWords" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Generation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Draft" (
    "id" SERIAL NOT NULL,
    "generationId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "charCount" INTEGER NOT NULL,
    "intent" TEXT NOT NULL,
    "hook" TEXT NOT NULL,
    "structure" TEXT NOT NULL,
    "takeaways" TEXT NOT NULL,
    "ngCaution" TEXT,
    "summary" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "similarityScore" DOUBLE PRECISION NOT NULL,
    "riskFlags" TEXT NOT NULL,
    "adopted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Draft_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Draft" ADD CONSTRAINT "Draft_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "Generation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
