import { pipeline, env } from '@xenova/transformers';

// Ignore local model cache issues in some Next.js environments
env.allowLocalModels = false;

// We use a singleton pattern for the extractor to avoid reloading the model on every call
let extractorTemplate: any = null;

async function getExtractor() {
  if (!extractorTemplate) {
    // all-MiniLM-L6-v2 is a great lightweight embedding model
    extractorTemplate = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return extractorTemplate;
}

// Map of category context descriptions to compare permissions against
const CATEGORY_CONTEXTS: Record<string, string> = {
  "Social": "Social networking, messaging, sharing photos, videos, and connecting with friends. Requires camera, microphone, storage, and location.",
  "Communication": "Calling, texting, messaging, video calls, email. Requires microphone, camera, contacts, and phone state.",
  "Maps & Navigation": "GPS, driving directions, transit, map tools. Strictly requires high-accuracy location and internet.",
  "Photography": "Taking photos, recording videos, editing images. Requires camera and external storage access.",
  "Finance": "Banking, mobile payments, trading, investing. Requires secure internet, biometric authentication, and camera for checks.",
  "Tools": "Utility apps, calculators, flashlights, device management. Usually minimal permissions required, maybe wake lock or vibrate.",
  "Lifestyle": "Home, fashion, religion, dating, smart home. May require location for matching, or camera for styling.",
  "Education": "Learning, school apps, courses, flashcards. Minimal permissions, mostly internet and basic storage.",
  "Entertainment": "Streaming movies, music, games, fun apps. Requires internet, wake lock, and audio.",
  "Shopping": "E-commerce, buying goods, digital coupons. Requires internet, camera for barcodes, and location for shipping."
};

/**
 * Computes cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Formats an Android permission string into readable text for the embedding model.
 * E.g., "ACCESS_FINE_LOCATION" -> "Access Fine Location"
 */
function formatPermissionText(permission: string): string {
  return permission
    .replace(/^android\.permission\./, '')
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Replaces substring matching with semantic matching.
 * @param permission The permission string (e.g., "CAMERA")
 * @param category The app category (e.g., "Social")
 * @param threshold The similarity threshold (0 to 1)
 * @returns Object with similarity score and whether it matches the context
 */
export async function semanticPermissionMatch(
  permission: string,
  category: string,
  threshold: number = 0.35
): Promise<{ score: number, isExpected: boolean }> {
  
  const extractor = await getExtractor();
  
  const readablePermission = formatPermissionText(permission);
  
  // Clean category key
  const normalizedCategory = Object.keys(CATEGORY_CONTEXTS).find(k => 
    category.toLowerCase().includes(k.toLowerCase())
  ) || "Tools"; // fallback to tools context
  
  const contextDescription = CATEGORY_CONTEXTS[normalizedCategory];
  
  // Get embeddings
  // We specify { pooling: 'mean', normalize: true } for sentence embeddings
  const permOutput = await extractor(readablePermission, { pooling: 'mean', normalize: true });
  const contextOutput = await extractor(contextDescription, { pooling: 'mean', normalize: true });
  
  const permVector = Array.from(permOutput.data) as number[];
  const contextVector = Array.from(contextOutput.data) as number[];
  
  const score = cosineSimilarity(permVector, contextVector);
  
  return {
    score,
    isExpected: score >= threshold
  };
}
