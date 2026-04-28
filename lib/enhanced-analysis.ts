/**
 * Enhanced AI Analysis Prompt Generator
 * Incorporates feature-based permission analysis
 * Shows HOW permissions are used in specific app features
 */

import { getPermissionFeatures, getExpectedFeaturesForCategory } from '@/lib/permission-feature-mapping';

export function generateEnhancedAnalysisPrompt(
  appName: string,
  category: string,
  permissions: string[],
  appDescription: string,
  expectedPermissions: string[],
  normalizedScore: number
): string {
  // Get feature context for top permissions
  const topPerms = permissions.slice(0, 8);
  let featureContext = '';

  for (const perm of topPerms) {
    const allFeatures = getPermissionFeatures(perm);
    const expectedFeatures = getExpectedFeaturesForCategory(perm, category);

    if (allFeatures.length > 0) {
      featureContext += `\n${perm}:\n`;
      featureContext += `  Expected Safe Uses: ${expectedFeatures.map(f => f.featureName).join(', ') || 'None'}\n`;
      featureContext += `  Possible Safe Uses:\n`;
      allFeatures
        .filter(f => f.riskInContext === 'Safe')
        .slice(0, 3)
        .forEach(f => {
          featureContext += `    - ${f.featureName}: ${f.description}\n`;
        });
    }
  }

  return `
You are a senior cybersecurity expert analyzing Android app permissions with feature-specific context.

APP ANALYSIS:
Name: ${appName}
Category: ${category}
Description: "${appDescription}"
Calculated Risk Score: ${normalizedScore}% (0% = Safe, 100% = Risky)

PERMISSIONS TO ANALYZE (${permissions.length} total):
${permissions.slice(0, 15).join(', ')}

EXPECTED PERMISSIONS FOR ${category.toUpperCase()}:
${expectedPermissions.join(', ')}

FEATURE CONTEXT (How permissions are typically used):
${featureContext || 'No specific feature context available.'}

ANALYSIS GUIDELINES:

1. FOR EACH PERMISSION:
   - Explain SPECIFICALLY how ${appName} likely uses it based on the feature context provided
   - Example format: "Microphone → Used for video recording and voice calling in Instagram's video features"
   - Example format: "Storage → Used for saving downloaded photos and uploading user content"
   - Do NOT speculate about potential misuse; focus only on legitimate app features

2. RISK CLASSIFICATION (categorize each permission):
   - "Safe": Permission is used for core, legitimate features typical for this app category
   - "Review Needed": Permission might be used for non-essential features, monitor usage patterns
   - "High Risk": Permission has no clear legitimate use OR is used without user expectation

3. CONTEXT-AWARE SCORING:
   - If a permission is used in expected features for this category, consider downgrading from High Risk to Safe
   - Example: "RECORD_AUDIO in Instagram is SAFE because it's used for video recording"
   - Example: "CAMERA in Flashlight app is HIGH RISK because flashlight doesn't need camera"

4. INCLUDE FEATURE USAGE EXPLANATIONS:
   - For each permission, note which app features need it
   - Help non-technical users understand why the app asks for this permission

5. SMART RECOMMENDATIONS:
   - Suggest only granting permissions needed for features the user will actually use
   - Example: "Only enable microphone permission if you plan to record videos"

6. FORMAT: Return ONLY valid JSON with NO markdown:

{
  "permissions": [
    {
      "name": "PERMISSION_NAME",
      "riskLevel": "Safe|Review Needed|High Risk",
      "features": ["Feature 1", "Feature 2"],
      "explanation": "How this app uses this permission"
    }
  ],
  "summary": "2-3 sentences for non-technical users about overall risk (${normalizedScore}%)",
  "featureRecommendations": {
    "videoRecording": "Safe - Grant for recording videos",
    "backgroundMonitoring": "Risky - Do not grant"
  },
  "alternatives": [
    { "name": "AppName", "reason": "Why it's better for privacy" }
  ]
}

CRITICAL REQUIREMENTS:
- Your "permissions" array MUST include EVERY permission listed in "PERMISSIONS TO ANALYZE"
- Each permission MUST have a "features" array showing how it's used
- Include the risk score (${normalizedScore}%) in your summary
- Keep explanations 1-2 sentences per permission
- Write for average users, not technical experts
`;
}

/**
 * Parse enhanced analysis response
 */
export interface EnhancedAnalysisResult {
  permissions: Array<{
    name: string;
    riskLevel: 'Safe' | 'Review Needed' | 'High Risk';
    features: string[];
    explanation: string;
  }>;
  summary: string;
  featureRecommendations: Record<string, string>;
  alternatives: Array<{ name: string; reason: string }>;
}

export function parseEnhancedAnalysis(jsonText: string): EnhancedAnalysisResult {
  let cleanJson = jsonText.replace(/```json\n?|```/g, '').trim();
  try {
    return JSON.parse(cleanJson) as EnhancedAnalysisResult;
  } catch (error) {
    console.error('Failed to parse enhanced analysis:', cleanJson);
    throw new Error('Invalid JSON from enhanced analysis');
  }
}
