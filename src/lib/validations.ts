import { ObjectId } from "mongodb";
import { encrypt } from "./encryption";

/**
 * Normalizes a password object before saving to the database.
 * Ensures all required fields are present and correctly typed.
 * Handles missing fields from external imports (e.g., Chrome/Safari CSV).
 * @param item - The raw password object.
 * @param cryptoKey - Optional encryption key if we need to do frontend encryption (not used backend). Here we use the backend `encrypt` function.
 */
export const normalizePassword = (item: any) => {
  const now = new Date();

  return {
    ...(item._id
      ? {
          _id: typeof item._id === "string" ? new ObjectId(item._id) : item._id,
        }
      : {}),
    ...(item.user ? { user: item.user } : {}),
    website: String(item.website || item.url || item.name || "Unknown"),
    username: String(item.username || ""),
    password: item.password
      ? item.password.startsWith("U2FsdGVkX1") || item.password.length > 50
        ? item.password
        : encrypt(String(item.password))
      : encrypt(""),
    note: String(item.note || ""),
    isFavorite: item.isFavorite === true || item.isFavorite === "true",
    tags: Array.isArray(item.tags) ? item.tags : [],
    createdAt: item.createdAt ? new Date(item.createdAt) : now,
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : now,
  };
};

/**
 * Normalizes a card object before saving to the database.
 * @param item - The raw card object.
 */
export const normalizeCard = (item: any) => {
  const now = new Date();

  return {
    ...(item._id
      ? {
          _id: typeof item._id === "string" ? new ObjectId(item._id) : item._id,
        }
      : {}),
    ...(item.user ? { user: item.user } : {}),
    name: String(item.name || "Unknown"),
    serviceName: String(item.serviceName || "Unknown"),
    cardType: String(item.cardType || "Others"),
    cardNumber: item.cardNumber
      ? item.cardNumber.startsWith("U2FsdGVkX1") || item.cardNumber.length > 50
        ? item.cardNumber
        : encrypt(String(item.cardNumber))
      : encrypt(""),
    expiry: item.expiry
      ? item.expiry.startsWith("U2FsdGVkX1") || item.expiry.length > 50
        ? item.expiry
        : encrypt(String(item.expiry))
      : encrypt(""),
    cvv: item.cvv
      ? item.cvv.startsWith("U2FsdGVkX1") || item.cvv.length > 50
        ? item.cvv
        : encrypt(String(item.cvv))
      : encrypt(""),
    pin: item.pin
      ? item.pin.startsWith("U2FsdGVkX1") || item.pin.length > 50
        ? item.pin
        : encrypt(String(item.pin))
      : "",
    note: String(item.note || ""),
    website: String(item.website || ""),
    isFavorite: item.isFavorite === true || item.isFavorite === "true",
    tags: Array.isArray(item.tags) ? item.tags : [],
    createdAt: item.createdAt ? new Date(item.createdAt) : now,
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : now,
  };
};

/**
 * Normalizes a note object before saving to the database.
 * @param item - The raw note object.
 */
export const normalizeNote = (item: any) => {
  const now = new Date();

  return {
    ...(item._id
      ? {
          _id: typeof item._id === "string" ? new ObjectId(item._id) : item._id,
        }
      : {}),
    ...(item.user ? { user: item.user } : {}),
    title: String(item.title || "Untitled"),
    content: item.content
      ? item.content.startsWith("U2FsdGVkX1") || item.content.length > 50
        ? item.content
        : encrypt(String(item.content))
      : encrypt(""),
    isFavorite: item.isFavorite === true || item.isFavorite === "true",
    tags: Array.isArray(item.tags) ? item.tags : [],
    createdAt: item.createdAt ? new Date(item.createdAt) : now,
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : now,
  };
};
