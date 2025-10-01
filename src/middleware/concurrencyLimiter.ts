/**
 * T042: Concurrent request handling middleware
 * Limits to max 3 concurrent analyses
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';

const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT_ANALYSES || '3');

let activeRequests = 0;
const requestQueue: Array<() => void> = [];

/**
 * Concurrency limiter middleware
 */
export function concurrencyLimiter(req: Request, res: Response, next: NextFunction): void {
  // Only apply to analysis endpoints
  if (!req.path.includes('/sse') && !req.path.includes('/analyze')) {
    next();
    return;
  }

  logger.debug('Concurrency check', {
    active: activeRequests,
    max: MAX_CONCURRENT,
    queued: requestQueue.length,
  });

  if (activeRequests < MAX_CONCURRENT) {
    // Slot available, proceed immediately
    activeRequests++;

    logger.debug('Request accepted', {
      active: activeRequests,
      path: req.path,
    });

    // Decrement on response finish
    res.on('finish', () => {
      activeRequests--;
      logger.debug('Request completed', {
        active: activeRequests,
        queued: requestQueue.length,
      });

      // Process next queued request if any
      const nextRequest = requestQueue.shift();
      if (nextRequest) {
        nextRequest();
      }
    });

    next();
  } else {
    // Queue is full, reject or queue
    if (requestQueue.length >= 10) {
      logger.warn('Concurrency queue full, rejecting request', {
        active: activeRequests,
        queued: requestQueue.length,
      });

      res.status(503).json({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Server is at maximum capacity',
          suggestion: 'Please try again in a few moments',
          details: {
            maxConcurrent: MAX_CONCURRENT,
            activeRequests,
            queuedRequests: requestQueue.length,
          },
        },
      });
      return;
    }

    // Queue the request
    logger.info('Request queued', {
      active: activeRequests,
      queued: requestQueue.length + 1,
    });

    requestQueue.push(() => {
      activeRequests++;

      logger.debug('Queued request starting', {
        active: activeRequests,
        queued: requestQueue.length,
      });

      // Decrement on response finish
      res.on('finish', () => {
        activeRequests--;

        // Process next queued request if any
        const nextRequest = requestQueue.shift();
        if (nextRequest) {
          nextRequest();
        }
      });

      next();
    });
  }
}

/**
 * Gets current concurrency stats
 */
export function getConcurrencyStats(): {
  active: number;
  max: number;
  queued: number;
} {
  return {
    active: activeRequests,
    max: MAX_CONCURRENT,
    queued: requestQueue.length,
  };
}
