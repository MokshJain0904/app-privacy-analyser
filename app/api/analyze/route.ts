import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(request: Request) {
  const { appName, permissions, type, app1, app2, scrapedData } = await request.json();

  if (!process.env.GOOGLE_AI_API_KEY) {
    console.warn('GOOGLE_AI_API_KEY is missing from environment variables.');
    return NextResponse.json({ error: 'Google AI API Key is not configured. Please create a .env.local file with GOOGLE_AI_API_KEY=your_key' }, { status: 500 });
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  try {
    let prompt = '';

    if (type === 'analyze') {
      const appContext = scrapedData ? `
Context: This is a "${scrapedData.genre}" app with a rating of ${scrapedData.score?.toFixed(1) || 'N/A'}.
Description: ${scrapedData.summary || 'No description available.'}
` : '';

      prompt = `
You are a mobile security and privacy risk analyst.
${appContext}
Analyze the Android app "${appName}" which requests the following permissions:
${permissions.join(', ')}

Classify each permission into one of these categories:
- Safe
- Review Needed
- High Risk

For EACH permission provide:
- riskLevel (Safe / Review / High Risk)
- justification (clear reasoning why it belongs in that category)
- potentialMisuse (realistic misuse scenarios)
- severityScore (1-10, where 10 is extremely dangerous)
- contextRelevance (Is this permission typically required for this type of app? Yes/No/Unclear)

Then provide an overall assessment.

Return STRICT JSON in this format:

{
  "permissions": [
    {
      "name": "permission name",
      "riskLevel": "",
      "justification": "",
      "potentialMisuse": "",
      "severityScore": 0,
      "contextRelevance": ""
    }
  ],
  "riskDistribution": {
    "safeCount": 0,
    "reviewCount": 0,
    "highRiskCount": 0
  },
  "overallRiskScore": 0,
  "summary": "",
  "keyConcerns": ["Top 3 most concerning permissions"],
  "recommendation": "",
  "confidence": "Low/Medium/High"
}

Only return valid JSON. No explanations outside JSON.
`;
    } else if (type === 'compare') {
      prompt = `
You are a cybersecurity expert comparing two Android applications.

Compare "${app1}" and "${app2}" in terms of privacy and permission risks.

Analyze:
- Typical permissions requested
- Sensitive data exposure risk
- Over-permissioning patterns
- Potential misuse scenarios
- Overall privacy posture

Return STRICT JSON in this format:

{
  "app1RiskScore": 0,
  "app2RiskScore": 0,
  "winner": "",
  "reasoning": "",
  "detailedComparison": [
    {
      "category": "Sensitive Permissions",
      "app1": "",
      "app2": ""
    },
    {
      "category": "Data Exposure Risk",
      "app1": "",
      "app2": ""
    },
    {
      "category": "Context Justification",
      "app1": "",
      "app2": ""
    }
  ],
  "topConcerns": {
    "app1": ["list"],
    "app2": ["list"]
  },
  "finalVerdict": "",
  "confidence": "Low/Medium/High"
}

Only return valid JSON.
`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean the response text to ensure it's valid JSON
    // Remove markdown code blocks if present
    text = text.replace(/```json\n?|```/g, '').trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : text;

    return NextResponse.json(JSON.parse(jsonString));
  } catch (error: any) {
    console.error('AI Analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze privacy' }, { status: 500 });
  }
}
