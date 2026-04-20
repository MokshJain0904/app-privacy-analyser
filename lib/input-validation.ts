/**
 * Input validation utilities for sanitizing and validating app names and user inputs
 */

export const validateAppName = (appName: string): { valid: boolean; error?: string } => {
  if (!appName || typeof appName !== 'string') {
    return { valid: false, error: 'App name is required' };
  }

  const trimmed = appName.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'App name cannot be empty' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'App name is too long (max 100 characters)' };
  }

  // Check for valid characters (alphanumeric, spaces, hyphens, dots)
  if (!/^[a-zA-Z0-9\s\-._]+$/.test(trimmed)) {
    return { valid: false, error: 'App name contains invalid characters' };
  }

  return { valid: true };
};

export const sanitizeAppName = (appName: string): string => {
  return appName
    .trim()
    .replace(/[^a-zA-Z0-9\s\-._]/g, '') // Remove invalid characters
    .substring(0, 100); // Limit length
};

export const validatePackageName = (packageName: string): { valid: boolean; error?: string } => {
  if (!packageName) {
    return { valid: false, error: 'Package name is required' };
  }

  // Android package name format: com.example.app or similar
  const packageRegex = /^[a-z][a-z0-9]*(\.[a-z0-9]+)*$/i;

  if (!packageRegex.test(packageName)) {
    return { valid: false, error: 'Invalid package name format' };
  }

  return { valid: true };
};

export const validatePermissions = (
  permissions: string[]
): { valid: boolean; error?: string } => {
  if (!Array.isArray(permissions)) {
    return { valid: false, error: 'Permissions must be an array' };
  }

  if (permissions.length > 50) {
    return { valid: false, error: 'Too many permissions selected' };
  }

  return { valid: true };
};
