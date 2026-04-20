/**
 * Rate Limit Middleware for Next.js API Routes
 * Wraps route handlers with rate limiting protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS, type RATE_LIMITS as RateLimitPreset } from '@/lib/rate-limiter';

// Re-export RATE_LIMITS for use in route handlers
export { RATE_LIMITS };

/**
 * Get client IP from request
 */
function getClientIp(request: NextRequest): string {
  // Try to get IP from various headers (for proxy/load balancer scenarios)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback to connection remote addr
  return '127.0.0.1';
}

/**
 * Higher-order function to wrap an API route with rate limiting
 * Usage: export const POST = withRateLimit(handler, RATE_LIMITS.API);
 */
export function withRateLimit<T extends NextRequest>(
  handler: (request: T) => Promise<Response>,
  limitConfig: typeof RATE_LIMITS[keyof typeof RATE_LIMITS] = RATE_LIMITS.API
) {
  return async (request: T): Promise<Response> => {
    const ip = getClientIp(request);
    const { allowed, remaining, resetTime, retryAfter } = checkRateLimit(ip, limitConfig);

    // If rate limited, return 429 Too Many Requests
    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'You have exceeded the API rate limit. Please try again later.',
          retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(limitConfig.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000))
          }
        }
      );
    }

    // Add rate limit headers to successful response
    const response = await handler(request);
    
    // Clone response to add headers
    const newResponse = new NextResponse(response.body, response);
    newResponse.headers.set('X-RateLimit-Limit', String(limitConfig.maxRequests));
    newResponse.headers.set('X-RateLimit-Remaining', String(remaining));
    newResponse.headers.set('X-RateLimit-Reset', String(Math.ceil(resetTime / 1000)));
    
    return newResponse;
  };
}

/**
 * Middleware factory for checking rate limits inline
 */
export function createRateLimitMiddleware(
  limitConfig: typeof RATE_LIMITS[keyof typeof RATE_LIMITS] = RATE_LIMITS.API
) {
  return (request: NextRequest) => {
    const ip = getClientIp(request);
    const { allowed, retryAfter } = checkRateLimit(ip, limitConfig);

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter
        },
        { status: 429 }
      );
    }

    return null; // Continue to handler
  };
}
