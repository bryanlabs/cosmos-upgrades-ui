/*
  Warnings:

  - You are about to drop the column `favoriteChainIds` on the `User` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "FavoriteChain" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chainId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT,
    CONSTRAINT "FavoriteChain_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "walletAddress" TEXT
);
INSERT INTO "new_User" ("email", "emailVerified", "id", "image", "name", "walletAddress") SELECT "email", "emailVerified", "id", "image", "name", "walletAddress" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
