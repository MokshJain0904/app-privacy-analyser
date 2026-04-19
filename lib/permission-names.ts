/**
 * Permission Name Mapping
 * Converts technical Android permission names to user-friendly display names
 */

export type UserFriendlyPermissionName = 
  | 'Location'
  | 'Camera'
  | 'Microphone'
  | 'Contacts'
  | 'Storage'
  | 'Phone Logs'
  | 'SMS'
  | 'Calendar'
  | 'Notifications'
  | 'Bluetooth'
  | 'Nearby Devices'
  | 'Biometric'
  | 'Internet'
  | 'Vibration'
  | 'Keep Awake';

export interface PermissionMapping {
  userFriendly: UserFriendlyPermissionName;
  technical: string[];
  icon: string;
  description: string;
}

export const PERMISSION_MAPPING: Record<UserFriendlyPermissionName, PermissionMapping> = {
  'Location': {
    userFriendly: 'Location',
    technical: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
    icon: '📍',
    description: 'Precise GPS tracking and approximate location'
  },
  'Camera': {
    userFriendly: 'Camera',
    technical: ['CAMERA'],
    icon: '📷',
    description: 'Access to phone camera for photos and videos'
  },
  'Microphone': {
    userFriendly: 'Microphone',
    technical: ['RECORD_AUDIO'],
    icon: '🎤',
    description: 'Access to microphone for audio recording'
  },
  'Contacts': {
    userFriendly: 'Contacts',
    technical: ['READ_CONTACTS', 'WRITE_CONTACTS'],
    icon: '👥',
    description: 'Access to your contact list and phone numbers'
  },
  'Storage': {
    userFriendly: 'Storage',
    technical: ['READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE'],
    icon: '💾',
    description: 'Access to photos, documents, and files on your phone'
  },
  'Phone Logs': {
    userFriendly: 'Phone Logs',
    technical: ['READ_CALL_LOG', 'READ_PHONE_STATE'],
    icon: '☎️',
    description: 'Access to your call history and phone state'
  },
  'SMS': {
    userFriendly: 'SMS',
    technical: ['READ_SMS', 'SEND_SMS', 'WRITE_SMS'],
    icon: '📱',
    description: 'Access to text messages and ability to send SMS'
  },
  'Calendar': {
    userFriendly: 'Calendar',
    technical: ['READ_CALENDAR', 'WRITE_CALENDAR'],
    icon: '📅',
    description: 'Access to your calendar events and schedules'
  },
  'Notifications': {
    userFriendly: 'Notifications',
    technical: ['POST_NOTIFICATIONS'],
    icon: '🔔',
    description: 'Permission to send you notifications'
  },
  'Bluetooth': {
    userFriendly: 'Bluetooth',
    technical: ['BLUETOOTH', 'BLUETOOTH_ADMIN'],
    icon: '🔵',
    description: 'Connect to and control Bluetooth devices'
  },
  'Nearby Devices': {
    userFriendly: 'Nearby Devices',
    technical: ['NEARBY_WIFI_DEVICES'],
    icon: '📡',
    description: 'Scan for and connect to nearby WiFi and Bluetooth devices'
  },
  'Biometric': {
    userFriendly: 'Biometric',
    technical: ['USE_BIOMETRIC'],
    icon: '🔐',
    description: 'Use fingerprint or face recognition for authentication'
  },
  'Internet': {
    userFriendly: 'Internet',
    technical: ['INTERNET', 'ACCESS_NETWORK_STATE'],
    icon: '🌐',
    description: 'Connect to internet and check network status'
  },
  'Vibration': {
    userFriendly: 'Vibration',
    technical: ['VIBRATE'],
    icon: '📳',
    description: 'Control phone vibration'
  },
  'Keep Awake': {
    userFriendly: 'Keep Awake',
    technical: ['WAKE_LOCK'],
    icon: '⚡',
    description: 'Keep screen or processor active'
  },
};

/**
 * Convert technical permission name to user-friendly name
 */
export function getTechnicalToUserFriendly(technicalName: string): UserFriendlyPermissionName | null {
  for (const [userFriendly, mapping] of Object.entries(PERMISSION_MAPPING)) {
    if (mapping.technical.includes(technicalName)) {
      return userFriendly as UserFriendlyPermissionName;
    }
  }
  return null;
}

/**
 * Get all technical names for a user-friendly permission
 */
export function getUserFriendlyToTechnical(userFriendly: UserFriendlyPermissionName): string[] {
  return PERMISSION_MAPPING[userFriendly]?.technical || [];
}

/**
 * Convert list of technical permissions to user-friendly unique permissions
 */
export function convertTechnicalPermissionsToUserFriendly(
  technicalPermissions: string[]
): UserFriendlyPermissionName[] {
  const userFriendlySet = new Set<UserFriendlyPermissionName>();

  technicalPermissions.forEach(tech => {
    const userFriendly = getTechnicalToUserFriendly(tech);
    if (userFriendly) {
      userFriendlySet.add(userFriendly);
    }
  });

  return Array.from(userFriendlySet);
}

/**
 * Get icon for user-friendly permission
 */
export function getPermissionIcon(permission: UserFriendlyPermissionName): string {
  return PERMISSION_MAPPING[permission]?.icon || '❓';
}

/**
 * Get description for user-friendly permission
 */
export function getPermissionDescription(permission: UserFriendlyPermissionName): string {
  return PERMISSION_MAPPING[permission]?.description || '';
}

// Map for old UI permissions grid
export const USER_FRIENDLY_PERMISSIONS = [
  { id: 'location', label: 'Location', friendly: 'Location' },
  { id: 'camera', label: 'Camera', friendly: 'Camera' },
  { id: 'microphone', label: 'Microphone', friendly: 'Microphone' },
  { id: 'contacts', label: 'Contacts', friendly: 'Contacts' },
  { id: 'storage', label: 'Storage', friendly: 'Storage' },
  { id: 'phone', label: 'Phone Logs', friendly: 'Phone Logs' },
  { id: 'sms', label: 'SMS', friendly: 'SMS' },
  { id: 'calendar', label: 'Calendar', friendly: 'Calendar' },
  { id: 'notifications', label: 'Notifications', friendly: 'Notifications' },
  { id: 'bluetooth', label: 'Bluetooth', friendly: 'Bluetooth' },
  { id: 'nearby', label: 'Nearby Devices', friendly: 'Nearby Devices' },
];
