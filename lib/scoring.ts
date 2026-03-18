import * as fs from 'fs';
import * as path from 'path';
import { SENSITIVE_PERMISSIONS } from '@/lib/permissions-db';
import { semanticPermissionMatch } from '@/lib/semantic-match';

const CONFIG_PATH = path.join(process.cwd(), 'config', 'scoring-weights.json');

export interface ScoringWeights {
  highRiskExpected: number;
  highRiskUnexpected: number;
  reviewNeededExpected: number;
  reviewNeededUnexpected: number;
  safeExpected: number;
  safeUnexpected: number;
}

export function getWeights(): ScoringWeights {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return JSON.parse(data);
    } catch {
       // fallback below
    }
  }
  return {
    highRiskExpected: 5,
    highRiskUnexpected: 25,
    reviewNeededExpected: 2,
    reviewNeededUnexpected: 10,
    safeExpected: 0,
    safeUnexpected: 2
  };
}

export function updateWeights(newWeights: Partial<ScoringWeights>) {
  const current = getWeights();
  const updated = { ...current, ...newWeights };
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2));
}

// Extracted and modularized from API routes to support the batch scraper and configurable scoring
export async function calculateRiskScore(permissions: any[], category: string) {
  const weights = getWeights();
  let totalScore = 0;
  
  for (const p of permissions) {
    const permName = typeof p === 'string' ? p : (p.name || p.permission);
    if (!permName) continue;

    const basePermission = Object.keys(SENSITIVE_PERMISSIONS).find(sp =>
      permName.toUpperCase().includes(sp) || sp.includes(permName.toUpperCase())
    );

    const level = basePermission ? SENSITIVE_PERMISSIONS[basePermission] : (p.riskLevel || "Safe");

    const match = await semanticPermissionMatch(permName, category);
    const isExpected = match.isExpected;

    if (level === "High Risk") {
      totalScore += isExpected ? weights.highRiskExpected : weights.highRiskUnexpected;
    } else if (level === "Review Needed") {
      totalScore += isExpected ? weights.reviewNeededExpected : weights.reviewNeededUnexpected;
    } else {
      totalScore += isExpected ? weights.safeExpected : weights.safeUnexpected;
    }
  }
  return totalScore;
}

export function normalizeScore(rawScore: number, totalPermissions: number) {
  const weights = getWeights();
  if (totalPermissions === 0) return 0;
  const maxPossible = totalPermissions * weights.highRiskUnexpected;
  return Math.min(100, Math.round((rawScore / maxPossible) * 100));
}
