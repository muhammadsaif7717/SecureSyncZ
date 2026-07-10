const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  // Clean up expired entries occasionally
  if (Math.random() < 0.1) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.expiresAt) {
        rateLimitMap.delete(key);
      }
    }
  }

  if (!record || now > record.expiresAt) {
    rateLimitMap.set(identifier, {
      count: 1,
      expiresAt: now + windowMs,
    });
    return true; // Allowed
  }

  if (record.count >= limit) {
    return false; // Rate limited
  }

  record.count += 1;
  return true; // Allowed
}
