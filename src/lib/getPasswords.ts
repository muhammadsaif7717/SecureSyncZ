import axios from "axios";
import getURL from "./getURL";
import { decryptData } from "./clientCrypto";
import { PasswordsData } from "@/types";

export default async function getPasswords(
  cryptoKey?: CryptoKey | null
): Promise<PasswordsData[]> {
  const url = await getURL();

  try {
    const res = await axios.get(`${url}/passwords/get`);
    const passwords: PasswordsData[] = res.data;

    if (!cryptoKey) return passwords;

    const decrypted = await Promise.all(
      passwords.map(async (p) => {
        try {
          const decryptedPassword = p.password
            ? await decryptData(p.password, cryptoKey)
            : "";
          const decryptedNote = p.note
            ? await decryptData(p.note, cryptoKey)
            : "";
          return { ...p, password: decryptedPassword, note: decryptedNote };
        } catch {
          // Fallback to original if decryption fails (e.g., legacy plain text or old key)
          return p;
        }
      })
    );

    return decrypted;
  } catch (error) {
    console.error("Error fetching passwords:", error);
    throw new Error("Failed to fetch passwords");
  }
}
