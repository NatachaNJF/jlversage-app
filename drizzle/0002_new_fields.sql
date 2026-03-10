-- Migration: ajout des nouveaux champs
-- siteVersage dans chantiers
ALTER TABLE `chantiers` ADD COLUMN `siteVersage` varchar(255);
-- bonCommandeSigne dans chantiers
ALTER TABLE `chantiers` ADD COLUMN `bonCommandeSigne` boolean DEFAULT false;
-- planningVersages dans chantiers
ALTER TABLE `chantiers` ADD COLUMN `planningVersages` text;
-- mailConditionsEnvoye dans transporteurs
ALTER TABLE `transporteurs` ADD COLUMN `mailConditionsEnvoye` boolean NOT NULL DEFAULT false;
