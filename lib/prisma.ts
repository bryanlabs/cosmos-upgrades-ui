import { Prisma, PrismaClient } from "@prisma/client";
import { encryptSecret, isEncryptionConfigured } from "@/lib/crypto";

process.env.DATABASE_URL ||= "file:./prisma/dev.db";

let warnedPlaintextWebhook = false;

// Encrypt a webhook URL when an encryption key is configured. If it is not
// (e.g. local dev, or before the secret is deployed), the URL is stored as
// plaintext exactly as before and the startup sweep encrypts it once the key
// appears. decryptSecret() transparently reads either form.
function encryptUrl(url: string): string {
  if (isEncryptionConfigured()) return encryptSecret(url);
  if (!warnedPlaintextWebhook) {
    warnedPlaintextWebhook = true;
    console.warn(
      "WEBHOOK_ENCRYPTION_KEY is not set; storing webhook URLs as plaintext."
    );
  }
  return url;
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSchemaReady?: Promise<void>;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

async function ensureDatabase() {
  if (!globalForPrisma.prismaSchemaReady) {
    globalForPrisma.prismaSchemaReady = (async () => {
      await prisma.$executeRawUnsafe("PRAGMA foreign_keys=ON");
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "User" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "wallet" TEXT NOT NULL,
          "email" TEXT,
          "name" TEXT,
          "image" TEXT,
          "authProvider" TEXT,
          "authSubject" TEXT,
          "favoriteChains" TEXT NOT NULL DEFAULT ''
        )
      `);
      await ensureColumn("User", "email", '"email" TEXT');
      await ensureColumn("User", "name", '"name" TEXT');
      await ensureColumn("User", "image", '"image" TEXT');
      await ensureColumn("User", "authProvider", '"authProvider" TEXT');
      await ensureColumn("User", "authSubject", '"authSubject" TEXT');
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "User_wallet_key"
        ON "User"("wallet")
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "User_authProvider_authSubject_key"
        ON "User"("authProvider", "authSubject")
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "WebHook" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "userId" INTEGER NOT NULL,
          "chainId" TEXT NOT NULL,
          "label" TEXT NOT NULL,
          "notificationType" TEXT NOT NULL,
          "notifyBeforeUpgrade" TEXT,
          "url" TEXT NOT NULL,
          CONSTRAINT "WebHook_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User" ("id")
            ON DELETE RESTRICT ON UPDATE CASCADE
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "WebHook_userId_idx"
        ON "WebHook"("userId")
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "WebHook_chainId_idx"
        ON "WebHook"("chainId")
      `);
      await ensureColumn(
        "WebHook",
        "notifyBeforeMinutes",
        '"notifyBeforeMinutes" INTEGER'
      );
      // Backfill the integer lead time from the legacy string token (idempotent:
      // only touches rows not yet backfilled).
      await prisma.$executeRawUnsafe(`
        UPDATE "WebHook" SET "notifyBeforeMinutes" =
          CASE "notifyBeforeUpgrade"
            WHEN '15m' THEN 15
            WHEN '60m' THEN 60
            WHEN '8h'  THEN 480
            WHEN '24h' THEN 1440
            ELSE NULL
          END
        WHERE "notifyBeforeMinutes" IS NULL AND "notifyBeforeUpgrade" IS NOT NULL
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "WebHookDelivery" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "webHookId" INTEGER NOT NULL,
          "eventKey" TEXT NOT NULL,
          "status" TEXT NOT NULL,
          "responseCode" INTEGER,
          "responseText" TEXT,
          "error" TEXT,
          "deliveredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "WebHookDelivery_webHookId_fkey"
            FOREIGN KEY ("webHookId") REFERENCES "WebHook" ("id")
            ON DELETE RESTRICT ON UPDATE CASCADE
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "WebHookDelivery_webHookId_eventKey_key"
        ON "WebHookDelivery"("webHookId", "eventKey")
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "WebHookDelivery_eventKey_idx"
        ON "WebHookDelivery"("eventKey")
      `);
      // One-time, idempotent re-encryption of any plaintext webhook URLs. Runs
      // only once a key is configured; the "v1:" prefix marks already-encrypted
      // rows so this is a no-op on subsequent startups.
      if (isEncryptionConfigured()) {
        const plaintextRows = await prisma.$queryRawUnsafe<
          Array<{ id: number; url: string }>
        >(`SELECT "id", "url" FROM "WebHook" WHERE "url" NOT LIKE 'v1:%'`);
        for (const row of plaintextRows) {
          await prisma.webHook.update({
            where: { id: row.id },
            data: { url: encryptSecret(row.url) },
          });
        }
      }
    })();
  }

  return globalForPrisma.prismaSchemaReady;
}

async function ensureColumn(table: string, column: string, definition: string) {
  const columns = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
    `PRAGMA table_info("${table}")`
  );
  if (!columns.some((existing) => existing.name === column)) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN ${definition}`);
  }
}

async function getUserFavoriteChains(wallet: string) {
  await ensureDatabase();
  const user = await prisma.user.findUnique({ where: { wallet } });
  if (!user?.favoriteChains) return [];
  return splitFavoriteChains(user.favoriteChains);
}

async function getOrCreateUser(wallet: string) {
  await ensureDatabase();
  return prisma.user.upsert({
    where: { wallet },
    update: {},
    create: { wallet, favoriteChains: "" },
  });
}

async function getOrCreateAuthUser(args: {
  provider: string;
  subject: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}) {
  await ensureDatabase();
  const identityKey = `${args.provider}:${args.subject}`;
  const name =
    args.name && args.name !== "authentik Default Admin" ? args.name : args.email || null;
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { authProvider: args.provider, authSubject: args.subject },
        { wallet: identityKey },
      ],
    },
  });

  const data = {
    email: args.email || null,
    name,
    image: args.image || null,
    authProvider: args.provider,
    authSubject: args.subject,
  };

  if (user) {
    return prisma.user.update({
      where: { id: user.id },
      data,
    });
  }

  return prisma.user.create({
    data: {
      wallet: identityKey,
      favoriteChains: "",
      ...data,
    },
  });
}

async function getUserById(id: number) {
  if (!Number.isInteger(id)) throw new Error("Valid id is required.");
  await ensureDatabase();
  return prisma.user.findUnique({ where: { id } });
}

async function createUser(wallet: string) {
  return getOrCreateUser(wallet);
}

async function addFavoriteChain(wallet: string, newChain: string) {
  await ensureDatabase();
  const user = await getOrCreateUser(wallet);
  const currentChains = splitFavoriteChains(user.favoriteChains);

  if (!currentChains.includes(newChain)) {
    currentChains.push(newChain);
    await prisma.user.update({
      where: { wallet },
      data: { favoriteChains: currentChains.join(",") },
    });
  }

  return currentChains;
}

async function removeFavoriteChain(wallet: string, chainToRemove: string) {
  await ensureDatabase();
  const user = await prisma.user.findUnique({ where: { wallet } });
  if (!user?.favoriteChains) return [];

  const currentChains = splitFavoriteChains(user.favoriteChains);
  const updatedChains = currentChains.filter((chain) => chain !== chainToRemove);

  if (updatedChains.length !== currentChains.length) {
    await prisma.user.update({
      where: { wallet },
      data: { favoriteChains: updatedChains.join(",") },
    });
  }

  return updatedChains;
}

async function userExists(wallet: string): Promise<boolean> {
  await ensureDatabase();
  return !!(await prisma.user.findUnique({ where: { wallet } }));
}

async function getAllUsers() {
  await ensureDatabase();
  return prisma.user.findMany({
    select: { id: true, wallet: true, favoriteChains: true },
  });
}

async function getUserByWallet(wallet: string) {
  if (!wallet) throw new Error("Wallet address is required.");
  await ensureDatabase();
  return prisma.user.findUnique({ where: { wallet } });
}

async function getWebHooksByUserAndChain(userId: number, chainId: string) {
  if (!Number.isInteger(userId) || !chainId) {
    throw new Error("Valid userId and chainId are required.");
  }
  await ensureDatabase();
  return prisma.webHook.findMany({
    where: { userId, chainId },
    orderBy: { id: "desc" },
  });
}

async function getWebHooksByChainId(chainId: string) {
  if (!chainId) throw new Error("chainId is required.");
  await ensureDatabase();
  return prisma.webHook.findMany({
    where: { chainId },
    include: { user: { select: { wallet: true } } },
    orderBy: { id: "desc" },
  });
}

async function getWebHooksByUserId(userId: number) {
  if (!Number.isInteger(userId)) throw new Error("Valid userId is required.");
  await ensureDatabase();
  return prisma.webHook.findMany({
    where: { userId },
    orderBy: { id: "desc" },
  });
}

async function countWebHooksByUserId(userId: number) {
  if (!Number.isInteger(userId)) throw new Error("Valid userId is required.");
  await ensureDatabase();
  return prisma.webHook.count({ where: { userId } });
}

async function getWebHookById(id: number) {
  if (!Number.isInteger(id)) throw new Error("Valid id is required.");
  await ensureDatabase();
  return prisma.webHook.findUnique({
    where: { id },
    include: { user: { select: { wallet: true } } },
  });
}

async function getWebHookByIdForUser(id: number, userId: number) {
  if (!Number.isInteger(id) || !Number.isInteger(userId)) {
    throw new Error("Valid webhook and user IDs are required.");
  }
  await ensureDatabase();
  return prisma.webHook.findFirst({ where: { id, userId } });
}

async function addWebHook(
  userId: number,
  chainId: string,
  label: string,
  url: string,
  notificationType: string,
  notifyBeforeMinutes?: number | null,
  notifyBeforeUpgrade?: string | null
) {
  if (!Number.isInteger(userId)) throw new Error("Valid userId is required.");
  await ensureDatabase();
  return prisma.webHook.create({
    data: {
      userId,
      chainId,
      label,
      url: encryptUrl(url),
      notificationType,
      notifyBeforeMinutes: notifyBeforeMinutes ?? null,
      notifyBeforeUpgrade: notifyBeforeUpgrade ?? null,
    },
  });
}

async function updateWebHook(
  id: number,
  userId: number,
  data: {
    label?: string;
    url?: string;
    notificationType?: string;
    notifyBeforeMinutes?: number | null;
    notifyBeforeUpgrade?: string | null;
  }
) {
  if (!Number.isInteger(id) || !Number.isInteger(userId)) {
    throw new Error("Valid webhook and user IDs are required.");
  }
  if (Object.keys(data).length === 0) throw new Error("No update data provided.");
  await ensureDatabase();

  const payload = { ...data };
  if (typeof payload.url === "string") payload.url = encryptUrl(payload.url);

  try {
    const webhook = await prisma.webHook.findFirst({ where: { id, userId } });
    if (!webhook) return null;
    return await prisma.webHook.update({ where: { id }, data: payload });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new Error(`Webhook with ID ${id} not found.`);
    }
    throw error;
  }
}

async function removeWebHook(id: number) {
  if (!Number.isInteger(id)) throw new Error("Valid id is required.");
  await ensureDatabase();

  try {
    await prisma.webHookDelivery.deleteMany({ where: { webHookId: id } });
    return await prisma.webHook.delete({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return null;
    }
    throw error;
  }
}

async function removeWebHookForUser(id: number, userId: number) {
  if (!Number.isInteger(id) || !Number.isInteger(userId)) {
    throw new Error("Valid webhook and user IDs are required.");
  }
  await ensureDatabase();

  try {
    const webhook = await prisma.webHook.findFirst({ where: { id, userId } });
    if (!webhook) return null;
    await prisma.webHookDelivery.deleteMany({ where: { webHookId: id } });
    return await prisma.webHook.delete({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return null;
    }
    throw error;
  }
}

async function hasWebhookDelivery(webHookId: number, eventKey: string) {
  await ensureDatabase();
  return !!(await prisma.webHookDelivery.findFirst({
    where: {
      webHookId,
      eventKey,
      status: "delivered",
    },
  }));
}

async function recordWebhookDelivery(args: {
  webHookId: number;
  eventKey: string;
  status: string;
  responseCode?: number;
  responseText?: string;
  error?: string;
}) {
  await ensureDatabase();
  return prisma.webHookDelivery.upsert({
    where: {
      webHookId_eventKey: {
        webHookId: args.webHookId,
        eventKey: args.eventKey,
      },
    },
    update: {
      status: args.status,
      responseCode: args.responseCode,
      responseText: args.responseText,
      error: args.error,
      deliveredAt: new Date(),
    },
    create: {
      webHookId: args.webHookId,
      eventKey: args.eventKey,
      status: args.status,
      responseCode: args.responseCode,
      responseText: args.responseText,
      error: args.error,
    },
  });
}

function splitFavoriteChains(value: string) {
  return value
    .split(",")
    .map((chain) => chain.trim())
    .filter(Boolean);
}

export {
  prisma,
  ensureDatabase,
  getUserFavoriteChains,
  createUser,
  getOrCreateUser,
  getOrCreateAuthUser,
  getUserById,
  addFavoriteChain,
  removeFavoriteChain,
  userExists,
  getAllUsers,
  getUserByWallet,
  getWebHooksByUserAndChain,
  getWebHooksByChainId,
  getWebHooksByUserId,
  countWebHooksByUserId,
  getWebHookById,
  getWebHookByIdForUser,
  addWebHook,
  updateWebHook,
  removeWebHook,
  removeWebHookForUser,
  hasWebhookDelivery,
  recordWebhookDelivery,
};
