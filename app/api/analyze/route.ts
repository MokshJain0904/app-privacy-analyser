import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

import gplay from 'google-play-scraper';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Risk Scoring Helpers
function calculateRiskScore(permissions: any[]) {
  let totalScore = 0;
  permissions.forEach(p => {
    const level = p.riskLevel || p.level; // Handle both schemas
    if (level === "Safe") totalScore += 1;
    else if (level === "Review Needed") totalScore += 5;
    else if (level === "High Risk") totalScore += 15;
  });
  return totalScore;
}

function normalizeScore(rawScore: number, totalPermissions: number) {
  if (totalPermissions === 0) return 0;
  const maxPossible = totalPermissions * 15; // worst case
  return Math.round((rawScore / maxPossible) * 100);
}

function getRiskLabel(score: number) {
  if (score <= 20) return "Very Low";
  if (score <= 40) return "Low";
  if (score <= 60) return "Moderate";
  if (score <= 80) return "High";
  return "Critical";
}

function decideWinner(app1Score: number, app2Score: number, app1Name: string, app2Name: string) {
  if (app1Score < app2Score) return app1Name;
  if (app2Score < app1Score) return app2Name;
  return "Tie";
}

export async function POST(request: Request) {
  const { appName, permissions, type, app1, app2, scrapedData } = await request.json();

  if (!process.env.GOOGLE_AI_API_KEY) {
    console.warn('GOOGLE_AI_API_KEY is missing from environment variables.');
    return NextResponse.json({ error: 'Google AI API Key is not configured.' }, { status: 500 });
  }

  const model15 = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const model20 = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); // Use 2.0-flash as it's better for reasoning if available, or stay consistent

  try {
    if (type === 'analyze') {
      const appContext = scrapedData ? `
Context: This is a "${scrapedData.genre}" app with a rating of ${scrapedData.score?.toFixed(1) || 'N/A'}.
Description: ${scrapedData.summary || 'No description available.'}
` : '';

      const prompt = `
You are a cybersecurity and mobile privacy risk analyst.

Analyze the Android app "${appName}" based ONLY on the permissions provided below.
${appContext}

Permissions:
${permissions.join(', ')}

Instructions:

1. Classify EACH permission strictly into one of:
   - Safe
   - Review Needed
   - High Risk

2. Do NOT invent new permissions.
3. If unsure, classify conservatively as "Review Needed".
4. Do NOT use brand reputation or assumptions.
5. Only analyze the permissions given.

For each permission return:
- name
- riskLevel (Safe / Review Needed / High Risk)
- justification (clear technical reasoning)
- potentialMisuse (realistic misuse scenario)
- severityScore (1-10 based on privacy impact)

Return STRICT JSON in this format:

{
  "permissions": [
    {
      "name": "",
      "riskLevel": "",
      "justification": "",
      "potentialMisuse": "",
      "severityScore": 0
    }
  ],
  "summary": "",
  "keyConcerns": ["Top 3 most concerning permissions"],
  "confidence": "High"
}

The summary must:
- Clearly state overall risk posture
- Mention most sensitive permissions
- Be 4-6 sentences
- Be written like a professional security audit report

Only return valid JSON.
`;

      const result = await model20.generateContent(prompt);
      const response = await result.response;
      let text = response.text().replace(/```json\n?|```/g, '').trim();
      const analysis = JSON.parse(text);

      // Perform deterministic scoring
      const rawScore = calculateRiskScore(analysis.permissions);
      const normalizedScore = normalizeScore(rawScore, analysis.permissions.length);

      return NextResponse.json({
        ...analysis,
        overallRiskScore: normalizedScore,
        riskLabel: getRiskLabel(normalizedScore),
        riskDistribution: {
          safeCount: analysis.permissions.filter((p: any) => p.riskLevel === "Safe").length,
          reviewCount: analysis.permissions.filter((p: any) => p.riskLevel === "Review Needed").length,
          highRiskCount: analysis.permissions.filter((p: any) => p.riskLevel === "High Risk").length
        }
      });
    } else if (type === 'compare') {
      // Step 1: Fetch permissions for both apps if not provided
      const fetchPermissions = async (name: string) => {
        const searchResults = await gplay.search({ term: name, num: 1, fullDetail: true });
        if (!searchResults.length) return { name, permissions: [], context: '' };
        const app = searchResults[0];
        const perms = await gplay.permissions({ appId: app.appId });
        return {
          name: app.title,
          permissions: perms.map((p: any) => p.permission),
          context: `This is a "${app.genre}" app with a rating of ${app.score?.toFixed(1) || 'N/A'}. Description: ${app.summary}`
        };
      };

      const [app1Data, app2Data] = await Promise.all([
        fetchPermissions(app1),
        fetchPermissions(app2)
      ]);

      // Step 2: Run individual AI analyses
      const getAnalysis = async (data: any) => {
        const prompt = `Classify these permissions for a professional audit of "${data.name}": ${data.permissions.join(', ')}. Context: ${data.context}. Return JSON: { "permissions": [{ "name": "", "riskLevel": "Safe/Review Needed/High Risk" }] }`;
        const result = await model15.generateContent(prompt);
        return JSON.parse(result.response.text().replace(/```json\n?|```/g, '').trim());
      };

      const [app1Analysis, app2Analysis] = await Promise.all([
        getAnalysis(app1Data),
        getAnalysis(app2Data)
      ]);

      // Step 3: Run comparison prompt
      const comparePrompt = `
You are a cybersecurity expert.

Compare two Android applications strictly based on the classified permission data below.

App 1: "${app1Data.name}"
Permissions Analysis:
${JSON.stringify(app1Analysis)}

App 2: "${app2Data.name}"
Permissions Analysis:
${JSON.stringify(app2Analysis)}

Instructions:

1. Do NOT reclassify permissions.
2. Do NOT change risk levels.
3. Do NOT calculate scores.
4. Do NOT decide winner.
5. Only explain differences based on given analysis.

Return STRICT JSON in this format:

{
  "comparisonSummary": "",
  "riskProfileComparison": {
    "app1": "",
    "app2": ""
  },
  "topConcerns": {
    "app1": ["list"],
    "app2": ["list"]
  },
  "verdictExplanation": "",
  "confidence": "High"
}

The comparisonSummary must:
- Compare risk posture clearly
- Highlight high-risk differences
- Be analytical and objective

Only return valid JSON.
`;

      const compareResult = await model20.generateContent(comparePrompt);
      const comparison = JSON.parse(compareResult.response.text().replace(/```json\n?|```/g, '').trim());

      // Step 4: Deterministic Scores & Winner
      const app1ScoreRaw = calculateRiskScore(app1Analysis.permissions);
      const app2ScoreRaw = calculateRiskScore(app2Analysis.permissions);

      const app1Score = normalizeScore(app1ScoreRaw, app1Analysis.permissions.length);
      const app2Score = normalizeScore(app2ScoreRaw, app2Analysis.permissions.length);

      return NextResponse.json({
        ...comparison,
        app1Score,
        app2Score,
        winner: decideWinner(app1Score, app2Score, app1Data.name, app2Data.name),
        app1Label: getRiskLabel(app1Score),
        app2Label: getRiskLabel(app2Score)
      });
    }
  } catch (error: any) {
    console.error('AI Analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze privacy. ' + error.message }, { status: 500 });
  }
}
