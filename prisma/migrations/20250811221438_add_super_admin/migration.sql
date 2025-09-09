-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "superAdmin" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "isActive" SET DEFAULT false;
