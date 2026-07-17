import axios from "axios";
import getURL from "./getURL";
import { decryptData } from "./clientCrypto";
import { NotesData } from "@/types";

export default async function getNotes(
  cryptoKey?: CryptoKey | null
): Promise<NotesData[]> {
  const url = await getURL();

  try {
    const res = await axios.get(`${url}/notes/get`);
    const notes: NotesData[] = res.data;

    if (!cryptoKey) return notes;

    const decrypted = await Promise.all(
      notes.map(async (n) => {
        try {
          const decryptedContent = n.content
            ? await decryptData(n.content, cryptoKey)
            : "";
          return { ...n, content: decryptedContent };
        } catch {
          return n;
        }
      })
    );

    return decrypted;
  } catch (error) {
    console.error("Error fetching notes:", error);
    throw new Error("Failed to fetch notes");
  }
}
