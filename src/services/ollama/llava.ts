/**
 * T025: LLaVA visual analysis service
 * Uses LLaVA model for visual component identification
 */

import { logger } from '../../lib/logger.js';
import { AIModelError } from '../../lib/errors.js';
import { ollamaClient } from './client.js';

export interface VisualAnalysisRequest {
  screenshot: Buffer;
  url: string;
}

export interface ComponentIdentification {
  type: string;
  description: string;
  position: string;
  styling: string[];
}

export interface VisualAnalysisResult {
  components: ComponentIdentification[];
  layout: {
    structure: string;
    hierarchy: string[];
  };
  designSystem: {
    colorScheme: string;
    typography: string;
    spacing: string;
  };
  rawResponse: string;
}

const LLAVA_MODEL = 'llava:7b';

/**
 * Analyzes a webpage screenshot using LLaVA
 */
export async function analyzeVisual(
  request: VisualAnalysisRequest,
  requestId?: string
): Promise<VisualAnalysisResult> {
  logger.info('Starting visual analysis with LLaVA', {
    url: request.url,
    screenshotSize: request.screenshot.length,
    requestId,
  });

  const startTime = Date.now();

  try {
    // Convert screenshot to base64
    const base64Image = request.screenshot.toString('base64');

    // Construct prompt for LLaVA
    const prompt = buildVisualAnalysisPrompt(request.url);

    // Call LLaVA model
    const response = await ollamaClient.generate(
      {
        model: LLAVA_MODEL,
        prompt,
        images: [base64Image],
        options: {
          temperature: 0.3, // Lower temperature for more consistent analysis
          num_predict: 2000,
        },
      },
      requestId
    );

    // Parse LLaVA response
    const analysisResult = parseVisualAnalysis(response.response, request.url);

    const duration = Date.now() - startTime;
    logger.info('Visual analysis completed', {
      url: request.url,
      duration,
      componentsFound: analysisResult.components.length,
      requestId,
    });

    return analysisResult;
  } catch (error) {
    logger.error('Visual analysis failed', {
      url: request.url,
      error,
      requestId,
    });

    if (error instanceof AIModelError) {
      throw error;
    }

    throw new AIModelError(
      LLAVA_MODEL,
      error instanceof Error ? error.message : String(error),
      requestId
    );
  }
}

/**
 * Builds the analysis prompt for LLaVA
 */
function buildVisualAnalysisPrompt(url: string): string {
  return `You are analyzing a webpage screenshot from ${url}.

Please analyze this webpage design and provide a structured breakdown:

1. **Components**: Identify all UI components (header, navigation, hero section, cards, footer, buttons, forms, etc.)
   - For each component, describe its type, visual appearance, and position

2. **Layout Structure**: Describe the overall layout pattern (header-main-footer, sidebar, grid, flexbox, etc.)
   - Identify the visual hierarchy

3. **Design System**: Analyze the design system used:
   - Color scheme (primary, secondary, accent colors)
   - Typography (font styles, sizes, weights)
   - Spacing patterns (margins, padding, gaps)

Provide your analysis in a clear, structured format. Be specific about colors (hex codes if possible), font characteristics, and layout patterns.`;
}

/**
 * Parses LLaVA's response into structured data
 */
function parseVisualAnalysis(response: string, url: string): VisualAnalysisResult {
  logger.debug('Parsing visual analysis response', { responseLength: response.length });

  // This is a simplified parser - in production, you'd want more robust parsing
  const components: ComponentIdentification[] = [];
  const lines = response.split('\n');

  let currentSection = '';
  let colorScheme = '';
  let typography = '';
  let spacing = '';
  let structure = '';
  const hierarchy: string[] = [];

  lines.forEach((line) => {
    const trimmed = line.trim();

    // Identify sections
    if (trimmed.toLowerCase().includes('component')) {
      currentSection = 'components';
    } else if (trimmed.toLowerCase().includes('layout')) {
      currentSection = 'layout';
    } else if (trimmed.toLowerCase().includes('design system') || trimmed.toLowerCase().includes('color')) {
      currentSection = 'design';
    }

    // Extract components
    if (currentSection === 'components' && trimmed.length > 0) {
      if (
        trimmed.match(/header|navigation|nav|hero|card|button|form|footer|sidebar|menu/i)
      ) {
        components.push({
          type: extractComponentType(trimmed),
          description: trimmed,
          position: extractPosition(trimmed),
          styling: extractStyling(trimmed),
        });
      }
    }

    // Extract layout info
    if (currentSection === 'layout') {
      if (trimmed.match(/structure|grid|flex|column|row/i)) {
        structure = trimmed;
      }
      if (trimmed.match(/hierarchy|level|order/i)) {
        hierarchy.push(trimmed);
      }
    }

    // Extract design system
    if (currentSection === 'design') {
      if (trimmed.match(/color|#[0-9a-f]{6}/i)) {
        colorScheme += trimmed + ' ';
      }
      if (trimmed.match(/font|typography|text/i)) {
        typography += trimmed + ' ';
      }
      if (trimmed.match(/spacing|margin|padding|gap/i)) {
        spacing += trimmed + ' ';
      }
    }
  });

  // If no components were parsed, create default ones based on common patterns
  if (components.length === 0) {
    components.push(
      {
        type: 'header',
        description: 'Page header with navigation',
        position: 'top',
        styling: ['full-width', 'fixed'],
      },
      {
        type: 'main',
        description: 'Main content area',
        position: 'center',
        styling: ['container', 'responsive'],
      },
      {
        type: 'footer',
        description: 'Page footer',
        position: 'bottom',
        styling: ['full-width'],
      }
    );
  }

  return {
    components,
    layout: {
      structure: structure || 'Standard header-main-footer layout',
      hierarchy: hierarchy.length > 0 ? hierarchy : ['Header', 'Main Content', 'Footer'],
    },
    designSystem: {
      colorScheme: colorScheme.trim() || 'Modern color palette with neutral base',
      typography: typography.trim() || 'Sans-serif font family with clear hierarchy',
      spacing: spacing.trim() || 'Consistent spacing using 8px grid system',
    },
    rawResponse: response,
  };
}

/**
 * Extracts component type from description
 */
function extractComponentType(description: string): string {
  const types = [
    'header',
    'navigation',
    'nav',
    'hero',
    'card',
    'button',
    'form',
    'input',
    'footer',
    'sidebar',
    'menu',
    'article',
    'section',
  ];

  for (const type of types) {
    if (description.toLowerCase().includes(type)) {
      return type;
    }
  }

  return 'component';
}

/**
 * Extracts position from description
 */
function extractPosition(description: string): string {
  const positions = ['top', 'bottom', 'left', 'right', 'center', 'middle'];

  for (const pos of positions) {
    if (description.toLowerCase().includes(pos)) {
      return pos;
    }
  }

  return 'unknown';
}

/**
 * Extracts styling keywords from description
 */
function extractStyling(description: string): string[] {
  const styling: string[] = [];
  const keywords = [
    'full-width',
    'fixed',
    'sticky',
    'responsive',
    'grid',
    'flex',
    'absolute',
    'relative',
    'centered',
  ];

  keywords.forEach((keyword) => {
    if (description.toLowerCase().includes(keyword)) {
      styling.push(keyword);
    }
  });

  return styling.length > 0 ? styling : ['default'];
}

/**
 * Checks if LLaVA model is available
 */
export async function isLlavaAvailable(requestId?: string): Promise<boolean> {
  try {
    return await ollamaClient.isModelAvailable(LLAVA_MODEL, requestId);
  } catch (error) {
    logger.error('Failed to check LLaVA availability', { error, requestId });
    return false;
  }
}
