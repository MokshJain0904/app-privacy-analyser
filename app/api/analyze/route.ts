import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import gplay from 'google-play-scraper';
import { getExpectedPermissions, SENSITIVE_PERMISSIONS } from '@/lib/permissions-db';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Risk Scoring Helpers (Updated to use 35% threshold logic)
function calculateRiskScore(permissions: any[], expectedPermissions: string[]) {
  let totalScore = 0;
  permissions.forEach(p => {
    // Check our hardcoded mapping first for consistency
    const basePermission = Object.keys(SENSITIVE_PERMISSIONS).find(sp =>
      p.name.toUpperCase().includes(sp) || sp.includes(p.name.toUpperCase())
    );

    const level = basePermission ? SENSITIVE_PERMISSIONS[basePermission] : p.riskLevel;

    const isExpected = expectedPermissions.some(ep =>
      p.name.toLowerCase().includes(ep.toLowerCase()) ||
      ep.toLowerCase().includes(p.name.toLowerCase())
    );

    if (level === "High Risk") {
      totalScore += isExpected ? 5 : 25;
    } else if (level === "Review Needed") {
      totalScore += isExpected ? 2 : 10;
    } else {
      totalScore += isExpected ? 0 : 2;
    }
  });
  return totalScore;
}

function normalizeScore(rawScore: number, totalPermissions: number) {
  if (totalPermissions === 0) return 0;
  const maxPossible = totalPermissions * 25;
  return Math.min(100, Math.round((rawScore / maxPossible) * 100));
}

export async function POST(request: Request) {
  const { appName, permissions, type, app1, app2, scrapedData } = await request.json();

  if (!process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json({ error: 'Google AI API Key is not configured.' }, { status: 500 });
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0,
      topP: 0.1,
      topK: 1,
    }
  });

  try {
    if (type === 'analyze') {
      const category = scrapedData?.genre || 'Unknown';
      const expectedPermissions = getExpectedPermissions(category);
      const isUnidentified = expectedPermissions.length === 0;

      const prompt = `
You are a senior cybersecurity expert. Analyze the app "${appName}" (Category: ${category}).

Requested Permissions:
${permissions.join(', ')}

Expected Permissions for ${category}:
${expectedPermissions.join(', ')}

Guidelines:
1. Explain why a permission might be dangerous (e.g. Contacts allows uploading lists to servers).
2. Note exceptions where dangerous permissions are SAFE (e.g. WhatsApp needs CAMERA for video calls, which is normal for its category).
3. Classify each permission: "Safe", "Review Needed", or "High Risk".
4. Suggest 3 safer alternatives for this specific task.
5. Provide a clear "Expert Recommendation".
6. Return your entire response in valid JSON format only, with no markdown formatting.

JSON Schema:
{
  "permissions": [
    { "name": "Permission Name", "riskLevel": "Safe/Review Needed/High Risk", "justification": "Why it's risky or safe", "potentialMisuse": "N/A or detail" }
  ],
  "summary": "Technical summary",
  "recommendation": "Final advice",
  "alternatives": [
    { "name": "App Name", "reason": "Why it's better" }
  ]
}
`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleanJson = text.replace(/```json\n?|```/g, '').trim();
      const analysis = JSON.parse(cleanJson);

      const rawScore = calculateRiskScore(analysis.permissions, expectedPermissions);
      const normalizedScore = normalizeScore(rawScore, analysis.permissions.length);

      let riskLabel = "Safe";
      if (normalizedScore > 60) {
        riskLabel = "Risky";
      } else if (normalizedScore > 25) {
        riskLabel = "Over-Permissive";
      }

      return NextResponse.json({
        ...analysis,
        overallRiskScore: normalizedScore,
        riskLabel,
        isUnidentified
      });

    } else if (type === 'compare') {
      const fetchAppData = async (name: string) => {
        const searchResults = await gplay.search({ term: name, num: 1, fullDetail: true });
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

      // Programmatic Scoring for Consistency
      const app1Expected = getExpectedPermissions(app1Data.genre);
      const app2Expected = getExpectedPermissions(app2Data.genre);

      const app1Raw = calculateRiskScore(app1Data.permissions.map(p => ({ name: p, riskLevel: 'Safe' })), app1Expected);
      const app2Raw = calculateRiskScore(app2Data.permissions.map(p => ({ name: p, riskLevel: 'Safe' })), app2Expected);

      const app1Score = normalizeScore(app1Raw, app1Data.permissions.length);
      const app2Score = normalizeScore(app2Raw, app2Data.permissions.length);
      const winnerName = app1Score <= app2Score ? app1Data.name : app2Data.name;

      const prompt = `
Compare Privacy: "${app1Data.name}" (Score: ${app1Score}) vs "${app2Data.name}" (Score: ${app2Score}).
The winner is ${winnerName} because it has a lower privacy risk score.

App 1 Perms: ${app1Data.permissions.join(', ')}
App 2 Perms: ${app2Data.permissions.join(', ')}

Return your entire response in valid JSON format only, with no markdown formatting.

JSON Schema:
{
  "comparisonSummary": "Brief overview of which app is safer",
  "verdictExplanation": "Detailed explanation of why ${winnerName} won based on the perms",
  "winner": "${winnerName}",
  "app1Score": ${app1Score},
  "app2Score": ${app2Score},
  "similarApps": ["app name 1", "app name 2"],
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

      const result = await model.generateContent(prompt);
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
