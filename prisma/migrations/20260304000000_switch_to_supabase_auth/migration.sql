-- Switch from NextAuth Credentials to Supabase Auth (Google OAuth)
-- Existing users (created with loginId/password) are deleted (clean slate).
-- New users are created automatically on first Google login.

-- Step 1: Delete all existing users and their data (clean slate)

-- Draft depends on Generation via Draft.generationId
DELETE FROM "Draft"
WHERE "generationId" IN (
  SELECT "id" FROM "Generation"
  WHERE "userId" IN (SELECT "id" FROM "User")
);

-- Then delete user-owned records
DELETE FROM "Generation" WHERE "userId" IN (SELECT "id" FROM "User");
DELETE FROM "StyleProfile" WHERE "userId" IN (SELECT "id" FROM "User");
DELETE FROM "Benchmark" WHERE "userId" IN (SELECT "id" FROM "User");
DELETE FROM "UserProfile" WHERE "userId" IN (SELECT "id" FROM "User");
DELETE FROM "User";

-- Step 2: Add new columns (nullable first, then make NOT NULL after data load)
ALTER TABLE "User" ADD COLUMN "supabaseUserId" TEXT;
ALTER TABLE "User" ADD COLUMN "email" TEXT;
ALTER TABLE "User" ADD COLUMN "displayName" TEXT;

-- Step 3: Drop old columns
ALTER TABLE "User" DROP COLUMN "loginId";
ALTER TABLE "User" DROP COLUMN "passwordHash";
ALTER TABLE "User" DROP COLUMN "mustChangePassword";
ALTER TABLE "User" DROP COLUMN "enabled";

-- Step 4: Add NOT NULL + UNIQUE constraints
ALTER TABLE "User" ALTER COLUMN "supabaseUserId" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "User" ADD CONSTRAINT "User_supabaseUserId_key" UNIQUE ("supabaseUserId");
ALTER TABLE "User" ADD CONSTRAINT "User_email_key" UNIQUE ("email");
