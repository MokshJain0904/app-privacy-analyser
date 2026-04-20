import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, RATE_LIMITS } from '@/middleware/rate-limit';
import { getCSBData, getDynamicExpectedPermissions } from '@/lib/csb-dynamic';


// Handler for CSB dynamic data requests
async function handler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  if (category) {
    const expectedPermissions = getDynamicExpectedPermissions(category);
    return NextResponse.json({
      category,
      expectedPermissions,
      source: 'dynamic-csb'
    });
  }

  // If no category passed, return the whole CSB summary
  const fullData = getCSBData();
  const summary = Object.keys(fullData).reduce((acc, cat) => {
    acc[cat] = {
      totalApps: fullData[cat].totalAppsAnalyzed,
      expectedCount: fullData[cat].expectedPermissions.length,
      updatedAt: fullData[cat].updatedAt
    };
    return acc;
  }, {} as Record<string, any>);

  return NextResponse.json({
    message: "Dynamic Category-Specific Baseline",
    availableCategories: Object.keys(fullData),
    summary
  });
}

// Apply rate limiting
export const GET = withRateLimit(handler, RATE_LIMITS.API);
