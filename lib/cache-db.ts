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

function getCompareCacheKey(app1: string, app2: string) {
  const a = (app1 || '').toLowerCase().trim();
  const b = (app2 || '').toLowerCase().trim();
  const [x, y] = [a, b].sort();
  return `compare_${x}__${y}`;
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

export function getFromCompareCache(app1: string, app2: string): any | null {
  const cache = getAuditCache();
  const key = getCompareCacheKey(app1, app2);
  return cache[key] || null;
}

export function saveToCompareCache(app1: string, app2: string, comparisonResult: any) {
  try {
    const cache = getAuditCache();
    const key = getCompareCacheKey(app1, app2);
    cache[key] = {
      ...comparisonResult,
      cachedAt: new Date().toISOString()
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing compare cache:', error);
  }
}

export function deleteFromAuditCache(appName: string, permissions?: string[]) {
  try {
    const cache = getAuditCache();
    const normalizedApp = appName.toLowerCase().trim();
    let changed = false;

    if (permissions && permissions.length > 0) {
      const key = getCacheKey(appName, permissions);
      if (cache[key]) {
        delete cache[key];
        changed = true;
      }
    } else {
      Object.keys(cache).forEach((key) => {
        const lowerKey = key.toLowerCase();
        const cachedAppName = cache[key]?.appName?.toLowerCase()?.trim();
        if (lowerKey.startsWith(`${normalizedApp}_`) || cachedAppName === normalizedApp) {
          delete cache[key];
          changed = true;
        }
      });
    }

    if (changed) {
      fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
    }

    return changed;
  } catch (error) {
    console.error('Error deleting from audit cache:', error);
    return false;
  }
}

export function clearAuditCache() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify({}, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error clearing audit cache:', error);
    return false;
  }
}

export function getFromAuditCache(appName: string, permissions: string[]): any | null {
  const cache = getAuditCache();
  const key = getCacheKey(appName, permissions);
  return cache[key] || null;
}
