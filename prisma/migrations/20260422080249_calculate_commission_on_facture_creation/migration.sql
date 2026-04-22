/*
  Warnings:

  - You are about to drop the column `tauxCommission` on the `LigneFacture` table. All the data in the column will be lost.
  - Added the required column `montantCommission` to the `LigneFacture` table without a default value. This is not possible if the table is not empty.

*/
-- Ajouter d'abord la colonne avec une valeur par défaut
ALTER TABLE "LigneFacture" ADD COLUMN "montantCommission" INTEGER NOT NULL DEFAULT 0;

-- Supprimer l'ancienne colonne
ALTER TABLE "LigneFacture" DROP COLUMN "tauxCommission";
