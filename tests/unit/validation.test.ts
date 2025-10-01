/**
 * T045: Unit tests for URL validation
 */

import { describe, it, expect } from '@jest/globals';
import {
  validateURL,
  normalizeURL,
  validateDOMSize,
  validateResourceSize,
  sanitizeInput,
  isValidUUIDv4,
  isValidHexColor,
  isValidISO8601,
} from '../../src/lib/validation.js';
import { InvalidURLError } from '../../src/lib/errors.js';

describe('URL Validation', () => {
  describe('validateURL', () => {
    it('should accept valid HTTP URLs', () => {
      const url = 'http://example.com';
      const result = validateURL(url);
      expect(result).toBeDefined();
      expect(result.protocol).toBe('http:');
      expect(result.hostname).toBe('example.com');
    });

    it('should accept valid HTTPS URLs', () => {
      const url = 'https://example.com';
      const result = validateURL(url);
      expect(result).toBeDefined();
      expect(result.protocol).toBe('https:');
    });

    it('should reject empty URLs', () => {
      expect(() => validateURL('')).toThrow(InvalidURLError);
      expect(() => validateURL('  ')).toThrow(InvalidURLError);
    });

    it('should reject malformed URLs', () => {
      expect(() => validateURL('not-a-url')).toThrow(InvalidURLError);
      expect(() => validateURL('ht!tp://bad')).toThrow(InvalidURLError);
    });

    it('should reject file:// protocol', () => {
      expect(() => validateURL('file:///etc/passwd')).toThrow(InvalidURLError);
    });

    it('should reject data: URLs', () => {
      expect(() => validateURL('data:text/html,<h1>Hello</h1>')).toThrow(InvalidURLError);
    });

    it('should reject localhost', () => {
      expect(() => validateURL('http://localhost:3000')).toThrow(InvalidURLError);
      expect(() => validateURL('https://localhost')).toThrow(InvalidURLError);
    });

    it('should reject private IP ranges', () => {
      expect(() => validateURL('http://192.168.1.1')).toThrow(InvalidURLError);
      expect(() => validateURL('http://10.0.0.1')).toThrow(InvalidURLError);
      expect(() => validateURL('http://172.16.0.1')).toThrow(InvalidURLError);
      expect(() => validateURL('http://127.0.0.1')).toThrow(InvalidURLError);
    });

    it('should reject URLs exceeding max length', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2050);
      expect(() => validateURL(longUrl)).toThrow(InvalidURLError);
    });

    it('should accept URLs with paths and query params', () => {
      const url = 'https://example.com/path?param=value';
      const result = validateURL(url);
      expect(result.pathname).toBe('/path');
      expect(result.searchParams.get('param')).toBe('value');
    });
  });

  describe('normalizeURL', () => {
    it('should remove tracking parameters', () => {
      const url = 'https://example.com?utm_source=test&param=keep';
      const normalized = normalizeURL(url);
      expect(normalized).not.toContain('utm_source');
      expect(normalized).toContain('param=keep');
    });

    it('should remove fragment', () => {
      const url = 'https://example.com/page#section';
      const normalized = normalizeURL(url);
      expect(normalized).not.toContain('#section');
    });

    it('should sort query parameters', () => {
      const url = 'https://example.com?z=1&a=2&m=3';
      const normalized = normalizeURL(url);
      expect(normalized).toBe('https://example.com/?a=2&m=3&z=1');
    });

    it('should handle invalid URLs gracefully', () => {
      const invalid = 'not-a-url';
      const result = normalizeURL(invalid);
      expect(result).toBe(invalid);
    });
  });

  describe('validateDOMSize', () => {
    it('should accept DOM within limit', () => {
      expect(validateDOMSize(100, 500)).toBe(true);
      expect(validateDOMSize(500, 500)).toBe(true);
    });

    it('should reject DOM exceeding limit', () => {
      expect(validateDOMSize(501, 500)).toBe(false);
      expect(validateDOMSize(1000, 500)).toBe(false);
    });

    it('should use default limit of 500', () => {
      expect(validateDOMSize(400)).toBe(true);
      expect(validateDOMSize(600)).toBe(false);
    });
  });

  describe('validateResourceSize', () => {
    it('should accept resources within limit', () => {
      const fiveMB = 5 * 1024 * 1024;
      const tenMB = 10 * 1024 * 1024;
      expect(validateResourceSize(fiveMB, tenMB)).toBe(true);
      expect(validateResourceSize(tenMB, tenMB)).toBe(true);
    });

    it('should reject resources exceeding limit', () => {
      const elevenMB = 11 * 1024 * 1024;
      const tenMB = 10 * 1024 * 1024;
      expect(validateResourceSize(elevenMB, tenMB)).toBe(false);
    });

    it('should use default limit of 10MB', () => {
      const nineMB = 9 * 1024 * 1024;
      const elevenMB = 11 * 1024 * 1024;
      expect(validateResourceSize(nineMB)).toBe(true);
      expect(validateResourceSize(elevenMB)).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove HTML brackets', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert(xss)/script');
    });

    it('should remove quotes', () => {
      expect(sanitizeInput('test"value\'here')).toBe('testvaluehere');
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  test  ')).toBe('test');
    });

    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput('   ')).toBe('');
    });
  });

  describe('isValidUUIDv4', () => {
    it('should accept valid UUID v4', () => {
      expect(isValidUUIDv4('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidUUIDv4('6ba7b810-9dad-41d1-80b4-00c04fd430c8')).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(isValidUUIDv4('not-a-uuid')).toBe(false);
      expect(isValidUUIDv4('550e8400-e29b-11d4-a716-446655440000')).toBe(false); // Wrong version
      expect(isValidUUIDv4('550e8400e29b41d4a716446655440000')).toBe(false); // No hyphens
    });

    it('should be case insensitive', () => {
      expect(isValidUUIDv4('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
    });
  });

  describe('isValidHexColor', () => {
    it('should accept valid hex colors', () => {
      expect(isValidHexColor('#000000')).toBe(true);
      expect(isValidHexColor('#FFFFFF')).toBe(true);
      expect(isValidHexColor('#ff5733')).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(isValidHexColor('000000')).toBe(false); // Missing #
      expect(isValidHexColor('#FFF')).toBe(false); // Too short
      expect(isValidHexColor('#GGGGGG')).toBe(false); // Invalid chars
      expect(isValidHexColor('#1234567')).toBe(false); // Too long
    });
  });

  describe('isValidISO8601', () => {
    it('should accept valid ISO 8601 dates', () => {
      const date = new Date().toISOString();
      expect(isValidISO8601(date)).toBe(true);
    });

    it('should reject invalid date strings', () => {
      expect(isValidISO8601('not-a-date')).toBe(false);
      expect(isValidISO8601('2024-13-01')).toBe(false); // Invalid month
    });

    it('should require exact ISO format', () => {
      expect(isValidISO8601('2024-01-01')).toBe(false); // Missing time
    });
  });
});
