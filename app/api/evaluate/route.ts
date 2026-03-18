import { NextResponse } from 'next/server';
import { getEvalLabels, saveEvalLabel, computeMetrics, EvalLabel } from '@/lib/metrics';

export async function GET() {
  try {
    const metrics = computeMetrics();
    const labels = getEvalLabels();
    return NextResponse.json({ metrics, labels });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appId, appName, category, systemScore, systemRiskLabel, manualLabel } = body;

    if (!appId || !manualLabel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newLabel: EvalLabel = {
      appId,
      appName: appName || "Unknown",
      category: category || "Unknown",
      systemScore: systemScore || 0,
      systemRiskLabel: systemRiskLabel || "Safe",
      manualLabel,
      timestamp: new Date().toISOString()
    };

    saveEvalLabel(newLabel);
    
    // Recompute and return updated metrics
    const metrics = computeMetrics();

    return NextResponse.json({ success: true, metrics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
