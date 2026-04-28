import { GoogleGenerativeAI } from '@google/generative-ai';
import { getExpectedPermissions } from '@/lib/permissions-db';
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

/**
 * Returns expected technical permissions for a category.
 * Delegates to the unified permissions-db — no separate list maintained here.
 */
export function getExpectedPermissionsForCategory(category: string): Set<string> {
  return new Set(getExpectedPermissions(category));
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');


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
    decision = 'ACCEPT';
    if (riskScore <= 30) {
      confidence = 'HIGH';
      explanation = `Expected for ${appCategory} apps. ${aiAnalysis}`;
    } else if (riskScore <= 60) {
      confidence = 'MEDIUM';
      explanation = `Typically needed for ${appCategory} apps, though it's worth reviewing. ${aiAnalysis}`;
    } else {
      confidence = 'MEDIUM';
      explanation = `This is a sensitive permission, but essential for ${appCategory} apps. Review carefully. ${aiAnalysis}`;
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
/**
 * Calculate overall risk score using asymptotic decay curve.
 * Eliminates the dilution bug where many safe permissions mask one dangerous one.
 * k=0.036 means ~50 raw points (one high-risk REJECT) → ~84% score.
 */
export function calculateOverallRiskScore(recommendations: PermissionRecommendation[]): number {
  if (recommendations.length === 0) return 0;

  let rawScore = 0;
  console.log(`\n[Recommendations Algo] Calculating overall risk score...`);

  recommendations.forEach(rec => {
    let penalty = 0;
    if (rec.decision === 'REJECT') {
      penalty = rec.riskScore * 0.5;   // Strong penalty for rejected permissions
    } else if (rec.decision === 'CAUTION') {
      penalty = rec.riskScore * 0.2;   // Moderate penalty
    } else {
      penalty = rec.riskScore * 0.02;  // Negligible for accepted / safe perms
    }
    console.log(`[Recommendations Algo] Permission: ${rec.permissionName} | Decision: ${rec.decision} | Penalty: +${penalty.toFixed(1)}`);
    rawScore += penalty;
  });

  // Asymptotic curve: prevents dilution — more safe perms don't reduce the score
  const k = 0.036;
  const normalized = 100 * (1 - Math.exp(-k * rawScore));
  const finalScore = Math.min(100, Math.round(normalized));

  console.log(`[Recommendations Algo] Final Raw Score: ${rawScore.toFixed(1)} -> Normalized: ${finalScore}%\n`);
  return finalScore;
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
