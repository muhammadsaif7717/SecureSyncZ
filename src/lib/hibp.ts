export async function checkPwnedPassword(password: string): Promise<boolean> {
  if (!password) return false;

  try {
    // 1. Hash the password with SHA-1
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();

    // 2. Split hash into prefix (first 5) and suffix (the rest)
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);

    // 3. Call HIBP API with k-Anonymity (only sending prefix)
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: "GET",
    });

    if (!res.ok) {
      console.error("HIBP API error:", res.status);
      return false;
    }

    const text = await res.text();

    // 4. Check if our suffix is in the returned list
    const hashes = text.split("\n");
    for (const line of hashes) {
      const [returnedSuffix] = line.split(":");
      if (returnedSuffix.trim() === suffix) {
        return true; // Compromised!
      }
    }

    return false; // Safe
  } catch (error) {
    console.error("Error checking HIBP:", error);
    return false;
  }
}
