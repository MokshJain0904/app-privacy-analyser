import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  getPermissionFeatures,
  getExpectedFeaturesForCategory,
  PERMISSION_FEATURE_DATABASE
} from '@/lib/permission-feature-mapping';
import { generateSmartPermissionAdvice } from '@/lib/feature-based-recommendations';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

/**
 * API Route: /api/feature-based-analysis
 * Analyzes how permissions are used in specific app features
 * Returns detailed feature usage breakdown with AI recommendations
 */
export async function POST(request: NextRequest) {
  try {
    const { appName, permissions, category, appDescription } = await request.json();

    if (!appName || !permissions || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: appName, permissions, category' },
        { status: 400 }
      );
    }

    const analysisResults = [];

    // Analyze top 8 permissions to avoid rate limiting
    const permissionsToAnalyze = permissions.slice(0, 8);

    for (const permission of permissionsToAnalyze) {
      try {
        const allFeatures = getPermissionFeatures(permission);
        const expectedFeatures = getExpectedFeaturesForCategory(permission, category);
        
        // Unexpected features are those not in the expected set
        const expectedFeatureNames = new Set(expectedFeatures.map(f => f.featureName));
        const unexpectedFeatures = allFeatures.filter(f => !expectedFeatureNames.has(f.featureName));

        // Generate AI advice
        let aiAdvice = '';
        try {
          const advice = await generateSmartPermissionAdvice(
            appName,
            category,
            permission,
            appDescription || ''
          );
          aiAdvice = advice.advice;
        } catch (aiError) {
          console.warn(`AI advice generation failed for ${permission}:`, aiError);
          aiAdvice = `Review how ${appName} uses ${permission}. Only grant if necessary for core features.`;
        }

        // Determine recommendation
        let overallRecommendation = 'ACCEPT';
        if (unexpectedFeatures.length > 0) {
          overallRecommendation = 'CONDITIONAL';
        }
        if (unexpectedFeatures.filter(f => f.riskInContext === 'High Risk').length > 0) {
          overallRecommendation = 'REJECT';
        }

        analysisResults.push({
          permissionName: permission,
          technicalName: PERMISSION_FEATURE_DATABASE[permission]?.technicalName || permission,
          allFeatures,
          expectedFeatures,
          unexpectedFeatures,
          aiAdvice,
          overallRecommendation
        });
      } catch (error) {
        console.error(`Error analyzing permission ${permission}:`, error);
        // Continue with next permission
      }
    }

    return NextResponse.json({
      success: true,
      appName,
      category,
      analysisResults,
      totalPermissions: permissions.length,
      analyzedPermissions: analysisResults.length
    });
  } catch (error) {
    console.error('Feature analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze permission features' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to retrieve feature database for a specific permission
 * Example: /api/feature-based-analysis?permission=RECORD_AUDIO&category=Social
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const permission = searchParams.get('permission');
    const category = searchParams.get('category');

    if (!permission) {
      return NextResponse.json(
        { error: 'Missing required parameter: permission' },
        { status: 400 }
      );
    }

    const allFeatures = getPermissionFeatures(permission);
    const expectedFeatures = getExpectedFeaturesForCategory(permission, category || '');

    const expectedFeatureNames = new Set(expectedFeatures.map(f => f.featureName));
    const unexpectedFeatures = allFeatures.filter(f => !expectedFeatureNames.has(f.featureName));

    return NextResponse.json({
      permission,
      category,
      allFeatures,
      expectedFeatures,
      unexpectedFeatures,
      safeUsageCount: allFeatures.filter(f => f.riskInContext === 'Safe').length,
      reviewUsageCount: allFeatures.filter(f => f.riskInContext === 'Review Needed').length,
      riskyUsageCount: allFeatures.filter(f => f.riskInContext === 'High Risk').length
    });
  } catch (error) {
    console.error('Feature database lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve feature database' },
      { status: 500 }
    );
  }
}
