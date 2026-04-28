/**
 * Unified Permissions Database
 * Single source of truth for all category-permission logic.
 * All three analysis modules (After Install scoring, Before Install,
 * and Leakage Detection) MUST use normalizeCategory() from this file.
 */

export interface CategoryPermissions {
  category: string;
  expectedPermissions: string[];
  description: string;
}

// ============================================================
// CANONICAL CATEGORY NAMES
// These are the standardized names used internally by all modules.
// ============================================================
export type CanonicalCategory =
  | 'Social Media'
  | 'Messaging'
  | 'Photography'
  | 'Maps & Navigation'
  | 'Travel & Local'
  | 'Finance'
  | 'Tools'
  | 'Lifestyle'
  | 'Health & Fitness'
  | 'Education'
  | 'Entertainment'
  | 'Shopping'
  | 'Food & Drink'
  | 'Weather'
  | 'Sports'
  | 'Music & Audio'
  | 'Beauty'
  | 'Business'
  | 'Games'
  | 'News & Magazines';

// Maps any Play Store genre string → canonical category (case-insensitive)
const PLAY_STORE_GENRE_MAP: Record<string, CanonicalCategory> = {
  'social': 'Social Media',
  'social networking': 'Social Media',
  'communication': 'Messaging',
  'messaging': 'Messaging',
  'photography': 'Photography',
  'photo': 'Photography',
  'maps & navigation': 'Maps & Navigation',
  'navigation': 'Maps & Navigation',
  'travel & local': 'Travel & Local',
  'travel': 'Travel & Local',
  'local': 'Travel & Local',
  'finance': 'Finance',
  'banking': 'Finance',
  'tools': 'Tools',
  'utilities': 'Tools',
  'art & design': 'Tools',
  'lifestyle': 'Lifestyle',
  'parenting': 'Lifestyle',
  'events': 'Lifestyle',
  'dating': 'Lifestyle',
  'health & fitness': 'Health & Fitness',
  'health': 'Health & Fitness',
  'fitness': 'Health & Fitness',
  'medical': 'Health & Fitness',
  'education': 'Education',
  'books & reference': 'Education',
  'reference': 'Education',
  'entertainment': 'Entertainment',
  'video players & editors': 'Entertainment',
  'video': 'Entertainment',
  'comics': 'Entertainment',
  'shopping': 'Shopping',
  'food & drink': 'Food & Drink',
  'food': 'Food & Drink',
  'restaurants': 'Food & Drink',
  'weather': 'Weather',
  'sports': 'Sports',
  'music & audio': 'Music & Audio',
  'music': 'Music & Audio',
  'audio': 'Music & Audio',
  'beauty': 'Beauty',
  'business': 'Business',
  'productivity': 'Business',
  'game': 'Games',
  'games': 'Games',
  'arcade': 'Games',
  'puzzle': 'Games',
  'casual': 'Games',
  'action': 'Games',
  'strategy': 'Games',
  'racing': 'Games',
  'role playing': 'Games',
  'simulation': 'Games',
  'sports game': 'Games',
  'word': 'Games',
  'board': 'Games',
  'card': 'Games',
  'trivia': 'Games',
  'educational game': 'Games',
  'news & magazines': 'News & Magazines',
  'news': 'News & Magazines',
  'magazines': 'News & Magazines',
};

/**
 * Normalizes any Play Store genre string to a canonical category.
 * Performs exact match, then substring match, then falls back to 'Tools'.
 */
export function normalizeCategory(genre: string): CanonicalCategory {
  if (!genre) return 'Tools';
  const lower = genre.toLowerCase().trim();

  // 1. Exact match
  if (PLAY_STORE_GENRE_MAP[lower]) return PLAY_STORE_GENRE_MAP[lower];

  // 2. Substring match: Play Store label may be longer (e.g. "Action & Adventure")
  const key = Object.keys(PLAY_STORE_GENRE_MAP).find(
    k => lower.includes(k) || k.includes(lower)
  );
  return key ? PLAY_STORE_GENRE_MAP[key] : 'Tools';
}

// ============================================================
// EXPECTED PERMISSIONS PER CANONICAL CATEGORY
// Unified source of truth — every analysis module reads from here.
// ============================================================
export const PERMISSIONS_DB: Record<CanonicalCategory, CategoryPermissions> = {
  'Social Media': {
    category: 'Social Media',
    expectedPermissions: [
      'INTERNET', 'CAMERA', 'RECORD_AUDIO', 'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE', 'ACCESS_NETWORK_STATE', 'VIBRATE',
    ],
    description: 'Social apps need camera, audio, and storage for content creation.',
  },
  'Messaging': {
    category: 'Messaging',
    expectedPermissions: [
      'INTERNET', 'READ_CONTACTS', 'RECORD_AUDIO', 'CAMERA',
      'ACCESS_NETWORK_STATE', 'READ_PHONE_STATE', 'VIBRATE', 'WAKE_LOCK',
      'READ_SMS', 'WRITE_SMS',
    ],
    description: 'Messaging and calling apps require contacts, audio, and SMS access.',
  },
  'Maps & Navigation': {
    category: 'Maps & Navigation',
    expectedPermissions: [
      'INTERNET', 'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION',
      'ACCESS_NETWORK_STATE', 'WAKE_LOCK',
    ],
    description: 'Navigation apps strictly require high-accuracy location data.',
  },
  'Travel & Local': {
    category: 'Travel & Local',
    expectedPermissions: [
      'INTERNET', 'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION',
      'ACCESS_NETWORK_STATE', 'CAMERA', 'READ_EXTERNAL_STORAGE',
    ],
    description: 'Travel and local guide apps require location data and internet access.',
  },
  'Photography': {
    category: 'Photography',
    expectedPermissions: [
      'CAMERA', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE',
      'INTERNET', 'ACCESS_NETWORK_STATE', 'ACCESS_FINE_LOCATION',
    ],
    description: 'Photo apps need camera, gallery storage, and geo-tagging.',
  },
  'Finance': {
    category: 'Finance',
    expectedPermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'USE_BIOMETRIC', 'CAMERA', 'READ_PHONE_STATE',
    ],
    description: 'Financial apps use biometric auth, camera for QR/deposits, and device ID for fraud prevention.',
  },
  'Tools': {
    category: 'Tools',
    expectedPermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'VIBRATE', 'WAKE_LOCK',
    ],
    description: 'Basic tools should have minimal permissions.',
  },
  'Lifestyle': {
    category: 'Lifestyle',
    expectedPermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE', 'ACCESS_COARSE_LOCATION',
    ],
    description: 'Lifestyle apps need media access and approximate location for local services.',
  },
  'Health & Fitness': {
    category: 'Health & Fitness',
    expectedPermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'ACCESS_FINE_LOCATION',
      'BLUETOOTH', 'USE_BIOMETRIC', 'READ_CALENDAR', 'BODY_SENSORS',
    ],
    description: 'Health apps need location for run tracking and Bluetooth for wearables.',
  },
  'Education': {
    category: 'Education',
    expectedPermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'WAKE_LOCK', 'CAMERA', 'RECORD_AUDIO',
    ],
    description: 'Educational apps need internet and may use camera/mic for interactive content.',
  },
  'Entertainment': {
    category: 'Entertainment',
    expectedPermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'WAKE_LOCK', 'VIBRATE',
      'READ_EXTERNAL_STORAGE',
    ],
    description: 'Streaming and media apps need internet and wake lock.',
  },
  'Shopping': {
    category: 'Shopping',
    expectedPermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'CAMERA', 'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE', 'ACCESS_COARSE_LOCATION',
    ],
    description: 'Shopping apps use camera for scanning barcodes and location for delivery.',
  },
  'Food & Drink': {
    category: 'Food & Drink',
    expectedPermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION', 'CAMERA',
    ],
    description: 'Food apps need precise location for delivery and camera for food photos.',
  },
  'Weather': {
    category: 'Weather',
    expectedPermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION',
    ],
    description: 'Weather apps need location for local forecasts.',
  },
  'Sports': {
    category: 'Sports',
    expectedPermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'WAKE_LOCK',
    ],
    description: 'Sports apps need internet for live scores and updates.',
  },
  'Music & Audio': {
    category: 'Music & Audio',
    expectedPermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'WAKE_LOCK', 'RECORD_AUDIO',
      'READ_EXTERNAL_STORAGE',
    ],
    description: 'Music apps need internet, audio recording for voice features, and storage for offline content.',
  },
  'Beauty': {
    category: 'Beauty',
    expectedPermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'CAMERA', 'READ_EXTERNAL_STORAGE',
    ],
    description: 'Beauty apps use AR try-on features requiring the camera.',
  },
  'Business': {
    category: 'Business',
    expectedPermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'CAMERA', 'RECORD_AUDIO',
      'READ_CONTACTS', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE',
    ],
    description: 'Business apps need camera and microphone for meetings.',
  },
  'Games': {
    category: 'Games',
    expectedPermissions: [
      'INTERNET', 'VIBRATE', 'WAKE_LOCK', 'ACCESS_NETWORK_STATE',
    ],
    description: 'Games need internet for multiplayer and wake lock to stay active.',
  },
  'News & Magazines': {
    category: 'News & Magazines',
    expectedPermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'WAKE_LOCK',
    ],
    description: 'News apps need internet access for content delivery.',
  },
};

/**
 * Returns the set of expected technical permission names for the given genre/category.
 * Category is normalized automatically.
 */
export const getExpectedPermissions = (category: string): string[] => {
  const canonical = normalizeCategory(category);
  return PERMISSIONS_DB[canonical]?.expectedPermissions || [];
};

// ============================================================
// SENSITIVE PERMISSIONS — Risk Classification
// ============================================================
export const SENSITIVE_PERMISSIONS: Record<string, string> = {
  // High Risk
  'ACCESS_FINE_LOCATION': 'High Risk',
  'ACCESS_COARSE_LOCATION': 'High Risk',
  'CAMERA': 'High Risk',
  'RECORD_AUDIO': 'High Risk',
  'READ_CONTACTS': 'High Risk',
  'WRITE_CONTACTS': 'High Risk',
  'GET_ACCOUNTS': 'High Risk',
  'READ_SMS': 'High Risk',
  'SEND_SMS': 'High Risk',
  'WRITE_SMS': 'High Risk',
  'READ_CALL_LOG': 'High Risk',
  'WRITE_CALL_LOG': 'High Risk',
  'READ_PHONE_STATE': 'High Risk',
  'CALL_PHONE': 'High Risk',
  'SYSTEM_ALERT_WINDOW': 'High Risk',
  'PROCESS_OUTGOING_CALLS': 'High Risk',
  'READ_CALENDAR': 'High Risk',
  'WRITE_CALENDAR': 'High Risk',
  'BODY_SENSORS': 'High Risk',

  // Review Needed
  'READ_EXTERNAL_STORAGE': 'Review Needed',
  'WRITE_EXTERNAL_STORAGE': 'Review Needed',
  'BLUETOOTH': 'Review Needed',
  'BLUETOOTH_ADMIN': 'Review Needed',
  'BLUETOOTH_SCAN': 'Review Needed',
  'BLUETOOTH_CONNECT': 'Review Needed',
  'ACCESS_WIFI_STATE': 'Review Needed',
  'CHANGE_WIFI_STATE': 'Review Needed',
  'NFC': 'Review Needed',
  'USE_BIOMETRIC': 'Review Needed',
  'USE_FINGERPRINT': 'Review Needed',
  'POST_NOTIFICATIONS': 'Review Needed',

  // Safe
  'INTERNET': 'Safe',
  'ACCESS_NETWORK_STATE': 'Safe',
  'VIBRATE': 'Safe',
  'WAKE_LOCK': 'Safe',
  'RECEIVE_BOOT_COMPLETED': 'Safe',
  'FOREGROUND_SERVICE': 'Safe',
  'CHANGE_NETWORK_STATE': 'Safe',
};

/**
 * Finds the canonical SENSITIVE_PERMISSIONS key for a raw permission string.
 * Uses strict exact and suffix matching only — no loose word matching.
 */
export function findBasePermission(pName: string): string | undefined {
  if (!pName) return undefined;
  const upper = pName.toUpperCase().trim();

  // 1. Exact match
  if (SENSITIVE_PERMISSIONS[upper]) return upper;

  // 2. Strip Android namespace prefix: "android.permission.CAMERA" → "CAMERA"
  const dotParts = upper.split('.');
  const suffix = dotParts[dotParts.length - 1];
  if (suffix && SENSITIVE_PERMISSIONS[suffix]) return suffix;

  // 3. Strict prefix match only: the raw name starts with a known key (or vice versa)
  //    e.g. "ACCESS_BACKGROUND_LOCATION" starts with "ACCESS_FINE_LOCATION"? No — 
  //    but "ACCESS_FINE_LOCATION_REDUCED_ACCURACY" starts with "ACCESS_FINE_LOCATION"
  const prefixMatch = Object.keys(SENSITIVE_PERMISSIONS).find(
    sp => upper.startsWith(sp) || sp.startsWith(upper)
  );
  return prefixMatch;
}
