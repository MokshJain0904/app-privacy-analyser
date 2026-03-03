import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(request: Request) {
  const { appName, permissions, type, app1, app2 } = await request.json();

  if (!process.env.GOOGLE_AI_API_KEY) {
    console.warn('GOOGLE_AI_API_KEY is missing from environment variables.');
    return NextResponse.json({ error: 'Google AI API Key is not configured. Please create a .env.local file with GOOGLE_AI_API_KEY=your_key' }, { status: 500 });
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  try {
    let prompt = '';

    if (type === 'analyze') {
      prompt = `
        Analyze the privacy risks for the app "${appName}" which requests the following permissions: ${permissions.join(', ')}.
        Provide a JSON response with the following structure:
        {
          "safe": ["list of permissions that are standard and low risk"],
          "review": ["list of permissions that might be unnecessary or invasive"],
          "highRisk": ["list of permissions that lead to privacy leakage"],
          "summary": "A brief overall privacy assessment",
          "recommendation": "Actionable advice for the user"
        }
        Only return the JSON.
      `;
    } else if (type === 'compare') {
      prompt = `
        Compare the privacy and safety of two apps: "${app1}" and "${app2}".
        Analyze their typical permission requests and data handling practices.
        Provide a JSON response with the following structure:
        {
          "winner": "The name of the safer app",
          "reasoning": "Detailed explanation of why it is safer",
          "comparison": [
            {"feature": "Data Collection", "app1": "description", "app2": "description"},
            {"feature": "Permissions", "app1": "description", "app2": "description"}
          ],
          "finalVerdict": "A concluding safety recommendation"
        }
        Only return the JSON.
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
