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

export const compressImage = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      const MAX_SIZE = 800;

      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width > height) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        } else {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return resolve(file); // fallback
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(file); // fallback
          }
        },
        "image/jpeg",
        0.7 // quality
      );
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = objectUrl;
  });
};
