/**
 * Journeloom encrypted backup envelope, version 1:
 * "JLOOMENC" (8 bytes) | version (1 byte) | PBKDF2 salt (16 bytes) |
 * AES-GCM IV (12 bytes) | ciphertext and 128-bit authentication tag.
 *
 * Version 1 fixes PBKDF2-HMAC-SHA256 at 600,000 iterations and AES-256-GCM.
 * The entire header is authenticated as AES-GCM additional data; no unauthenticated
 * attacker-controlled KDF cost is accepted during import.
 * This encrypts the exported file, NOT the user's underlying IndexedDB records.
 */

const MAGIC = new TextEncoder().encode("JLOOMENC");
const VERSION = 1;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const HEADER_LENGTH = MAGIC.length + 1 + SALT_LENGTH + IV_LENGTH;
const ITERATIONS = 600_000;
const MAX_PLAINTEXT_BYTES = 100_000_000;
const MAX_ENCRYPTED_BYTES = MAX_PLAINTEXT_BYTES + HEADER_LENGTH + 16;

export const MIN_BACKUP_PASSPHRASE_LENGTH = 12;

export class EncryptedBackupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EncryptedBackupError";
  }
}

async function deriveBackupKey(passphrase: string, salt: Uint8Array<ArrayBuffer>, usages: KeyUsage[]) {
  const material = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS },
    material, { name: "AES-GCM", length: 256 }, false, usages,
  );
}

function hasMagic(bytes: Uint8Array): boolean {
  return bytes.length >= MAGIC.length && MAGIC.every((byte, index) => bytes[index] === byte);
}

export async function isEncryptedBackup(blob: Blob): Promise<boolean> {
  if (blob.size < MAGIC.length) return false;
  return hasMagic(new Uint8Array(await blob.slice(0, MAGIC.length).arrayBuffer()));
}

export async function encryptBackup(zip: Blob, passphrase: string): Promise<Blob> {
  if (passphrase.trim().length < MIN_BACKUP_PASSPHRASE_LENGTH) {
    throw new EncryptedBackupError(`备份口令至少需要 ${MIN_BACKUP_PASSPHRASE_LENGTH} 个字符`);
  }
  if (!zip.size || zip.size > MAX_PLAINTEXT_BYTES) {
    throw new EncryptedBackupError("备份内容为空或超过 100 MB 上限");
  }

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const header = new Uint8Array(HEADER_LENGTH);
  header.set(MAGIC);
  header[MAGIC.length] = VERSION;
  header.set(salt, MAGIC.length + 1);
  header.set(iv, MAGIC.length + 1 + SALT_LENGTH);

  const key = await deriveBackupKey(passphrase, salt, ["encrypt"]);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: header, tagLength: 128 },
    key, await zip.arrayBuffer(),
  );
  return new Blob([header, ciphertext], { type: "application/octet-stream" });
}

export async function decryptBackup(encrypted: Blob, passphrase: string): Promise<File> {
  if (encrypted.size < HEADER_LENGTH + 16 || encrypted.size > MAX_ENCRYPTED_BYTES) {
    throw new EncryptedBackupError("加密备份的文件大小异常");
  }
  const header = new Uint8Array(await encrypted.slice(0, HEADER_LENGTH).arrayBuffer());
  if (!hasMagic(header)) throw new EncryptedBackupError("文件不是 Journeloom 加密备份");
  if (header[MAGIC.length] !== VERSION) throw new EncryptedBackupError("不支持此加密备份版本");
  if (!passphrase) throw new EncryptedBackupError("请输入加密备份口令");

  const salt = header.slice(MAGIC.length + 1, MAGIC.length + 1 + SALT_LENGTH);
  const iv = header.slice(MAGIC.length + 1 + SALT_LENGTH);
  const key = await deriveBackupKey(passphrase, salt, ["decrypt"]);

  try {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv, additionalData: header, tagLength: 128 },
      key, await encrypted.slice(HEADER_LENGTH).arrayBuffer(),
    );
    if (!plain.byteLength || plain.byteLength > MAX_PLAINTEXT_BYTES) {
      throw new EncryptedBackupError("解密后的备份大小异常");
    }
    return new File([plain], "journeloom-restored.zip", { type: "application/zip" });
  } catch (error) {
    if (error instanceof EncryptedBackupError) throw error;
    // Authentication failures are indistinguishable by design: do not expose
    // whether a password guess or ciphertext modification was responsible.
    throw new EncryptedBackupError("口令不正确或加密备份已损坏");
  }
}
