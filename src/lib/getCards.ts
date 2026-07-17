import axios from "axios";
import getURL from "./getURL";
import { decryptData } from "./clientCrypto";
import { CardsData } from "@/types";

export default async function getCards(
  cryptoKey?: CryptoKey | null
): Promise<CardsData[]> {
  const url = await getURL();

  try {
    const res = await axios.get(`${url}/cards/get`);
    const cards: CardsData[] = res.data;

    if (!cryptoKey) return cards;

    const decrypted = await Promise.all(
      cards.map(async (c) => {
        try {
          const decryptedCardNumber = c.cardNumber
            ? await decryptData(c.cardNumber, cryptoKey)
            : "";
          const decryptedExpiry = c.expiry
            ? await decryptData(c.expiry, cryptoKey)
            : "";
          const decryptedCvv = c.cvv ? await decryptData(c.cvv, cryptoKey) : "";
          const decryptedNote = c.note
            ? await decryptData(c.note, cryptoKey)
            : "";

          return {
            ...c,
            cardNumber: decryptedCardNumber,
            expiry: decryptedExpiry,
            cvv: decryptedCvv,
            note: decryptedNote,
          };
        } catch {
          return c;
        }
      })
    );

    return decrypted;
  } catch (error) {
    console.error("Error fetching cards:", error);
    throw new Error("Failed to fetch cards");
  }
}
