/**
 * Feature-Based Smart Recommendations
 * Uses AI to analyze permission usage in specific app features
 * and provides intelligent recommendations like:
 * "Only grant microphone permission when recording videos"
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getPermissionFeatures, getExpectedFeaturesForCategory, getFeatureRiskLevel } from './permission-feature-mapping';

export interface FeatureRecommendation {
  permissionName: string;
  featureName: string;
  howItIsUsed: string; // How the permission is used in this feature
  riskLevel: 'Safe' | 'Review Needed' | 'High Risk';
  recommendation: string; // Smart recommendation for this feature
  shouldGrant: boolean; // Should the user grant this permission?
}

export interface SmartPermissionAdvice {
  permissionName: string;
  overallRecommendation: 'ACCEPT' | 'REJECT' | 'CONDITIONAL';
  reason: string;
  safeFeatures: FeatureRecommendation[]; // Features where permission is used safely
  riskyFeatures: FeatureRecommendation[]; // Features where permission is misused
  advice: string; // AI-generated smart advice
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

/**
 * Generate smart AI advice for conditional permission usage
 * Example: "Only grant microphone permission when recording videos, 
 *          not for background recording"
 */
export async function generateSmartPermissionAdvice(
  appName: string,
  appCategory: string,
  permissionName: string,
  appDescription: string
): Promise<SmartPermissionAdvice> {
  const allFeatures = getPermissionFeatures(permissionName);
  const expectedFeatures = getExpectedFeaturesForCategory(permissionName, appCategory);

  const safeFeatures = allFeatures.filter(f => f.riskInContext === 'Safe');
  const riskyFeatures = allFeatures.filter(f => f.riskInContext === 'High Risk');
  const reviewFeatures = allFeatures.filter(f => f.riskInContext === 'Review Needed');

  // Separate expected vs unexpected features
  const expectedFeatureNames = new Set(expectedFeatures.map(f => f.featureName));
  const expectedSafeFeatures = safeFeatures.filter(f => expectedFeatureNames.has(f.featureName));
  const unexpectedFeatures = allFeatures.filter(f => !expectedFeatureNames.has(f.featureName));

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a privacy expert analyzing permission usage in mobile apps.

App: ${appName}
Category: ${appCategory}
Description: "${appDescription}"
Permission: ${permissionName}

EXPECTED USES IN ${appCategory} APPS (Usually Safe):
${expectedSafeFeatures.map(f => `- ${f.featureName}: ${f.description}`).join('\n')}

POTENTIALLY RISKY USES:
${riskyFeatures.map(f => `- ${f.featureName}: ${f.description}`).join('\n')}

REVIEW NEEDED:
${reviewFeatures.map(f => `- ${f.featureName}: ${f.description}`).join('\n')}

Based on this analysis, provide smart advice for this app's permission usage. Answer in 2-3 sentences, focusing on:
1. Is this permission likely used safely in this app?
2. What features should the user monitor?
3. What permission level is recommended?

Keep it simple and non-technical.`;

    const result = await model.generateContent(prompt);
    const aiAdvice = result.response.text().trim();

    // Determine overall recommendation
    let overallRecommendation: 'ACCEPT' | 'REJECT' | 'CONDITIONAL';
    if (unexpectedFeatures.length === 0 && expectedSafeFeatures.length > 0) {
      overallRecommendation = 'ACCEPT';
    } else if (riskyFeatures.length > 0 || unexpectedFeatures.length > 0) {
      overallRecommendation = 'CONDITIONAL';
    } else {
      overallRecommendation = 'ACCEPT';
    }

    // Build feature recommendations
    const safeFeatureRecommendations: FeatureRecommendation[] = expectedSafeFeatures.map(f => ({
      permissionName,
      featureName: f.featureName,
      howItIsUsed: f.description,
      riskLevel: 'Safe',
      recommendation: `Safe to use. ${appName} likely needs this for ${f.featureName.toLowerCase()}.`,
      shouldGrant: true
    }));

    const riskyFeatureRecommendations: FeatureRecommendation[] = riskyFeatures.map(f => ({
      permissionName,
      featureName: f.featureName,
      howItIsUsed: f.description,
      riskLevel: 'High Risk',
      recommendation: `Caution: ${f.featureName} is a red flag. Only ${appName} should only use this permission for legitimate features like ${expectedSafeFeatures[0]?.featureName || 'core features'}.`,
      shouldGrant: false
    }));

    return {
      permissionName,
      overallRecommendation,
      reason: `Expected for ${appCategory} apps: ${expectedSafeFeatures.length > 0 ? 'Yes' : 'No'}`,
      safeFeatures: safeFeatureRecommendations,
      riskyFeatures: riskyFeatureRecommendations,
      advice: aiAdvice
    };
  } catch (error) {
    console.error('Error generating smart advice:', error);
    return {
      permissionName,
      overallRecommendation: 'CONDITIONAL',
      reason: 'Unable to analyze with AI',
      safeFeatures: expectedSafeFeatures.map(f => ({
        permissionName,
        featureName: f.featureName,
        howItIsUsed: f.description,
        riskLevel: 'Safe',
        recommendation: `This is a common feature for ${appCategory} apps.`,
        shouldGrant: true
      })),
      riskyFeatures: riskyFeatures.map(f => ({
        permissionName,
        featureName: f.featureName,
        howItIsUsed: f.description,
        riskLevel: 'High Risk',
        recommendation: `This usage is risky. Be cautious.`,
        shouldGrant: false
      })),
      advice: 'Unable to generate AI analysis. Use safe features only.'
    };
  }
}

/**
 * Analyze all permissions and generate feature-based recommendations
 */
export async function analyzePermissionsWithFeatures(
  appName: string,
  appCategory: string,
  permissions: string[],
  appDescription: string
): Promise<SmartPermissionAdvice[]> {
  const recommendations: SmartPermissionAdvice[] = [];

  // Analyze top permissions to avoid rate limiting
  const topPermissions = permissions.slice(0, 10);

  for (const permission of topPermissions) {
    try {
      const advice = await generateSmartPermissionAdvice(
        appName,
        appCategory,
        permission,
        appDescription
      );
      recommendations.push(advice);
    } catch (error) {
      console.error(`Error analyzing ${permission}:`, error);
    }
  }

  return recommendations;
}

/**
 * Generate conditional recommendations
 * Example output: "Only grant microphone when using video recording feature"
 */
export async function generateConditionalRecommendation(
  appName: string,
  permissionName: string,
  safeFeatures: string[],
  riskyFeatures: string[]
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a privacy expert. Generate a single-sentence permission recommendation for a non-technical user.

App: ${appName}
Permission: ${permissionName}

SAFE USES:
${safeFeatures.join(', ')}

RISKY USES:
${riskyFeatures.length > 0 ? riskyFeatures.join(', ') : 'None detected'}

Generate ONE clear, actionable recommendation in 1-2 sentences. Format: "Only grant [permission] when [safe feature]. Avoid using if [risky feature] is detected."`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Error generating conditional recommendation:', error);
    return `Be cautious with ${permissionName} in ${appName}. Only enable for essential features.`;
  }
}

/**
 * Get a summary of how a permission is used across all its possible features
 */
export function getPermissionUsageSummary(permissionName: string): {
  safeUsages: string[];
  reviewUsages: string[];
  riskyUsages: string[];
} {
  const features = getPermissionFeatures(permissionName);

  return {
    safeUsages: features
      .filter(f => f.riskInContext === 'Safe')
      .map(f => `${f.featureName}: ${f.description}`),
    reviewUsages: features
      .filter(f => f.riskInContext === 'Review Needed')
      .map(f => `${f.featureName}: ${f.description}`),
    riskyUsages: features
      .filter(f => f.riskInContext === 'High Risk')
      .map(f => `${f.featureName}: ${f.description}`)
  };
}
