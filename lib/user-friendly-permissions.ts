// User-friendly permission explanations
import { UserFriendlyPermissionName } from './permission-names';

export interface UserFriendlyPermissionInfo {
  name: UserFriendlyPermissionName;
  riskScore: number;
  whatItDoes: string;
  whatItCanAccess: string[];
  risks: string[];
  commonUses: string[];
  redFlags: string[];
}

export const USER_FRIENDLY_PERMISSION_EXPLANATIONS: Record<UserFriendlyPermissionName, UserFriendlyPermissionInfo> = {
  'Location': {
    name: 'Location',
    riskScore: 85,
    whatItDoes: 'Can determine your exact GPS location or approximate location based on WiFi and cell towers',
    whatItCanAccess: [
      'Your current GPS coordinates (within 5-10 meters)',
      'Your location history when app is running',
      'Your home address (if determinable)',
      'Your work address (if identifiable)',
      'Everywhere you travel'
    ],
    risks: [
      'Real-time tracking of your movements',
      'Battery drain from constant GPS use',
      'Could reveal sensitive locations (hospitals, protests, etc)',
      'Enables stalking or harassment',
      'Could be sold to advertisers or insurance companies',
      'Privacy violation'
    ],
    commonUses: [
      'Maps and navigation apps',
      'Ride-sharing apps like Uber',
      'Weather apps for local forecasts',
      'Location-based games'
    ],
    redFlags: [
      'Social media app (Facebook, Instagram) asking for location',
      'Flashlight app requesting location',
      'Utility apps wanting location',
      'Any app asking for "always" background location'
    ]
  },

  'Camera': {
    name: 'Camera',
    riskScore: 60,
    whatItDoes: 'Can access your phone\'s camera to take photos or videos',
    whatItCanAccess: [
      'What\'s currently in front of your camera',
      'Ability to take photos/videos without UI prompt',
      'Your face and surroundings',
      'Potentially access to front-facing camera'
    ],
    risks: [
      'Could take photos/videos without your knowledge',
      'Could capture sensitive moments',
      'Could see what\'s in your room/surroundings',
      'Potential for harassment or blackmail',
      'Could access front-facing camera to see you'
    ],
    commonUses: [
      'Video calling apps (WhatsApp, Messenger)',
      'Camera apps for photos',
      'Video recording apps',
      'Social media apps for stories/videos'
    ],
    redFlags: [
      'Game requesting camera access',
      'Flashlight app wanting camera',
      'Utility apps requesting camera',
      'Apps requesting both camera and microphone'
    ]
  },

  'Microphone': {
    name: 'Microphone',
    riskScore: 80,
    whatItDoes: 'Can access your phone\'s microphone and record audio from your surroundings',
    whatItCanAccess: [
      'All sounds from your phone\'s microphone',
      'Conversations you have near your phone',
      'Ambient sounds from your environment',
      'Voice commands you give other apps'
    ],
    risks: [
      'Could secretly record conversations',
      'Privacy invasion - could record you without knowledge',
      'Could capture sensitive information discussed near phone',
      'Could record intimate moments',
      'Violates wiretapping laws if misused'
    ],
    commonUses: [
      'Calling apps like WhatsApp for voice calls',
      'Voice message apps',
      'Video recording apps',
      'Voice assistant apps'
    ],
    redFlags: [
      'Game requesting microphone access',
      'Utility app wanting to record audio',
      'Any background-always recording permission'
    ]
  },

  'Contacts': {
    name: 'Contacts',
    riskScore: 95,
    whatItDoes: 'Can access your entire contact list - all phone numbers, emails, and names you\'ve saved',
    whatItCanAccess: [
      'All contact names and phone numbers',
      'Email addresses',
      'Contact groups',
      'Birthday information',
      'Custom notes about contacts'
    ],
    risks: [
      'Could sell contact list to advertisers or data brokers',
      'Could use for phishing or social engineering',
      'Could leak personal network information',
      'Enables spam/unwanted contact from companies'
    ],
    commonUses: [
      'Messaging apps to suggest friends',
      'Calling apps to show contacts',
      'Email apps to auto-complete addresses'
    ],
    redFlags: [
      'Flashlight app requesting contacts',
      'Calculator asking for contacts',
      'Game requesting this permission'
    ]
  },

  'Storage': {
    name: 'Storage',
    riskScore: 65,
    whatItDoes: 'Can access all files on your phone: photos, videos, documents, downloads, etc.',
    whatItCanAccess: [
      'All photos and videos',
      'Documents (PDFs, Word, etc)',
      'Downloaded files',
      'Audio files and music',
      'Any file in storage'
    ],
    risks: [
      'Could access sensitive documents',
      'Could copy personal photos',
      'Could extract confidential data',
      'Could find financial or medical records',
      'Access to private videos'
    ],
    commonUses: [
      'Photo editing apps',
      'Media players for music/videos',
      'Social media apps to upload photos',
      'File managers'
    ],
    redFlags: [
      'Apps that don\'t need file access (games, utilities)',
      'Requesting access to everything, not just photos'
    ]
  },

  'Phone Logs': {
    name: 'Phone Logs',
    riskScore: 80,
    whatItDoes: 'Can see the history of all phone calls you\'ve made and received',
    whatItCanAccess: [
      'Phone numbers of all calls',
      'Call duration for each call',
      'Time and date of each call',
      'Whether calls were incoming or outgoing',
      'Complete call history'
    ],
    risks: [
      'Reveals who you talk to most frequently',
      'Could identify important people in your life',
      'Could track communication patterns',
      'Violates communication privacy',
      'Could expose business relationships'
    ],
    commonUses: [
      'Phone/dialer apps to display recent calls',
      'Call recording apps',
      'Emergency apps'
    ],
    redFlags: [
      'Any non-phone app requesting this',
      'Messaging apps wanting call logs',
      'Social media apps requesting this'
    ]
  },

  'SMS': {
    name: 'SMS',
    riskScore: 90,
    whatItDoes: 'Can read all your text messages and send SMS on your behalf',
    whatItCanAccess: [
      'All text messages you received',
      'All text messages you sent',
      'Message timestamps',
      'Sender/recipient information',
      'Message attachments',
      'Ability to send texts to premium numbers'
    ],
    risks: [
      'Access to sensitive personal information',
      'Could intercept security codes',
      'Privacy invasion of personal communications',
      'Could be used for blackmail or extortion',
      'Exposes business communications',
      'Could rack up huge bills sending to premium numbers'
    ],
    commonUses: [
      'Default SMS app to display messages',
      'Messaging apps that support SMS backup'
    ],
    redFlags: [
      'Social media app requesting SMS access',
      'Game asking to read messages',
      'Utility app wanting SMS access',
      'Any non-messaging app requesting this'
    ]
  },

  'Calendar': {
    name: 'Calendar',
    riskScore: 50,
    whatItDoes: 'Can see all your calendar events, dates, and meeting details',
    whatItCanAccess: [
      'All calendar events',
      'Event titles and descriptions',
      'Meeting locations',
      'Attendee information',
      'Event times and dates'
    ],
    risks: [
      'Could reveal your schedule and availability',
      'Could identify important meetings or appointments',
      'Could reveal medical appointments or procedures',
      'Privacy of your time management'
    ],
    commonUses: [
      'Calendar apps like Google Calendar',
      'Email apps with calendar integration',
      'Meeting/scheduling apps'
    ],
    redFlags: [
      'Social media apps requesting calendar access',
      'Games wanting to read your calendar',
      'Utility apps needing calendar'
    ]
  },

  'Notifications': {
    name: 'Notifications',
    riskScore: 15,
    whatItDoes: 'Permission to send you notifications on your phone',
    whatItCanAccess: [
      'Ability to send notification popups',
      'Notification sound and vibration',
      'Notification content visible on lock screen'
    ],
    risks: [
      'Could spam you with notifications',
      'Could send misleading or phishing notifications',
      'Generally low privacy risk'
    ],
    commonUses: [
      'Most apps use this for reminders and updates',
      'Social media apps for notifications',
      'Messaging apps for message alerts'
    ],
    redFlags: []
  },

  'Bluetooth': {
    name: 'Bluetooth',
    riskScore: 25,
    whatItDoes: 'Can scan for and connect to nearby Bluetooth devices',
    whatItCanAccess: [
      'List of nearby Bluetooth devices',
      'Bluetooth device names and MAC addresses',
      'Ability to connect to your devices'
    ],
    risks: [
      'Could connect to your headphones, smartwatch, car',
      'Could interfere with your devices',
      'Could reveal what devices you own'
    ],
    commonUses: [
      'Audio apps to connect to headphones',
      'Fitness apps for smartwatches',
      'Car apps for infotainment systems'
    ],
    redFlags: [
      'Apps requesting Bluetooth when not needed'
    ]
  },

  'Nearby Devices': {
    name: 'Nearby Devices',
    riskScore: 30,
    whatItDoes: 'Can scan for nearby WiFi networks and Bluetooth devices',
    whatItCanAccess: [
      'WiFi network names in your area',
      'Nearby Bluetooth devices',
      'Your WiFi network SSID',
      'Signal strength information'
    ],
    risks: [
      'Could identify your WiFi network',
      'Could track location based on WiFi networks',
      'Could discover devices in your home'
    ],
    commonUses: [
      'WiFi connection apps',
      'Device discovery apps',
      'Network diagnostic tools'
    ],
    redFlags: [
      'Apps requesting this without clear need'
    ]
  },

  'Biometric': {
    name: 'Biometric',
    riskScore: 30,
    whatItDoes: 'Can use your fingerprint or face recognition to authenticate you',
    whatItCanAccess: [
      'Ability to request fingerprint or face unlock',
      'Cannot access actual biometric data'
    ],
    risks: [
      'Could use biometric for unwanted transactions',
      'Could be used for unauthorized actions',
      'Medium privacy risk depending on context'
    ],
    commonUses: [
      'Banking apps for secure login',
      'Payment apps',
      'Secure note apps'
    ],
    redFlags: [
      'Non-security apps requesting biometric',
      'Apps asking for biometric without explaining why'
    ]
  },

  'Internet': {
    name: 'Internet',
    riskScore: 10,
    whatItDoes: 'Allows the app to connect to the internet',
    whatItCanAccess: [
      'Ability to send and receive data over internet',
      'Can upload or download information'
    ],
    risks: [
      'Most apps need this legitimately',
      'Could be used to send your data to servers',
      'Generally unavoidable for modern apps'
    ],
    commonUses: [
      'Almost all apps need this',
      'Social media, messaging, email, streaming, etc.'
    ],
    redFlags: [
      'Offline apps (calculator, notes) requesting internet'
    ]
  },

  'Vibration': {
    name: 'Vibration',
    riskScore: 5,
    whatItDoes: 'Can make your phone vibrate',
    whatItCanAccess: [
      'Ability to trigger phone vibration motor'
    ],
    risks: [
      'Minimal privacy risk',
      'Could drain battery if overused'
    ],
    commonUses: [
      'Any app that wants haptic feedback',
      'Games, messaging apps, alarms'
    ],
    redFlags: []
  },

  'Keep Awake': {
    name: 'Keep Awake',
    riskScore: 5,
    whatItDoes: 'Can keep your phone\'s screen or processor active when normally it would sleep',
    whatItCanAccess: [
      'Ability to prevent device sleep',
      'Can keep screen on',
      'Can keep CPU active'
    ],
    risks: [
      'Major battery drain if misused',
      'Could consume power resources',
      'Low privacy risk'
    ],
    commonUses: [
      'Video playback apps',
      'Navigation apps to keep screen on',
      'Fitness apps during workouts'
    ],
    redFlags: [
      'Apps requesting this without legitimate need'
    ]
  },
};

/**
 * Get permission info by user-friendly name
 */
export function getUserFriendlyPermissionInfo(
  permissionName: UserFriendlyPermissionName
): UserFriendlyPermissionInfo | null {
  return USER_FRIENDLY_PERMISSION_EXPLANATIONS[permissionName] || null;
}

/**
 * Get risk level from score
 */
export function getRiskLevelFromScore(score: number): 'SAFE' | 'MEDIUM' | 'RISKY' {
  if (score <= 30) return 'SAFE';
  if (score <= 60) return 'MEDIUM';
  return 'RISKY';
}
