-- 1. User テーブルを先に作成
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "loginId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'customer',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_loginId_key" ON "User"("loginId");

-- 2. admin ユーザーをプレースホルダーで挿入（パスワードハッシュはseedで上書き）
INSERT INTO "User" ("id", "loginId", "passwordHash", "role", "mustChangePassword", "enabled", "createdAt", "updatedAt")
VALUES (
    'cm_admin_00000000000000',
    'admin',
    '$2b$12$PLACEHOLDER_REPLACED_BY_SEED_SCRIPT_XXXXXXXXXXXXXXXXXX',
    'admin',
    false,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 3. UserProfile テーブルを作成
CREATE TABLE "UserProfile" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "worldview" TEXT,
    "audience" TEXT,
    "experiences" TEXT,
    "toneRules" TEXT,
    "ngWords" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- 4. 既存テーブルに userId を NULL 許容で追加
ALTER TABLE "Benchmark" ADD COLUMN "userId" TEXT;
ALTER TABLE "StyleProfile" ADD COLUMN "userId" TEXT;
ALTER TABLE "Generation" ADD COLUMN "userId" TEXT;

-- 5. 既存の全行を admin に帰属
UPDATE "Benchmark"    SET "userId" = 'cm_admin_00000000000000' WHERE "userId" IS NULL;
UPDATE "StyleProfile" SET "userId" = 'cm_admin_00000000000000' WHERE "userId" IS NULL;
UPDATE "Generation"   SET "userId" = 'cm_admin_00000000000000' WHERE "userId" IS NULL;

-- 6. NOT NULL 制約を付与
ALTER TABLE "Benchmark"    ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "StyleProfile" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Generation"   ALTER COLUMN "userId" SET NOT NULL;

-- 7. 外部キー制約を追加
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Benchmark" ADD CONSTRAINT "Benchmark_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StyleProfile" ADD CONSTRAINT "StyleProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Generation" ADD CONSTRAINT "Generation_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
