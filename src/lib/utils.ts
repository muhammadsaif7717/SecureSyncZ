import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractRootDomain(url: string): string {
  try {
    const validUrl =
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;
    const urlObj = new URL(validUrl);
    const hostname = urlObj.hostname;
    const parts = hostname.split(".");
    if (parts.length > 2) {
      const secondLevel = parts[parts.length - 2];
      if (
        ["co", "com", "org", "net", "edu", "gov"].includes(secondLevel) &&
        parts.length > 2
      ) {
        return parts.slice(-3).join(".");
      }
      return parts.slice(-2).join(".");
    }
    return hostname;
  } catch {
    return url.toLowerCase();
  }
}
