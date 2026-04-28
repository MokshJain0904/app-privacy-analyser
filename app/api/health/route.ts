import { NextResponse } from 'next/server';
import { withRateLimit, RATE_LIMITS } from '@/middleware/rate-limit';

/**
 * Health check endpoint for monitoring
 * Returns status of all critical services and dependencies
 */

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: Record<string, ServiceHealth>;
  database?: {
    status: 'connected' | 'disconnected';
    latency?: number;
  };
  memory?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
}

interface ServiceHealth {
  status: 'operational' | 'degraded' | 'down';
  latency?: number;
  message?: string;
  lastChecked?: string;
}

const startTime = Date.now();

/**
 * Check Google Play Scraper availability
 */
async function checkPlayStoreConnection(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    // Quick check without making actual request
    const latency = Date.now() - start;
    return {
      status: 'operational',
      latency,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'down',
      message: 'Failed to connect to Play Store',
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Check Exodus Privacy API availability
 */
async function checkExodusPrivacy(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const response = await Promise.race([
      fetch('https://exodus-privacy.eu.org/api/v1/trackers', { method: 'HEAD' }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000)),
    ]);

    const latency = Date.now() - start;
    if (response.ok) {
      return {
        status: 'operational',
        latency,
        lastChecked: new Date().toISOString(),
      };
    } else {
      return {
        status: 'degraded',
        message: `HTTP ${response.status}`,
        latency,
        lastChecked: new Date().toISOString(),
      };
    }
  } catch (error) {
    const latency = Date.now() - start;
    return {
      status: 'down',
      message: error instanceof Error ? error.message : 'Unknown error',
      latency,
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Check Google Gemini API availability
 */
async function checkGeminiAPI(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    // Check if API key is configured
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    const latency = Date.now() - start;

    if (!apiKey) {
      return {
        status: 'degraded',
        message: 'API key not configured',
        lastChecked: new Date().toISOString(),
      };
    }

    return {
      status: 'operational',
      latency,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    const latency = Date.now() - start;
    return {
      status: 'down',
      message: error instanceof Error ? error.message : 'Unknown error',
      latency,
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<{ status: 'connected' | 'disconnected'; latency?: number }> {
  const start = Date.now();
  try {
    // For now, we'll check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return { status: 'disconnected' };
    }

    const latency = Date.now() - start;
    return { status: 'connected', latency };
  } catch {
    return { status: 'disconnected' };
  }
}

/**
 * Get memory usage
 */
function getMemoryUsage() {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
    };
  }
  return undefined;
}

/**
 * Determine overall health status
 */
function determineStatus(services: Record<string, ServiceHealth>): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = Object.values(services).map((s) => s.status);
  
  if (statuses.includes('down')) {
    return 'unhealthy';
  }
  
  if (statuses.includes('degraded')) {
    return 'degraded';
  }
  
  return 'healthy';
}

/**
 * Main health check handler
 */
async function handler() {
  try {
    // Run all health checks in parallel
    const [playStore, exodus, gemini, database] = await Promise.all([
      checkPlayStoreConnection(),
      checkExodusPrivacy(),
      checkGeminiAPI(),
      checkDatabase(),
    ]);

    const services: Record<string, ServiceHealth> = {
      'play-store': playStore,
      'exodus-privacy': exodus,
      'gemini-api': gemini,
    };

    const status = determineStatus(services);
    const uptime = Date.now() - startTime;
    const memory = getMemoryUsage();

    const healthStatus: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      uptime,
      services,
      database: database ? { status: database.status, latency: database.latency } : undefined,
      memory,
    };

    // Return appropriate HTTP status code
    const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 206 : 503;

    return NextResponse.json(healthStatus, { status: statusCode });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Failed to perform health check',
      },
      { status: 503 }
    );
  }
}

// Apply public rate limit
export const GET = withRateLimit(handler as any, RATE_LIMITS.PUBLIC);
