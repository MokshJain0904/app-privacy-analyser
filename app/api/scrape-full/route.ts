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
      country: 'in',
      fullDetail: true
    });

    if (!searchResults || searchResults.length === 0) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    const app = searchResults[0];
    
    // Get full permissions for Pre-emptive audit
    let permissions = [];
    try {
      const permsData = await gplay.permissions({ appId: app.appId });
      permissions = permsData.map((p: any) => p.permission);
    } catch (permError) {
      console.warn(`Could not fetch exact permissions for ${app.appId}`, permError);
    }

    return NextResponse.json({
      appId: app.appId,
      title: app.title,
      summary: app.summary,
      icon: app.icon,
      score: app.score,
      genre: app.genre,
      permissions: permissions
    });
  } catch (error: any) {
    console.error('Scraping error:', error);
    return NextResponse.json({ error: 'Failed to fetch app data' }, { status: 500 });
  }
}
