/*
  Warnings:

  - The primary key for the `account_verifications` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `account_verifications` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "account_verifications_account_id_key";

-- AlterTable
ALTER TABLE "account_verifications" DROP CONSTRAINT "account_verifications_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "account_verifications_pkey" PRIMARY KEY ("account_id");

-- AlterTable
ALTER TABLE "accounts" ALTER COLUMN "first_name" DROP NOT NULL,
ALTER COLUMN "last_name" DROP NOT NULL;
