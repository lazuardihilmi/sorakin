-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT,
    "phone" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Creator" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "coverUrl" TEXT,
    "balance" REAL NOT NULL DEFAULT 0.0,
    "pendingBalance" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Creator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CreatorSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "creatorId" INTEGER NOT NULL,
    "showFeed" BOOLEAN NOT NULL DEFAULT false,
    "showAmount" BOOLEAN NOT NULL DEFAULT false,
    "feeCoverage" TEXT NOT NULL DEFAULT 'CREATOR',
    "quickAmounts" TEXT NOT NULL DEFAULT '10000,20000,50000,100000',
    "socialInstagram" TEXT,
    "socialFacebook" TEXT,
    "socialX" TEXT,
    "socialTiktok" TEXT,
    "socialTwitch" TEXT,
    "socialYoutube" TEXT,
    "socialWebsite" TEXT,
    "enableKeywordFilter" BOOLEAN NOT NULL DEFAULT false,
    "customKeywords" TEXT,
    "blockRecentMedia" BOOLEAN NOT NULL DEFAULT false,
    "discordWebhook" TEXT,
    "discordTemplate" TEXT,
    "customWebhookUrl" TEXT,
    "customWebhookToken" TEXT,
    CONSTRAINT "CreatorSettings_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OverlaySettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "creatorId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "activeThemeId" INTEGER NOT NULL DEFAULT 1,
    "alertSoundUrl" TEXT NOT NULL DEFAULT '/sounds/default-alert.mp3',
    "alertImageUrl" TEXT NOT NULL DEFAULT '/images/default-alert.gif',
    "alertDuration" INTEGER NOT NULL DEFAULT 5,
    "fontFamily" TEXT NOT NULL DEFAULT 'Outfit',
    "fontSize" INTEGER NOT NULL DEFAULT 24,
    "backgroundColor" TEXT NOT NULL DEFAULT '#00000000',
    "textColor" TEXT NOT NULL DEFAULT '#ffffff',
    "highlightColor" TEXT NOT NULL DEFAULT '#ffc107',
    "alertTemplate" TEXT NOT NULL DEFAULT '{sender} baru saja mengirim {amount}!
"{message}"',
    CONSTRAINT "OverlaySettings_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" INTEGER NOT NULL,
    "senderId" INTEGER,
    "senderName" TEXT NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "message" TEXT,
    "amount" REAL NOT NULL,
    "serviceFee" REAL NOT NULL DEFAULT 0.0,
    "platformFee" REAL NOT NULL DEFAULT 0.0,
    "vatFee" REAL NOT NULL DEFAULT 0.0,
    "totalAmount" REAL NOT NULL,
    "paymentType" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "isVAT" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" DATETIME,
    CONSTRAINT "Donation_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Donation_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "donationId" TEXT NOT NULL,
    "creatorId" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "settleSchedule" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNSETTLED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Settlement_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Settlement_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Withdrawal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "creatorId" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Withdrawal_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Creator_userId_key" ON "Creator"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Creator_username_key" ON "Creator"("username");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorSettings_creatorId_key" ON "CreatorSettings"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "OverlaySettings_creatorId_key" ON "OverlaySettings"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "OverlaySettings_key_key" ON "OverlaySettings"("key");
