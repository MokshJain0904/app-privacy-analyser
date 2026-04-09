import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const CACHE_FILE = path.join(DATA_DIR, 'audit_cache.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure cache file exists
if (!fs.existsSync(CACHE_FILE)) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify({}), 'utf-8');
}

export function getAuditCache(): Record<string, any> {
  try {
    const data = fs.readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading audit cache:', error);
    return {};
  }
}

function getCacheKey(appName: string, permissions: string[]) {
  return `${appName.toLowerCase()}_${permissions.slice().sort().join(',')}`;
}

export function saveToAuditCache(appName: string, permissions: string[], analysisResult: any) {
  try {
    const cache = getAuditCache();
    const key = getCacheKey(appName, permissions);
    cache[key] = {
      ...analysisResult,
      cachedAt: new Date().toISOString()
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to audit cache:', error);
  }
}

export function getFromAuditCache(appName: string, permissions: string[]): any | null {
  const cache = getAuditCache();
  const key = getCacheKey(appName, permissions);
  return cache[key] || null;
}
