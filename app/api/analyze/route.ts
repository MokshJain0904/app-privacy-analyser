import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import gplay from 'google-play-scraper';
import { withRateLimit, RATE_LIMITS } from '@/middleware/rate-limit';
import { getExpectedPermissions, SENSITIVE_PERMISSIONS, findBasePermission } from '@/lib/permissions-db';
import { getDynamicExpectedPermissions } from '@/lib/csb-dynamic';
import { calculateRiskScore, normalizeScore } from '@/lib/scoring';
import { getFromAuditCache, saveToAuditCache } from '@/lib/cache-db';
import { semanticPermissionMatch } from '@/lib/semantic-match';


const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

const retryModels = ['gemini-2.5-flash', 'gemini-2.5-mini', 'gemini-1.5-pro'];

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
      }
    });

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await model.generateContent(prompt);
      } catch (error: any) {
        lastError = error;
        const message = String(error?.message || error?.response?.statusText || '');
        const status = error?.status || error?.statusCode || error?.response?.status;
        const isRetryable = status === 503 || /503|Service Unavailable/i.test(message);

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
    return NextResponse.json({ error: 'Google AI API Key is not configured.' }, { status: 500 });
  }

  try {
    if (type === 'analyze') {
      // Check cache first for faster response and to avoid API limits
      const cachedResult = getFromAuditCache(appName, permissions);
      if (cachedResult) {
        return NextResponse.json(cachedResult);
      }

      const category = scrapedData?.genre || 'Unknown';
      const dynamicExpected = getDynamicExpectedPermissions(category);
      const expectedPermissions = dynamicExpected.length > 0 ? dynamicExpected : getExpectedPermissions(category);
      const isUnidentified = expectedPermissions.length === 0;

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

Guidelines:
1. Explain exactly how the app uses this permission in its normal functionality. If it appears the app does not actively use it for its core functionality, simply write "Not actively used."
2. Do NOT write about potential misuse. Focus ONLY on actual application usage or non-usage.
3. Classify EVERY SINGLE permission provided in the 'Critical Permissions' list: "Safe", "Review Needed", or "High Risk".
4. Suggest 3 safer alternatives for this specific task.
5. Provide a clear "Expert Recommendation". Both the "summary" and "recommendation" MUST be exactly 2-3 short, simple lines written for non-technical users.
6. In your "summary", explicitly state the Calculated Risk Score (${normalizedScore}%) and briefly explain what that score means for this app's privacy.
7. Return your entire response in valid JSON format only, with no markdown formatting.
8. CRITICAL: Your JSON "permissions" array MUST contain an entry for EVERY permission listed in "Critical Permissions". Do not omit or skip any.

JSON Schema:
{
  "permissions": [
    { "name": "Permission Name", "riskLevel": "Safe/Review Needed/High Risk", "justification": "How it is used or 'Not actively used.'" }
  ],
  "summary": "Technical summary",
  "recommendation": "Final advice",
  "alternatives": [
    { "name": "App Name", "reason": "Why it's better" }
  ]
}
`;

      const result = await generateWithRetry(prompt);
      const text = result.response.text();
      const cleanJson = text.replace(/```json\n?|```/g, '').trim();
      const analysis = JSON.parse(cleanJson);

      // FOR RESEARCH INTEGRITY: Sync AI's risk levels dynamically based on contextual relevance
      if (analysis.permissions && Array.isArray(analysis.permissions)) {
        for (let i = 0; i < analysis.permissions.length; i++) {
          const ap = analysis.permissions[i];
          const pName = typeof ap.name === 'string' ? ap.name.trim().toUpperCase() : '';
          
          // Try to map to a standardized strict key using robust parser
          let basePermission = findBasePermission(pName);

          let staticLevel = basePermission ? SENSITIVE_PERMISSIONS[basePermission] : ap.riskLevel;

          // Now fetch dynamic contextual relevance to potentially downgrade UI severity
          const match = await semanticPermissionMatch(basePermission || pName, category);
          const relevance = match.score;

          // Downgrade rules based on contextual necessity
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
        return NextResponse.json({ error: 'One or both apps not found' }, { status: 404 });
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

      let winnerName = app1Data.name;
      if (app1Raw > app2Raw) {
        winnerName = app2Data.name;
      } else if (app1Raw === app2Raw) {
        if (app1Data.permissions.length > app2Data.permissions.length) {
          winnerName = app2Data.name;
        }
      }
      const prompt = `
Compare Privacy: "${app1Data.name}" vs "${app2Data.name}".
The winner is ${winnerName} because it has a lower privacy risk.

App 1 Perms: ${app1Data.permissions.join(', ')}
App 2 Perms: ${app2Data.permissions.join(', ')}

Guidelines:
1. Do NOT mention any numeric scores in the verdictExplanation or comparisonSummary.
2. For similarApps, suggest 2-3 genuine, highly reputable similar alternatives from the Google Play Store that prioritize privacy.

Return your entire response in valid JSON format only, with no markdown formatting.

JSON Schema:
{
  "comparisonSummary": "Brief overview of which app is safer (without numeric scores)",
  "verdictExplanation": "Detailed explanation of why ${winnerName} won based on the perms (without numeric scores)",
  "winner": "${winnerName}",
  "app1Score": ${app1Score},
  "app2Score": ${app2Score},
  "similarApps": ["genuine privacy app 1", "genuine privacy app 2"],
  "table": [
    { "id": "location", "app1": true, "app2": false },
    { "id": "camera", "app1": true, "app2": false },
    { "id": "microphone", "app1": true, "app2": false },
    { "id": "contacts", "app1": true, "app2": false },
    { "id": "storage", "app1": true, "app2": false },
    { "id": "phone", "app1": true, "app2": false },
    { "id": "sms", "app1": true, "app2": false },
    { "id": "calendar", "app1": true, "app2": false },
    { "id": "notifications", "app1": true, "app2": false },
    { "id": "bluetooth", "app1": true, "app2": false }
  ]
}
`;

      const result = await generateWithRetry(prompt);
      const text = result.response.text();
      const cleanJson = text.replace(/```json\n?|```/g, '').trim();
      const comparison = JSON.parse(cleanJson);

      // Force programmatic winner and scores to prevent AI hallucination
      comparison.winner = winnerName;
      comparison.app1Score = app1Score;
      comparison.app2Score = app2Score;

      return NextResponse.json(comparison);
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Apply rate limiting to expensive analyze operation
export const POST = withRateLimit(handler, RATE_LIMITS.EXPENSIVE);
