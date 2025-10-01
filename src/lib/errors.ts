/**
 * T019: Structured error definitions
 * Standardized error format with codes and recovery suggestions
 */

export type ErrorCode =
  | 'INVALID_URL'
  | 'UNREACHABLE_URL'
  | 'TIMEOUT'
  | 'DOM_TOO_LARGE'
  | 'RESOURCE_TOO_LARGE'
  | 'UNSUPPORTED_FRAMEWORK'
  | 'UNSUPPORTED_STYLING'
  | 'AI_MODEL_ERROR'
  | 'TEMPLATE_ERROR'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export interface StructuredError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  suggestion?: string;
  timestamp?: Date;
  requestId?: string;
}

/**
 * Base class for all DIE errors
 */
export class DIEError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;
  public readonly suggestion?: string;
  public readonly timestamp: Date;
  public readonly requestId?: string;

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
    suggestion?: string,
    requestId?: string
  ) {
    super(message);
    this.name = 'DIEError';
    this.code = code;
    this.details = details;
    this.suggestion = suggestion;
    this.timestamp = new Date();
    this.requestId = requestId;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): StructuredError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      suggestion: this.suggestion,
      timestamp: this.timestamp,
      requestId: this.requestId,
    };
  }
}

/**
 * URL validation errors
 */
export class InvalidURLError extends DIEError {
  constructor(url: string, reason: string, requestId?: string) {
    super(
      'INVALID_URL',
      `Invalid URL: ${reason}`,
      { url, reason },
      'Provide a valid HTTP or HTTPS URL. Avoid localhost, private IPs, and file:// protocols.',
      requestId
    );
    this.name = 'InvalidURLError';
  }
}

export class UnreachableURLError extends DIEError {
  constructor(url: string, reason: string, requestId?: string) {
    super(
      'UNREACHABLE_URL',
      `Cannot reach URL: ${reason}`,
      { url, reason },
      'Check network connectivity and ensure the URL is accessible from your network.',
      requestId
    );
    this.name = 'UnreachableURLError';
  }
}

/**
 * Performance and resource errors
 */
export class TimeoutError extends DIEError {
  constructor(url: string, timeoutMs: number, requestId?: string) {
    super(
      'TIMEOUT',
      `Analysis timeout after ${timeoutMs}ms`,
      { url, timeoutMs },
      'The page took too long to analyze. Try a simpler page or increase the timeout limit.',
      requestId
    );
    this.name = 'TimeoutError';
  }
}

export class DOMTooLargeError extends DIEError {
  constructor(url: string, elementCount: number, maxElements: number, requestId?: string) {
    super(
      'DOM_TOO_LARGE',
      `Page has ${elementCount} DOM elements (max: ${maxElements})`,
      { url, elementCount, maxElements },
      'The page is too complex. Try analyzing a specific section or a simpler page.',
      requestId
    );
    this.name = 'DOMTooLargeError';
  }
}

export class ResourceTooLargeError extends DIEError {
  constructor(url: string, sizeBytes: number, maxBytes: number, requestId?: string) {
    super(
      'RESOURCE_TOO_LARGE',
      `Page resources are ${Math.round(sizeBytes / 1024 / 1024)}MB (max: ${Math.round(maxBytes / 1024 / 1024)}MB)`,
      { url, sizeBytes, maxBytes },
      'The page has too many large resources. Try a page with fewer images and assets.',
      requestId
    );
    this.name = 'ResourceTooLargeError';
  }
}

/**
 * Configuration errors
 */
export class UnsupportedFrameworkError extends DIEError {
  constructor(framework: string, requestId?: string) {
    super(
      'UNSUPPORTED_FRAMEWORK',
      `Unsupported framework: ${framework}`,
      { framework },
      'Use one of: react, angular, vue, svelte',
      requestId
    );
    this.name = 'UnsupportedFrameworkError';
  }
}

export class UnsupportedStylingError extends DIEError {
  constructor(styling: string, framework?: string, requestId?: string) {
    const suggestion =
      framework !== 'react' && styling === 'styled-components'
        ? 'styled-components is only compatible with React framework'
        : 'Use one of: tailwind, css, scss, styled-components (styled-components only for React)';

    super('UNSUPPORTED_STYLING', `Unsupported styling: ${styling}`, { styling, framework }, suggestion, requestId);
    this.name = 'UnsupportedStylingError';
  }
}

/**
 * AI and generation errors
 */
export class AIModelError extends DIEError {
  constructor(model: string, reason: string, requestId?: string) {
    super(
      'AI_MODEL_ERROR',
      `AI model error (${model}): ${reason}`,
      { model, reason },
      'Ensure Ollama is running and models (llava:7b, codellama:13b) are loaded.',
      requestId
    );
    this.name = 'AIModelError';
  }
}

export class TemplateError extends DIEError {
  constructor(framework: string, styling: string, reason: string, requestId?: string) {
    super(
      'TEMPLATE_ERROR',
      `Template generation failed for ${framework} + ${styling}: ${reason}`,
      { framework, styling, reason },
      'This is an internal error. Please report this issue with the URL and configuration used.',
      requestId
    );
    this.name = 'TemplateError';
  }
}

export class ValidationError extends DIEError {
  constructor(field: string, reason: string, requestId?: string) {
    super('VALIDATION_ERROR', `Validation failed for ${field}: ${reason}`, { field, reason }, 'Check the input parameters and try again.', requestId);
    this.name = 'ValidationError';
  }
}

/**
 * Rate limiting and system errors
 */
export class RateLimitedError extends DIEError {
  constructor(limit: number, windowMs: number, requestId?: string) {
    super(
      'RATE_LIMITED',
      `Rate limit exceeded: ${limit} requests per ${windowMs / 1000}s`,
      { limit, windowMs },
      `Wait ${Math.round(windowMs / 1000)} seconds before retrying.`,
      requestId
    );
    this.name = 'RateLimitedError';
  }
}

export class InternalError extends DIEError {
  constructor(reason: string, details?: Record<string, unknown>, requestId?: string) {
    super(
      'INTERNAL_ERROR',
      `Internal server error: ${reason}`,
      details,
      'This is an internal error. Please try again or report the issue if it persists.',
      requestId
    );
    this.name = 'InternalError';
  }
}

/**
 * Converts any error to a structured error
 */
export function toStructuredError(error: unknown, requestId?: string): StructuredError {
  if (error instanceof DIEError) {
    return error.toJSON();
  }

  if (error instanceof Error) {
    return {
      code: 'INTERNAL_ERROR',
      message: error.message,
      details: { stack: error.stack },
      suggestion: 'An unexpected error occurred. Please try again or report the issue.',
      timestamp: new Date(),
      requestId,
    };
  }

  return {
    code: 'INTERNAL_ERROR',
    message: String(error),
    suggestion: 'An unexpected error occurred. Please try again or report the issue.',
    timestamp: new Date(),
    requestId,
  };
}
