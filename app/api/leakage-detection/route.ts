import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, RATE_LIMITS } from '@/middleware/rate-limit';
import { analyzePermissionUsage, generateLeakageIndicators } from '@/lib/permission-usage-tracking';
import { USER_FRIENDLY_PERMISSION_EXPLANATIONS } from '@/lib/user-friendly-permissions';

/**
 * API endpoint for privacy leakage detection
 * Compares declared permissions with typical usage patterns
 */
async function handler(request: NextRequest) {
  try {
    const { permissions, appCategory, appName } = await request.json();

    if (!permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'permissions array is required' },
        { status: 400 }
      );
    }

    if (!appCategory) {
      return NextResponse.json(
        { error: 'appCategory is required' },
        { status: 400 }
      );
    }

    // Filter empty/invalid permissions
    const validPermissions = permissions.filter(p => p && typeof p === 'string').slice(0, 100);

    if (validPermissions.length === 0) {
      return NextResponse.json({
        success: true,
        appName: appName || 'Unknown App',
        appCategory,
        analysisResult: {
          leakageScore: 0,
          leakageLevel: 'LOW',
          overallAssessment: '✅ No suspicious permissions detected for this app.',
          suspiciousPermissions: [],
          leakageIndicators: {},
          permissionCount: 0,
          suspiciousCount: 0,
          suspiciousPercentage: 0,
        },
      });
    }

    // Create a simplified mapping from permissions
    const userFriendlyMap: Record<string, string[]> = {
      'Location': ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
      'Camera': ['CAMERA'],
      'Microphone': ['RECORD_AUDIO'],
      'Contacts': ['READ_CONTACTS', 'WRITE_CONTACTS'],
      'Storage': ['READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE'],
      'Phone': ['READ_CALL_LOG', 'READ_PHONE_STATE'],
      'SMS': ['READ_SMS', 'SEND_SMS', 'WRITE_SMS'],
      'Calendar': ['READ_CALENDAR', 'WRITE_CALENDAR'],
      'Notifications': ['POST_NOTIFICATIONS'],
      'Bluetooth': ['BLUETOOTH', 'BLUETOOTH_ADMIN']
    };

    // Analyze permission usage
    const analysis = analyzePermissionUsage(validPermissions, appCategory, userFriendlyMap);
    analysis.appName = appName || 'Unknown App';

    // Generate leakage indicators
    const leakageIndicators = generateLeakageIndicators(analysis.suspiciousPermissions);

    // Create detailed report
    return NextResponse.json({
      success: true,
      appName: analysis.appName,
      appCategory,
      analysisResult: {
        leakageScore: analysis.leakageScore,
        leakageLevel: 
          analysis.leakageScore >= 60 ? 'CRITICAL' :
          analysis.leakageScore >= 30 ? 'MODERATE' :
          'LOW',
        overallAssessment: analysis.overallAssessment,
        suspiciousPermissions: analysis.suspiciousPermissions.map(p => ({
          permission: p.permission,
          userFriendlyName: p.userFriendlyName,
          leakageRisk: p.leakageRisk,
          recommendation: p.recommendation,
        })),
        leakageIndicators,
        permissionCount: validPermissions.length,
        suspiciousCount: analysis.suspiciousPermissions.length,
        suspiciousPercentage: validPermissions.length > 0
          ? Math.round((analysis.suspiciousPermissions.length / validPermissions.length) * 100)
          : 0,
      },
    });
  } catch (error) {
    console.error('Leakage detection error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze leakage detection', details: String(error) },
      { status: 500 }
    );
  }
}

// Apply rate limiting for expensive leakage detection
export const POST = withRateLimit(handler, RATE_LIMITS.EXPENSIVE);
