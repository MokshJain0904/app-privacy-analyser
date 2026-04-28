import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, RATE_LIMITS } from '@/middleware/rate-limit';
import gplay from 'google-play-scraper';
import { ErrorType, AppError, createErrorResponse, logError } from '@/lib/error-handler';


// Wrap handler with rate limiting for app suggestions
async function handler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const appName = searchParams.get('appName');

  if (!appName) {
    const error = new AppError(ErrorType.VALIDATION, 'Please provide an app name to search.');
    return NextResponse.json({ error: error.userMessage, suggestions: [] }, { status: error.statusCode });
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
    const appError = error instanceof AppError
      ? error
      : new AppError(
          ErrorType.NETWORK_ERROR,
          'Failed to fetch app suggestions. Please try again.'
        );
    logError(appError, { context: 'app_suggestions_handler', appName });
    return NextResponse.json({ error: appError.userMessage, suggestions: [] }, { status: appError.statusCode });
  }
}

// Apply rate limiting
export const GET = withRateLimit(handler, RATE_LIMITS.PUBLIC);
