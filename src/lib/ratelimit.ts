import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Production-grade rate limiter powered by Upstash Redis.
 * Falls back to allowing all requests if Upstash is not configured.
 */
export const getRateLimiter = (requests: number, duration: string) => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (process.env.NODE_ENV === 'production') {
      console.warn("UPSTASH_REDIS_REST_URL or TOKEN missing in PRODUCTION. Rate limiting is DISABLED.");
    }
    return null;
  }

  try {
    return new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(requests, duration as any),
      analytics: true,
      prefix: "popeth_ratelimit",
    });
  } catch (err) {
    console.error("Failed to initialize Upstash Ratelimit:", err);
    return null;
  }
};

/**
 * Safely extract the client IP address from the request headers.
 */
export function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "127.0.0.1";
}
