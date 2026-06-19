import crypto from "node:crypto";

// Encryption-at-rest for webhook secrets (the webhook URL embeds the
// Discord/Slack/Telegram token). Values are stored as a versioned envelope
// "v1:<ivB64>:<tagB64>:<ciphertextB64>" so the format can evolve and so that
// legacy plaintext rows (no "v1:" prefix) decrypt transparently during the
// lazy migration. The key comes from WEBHOOK_ENCRYPTION_KEY (base64, 32 bytes).

const ENVELOPE_VERSION = "v1";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit nonce, the standard for GCM
const KEY_LENGTH = 32; // 256 bits

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const raw = process.env.WEBHOOK_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("WEBHOOK_ENCRYPTION_KEY is not set.");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `WEBHOOK_ENCRYPTION_KEY must decode to ${KEY_LENGTH} bytes (base64); got ${key.length}.`
    );
  }
  cachedKey = key;
  return key;
}

export function isEncryptionConfigured(): boolean {
  try {
    getKey();
    return true;
  } catch {
    return false;
  }
}

export function isEncrypted(value: string): boolean {
  return typeof value === "string" && value.startsWith(`${ENVELOPE_VERSION}:`);
}

export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    ENVELOPE_VERSION,
    iv.toString("base64"),
    tag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

export function decryptSecret(stored: string): string {
  // Lazy migration: rows written before encryption are stored as plaintext.
  if (!isEncrypted(stored)) {
    return stored;
  }
  const parts = stored.split(":");
  if (parts.length !== 4) {
    throw new Error("Malformed encrypted secret envelope.");
  }
  const [, ivB64, tagB64, ctB64] = parts;
  const key = getKey();
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ctB64, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

// Constant-time string comparison. Hashing both sides to a fixed-length digest
// avoids leaking length and satisfies timingSafeEqual's equal-length requirement.
export function timingSafeEqualStr(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a, "utf8").digest();
  const hb = crypto.createHash("sha256").update(b, "utf8").digest();
  return crypto.timingSafeEqual(ha, hb);
}
