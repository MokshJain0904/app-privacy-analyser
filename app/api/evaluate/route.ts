import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, RATE_LIMITS } from '@/middleware/rate-limit';
import { getEvalLabels, saveEvalLabel, computeMetrics, EvalLabel } from '@/lib/metrics';


// Handler for GET requests - fetch evaluation metrics
async function getHandler() {
  try {
    const metrics = computeMetrics();
    const labels = getEvalLabels();
    return NextResponse.json({ metrics, labels });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Handler for POST requests - save evaluation labels
async function postHandler(request: NextRequest) {
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

// Apply rate limiting
export const GET = withRateLimit(getHandler as any, RATE_LIMITS.API);
export const POST = withRateLimit(postHandler, RATE_LIMITS.API);
