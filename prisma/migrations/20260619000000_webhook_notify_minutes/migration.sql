-- Flexible notification lead times: store an integer number of minutes
-- alongside the legacy fixed-window string token.
ALTER TABLE "WebHook" ADD COLUMN "notifyBeforeMinutes" INTEGER;

-- Backfill existing rows from the legacy tokens.
UPDATE "WebHook" SET "notifyBeforeMinutes" =
  CASE "notifyBeforeUpgrade"
    WHEN '15m' THEN 15
    WHEN '60m' THEN 60
    WHEN '8h'  THEN 480
    WHEN '24h' THEN 1440
    ELSE NULL
  END
WHERE "notifyBeforeUpgrade" IS NOT NULL;
