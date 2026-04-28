/**
 * Rate Limiting Utility
 * Tracks requests by IP address and enforces per-minute/per-hour limits
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

// In-memory store for rate limit tracking
// In production, use Redis instead
const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup old records every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (record.resetTime < now) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

/**
 * Check if a request should be rate limited
 * Returns { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(
  ip: string,
  config: RateLimitConfig = { windowMs: 60 * 1000, maxRequests: 30 } // 30 requests per minute
): { allowed: boolean; remaining: number; resetTime: number; retryAfter?: number } {
  const now = Date.now();
  let record = rateLimitStore.get(ip);

  // Initialize or reset if window expired
  if (!record || record.resetTime < now) {
    record = {
      count: 0,
      resetTime: now + config.windowMs
    };
    rateLimitStore.set(ip, record);
  }

  // Increment counter
  record.count++;

  // Check if exceeded limit
  const exceeded = record.count > config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - record.count);
  const retryAfter = exceeded ? Math.ceil((record.resetTime - now) / 1000) : undefined;

  return {
    allowed: !exceeded,
    remaining,
    resetTime: record.resetTime,
    retryAfter
  };
}

/**
 * Reset rate limit for an IP (useful for testing)
 */
export function resetRateLimit(ip: string): void {
  rateLimitStore.delete(ip);
}

/**
 * Get current rate limit status for an IP
 */
export function getRateLimitStatus(ip: string): RateLimitRecord | null {
  return rateLimitStore.get(ip) || null;
}

/**
 * Rate limit presets for different endpoints
 */
export const RATE_LIMITS = {
  // Generous limit for public endpoints
  PUBLIC: { windowMs: 60 * 1000, maxRequests: 60 },
  
  // Standard limit for most API endpoints
  API: { windowMs: 60 * 1000, maxRequests: 30 },
  
  // Strict limit for expensive operations (analyze, compare)
  EXPENSIVE: { windowMs: 60 * 1000, maxRequests: 50 },
  
  // Very strict limit for database writes
  AUTH: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 per 15 minutes
  
  // Hourly limit for external API calls
  EXTERNAL_API: { windowMs: 60 * 60 * 1000, maxRequests: 100 } // 100 per hour
};
