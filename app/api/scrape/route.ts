import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, RATE_LIMITS } from '@/middleware/rate-limit';
import gplay from 'google-play-scraper';


// Wrap handler with rate limiting for moderate-cost Play Store scraping
async function handler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const appName = searchParams.get('appName');

  if (!appName) {
    return NextResponse.json({ error: 'App name is required' }, { status: 400 });
  }

  try {
    // Search for the app
    const searchResults = await gplay.search({
      term: appName,
      num: 1,
      country: 'in',
      fullDetail: true
    });

    if (!searchResults || searchResults.length === 0) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    const app = searchResults[0];
    
    return NextResponse.json({
      appId: app.appId,
      title: app.title,
      summary: app.summary,
      icon: app.icon,
      score: app.score,
      genre: app.genre,
      permissions: [] // Skipped fetching permissions to reduce scraping time
    });
  } catch (error: any) {
    console.error('Scraping error:', error);
    return NextResponse.json({ error: 'Failed to fetch app data' }, { status: 500 });
  }
}

// Apply rate limiting
export const GET = withRateLimit(handler, RATE_LIMITS.API);
