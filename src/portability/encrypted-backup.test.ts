import { describe, expect, it } from "vitest";
import { decryptBackup, encryptBackup, isEncryptedBackup } from "./encrypted-backup";

const passphrase = "这是一段仅供测试的强口令-2026!";

describe("authenticated encrypted backup envelope", () => {
  it("encrypts and decrypts a ZIP payload with fresh salts and IVs", async () => {
    const original = new Blob(["PK\u0003\u0004", "Private fictional archive"]);
    const first = await encryptBackup(original, passphrase);
    const second = await encryptBackup(original, passphrase);

    expect(await isEncryptedBackup(first)).toBe(true);
    expect(await isEncryptedBackup(original)).toBe(false);
    expect(first.size).toBe(original.size + 37 + 16);
    expect(new Uint8Array(await first.arrayBuffer())).not.toEqual(new Uint8Array(await second.arrayBuffer()));
    expect(await (await decryptBackup(first, passphrase)).text()).toBe(await original.text());
  });

  it("does not expose whether the password or ciphertext was incorrect", async () => {
    const original = new Blob(["Sensitive fictional content"]);
    const encrypted = await encryptBackup(original, passphrase);
    await expect(decryptBackup(encrypted, "wrong-password")).rejects.toThrow("口令不正确或加密备份已损坏");

    const tampered = new Uint8Array(await encrypted.arrayBuffer());
    tampered[tampered.length - 1] ^= 0x01;
    await expect(decryptBackup(new Blob([tampered]), passphrase)).rejects.toThrow("口令不正确或加密备份已损坏");

    const headerTampered = new Uint8Array(await encrypted.arrayBuffer());
    headerTampered[12] ^= 0x01; // Salt is authenticated too.
    await expect(decryptBackup(new Blob([headerTampered]), passphrase)).rejects.toThrow("口令不正确或加密备份已损坏");
  });

  it("rejects weak passphrases, plain files and unknown envelope versions", async () => {
    await expect(encryptBackup(new Blob(["x"]), "short")).rejects.toThrow("至少需要");
    await expect(decryptBackup(new Blob(["plain-text"]), passphrase)).rejects.toThrow("大小异常");

    const encrypted = new Uint8Array(await (await encryptBackup(new Blob(["x"]), passphrase)).arrayBuffer());
    encrypted[8] = 250;
    await expect(decryptBackup(new Blob([encrypted]), passphrase)).rejects.toThrow("不支持此加密备份版本");
  });
});
