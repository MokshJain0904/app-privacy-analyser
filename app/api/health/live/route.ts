import { NextResponse } from 'next/server';

/**
 * Liveness probe - simple check if server is running
 * Returns 200 if server is alive, no external dependencies checked
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'alive',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
    { status: 200 }
  );
}
