export interface CategoryPermissions {
    category: string;
    expectedPermissions: string[];
    description: string;
}

export const PERMISSIONS_DB: Record<string, CategoryPermissions> = {
    "Social": {
        category: "Social",
        expectedPermissions: ["INTERNET", "CAMERA", "RECORD_AUDIO", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE", "ACCESS_NETWORK_STATE"],
        description: "Social apps typically need media access for sharing content and internet for connectivity."
    },
    "Communication": {
        category: "Communication",
        expectedPermissions: ["INTERNET", "READ_CONTACTS", "RECORD_AUDIO", "CAMERA", "ACCESS_NETWORK_STATE", "READ_PHONE_STATE"],
        description: "Messaging and calling apps require contact access and media recording capabilities."
    },
    "Maps & Navigation": {
        category: "Maps & Navigation",
        expectedPermissions: ["INTERNET", "ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION", "ACCESS_NETWORK_STATE", "WRITE_EXTERNAL_STORAGE"],
        description: "Navigation apps strictly require high-accuracy location data."
    },
    "Photography": {
        category: "Photography",
        expectedPermissions: ["CAMERA", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"],
        description: "Photo apps need access to the camera and gallery storage."
    },
    "Finance": {
        category: "Finance",
        expectedPermissions: ["INTERNET", "ACCESS_NETWORK_STATE", "USE_BIOMETRIC"],
        description: "Financial apps focus on secure internet connectivity and biometric auth."
    },
    "Tools": {
        category: "Tools",
        expectedPermissions: ["INTERNET", "ACCESS_NETWORK_STATE"],
        description: "Basic tools should generally have minimal permission requirements."
    },
    "Lifestyle": {
        category: "Lifestyle",
        expectedPermissions: ["INTERNET", "ACCESS_NETWORK_STATE"],
        description: "Lifestyle apps vary but usually just need internet for content."
    },
    "Education": {
        category: "Education",
        expectedPermissions: ["INTERNET", "ACCESS_NETWORK_STATE"],
        description: "Educational apps typically need internet access for learning materials."
    },
    "Entertainment": {
        category: "Entertainment",
        expectedPermissions: ["INTERNET", "ACCESS_NETWORK_STATE", "WAKE_LOCK"],
        description: "Streaming apps need internet and wake lock to prevent screen sleep."
    },
    "Shopping": {
        category: "Shopping",
        expectedPermissions: ["INTERNET", "ACCESS_NETWORK_STATE", "CAMERA"],
        description: "Shopping apps use the camera for scanning barcodes/QR codes."
    }
};

export const getExpectedPermissions = (category: string): string[] => {
    // Normalize category name from Play Store to our DB keys
    const normalized = Object.keys(PERMISSIONS_DB).find(k =>
        category.toLowerCase().includes(k.toLowerCase())
    );
    return normalized ? PERMISSIONS_DB[normalized].expectedPermissions : [];
};
