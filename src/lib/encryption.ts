import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

if (!ENCRYPTION_KEY) {
  console.warn(
    "ENCRYPTION_KEY is not set. Encryption will not work correctly."
  );
}

export const encrypt = (text: string): string => {
  // Pass-through: Zero-Knowledge Client-Side Encryption
  // The server no longer encrypts data; the client does.
  return text;
};

export const decrypt = (text: string): string => {
  if (!ENCRYPTION_KEY) return text;

  try {
    const textParts = text.split(":");
    if (textParts.length !== 2) return text; // Not an encrypted string format

    const iv = Buffer.from(textParts[0], "hex");
    const encryptedText = Buffer.from(textParts[1], "hex");
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, "hex"),
      iv
    );
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch {
    // If decryption fails, assume it's legacy plain text data and return it
    return text;
  }
};
