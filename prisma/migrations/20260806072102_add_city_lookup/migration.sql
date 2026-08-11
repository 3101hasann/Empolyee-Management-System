/*
  Warnings:

  - You are about to drop the column `city` on the `persons` table. All the data in the column will be lost.

*/
-- DropIndex
ALTER TABLE `tenures` DROP FOREIGN KEY `tenures_degreeId_fkey`;
DROP INDEX `tenures_degreeId_fkey` ON `tenures`;

-- DropIndex
ALTER TABLE `tenures` DROP FOREIGN KEY `tenures_instituteId_fkey`;
DROP INDEX `tenures_instituteId_fkey` ON `tenures`;

-- AlterTable
ALTER TABLE `persons` DROP COLUMN `city`,
    ADD COLUMN `cityId` INTEGER NULL;

-- CreateTable
CREATE TABLE `cities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cities_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `persons_cityId_idx` ON `persons`(`cityId`);

-- AddForeignKey
ALTER TABLE `persons` ADD CONSTRAINT `persons_cityId_fkey` FOREIGN KEY (`cityId`) REFERENCES `cities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenures` ADD CONSTRAINT `tenures_instituteId_fkey` FOREIGN KEY (`instituteId`) REFERENCES `institutes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenures` ADD CONSTRAINT `tenures_degreeId_fkey` FOREIGN KEY (`degreeId`) REFERENCES `degrees`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;