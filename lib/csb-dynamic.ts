import * as fs from 'fs';
import * as path from 'path';

// Define the shape of our new dynamic CSB file
export interface DynamicCategoryBaseline {
  category: string;
  totalAppsAnalyzed: number;
  expectedPermissions: string[];
  distribution: Record<string, number>;
  updatedAt: string;
}

export interface CSBDynamicData {
  [categoryKey: string]: DynamicCategoryBaseline;
}

const CSB_FILE_PATH = path.join(process.cwd(), 'data', 'csb.json');

let cachedCSB: CSBDynamicData | null = null;

/**
 * Loads the CSB data from the generated JSON file.
 * Caches it in memory for faster subsequent reads.
 */
export function getCSBData(): CSBDynamicData {
  if (cachedCSB) return cachedCSB;

  if (fs.existsSync(CSB_FILE_PATH)) {
    try {
      const data = fs.readFileSync(CSB_FILE_PATH, 'utf-8');
      cachedCSB = JSON.parse(data) as CSBDynamicData;
      return cachedCSB;
    } catch (error) {
      console.error('Failed to parse csb.json:', error);
      return {};
    }
  }
  
  return {};
}

/**
 * Gets dynamically computed expected permissions for a given category.
 * Falls back to an empty array if the category hasn't been scraped yet.
 */
export const getDynamicExpectedPermissions = (category: string): string[] => {
  const csb = getCSBData();
  
  // Try to match the exact category key from google-play-scraper formats
  // For instance "SOCIAL" or "GAME_ACTION"
  // If not exact match, do a fuzzy substring match
  const searchKey = category.toUpperCase().replace(/\s+/g, '_');
  
  if (csb[searchKey]) {
      return csb[searchKey].expectedPermissions;
  }

  // Fuzzy match fallback
  const matchedKey = Object.keys(csb).find(k => 
      searchKey.includes(k) || k.includes(searchKey)
  );

  return matchedKey ? csb[matchedKey].expectedPermissions : [];
};

/**
 * Gets permission frequency distribution for a category
 */
export const getPermissionDistribution = (category: string): Record<string, number> => {
    const csb = getCSBData();
    const searchKey = category.toUpperCase().replace(/\s+/g, '_');
    
    if (csb[searchKey]) {
        return csb[searchKey].distribution;
    }
  
    const matchedKey = Object.keys(csb).find(k => 
        searchKey.includes(k) || k.includes(searchKey)
    );
  
    return matchedKey ? csb[matchedKey].distribution : {};
};
