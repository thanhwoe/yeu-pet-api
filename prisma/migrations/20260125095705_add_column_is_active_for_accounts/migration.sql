-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "is_active" BOOLEAN DEFAULT true;

-- RenameForeignKey
ALTER TABLE "refresh_tokens" RENAME CONSTRAINT "fk_account" TO "fk_refresh_tokens_account_id";

-- AddForeignKey
ALTER TABLE "account_verifications" ADD CONSTRAINT "fk_account_verifications_account_id" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
