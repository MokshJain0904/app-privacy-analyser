import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, RATE_LIMITS } from '@/middleware/rate-limit';
import gplay from 'google-play-scraper';
import { ErrorType, AppError, createErrorResponse, logError } from '@/lib/error-handler';


// Wrap handler with rate limiting for moderate-cost Play Store scraping
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
    const appError = error instanceof AppError
      ? error
      : new AppError(
          ErrorType.NETWORK_ERROR,
          'Failed to search the app store. Please check your connection and try again.'
        );
    logError(appError, { context: 'scrape_handler', appName });
    return createErrorResponse(appError);
  }
}

// Apply rate limiting
export const GET = withRateLimit(handler, RATE_LIMITS.API);
