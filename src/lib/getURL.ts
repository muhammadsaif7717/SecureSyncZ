export default async function getURL() {
  try {
    // If client-side, relative path is always safest and avoids CORS / environment mismatch
    if (typeof window !== "undefined") {
      return "/api/v1";
    }

    const url = process.env.NEXT_PUBLIC_API_URL_V1;
    if (!url) {
      return "http://localhost:3000/api/v1";
    }
    return url;
  } catch (error) {
    console.error("Error fetching URL:", error);
    return "/api/v1";
  }
}
