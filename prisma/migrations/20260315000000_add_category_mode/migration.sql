-- AlterTable: Benchmark に category カラムを追加
ALTER TABLE "Benchmark" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'tweet';

-- AlterTable: Generation に mode カラムを追加
ALTER TABLE "Generation" ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'tweet';

-- AlterTable: Draft に title カラムを追加（article モード用）
ALTER TABLE "Draft" ADD COLUMN "title" TEXT;
