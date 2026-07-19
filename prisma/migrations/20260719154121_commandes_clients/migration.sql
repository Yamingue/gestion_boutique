-- CreateEnum
CREATE TYPE "StatutCommandeClient" AS ENUM ('EN_ATTENTE', 'ACCEPTEE', 'LIVREE', 'REFUSEE');

-- AlterTable
ALTER TABLE "LigneFacture" ALTER COLUMN "montantCommission" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Commande" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "clientNom" TEXT NOT NULL,
    "clientTelephone" TEXT NOT NULL,
    "clientAdresse" TEXT,
    "statut" "StatutCommandeClient" NOT NULL DEFAULT 'EN_ATTENTE',
    "total" INTEGER NOT NULL,
    "notes" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "livreeAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneCommandeClient" (
    "id" TEXT NOT NULL,
    "commandeId" TEXT NOT NULL,
    "produitId" TEXT NOT NULL,
    "nomProduit" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixUnitaire" INTEGER NOT NULL,

    CONSTRAINT "LigneCommandeClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SequenceCommandeClient" (
    "annee" INTEGER NOT NULL,
    "mois" INTEGER NOT NULL,
    "dernier" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SequenceCommandeClient_pkey" PRIMARY KEY ("annee","mois")
);

-- CreateIndex
CREATE UNIQUE INDEX "Commande_numero_key" ON "Commande"("numero");

-- AddForeignKey
ALTER TABLE "LigneCommandeClient" ADD CONSTRAINT "LigneCommandeClient_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "Commande"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneCommandeClient" ADD CONSTRAINT "LigneCommandeClient_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
