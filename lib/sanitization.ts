/**
 * Enhanced input sanitization and validation
 * Prevents XSS, SQL injection, and other common attacks
 */

/**
 * Sanitize HTML input to prevent XSS attacks
 */
export function sanitizeHTML(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return input.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Sanitize URL to prevent malicious redirects
 */
export function sanitizeURL(input: string): string {
  try {
    const url = new URL(input);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return '';
    }
    return url.toString();
  } catch {
    // Invalid URL
    return '';
  }
}

/**
 * Remove potentially dangerous characters from filenames
 */
export function sanitizeFileName(input: string): string {
  return input
    .replace(/[/\\?%*:|"<>]/g, '') // Remove illegal filename characters
    .replace(/\s+/g, '_') // Replace whitespace with underscores
    .replace(/^\.+/, '') // Remove leading dots
    .slice(0, 255); // Limit to 255 chars
}

/**
 * Sanitize JSON string to prevent injection
 */
export function sanitizeJSON(input: string): string {
  try {
    // Parse and re-stringify to remove any potential malicious content
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed);
  } catch {
    return '{}';
  }
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(input: string): string {
  const email = input.trim().toLowerCase();
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return '';
  }
  
  return email.slice(0, 254); // Email max length per RFC 5321
}

/**
 * Sanitize package name (Android package format)
 */
export function sanitizePackageName(input: string): string {
  // Package names can only contain alphanumerics and dots
  let sanitized = input
    .replace(/[^a-zA-Z0-9.]/g, '') // Remove invalid characters
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.+$/, '') // Remove trailing dots
    .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
    .toLowerCase();
  
  // Limit length
  if (sanitized.length > 255) {
    sanitized = sanitized.slice(0, 255);
  }
  
  return sanitized;
}

/**
 * Remove SQL injection attempts
 */
export function sanitizeSQLInput(input: string): string {
  return input
    .replace(/['";\\]/g, (char) => '\\' + char) // Escape special SQL characters
    .slice(0, 1000); // Limit length
}

/**
 * Sanitize command-line input
 */
export function sanitizeShellInput(input: string): string {
  // Remove shell metacharacters
  return input
    .replace(/[;&|`$()[\]{}><'"\n\r\t]/g, '')
    .slice(0, 1000);
}

/**
 * Validate input length
 */
export function validateInputLength(input: string, min = 1, max = 1000): { valid: boolean; error?: string } {
  if (input.length < min) {
    return { valid: false, error: `Input must be at least ${min} character(s)` };
  }
  if (input.length > max) {
    return { valid: false, error: `Input cannot exceed ${max} character(s)` };
  }
  return { valid: true };
}

/**
 * Validate input contains only safe characters
 */
export function validateSafeCharacters(input: string): { valid: boolean; error?: string } {
  // Allow alphanumeric, spaces, and common punctuation
  const safeRegex = /^[a-zA-Z0-9\s\-_.,'!?()]+$/;
  
  if (!safeRegex.test(input)) {
    return { valid: false, error: 'Input contains invalid characters' };
  }
  
  return { valid: true };
}

/**
 * Comprehensive input sanitization
 */
export function sanitizeInput(
  input: string,
  options: {
    type?: 'text' | 'email' | 'url' | 'filename' | 'package' | 'html';
    maxLength?: number;
    trim?: boolean;
  } = {}
): string {
  const { type = 'text', maxLength = 1000, trim = true } = options;
  
  let sanitized = input;
  
  // Trim whitespace if requested
  if (trim) {
    sanitized = sanitized.trim();
  }
  
  // Apply type-specific sanitization
  switch (type) {
    case 'email':
      sanitized = sanitizeEmail(sanitized);
      break;
    case 'url':
      sanitized = sanitizeURL(sanitized);
      break;
    case 'filename':
      sanitized = sanitizeFileName(sanitized);
      break;
    case 'package':
      sanitized = sanitizePackageName(sanitized);
      break;
    case 'html':
      sanitized = sanitizeHTML(sanitized);
      break;
    case 'text':
    default:
      sanitized = sanitizeHTML(sanitized); // Default to HTML sanitization for safety
      break;
  }
  
  // Enforce maximum length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }
  
  return sanitized;
}
