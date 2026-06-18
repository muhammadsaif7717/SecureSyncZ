import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

// Generate a 256-bit key from the master password
const deriveKey = (password: string, salt: Buffer): Buffer => {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256");
};

export const encryptWithMasterPassword = (
  data: any,
  masterPassword: string
): string => {
  const salt = crypto.randomBytes(16);
  const key = deriveKey(masterPassword, salt);
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const text = JSON.stringify(data);
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag();

  // Combine salt, iv, authTag, and encrypted data
  return JSON.stringify({
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    data: encrypted,
  });
};

export const decryptWithMasterPassword = (
  encryptedPayload: string,
  masterPassword: string
): any => {
  try {
    const { salt, iv, authTag, data } = JSON.parse(encryptedPayload);

    const key = deriveKey(masterPassword, Buffer.from(salt, "base64"));

    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(iv, "base64")
    );

    decipher.setAuthTag(Buffer.from(authTag, "base64"));

    let decrypted = decipher.update(data, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return JSON.parse(decrypted);
  } catch (error) {
    throw new Error("Invalid master password or corrupted backup file.");
  }
};
