import { GoogleGenerativeAI } from '@google/generative-ai';
import { getPermissionRiskScore } from './permission-explanations';

export type PermissionDecision = 'ACCEPT' | 'REJECT' | 'CAUTION';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface PermissionRecommendation {
  permissionName: string;
  decision: PermissionDecision;
  explanation: string;
  confidence: ConfidenceLevel;
  riskScore: number;
}

// Expected permissions by category
export const CATEGORY_EXPECTED_PERMISSIONS: Record<string, Set<string>> = {
  'Social Media': new Set([
    'READ_CONTACTS', 'CAMERA', 'RECORD_AUDIO', 'READ_EXTERNAL_STORAGE',
    'WRITE_EXTERNAL_STORAGE', 'INTERNET', 'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'
  ]),
  'Maps & Navigation': new Set([
    'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION', 'INTERNET', 'CAMERA', 'READ_EXTERNAL_STORAGE'
  ]),
  'Messaging': new Set([
    'READ_CONTACTS', 'READ_SMS', 'RECORD_AUDIO', 'CAMERA', 'INTERNET', 'WRITE_SMS'
  ]),
  'Photography': new Set([
    'CAMERA', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE', 'INTERNET', 'ACCESS_FINE_LOCATION'
  ]),
  'Banking': new Set([
    'INTERNET', 'CAMERA', 'USE_BIOMETRIC', 'READ_EXTERNAL_STORAGE'
  ]),
  'Health & Fitness': new Set([
    'INTERNET', 'ACCESS_FINE_LOCATION', 'BLUETOOTH', 'CAMERA', 'READ_EXTERNAL_STORAGE'
  ]),
  'Video & Streaming': new Set([
    'INTERNET', 'CAMERA', 'RECORD_AUDIO', 'READ_EXTERNAL_STORAGE', 'WAKE_LOCK'
  ]),
  'News & Magazine': new Set([
    'INTERNET', 'CAMERA', 'READ_EXTERNAL_STORAGE'
  ]),
  'Shopping': new Set([
    'INTERNET', 'CAMERA', 'ACCESS_COARSE_LOCATION', 'READ_EXTERNAL_STORAGE'
  ]),
  'Education': new Set([
    'INTERNET', 'CAMERA', 'RECORD_AUDIO', 'READ_EXTERNAL_STORAGE'
  ]),
  'Games': new Set([
    'INTERNET', 'VIBRATE', 'WAKE_LOCK', 'CAMERA'
  ]),
  'Tools': new Set([
    'INTERNET', 'VIBRATE'
  ]),
  'Utilities': new Set([
    'INTERNET', 'VIBRATE', 'WAKE_LOCK'
  ]),
};

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

/**
 * Get expected permissions for an app category
 */
export function getExpectedPermissionsForCategory(category: string): Set<string> {
  return CATEGORY_EXPECTED_PERMISSIONS[category] || new Set();
}

/**
 * Determine if a permission is expected for a category
 */
export function isPermissionExpectedForCategory(permission: string, category: string): boolean {
  const expected = getExpectedPermissionsForCategory(category);
  return expected.has(permission);
}

/**
 * Get AI analysis for why an app might need a permission
 */
export async function getAIPermissionAnalysis(
  appName: string,
  appCategory: string,
  appDescription: string,
  permission: string,
  isExpected: boolean
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a privacy expert analyzing app permissions.

App: ${appName}
Category: ${appCategory}
Description: "${appDescription}"
Permission: ${permission}
Is this permission typically expected for this category? ${isExpected ? 'YES' : 'NO'}

${isExpected ? 
  'This permission is typically expected for this app category. Confirm if the app description mentions the feature that needs this permission, and explain briefly.' :
  'This permission is NOT typically expected for this app category. Explain why the app might be asking for it and whether it seems suspicious or could have legitimate use.'
}

Keep your response under 100 words. Be direct and non-technical for average users.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text.trim();
  } catch (error) {
    console.error('AI Analysis Error:', error);
    return 'Unable to analyze this permission with AI at this moment.';
  }
}

/**
 * Analyze a single permission and generate a recommendation
 */
export async function analyzePermission(
  appName: string,
  appCategory: string,
  appDescription: string,
  permission: string
): Promise<PermissionRecommendation> {
  const riskScore = getPermissionRiskScore(permission);
  const isExpected = isPermissionExpectedForCategory(permission, appCategory);

  // Get AI analysis
  const aiAnalysis = await getAIPermissionAnalysis(
    appName,
    appCategory,
    appDescription,
    permission,
    isExpected
  );

  // Decision logic
  let decision: PermissionDecision;
  let confidence: ConfidenceLevel;
  let explanation: string;

  if (isExpected) {
    if (riskScore <= 30) {
      decision = 'ACCEPT';
      confidence = 'HIGH';
      explanation = `Expected for ${appCategory} apps. ${aiAnalysis}`;
    } else if (riskScore <= 60) {
      decision = 'ACCEPT';
      confidence = 'MEDIUM';
      explanation = `Typically needed for ${appCategory} apps, though it's worth reviewing. ${aiAnalysis}`;
    } else {
      decision = 'CAUTION';
      confidence = 'MEDIUM';
      explanation = `This is a sensitive permission, even for ${appCategory} apps. Review carefully. ${aiAnalysis}`;
    }
  } else {
    // Permission NOT expected
    if (riskScore >= 80) {
      decision = 'REJECT';
      confidence = 'HIGH';
      explanation = `This is a critical permission that ${appCategory} apps rarely need. ${aiAnalysis}`;
    } else if (riskScore >= 60) {
      decision = 'REJECT';
      confidence = 'MEDIUM';
      explanation = `This is a sensitive permission not typically needed for ${appCategory} apps. ${aiAnalysis}`;
    } else {
      decision = 'CAUTION';
      confidence = 'MEDIUM';
      explanation = `Not typically needed for ${appCategory} apps, but might have legitimate uses. ${aiAnalysis}`;
    }
  }

  return {
    permissionName: permission,
    decision,
    explanation,
    confidence,
    riskScore,
  };
}

/**
 * Analyze multiple permissions for an app
 */
export async function analyzeAppPermissions(
  appName: string,
  appCategory: string,
  appDescription: string,
  permissions: string[]
): Promise<PermissionRecommendation[]> {
  const recommendations = await Promise.all(
    permissions.map(perm =>
      analyzePermission(appName, appCategory, appDescription, perm)
    )
  );

  // Sort by decision (REJECT first, then CAUTION, then ACCEPT)
  const decisionOrder = { REJECT: 0, CAUTION: 1, ACCEPT: 2 };
  return recommendations.sort((a, b) => decisionOrder[a.decision] - decisionOrder[b.decision]);
}

/**
 * Calculate overall risk score based on permissions and recommendations
 */
export function calculateOverallRiskScore(recommendations: PermissionRecommendation[]): number {
  if (recommendations.length === 0) return 0;

  let totalRisk = 0;
  let rejectedCount = 0;

  recommendations.forEach(rec => {
    let weight = 1;
    if (rec.decision === 'REJECT') {
      weight = 1.5; // Penalize rejected permissions more
      rejectedCount++;
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
 * Get risk level based on score
 */
export function getRiskLevel(score: number): 'SAFE' | 'MEDIUM' | 'RISKY' {
  if (score <= 30) return 'SAFE';
  if (score <= 60) return 'MEDIUM';
  return 'RISKY';
}

/**
 * Get risk level color
 */
export function getRiskColor(score: number): string {
  const level = getRiskLevel(score);
  switch (level) {
    case 'SAFE':
      return 'green';
    case 'MEDIUM':
      return 'yellow';
    case 'RISKY':
      return 'red';
  }
}
