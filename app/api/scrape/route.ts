import { NextResponse } from 'next/server';
import gplay from 'google-play-scraper';

export async function GET(request: Request) {
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
      fullDetail: true
    });

    if (!searchResults || searchResults.length === 0) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    const app = searchResults[0];
    
    // Get permissions
    // Note: google-play-scraper's permissions method might return a list of permissions
    const permissions = await gplay.permissions({ appId: app.appId });

    return NextResponse.json({
      appId: app.appId,
      title: app.title,
      summary: app.summary,
      icon: app.icon,
      score: app.score,
      genre: app.genre,
      permissions: permissions.map((p: any) => p.permission)
    });
  } catch (error: any) {
    console.error('Scraping error:', error);
    return NextResponse.json({ error: 'Failed to fetch app data' }, { status: 500 });
  }
}
