/**
 * T022: Screenshot capture service
 * Captures full-page screenshots with optimization
 */

import { Page } from 'puppeteer';
import { logger } from '../../lib/logger.js';
import { InternalError, ResourceTooLargeError, TimeoutError, UnreachableURLError } from '../../lib/errors.js';
import { validateResourceSize } from '../../lib/validation.js';

export interface CaptureOptions {
  fullPage?: boolean;
  timeout?: number;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
  maxSize?: number; // Max screenshot size in bytes
}

const DEFAULT_OPTIONS: CaptureOptions = {
  fullPage: true,
  timeout: 30000,
  waitUntil: 'networkidle0',
  maxSize: 10 * 1024 * 1024, // 10MB
};

export interface CaptureResult {
  screenshot: Buffer;
  metrics: {
    loadTime: number;
    renderTime: number;
    screenshotSize: number;
  };
}

/**
 * Navigates to a URL and captures a screenshot
 */
export async function captureScreenshot(
  page: Page,
  url: string,
  options: CaptureOptions = {},
  requestId?: string
): Promise<CaptureResult> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();

  logger.info('Starting screenshot capture', { url, options: mergedOptions, requestId });

  try {
    // Navigate to URL
    const navigationStart = Date.now();
    const response = await page.goto(url, {
      waitUntil: mergedOptions.waitUntil,
      timeout: mergedOptions.timeout,
    });

    if (!response) {
      throw new UnreachableURLError(url, 'No response received', requestId);
    }

    const statusCode = response.status();
    if (statusCode >= 400) {
      throw new UnreachableURLError(url, `HTTP ${statusCode} error`, requestId);
    }

    const loadTime = Date.now() - navigationStart;
    logger.debug('Page loaded', { url, loadTime, statusCode, requestId });

    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');

    // Get render time (first paint)
    const renderTime = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('paint');
      const firstPaint = perfData.find((entry) => entry.name === 'first-contentful-paint');
      return firstPaint ? firstPaint.startTime : 0;
    });

    // Capture screenshot
    const screenshotStart = Date.now();
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: mergedOptions.fullPage,
    });

    const screenshotTime = Date.now() - screenshotStart;
    const screenshotSize = screenshot.length;

    // Validate screenshot size
    if (!validateResourceSize(screenshotSize, mergedOptions.maxSize)) {
      throw new ResourceTooLargeError(
        url,
        screenshotSize,
        mergedOptions.maxSize!,
        requestId
      );
    }

    const totalTime = Date.now() - startTime;

    logger.info('Screenshot captured successfully', {
      url,
      loadTime,
      renderTime,
      screenshotTime,
      screenshotSize,
      totalTime,
      requestId,
    });

    return {
      screenshot,
      metrics: {
        loadTime,
        renderTime,
        screenshotSize,
      },
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    logger.error('Screenshot capture failed', { url, totalTime, error, requestId });

    // Handle timeout errors
    if (error instanceof Error && error.message.includes('timeout')) {
      throw new TimeoutError(url, mergedOptions.timeout!, requestId);
    }

    // Handle navigation errors
    if (error instanceof Error && error.message.includes('net::ERR_')) {
      throw new UnreachableURLError(url, error.message, requestId);
    }

    // Re-throw DIE errors
    if (error instanceof UnreachableURLError || error instanceof ResourceTooLargeError) {
      throw error;
    }

    // Wrap unknown errors
    throw new InternalError('Screenshot capture failed', {
      url,
      error: error instanceof Error ? error.message : String(error),
    }, requestId);
  }
}

/**
 * Captures a screenshot of a specific element
 */
export async function captureElement(
  page: Page,
  selector: string,
  requestId?: string
): Promise<Buffer> {
  try {
    logger.debug('Capturing element screenshot', { selector, requestId });

    const element = await page.$(selector);
    if (!element) {
      throw new InternalError(`Element not found: ${selector}`, { selector }, requestId);
    }

    const screenshot = await element.screenshot({ type: 'png' });
    logger.debug('Element screenshot captured', {
      selector,
      size: screenshot.length,
      requestId,
    });

    return screenshot;
  } catch (error) {
    logger.error('Element screenshot failed', { selector, error, requestId });
    throw new InternalError('Element screenshot failed', {
      selector,
      error: error instanceof Error ? error.message : String(error),
    }, requestId);
  }
}

/**
 * Gets page dimensions
 */
export async function getPageDimensions(page: Page): Promise<{
  width: number;
  height: number;
  deviceScaleFactor: number;
}> {
  const viewport = page.viewport();
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
  }));

  return {
    width: viewport?.width || dimensions.scrollWidth,
    height: viewport?.height || dimensions.scrollHeight,
    deviceScaleFactor: viewport?.deviceScaleFactor || 1,
  };
}
