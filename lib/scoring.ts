import * as fs from 'fs';
import * as path from 'path';
import { getExpectedPermissions, SENSITIVE_PERMISSIONS, findBasePermission } from '@/lib/permissions-db';

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
  
  // Asymptotic Decay Curve
  // Eliminates dilution bug where 50 safe permissions mask 1 high risk
  // k is tuned so ~1 High Risk Unexpected (25 points) shoots score to 60%.
  const k = 0.036; 
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

  // Count permissions by risk level
  const safeCount = permissions.filter(p => p.riskLevel === 'Safe').length;
  const reviewCount = permissions.filter(p => p.riskLevel === 'Review Needed').length;
  const highRiskCount = permissions.filter(p => p.riskLevel === 'High Risk').length;

  // Get current weights
  const weights = getWeights();

  // Calculate raw score assuming these are all unexpected permissions
  // (conservative approach - we don't know if they're expected or not from just risk levels)
  const rawScore =
    (safeCount * weights.safeUnexpected) +
    (reviewCount * weights.reviewNeededUnexpected) +
    (highRiskCount * weights.highRiskUnexpected);

  // Normalize and return
  const normalized = normalizeScore(rawScore, permissions.length);
  return normalized;
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
 * STRICT CATEGORY-BASED SCORING
 * If permission is NOT expected for this category → HIGH RISK
 * If permission IS expected → Check if sensitive (Review Needed) or safe (Safe)
 * 
 * Used for deterministic permission risk classification
 */
export function getStrictCategoryBasedRiskLevel(
  permission: string,
  expectedPermissionsForCategory: string[],
  allSensitivePermissions: Record<string, string>
): string {
  // First check: Is this permission expected for this category?
  const isExpected = expectedPermissionsForCategory.includes(permission);

  // If NOT expected → ALWAYS HIGH RISK
  if (!isExpected) {
    return 'High Risk';
  }

  // If expected, check if it's sensitive
  const riskLevel = allSensitivePermissions[permission];
  
  if (riskLevel === 'High Risk') {
    // Expected High Risk permission = Review Needed (user is aware they're granting it)
    return 'Review Needed';
  } else if (riskLevel === 'Review Needed') {
    // Expected Review permission = Safe in this context
    return 'Safe';
  } else {
    // Safe permissions are always Safe
    return 'Safe';
  }
}
