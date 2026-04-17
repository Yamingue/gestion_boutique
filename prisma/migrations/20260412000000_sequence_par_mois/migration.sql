-- Vider la table (données de séquence non critiques, seront recréées automatiquement)
DELETE FROM `SequenceFacture`;

-- Supprimer l'ancienne clé primaire
ALTER TABLE `SequenceFacture` DROP PRIMARY KEY;

-- Ajouter la colonne mois
ALTER TABLE `SequenceFacture` ADD COLUMN `mois` INT NOT NULL DEFAULT 1;

-- Recréer la clé primaire composée (annee, mois)
ALTER TABLE `SequenceFacture` ADD PRIMARY KEY (`annee`, `mois`);

-- Retirer la valeur par défaut de mois (Prisma attend une colonne sans default)
ALTER TABLE `SequenceFacture` ALTER COLUMN `mois` DROP DEFAULT;
