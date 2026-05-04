import * as fs from 'fs';
import * as path from 'path';
import { getExpectedPermissions, SENSITIVE_PERMISSIONS, findBasePermission, getCategoryRiskLevel, normalizeCategory } from '@/lib/permissions-db';

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

export async function calculateRiskScore(permissions: any[], category: string) {
  const weights = getWeights();
  const expectedPermissions = getExpectedPermissions(category).map((perm) => perm.toUpperCase());
  const expectedSet = new Set(expectedPermissions);
  let totalScore = 0;

  for (const p of permissions) {
    const permString = typeof p === 'string' ? p : (p.name || p.permission);
    if (!permString) continue;

    const permTokens = permString.split('.');
    const permNameExact = permTokens[permTokens.length - 1].toUpperCase();
    const basePermission = findBasePermission(permNameExact);
    const riskLevel = basePermission ? SENSITIVE_PERMISSIONS[basePermission] : 'Safe';
    const permissionKey = basePermission || permNameExact;
    const isExpected = expectedSet.has(permissionKey);

    if (riskLevel === 'High Risk') {
      totalScore += isExpected ? weights.highRiskExpected : weights.highRiskUnexpected;
    } else if (riskLevel === 'Review Needed') {
      totalScore += isExpected ? weights.reviewNeededExpected : weights.reviewNeededUnexpected;
    } else {
      totalScore += isExpected ? weights.safeExpected : weights.safeUnexpected;
    }
  }

  return totalScore;
}

export function normalizeScore(rawScore: number, totalPermissions: number) {
  if (rawScore === 0) return 0;
  
  // Asymptotic Decay Curve, tuned so a typical risky-but-not-extreme app
  // (e.g. 1 High Risk unexpected + 3 Review Needed) lands in the 35-55% range.
  // k=0.022: 20 raw pts → ~36%, 29 pts → ~47%, 50 pts → ~67%, 80 pts → ~83%
  const k = 0.022;
  const normalized = 100 * (1 - Math.exp(-k * rawScore));
  
  return Math.min(100, Math.round(normalized));
}

/**
 * Recalculate risk score from permission risk levels
 * Used when permissions are modified in cache to ensure score stays in sync
 * Works backwards from risk level classifications to numerical score
 */
export function recalculateScoreFromRiskLevels(
  permissions: Array<{ name: string; riskLevel: string }>
): number {
  if (!permissions || permissions.length === 0) return 0;

  const weights = getWeights();

  // After our 2-phase classification:
  //   Safe         = permission is legitimate and expected  → 0 pts
  //   Review Needed = permission is used but carries risk   → reviewNeededExpected pts
  //   High Risk     = permission is genuinely unexpected    → highRiskUnexpected pts
  const rawScore = permissions.reduce((sum, p) => {
    if (p.riskLevel === 'High Risk')    return sum + weights.highRiskUnexpected;
    if (p.riskLevel === 'Review Needed') return sum + weights.reviewNeededExpected;
    return sum; // Safe → 0
  }, 0);

  return normalizeScore(rawScore, permissions.length);
}

/**
 * Categorize risk level from score
 */
export function getRiskLabelFromScore(score: number): string {
  if (score <= 25) return 'Safe';
  if (score <= 60) return 'Over-Permissive';
  return 'Risky';
}

/**
 * STRICT CATEGORY-BASED SCORING (3-tier)
 * Uses the safePermissions / reviewPermissions tiers from PERMISSIONS_DB.
 * Falls back to High Risk for anything not listed.
 */
export function getStrictCategoryBasedRiskLevel(
  permission: string,
  _expectedPermissionsForCategory: string[], // kept for API compat, unused
  _allSensitivePermissions: Record<string, string>, // kept for API compat, unused
  category: string = '' // new: pass the actual category string
): string {
  const mapped = findBasePermission(permission) || permission.toUpperCase();
  return getCategoryRiskLevel(mapped, category);
}
