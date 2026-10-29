/*
  Warnings:

  - You are about to drop the column `structure` on the `Folders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Folders" DROP COLUMN "structure",
ADD COLUMN     "contents" JSONB[];
