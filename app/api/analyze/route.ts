import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import gplay from 'google-play-scraper';
import { withRateLimit, RATE_LIMITS } from '@/middleware/rate-limit';
import { getExpectedPermissions, SENSITIVE_PERMISSIONS, findBasePermission } from '@/lib/permissions-db';
import { getDynamicExpectedPermissions } from '@/lib/csb-dynamic';
import { calculateRiskScore, normalizeScore, recalculateScoreFromRiskLevels, getRiskLabelFromScore, getStrictCategoryBasedRiskLevel } from '@/lib/scoring';
import { getFromAuditCache, saveToAuditCache } from '@/lib/cache-db';
import { semanticPermissionMatch } from '@/lib/semantic-match';
import { ErrorType, AppError, createErrorResponse, logError } from '@/lib/error-handler';


const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

const retryModels = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'];

async function generateWithRetry(prompt: string) {
  const maxAttempts = 3;
  const baseDelay = 1000;
  let lastError: any = null;

  for (const modelName of retryModels) {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0,
        topP: 0.1,
        topK: 1,
        responseMimeType: "application/json",
      }
    });

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await model.generateContent(prompt);
      } catch (error: any) {
        lastError = error;
        const message = String(error?.message || error?.response?.statusText || '');
        const status = error?.status || error?.statusCode || error?.response?.status;
        const isRateLimit = status === 429 || /429|Too Many Requests|Quota exceeded/i.test(message);
        const isRetryable = status === 503 || /503|Service Unavailable/i.test(message);

        // If it's a rate limit (quota exceeded), break immediately to try the NEXT model in the list
        if (isRateLimit) {
          break;
        }

        if (!isRetryable) {
          throw error;
        }

        if (attempt < maxAttempts) {
          const jitter = Math.floor(Math.random() * 300);
          const delay = baseDelay * Math.pow(2, attempt - 1) + jitter;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        break;
      }
    }
  }

  throw lastError || new Error('Unable to generate AI content after retries.');
}

// Removed calculateRiskScore and normalizeScore because they are now imported from @/lib/scoring.ts


async function handler(request: NextRequest) {
  const { appName, permissions, type, app1, app2, scrapedData } = await request.json();

  if (!process.env.GOOGLE_AI_API_KEY) {
    const error = new AppError(
      ErrorType.INTERNAL_ERROR,
      'Google AI API Key is not configured on the server.'
    );
    logError(error, { context: 'analyze_handler', appName });
    return createErrorResponse(error);
  }

  try {
    if (type === 'analyze') {
      // Check cache first for faster response and to avoid API limits
      const cachedResult = getFromAuditCache(appName, permissions);
      if (cachedResult) {
        // FIX: Recalculate overall risk score based on actual permission risk levels
        // This ensures if someone manually modifies permission risks in cache, the score updates
        if (cachedResult.permissions && Array.isArray(cachedResult.permissions)) {
          const recalculatedScore = recalculateScoreFromRiskLevels(cachedResult.permissions);
          cachedResult.overallRiskScore = recalculatedScore;
          cachedResult.riskLabel = getRiskLabelFromScore(recalculatedScore);
        }
        return NextResponse.json(cachedResult);
      }

      const category = scrapedData?.genre || 'Unknown';
      const dynamicExpected = getDynamicExpectedPermissions(category);
      const expectedPermissions = dynamicExpected.length > 0 ? dynamicExpected : getExpectedPermissions(category);
      const isUnidentified = expectedPermissions.length === 0;
      const strictExpectedPermissions = getExpectedPermissions(category); // For robust technical matching

      const EXCLUDED_PERMS = ['WAKE_LOCK', 'VIBRATE', 'RECEIVE_BOOT_COMPLETED', 'FOREGROUND_SERVICE', 'INTERNET', 'NETWORK_STATE', 'WIFI_STATE', 'BILLING', 'AD_ID', 'INSTALL_REFERRER'];
      const criticalPermissions = permissions.filter((p: string) => !EXCLUDED_PERMS.some(ep => p.toUpperCase().includes(ep)));

      // Cap at 15 to prevent explosive AI payload generation times
      const permsToAnalyze = criticalPermissions.slice(0, 15);
      const omittedPerms = permissions.filter((p: string) => !permsToAnalyze.includes(p));

      // Use the raw permissions from the request for 100% deterministic scoring BEFORE AI processing
      const rawScore = await calculateRiskScore(permissions, category);
      const normalizedScore = normalizeScore(rawScore, permissions.length);

      const prompt = `
You are a senior cybersecurity expert. Analyze the app "${appName}" (Category: ${category}).

Calculated Risk Score: ${normalizedScore}% (0% is perfectly safe, 100% is extremely risky).

Critical Permissions to Analyze:
${permsToAnalyze.join(', ')}

Expected Permissions for ${category}:
${expectedPermissions.join(', ')}

CRITICAL SCORING RULES (Category-Based):
- ANY permission NOT in the "Expected Permissions" list MUST be classified as "High Risk"
- Only permissions IN the expected list can be "Safe" or "Review Needed"
- Example: If MICROPHONE is not expected for this category, it MUST be "High Risk"
- Example: If LOCATION is not expected for this category, it MUST be "High Risk"

Guidelines:
1. First check if each permission is in the "Expected Permissions" list
2. If NOT in list → classify as "High Risk" (no exceptions)
3. If IN list → explain how the app legitimately uses it
4. Do NOT downgrade unexpected permissions to "Review Needed"
5. Focus on actual application usage, not potential misuse
6. Suggest 3 safer alternatives for High Risk permissions
7. The "summary" MUST state the Calculated Risk Score (${normalizedScore}%) and what it means
8. Return ONLY valid JSON with no markdown

JSON Schema:
{
  "permissions": [
    { "name": "Permission Name", "riskLevel": "Safe/Review Needed/High Risk" }
  ],
  "summary": "Brief summary",
  "alternatives": [
    { "name": "App Name", "reason": "Why it's better" }
  ]
}

CRITICAL: Every permission in "Critical Permissions" MUST be in your JSON "permissions" array.
`;

      let text = '';
      try {
        const result = await generateWithRetry(prompt);
        text = result.response.text();
      } catch (aiError) {
        console.warn("AI generation failed or rate limited. Using deterministic fallback to ensure uninterrupted service:", aiError);
        
        // Generate a 100% deterministic fallback using STRICT CATEGORY-BASED SCORING
        // Permission NOT in expected list → HIGH RISK (no exceptions)
        const fallbackPermissions = permsToAnalyze.map((p: string) => {
          const riskLevel = getStrictCategoryBasedRiskLevel(p, strictExpectedPermissions, SENSITIVE_PERMISSIONS);
          
          return {
            name: p,
            riskLevel
          };
        });

        const fallbackData = {
          permissions: fallbackPermissions,
          summary: `This app has a Calculated Risk Score of ${normalizedScore}%. We performed a deterministic static analysis because the AI engine was temporarily rate-limited.`,
          alternatives: [
            { name: "Search F-Droid", reason: "Open-source privacy-respecting alternatives are usually available on F-Droid." },
            { name: "Web Version", reason: "Using the website version of the app in a private browser often requires fewer permissions." }
          ]
        };
        text = JSON.stringify(fallbackData);
      }
      
      let cleanJson = text.replace(/```json\n?|```/g, '').trim();
      
      let analysis;
      try {
        analysis = JSON.parse(cleanJson);
      } catch (parseError) {
        console.error("Failed to parse AI JSON response:", cleanJson);
        throw new Error("AI generated an incomplete analysis response. Please try again.");
      }

      // STRICT CATEGORY-BASED SYNC: Apply category-aware risk classification
      // Rule: Unexpected permission → ALWAYS HIGH RISK (no downgrading)
      // Rule: Expected permission → Can be downgraded based on semantic relevance
      if (analysis.permissions && Array.isArray(analysis.permissions)) {
        for (let i = 0; i < analysis.permissions.length; i++) {
          const ap = analysis.permissions[i];
          const pName = typeof ap.name === 'string' ? ap.name.trim().toUpperCase() : '';
          
          // Try to map to a standardized strict key using robust parser
          let basePermission = findBasePermission(pName);

          // Check if this permission is expected for this category
          const isExpected = strictExpectedPermissions.includes(basePermission || pName);

          // If NOT expected → ALWAYS HIGH RISK (strict category-based rule)
          if (!isExpected) {
            ap.riskLevel = 'High Risk';
            analysis.permissions[i] = ap;
            continue;
          }

          // If expected, apply semantic matching to potentially downgrade
          let staticLevel = basePermission ? SENSITIVE_PERMISSIONS[basePermission] : ap.riskLevel;

          // Now fetch dynamic contextual relevance to potentially downgrade UI severity
          let match = { score: 0 };
          try {
            match = await semanticPermissionMatch(basePermission || pName, category);
          } catch (semanticError) {
            console.warn(`Semantic match failed for ${pName}:`, semanticError);
            // Default to 0 relevance if the local embedding model crashes
          }
          
          // For expected permissions, semantic match can help determine actual usage
          const relevance = match.score;

          // Downgrade rules ONLY for expected permissions
          if (staticLevel === 'High Risk') {
             if (relevance > 0.85) staticLevel = 'Safe';
             else if (relevance > 0.45) staticLevel = 'Review Needed';
          } else if (staticLevel === 'Review Needed') {
             if (relevance > 0.70) staticLevel = 'Safe';
          }

          ap.riskLevel = staticLevel;
          analysis.permissions[i] = ap;
        }
      }

      // Auto-append omitted "safe" permissions locally to save API tokens
      const autoSafePerms = omittedPerms.map((p: string) => ({
        name: p,
        riskLevel: 'Safe',
        justification: 'Standard system permission required for basic application execution.'
      }));

      analysis.permissions = [...(analysis.permissions || []), ...autoSafePerms];

      let riskLabel = "Safe";
      if (normalizedScore > 60) {
        riskLabel = "Risky";
      } else if (normalizedScore > 25) {
        riskLabel = "Over-Permissive";
      }

      const finalResult = {
        ...analysis,
        appName,
        category,
        overallRiskScore: normalizedScore,
        riskLabel,
        isUnidentified
      };

      // Save to cache simultaneously with permission signature
      saveToAuditCache(appName, permissions, finalResult);

      return NextResponse.json(finalResult);
    } else if (type === 'compare') {
      const fetchAppData = async (name: string) => {
        const searchResults = await gplay.search({ term: name, num: 1, country: 'in', fullDetail: true });
        if (!searchResults.length) return null;
        const app = searchResults[0];
        const perms = await gplay.permissions({ appId: app.appId });
        return {
          name: app.title,
          genre: app.genre,
          permissions: perms.map((p: any) => p.permission)
        };
      };

      const [app1Data, app2Data] = await Promise.all([
        fetchAppData(app1),
        fetchAppData(app2)
      ]);

      if (!app1Data || !app2Data) {
        const error = new AppError(
          ErrorType.NOT_FOUND,
          'One or both apps were not found. Please check the app names and try again.'
        );
        return createErrorResponse(error);
      }

      // Hybrid Oracle: Ask AI to classify only the unknown permissions to prevent blind spots
      const allPerms = Array.from(new Set([...app1Data.permissions, ...app2Data.permissions]));
      const unknownPerms = allPerms.filter((p: any) => !Object.keys(SENSITIVE_PERMISSIONS).some(sp => p.toUpperCase().includes(sp) || sp.includes(p.toUpperCase())));

      const aiClassifications: Record<string, string> = {};
      if (unknownPerms.length > 0) {
        const classPrompt = `Classify these Android permissions as either "Safe", "Review Needed", or "High Risk": ${unknownPerms.join(', ')}
Return ONLY a valid JSON object mapping exact permission name to Risk Level. Schema: { "permission_name": "Risk Level" }`;
        try {
          const classResult = await generateWithRetry(classPrompt);
          const cleanJson = classResult.response.text().replace(/```json\n?|```/g, '').trim();
          Object.assign(aiClassifications, JSON.parse(cleanJson));
        } catch (e) {
          console.error("AI classification failed:", e);
        }
      }

      const mapPerms = (perms: any[]) => perms.map((p: any) => ({
        name: p,
        riskLevel: aiClassifications[p] || 'Safe'
      }));

      // Programmatic Scoring for Consistency
      const app1Raw = await calculateRiskScore(mapPerms(app1Data.permissions), app1Data.genre);
      const app2Raw = await calculateRiskScore(mapPerms(app2Data.permissions), app2Data.genre);

      const app1Score = normalizeScore(app1Raw, app1Data.permissions.length);
      const app2Score = normalizeScore(app2Raw, app2Data.permissions.length);

      // AI-Driven Comparison: Consider security features, encryption, and privacy policies
      const prompt = `
You are a privacy and security expert. Compare these two messaging/communication apps based on ACTUAL SECURITY FEATURES, not just permission counts.

App 1: "${app1Data.name}"
- Permissions: ${app1Data.permissions.join(', ')}
- Category: ${app1Data.genre}

App 2: "${app2Data.name}"
- Permissions: ${app2Data.permissions.join(', ')}
- Category: ${app2Data.genre}

IMPORTANT CRITERIA FOR EVALUATION:
1. End-to-End Encryption (E2E): Is the app's communication truly E2E encrypted by default for all users?
2. Security Architecture: Does the app use open protocols (like Signal) or proprietary encryption?
3. Privacy Features: Does it have disappearing messages, no message retention, minimal metadata collection?
4. Permissions Risk: Are the requested permissions justified by the app's functionality?
5. Security Audits: Known security audits or third-party verification?
6. Data Minimization: Does the app collect minimal user data?
7. Metadata Leakage: Does the app leak metadata (who talks to whom, timing)?

Based on KNOWN FACTS about these apps:
- WhatsApp: Uses Signal Protocol for E2E encryption, has E2E encryption for all chats by default, collects metadata
- Telegram: Uses proprietary encryption (MTProto), E2E encryption (Secret Chats) is optional, does not claim to be E2E encrypted by default
- Signal: Uses Signal Protocol, E2E encryption by default for all chats, minimal data collection
- Other apps: Evaluate based on their known security practices

Determine the WINNER based on overall privacy and security (not just permission count).
Score each app 0-100 where 0 is worst privacy and 100 is best privacy.

Guidelines:
1. Be thorough and factual - consider known security features of each app
2. Do NOT just count permissions - evaluate the actual privacy implications
3. Provide clear reasoning for why one app is safer
4. Suggest 2-3 genuinely privacy-focused alternatives

Return ONLY valid JSON with no markdown:

{
  "comparisonSummary": "Concise overview of which app is safer and why",
  "verdictExplanation": "Detailed technical explanation of security features, encryption methods, and why one app wins",
  "winner": "App name that is more privacy-respecting",
  "app1Score": 65,
  "app2Score": 72,
  "app1Name": "${app1Data.name}",
  "app2Name": "${app2Data.name}",
  "securityAnalysis": {
    "app1": {
      "encryption": "Description of encryption (e.g., Signal Protocol, MTProto, etc.)",
      "e2eDefault": true,
      "metadataLeakage": "Low/Medium/High",
      "riskFactors": ["List of privacy concerns"]
    },
    "app2": {
      "encryption": "Description of encryption",
      "e2eDefault": true,
      "metadataLeakage": "Low/Medium/High",
      "riskFactors": ["List of privacy concerns"]
    }
  },
  "similarApps": ["App 1", "App 2"],
  "table": [
    { "id": "location", "app1": false, "app2": false },
    { "id": "camera", "app1": false, "app2": false },
    { "id": "microphone", "app1": true, "app2": true },
    { "id": "contacts", "app1": true, "app2": true },
    { "id": "storage", "app1": true, "app2": true },
    { "id": "phone", "app1": true, "app2": true },
    { "id": "sms", "app1": false, "app2": false },
    { "id": "calendar", "app1": false, "app2": false },
    { "id": "notifications", "app1": true, "app2": true },
    { "id": "bluetooth", "app1": false, "app2": false }
  ]
}
`;

      const result = await generateWithRetry(prompt);
      const text = result.response.text();
      let cleanJson = text.replace(/```json\n?|```/g, '').trim();
      
      let comparison;
      try {
        comparison = JSON.parse(cleanJson);
      } catch (e) {
        console.error("Failed to parse AI JSON response for compare:", cleanJson);
        throw new Error("AI generated an incomplete comparison response. Please try again.");
      }

      // Let AI decision stand - do NOT override with programmatic scoring
      // AI has better knowledge of actual security features and encryption methods

      return NextResponse.json(comparison);
    }
  } catch (error: any) {
    const appError = error instanceof AppError 
      ? error 
      : new AppError(
          error?.message?.includes('not found') ? ErrorType.NOT_FOUND : ErrorType.API_ERROR,
          error?.message || 'Failed to analyze app. Please try again.'
        );
    logError(appError, { context: 'analyze_handler', appName, type });
    return createErrorResponse(appError);
  }
}

// Apply rate limiting to expensive analyze operation
export const POST = withRateLimit(handler, RATE_LIMITS.EXPENSIVE);
