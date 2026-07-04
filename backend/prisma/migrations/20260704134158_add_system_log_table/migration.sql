-- CreateTable for MySQL
CREATE TABLE IF NOT EXISTS `SystemLog` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `userId` INT NOT NULL,
    `action` VARCHAR(255) NOT NULL,
    `time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `role` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `SystemLog_userId_fkey` (`userId`),
    CONSTRAINT `SystemLog_userId_fkey` 
        FOREIGN KEY (`userId`) REFERENCES `User`(`id`) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
