-- Assistant chatbot: conversation persistence + read-only SQL views.
-- (Hand-edited: prisma's draft also emitted phantom re-adds of existing FKs
-- from a shadow-db diff quirk; those were removed — only assistant objects
-- are created here.)

-- CreateTable
CREATE TABLE `assistant_conversations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(120) NOT NULL,
    `userId` INTEGER NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `assistant_conversations_userId_deletedAt_updatedAt_idx`(`userId`, `deletedAt`, `updatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assistant_messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `conversationId` INTEGER NOT NULL,
    `role` ENUM('USER', 'ASSISTANT') NOT NULL,
    `content` TEXT NOT NULL,
    `toolCalls` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `assistant_messages_conversationId_idx`(`conversationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `assistant_messages` ADD CONSTRAINT `assistant_messages_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `assistant_conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Read-only views for the assistant's query_database tool.
-- They pre-filter soft-deleted rows and omit sensitive columns (password
-- hashes, file paths, the users table entirely). The assistant's MySQL user
-- is granted SELECT on these views ONLY — see scripts/assistant-readonly.sql.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW `v_cities` AS
  SELECT `id`, `name` FROM `cities`;

CREATE OR REPLACE VIEW `v_institutes` AS
  SELECT `id`, `name` FROM `institutes`;

CREATE OR REPLACE VIEW `v_degrees` AS
  SELECT `id`, `name` FROM `degrees`;

CREATE OR REPLACE VIEW `v_batches` AS
  SELECT `id`, `name`, `status`, `startDate`, `endDate`, `startTimeMin`,
         `endTimeMin`, `daysOfWeek`, `roadmap`, `comments`, `createdAt`
  FROM `batches`
  WHERE `deletedAt` IS NULL;

CREATE OR REPLACE VIEW `v_persons` AS
  SELECT `id`, `firstName`, `lastName`, `email`, `phone`, `gender`, `cityId`, `createdAt`
  FROM `persons`
  WHERE `deletedAt` IS NULL;

CREATE OR REPLACE VIEW `v_internees` AS
  SELECT i.`id`, i.`personId`, i.`fatherName`, i.`guardianPhone`, i.`referredBy`, i.`createdAt`
  FROM `internees` i
  JOIN `persons` p ON p.`id` = i.`personId` AND p.`deletedAt` IS NULL
  WHERE i.`deletedAt` IS NULL;

CREATE OR REPLACE VIEW `v_tenures` AS
  SELECT t.`id`, t.`interneeId`, t.`batchId`, t.`startDate`, t.`endDate`,
         t.`instituteId`, t.`degreeId`, t.`degreeStartDate`, t.`degreeEndDate`,
         t.`semester`, t.`grade`, t.`skills`, t.`miscCourses`, t.`skillsLearned`,
         t.`certStartDate`, t.`certEndDate`, t.`certIssueDate`, t.`score`,
         t.`comments`, t.`createdAt`
  FROM `tenures` t
  WHERE t.`deletedAt` IS NULL;
