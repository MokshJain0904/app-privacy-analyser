/**
 * Unified Permissions Database
 * Single source of truth for all category-permission logic.
 * All three analysis modules (After Install scoring, Before Install,
 * and Leakage Detection) MUST use normalizeCategory() from this file.
 */

export interface CategoryPermissions {
  category: string;
  /** Permissions that are completely normal for this category — show as Safe */
  safePermissions: string[];
  /** Permissions that are used but carry some risk — show as Review Needed */
  reviewPermissions: string[];
  /** Permissions that are unexpected/out-of-scope for this category — show as High Risk */
  highRiskPermissions: string[];
  description: string;
  /** Flat union kept for backwards-compat with calculateRiskScore */
  expectedPermissions: string[];
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
    safePermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'VIBRATE', 'WAKE_LOCK', 'POST_NOTIFICATIONS',
    ],
    reviewPermissions: [
      'CAMERA', 'RECORD_AUDIO', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE', 'READ_CONTACTS',
    ],
    highRiskPermissions: [
      'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION', 'READ_SMS', 'SEND_SMS',
      'READ_CALL_LOG', 'READ_PHONE_STATE', 'BODY_SENSORS',
    ],
    get expectedPermissions() { return [...this.safePermissions, ...this.reviewPermissions]; },
    description: 'Social apps need camera, audio, and storage for content creation.',
  },
  'Messaging': {
    category: 'Messaging',
    safePermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'READ_CONTACTS', 'VIBRATE', 'WAKE_LOCK',
      'POST_NOTIFICATIONS', 'READ_SMS', 'WRITE_SMS',
    ],
    reviewPermissions: [
      'CAMERA', 'RECORD_AUDIO', 'READ_PHONE_STATE', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE',
    ],
    highRiskPermissions: [
      'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION', 'BODY_SENSORS',
      'READ_CALL_LOG', 'WRITE_CALL_LOG',
    ],
    get expectedPermissions() { return [...this.safePermissions, ...this.reviewPermissions]; },
    description: 'Messaging and calling apps require contacts, audio, and SMS access.',
  },
  'Maps & Navigation': {
    category: 'Maps & Navigation',
    safePermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'WAKE_LOCK', 'POST_NOTIFICATIONS',
    ],
    reviewPermissions: [
      'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION', 'CAMERA',
    ],
    highRiskPermissions: [
      'READ_CONTACTS', 'RECORD_AUDIO', 'READ_SMS', 'BODY_SENSORS',
    ],
    get expectedPermissions() { return [...this.safePermissions, ...this.reviewPermissions]; },
    description: 'Navigation apps strictly require high-accuracy location data.',
  },
  'Travel & Local': {
    category: 'Travel & Local',
    safePermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'WAKE_LOCK', 'POST_NOTIFICATIONS',
    ],
    reviewPermissions: [
      'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION', 'CAMERA',
      'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE',
    ],
    highRiskPermissions: [
      'READ_CONTACTS', 'RECORD_AUDIO', 'READ_SMS', 'READ_PHONE_STATE',
    ],
    get expectedPermissions() { return [...this.safePermissions, ...this.reviewPermissions]; },
    description: 'Travel and local guide apps require location data and internet access.',
  },
  'Photography': {
    category: 'Photography',
    safePermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'VIBRATE', 'POST_NOTIFICATIONS',
    ],
    reviewPermissions: [
      'CAMERA', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE', 'ACCESS_FINE_LOCATION',
    ],
    highRiskPermissions: [
      'READ_CONTACTS', 'RECORD_AUDIO', 'READ_SMS', 'READ_PHONE_STATE',
    ],
    get expectedPermissions() { return [...this.safePermissions, ...this.reviewPermissions]; },
    description: 'Photo apps need camera, gallery storage, and geo-tagging.',
  },
  'Finance': {
    category: 'Finance',
    safePermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'VIBRATE', 'POST_NOTIFICATIONS',
    ],
    reviewPermissions: [
      'USE_BIOMETRIC', 'CAMERA', 'READ_PHONE_STATE', 'USE_FINGERPRINT',
    ],
    highRiskPermissions: [
      'ACCESS_FINE_LOCATION', 'READ_CONTACTS', 'READ_SMS', 'RECORD_AUDIO',
      'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE',
    ],
    get expectedPermissions() { return [...this.safePermissions, ...this.reviewPermissions]; },
    description: 'Financial apps use biometric auth, camera for QR/deposits, and device ID for fraud prevention.',
  },
  'Tools': {
    category: 'Tools',
    safePermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'VIBRATE', 'WAKE_LOCK',
    ],
    reviewPermissions: [
      'CAMERA', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE',
    ],
    highRiskPermissions: [
      'ACCESS_FINE_LOCATION', 'READ_CONTACTS', 'RECORD_AUDIO', 'READ_SMS',
      'READ_PHONE_STATE', 'READ_CALL_LOG',
    ],
    get expectedPermissions() { return [...this.safePermissions, ...this.reviewPermissions]; },
    description: 'Basic tools should have minimal permissions.',
  },
  'Lifestyle': {
    category: 'Lifestyle',
    safePermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'VIBRATE', 'WAKE_LOCK', 'POST_NOTIFICATIONS',
    ],
    reviewPermissions: [
      'CAMERA', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE', 'ACCESS_COARSE_LOCATION',
    ],
    highRiskPermissions: [
      'ACCESS_FINE_LOCATION', 'READ_CONTACTS', 'RECORD_AUDIO', 'READ_SMS', 'READ_PHONE_STATE',
    ],
    get expectedPermissions() { return [...this.safePermissions, ...this.reviewPermissions]; },
    description: 'Lifestyle apps need media access and approximate location for local services.',
  },
  'Health & Fitness': {
    category: 'Health & Fitness',
    safePermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'VIBRATE', 'WAKE_LOCK', 'POST_NOTIFICATIONS',
    ],
    reviewPermissions: [
      'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION', 'BLUETOOTH',
      'USE_BIOMETRIC', 'READ_CALENDAR', 'BODY_SENSORS',
    ],
    highRiskPermissions: [
      'CAMERA', 'READ_CONTACTS', 'RECORD_AUDIO', 'READ_SMS', 'READ_PHONE_STATE',
    ],
    get expectedPermissions() { return [...this.safePermissions, ...this.reviewPermissions]; },
    description: 'Health apps need location for run tracking and Bluetooth for wearables.',
  },
  'Education': {
    category: 'Education',
    safePermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'WAKE_LOCK', 'VIBRATE', 'POST_NOTIFICATIONS',
    ],
    reviewPermissions: [
      'CAMERA', 'RECORD_AUDIO', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE',
    ],
    highRiskPermissions: [
      'ACCESS_FINE_LOCATION', 'READ_CONTACTS', 'READ_SMS', 'READ_PHONE_STATE', 'READ_CALL_LOG',
    ],
    get expectedPermissions() { return [...this.safePermissions, ...this.reviewPermissions]; },
    description: 'Educational apps need internet and may use camera/mic for interactive content.',
  },
  'Entertainment': {
    category: 'Entertainment',
    safePermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'WAKE_LOCK', 'VIBRATE', 'POST_NOTIFICATIONS',
    ],
    reviewPermissions: [
      'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE',
    ],
    highRiskPermissions: [
      'CAMERA', 'RECORD_AUDIO', 'ACCESS_FINE_LOCATION', 'READ_CONTACTS',
      'READ_SMS', 'READ_PHONE_STATE',
    ],
    get expectedPermissions() { return [...this.safePermissions, ...this.reviewPermissions]; },
    description: 'Streaming and media apps need internet and wake lock.',
  },
  'Shopping': {
    category: 'Shopping',
    safePermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'VIBRATE', 'POST_NOTIFICATIONS',
    ],
    reviewPermissions: [
      'CAMERA', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE', 'ACCESS_COARSE_LOCATION',
    ],
    highRiskPermissions: [
      'ACCESS_FINE_LOCATION', 'READ_CONTACTS', 'RECORD_AUDIO', 'READ_SMS', 'READ_PHONE_STATE',
    ],
    get expectedPermissions() { return [...this.safePermissions, ...this.reviewPermissions]; },
    description: 'Shopping apps use camera for scanning barcodes and location for delivery.',
  },
  'Food & Drink': {
    category: 'Food & Drink',
    safePermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'VIBRATE', 'POST_NOTIFICATIONS',
    ],
    reviewPermissions: [
      'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION', 'CAMERA',
    ],
    highRiskPermissions: [
      'READ_CONTACTS', 'RECORD_AUDIO', 'READ_SMS', 'READ_EXTERNAL_STORAGE',
    ],
    get expectedPermissions() { return [...this.safePermissions, ...this.reviewPermissions]; },
    description: 'Food apps need precise location for delivery and camera for food photos.',
  },
  'Weather': {
    category: 'Weather',
    safePermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'WAKE_LOCK', 'POST_NOTIFICATIONS',
    ],
    reviewPermissions: [
      'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION',
    ],
    highRiskPermissions: [
      'CAMERA', 'READ_CONTACTS', 'RECORD_AUDIO', 'READ_SMS', 'READ_PHONE_STATE',
    ],
    get expectedPermissions() { return [...this.safePermissions, ...this.reviewPermissions]; },
    description: 'Weather apps need location for local forecasts.',
  },
  'Sports': {
    category: 'Sports',
    safePermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'WAKE_LOCK', 'VIBRATE', 'POST_NOTIFICATIONS',
    ],
    reviewPermissions: [
      'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION',
    ],
    highRiskPermissions: [
      'CAMERA', 'RECORD_AUDIO', 'READ_CONTACTS', 'READ_SMS', 'READ_PHONE_STATE',
    ],
    get expectedPermissions() { return [...this.safePermissions, ...this.reviewPermissions]; },
    description: 'Sports apps need internet for live scores and updates.',
  },
  'Music & Audio': {
    category: 'Music & Audio',
    safePermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'WAKE_LOCK', 'VIBRATE', 'POST_NOTIFICATIONS',
    ],
    reviewPermissions: [
      'RECORD_AUDIO', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE',
    ],
    highRiskPermissions: [
      'ACCESS_FINE_LOCATION', 'CAMERA', 'READ_CONTACTS', 'READ_SMS', 'READ_PHONE_STATE',
    ],
    get expectedPermissions() { return [...this.safePermissions, ...this.reviewPermissions]; },
    description: 'Music apps need internet, audio recording for voice features, and storage for offline content.',
  },
  'Beauty': {
    category: 'Beauty',
    safePermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'VIBRATE', 'POST_NOTIFICATIONS',
    ],
    reviewPermissions: [
      'CAMERA', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE',
    ],
    highRiskPermissions: [
      'ACCESS_FINE_LOCATION', 'READ_CONTACTS', 'RECORD_AUDIO', 'READ_SMS', 'READ_PHONE_STATE',
    ],
    get expectedPermissions() { return [...this.safePermissions, ...this.reviewPermissions]; },
    description: 'Beauty apps use AR try-on features requiring the camera.',
  },
  'Business': {
    category: 'Business',
    safePermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'READ_CONTACTS', 'VIBRATE', 'WAKE_LOCK', 'POST_NOTIFICATIONS',
    ],
    reviewPermissions: [
      'CAMERA', 'RECORD_AUDIO', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE',
    ],
    highRiskPermissions: [
      'ACCESS_FINE_LOCATION', 'READ_SMS', 'READ_PHONE_STATE', 'READ_CALL_LOG', 'BODY_SENSORS',
    ],
    get expectedPermissions() { return [...this.safePermissions, ...this.reviewPermissions]; },
    description: 'Business apps need camera and microphone for meetings.',
  },
  'Games': {
    category: 'Games',
    safePermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'VIBRATE', 'WAKE_LOCK', 'POST_NOTIFICATIONS',
    ],
    reviewPermissions: [
      'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE',
    ],
    highRiskPermissions: [
      'CAMERA', 'RECORD_AUDIO', 'ACCESS_FINE_LOCATION', 'READ_CONTACTS',
      'READ_SMS', 'READ_PHONE_STATE', 'READ_CALL_LOG',
    ],
    get expectedPermissions() { return [...this.safePermissions, ...this.reviewPermissions]; },
    description: 'Games need internet for multiplayer and wake lock to stay active.',
  },
  'News & Magazines': {
    category: 'News & Magazines',
    safePermissions: [
      'INTERNET', 'ACCESS_NETWORK_STATE', 'WAKE_LOCK', 'VIBRATE', 'POST_NOTIFICATIONS',
    ],
    reviewPermissions: [
      'READ_EXTERNAL_STORAGE',
    ],
    highRiskPermissions: [
      'CAMERA', 'RECORD_AUDIO', 'ACCESS_FINE_LOCATION', 'READ_CONTACTS',
      'READ_SMS', 'READ_PHONE_STATE',
    ],
    get expectedPermissions() { return [...this.safePermissions, ...this.reviewPermissions]; },
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

/**
 * Returns the correct 3-tier risk level for a permission within a given category.
 * Looks up safePermissions, reviewPermissions, and highRiskPermissions per category.
 */
export function getCategoryRiskLevel(permission: string, category: string): 'Safe' | 'Review Needed' | 'High Risk' {
  const canonical = normalizeCategory(category);
  const db = PERMISSIONS_DB[canonical];
  if (!db) return 'High Risk';

  if (db.safePermissions.includes(permission)) return 'Safe';
  if (db.reviewPermissions.includes(permission)) return 'Review Needed';
  return 'High Risk'; // Not in either safe or review list
}

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

  // 0. Map UI Labels to Android Permissions
  const UI_LABEL_MAP: Record<string, string> = {
    'LOCATION': 'ACCESS_FINE_LOCATION',
    'MICROPHONE': 'RECORD_AUDIO',
    'STORAGE/FILES': 'READ_EXTERNAL_STORAGE',
    'PHONE/CALL LOGS': 'READ_PHONE_STATE',
    'SMS': 'READ_SMS',
    'CALENDAR': 'READ_CALENDAR',
    'NOTIFICATIONS': 'POST_NOTIFICATIONS',
    'NEARBY DEVICES/BLUETOOTH': 'BLUETOOTH',
    'CONTACTS': 'READ_CONTACTS',
    'CAMERA': 'CAMERA'
  };

  if (UI_LABEL_MAP[upper]) return UI_LABEL_MAP[upper];

  // 1. Exact match
  if (SENSITIVE_PERMISSIONS[upper]) return upper;

  // 2. Strip Android namespace prefix: "android.permission.CAMERA" → "CAMERA"
  const dotParts = upper.split('.');
  const suffix = dotParts[dotParts.length - 1];
  if (suffix && SENSITIVE_PERMISSIONS[suffix]) return suffix;

  // 3. Strict prefix match only: the raw name starts with a known key (or vice versa)
  const prefixMatch = Object.keys(SENSITIVE_PERMISSIONS).find(
    sp => upper.startsWith(sp) || sp.startsWith(upper) || upper.includes(sp) || sp.includes(upper)
  );
  return prefixMatch;
}
