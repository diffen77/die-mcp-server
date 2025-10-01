/**
 * T023: DOM extraction service
 * Extracts DOM structure, styles, colors, typography (JavaScript disabled, HTML only)
 */

import { Page } from 'puppeteer';
import { logger } from '../../lib/logger.js';
import { DOMTooLargeError, InternalError } from '../../lib/errors.js';
import {
  DOMNode,
  Color,
  Typography,
  Layout,
  SemanticElement,
  PageMetrics,
  ComputedStyles,
} from '../../models/WebpageAnalysis.js';
import { validateDOMSize } from '../../lib/validation.js';

export interface DOMExtractionResult {
  domStructure: DOMNode;
  colorPalette: Color[];
  typography: Typography[];
  layoutPatterns: Layout[];
  semanticStructure: SemanticElement[];
  pageMetrics: PageMetrics;
}

/**
 * Extracts complete DOM structure and design information
 */
export async function extractDOM(
  page: Page,
  url: string,
  maxElements: number = 500,
  requestId?: string
): Promise<DOMExtractionResult> {
  logger.info('Starting DOM extraction', { url, maxElements, requestId });
  const startTime = Date.now();

  try {
    // Disable JavaScript for static HTML extraction
    await page.setJavaScriptEnabled(false);

    // Re-navigate to get static HTML
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Re-enable JavaScript for extraction scripts
    await page.setJavaScriptEnabled(true);

    // Extract DOM metrics first
    const metrics = await extractPageMetrics(page);

    // Validate DOM size
    if (!validateDOMSize(metrics.domElements, maxElements)) {
      throw new DOMTooLargeError(url, metrics.domElements, maxElements, requestId);
    }

    logger.debug('DOM metrics extracted', { metrics, requestId });

    // Extract all design information in parallel
    const [domStructure, colorPalette, typography, layoutPatterns, semanticStructure] =
      await Promise.all([
        extractDOMStructure(page),
        extractColorPalette(page),
        extractTypography(page),
        extractLayoutPatterns(page),
        extractSemanticStructure(page),
      ]);

    const extractionTime = Date.now() - startTime;
    logger.info('DOM extraction completed', {
      url,
      extractionTime,
      domElements: metrics.domElements,
      colors: colorPalette.length,
      fonts: typography.length,
      requestId,
    });

    return {
      domStructure,
      colorPalette,
      typography,
      layoutPatterns,
      semanticStructure,
      pageMetrics: metrics,
    };
  } catch (error) {
    logger.error('DOM extraction failed', { url, error, requestId });

    if (error instanceof DOMTooLargeError) {
      throw error;
    }

    throw new InternalError('DOM extraction failed', {
      url,
      error: error instanceof Error ? error.message : String(error),
    }, requestId);
  }
}

/**
 * Extracts hierarchical DOM structure
 */
async function extractDOMStructure(page: Page): Promise<DOMNode> {
  return page.evaluate(() => {
    function extractNode(element: Element): DOMNode {
      const computedStyle = window.getComputedStyle(element);

      const styles: ComputedStyles = {
        color: computedStyle.color,
        backgroundColor: computedStyle.backgroundColor,
        fontSize: computedStyle.fontSize,
        fontFamily: computedStyle.fontFamily,
        fontWeight: computedStyle.fontWeight,
        lineHeight: computedStyle.lineHeight,
        margin: computedStyle.margin,
        padding: computedStyle.padding,
        display: computedStyle.display,
        position: computedStyle.position,
        width: computedStyle.width,
        height: computedStyle.height,
      };

      const node: DOMNode = {
        tagName: element.tagName.toLowerCase(),
        attributes: {},
        children: [],
        styles,
      };

      // Extract attributes
      Array.from(element.attributes).forEach((attr) => {
        node.attributes[attr.name] = attr.value;
      });

      // Extract text content (only direct text nodes)
      const textContent = Array.from(element.childNodes)
        .filter((child) => child.nodeType === Node.TEXT_NODE)
        .map((child) => child.textContent?.trim())
        .filter(Boolean)
        .join(' ');

      if (textContent) {
        node.textContent = textContent;
      }

      // Recursively extract children
      Array.from(element.children).forEach((child) => {
        node.children.push(extractNode(child));
      });

      return node;
    }

    const body = document.body;
    return extractNode(body);
  });
}

/**
 * Extracts color palette from page
 */
async function extractColorPalette(page: Page): Promise<Color[]> {
  return page.evaluate(() => {
    const colorMap = new Map<string, { count: number; usage: string }>();

    function rgbToHex(r: number, g: number, b: number): string {
      return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
    }

    function parseColor(colorStr: string): [number, number, number] | null {
      const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
      }
      return null;
    }

    function categorizeUsage(property: string): string {
      if (property === 'color') return 'text';
      if (property === 'backgroundColor') return 'background';
      if (property.includes('border')) return 'accent';
      return 'secondary';
    }

    // Extract all colors from computed styles
    document.querySelectorAll('*').forEach((element) => {
      const styles = window.getComputedStyle(element);

      ['color', 'backgroundColor', 'borderColor'].forEach((property) => {
        const value = styles.getPropertyValue(property);
        if (!value || value === 'rgba(0, 0, 0, 0)') return;

        const rgb = parseColor(value);
        if (!rgb) return;

        const hex = rgbToHex(rgb[0], rgb[1], rgb[2]);
        const existing = colorMap.get(hex);

        if (existing) {
          existing.count++;
        } else {
          colorMap.set(hex, {
            count: 1,
            usage: categorizeUsage(property),
          });
        }
      });
    });

    // Convert to array and sort by frequency
    const colors = Array.from(colorMap.entries())
      .map(([hex, data]) => {
        const rgb = [
          parseInt(hex.slice(1, 3), 16),
          parseInt(hex.slice(3, 5), 16),
          parseInt(hex.slice(5, 7), 16),
        ] as [number, number, number];

        return {
          hex,
          rgb,
          usage: data.usage as 'primary' | 'secondary' | 'accent' | 'background' | 'text',
          frequency: data.count,
        };
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20); // Max 20 colors

    return colors;
  });
}

/**
 * Extracts typography information
 */
async function extractTypography(page: Page): Promise<Typography[]> {
  return page.evaluate(() => {
    const fontMap = new Map<string, Typography>();

    document.querySelectorAll('*').forEach((element) => {
      const styles = window.getComputedStyle(element);
      const fontFamily = styles.fontFamily;
      const fontSize = styles.fontSize;
      const fontWeight = parseInt(styles.fontWeight) || 400;
      const lineHeight = styles.lineHeight;
      const letterSpacing = styles.letterSpacing;

      if (!fontFamily || fontSize === '0px') return;

      const key = `${fontFamily}-${fontSize}-${fontWeight}`;

      if (!fontMap.has(key)) {
        fontMap.set(key, {
          fontFamily,
          fontSize,
          fontWeight,
          lineHeight,
          letterSpacing: letterSpacing !== 'normal' ? letterSpacing : undefined,
          selector: element.tagName.toLowerCase(),
        });
      }
    });

    return Array.from(fontMap.values());
  });
}

/**
 * Extracts layout patterns
 */
async function extractLayoutPatterns(page: Page): Promise<Layout[]> {
  return page.evaluate(() => {
    const layouts: Layout[] = [];

    document.querySelectorAll('*').forEach((element) => {
      const styles = window.getComputedStyle(element);
      const display = styles.display;

      // Only extract flex and grid layouts
      if (display !== 'flex' && display !== 'grid') return;

      const selector = element.tagName.toLowerCase() +
        (element.id ? `#${element.id}` : '') +
        (element.className ? `.${Array.from(element.classList).join('.')}` : '');

      const layout: Layout = {
        selector,
        display,
        position: styles.position,
        margin: styles.margin,
        padding: styles.padding,
        width: styles.width,
        height: styles.height,
      };

      if (display === 'flex') {
        layout.flexProperties = {
          direction: styles.flexDirection,
          justify: styles.justifyContent,
          align: styles.alignItems,
          wrap: styles.flexWrap,
          gap: styles.gap,
        };
      }

      if (display === 'grid') {
        layout.gridProperties = {
          templateColumns: styles.gridTemplateColumns,
          templateRows: styles.gridTemplateRows,
          gap: styles.gap,
          autoFlow: styles.gridAutoFlow,
        };
      }

      layouts.push(layout);
    });

    return layouts;
  });
}

/**
 * Extracts semantic HTML structure
 */
async function extractSemanticStructure(page: Page): Promise<SemanticElement[]> {
  return page.evaluate(() => {
    const semanticTags = ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer'];
    const elements: SemanticElement[] = [];

    semanticTags.forEach((tag) => {
      document.querySelectorAll(tag).forEach((element, index) => {
        const selector = `${tag}:nth-of-type(${index + 1})`;

        elements.push({
          type: tag as 'header' | 'nav' | 'main' | 'section' | 'article' | 'aside' | 'footer',
          selector,
          role: element.getAttribute('role') || undefined,
          ariaLabel: element.getAttribute('aria-label') || undefined,
          children: Array.from(element.children).map((child) => child.tagName.toLowerCase()),
        });
      });
    });

    return elements;
  });
}

/**
 * Extracts page performance metrics
 */
async function extractPageMetrics(page: Page): Promise<PageMetrics> {
  return page.evaluate(() => {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintData = performance.getEntriesByType('paint');

    const firstPaint = paintData.find((entry) => entry.name === 'first-contentful-paint');

    return {
      domElements: document.querySelectorAll('*').length,
      resourceSize: Math.round(
        performance.getEntriesByType('resource').reduce((sum, entry: any) => sum + (entry.transferSize || 0), 0)
      ),
      loadTime: Math.round(perfData.loadEventEnd - perfData.fetchStart),
      renderTime: Math.round(firstPaint?.startTime || 0),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };
  });
}
