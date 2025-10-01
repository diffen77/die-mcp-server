/**
 * T026: CodeLlama generation service
 * Uses CodeLlama for component code generation
 */

import { logger } from '../../lib/logger.js';
import { AIModelError } from '../../lib/errors.js';
import { ollamaClient } from './client.js';
import { ComponentConfigWithDefaults } from '../../models/ComponentConfig.js';
import { VisualAnalysisResult } from './llava.js';
import { DOMExtractionResult } from '../puppeteer/domExtractor.js';

export interface CodeGenerationRequest {
  url: string;
  config: ComponentConfigWithDefaults;
  visualAnalysis: VisualAnalysisResult;
  domExtraction: DOMExtractionResult;
}

export interface CodeGenerationResult {
  code: string;
  imports: string[];
  explanation: string;
}

const CODELLAMA_MODEL = 'codellama:13b';

/**
 * Generates component code using CodeLlama
 */
export async function generateCode(
  request: CodeGenerationRequest,
  requestId?: string
): Promise<CodeGenerationResult> {
  logger.info('Starting code generation with CodeLlama', {
    url: request.url,
    framework: request.config.framework,
    styling: request.config.styling,
    requestId,
  });

  const startTime = Date.now();

  try {
    // Build comprehensive prompt
    const prompt = buildCodeGenerationPrompt(request);

    // Call CodeLlama model
    const response = await ollamaClient.generate(
      {
        model: CODELLAMA_MODEL,
        prompt,
        options: {
          temperature: 0.2, // Lower temperature for more consistent code
          num_predict: 4000,
        },
      },
      requestId
    );

    // Parse code from response
    const result = parseCodeResponse(response.response, request.config);

    const duration = Date.now() - startTime;
    logger.info('Code generation completed', {
      url: request.url,
      duration,
      codeLength: result.code.length,
      imports: result.imports.length,
      requestId,
    });

    return result;
  } catch (error) {
    logger.error('Code generation failed', {
      url: request.url,
      error,
      requestId,
    });

    if (error instanceof AIModelError) {
      throw error;
    }

    throw new AIModelError(
      CODELLAMA_MODEL,
      error instanceof Error ? error.message : String(error),
      requestId
    );
  }
}

/**
 * Builds the code generation prompt for CodeLlama
 */
function buildCodeGenerationPrompt(request: CodeGenerationRequest): string {
  const { config, visualAnalysis, domExtraction } = request;

  // Extract key design information
  const colors = domExtraction.colorPalette
    .slice(0, 5)
    .map((c) => c.hex)
    .join(', ');
  const fonts = domExtraction.typography
    .slice(0, 3)
    .map((t) => `${t.fontFamily} (${t.fontSize})`)
    .join(', ');

  const prompt = `Generate a production-ready ${config.framework} component that recreates the webpage from ${request.url}.

**Framework**: ${config.framework}
**Styling**: ${config.styling}
**TypeScript**: ${config.typescript ? 'Yes' : 'No'}
**Responsive**: ${config.responsive ? 'Yes (mobile-first)' : 'No'}
**Accessibility**: ${config.accessibility ? 'Yes (include ARIA labels)' : 'No'}

**Visual Analysis**:
Components identified: ${visualAnalysis.components.map((c) => c.type).join(', ')}
Layout structure: ${visualAnalysis.layout.structure}
Color scheme: ${visualAnalysis.designSystem.colorScheme}

**Design Tokens**:
- Colors: ${colors}
- Fonts: ${fonts}
- DOM Elements: ${domExtraction.pageMetrics.domElements}

**Requirements**:
1. Create a single, self-contained component
2. Use semantic HTML5 elements
3. Match the visual design as closely as possible
4. ${config.styling === 'tailwind' ? 'Use Tailwind CSS utility classes' : config.styling === 'styled-components' ? 'Use styled-components for styling' : 'Use ' + config.styling + ' for styling'}
5. Include all necessary imports
6. NO placeholders or TODOs - production-ready code only
7. ${config.responsive ? 'Implement mobile-first responsive design' : 'Desktop-only layout'}
8. ${config.accessibility ? 'Include proper ARIA labels and semantic HTML' : 'Standard HTML'}

Generate the complete component code below:`;

  return prompt;
}

/**
 * Parses code from CodeLlama response
 */
function parseCodeResponse(
  response: string,
  config: ComponentConfigWithDefaults
): CodeGenerationResult {
  logger.debug('Parsing code generation response', { responseLength: response.length });

  // Extract code blocks
  const codeBlockRegex = /```(?:tsx?|jsx?|vue|svelte)?\n([\s\S]+?)```/g;
  const matches = Array.from(response.matchAll(codeBlockRegex));

  let code = '';
  if (matches.length > 0) {
    // Use the largest code block (usually the main component)
    code = matches.reduce((longest, match) => {
      return match[1].length > longest.length ? match[1] : longest;
    }, '');
  } else {
    // No code blocks found, try to extract code heuristically
    code = response;
  }

  // Clean up code
  code = code.trim();

  // Extract imports
  const imports = extractImports(code);

  // Extract explanation (text before first code block)
  const explanationMatch = response.match(/^([\s\S]+?)```/);
  const explanation = explanationMatch ? explanationMatch[1].trim() : 'Generated component';

  // Validate code is not empty
  if (code.length === 0) {
    throw new AIModelError(
      CODELLAMA_MODEL,
      'Generated code is empty',
      undefined
    );
  }

  // Validate no placeholders
  if (code.includes('TODO') || code.includes('PLACEHOLDER')) {
    logger.warn('Generated code contains placeholders, attempting to clean');
    // In production, you might want to retry or post-process
  }

  return {
    code,
    imports,
    explanation,
  };
}

/**
 * Extracts import statements from code
 */
function extractImports(code: string): string[] {
  const imports: string[] = [];
  const lines = code.split('\n');

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (
      trimmed.startsWith('import ') ||
      trimmed.startsWith('const ') && trimmed.includes('require(')
    ) {
      imports.push(trimmed);
    }
  });

  return imports;
}

/**
 * Checks if CodeLlama model is available
 */
export async function isCodeLlamaAvailable(requestId?: string): Promise<boolean> {
  try {
    return await ollamaClient.isModelAvailable(CODELLAMA_MODEL, requestId);
  } catch (error) {
    logger.error('Failed to check CodeLlama availability', { error, requestId });
    return false;
  }
}

/**
 * Gets CodeLlama model info
 */
export async function getCodeLlamaInfo(requestId?: string): Promise<{
  available: boolean;
  version?: string;
  size?: number;
}> {
  try {
    const modelInfo = await ollamaClient.getModelInfo(CODELLAMA_MODEL, requestId);

    if (!modelInfo) {
      return { available: false };
    }

    return {
      available: true,
      version: CODELLAMA_MODEL,
      size: modelInfo.size,
    };
  } catch (error) {
    logger.error('Failed to get CodeLlama info', { error, requestId });
    return { available: false };
  }
}
