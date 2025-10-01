/**
 * T041: Rate limiting middleware
 * Limits requests to 10 per minute per IP
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';
import { RateLimitedError } from '../lib/errors.js';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const RATE_LIMIT = parseInt(process.env.RATE_LIMIT_PER_MINUTE || '10');
const WINDOW_MS = 60 * 1000; // 1 minute

const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Rate limiting middleware
 */
export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const clientId = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  // Get or create rate limit entry
  let entry = rateLimitMap.get(clientId);

  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired entry
    entry = {
      count: 0,
      resetTime: now + WINDOW_MS,
    };
    rateLimitMap.set(clientId, entry);
  }

  // Increment count
  entry.count++;

  // Check limit
  if (entry.count > RATE_LIMIT) {
    const resetIn = Math.ceil((entry.resetTime - now) / 1000);

    logger.warn('Rate limit exceeded', {
      clientId,
      count: entry.count,
      limit: RATE_LIMIT,
      resetIn,
    });

    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: `Rate limit exceeded: ${RATE_LIMIT} requests per minute`,
        suggestion: `Wait ${resetIn} seconds before retrying`,
        details: {
          limit: RATE_LIMIT,
          windowMs: WINDOW_MS,
          resetIn,
        },
      },
    });
    return;
  }

  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT.toString());
  res.setHeader('X-RateLimit-Remaining', (RATE_LIMIT - entry.count).toString());
  res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());

  next();
}

/**
 * Cleanup expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;

  for (const [clientId, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(clientId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.debug('Rate limit map cleaned', { cleaned, remaining: rateLimitMap.size });
  }
}, 60 * 1000); // Every minute
