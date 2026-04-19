/**
 * Permission Usage Tracking & Leakage Detection
 * Analyzes if declared permissions align with typical usage patterns
 */

export interface PermissionUsageAnalysis {
  permission: string;
  userFriendlyName: string;
  isDeclared: boolean;
  typicalUsage: boolean; // Is this permission typically used by this category?
  leakageRisk: 'NORMAL' | 'SUSPICIOUS' | 'CRITICAL'; // Based on mismatch
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

/**
 * Typical permission usage patterns by app category
 * Based on Google Play Store best practices
 * true = typically needed, false = suspicious/unexpected
 */
const CATEGORY_PERMISSION_PATTERNS: Record<string, Record<string, boolean>> = {
  'Social Media': {
    'CAMERA': true,
    'RECORD_AUDIO': true,
    'ACCESS_FINE_LOCATION': false, // SUSPICIOUS - why does Instagram need location?
    'ACCESS_COARSE_LOCATION': false, // SUSPICIOUS
    'READ_CONTACTS': false, // SUSPICIOUS - collecting contact data without disclosure
    'READ_CALL_LOG': false, // CRITICAL - major privacy violation
    'READ_PHONE_STATE': false, // SUSPICIOUS
    'READ_SMS': false, // CRITICAL - should never request this
    'ACCESS_MEDIA_LOCATION': false, // SUSPICIOUS
    'READ_CALENDAR': false,
  },
  'Maps': {
    'ACCESS_FINE_LOCATION': true,
    'ACCESS_COARSE_LOCATION': true,
    'CAMERA': false,
    'RECORD_AUDIO': false,
  },
  'Banking': {
    'INTERNET': true,
    'READ_PHONE_STATE': true, // For fraud detection
    'CAMERA': false, // Only for check deposit, suspicious if always
    'ACCESS_FINE_LOCATION': false,
    'RECORD_AUDIO': false, // Should NEVER need this
  },
  'Health': {
    'BODY_SENSORS': true,
    'ACCESS_FINE_LOCATION': true, // Some health apps track location
    'CAMERA': false,
    'READ_CALENDAR': true, // Appointment tracking
  },
  'Video Streaming': {
    'CAMERA': false,
    'RECORD_AUDIO': false,
    'INTERNET': true,
    'ACCESS_FINE_LOCATION': false,
  },
  'News': {
    'INTERNET': true,
    'READ_CALENDAR': false,
    'ACCESS_FINE_LOCATION': false,
    'CAMERA': false,
    'RECORD_AUDIO': false,
  },
  'Shopping': {
    'CAMERA': true, // Barcode scanning, AR
    'READ_CONTACTS': false, // Suspicious
    'ACCESS_FINE_LOCATION': true, // Store locator
  },
  'Education': {
    'CAMERA': true, // Video calling, recordings
    'RECORD_AUDIO': true,
    'READ_CALENDAR': true, // Schedule management
    'ACCESS_FINE_LOCATION': false,
  },
  'Games': {
    'CAMERA': false, // Unless AR games
    'RECORD_AUDIO': false,
    'ACCESS_FINE_LOCATION': false, // Unless location-based
    'READ_CONTACTS': false, // Should NEVER need
  },
  'Tools': {
    'CAMERA': false, // Depends on tool type
    'RECORD_AUDIO': false,
  },
  'Utilities': {
    'CAMERA': false,
    'RECORD_AUDIO': false,
  },
  'Messaging': {
    'RECORD_AUDIO': true,
    'CAMERA': true,
    'READ_CONTACTS': true,
    'READ_CALENDAR': false,
  },
  'Photography': {
    'CAMERA': true,
    'ACCESS_FINE_LOCATION': true, // Geo-tagging
  },
  'Lifestyle': {
    'CAMERA': false,        // Rarely needed
    'RECORD_AUDIO': false,  // No clear use-case
    'ACCESS_FINE_LOCATION': true, // Expected — delivery, local services, hyperlocal apps
    'READ_CONTACTS': false, // No need to read contacts
    'READ_CALL_LOG': false, // CRITICAL
    'READ_SMS': false,      // CRITICAL
  },
  'Food & Drink': {
    'CAMERA': true,         // Food photo sharing
    'ACCESS_FINE_LOCATION': true, // Restaurant finder / delivery
    'RECORD_AUDIO': false,
    'READ_CONTACTS': false,
    'READ_SMS': false,
  },
  'Travel & Local': {
    'ACCESS_FINE_LOCATION': true,
    'CAMERA': true,
    'RECORD_AUDIO': false,
    'READ_CONTACTS': false,
    'READ_SMS': false,
  },
  'Beauty': {
    'CAMERA': true,         // AR try-on features
    'ACCESS_FINE_LOCATION': false,
    'RECORD_AUDIO': false,
    'READ_CONTACTS': false,
  },
  'Business': {
    'CAMERA': true,
    'RECORD_AUDIO': true,   // Meetings
    'READ_CONTACTS': true,  // Business contacts
    'ACCESS_FINE_LOCATION': false,
    'READ_SMS': false,
  },
  'Finance': {
    'READ_PHONE_STATE': true, // Fraud detection
    'CAMERA': false,
    'RECORD_AUDIO': false,
    'ACCESS_FINE_LOCATION': false,
    'READ_CONTACTS': false,
    'READ_SMS': false,
  },
  'Weather': {
    'ACCESS_FINE_LOCATION': true,
    'CAMERA': false,
    'RECORD_AUDIO': false,
    'READ_CONTACTS': false,
  },
  'Sports': {
    'ACCESS_FINE_LOCATION': false,
    'CAMERA': false,
    'RECORD_AUDIO': false,
    'READ_CONTACTS': false,
  },
  'Music & Audio': {
    'RECORD_AUDIO': true,
    'CAMERA': false,
    'ACCESS_FINE_LOCATION': false,
    'READ_CONTACTS': false,
  },
};

/**
 * Permissions that should NEVER be requested
 */
const DANGEROUS_PERMISSION_COMBINATIONS: string[] = [
  'RECORD_AUDIO', // For news apps, games, etc.
  'ACCESS_FINE_LOCATION', // For shopping apps that don't need it
  'READ_CONTACTS', // For video apps, weather apps
];

/**
 * Analyze permission usage and detect potential leakage
 */
export function analyzePermissionUsage(
  declaredPermissions: string[],
  appCategory: string,
  userFriendlyPermissions: Record<string, string[]>
): UsageComparisonResult {
  const patterns = CATEGORY_PERMISSION_PATTERNS[appCategory] || {};
  const suspiciousPermissions: PermissionUsageAnalysis[] = [];
  const unusedDeclaredPermissions: PermissionUsageAnalysis[] = [];

  let leakageScore = 0;

  // Analyze each declared permission
  declaredPermissions.forEach(permission => {
    const isTechnical = Object.values(userFriendlyPermissions).flat().includes(permission);
    const isTypicallyUsed = patterns[permission] !== false;

    if (!isTypicallyUsed && patterns[permission] !== undefined) {
      // Permission declared but typically not used by this category
      leakageScore += 25; // Increased from 20
      suspiciousPermissions.push({
        permission,
        userFriendlyName: Object.keys(userFriendlyPermissions).find(
          key => userFriendlyPermissions[key].includes(permission)
        ) || permission,
        isDeclared: true,
        typicalUsage: false,
        leakageRisk: 'SUSPICIOUS',
        recommendation: `${permission} is unusual for ${appCategory} apps. This could indicate data collection not related to core functionality.`
      });
    }
  });

  // Check for dangerous combinations
  const hasRecordAudio = declaredPermissions.includes('RECORD_AUDIO');
  const hasLocation = declaredPermissions.some(p => 
    p.includes('LOCATION') || p.includes('location')
  );
  const hasContacts = declaredPermissions.includes('READ_CONTACTS');
  const hasCallLog = declaredPermissions.includes('READ_CALL_LOG');
  const hasSMS = declaredPermissions.some(p => p.includes('SMS') || p.includes('PHONE_NUMBER'));

  if (hasRecordAudio && appCategory === 'Games') {
    leakageScore += 20; // Increased from 15
    suspiciousPermissions.push({
      permission: 'RECORD_AUDIO',
      userFriendlyName: 'Microphone',
      isDeclared: true,
      typicalUsage: false,
      leakageRisk: 'CRITICAL',
      recommendation: 'Games should not need microphone access. This is a major privacy red flag.',
    });
  }

  if (hasContacts && !['Messaging', 'Social Media'].includes(appCategory)) {
    leakageScore += 20; // Increased from 15
    suspiciousPermissions.push({
      permission: 'READ_CONTACTS',
      userFriendlyName: 'Contacts',
      isDeclared: true,
      typicalUsage: false,
      leakageRisk: 'CRITICAL',
      recommendation: `${appCategory} apps typically don't need access to contacts. High data leakage risk.`,
    });
  } else if (hasContacts && appCategory === 'Social Media') {
    // Even social media apps requesting contacts is suspicious
    leakageScore += 15;
    suspiciousPermissions.push({
      permission: 'READ_CONTACTS',
      userFriendlyName: 'Contacts',
      isDeclared: true,
      typicalUsage: false,
      leakageRisk: 'CRITICAL',
      recommendation: `Even for Social Media, requesting read access to contacts is questionable. Consider revoking this permission.`,
    });
  }

  if (hasCallLog) {
    leakageScore += 30; // CRITICAL - call logs are extremely sensitive
    suspiciousPermissions.push({
      permission: 'READ_CALL_LOG',
      userFriendlyName: 'Call Logs',
      isDeclared: true,
      typicalUsage: false,
      leakageRisk: 'CRITICAL',
      recommendation: `This app is requesting access to your call logs! This is a CRITICAL privacy violation. Do NOT install.`,
    });
  }

  if (hasSMS) {
    leakageScore += 30; // CRITICAL - SMS is extremely sensitive
    suspiciousPermissions.push({
      permission: 'READ_SMS',
      userFriendlyName: 'SMS/Messages',
      isDeclared: true,
      typicalUsage: false,
      leakageRisk: 'CRITICAL',
      recommendation: `This app is requesting access to your text messages! This is a CRITICAL privacy violation. Do NOT install.`,
    });
  }

  if (hasLocation && ![
    'Maps', 'Travel & Local', 'Food & Drink', 'Shopping', 'Health', 'Weather', 'Photography', 'Lifestyle'
  ].includes(appCategory)) {
    leakageScore += 18; // Increased from 12
    suspiciousPermissions.push({
      permission: hasLocation ? 'ACCESS_FINE_LOCATION' : 'ACCESS_COARSE_LOCATION',
      userFriendlyName: 'Precise Location',
      isDeclared: true,
      typicalUsage: false,
      leakageRisk: 'SUSPICIOUS',
      recommendation: `${appCategory} apps typically don't need precise location tracking. This enables constant user monitoring.`,
    });
  }

  // Normalize leakage score
  leakageScore = Math.min(100, Math.max(0, leakageScore));

  let overallAssessment = '';
  if (leakageScore >= 60) {
    overallAssessment = `🚨 CRITICAL LEAKAGE RISK: This ${appCategory} app requests ${suspiciousPermissions.length} suspicious permissions that don't align with typical usage. This app is likely collecting data well beyond what's needed for its core functionality. We strongly recommend NOT installing this app.`;
  } else if (leakageScore >= 30) {
    overallAssessment = `⚠️ MODERATE RISK: This ${appCategory} app requests ${suspiciousPermissions.length} permission(s) that seem unnecessary. Review carefully before installing. Consider denying suspicious permissions if your device allows granular control.`;
  } else if (leakageScore > 0) {
    overallAssessment = `⚠️ MINOR CONCERN: This ${appCategory} app has ${suspiciousPermissions.length} permission request(s) that could be optimized. Generally acceptable, but stay alert.`;
  } else {
    overallAssessment = `✅ LOW RISK: Permission requests align well with typical ${appCategory} app functionality. Appears to follow privacy best practices.`;
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

/**
 * Generate data leakage indicators based on pattern analysis
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
    if (perm.permission === 'READ_EXTERNAL_STORAGE' || perm.permission === 'ACCESS_MEDIA_LOCATION') {
      indicators.hasUnexpectedPhotoAccess = true;
    }
    if (perm.leakageRisk === 'CRITICAL') {
      indicators.showsConcernedBehavior = true;
      indicators.hasExcessiveDataAccess = true;
    }
  });

  return indicators;
}
