// Comprehensive permission database with explanations
export interface PermissionInfo {
  name: string;
  technicalName: string;
  riskScore: number; // 0-100
  whatItDoes: string;
  whatItCanAccess: string[];
  risks: string[];
  commonUses: string[];
  redFlags: string[];
}

export const PERMISSION_EXPLANATIONS: Record<string, PermissionInfo> = {
  // CRITICAL PERMISSIONS (80-100 risk)
  READ_CONTACTS: {
    name: "Read Contacts",
    technicalName: "READ_CONTACTS",
    riskScore: 95,
    whatItDoes: "Can access your entire contact list - all phone numbers, emails, and names you've saved",
    whatItCanAccess: [
      "All contact names and phone numbers",
      "Email addresses",
      "Contact groups",
      "Birthday information",
      "Custom notes about contacts"
    ],
    risks: [
      "Could sell contact list to advertisers or data brokers",
      "Could use for phishing or social engineering",
      "Could leak personal network information",
      "Enables spam/unwanted contact from companies"
    ],
    commonUses: [
      "Messaging apps to suggest friends",
      "Calling apps to show contacts",
      "Email apps to auto-complete addresses"
    ],
    redFlags: [
      "Flashlight app requesting contacts",
      "Calculator asking for contacts",
      "Game requesting this permission"
    ]
  },

  READ_SMS: {
    name: "Read Text Messages",
    technicalName: "READ_SMS",
    riskScore: 90,
    whatItDoes: "Can read all your text messages (SMS and MMS), including private conversations",
    whatItCanAccess: [
      "All text messages you received",
      "All text messages you sent",
      "Message timestamps",
      "Sender/recipient information",
      "Message attachments"
    ],
    risks: [
      "Access to sensitive personal information",
      "Could intercept 2FA security codes (though risky)",
      "Privacy invasion of personal communications",
      "Could be used for blackmail or extortion",
      "Exposes business communications"
    ],
    commonUses: [
      "Default SMS app to display messages",
      "Messaging apps that support SMS backup"
    ],
    redFlags: [
      "Social media app requesting SMS access",
      "Game asking to read messages",
      "Utility app wanting SMS access",
      "Any non-messaging app requesting this"
    ]
  },

  ACCESS_FINE_LOCATION: {
    name: "Precise Location (GPS)",
    technicalName: "ACCESS_FINE_LOCATION",
    riskScore: 85,
    whatItDoes: "Can determine your exact GPS location in real-time (within 5-10 meters accuracy)",
    whatItCanAccess: [
      "Your current GPS coordinates",
      "Your location history when app is running",
      "Your home address (if it determines this)",
      "Your work address (if identifiable)",
      "Everywhere you travel"
    ],
    risks: [
      "Real-time tracking of your movements",
      "Battery drain from constant GPS use",
      "Could reveal sensitive locations (hospitals, protests, etc)",
      "Enables stalking or harassment",
      "Could be sold to insurance companies to raise rates",
      "Privacy violation - violates reasonable expectation of privacy"
    ],
    commonUses: [
      "Maps and navigation apps to show your location",
      "Ride-sharing apps like Uber",
      "Weather apps for local forecasts",
      "Location-based games like Pokémon GO"
    ],
    redFlags: [
      "Social media app asking for GPS (Facebook, Instagram)",
      "Flashlight app requesting location",
      "Utility apps wanting location",
      "Any app asking for 'always' background location"
    ]
  },

  RECORD_AUDIO: {
    name: "Record Audio",
    technicalName: "RECORD_AUDIO",
    riskScore: 80,
    whatItDoes: "Can access your microphone and record audio from your surroundings",
    whatItCanAccess: [
      "All sounds from your phone's microphone",
      "Conversations you have near your phone",
      "Ambient sounds from your environment",
      "Voice commands you give other apps"
    ],
    risks: [
      "Could secretly record conversations",
      "Privacy invasion - could record you without knowledge",
      "Could capture sensitive information discussed near phone",
      "Could record intimate moments",
      "Violates wiretapping laws if misused"
    ],
    commonUses: [
      "Calling apps like WhatsApp for voice calls",
      "Voice message apps",
      "Video recording apps",
      "Voice assistant apps"
    ],
    redFlags: [
      "Game requesting microphone access",
      "Utility app wanting to record audio",
      "Any background-always recording permission"
    ]
  },

  READ_CALL_LOG: {
    name: "Read Call Logs",
    technicalName: "READ_CALL_LOG",
    riskScore: 80,
    whatItDoes: "Can see the history of all phone calls you've made and received",
    whatItCanAccess: [
      "Phone numbers of all calls",
      "Call duration for each call",
      "Time and date of each call",
      "Whether calls were incoming or outgoing",
      "Complete call history"
    ],
    risks: [
      "Reveals who you talk to most frequently",
      "Could identify important people in your life",
      "Could be used to track communication patterns",
      "Violates communication privacy",
      "Could expose business relationships"
    ],
    commonUses: [
      "Phone/dialer apps to display recent calls",
      "Call recording apps",
      "Emergency apps"
    ],
    redFlags: [
      "Any non-phone app requesting this",
      "Messaging apps wanting call logs",
      "Social media apps requesting this"
    ]
  },

  // HIGH RISK (60-79)
  WRITE_SMS: {
    name: "Send Text Messages",
    technicalName: "WRITE_SMS",
    riskScore: 75,
    whatItDoes: "Can send text messages on your behalf without asking for permission each time",
    whatItCanAccess: [
      "Ability to send SMS messages",
      "Could send to premium numbers",
      "Could generate charges on your bill"
    ],
    risks: [
      "Could rack up huge phone bills sending to premium numbers",
      "Could send spam or phishing messages to your contacts",
      "Could impersonate you in text communications",
      "Financial fraud risk"
    ],
    commonUses: [
      "Messaging apps to send texts",
      "Banking apps for 2FA codes"
    ],
    redFlags: [
      "Any app wanting to send SMS without permission each time"
    ]
  },

  CAMERA: {
    name: "Camera",
    technicalName: "CAMERA",
    riskScore: 60,
    whatItDoes: "Can access your phone's camera to take photos or videos",
    whatItCanAccess: [
      "What's currently in front of your camera",
      "Ability to take photos/videos without UI",
      "Potentially your face and surroundings"
    ],
    risks: [
      "Could take photos/videos without your knowledge",
      "Could capture sensitive moments",
      "Could see what's in your room/surroundings",
      "Potential for harassment or blackmail",
      "Could access front-facing camera to see you"
    ],
    commonUses: [
      "Video calling apps (WhatsApp, Messenger)",
      "Camera apps for photos",
      "Video recording apps",
      "Social media apps for stories/videos"
    ],
    redFlags: [
      "Game requesting camera access",
      "Flashlight app wanting camera access",
      "Utility apps requesting camera",
      "Apps requesting both camera and microphone"
    ]
  },

  READ_EXTERNAL_STORAGE: {
    name: "Read Files & Media",
    technicalName: "READ_EXTERNAL_STORAGE",
    riskScore: 65,
    whatItDoes: "Can access all files on your phone: photos, videos, documents, downloads",
    whatItCanAccess: [
      "All photos and videos",
      "Documents (PDFs, Word, etc)",
      "Downloaded files",
      "Audio files and music",
      "Any file in storage"
    ],
    risks: [
      "Could access sensitive documents",
      "Could copy personal photos",
      "Could extract confidential data",
      "Could find financial or medical records",
      "Access to nude photos or private videos"
    ],
    commonUses: [
      "Photo editing apps",
      "Media players for music/videos",
      "Social media apps to upload photos",
      "File managers"
    ],
    redFlags: [
      "Apps that don't need file access (games, utilities)",
      "Requesting access to everything, not just photos"
    ]
  },

  CALENDAR: {
    name: "Read Calendar",
    technicalName: "READ_CALENDAR",
    riskScore: 50,
    whatItDoes: "Can see all your calendar events, dates, and meeting details",
    whatItCanAccess: [
      "All calendar events",
      "Event titles and descriptions",
      "Meeting locations",
      "Attendee information",
      "Event times and dates"
    ],
    risks: [
      "Could reveal your schedule and availability",
      "Could identify important meetings or appointments",
      "Could reveal medical appointments or procedures",
      "Privacy of your time management"
    ],
    commonUses: [
      "Calendar apps like Google Calendar",
      "Email apps with calendar integration",
      "Meeting/scheduling apps"
    ],
    redFlags: [
      "Social media apps requesting calendar access",
      "Games wanting to read your calendar",
      "Utility apps needing calendar"
    ]
  },

  // MEDIUM RISK (30-59)
  INTERNET: {
    name: "Internet",
    technicalName: "INTERNET",
    riskScore: 10,
    whatItDoes: "Allows the app to connect to the internet",
    whatItCanAccess: [
      "Ability to send and receive data over internet",
      "Can upload or download information"
    ],
    risks: [
      "Most apps need this legitimately",
      "Could be used to send your data to servers",
      "Generally unavoidable for modern apps"
    ],
    commonUses: [
      "Almost all apps need this",
      "Social media, messaging, email, streaming, etc."
    ],
    redFlags: [
      "Offline apps (calculator, notes) requesting internet"
    ]
  },

  ACCESS_COARSE_LOCATION: {
    name: "Approximate Location",
    technicalName: "ACCESS_COARSE_LOCATION",
    riskScore: 40,
    whatItDoes: "Can determine your general location based on WiFi networks and cell towers (city/neighborhood level)",
    whatItCanAccess: [
      "Your approximate city/neighborhood",
      "General location accuracy ~1000 meters",
      "Cell tower location data"
    ],
    risks: [
      "Less precise than GPS but still tracks location",
      "Could identify general area where you live/work",
      "Better for battery life but still a privacy concern"
    ],
    commonUses: [
      "Weather apps for local forecasts",
      "Maps apps as fallback",
      "Location-based services"
    ],
    redFlags: [
      "Apps requesting this when they don't need location"
    ]
  },

  VIBRATE: {
    name: "Phone Vibration",
    technicalName: "VIBRATE",
    riskScore: 5,
    whatItDoes: "Can make your phone vibrate",
    whatItCanAccess: [
      "Ability to trigger phone vibration motor"
    ],
    risks: [
      "Minimal privacy risk",
      "Could drain battery if overused"
    ],
    commonUses: [
      "Any app that wants haptic feedback",
      "Games, messaging apps, alarms"
    ],
    redFlags: []
  },

  // LOW RISK (1-29)
  ACCESS_NETWORK_STATE: {
    name: "Network Connection Info",
    technicalName: "ACCESS_NETWORK_STATE",
    riskScore: 15,
    whatItDoes: "Can check what type of network connection you have (WiFi, mobile, etc)",
    whatItCanAccess: [
      "WiFi network name (SSID) you're connected to",
      "Mobile network information",
      "Network connection type"
    ],
    risks: [
      "Could identify your WiFi network",
      "Could track location based on WiFi SSID",
      "Generally low risk"
    ],
    commonUses: [
      "Apps that need to know connection type",
      "Video streaming apps to adjust quality"
    ],
    redFlags: []
  },

  BLUETOOTH: {
    name: "Bluetooth/Nearby Devices",
    technicalName: "BLUETOOTH",
    riskScore: 25,
    whatItDoes: "Can scan and connect to nearby Bluetooth devices",
    whatItCanAccess: [
      "List of nearby Bluetooth devices",
      "Bluetooth device names and MAC addresses",
      "Ability to connect to your devices"
    ],
    risks: [
      "Could connect to your headphones, smartwatch, car",
      "Could interfere with your devices",
      "Could reveal what devices you own"
    ],
    commonUses: [
      "Audio apps to connect to headphones",
      "Fitness apps for smartwatches",
      "Car apps for infotainment systems"
    ],
    redFlags: [
      "Apps requesting Bluetooth when not needed"
    ]
  },

  WRITE_EXTERNAL_STORAGE: {
    name: "Modify Files & Media",
    technicalName: "WRITE_EXTERNAL_STORAGE",
    riskScore: 35,
    whatItDoes: "Can create, modify, or delete files on your phone's storage",
    whatItCanAccess: [
      "Ability to write/modify any file",
      "Can delete your files",
      "Can corrupt data"
    ],
    risks: [
      "Could delete important files",
      "Could modify documents",
      "Could plant malware",
      "Could corrupt your data"
    ],
    commonUses: [
      "Photo editing apps",
      "Document editors",
      "Download managers",
      "File managers"
    ],
    redFlags: [
      "Games wanting write access",
      "Apps that only need read access asking for write"
    ]
  },

  READ_PHONE_STATE: {
    name: "Read Phone State",
    technicalName: "READ_PHONE_STATE",
    riskScore: 20,
    whatItDoes: "Can see if you're on a phone call or not",
    whatItCanAccess: [
      "Current phone call status",
      "Whether you're calling or receiving"
    ],
    risks: [
      "Could pause media during calls",
      "Could detect when you're communicating",
      "Low privacy risk"
    ],
    commonUses: [
      "Messaging apps to pause playback during calls",
      "Media player apps",
      "Calling apps"
    ],
    redFlags: []
  },

  WAKE_LOCK: {
    name: "Prevent Sleep",
    technicalName: "WAKE_LOCK",
    riskScore: 5,
    whatItDoes: "Can keep your phone's screen or processor active when normally it would sleep",
    whatItCanAccess: [
      "Ability to prevent device sleep",
      "Can keep screen on",
      "Can keep CPU active"
    ],
    risks: [
      "Major battery drain if misused",
      "Could consume power resources",
      "Low privacy risk"
    ],
    commonUses: [
      "Video playback apps",
      "Navigation apps to keep screen on",
      "Fitness apps during workouts"
    ],
    redFlags: [
      "Apps requesting this without legitimate need"
    ]
  },

  USE_BIOMETRIC: {
    name: "Fingerprint/Face Recognition",
    technicalName: "USE_BIOMETRIC",
    riskScore: 30,
    whatItDoes: "Can use your fingerprint or face recognition to authenticate you",
    whatItCanAccess: [
      "Ability to request fingerprint or face unlock",
      "Cannot actually access biometric data itself"
    ],
    risks: [
      "Could use biometric for unwanted transactions",
      "Could be used for unauthorized actions",
      "Medium privacy risk depending on context"
    ],
    commonUses: [
      "Banking apps for secure login",
      "Payment apps",
      "Secure note apps"
    ],
    redFlags: [
      "Non-security apps requesting biometric",
      "Apps asking for biometric without explaining why"
    ]
  },
};

// Get all permission technical names
export const ALL_PERMISSIONS = Object.keys(PERMISSION_EXPLANATIONS);

// Get permission risk score
export function getPermissionRiskScore(permissionName: string): number {
  const perm = PERMISSION_EXPLANATIONS[permissionName];
  return perm ? perm.riskScore : 50; // Default to medium risk if unknown
}

// Get permission info
export function getPermissionInfo(permissionName: string): PermissionInfo | null {
  return PERMISSION_EXPLANATIONS[permissionName] || null;
}
