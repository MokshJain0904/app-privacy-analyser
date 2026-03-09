export interface CategoryPermissions {
    category: string;
    expectedPermissions: string[];
    description: string;
}

export const PERMISSIONS_DB: Record<string, CategoryPermissions> = {
    "Social": {
        category: "Social",
        expectedPermissions: ["INTERNET", "CAMERA", "RECORD_AUDIO", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE", "ACCESS_NETWORK_STATE", "READ_CONTACTS", "ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION", "VIBRATE"],
        description: "Social apps typically need media access, contacts for finding friends, and location for regional content."
    },
    "Communication": {
        category: "Communication",
        expectedPermissions: ["INTERNET", "READ_CONTACTS", "RECORD_AUDIO", "CAMERA", "ACCESS_NETWORK_STATE", "READ_PHONE_STATE", "VIBRATE", "WAKE_LOCK"],
        description: "Messaging and calling apps require contact access and media recording capabilities."
    },
    "Maps & Navigation": {
        category: "Maps & Navigation",
        expectedPermissions: ["INTERNET", "ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION", "ACCESS_NETWORK_STATE", "WRITE_EXTERNAL_STORAGE", "READ_EXTERNAL_STORAGE"],
        description: "Navigation apps strictly require high-accuracy location data."
    },
    "Photography": {
        category: "Photography",
        expectedPermissions: ["CAMERA", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE", "INTERNET", "ACCESS_NETWORK_STATE"],
        description: "Photo apps need access to the camera and gallery storage."
    },
    "Finance": {
        category: "Finance",
        expectedPermissions: ["INTERNET", "ACCESS_NETWORK_STATE", "USE_BIOMETRIC", "CAMERA"],
        description: "Financial apps focus on secure internet connectivity, biometric auth, and camera for check deposits/QR."
    },
    "Tools": {
        category: "Tools",
        expectedPermissions: ["INTERNET", "ACCESS_NETWORK_STATE", "VIBRATE", "WAKE_LOCK"],
        description: "Basic tools should generally have minimal permission requirements but often use vibrator/wake lock."
    },
    "Lifestyle": {
        category: "Lifestyle",
        expectedPermissions: ["INTERNET", "ACCESS_NETWORK_STATE", "CAMERA", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE", "ACCESS_COARSE_LOCATION", "READ_CONTACTS"],
        description: "Lifestyle apps like Pinterest or religious apps often need media access and social connectivity."
    },
    "Education": {
        category: "Education",
        expectedPermissions: ["INTERNET", "ACCESS_NETWORK_STATE", "WAKE_LOCK"],
        description: "Educational apps typically need internet access for learning materials."
    },
    "Entertainment": {
        category: "Entertainment",
        expectedPermissions: ["INTERNET", "ACCESS_NETWORK_STATE", "WAKE_LOCK", "VIBRATE"],
        description: "Streaming and gaming apps need internet and wake lock to prevent screen sleep."
    },
    "Shopping": {
        category: "Shopping",
        expectedPermissions: ["INTERNET", "ACCESS_NETWORK_STATE", "CAMERA", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE", "ACCESS_COARSE_LOCATION"],
        description: "Shopping apps use the camera for scanning and location for delivery services."
    }
};

export const getExpectedPermissions = (category: string): string[] => {
    // Normalize category name from Play Store to our DB keys
    const normalized = Object.keys(PERMISSIONS_DB).find(k =>
        category.toLowerCase().includes(k.toLowerCase())
    );
    return normalized ? PERMISSIONS_DB[normalized].expectedPermissions : [];
};

export const SENSITIVE_PERMISSIONS: Record<string, string> = {
    // High Risk
    "ACCESS_FINE_LOCATION": "High Risk",
    "ACCESS_COARSE_LOCATION": "High Risk",
    "CAMERA": "High Risk",
    "RECORD_AUDIO": "High Risk",
    "READ_CONTACTS": "High Risk",
    "WRITE_CONTACTS": "High Risk",
    "GET_ACCOUNTS": "High Risk",
    "READ_SMS": "High Risk",
    "SEND_SMS": "High Risk",
    "READ_CALL_LOG": "High Risk",
    "READ_PHONE_STATE": "High Risk",
    "CALL_PHONE": "High Risk",
    "SYSTEM_ALERT_WINDOW": "High Risk",
    "PROCESS_OUTGOING_CALLS": "High Risk",

    // Review Needed
    "READ_EXTERNAL_STORAGE": "Review Needed",
    "WRITE_EXTERNAL_STORAGE": "Review Needed",
    "BLUETOOTH": "Review Needed",
    "BLUETOOTH_ADMIN": "Review Needed",
    "ACCESS_WIFI_STATE": "Review Needed",
    "CHANGE_WIFI_STATE": "Review Needed",
    "NFC": "Review Needed",
    "USE_BIOMETRIC": "Review Needed",

    // Safe (Default)
    "INTERNET": "Safe",
    "ACCESS_NETWORK_STATE": "Safe",
    "VIBRATE": "Safe",
    "WAKE_LOCK": "Safe",
};
