import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import gplay from 'google-play-scraper';
import { getExpectedPermissions } from '@/lib/permissions-db';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Risk Scoring Helpers (Updated to use 35% threshold logic)
function calculateRiskScore(permissions: any[], expectedPermissions: string[]) {
  let totalScore = 0;
  permissions.forEach(p => {
    const isExpected = expectedPermissions.some(ep =>
      p.name.toLowerCase().includes(ep.toLowerCase()) ||
      ep.toLowerCase().includes(p.name.toLowerCase())
    );

    const level = p.riskLevel;
    if (level === "High Risk") {
      totalScore += isExpected ? 10 : 25; // More severe if unexpected
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

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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

      return NextResponse.json({
        ...analysis,
        overallRiskScore: normalizedScore,
        riskLabel: normalizedScore > 35 ? "Over-Permissive" : "Safe",
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

      const prompt = `
Compare Privacy: "${app1Data.name}" vs "${app2Data.name}".

App 1 Perms: ${app1Data.permissions.join(', ')}
App 2 Perms: ${app2Data.permissions.join(', ')}

Return your entire response in valid JSON format only, with no markdown formatting.

JSON Schema:
{
  "comparisonSummary": "Brief overview of which app is safer",
  "verdictExplanation": "Detailed explanation of the winner",
  "winner": "Exact name of winning app",
  "app1Score": 0-100,
  "app2Score": 0-100,
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

      return NextResponse.json(comparison);
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
