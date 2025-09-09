/*
  Warnings:

  - A unique constraint covering the columns `[userName]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `password` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userName` to the `Client` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "userName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Client_userName_key" ON "Client"("userName");
