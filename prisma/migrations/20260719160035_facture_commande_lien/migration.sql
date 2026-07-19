/*
  Warnings:

  - A unique constraint covering the columns `[factureId]` on the table `Commande` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Commande" ADD COLUMN     "factureId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Commande_factureId_key" ON "Commande"("factureId");

-- AddForeignKey
ALTER TABLE "Commande" ADD CONSTRAINT "Commande_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "Facture"("id") ON DELETE SET NULL ON UPDATE CASCADE;
