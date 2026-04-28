/**
 * Permission Usage Tracking & Leakage Detection
 *
 * All category names use CanonicalCategory from permissions-db.ts.
 * Scoring uses an asymptotic decay curve to prevent dilution.
 * Double-scoring is prevented via a Set of already-scored permissions.
 */

import { normalizeCategory, CanonicalCategory } from './permissions-db';

export interface PermissionUsageAnalysis {
  permission: string;
  userFriendlyName: string;
  isDeclared: boolean;
  typicalUsage: boolean;
  leakageRisk: 'NORMAL' | 'SUSPICIOUS' | 'CRITICAL';
  recommendation: string;
}

export interface UsageComparisonResult {
  appName: string;
  appCategory: string;
  declaredPermissions: string[];
  suspiciousPermissions: PermissionUsageAnalysis[];
  unusedDeclaredPermissions: PermissionUsageAnalysis[];
  leakageScore: number; // 0-100
  overallAssessment: string;
}

// ============================================================
// CATEGORY PERMISSION PATTERNS
// Keys MUST be CanonicalCategory names from permissions-db.ts.
// true  = typically expected for this category
// false = suspicious / unexpected for this category
// Missing key = no opinion (neutral)
// ============================================================
const CATEGORY_PERMISSION_PATTERNS: Partial<Record<CanonicalCategory, Record<string, boolean>>> = {
  'Social Media': {
    'CAMERA': true,
    'RECORD_AUDIO': true,
    'READ_EXTERNAL_STORAGE': true,
    'ACCESS_FINE_LOCATION': false,    // Not core to social functionality
    'ACCESS_COARSE_LOCATION': false,
    'READ_CONTACTS': false,           // Building social graphs without disclosure
    'READ_CALL_LOG': false,           // CRITICAL
    'READ_PHONE_STATE': false,
    'READ_SMS': false,                // CRITICAL
    'READ_CALENDAR': false,
  },
  'Maps & Navigation': {
    'ACCESS_FINE_LOCATION': true,
    'ACCESS_COARSE_LOCATION': true,
    'CAMERA': false,
    'RECORD_AUDIO': false,
    'READ_CONTACTS': false,
    'READ_SMS': false,
    'READ_CALL_LOG': false,
  },
  'Finance': {
    'INTERNET': true,
    'READ_PHONE_STATE': true,         // Legitimate fraud-detection use
    'CAMERA': false,                  // Suspicious: only justified for QR/check deposit
    'ACCESS_FINE_LOCATION': false,
    'RECORD_AUDIO': false,            // Should NEVER be requested
    'READ_CONTACTS': false,
    'READ_SMS': false,
    'READ_CALL_LOG': false,
  },
  'Health & Fitness': {
    'BODY_SENSORS': true,
    'ACCESS_FINE_LOCATION': true,
    'CAMERA': false,
    'READ_CALENDAR': true,
    'READ_CONTACTS': false,
    'READ_SMS': false,
    'READ_CALL_LOG': false,
  },
  'Entertainment': {
    'CAMERA': false,
    'RECORD_AUDIO': false,
    'INTERNET': true,
    'ACCESS_FINE_LOCATION': false,
    'READ_CONTACTS': false,
    'READ_SMS': false,
    'READ_CALL_LOG': false,
  },
  'News & Magazines': {
    'INTERNET': true,
    'ACCESS_FINE_LOCATION': false,
    'CAMERA': false,
    'RECORD_AUDIO': false,
    'READ_CONTACTS': false,
    'READ_SMS': false,
    'READ_CALL_LOG': false,
  },
  'Shopping': {
    'CAMERA': true,                   // Barcode scanning, AR
    'ACCESS_FINE_LOCATION': true,     // Store locator / delivery
    'ACCESS_COARSE_LOCATION': true,
    'RECORD_AUDIO': false,
    'READ_CONTACTS': false,
    'READ_SMS': false,
    'READ_CALL_LOG': false,
  },
  'Education': {
    'CAMERA': true,
    'RECORD_AUDIO': true,
    'READ_CALENDAR': true,
    'ACCESS_FINE_LOCATION': false,
    'READ_CONTACTS': false,
    'READ_SMS': false,
    'READ_CALL_LOG': false,
  },
  'Games': {
    'CAMERA': false,
    'RECORD_AUDIO': false,
    'ACCESS_FINE_LOCATION': false,
    'READ_CONTACTS': false,
    'READ_SMS': false,
    'READ_CALL_LOG': false,
  },
  'Tools': {
    'CAMERA': false,
    'RECORD_AUDIO': false,
    'READ_CONTACTS': false,
    'READ_SMS': false,
    'ACCESS_FINE_LOCATION': false,
    'READ_CALL_LOG': false,
  },
  'Messaging': {
    'RECORD_AUDIO': true,
    'CAMERA': true,
    'READ_CONTACTS': true,
    'READ_CALENDAR': false,
    'ACCESS_FINE_LOCATION': false,
    'READ_CALL_LOG': false,           // Even messaging apps shouldn't need call logs
    'READ_SMS': true,                 // SMS apps legitimately need this
  },
  'Photography': {
    'CAMERA': true,
    'ACCESS_FINE_LOCATION': true,     // Geo-tagging
    'READ_EXTERNAL_STORAGE': true,
    'WRITE_EXTERNAL_STORAGE': true,
    'RECORD_AUDIO': false,
    'READ_CONTACTS': false,
    'READ_SMS': false,
    'READ_CALL_LOG': false,
  },
  'Lifestyle': {
    'ACCESS_FINE_LOCATION': true,
    'ACCESS_COARSE_LOCATION': true,
    'CAMERA': false,
    'RECORD_AUDIO': false,
    'READ_CONTACTS': false,
    'READ_CALL_LOG': false,           // CRITICAL
    'READ_SMS': false,                // CRITICAL
  },
  'Food & Drink': {
    'CAMERA': true,
    'ACCESS_FINE_LOCATION': true,
    'ACCESS_COARSE_LOCATION': true,
    'RECORD_AUDIO': false,
    'READ_CONTACTS': false,
    'READ_SMS': false,
    'READ_CALL_LOG': false,
  },
  'Travel & Local': {
    'ACCESS_FINE_LOCATION': true,
    'ACCESS_COARSE_LOCATION': true,
    'CAMERA': true,
    'RECORD_AUDIO': false,
    'READ_CONTACTS': false,
    'READ_SMS': false,
    'READ_CALL_LOG': false,
  },
  'Beauty': {
    'CAMERA': true,                   // AR try-on features
    'ACCESS_FINE_LOCATION': false,
    'RECORD_AUDIO': false,
    'READ_CONTACTS': false,
    'READ_SMS': false,
    'READ_CALL_LOG': false,
  },
  'Business': {
    'CAMERA': true,
    'RECORD_AUDIO': true,             // Meetings
    'READ_CONTACTS': true,            // Business contacts
    'ACCESS_FINE_LOCATION': false,
    'READ_SMS': false,
    'READ_CALL_LOG': false,
  },
  'Weather': {
    'ACCESS_FINE_LOCATION': true,
    'ACCESS_COARSE_LOCATION': true,
    'CAMERA': false,
    'RECORD_AUDIO': false,
    'READ_CONTACTS': false,
    'READ_SMS': false,
    'READ_CALL_LOG': false,
  },
  'Sports': {
    'ACCESS_FINE_LOCATION': false,
    'CAMERA': false,
    'RECORD_AUDIO': false,
    'READ_CONTACTS': false,
    'READ_SMS': false,
    'READ_CALL_LOG': false,
  },
  'Music & Audio': {
    'RECORD_AUDIO': true,
    'CAMERA': false,
    'ACCESS_FINE_LOCATION': false,
    'READ_CONTACTS': false,
    'READ_SMS': false,
    'READ_CALL_LOG': false,
  },
};

// ============================================================
// LEAKAGE POINT VALUES — per permission risk level
// ============================================================
const LEAKAGE_POINTS: Record<string, number> = {
  'READ_CALL_LOG': 40,
  'WRITE_CALL_LOG': 40,
  'READ_SMS': 40,
  'SEND_SMS': 35,
  'WRITE_SMS': 35,
  'READ_CONTACTS': 25,
  'RECORD_AUDIO': 25,
  'READ_PHONE_STATE': 20,
  'ACCESS_FINE_LOCATION': 20,
  'ACCESS_COARSE_LOCATION': 15,
  'READ_CALENDAR': 15,
  'CAMERA': 15,
  // Default for any other flagged permission
  '_default': 15,
};

function getLeakagePoints(permission: string): number {
  return LEAKAGE_POINTS[permission] ?? LEAKAGE_POINTS['_default'];
}

function getLeakageRisk(permission: string): 'SUSPICIOUS' | 'CRITICAL' {
  const critical = [
    'READ_CALL_LOG', 'WRITE_CALL_LOG',
    'READ_SMS', 'SEND_SMS', 'WRITE_SMS',
    'READ_CONTACTS', 'RECORD_AUDIO',
  ];
  return critical.includes(permission) ? 'CRITICAL' : 'SUSPICIOUS';
}

function getRiskRecommendation(permission: string, categoryName: string): string {
  switch (permission) {
    case 'READ_CONTACTS':
      return `${categoryName} apps do not need your contact list. This is typically used for data profiling. Strongly consider rejecting this permission.`;
    case 'RECORD_AUDIO':
      return `${categoryName} apps have no clear use for microphone access. This could enable covert audio recording. Reject this permission.`;
    case 'ACCESS_FINE_LOCATION':
      return `${categoryName} apps don't need your precise GPS location. This enables constant movement tracking without a clear purpose.`;
    case 'ACCESS_COARSE_LOCATION':
      return `${categoryName} apps don't need your location. Consider rejecting this permission.`;
    case 'READ_CALL_LOG':
      return '🚨 Accessing your call log history is a severe privacy violation. Only the native Phone/Dialer app should ever need this. Do NOT install this app.';
    case 'READ_SMS':
    case 'SEND_SMS':
      return '🚨 Accessing your SMS messages is a critical privacy violation – this allows reading banking OTP codes and private conversations. Do NOT install this app.';
    case 'READ_CALENDAR':
      return `${categoryName} apps do not need access to your calendar events and appointments.`;
    case 'READ_PHONE_STATE':
      return `${categoryName} apps should not need your device/phone identifiers. This can be used to uniquely track your device.`;
    default:
      return `${permission} is unusual for ${categoryName} apps and may indicate data collection beyond core functionality.`;
  }
}

// Categories where location access is expected/typical
const LOCATION_SAFE_CATEGORIES: CanonicalCategory[] = [
  'Maps & Navigation', 'Travel & Local', 'Food & Drink',
  'Shopping', 'Health & Fitness', 'Weather', 'Photography', 'Lifestyle',
];

// ============================================================
// MAIN ANALYSIS FUNCTION
// ============================================================
/**
 * Analyze declared permissions for suspicious data leakage patterns.
 * - Uses CanonicalCategory from permissions-db.ts (no separate DB).
 * - Prevents double-scoring via a Set of already-scored permissions.
 * - Normalizes the final score with an asymptotic decay curve.
 */
export function analyzePermissionUsage(
  declaredPermissions: string[],
  appCategory: string,
  userFriendlyPermissions: Record<string, string[]>
): UsageComparisonResult {
  const canonical = normalizeCategory(appCategory);
  const patterns = CATEGORY_PERMISSION_PATTERNS[canonical] || {};
  const suspiciousPermissions: PermissionUsageAnalysis[] = [];
  const unusedDeclaredPermissions: PermissionUsageAnalysis[] = [];

  // Track scored permissions to prevent double-counting
  const scoredPermissions = new Set<string>();
  let rawLeakageScore = 0;

  // ── Phase 1: Pattern-based check (explicit false in category patterns) ──
  console.log(`\n[Leakage Algo] Starting analysis for App (Category: ${canonical})`);
  console.log(`[Leakage Algo] Declared Permissions: ${declaredPermissions.join(', ')}`);

  declaredPermissions.forEach(permission => {
    if (scoredPermissions.has(permission)) return;
    if (patterns[permission] === false) {
      scoredPermissions.add(permission);
      const points = getLeakagePoints(permission);
      console.log(`[Leakage Algo] Phase 1 - Flagged unexpected pattern: ${permission} (+${points} pts)`);
      rawLeakageScore += points;
      suspiciousPermissions.push({
        permission,
        userFriendlyName: resolveUserFriendlyName(permission, userFriendlyPermissions),
        isDeclared: true,
        typicalUsage: false,
        leakageRisk: getLeakageRisk(permission),
        recommendation: getRiskRecommendation(permission, appCategory),
      });
    }
  });

  // ── Phase 2: Universal high-risk checks (regardless of category patterns) ──

  declaredPermissions.forEach(permission => {
    if (scoredPermissions.has(permission)) return;

    let flagged = false;
    let points = 0;
    let risk: 'SUSPICIOUS' | 'CRITICAL' = 'SUSPICIOUS';
    let rec = '';

    if (['READ_CALL_LOG', 'WRITE_CALL_LOG'].includes(permission)) {
      flagged = true;
      points = 40;
      risk = 'CRITICAL';
      rec = '🚨 Accessing your call log history is a severe privacy violation. Only the native Phone/Dialer app should ever need this. Do NOT install this app.';
    } else if (['READ_SMS', 'SEND_SMS', 'WRITE_SMS'].includes(permission) && canonical !== 'Messaging') {
      flagged = true;
      points = 40;
      risk = 'CRITICAL';
      rec = '🚨 Accessing your text messages is a critical privacy violation — this app can read your banking OTPs and personal conversations. Do NOT install this app.';
    } else if (permission.includes('LOCATION') && !LOCATION_SAFE_CATEGORIES.includes(canonical)) {
      flagged = true;
      points = permission.includes('FINE') ? 20 : 15;
      risk = 'SUSPICIOUS';
      rec = `${appCategory} apps don't need precise location tracking. This enables constant monitoring of your movements.`;
    }

    if (flagged) {
      scoredPermissions.add(permission);
      rawLeakageScore += points;
      console.log(`[Leakage Algo] Phase 2 - Flagged universal risk: ${permission} (+${points} pts)`);
      suspiciousPermissions.push({
        permission,
        userFriendlyName: resolveUserFriendlyName(permission, userFriendlyPermissions),
        isDeclared: true,
        typicalUsage: false,
        leakageRisk: risk,
        recommendation: rec,
      });
    }
  });

  // ── Phase 3: Combination risk — multiple dangerous perms together ──
  const criticalPermsFound = suspiciousPermissions.filter(
    p => p.leakageRisk === 'CRITICAL'
  );
  if (criticalPermsFound.length >= 2) {
    // Dangerous combination: each additional critical perm amplifies risk
    const combBonus = (criticalPermsFound.length - 1) * 10;
    console.log(`[Leakage Algo] Phase 3 - Combination bonus applied: ${criticalPermsFound.length} critical perms (+${combBonus} pts)`);
    rawLeakageScore += combBonus;
  }

  // ── Normalize with asymptotic decay curve ──
  // k=0.025 means 40 raw pts → ~63% (CRITICAL), 20 pts → ~39% (MODERATE)
  const k = 0.025;
  const leakageScore = Math.min(
    100,
    Math.round(100 * (1 - Math.exp(-k * rawLeakageScore)))
  );

  console.log(`[Leakage Algo] Final Raw Score: ${rawLeakageScore} -> Normalized: ${leakageScore}%\n`);

  // ── Overall Assessment ──
  let overallAssessment: string;
  if (leakageScore >= 60) {
    overallAssessment = `🚨 CRITICAL LEAKAGE RISK: This ${appCategory} app requests ${suspiciousPermissions.length} suspicious permission(s) that don't match its core function. It appears to be collecting data well beyond what's needed. We strongly recommend NOT installing it.`;
  } else if (leakageScore >= 30) {
    overallAssessment = `⚠️ MODERATE RISK: This ${appCategory} app requests ${suspiciousPermissions.length} permission(s) that seem unnecessary for its category. Review carefully before installing.`;
  } else if (leakageScore > 0) {
    overallAssessment = `⚠️ MINOR CONCERN: This ${appCategory} app has ${suspiciousPermissions.length} permission request(s) that could be optimized. Generally acceptable, but stay alert.`;
  } else {
    overallAssessment = `✅ LOW RISK: Permission requests align well with typical ${appCategory} app functionality. This app appears to follow privacy best practices.`;
  }

  return {
    appName: '',
    appCategory,
    declaredPermissions,
    suspiciousPermissions,
    unusedDeclaredPermissions,
    leakageScore,
    overallAssessment,
  };
}

function resolveUserFriendlyName(
  permission: string,
  userFriendlyPermissions: Record<string, string[]>
): string {
  const match = Object.keys(userFriendlyPermissions).find(
    key => userFriendlyPermissions[key].includes(permission)
  );
  if (match) return match;

  // Fallback: humanize the Android constant
  const known: Record<string, string> = {
    'ACCESS_FINE_LOCATION': 'Precise Location',
    'ACCESS_COARSE_LOCATION': 'Approximate Location',
    'CAMERA': 'Camera',
    'RECORD_AUDIO': 'Microphone',
    'READ_CONTACTS': 'Contacts',
    'READ_CALL_LOG': 'Call Logs',
    'READ_SMS': 'SMS Messages',
    'READ_PHONE_STATE': 'Phone Identity',
    'READ_CALENDAR': 'Calendar',
  };
  return known[permission] || permission;
}

/**
 * Generate leakage indicator flags from the suspicious permissions list.
 */
export function generateLeakageIndicators(
  suspiciousPermissions: PermissionUsageAnalysis[]
): Record<string, boolean> {
  const indicators: Record<string, boolean> = {
    hasUnexpectedLocationTracking: false,
    hasUnexpectedAudioCapture: false,
    hasUnexpectedContactAccess: false,
    hasUnexpectedPhotoAccess: false,
    hasExcessiveDataAccess: false,
    showsConcernedBehavior: false,
  };

  suspiciousPermissions.forEach(perm => {
    if (perm.permission.includes('LOCATION')) {
      indicators.hasUnexpectedLocationTracking = true;
    }
    if (perm.permission === 'RECORD_AUDIO') {
      indicators.hasUnexpectedAudioCapture = true;
    }
    if (perm.permission === 'READ_CONTACTS') {
      indicators.hasUnexpectedContactAccess = true;
    }
    if (
      perm.permission === 'READ_EXTERNAL_STORAGE' ||
      perm.permission === 'ACCESS_MEDIA_LOCATION'
    ) {
      indicators.hasUnexpectedPhotoAccess = true;
    }
    if (perm.leakageRisk === 'CRITICAL') {
      indicators.showsConcernedBehavior = true;
      indicators.hasExcessiveDataAccess = true;
    }
  });

  return indicators;
}
