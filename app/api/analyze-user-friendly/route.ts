import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getUserFriendlyToTechnical, convertTechnicalPermissionsToUserFriendly, UserFriendlyPermissionName } from '@/lib/permission-names';
import { getUserFriendlyPermissionInfo } from '@/lib/user-friendly-permissions';
import { CATEGORY_EXPECTED_PERMISSIONS } from '@/lib/permission-recommendations';

export type PermissionDecision = 'ACCEPT' | 'REJECT' | 'CAUTION';

export interface UserFriendlyPermissionRecommendation {
  permissionName: UserFriendlyPermissionName;
  decision: PermissionDecision;
  explanation: string;
  riskScore: number;
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

/**
 * Check if a user-friendly permission is expected for a category
 */
function isUserFriendlyPermissionExpected(
  userFriendlyPerm: UserFriendlyPermissionName,
  category: string
): boolean {
  const technicalPerms = getUserFriendlyToTechnical(userFriendlyPerm);
  const expected = CATEGORY_EXPECTED_PERMISSIONS[category] || new Set();

  // Check if any of the technical permissions are expected
  return technicalPerms.some(tech => expected.has(tech));
}

/**
 * Get AI analysis for a user-friendly permission
 */
async function getAIPermissionAnalysis(
  appName: string,
  appCategory: string,
  appDescription: string,
  permissionName: UserFriendlyPermissionName,
  isExpected: boolean
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a privacy expert analyzing app permissions.

App: ${appName}
Category: ${appCategory}
Description: "${appDescription}"
Permission: ${permissionName}
Is this permission typically expected for this category? ${isExpected ? 'YES' : 'NO'}

${isExpected 
  ? 'This permission is typically expected for this app category. Confirm if the app description mentions the feature that needs this permission, and explain briefly why it might be needed.' 
  : 'This permission is NOT typically expected for this app category. Explain why the app might be asking for it and whether it seems suspicious or could have legitimate use.'}

Keep your response under 80 words. Be direct and simple for non-technical users. Focus on: why the app wants this, what risks it poses, and whether users should accept or reject it.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text.trim();
  } catch (error) {
    console.error('AI Analysis Error:', error);
    return 'Unable to analyze this permission with AI at this moment.';
  }
}

/**
 * Analyze a single user-friendly permission
 */
async function analyzeUserFriendlyPermission(
  appName: string,
  appCategory: string,
  appDescription: string,
  permissionName: UserFriendlyPermissionName
): Promise<UserFriendlyPermissionRecommendation> {
  const permInfo = getUserFriendlyPermissionInfo(permissionName);
  if (!permInfo) {
    return {
      permissionName,
      decision: 'CAUTION',
      explanation: 'Unknown permission. Unable to analyze.',
      riskScore: 50,
    };
  }

  const riskScore = permInfo.riskScore;
  const isExpected = isUserFriendlyPermissionExpected(permissionName, appCategory);

  // Get AI analysis
  const aiAnalysis = await getAIPermissionAnalysis(
    appName,
    appCategory,
    appDescription,
    permissionName,
    isExpected
  );

  // Decision logic
  let decision: PermissionDecision;
  let explanation: string;

  if (isExpected) {
    // Permission is expected for this category
    if (riskScore <= 30) {
      decision = 'ACCEPT';
      explanation = `Expected for ${appCategory}. ${aiAnalysis}`;
    } else if (riskScore <= 60) {
      decision = 'ACCEPT';
      explanation = `Typically needed for ${appCategory}, though it's worth knowing about. ${aiAnalysis}`;
    } else {
      decision = 'CAUTION';
      explanation = `This is a sensitive permission, even for ${appCategory}. Review carefully. ${aiAnalysis}`;
    }
  } else {
    // Permission NOT expected for this category
    if (riskScore >= 80) {
      decision = 'REJECT';
      explanation = `This critical permission is not needed for ${appCategory}. ${aiAnalysis}`;
    } else if (riskScore >= 60) {
      decision = 'REJECT';
      explanation = `This sensitive permission is not typical for ${appCategory}. ${aiAnalysis}`;
    } else {
      decision = 'CAUTION';
      explanation = `Not typically needed for ${appCategory}, but might have legitimate uses. ${aiAnalysis}`;
    }
  }

  return {
    permissionName,
    decision,
    explanation,
    riskScore,
  };
}

/**
 * Analyze multiple user-friendly permissions for an app
 */
async function analyzeUserFriendlyPermissions(
  appName: string,
  appCategory: string,
  appDescription: string,
  permissions: UserFriendlyPermissionName[]
): Promise<UserFriendlyPermissionRecommendation[]> {
  const recommendations = await Promise.all(
    permissions.map(perm =>
      analyzeUserFriendlyPermission(appName, appCategory, appDescription, perm)
    )
  );

  // Sort by decision (REJECT first, then CAUTION, then ACCEPT)
  const decisionOrder = { REJECT: 0, CAUTION: 1, ACCEPT: 2 };
  return recommendations.sort((a, b) => decisionOrder[a.decision] - decisionOrder[b.decision]);
}

/**
 * Calculate overall risk score based on user-friendly permission recommendations
 */
function calculateUserFriendlyRiskScore(
  recommendations: UserFriendlyPermissionRecommendation[]
): number {
  if (recommendations.length === 0) return 0;

  let rawScore = 0;

  recommendations.forEach(rec => {
    // Determine raw penalty points based on AI decision and inherent risk
    let penalty = 0;
    
    // rec.riskScore is an inherent out-of-100 base assigned to the permission type
    if (rec.decision === 'REJECT') {
      penalty = rec.riskScore * 0.5; // Massive penalty (e.g. 50 points for Location)
    } else if (rec.decision === 'CAUTION') {
      penalty = rec.riskScore * 0.2; // Moderate penalty (e.g. 20 points)
    } else if (rec.decision === 'ACCEPT') {
      penalty = rec.riskScore * 0.02; // Negligible penalty for safe functionality
    }

    rawScore += penalty;
  });

  // Asymptotic Decay Curve
  // Eliminates dilution bug where many safe permissions mask 1 dangerous one
  // k is tuned so ~1 High Risk violation (~50 points) escalates the score to >80%
  const k = 0.036; 
  const normalized = 100 * (1 - Math.exp(-k * rawScore));

  return Math.min(100, Math.round(normalized));
}

/**
 * Get risk level from score
 */
function getUserFriendlyRiskLevel(score: number): 'SAFE' | 'MEDIUM' | 'RISKY' {
  if (score <= 30) return 'SAFE';
  if (score <= 60) return 'MEDIUM';
  return 'RISKY';
}

export async function POST(request: Request) {
  try {
    const { appName, appCategory, appDescription, permissions } = await request.json();

    if (!appName || !appCategory || !permissions || permissions.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: appName, appCategory, permissions' },
        { status: 400 }
      );
    }

    // Analyze permissions
    const recommendations = await analyzeUserFriendlyPermissions(
      appName,
      appCategory,
      appDescription || '',
      permissions as UserFriendlyPermissionName[]
    );

    // Calculate risk score
    const riskScore = calculateUserFriendlyRiskScore(recommendations);
    const riskLevel = getUserFriendlyRiskLevel(riskScore);

    return NextResponse.json({
      recommendations,
      riskScore,
      riskLevel,
      success: true
    });
  } catch (error: any) {
    console.error('User-friendly analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze permissions', details: error.message },
      { status: 500 }
    );
  }
}
