import { NextResponse } from 'next/server';
import gplay from 'google-play-scraper';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const appName = searchParams.get('appName');

  if (!appName) {
    return NextResponse.json({ error: 'App name is required', suggestions: [] }, { status: 400 });
  }

  try {
    const searchResults = await gplay.search({
      term: appName,
      num: 8,
      country: 'in'
    });

    const suggestions = searchResults.map((app: any) => ({
      title: app.title,
      appId: app.appId,
      icon: app.icon,
      genre: app.genre
    }));

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error('App suggestion error:', error);
    return NextResponse.json({ error: 'Failed to fetch suggestions', suggestions: [] }, { status: 500 });
  }
}
