-- CreateEnum
CREATE TYPE "VoteVerdict" AS ENUM ('POSITIVE', 'SITUATIONAL', 'NEGATIVE');

-- AlterTable
ALTER TABLE "builds" ADD COLUMN     "negative_votes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "positive_votes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "situational_votes" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL,
    "verdict" "VoteVerdict" NOT NULL,
    "build_id" TEXT NOT NULL,
    "voter_key" TEXT NOT NULL,
    "voter_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "votes_voter_id_idx" ON "votes"("voter_id");

-- CreateIndex
CREATE UNIQUE INDEX "votes_build_id_voter_key_key" ON "votes"("build_id", "voter_key");

-- CreateIndex
CREATE INDEX "builds_created_at_idx" ON "builds"("created_at");

-- CreateIndex
CREATE INDEX "builds_positive_votes_idx" ON "builds"("positive_votes");

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_build_id_fkey" FOREIGN KEY ("build_id") REFERENCES "builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_voter_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
