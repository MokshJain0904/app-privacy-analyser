import { NextResponse } from 'next/server';

/**
 * Readiness probe - checks if service is ready to accept requests
 * Returns 200 if all dependencies are available, 503 if not ready
 */
export async function GET() {
  // Check critical environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'GOOGLE_GEMINI_API_KEY',
  ];

  const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

  if (missingVars.length > 0) {
    return NextResponse.json(
      {
        status: 'not-ready',
        timestamp: new Date().toISOString(),
        reason: `Missing environment variables: ${missingVars.join(', ')}`,
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    {
      status: 'ready',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
    { status: 200 }
  );
}
