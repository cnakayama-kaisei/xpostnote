-- AlterTable: Benchmark に category カラムを追加
ALTER TABLE "Benchmark" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'tweet';

-- AlterTable: Generation に mode カラムを追加
ALTER TABLE "Generation" ADD COLUMN IF NOT EXISTS "mode" TEXT NOT NULL DEFAULT 'tweet';

-- AlterTable: Draft に title カラムを追加（article モード用）
ALTER TABLE "Draft" ADD COLUMN IF NOT EXISTS "title" TEXT;
