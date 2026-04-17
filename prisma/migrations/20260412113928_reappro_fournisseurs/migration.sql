-- CreateTable
CREATE TABLE `Fournisseur` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `telephone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `adresse` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommandeReappro` (
    `id` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `fournisseurId` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `statut` ENUM('EN_COURS', 'RECUE', 'ANNULEE') NOT NULL DEFAULT 'EN_COURS',
    `totalHT` INTEGER NOT NULL,
    `notes` VARCHAR(191) NULL,
    `receivedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CommandeReappro_numero_key`(`numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LigneCommande` (
    `id` VARCHAR(191) NOT NULL,
    `commandeId` VARCHAR(191) NOT NULL,
    `produitId` VARCHAR(191) NOT NULL,
    `quantite` INTEGER NOT NULL,
    `prixUnitaire` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SequenceCommande` (
    `annee` INTEGER NOT NULL,
    `mois` INTEGER NOT NULL,
    `dernier` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`annee`, `mois`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CommandeReappro` ADD CONSTRAINT `CommandeReappro_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `Fournisseur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommandeReappro` ADD CONSTRAINT `CommandeReappro_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LigneCommande` ADD CONSTRAINT `LigneCommande_commandeId_fkey` FOREIGN KEY (`commandeId`) REFERENCES `CommandeReappro`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LigneCommande` ADD CONSTRAINT `LigneCommande_produitId_fkey` FOREIGN KEY (`produitId`) REFERENCES `Produit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
