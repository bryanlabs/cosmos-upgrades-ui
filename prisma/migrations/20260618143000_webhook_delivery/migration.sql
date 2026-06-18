-- CreateTable
CREATE TABLE "WebHookDelivery" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "webHookId" INTEGER NOT NULL,
    "eventKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "responseCode" INTEGER,
    "responseText" TEXT,
    "error" TEXT,
    "deliveredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WebHookDelivery_webHookId_fkey" FOREIGN KEY ("webHookId") REFERENCES "WebHook" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "WebHookDelivery_webHookId_eventKey_key" ON "WebHookDelivery"("webHookId", "eventKey");

-- CreateIndex
CREATE INDEX "WebHookDelivery_eventKey_idx" ON "WebHookDelivery"("eventKey");
