-- Every User now links to a required Person; identity (name, email) moves
-- off the users table. Existing accounts (the seeded admin) get a Person
-- row backfilled from their name/email before the columns are dropped.

-- AlterTable: system humans (admin) don't have phone/gender
ALTER TABLE `persons` MODIFY `phone` VARCHAR(20) NULL;
ALTER TABLE `persons` MODIFY `gender` ENUM('MALE', 'FEMALE', 'OTHER') NULL;

-- AlterTable: add the link (nullable during backfill)
ALTER TABLE `users` ADD COLUMN `personId` INTEGER NULL;

-- Backfill: one Person per existing account
INSERT INTO `persons` (`firstName`, `lastName`, `email`, `createdAt`, `updatedAt`)
SELECT u.`name`, '', u.`email`, NOW(3), NOW(3)
FROM `users` u;

UPDATE `users` u
JOIN `persons` p ON p.`email` = u.`email`
SET u.`personId` = p.`id`;

-- Tighten: link becomes required and unique
ALTER TABLE `users` MODIFY `personId` INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_personId_key` ON `users`(`personId`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `persons`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropIndex / DropColumn: identity now lives on persons
DROP INDEX `users_email_key` ON `users`;
ALTER TABLE `users` DROP COLUMN `email`;
ALTER TABLE `users` DROP COLUMN `name`;
