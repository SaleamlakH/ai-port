/*
  Warnings:

  - Added the required column `password` to the `Developer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Developer" ADD COLUMN     "password" TEXT NOT NULL;
