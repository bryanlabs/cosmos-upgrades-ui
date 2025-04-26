/*
  Warnings:

  - Added the required column `notificationType` to the `WebHook` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WebHook" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "chainId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    "notifyBeforeUpgrade" TEXT,
    "url" TEXT NOT NULL,
    CONSTRAINT "WebHook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_WebHook" ("chainId", "id", "label", "url", "userId") SELECT "chainId", "id", "label", "url", "userId" FROM "WebHook";
DROP TABLE "WebHook";
ALTER TABLE "new_WebHook" RENAME TO "WebHook";
CREATE INDEX "WebHook_userId_idx" ON "WebHook"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
