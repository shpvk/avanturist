-- AlterEnum
BEGIN;
CREATE TYPE "AuthMethod_new" AS ENUM ('CREDENTIALS', 'GOOGLE');
ALTER TABLE "users" ALTER COLUMN "method" TYPE "AuthMethod_new" USING ("method"::text::"AuthMethod_new");
ALTER TYPE "AuthMethod" RENAME TO "AuthMethod_old";
ALTER TYPE "AuthMethod_new" RENAME TO "AuthMethod";
DROP TYPE "public"."AuthMethod_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TokenType_new" AS ENUM ('VERIFICATION', 'PASSWORD_RESET');
ALTER TABLE "tokens" ALTER COLUMN "type" TYPE "TokenType_new" USING ("type"::text::"TokenType_new");
ALTER TYPE "TokenType" RENAME TO "TokenType_old";
ALTER TYPE "TokenType_new" RENAME TO "TokenType";
DROP TYPE "public"."TokenType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_userId_fkey";

-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "provider_account_id" TEXT NOT NULL,
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "builds" DROP COLUMN "author",
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "tokens" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "displayName",
DROP COLUMN "is_two_factor_enabled",
ADD COLUMN     "display_name" TEXT NOT NULL,
ALTER COLUMN "password" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE INDEX "builds_user_id_idx" ON "builds"("user_id");

-- CreateIndex
CREATE INDEX "tokens_email_type_idx" ON "tokens"("email", "type");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "builds" ADD CONSTRAINT "builds_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

