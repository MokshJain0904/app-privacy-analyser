import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, RATE_LIMITS } from '@/middleware/rate-limit';
import gplay from 'google-play-scraper';
import { ErrorType, AppError, createErrorResponse, logError } from '@/lib/error-handler';


// Wrap handler with rate limiting for expensive Play Store scraping with permissions
async function handler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const appName = searchParams.get('appName');

  if (!appName) {
    const error = new AppError(ErrorType.VALIDATION, 'Please provide an app name to search.');
    return createErrorResponse(error);
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
      const error = new AppError(
        ErrorType.NOT_FOUND,
        `Could not find "${appName}". Try searching with a different name or check the exact spelling.`
      );
      return createErrorResponse(error);
    }

    const app = searchResults[0];
    
    // Get full permissions for Pre-emptive audit
    let permissions = [];
    try {
      const permsData = await gplay.permissions({ appId: app.appId });
      permissions = permsData.map((p: any) => p.permission);
    } catch (permError) {
      logError(
        new AppError(ErrorType.API_ERROR, `Could not fetch exact permissions for ${app.title}`),
        { context: 'scrape_full_permissions', appId: app.appId }
      );
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
    const appError = error instanceof AppError
      ? error
      : new AppError(
          ErrorType.NETWORK_ERROR,
          'Failed to search the app store. Please check your connection and try again.'
        );
    logError(appError, { context: 'scrape_full_handler', appName });
    return createErrorResponse(appError);
  }
}

// Apply rate limiting for expensive Play Store operations
export const GET = withRateLimit(handler, RATE_LIMITS.EXPENSIVE);
