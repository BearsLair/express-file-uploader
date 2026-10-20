/*
  Warnings:

  - Added the required column `localFile` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "File" ADD COLUMN     "localFile" TEXT NOT NULL;
