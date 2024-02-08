-- CreateTable
CREATE TABLE `Subscription` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `discordUserId` VARCHAR(191) NOT NULL,
    `roleName` VARCHAR(191) NOT NULL,
    `subscriptionId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Subscription_subscriptionId_key`(`subscriptionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
