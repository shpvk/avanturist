-- AlterEnum
BEGIN;
CREATE TYPE "AuthMethod_new" AS ENUM ('CREDENTIALS');
ALTER TABLE "users" ALTER COLUMN "method" TYPE "AuthMethod_new" USING ("method"::text::"AuthMethod_new");
ALTER TYPE "AuthMethod" RENAME TO "AuthMethod_old";
ALTER TYPE "AuthMethod_new" RENAME TO "AuthMethod";
DROP TYPE "public"."AuthMethod_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_userId_fkey";

-- DropTable
DROP TABLE "accounts";

