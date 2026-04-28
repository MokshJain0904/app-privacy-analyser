import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getUserFriendlyToTechnical, convertTechnicalPermissionsToUserFriendly, UserFriendlyPermissionName } from '@/lib/permission-names';
import { getUserFriendlyPermissionInfo } from '@/lib/user-friendly-permissions';
import { getExpectedPermissions, normalizeCategory } from '@/lib/permissions-db';

export type PermissionDecision = 'ACCEPT' | 'REJECT' | 'CAUTION';

export interface UserFriendlyPermissionRecommendation {
  permissionName: UserFriendlyPermissionName;
  decision: PermissionDecision;
  explanation: string;
  riskScore: number;
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

/**
 * Check if a user-friendly permission is expected for a category.
 * Uses the unified canonical DB — normalizes the Play Store genre first.
 */
function isUserFriendlyPermissionExpected(
  userFriendlyPerm: UserFriendlyPermissionName,
  category: string
): boolean {
  const technicalPerms = getUserFriendlyToTechnical(userFriendlyPerm);
  // Normalize the raw Play Store genre to a canonical category before lookup
  const expected = new Set(getExpectedPermissions(normalizeCategory(category)));
  return technicalPerms.some(tech => expected.has(tech));
}

/**
 * Get batched AI analysis for all user-friendly permissions at once to prevent rate limiting
 */
async function getBatchedAIPermissionAnalysis(
  appName: string,
  appCategory: string,
  appDescription: string,
  permsData: { name: UserFriendlyPermissionName; isExpected: boolean }[]
): Promise<Record<string, string>> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const permsListStr = permsData.map(p => `- ${p.name} (Typically expected for this category? ${p.isExpected ? 'YES' : 'NO'})`).join('\n');
    
    const prompt = `You are a privacy expert analyzing app permissions.

App: ${appName}
Category: ${appCategory}
Description: "${appDescription}"

Permissions to analyze:
${permsListStr}

For each permission, write a brief explanation (under 80 words) for non-technical users. Focus on EXACTLY which specific feature of the app requires this permission.
- If expected (YES): Confirm the exact feature that needs this permission, and briefly explain why it is needed.
- If not expected (NO): Explain why the app might be asking for it and whether it seems suspicious or has legitimate use.

Return ONLY a valid JSON object where keys are the exact permission names provided, and values are the string explanations. No markdown, no code blocks, just raw JSON.`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    if (text.startsWith('```json')) {
      text = text.substring(7, text.length - 3).trim();
    } else if (text.startsWith('```')) {
      text = text.substring(3, text.length - 3).trim();
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.warn('Batched AI Analysis Error (Rate limit likely):', error);
    return {}; // Return empty object to gracefully fall back to static text
  }
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
  
  // 1. Pre-compute expectations and metadata
  const permsData = permissions.map(perm => ({
    name: perm,
    isExpected: isUserFriendlyPermissionExpected(perm, appCategory),
    permInfo: getUserFriendlyPermissionInfo(perm)
  }));

  // 2. Fetch AI analysis in ONE batched request to prevent Google API rate limits!
  const aiAnalyses = await getBatchedAIPermissionAnalysis(appName, appCategory, appDescription, permsData);

  // 3. Construct recommendations
  const recommendations = permsData.map(data => {
    const { name: permissionName, isExpected, permInfo } = data;
    
    if (!permInfo) {
      return {
        permissionName,
        decision: 'CAUTION' as PermissionDecision,
        explanation: 'Unknown permission. Unable to analyze.',
        riskScore: 50,
      };
    }

    const riskScore = permInfo.riskScore;
    const aiAnalysis = aiAnalyses[permissionName] || '';

    let decision: PermissionDecision;
    let explanation: string;

    if (isExpected) {
      decision = 'ACCEPT';
      if (riskScore <= 30) {
        explanation = `Expected for ${appCategory}. ${aiAnalysis}`;
      } else if (riskScore <= 60) {
        explanation = `Typically needed for ${appCategory}, though it's worth knowing about. ${aiAnalysis}`;
      } else {
        explanation = `Required for ${appCategory}, but highly sensitive. ${aiAnalysis}`;
      }
    } else {
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
      explanation: explanation.trim(),
      riskScore,
    };
  });

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
  console.log(`\n[User-Friendly Algo] Calculating risk score...`);

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

    console.log(`[User-Friendly Algo] Permission: ${rec.permissionName} | Decision: ${rec.decision} | Base Risk: ${rec.riskScore} | Penalty: +${penalty.toFixed(1)}`);
    rawScore += penalty;
  });

  // Asymptotic Decay Curve
  // Eliminates dilution bug where many safe permissions mask 1 dangerous one
  // k is tuned so ~1 High Risk violation (~50 points) escalates the score to >80%
  const k = 0.036; 
  const normalized = 100 * (1 - Math.exp(-k * rawScore));
  const finalScore = Math.min(100, Math.round(normalized));

  console.log(`[User-Friendly Algo] Final Raw Score: ${rawScore.toFixed(1)} -> Normalized: ${finalScore}%\n`);

  return finalScore;
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
