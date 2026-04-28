/**
 * App Comparison Analytics & Metrics
 * Provides detailed comparison data between two apps
 */

export interface PermissionInfo {
  name: string;
  riskLevel: 'Safe' | 'Review Needed' | 'High Risk';
}

export interface ComparisonMetrics {
  highRiskCount: number;
  reviewNeededCount: number;
  safeCount: number;
  totalPermissions: number;
  riskScore: number;
}

export interface PermissionDifference {
  permissionName: string;
  app1Status: 'High Risk' | 'Review Needed' | 'Safe' | 'Not Required';
  app2Status: 'High Risk' | 'Review Needed' | 'Safe' | 'Not Required';
  importance: 'Critical' | 'High' | 'Medium' | 'Low';
  explanation: string;
  favoredApp: 'app1' | 'app2' | 'same';
}

export interface DetailedComparison {
  winner: string;
  reason: string;
  app1: {
    name: string;
    score: number;
    label: string;
    metrics: ComparisonMetrics;
    permissions: PermissionInfo[];
  };
  app2: {
    name: string;
    score: number;
    label: string;
    metrics: ComparisonMetrics;
    permissions: PermissionInfo[];
  };
  differences: PermissionDifference[];
  keyDifferences: PermissionDifference[];
  verdict: string;
  recommendation: string;
}

/**
 * Calculate metrics for a set of permissions
 */
export function calculatePermissionMetrics(permissions: PermissionInfo[]): ComparisonMetrics {
  const metrics = {
    highRiskCount: 0,
    reviewNeededCount: 0,
    safeCount: 0,
    totalPermissions: permissions.length,
    riskScore: 0 // Will be provided separately
  };

  for (const perm of permissions) {
    switch (perm.riskLevel) {
      case 'High Risk':
        metrics.highRiskCount++;
        break;
      case 'Review Needed':
        metrics.reviewNeededCount++;
        break;
      case 'Safe':
        metrics.safeCount++;
        break;
    }
  }

  return metrics;
}

/**
 * Get risk level for a permission
 */
function getPermissionRiskLevel(perm: PermissionInfo | undefined): 'High Risk' | 'Review Needed' | 'Safe' | 'Not Required' {
  if (!perm) return 'Not Required';
  return perm.riskLevel;
}

/**
 * Determine importance of a permission difference
 */
function getImportance(app1Risk: string, app2Risk: string): 'Critical' | 'High' | 'Medium' | 'Low' {
  // Critical: High Risk vs Safe or Not Required
  if ((app1Risk === 'High Risk' && (app2Risk === 'Safe' || app2Risk === 'Not Required')) ||
      (app2Risk === 'High Risk' && (app1Risk === 'Safe' || app1Risk === 'Not Required'))) {
    return 'Critical';
  }

  // High: High Risk vs Review Needed, or Review vs Safe
  if ((app1Risk === 'High Risk' && app2Risk === 'Review Needed') ||
      (app2Risk === 'High Risk' && app1Risk === 'Review Needed') ||
      (app1Risk === 'Review Needed' && app2Risk === 'Safe') ||
      (app2Risk === 'Review Needed' && app1Risk === 'Safe')) {
    return 'High';
  }

  // Medium: One has permission, other doesn't (both same risk)
  if ((app1Risk !== 'Not Required' && app2Risk === 'Not Required') ||
      (app2Risk !== 'Not Required' && app1Risk === 'Not Required')) {
    return 'Medium';
  }

  return 'Low';
}

/**
 * Determine which app is favored for a permission
 */
function determineFavoredApp(app1Risk: string, app2Risk: string): 'app1' | 'app2' | 'same' {
  const riskOrder = { 'Safe': 0, 'Review Needed': 1, 'High Risk': 2, 'Not Required': -1 };
  const app1Score = riskOrder[app1Risk as keyof typeof riskOrder] || 999;
  const app2Score = riskOrder[app2Risk as keyof typeof riskOrder] || 999;

  if (app1Score < app2Score) return 'app1';
  if (app2Score < app1Score) return 'app2';
  return 'same';
}

/**
 * Generate explanation for a permission difference
 */
function generateDifferenceExplanation(
  permName: string,
  app1Risk: string,
  app2Risk: string,
  favored: 'app1' | 'app2' | 'same'
): string {
  if (favored === 'same') {
    return `Both apps handle ${permName} with the same risk level.`;
  }

  const favoredName = favored === 'app1' ? 'first app' : 'second app';
  const riskDiff = `${app1Risk} vs ${app2Risk}`;

  if (app1Risk === 'Not Required' || app2Risk === 'Not Required') {
    const hasApp = app1Risk === 'Not Required' ? 'second app' : 'first app';
    const doesntApp = app1Risk === 'Not Required' ? 'first app' : 'second app';
    return `The ${doesntApp} doesn't request ${permName}, while the ${hasApp} requests it (${app1Risk === 'Not Required' ? app2Risk : app1Risk}).`;
  }

  return `${permName} is classified as ${app1Risk} in first app vs ${app2Risk} in second app. The ${favoredName} is more privacy-friendly.`;
}

/**
 * Calculate permission differences between two apps
 */
export function calculatePermissionDifferences(
  app1Perms: PermissionInfo[],
  app2Perms: PermissionInfo[],
  app1Name: string,
  app2Name: string
): PermissionDifference[] {
  const allPermNames = new Set([
    ...app1Perms.map(p => p.name),
    ...app2Perms.map(p => p.name)
  ]);

  const differences: PermissionDifference[] = [];

  for (const permName of allPermNames) {
    const app1Perm = app1Perms.find(p => p.name === permName);
    const app2Perm = app2Perms.find(p => p.name === permName);

    const app1Risk = getPermissionRiskLevel(app1Perm);
    const app2Risk = getPermissionRiskLevel(app2Perm);

    // Skip if both are the same and neither is high risk
    if (app1Risk === app2Risk && app1Risk !== 'High Risk') {
      continue;
    }

    const importance = getImportance(app1Risk, app2Risk);
    const favored = determineFavoredApp(app1Risk, app2Risk);
    const explanation = generateDifferenceExplanation(permName, app1Risk, app2Risk, favored);

    differences.push({
      permissionName: permName,
      app1Status: app1Risk,
      app2Status: app2Risk,
      importance,
      explanation,
      favoredApp: favored
    });
  }

  // Sort by importance
  differences.sort((a, b) => {
    const importanceOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return importanceOrder[a.importance] - importanceOrder[b.importance];
  });

  return differences;
}

/**
 * Get key differences (Critical + High importance)
 */
export function getKeyDifferences(differences: PermissionDifference[]): PermissionDifference[] {
  return differences.filter(d => d.importance === 'Critical' || d.importance === 'High').slice(0, 5);
}

/**
 * Generate detailed comparison verdict
 */
export function generateComparisonVerdict(
  winnerName: string,
  app1Score: number,
  app2Score: number,
  app1Metrics: ComparisonMetrics,
  app2Metrics: ComparisonMetrics,
  keyDifferences: PermissionDifference[]
): { verdict: string; recommendation: string } {
  const scoreDiff = Math.abs(app1Score - app2Score);
  const isClose = scoreDiff < 10;

  // Count critical differences
  const criticalDiffs = keyDifferences.filter(d => d.importance === 'Critical');

  let verdict = '';
  let recommendation = '';

  if (scoreDiff > 30) {
    // Large difference
    const better = app1Score < app2Score ? 'The first app' : 'The second app';
    verdict = `${better} is significantly more privacy-friendly with a ${scoreDiff}% lower risk score.`;
  } else if (isClose) {
    // Close call
    verdict = `Both apps have similar privacy profiles, but ${winnerName} has a slightly lower risk score.`;
  } else {
    // Moderate difference
    verdict = `${winnerName} is notably more privacy-respecting than the alternative.`;
  }

  // Generate recommendation
  if (criticalDiffs.length > 0) {
    const issues = criticalDiffs.map(d => `${d.permissionName} (${d.app2Status})`).join(', ');
    recommendation = `The winner avoids requesting high-risk permissions like: ${issues}. This is a significant privacy advantage.`;
  } else if (app1Metrics.highRiskCount === 0 && app2Metrics.highRiskCount > 0) {
    recommendation = `The winner requests no high-risk permissions, while the alternative requests ${app2Metrics.highRiskCount}. Choose the winner for better privacy.`;
  } else {
    const fewer = app1Metrics.totalPermissions < app2Metrics.totalPermissions 
      ? 'The winner requests fewer total permissions' 
      : 'Both apps request similar numbers of permissions';
    recommendation = `${fewer}. For the best privacy experience, grant only necessary permissions when you install the chosen app.`;
  }

  return { verdict, recommendation };
}

/**
 * Generate comprehensive comparison data
 */
export async function generateDetailedComparison(
  app1Name: string,
  app1Perms: PermissionInfo[],
  app1Score: number,
  app2Name: string,
  app2Perms: PermissionInfo[],
  app2Score: number,
  winner: string
): Promise<DetailedComparison> {
  const app1Metrics = calculatePermissionMetrics(app1Perms);
  const app2Metrics = calculatePermissionMetrics(app2Perms);

  app1Metrics.riskScore = app1Score;
  app2Metrics.riskScore = app2Score;

  const differences = calculatePermissionDifferences(app1Perms, app2Perms, app1Name, app2Name);
  const keyDifferences = getKeyDifferences(differences);

  const app1Label = app1Score <= 25 ? 'Safe' : app1Score <= 60 ? 'Over-Permissive' : 'Risky';
  const app2Label = app2Score <= 25 ? 'Safe' : app2Score <= 60 ? 'Over-Permissive' : 'Risky';

  const reason = app1Score < app2Score 
    ? `${app1Name} has a lower risk score (${app1Score}% vs ${app2Score}%)`
    : `${app2Name} has a lower risk score (${app2Score}% vs ${app1Score}%)`;

  const { verdict, recommendation } = generateComparisonVerdict(
    winner,
    app1Score,
    app2Score,
    app1Metrics,
    app2Metrics,
    keyDifferences
  );

  return {
    winner,
    reason,
    app1: {
      name: app1Name,
      score: app1Score,
      label: app1Label,
      metrics: app1Metrics,
      permissions: app1Perms
    },
    app2: {
      name: app2Name,
      score: app2Score,
      label: app2Label,
      metrics: app2Metrics,
      permissions: app2Perms
    },
    differences,
    keyDifferences,
    verdict,
    recommendation
  };
}
