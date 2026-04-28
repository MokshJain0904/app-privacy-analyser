/**
 * Permission-to-Feature Mapping Database
 * Maps Android permissions to specific app features and shows how they're used
 * Example: RECORD_AUDIO → Video Recording Feature, Voice Calling Feature
 */

export interface FeatureUsage {
  featureName: string;
  description: string; // How it uses this permission
  riskInContext: 'Safe' | 'Review Needed' | 'High Risk'; // Risk level when used in THIS feature
}

export interface PermissionFeatureMapping {
  permissionName: string;
  technicalName: string;
  appCategory?: string; // Optional: specific to category
  features: FeatureUsage[];
}

// Database of permissions and their legitimate feature usages
export const PERMISSION_FEATURE_DATABASE: Record<string, PermissionFeatureMapping> = {
  // Audio/Microphone Permissions
  RECORD_AUDIO: {
    permissionName: "Record Audio",
    technicalName: "RECORD_AUDIO",
    features: [
      {
        featureName: "Video Recording",
        description: "Records audio while capturing video - essential for creating videos with sound",
        riskInContext: "Safe"
      },
      {
        featureName: "Voice Calling",
        description: "Records audio for VoIP calls, video calls, and voice communication",
        riskInContext: "Safe"
      },
      {
        featureName: "Voice Recording/Notes",
        description: "Records voice notes or voice messages for note-taking apps",
        riskInContext: "Safe"
      },
      {
        featureName: "Voice Assistant",
        description: "Records voice input for voice recognition and voice commands",
        riskInContext: "Safe"
      },
      {
        featureName: "Audio Streaming",
        description: "Records ambient audio for streaming or broadcasting features",
        riskInContext: "Review Needed"
      },
      {
        featureName: "Background Monitoring",
        description: "Continuously records audio in background without user action",
        riskInContext: "High Risk"
      }
    ]
  },

  CAMERA: {
    permissionName: "Camera",
    technicalName: "CAMERA",
    features: [
      {
        featureName: "Photo Capture",
        description: "Takes photos using the device camera for sharing or storage",
        riskInContext: "Safe"
      },
      {
        featureName: "Video Recording",
        description: "Records videos for content creation and sharing",
        riskInContext: "Safe"
      },
      {
        featureName: "Video Calling",
        description: "Uses camera for video calls and video communication",
        riskInContext: "Safe"
      },
      {
        featureName: "Live Streaming",
        description: "Broadcasts live video to social networks or streaming platforms",
        riskInContext: "Safe"
      },
      {
        featureName: "AR/Augmented Reality",
        description: "Uses camera for augmented reality effects and filters",
        riskInContext: "Safe"
      },
      {
        featureName: "Scanning/QR Codes",
        description: "Uses camera to scan QR codes, barcodes, or documents",
        riskInContext: "Safe"
      },
      {
        featureName: "Background Recording",
        description: "Records video continuously without user awareness",
        riskInContext: "High Risk"
      }
    ]
  },

  // Storage Permissions
  READ_EXTERNAL_STORAGE: {
    permissionName: "Read Storage",
    technicalName: "READ_EXTERNAL_STORAGE",
    features: [
      {
        featureName: "Photo/Media Gallery",
        description: "Reads photos and media from device storage to display or edit",
        riskInContext: "Safe"
      },
      {
        featureName: "File Management",
        description: "Lists and accesses files for file browsing and management features",
        riskInContext: "Safe"
      },
      {
        featureName: "Media Upload",
        description: "Reads media files to upload them to cloud services or social networks",
        riskInContext: "Safe"
      },
      {
        featureName: "Document Processing",
        description: "Reads documents for PDF viewing, document editing, or conversion",
        riskInContext: "Safe"
      },
      {
        featureName: "Music/Audio Playback",
        description: "Reads audio files from storage for music playback or streaming",
        riskInContext: "Safe"
      },
      {
        featureName: "Backup/Sync Services",
        description: "Reads files for cloud backup or device synchronization",
        riskInContext: "Review Needed"
      },
      {
        featureName: "Unrestricted Data Harvesting",
        description: "Indiscriminately reads all files without clear user purpose",
        riskInContext: "High Risk"
      }
    ]
  },

  WRITE_EXTERNAL_STORAGE: {
    permissionName: "Write Storage",
    technicalName: "WRITE_EXTERNAL_STORAGE",
    features: [
      {
        featureName: "Photo Saving",
        description: "Saves photos and screenshots to device storage",
        riskInContext: "Safe"
      },
      {
        featureName: "Media Download",
        description: "Downloads photos, videos, or audio files to device storage",
        riskInContext: "Safe"
      },
      {
        featureName: "File Creation",
        description: "Creates documents, notes, or files on device storage",
        riskInContext: "Safe"
      },
      {
        featureName: "Cache Management",
        description: "Stores temporary data and cache files for app performance",
        riskInContext: "Safe"
      },
      {
        featureName: "Export/Backup",
        description: "Exports data as files for backup or sharing purposes",
        riskInContext: "Safe"
      },
      {
        featureName: "Unrestricted File Writing",
        description: "Writes files anywhere on storage without clear purpose",
        riskInContext: "High Risk"
      }
    ]
  },

  // Location Permissions
  ACCESS_FINE_LOCATION: {
    permissionName: "Precise Location",
    technicalName: "ACCESS_FINE_LOCATION",
    features: [
      {
        featureName: "Navigation/Maps",
        description: "Uses GPS for turn-by-turn navigation and location mapping",
        riskInContext: "Safe"
      },
      {
        featureName: "Location-Based Services",
        description: "Finds nearby restaurants, stores, or services using your location",
        riskInContext: "Review Needed"
      },
      {
        featureName: "Ride Sharing",
        description: "Shares precise location for pickup and navigation in ride-share apps",
        riskInContext: "Safe"
      },
      {
        featureName: "Location Tagging",
        description: "Tags photos or posts with location information for social sharing",
        riskInContext: "Review Needed"
      },
      {
        featureName: "Fitness Tracking",
        description: "Tracks location for running, cycling, or hiking activities",
        riskInContext: "Safe"
      },
      {
        featureName: "Background Location Tracking",
        description: "Continuously tracks location even when app is not in use",
        riskInContext: "High Risk"
      },
      {
        featureName: "Location Selling",
        description: "Collects and sells location data to advertisers or data brokers",
        riskInContext: "High Risk"
      }
    ]
  },

  ACCESS_COARSE_LOCATION: {
    permissionName: "Approximate Location",
    technicalName: "ACCESS_COARSE_LOCATION",
    features: [
      {
        featureName: "General Location Context",
        description: "Uses cell towers/WiFi to determine approximate location (city-level)",
        riskInContext: "Review Needed"
      },
      {
        featureName: "Localized Content",
        description: "Loads content relevant to your region or timezone",
        riskInContext: "Safe"
      },
      {
        featureName: "Regional Services",
        description: "Provides region-specific services like local news or weather",
        riskInContext: "Safe"
      },
      {
        featureName: "Targeted Advertising",
        description: "Uses location for regional targeted advertisements",
        riskInContext: "Review Needed"
      }
    ]
  },

  // Contact Permissions
  READ_CONTACTS: {
    permissionName: "Read Contacts",
    technicalName: "READ_CONTACTS",
    features: [
      {
        featureName: "Contact Suggestions",
        description: "Reads contacts to suggest friends in messaging or calling",
        riskInContext: "Review Needed"
      },
      {
        featureName: "Quick Calling/Messaging",
        description: "Shows contacts for quick access to call or message them",
        riskInContext: "Safe"
      },
      {
        featureName: "Address Book Sync",
        description: "Syncs contacts with cloud services for backup purposes",
        riskInContext: "Review Needed"
      },
      {
        featureName: "Contact Export",
        description: "Exports contacts for sharing or data portability",
        riskInContext: "Review Needed"
      },
      {
        featureName: "Contact Harvesting",
        description: "Collects and uploads entire contact list for advertising or data selling",
        riskInContext: "High Risk"
      }
    ]
  },

  READ_SMS: {
    permissionName: "Read Text Messages",
    technicalName: "READ_SMS",
    features: [
      {
        featureName: "Default SMS App",
        description: "Displays text messages for the default messaging application",
        riskInContext: "Safe"
      },
      {
        featureName: "SMS Backup",
        description: "Backs up text messages to cloud storage for recovery",
        riskInContext: "Review Needed"
      },
      {
        featureName: "SMS Recovery",
        description: "Recovers deleted messages or restores from backups",
        riskInContext: "Safe"
      },
      {
        featureName: "2FA Code Capture",
        description: "Auto-fills 2-factor authentication codes from received messages",
        riskInContext: "Review Needed"
      },
      {
        featureName: "Notification Access",
        description: "Reads SMS to show notifications and message previews",
        riskInContext: "Safe"
      },
      {
        featureName: "Message Screening",
        description: "Reads SMS to identify and filter spam or fraud messages",
        riskInContext: "Review Needed"
      },
      {
        featureName: "Message Harvesting",
        description: "Collects personal messages for data harvesting or spying",
        riskInContext: "High Risk"
      }
    ]
  },

  // Call Permissions
  READ_CALL_LOG: {
    permissionName: "Read Call History",
    technicalName: "READ_CALL_LOG",
    features: [
      {
        featureName: "Call History Display",
        description: "Shows your call history for reference and dialing back contacts",
        riskInContext: "Safe"
      },
      {
        featureName: "Call Duration Tracking",
        description: "Tracks call duration for billing or usage statistics",
        riskInContext: "Review Needed"
      },
      {
        featureName: "Call Log Backup",
        description: "Backs up call logs for device recovery or migration",
        riskInContext: "Review Needed"
      },
      {
        featureName: "Spam Detection",
        description: "Analyzes call patterns to identify spam or fraudulent calls",
        riskInContext: "Review Needed"
      },
      {
        featureName: "Call Pattern Analysis",
        description: "Analyzes who you call frequently for targeted advertising",
        riskInContext: "High Risk"
      }
    ]
  },

  CALL_PHONE: {
    permissionName: "Make Calls",
    technicalName: "CALL_PHONE",
    features: [
      {
        featureName: "Direct Calling",
        description: "Allows the app to initiate phone calls directly",
        riskInContext: "Safe"
      },
      {
        featureName: "VoIP Calling",
        description: "Makes internet-based calls using VoIP services",
        riskInContext: "Safe"
      },
      {
        featureName: "Emergency Calls",
        description: "Initiates emergency 911 or emergency service calls",
        riskInContext: "Safe"
      },
      {
        featureName: "Automated Dialing",
        description: "Automatically dials numbers without user confirmation",
        riskInContext: "High Risk"
      },
      {
        featureName: "Premium Service Calls",
        description: "Dials premium or paid service numbers that incur charges",
        riskInContext: "High Risk"
      }
    ]
  },

  // Biometric Permissions
  USE_BIOMETRIC: {
    permissionName: "Use Biometric",
    technicalName: "USE_BIOMETRIC",
    features: [
      {
        featureName: "Authentication",
        description: "Uses fingerprint or face recognition to unlock or authenticate",
        riskInContext: "Safe"
      },
      {
        featureName: "Secure Payments",
        description: "Uses biometric authentication to authorize payments or transactions",
        riskInContext: "Safe"
      },
      {
        featureName: "App Lock",
        description: "Uses biometric data to lock specific app features",
        riskInContext: "Safe"
      },
      {
        featureName: "Biometric Data Collection",
        description: "Collects biometric templates for identification or tracking",
        riskInContext: "High Risk"
      }
    ]
  }
};

/**
 * Get all feature usages for a specific permission
 */
export function getPermissionFeatures(permissionName: string): FeatureUsage[] {
  const mapping = PERMISSION_FEATURE_DATABASE[permissionName];
  return mapping ? mapping.features : [];
}

/**
 * Get features that match a specific app category for a permission
 * Example: RECORD_AUDIO → [Video Recording, Voice Calling] for Social apps
 */
export function getExpectedFeaturesForCategory(
  permissionName: string,
  appCategory: string
): FeatureUsage[] {
  const allFeatures = getPermissionFeatures(permissionName);

  // Map common app categories to expected safe features
  const categoryFeatureMap: Record<string, string[]> = {
    'Social': ['Video Recording', 'Voice Calling', 'Photo Capture', 'Media Upload', 'Live Streaming'],
    'Communication': ['Voice Calling', 'Voice Recording/Notes', 'Photo Capture', 'Contact Suggestions'],
    'Photography': ['Photo Capture', 'Video Recording', 'AR/Augmented Reality', 'Scanning/QR Codes'],
    'Maps & Navigation': ['Navigation/Maps', 'Fitness Tracking'],
    'Travel': ['Navigation/Maps', 'Location-Based Services', 'Location Tagging'],
    'Entertainment': ['Video Recording', 'Photo Capture', 'Media Gallery', 'Live Streaming'],
    'Video Players': ['Media Download', 'Media Gallery'],
    'Finance': ['Biometric Data Collection', 'Secure Payments'],
    'Shopping': ['Camera', 'Scanning/QR Codes'],
  };

  const expectedFeatureNames = categoryFeatureMap[appCategory] || [];
  return allFeatures.filter(f => expectedFeatureNames.includes(f.featureName));
}

/**
 * Determine if a feature usage is legitimate for an app category
 */
export function isFeatureLegitimateForCategory(
  featureName: string,
  appCategory: string
): boolean {
  const expectedFeatures = getExpectedFeaturesForCategory('RECORD_AUDIO', appCategory);
  return expectedFeatures.some(f => f.featureName === featureName);
}

/**
 * Get the risk level of a permission when used for a specific feature
 */
export function getFeatureRiskLevel(permissionName: string, featureName: string): 'Safe' | 'Review Needed' | 'High Risk' {
  const features = getPermissionFeatures(permissionName);
  const feature = features.find(f => f.featureName === featureName);
  return feature?.riskInContext || 'Review Needed';
}
