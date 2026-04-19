import { GoogleGenerativeAI } from '@google/generative-ai';
import { getUserFriendlyToTechnical, convertTechnicalPermissionsToUserFriendly, UserFriendlyPermissionName } from './permission-names';
import { getUserFriendlyPermissionInfo } from './user-friendly-permissions';
import { CATEGORY_EXPECTED_PERMISSIONS } from './permission-recommendations';

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
export async function analyzeUserFriendlyPermission(
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
export async function analyzeUserFriendlyPermissions(
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
export function calculateUserFriendlyRiskScore(
  recommendations: UserFriendlyPermissionRecommendation[]
): number {
  if (recommendations.length === 0) return 0;

  let totalRisk = 0;

  recommendations.forEach(rec => {
    let weight = 1;
    if (rec.decision === 'REJECT') {
      weight = 1.5; // Penalize rejected permissions more
    } else if (rec.decision === 'CAUTION') {
      weight = 1.2;
    }

    totalRisk += rec.riskScore * weight;
  });

  // Normalize to 0-100
  const baseScore = (totalRisk / (recommendations.length * 100)) * 100;
  const adjustedScore = Math.min(100, baseScore);

  return Math.round(adjustedScore);
}

/**
 * Get risk level from score
 */
export function getUserFriendlyRiskLevel(score: number): 'SAFE' | 'MEDIUM' | 'RISKY' {
  if (score <= 30) return 'SAFE';
  if (score <= 60) return 'MEDIUM';
  return 'RISKY';
}
