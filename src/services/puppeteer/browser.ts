/**
 * T021: Browser lifecycle management
 * Manages Puppeteer browser instances with proper cleanup
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { logger } from '../../lib/logger.js';
import { InternalError } from '../../lib/errors.js';

interface BrowserConfig {
  headless?: boolean;
  timeout?: number;
  args?: string[];
}

const DEFAULT_CONFIG: BrowserConfig = {
  headless: true,
  timeout: 30000,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--window-size=1920,1080',
  ],
};

let browserInstance: Browser | null = null;
let browserRefCount = 0;

/**
 * Launches a new browser instance or returns existing one
 */
export async function getBrowser(config: BrowserConfig = {}): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    browserRefCount++;
    logger.info('Reusing existing browser instance', { refCount: browserRefCount });
    return browserInstance;
  }

  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  logger.info('Launching new browser instance', { config: mergedConfig });

  try {
    browserInstance = await puppeteer.launch({
      headless: mergedConfig.headless,
      args: mergedConfig.args,
      timeout: mergedConfig.timeout,
    });

    browserRefCount = 1;

    // Handle unexpected browser closure
    browserInstance.on('disconnected', () => {
      logger.warn('Browser disconnected unexpectedly');
      browserInstance = null;
      browserRefCount = 0;
    });

    logger.info('Browser instance launched successfully');
    return browserInstance;
  } catch (error) {
    logger.error('Failed to launch browser', { error });
    throw new InternalError('Failed to launch browser', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Creates a new page with default settings
 */
export async function createPage(browser: Browser): Promise<Page> {
  try {
    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    // Set user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Block unnecessary resources to speed up loading
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      const url = request.url();

      // Block ads, analytics, and social media trackers
      if (
        resourceType === 'font' ||
        url.includes('google-analytics.com') ||
        url.includes('googletagmanager.com') ||
        url.includes('facebook.com') ||
        url.includes('twitter.com') ||
        url.includes('doubleclick.net') ||
        url.includes('analytics')
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });

    logger.debug('New page created with default settings');
    return page;
  } catch (error) {
    logger.error('Failed to create page', { error });
    throw new InternalError('Failed to create page', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Closes a page and handles cleanup
 */
export async function closePage(page: Page): Promise<void> {
  try {
    if (!page.isClosed()) {
      await page.close();
      logger.debug('Page closed successfully');
    }
  } catch (error) {
    logger.error('Error closing page', { error });
  }
}

/**
 * Releases a browser reference and closes if no more references
 */
export async function releaseBrowser(): Promise<void> {
  browserRefCount = Math.max(0, browserRefCount - 1);
  logger.debug('Browser reference released', { refCount: browserRefCount });

  if (browserRefCount === 0 && browserInstance) {
    await closeBrowser();
  }
}

/**
 * Forcefully closes the browser instance
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    try {
      await browserInstance.close();
      logger.info('Browser instance closed');
    } catch (error) {
      logger.error('Error closing browser', { error });
    } finally {
      browserInstance = null;
      browserRefCount = 0;
    }
  }
}

/**
 * Gets browser status
 */
export function getBrowserStatus(): {
  active: boolean;
  refCount: number;
} {
  return {
    active: browserInstance !== null && browserInstance.isConnected(),
    refCount: browserRefCount,
  };
}

/**
 * Cleanup function for graceful shutdown
 */
export async function cleanup(): Promise<void> {
  logger.info('Cleaning up browser resources');
  await closeBrowser();
}

// Handle process termination
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
