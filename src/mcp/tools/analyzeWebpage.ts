/**
 * T033: analyzeWebpage MCP tool implementation
 * Main orchestration tool that coordinates all services
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../lib/logger.js';
import { validateURL } from '../../lib/validation.js';
import {
  validateComponentConfig,
  applyDefaults,
  getFileExtension,
  ComponentConfig,
} from '../../models/ComponentConfig.js';
import { createMetadata, Dependency } from '../../models/GeneratedComponent.js';
import { WebpageAnalysis } from '../../models/WebpageAnalysis.js';
import { getBrowser, createPage, closePage, releaseBrowser } from '../../services/puppeteer/browser.js';
import { captureScreenshot } from '../../services/puppeteer/capture.js';
import { extractDOM } from '../../services/puppeteer/domExtractor.js';
import { analyzeVisual } from '../../services/ollama/llava.js';
import { generateCode } from '../../services/ollama/codellama.js';
import { generateReactComponent } from '../../services/codeGenerator/react.js';
import { generateAngularComponent } from '../../services/codeGenerator/angular.js';
import { generateVueComponent } from '../../services/codeGenerator/vue.js';
import { generateSvelteComponent } from '../../services/codeGenerator/svelte.js';
import { cacheManager } from '../../services/cache/manager.js';
import { toStructuredError, DIEError } from '../../lib/errors.js';

export interface AnalyzeWebpageInput {
  url: string;
  framework: string;
  styling: string;
  options?: {
    typescript?: boolean;
    responsive?: boolean;
    accessibility?: boolean;
  };
}

export interface AnalyzeWebpageOutput {
  success: boolean;
  component?: {
    code: string;
    imports: string[];
    dependencies: Record<string, string>;
    filename: string;
    instructions?: string;
  };
  analysis?: {
    url: string;
    timestamp: string;
    domElements: number;
    colors: string[];
    fonts: string[];
    processingTime: number;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    suggestion?: string;
  };
}

/**
 * Main analyzeWebpage tool implementation
 */
export async function analyzeWebpage(input: AnalyzeWebpageInput): Promise<AnalyzeWebpageOutput> {
  const requestId = uuidv4();
  const startTime = Date.now();

  logger.info('analyzeWebpage tool invoked', {
    url: input.url,
    framework: input.framework,
    styling: input.styling,
    requestId,
  });

  try {
    // Validate inputs
    validateURL(input.url, requestId);

    const componentConfig: ComponentConfig = {
      framework: input.framework as any,
      styling: input.styling as any,
      typescript: input.options?.typescript,
      responsive: input.options?.responsive,
      accessibility: input.options?.accessibility,
    };

    const validation = validateComponentConfig(componentConfig);
    if (!validation.valid) {
      throw new DIEError(
        'VALIDATION_ERROR',
        validation.errors.join('; '),
        { errors: validation.errors },
        'Check input parameters and try again',
        requestId
      );
    }

    const config = applyDefaults(componentConfig);

    // Check cache first
    const cachedEntry = cacheManager.get(input.url, config);
    if (cachedEntry) {
      logger.info('Returning cached result', { url: input.url, requestId });

      const processingTime = Date.now() - startTime;
      return formatSuccessResponse(cachedEntry.component, cachedEntry.analysis, processingTime);
    }

    // Execute analysis pipeline
    logger.info('Starting analysis pipeline', { url: input.url, requestId });

    // Step 1: Capture webpage
    const browser = await getBrowser();
    const page = await createPage(browser);

    try {
      const captureResult = await captureScreenshot(page, input.url, {}, requestId);

      // Step 2: Extract DOM
      const domExtraction = await extractDOM(page, input.url, 500, requestId);

      // Step 3: Visual analysis with LLaVA
      const visualAnalysis = await analyzeVisual(
        {
          screenshot: captureResult.screenshot,
          url: input.url,
        },
        requestId
      );

      // Step 4: Generate code with CodeLlama
      const codeResult = await generateCode(
        {
          url: input.url,
          config,
          visualAnalysis,
          domExtraction,
        },
        requestId
      );

      // Step 5: Post-process with framework-specific generator
      let finalComponent: {
        code: string;
        imports: string[];
        dependencies: Dependency[];
        filename: string;
      };

      switch (config.framework) {
        case 'react':
          finalComponent = generateReactComponent(codeResult, domExtraction, {
            typescript: config.typescript,
            styling: config.styling,
            responsive: config.responsive,
            accessibility: config.accessibility,
          });
          break;

        case 'angular':
          finalComponent = generateAngularComponent(codeResult, domExtraction, {
            styling: config.styling,
            responsive: config.responsive,
            accessibility: config.accessibility,
          });
          break;

        case 'vue':
          finalComponent = generateVueComponent(codeResult, domExtraction, {
            typescript: config.typescript,
            styling: config.styling,
            responsive: config.responsive,
            accessibility: config.accessibility,
          });
          break;

        case 'svelte':
          finalComponent = generateSvelteComponent(codeResult, domExtraction, {
            typescript: config.typescript,
            styling: config.styling,
            responsive: config.responsive,
            accessibility: config.accessibility,
          });
          break;

        default:
          throw new DIEError('UNSUPPORTED_FRAMEWORK', `Framework ${config.framework} not supported`, {}, '', requestId);
      }

      // Create analysis object
      const analysis: WebpageAnalysis = {
        id: uuidv4(),
        url: input.url,
        timestamp: new Date(),
        state: 'completed',
        screenshot: captureResult.screenshot,
        domStructure: domExtraction.domStructure,
        colorPalette: domExtraction.colorPalette,
        typography: domExtraction.typography,
        layoutPatterns: domExtraction.layoutPatterns,
        semanticStructure: domExtraction.semanticStructure,
        pageMetrics: domExtraction.pageMetrics,
      };

      // Create component object
      const totalTime = Date.now() - startTime;
      const component = {
        id: uuidv4(),
        analysisId: analysis.id,
        framework: config.framework,
        styling: config.styling,
        code: finalComponent.code,
        imports: finalComponent.imports,
        dependencies: finalComponent.dependencies,
        metadata: createMetadata(totalTime),
        filename: finalComponent.filename,
        instructions: generateUsageInstructions(config, finalComponent.filename),
      };

      // Cache the result
      cacheManager.set(input.url, config, { analysis, component });

      logger.info('Analysis pipeline completed successfully', {
        url: input.url,
        totalTime,
        requestId,
      });

      return formatSuccessResponse(component, analysis, totalTime);
    } finally {
      await closePage(page);
      await releaseBrowser();
    }
  } catch (error) {
    const totalTime = Date.now() - startTime;
    logger.error('analyzeWebpage tool failed', {
      url: input.url,
      totalTime,
      error,
      requestId,
    });

    const structuredError = toStructuredError(error, requestId);

    return {
      success: false,
      error: structuredError,
    };
  }
}

/**
 * Formats success response
 */
function formatSuccessResponse(
  component: any,
  analysis: WebpageAnalysis,
  processingTime: number
): AnalyzeWebpageOutput {
  // Convert dependencies array to object
  const dependenciesObj: Record<string, string> = {};
  component.dependencies.forEach((dep: Dependency) => {
    dependenciesObj[dep.name] = dep.version;
  });

  return {
    success: true,
    component: {
      code: component.code,
      imports: component.imports,
      dependencies: dependenciesObj,
      filename: component.filename,
      instructions: component.instructions,
    },
    analysis: {
      url: analysis.url,
      timestamp: analysis.timestamp.toISOString(),
      domElements: analysis.pageMetrics.domElements,
      colors: analysis.colorPalette.map((c) => c.hex),
      fonts: analysis.typography.map((t) => t.fontFamily),
      processingTime,
    },
  };
}

/**
 * Generates usage instructions for the component
 */
function generateUsageInstructions(
  config: ComponentConfig,
  filename: string
): string {
  const ext = getFileExtension(config.framework, config.typescript ?? true);

  switch (config.framework) {
    case 'react':
      return `1. Save this component as ${filename}
2. Install dependencies: npm install
3. Import: import WebpageComponent from './${filename.replace(ext, '')}'
4. Use: <WebpageComponent />`;

    case 'angular':
      return `1. Save this component in your Angular project
2. Add to module declarations
3. Use the selector: <app-webpage></app-webpage>`;

    case 'vue':
      return `1. Save this component as ${filename}
2. Import: import WebpageComponent from './${filename}'
3. Use: <WebpageComponent />`;

    case 'svelte':
      return `1. Save this component as ${filename}
2. Import: import WebpageComponent from './${filename}'
3. Use: <WebpageComponent />`;

    default:
      return `See framework documentation for usage instructions.`;
  }
}
