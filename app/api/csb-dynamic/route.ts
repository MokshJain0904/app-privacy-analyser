import { NextResponse } from 'next/server';
import { getCSBData, getDynamicExpectedPermissions } from '@/lib/csb-dynamic';

export async function GET(request: Request) {
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
