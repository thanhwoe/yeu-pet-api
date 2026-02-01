/*
  Warnings:

  - You are about to drop the `account_verifications` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "account_verifications" DROP CONSTRAINT "fk_account_verifications_account_id";

-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "is_verified" BOOLEAN DEFAULT false;

-- DropTable
DROP TABLE "account_verifications";

-- CreateTable
CREATE TABLE "otp_tokens" (
    "account_id" UUID NOT NULL,
    "token" TEXT,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_tokens_pkey" PRIMARY KEY ("account_id")
);

-- CreateIndex
CREATE INDEX "idx_otp_tokens_account_id" ON "otp_tokens"("account_id");

-- AddForeignKey
ALTER TABLE "otp_tokens" ADD CONSTRAINT "fk_otp_tokens_account_id" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
