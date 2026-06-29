-- AlterTable
ALTER TABLE `child` ADD COLUMN `province` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `healthcenter` ADD COLUMN `cell` VARCHAR(191) NULL,
    ADD COLUMN `district` VARCHAR(191) NULL,
    ADD COLUMN `province` VARCHAR(191) NULL,
    ADD COLUMN `sector` VARCHAR(191) NULL,
    ADD COLUMN `village` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `province` VARCHAR(191) NULL;
