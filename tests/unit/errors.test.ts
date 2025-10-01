/**
 * T046: Unit tests for error handling
 */

import { describe, it, expect } from '@jest/globals';
import {
  DIEError,
  InvalidURLError,
  UnreachableURLError,
  TimeoutError,
  DOMTooLargeError,
  ResourceTooLargeError,
  UnsupportedFrameworkError,
  UnsupportedStylingError,
  AIModelError,
  TemplateError,
  ValidationError,
  RateLimitedError,
  InternalError,
  toStructuredError,
} from '../../src/lib/errors.js';

describe('Error Handling', () => {
  describe('DIEError', () => {
    it('should create error with all properties', () => {
      const error = new DIEError(
        'INTERNAL_ERROR',
        'Test error',
        { detail: 'value' },
        'Try again',
        'req-123'
      );

      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.message).toBe('Test error');
      expect(error.details).toEqual({ detail: 'value' });
      expect(error.suggestion).toBe('Try again');
      expect(error.requestId).toBe('req-123');
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should serialize to JSON correctly', () => {
      const error = new DIEError('INTERNAL_ERROR', 'Test', { foo: 'bar' }, 'Suggestion');
      const json = error.toJSON();

      expect(json.code).toBe('INTERNAL_ERROR');
      expect(json.message).toBe('Test');
      expect(json.details).toEqual({ foo: 'bar' });
      expect(json.suggestion).toBe('Suggestion');
      expect(json.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('InvalidURLError', () => {
    it('should create error with URL and reason', () => {
      const error = new InvalidURLError('http://bad', 'Invalid format');

      expect(error.code).toBe('INVALID_URL');
      expect(error.message).toContain('Invalid format');
      expect(error.details?.url).toBe('http://bad');
      expect(error.suggestion).toContain('valid HTTP or HTTPS');
    });
  });

  describe('UnreachableURLError', () => {
    it('should create error with URL and reason', () => {
      const error = new UnreachableURLError('https://notfound.com', 'DNS lookup failed');

      expect(error.code).toBe('UNREACHABLE_URL');
      expect(error.message).toContain('DNS lookup failed');
      expect(error.details?.url).toBe('https://notfound.com');
      expect(error.suggestion).toContain('network');
    });
  });

  describe('TimeoutError', () => {
    it('should create error with timeout details', () => {
      const error = new TimeoutError('https://slow.com', 30000);

      expect(error.code).toBe('TIMEOUT');
      expect(error.message).toContain('30000ms');
      expect(error.details?.timeoutMs).toBe(30000);
      expect(error.suggestion).toContain('timeout');
    });
  });

  describe('DOMTooLargeError', () => {
    it('should create error with element count', () => {
      const error = new DOMTooLargeError('https://huge.com', 750, 500);

      expect(error.code).toBe('DOM_TOO_LARGE');
      expect(error.message).toContain('750');
      expect(error.message).toContain('500');
      expect(error.details?.elementCount).toBe(750);
      expect(error.details?.maxElements).toBe(500);
      expect(error.suggestion).toContain('complex');
    });
  });

  describe('ResourceTooLargeError', () => {
    it('should create error with size details', () => {
      const fifteenMB = 15 * 1024 * 1024;
      const tenMB = 10 * 1024 * 1024;
      const error = new ResourceTooLargeError('https://heavy.com', fifteenMB, tenMB);

      expect(error.code).toBe('RESOURCE_TOO_LARGE');
      expect(error.message).toContain('15MB');
      expect(error.message).toContain('10MB');
      expect(error.details?.sizeBytes).toBe(fifteenMB);
      expect(error.suggestion).toContain('resources');
    });
  });

  describe('UnsupportedFrameworkError', () => {
    it('should create error with framework name', () => {
      const error = new UnsupportedFrameworkError('nextjs');

      expect(error.code).toBe('UNSUPPORTED_FRAMEWORK');
      expect(error.message).toContain('nextjs');
      expect(error.suggestion).toContain('react, angular, vue, svelte');
    });
  });

  describe('UnsupportedStylingError', () => {
    it('should create error with styling name', () => {
      const error = new UnsupportedStylingError('emotion');

      expect(error.code).toBe('UNSUPPORTED_STYLING');
      expect(error.message).toContain('emotion');
      expect(error.suggestion).toContain('tailwind, css, scss');
    });

    it('should provide specific suggestion for styled-components with non-React', () => {
      const error = new UnsupportedStylingError('styled-components', 'vue');

      expect(error.suggestion).toContain('only compatible with React');
    });
  });

  describe('AIModelError', () => {
    it('should create error with model and reason', () => {
      const error = new AIModelError('llava:7b', 'Model not loaded');

      expect(error.code).toBe('AI_MODEL_ERROR');
      expect(error.message).toContain('llava:7b');
      expect(error.message).toContain('Model not loaded');
      expect(error.suggestion).toContain('Ollama');
    });
  });

  describe('TemplateError', () => {
    it('should create error with framework and styling', () => {
      const error = new TemplateError('react', 'tailwind', 'Template parse failed');

      expect(error.code).toBe('TEMPLATE_ERROR');
      expect(error.message).toContain('react');
      expect(error.message).toContain('tailwind');
      expect(error.suggestion).toContain('report');
    });
  });

  describe('ValidationError', () => {
    it('should create error with field and reason', () => {
      const error = new ValidationError('email', 'Invalid format');

      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toContain('email');
      expect(error.message).toContain('Invalid format');
      expect(error.suggestion).toContain('parameters');
    });
  });

  describe('RateLimitedError', () => {
    it('should create error with rate limit details', () => {
      const error = new RateLimitedError(10, 60000);

      expect(error.code).toBe('RATE_LIMITED');
      expect(error.message).toContain('10');
      expect(error.message).toContain('60s');
      expect(error.details?.limit).toBe(10);
      expect(error.details?.windowMs).toBe(60000);
      expect(error.suggestion).toContain('60 seconds');
    });
  });

  describe('InternalError', () => {
    it('should create error with reason', () => {
      const error = new InternalError('Database connection failed', { host: 'localhost' });

      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.message).toContain('Database connection failed');
      expect(error.details?.host).toBe('localhost');
      expect(error.suggestion).toContain('try again');
    });
  });

  describe('toStructuredError', () => {
    it('should convert DIEError to structured format', () => {
      const error = new InvalidURLError('http://bad', 'Malformed');
      const structured = toStructuredError(error);

      expect(structured.code).toBe('INVALID_URL');
      expect(structured.message).toContain('Malformed');
      expect(structured.suggestion).toBeDefined();
    });

    it('should convert standard Error to structured format', () => {
      const error = new Error('Something went wrong');
      const structured = toStructuredError(error, 'req-456');

      expect(structured.code).toBe('INTERNAL_ERROR');
      expect(structured.message).toBe('Something went wrong');
      expect(structured.requestId).toBe('req-456');
      expect(structured.details?.stack).toBeDefined();
    });

    it('should convert unknown errors to structured format', () => {
      const structured = toStructuredError('String error', 'req-789');

      expect(structured.code).toBe('INTERNAL_ERROR');
      expect(structured.message).toBe('String error');
      expect(structured.requestId).toBe('req-789');
    });

    it('should include timestamp', () => {
      const structured = toStructuredError(new Error('Test'));

      expect(structured.timestamp).toBeInstanceOf(Date);
    });
  });
});
