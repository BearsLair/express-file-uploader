/*
  Warnings:

  - You are about to drop the column `localFile` on the `File` table. All the data in the column will be lost.
  - Changed the type of `structure` on the `Folders` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "File" DROP COLUMN "localFile";

-- AlterTable
ALTER TABLE "Folders" DROP COLUMN "structure",
ADD COLUMN     "structure" JSONB NOT NULL;
