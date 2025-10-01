/**
 * T020: URL validation utilities
 * Input validation for URLs with security checks
 */

import { InvalidURLError } from './errors.js';

// Private IP ranges (RFC 1918, RFC 4193)
const PRIVATE_IP_PATTERNS = [
  /^10\./,                          // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[0-1])\./,    // 172.16.0.0/12
  /^192\.168\./,                    // 192.168.0.0/16
  /^127\./,                         // 127.0.0.0/8 (loopback)
  /^169\.254\./,                    // 169.254.0.0/16 (link-local)
  /^fc00:/,                         // IPv6 private
  /^fe80:/,                         // IPv6 link-local
  /^::1$/,                          // IPv6 loopback
];

// Localhost patterns
const LOCALHOST_PATTERNS = [
  'localhost',
  '0.0.0.0',
];

/**
 * Validates a URL for webpage analysis
 * @throws InvalidURLError if the URL is invalid
 */
export function validateURL(url: string, requestId?: string): URL {
  // Check if URL is provided
  if (!url || url.trim().length === 0) {
    throw new InvalidURLError(url, 'URL is required', requestId);
  }

  // Check maximum length
  if (url.length > 2048) {
    throw new InvalidURLError(url, 'URL exceeds maximum length of 2048 characters', requestId);
  }

  // Parse URL
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch (error) {
    throw new InvalidURLError(url, 'Malformed URL format', requestId);
  }

  // Check protocol (only HTTP/HTTPS allowed)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new InvalidURLError(
      url,
      `Protocol ${parsed.protocol} not allowed. Use http:// or https://`,
      requestId
    );
  }

  // Check for localhost
  const hostname = parsed.hostname.toLowerCase();
  if (LOCALHOST_PATTERNS.includes(hostname)) {
    throw new InvalidURLError(url, 'Localhost URLs are not allowed', requestId);
  }

  // Check for private IP ranges
  if (isPrivateIP(hostname)) {
    throw new InvalidURLError(url, 'Private IP addresses are not allowed', requestId);
  }

  // Check for data: URLs
  if (url.startsWith('data:')) {
    throw new InvalidURLError(url, 'Data URLs are not allowed', requestId);
  }

  // Check for file: URLs
  if (url.startsWith('file:')) {
    throw new InvalidURLError(url, 'File URLs are not allowed', requestId);
  }

  return parsed;
}

/**
 * Checks if a hostname is a private IP address
 */
function isPrivateIP(hostname: string): boolean {
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(hostname));
}

/**
 * Normalizes a URL for caching purposes
 * Removes tracking parameters and fragments
 */
export function normalizeURL(url: string): string {
  try {
    const parsed = new URL(url);

    // Remove common tracking parameters
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'gclid',
      'ref',
      '_ga',
    ];

    trackingParams.forEach((param) => {
      parsed.searchParams.delete(param);
    });

    // Remove fragment
    parsed.hash = '';

    // Sort query parameters for consistency
    const sortedParams = new URLSearchParams(
      [...parsed.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b))
    );
    parsed.search = sortedParams.toString();

    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Validates DOM element count against limit
 */
export function validateDOMSize(elementCount: number, maxElements: number = 500): boolean {
  return elementCount <= maxElements;
}

/**
 * Validates resource size against limit
 */
export function validateResourceSize(sizeBytes: number, maxBytes: number = 10 * 1024 * 1024): boolean {
  return sizeBytes <= maxBytes;
}

/**
 * Sanitizes user input by removing potentially dangerous characters
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/['"]/g, '') // Remove quotes
    .trim();
}

/**
 * Validates a UUID v4 format
 */
export function isValidUUIDv4(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validates a hex color format
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Validates an ISO 8601 date string
 */
export function isValidISO8601(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    return date.toISOString() === dateString;
  } catch {
    return false;
  }
}
