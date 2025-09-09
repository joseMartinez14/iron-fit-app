/*
  Warnings:

  - You are about to drop the column `createdById` on the `ClassSession` table. All the data in the column will be lost.
  - Added the required column `capacity` to the `ClassSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instructorID` to the `ClassSession` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ClassSession" DROP CONSTRAINT "ClassSession_createdById_fkey";

-- AlterTable
ALTER TABLE "ClassSession" DROP COLUMN "createdById",
ADD COLUMN     "capacity" INTEGER NOT NULL,
ADD COLUMN     "instructorID" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_instructorID_fkey" FOREIGN KEY ("instructorID") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
