import { NextRequest, NextResponse } from 'next/server';
import { ErrorType, AppError, createErrorResponse, logError } from '@/lib/error-handler';
import { withRateLimit, RATE_LIMITS } from '@/middleware/rate-limit';

interface TrackerInfo {
  id: string;
  name: string;
  categories: string[];
  website: string;
  description: string;
}

// Curated offline tracker database for major apps
// Source: Exodus Privacy public reports (https://reports.exodus-privacy.eu.org)
const OFFLINE_TRACKER_DB: Record<string, { trackers: TrackerInfo[] }> = {
  'com.instagram.android': {
    trackers: [
      { id: '1', name: 'Facebook Analytics', categories: ['analytics'], website: 'https://developers.facebook.com/docs/analytics', description: 'Meta/Facebook behavioral analytics SDK embedded in Meta-owned apps.' },
      { id: '2', name: 'Facebook Ads', categories: ['advertisement'], website: 'https://developers.facebook.com/docs/audience-network', description: 'Facebook Audience Network for targeted advertising.' },
      { id: '3', name: 'Facebook Login', categories: ['identification'], website: 'https://developers.facebook.com/docs/facebook-login', description: 'Cross-app identity and login tracking used across the Meta ecosystem.' },
      { id: '4', name: 'Google Firebase Analytics', categories: ['analytics'], website: 'https://firebase.google.com/docs/analytics', description: 'Google Firebase analytics for user behavior and engagement tracking.' },
      { id: '5', name: 'Google CrashLytics', categories: ['crash reporting'], website: 'https://firebase.google.com/docs/crashlytics', description: 'Crash reporting SDK that also collects device and usage data.' },
    ]
  },
  'com.zhiliaoapp.musically': { trackers: [] },
  'com.ss.android.ugc.tiktok': {
    trackers: [
      { id: '1', name: 'Pangle (TikTok for Business)', categories: ['advertisement', 'analytics'], website: 'https://www.pangleglobal.com/', description: 'ByteDance advertising platform embedded in TikTok for cross-app tracking and ad targeting.' },
      { id: '2', name: 'AppsFlyer', categories: ['analytics'], website: 'https://www.appsflyer.com', description: 'Mobile attribution and marketing analytics platform.' },
      { id: '3', name: 'Google Firebase Analytics', categories: ['analytics'], website: 'https://firebase.google.com/docs/analytics', description: 'Google Firebase analytics for user behavior and engagement tracking.' },
      { id: '4', name: 'Adjust', categories: ['analytics'], website: 'https://www.adjust.com', description: 'Mobile measurement and fraud prevention platform.' },
    ]
  },
  'com.facebook.katana': {
    trackers: [
      { id: '1', name: 'Facebook Analytics', categories: ['analytics'], website: 'https://developers.facebook.com/docs/analytics', description: 'Meta behavioral analytics and user profiling SDK.' },
      { id: '2', name: 'Facebook Ads', categories: ['advertisement'], website: 'https://developers.facebook.com/', description: 'Facebook advertising network and audience targeting.' },
      { id: '3', name: 'Google Firebase Analytics', categories: ['analytics'], website: 'https://firebase.google.com/', description: 'Google Firebase analytics SDK.' },
      { id: '4', name: 'Google CrashLytics', categories: ['crash reporting'], website: 'https://firebase.google.com/docs/crashlytics', description: 'Crash reporting and diagnostics.' },
    ]
  },
  'com.whatsapp': {
    trackers: [
      { id: '1', name: 'Facebook Analytics', categories: ['analytics'], website: 'https://developers.facebook.com/', description: 'Meta analytics SDK for behavioral tracking.' },
      { id: '2', name: 'Google Firebase Analytics', categories: ['analytics'], website: 'https://firebase.google.com/', description: 'Google Firebase analytics.' },
    ]
  },
  'com.snapchat.android': {
    trackers: [
      { id: '1', name: 'Snap Audience Network', categories: ['advertisement'], website: 'https://forbusiness.snapchat.com/', description: 'Snap Inc advertising platform for cross-app targeting.' },
      { id: '2', name: 'Google Firebase Analytics', categories: ['analytics'], website: 'https://firebase.google.com/', description: 'Firebase analytics tracking.' },
      { id: '3', name: 'Comscore', categories: ['analytics'], website: 'https://www.comscore.com/', description: 'Digital measurement and audience analytics.' },
      { id: '4', name: 'Nielsen', categories: ['analytics'], website: 'https://www.nielsen.com/', description: 'Audience measurement and data analytics company.' },
    ]
  },
  'com.twitter.android': {
    trackers: [
      { id: '1', name: 'Twitter Ads MoPub', categories: ['advertisement'], website: 'https://twitter.com/mopub', description: 'Twitter/X mobile ad serving platform.' },
      { id: '2', name: 'Google Firebase Analytics', categories: ['analytics'], website: 'https://firebase.google.com/', description: 'Firebase analytics.' },
      { id: '3', name: 'Apptimize', categories: ['analytics'], website: 'https://www.apptimize.com/', description: 'A/B testing and mobile experience optimization.' },
    ]
  },
  'com.google.android.youtube': {
    trackers: [
      { id: '1', name: 'Google Analytics', categories: ['analytics'], website: 'https://analytics.google.com/', description: 'Google Analytics for app engagement and behaviors.' },
      { id: '2', name: 'Google Ads', categories: ['advertisement'], website: 'https://ads.google.com/', description: 'Google Ads platform for personalized video advertising.' },
      { id: '3', name: 'DoubleClick', categories: ['advertisement'], website: 'https://marketingplatform.google.com/', description: 'Google advertising serving and conversion tracking.' },
    ]
  },
  'org.telegram.messenger': {
    trackers: []
  },
  'com.ubercab': {
    trackers: [
      { id: '1', name: 'Google Firebase Analytics', categories: ['analytics'], website: 'https://firebase.google.com/', description: 'Firebase analytics.' },
      { id: '2', name: 'AppsFlyer', categories: ['analytics'], website: 'https://www.appsflyer.com', description: 'Attribution and mobile measurement analytics.' },
      { id: '3', name: 'Braze', categories: ['analytics'], website: 'https://www.braze.com/', description: 'Customer engagement and messaging platform.' },
    ]
  },
  'com.spotify.music': {
    trackers: [
      { id: '1', name: 'Google Firebase Analytics', categories: ['analytics'], website: 'https://firebase.google.com/', description: 'Firebase analytics.' },
      { id: '2', name: 'Comscore', categories: ['analytics'], website: 'https://www.comscore.com/', description: 'Digital measurement.' },
      { id: '3', name: 'Nielsen', categories: ['analytics'], website: 'https://www.nielsen.com/', description: 'Audience measurement.' },
      { id: '4', name: 'Google Ads', categories: ['advertisement'], website: 'https://ads.google.com/', description: 'Google advertising platform.' },
    ]
  },
};

// Package name lookup by common name
const APP_NAME_TO_PACKAGE: Record<string, string> = {
  'instagram': 'com.instagram.android',
  'tiktok': 'com.ss.android.ugc.tiktok',
  'facebook': 'com.facebook.katana',
  'messenger': 'com.facebook.orca',
  'whatsapp': 'com.whatsapp',
  'telegram': 'org.telegram.messenger',
  'youtube': 'com.google.android.youtube',
  'gmail': 'com.google.android.gm',
  'twitter': 'com.twitter.android',
  'x': 'com.twitter.android',
  'snapchat': 'com.snapchat.android',
  'uber': 'com.ubercab',
  'spotify': 'com.spotify.music',
};

function computeTrackerRisk(trackerCount: number): { score: number; level: string } {
  if (trackerCount === 0) return { score: 0, level: 'SAFE' };
  // Smooth power curve: each tracker adds diminishing marginal risk
  // 1 tracker → ~14% SAFE, 2 → ~29% MEDIUM, 3 → ~45% MEDIUM
  // 4 → ~62% RISKY, 5 → ~79% RISKY, 6+ → 90%+ RISKY
  const raw = Math.min(100, Math.round(trackerCount * 12 + Math.pow(trackerCount, 1.4) * 2));
  const level = raw >= 60 ? 'RISKY' : raw >= 25 ? 'MEDIUM' : 'SAFE';
  return { score: raw, level };
}

async function handler(request: NextRequest) {
  try {
    const { appName, packageName } = await request.json();

    if (!appName && !packageName) {
      const error = new AppError(
        ErrorType.VALIDATION,
        'Please provide either an app name or package name to check.'
      );
      return createErrorResponse(error);
    }

    // Resolve package ID to check
    const normalizedName = (appName || '').toLowerCase().trim();
    const resolvedPackageId =
      packageName ||
      APP_NAME_TO_PACKAGE[normalizedName] ||
      null;

    let trackers: TrackerInfo[] = [];
    let source = 'offline';

    // 1. Try offline DB first (fast & reliable)
    const offlineKey = resolvedPackageId && OFFLINE_TRACKER_DB[resolvedPackageId]
      ? resolvedPackageId
      : Object.keys(APP_NAME_TO_PACKAGE).find(k => normalizedName.includes(k))
        ? APP_NAME_TO_PACKAGE[Object.keys(APP_NAME_TO_PACKAGE).find(k => normalizedName.includes(k))!]
        : null;

    if (offlineKey && OFFLINE_TRACKER_DB[offlineKey] !== undefined) {
      trackers = OFFLINE_TRACKER_DB[offlineKey].trackers;
      source = 'offline-db';
    } else {
      // 2. Try Exodus Privacy API (requires API key in env)
      const apiKey = process.env.EXODUS_PRIVACY_API_KEY;
      if (apiKey && resolvedPackageId) {
        try {
          const res = await fetch(
            `https://reports.exodus-privacy.eu.org/api/search/${encodeURIComponent(resolvedPackageId)}/details`,
            { headers: { Authorization: `Token ${apiKey}`, Accept: 'application/json' }, next: { revalidate: 3600 } }
          );
          if (res.ok) {
            const data = await res.json();
            trackers = data.trackers || [];
            source = 'exodus-api';
          }
        } catch (e) {
          console.warn('[Exodus] API call failed:', e);
        }
      }
    }

    const trackerCount = trackers.length;
    const { score, level } = computeTrackerRisk(trackerCount);

    // Build leakage indicators from tracker categories
    const categories = trackers.flatMap(t => t.categories);
    const leakageIndicators = {
      hasAnalytics: categories.includes('analytics'),
      hasAdvertising: categories.includes('advertisement'),
      hasIdentification: categories.includes('identification'),
      hasLocation: categories.includes('location'),
      hasPhoneNumber: categories.includes('phone_number'),
      hasEmail: categories.includes('email'),
      hasFileSharing: categories.includes('file_sharing'),
    };

    const trackerCategories = Array.from(
      trackers.reduce((map, t) => {
        t.categories.forEach(cat => map.set(cat, (map.get(cat) || 0) + 1));
        return map;
      }, new Map<string, number>())
    ).map(([category, count]) => ({ category, count }));

    if (trackerCount === 0 && source === 'offline-db') {
      // We know about the app and confirmed it has no trackers
      return NextResponse.json({ found: true, trackerCount: 0, trackerRiskScore: 0, trackerRiskLevel: 'SAFE', trackers: [], trackerCategories: [], leakageIndicators, source });
    }

    if (trackerCount === 0 && source !== 'offline-db') {
      return NextResponse.json({ found: false, message: 'App not found in tracker database', appName, packageName: resolvedPackageId }, { status: 404 });
    }

    return NextResponse.json({
      found: true,
      appName,
      trackerCount,
      trackerRiskLevel: level,
      trackerRiskScore: score,
      trackers,
      trackerCategories,
      leakageIndicators,
      source,
    });
  } catch (error) {
    const appError = error instanceof AppError
      ? error
      : new AppError(
          ErrorType.API_ERROR,
          'Failed to fetch privacy and tracker information. Please try again.'
        );
    logError(appError, { context: 'exodus_privacy_handler' });
    return createErrorResponse(appError);
  }
}

// Apply rate limiting for external API calls
export const POST = withRateLimit(handler, RATE_LIMITS.EXTERNAL_API);
