/**
 * T028: Angular component generator
 * Generates Angular components with CSS/SCSS/Tailwind
 */

import { logger } from '../../lib/logger.js';
import { Styling } from '../../models/ComponentConfig.js';
import { Dependency } from '../../models/GeneratedComponent.js';
import { CodeGenerationResult } from '../ollama/codellama.js';
import { DOMExtractionResult } from '../puppeteer/domExtractor.js';

export interface AngularGenerationOptions {
  styling: Styling;
  responsive: boolean;
  accessibility: boolean;
}

/**
 * Generates Angular component from CodeLlama output
 */
export function generateAngularComponent(
  codeResult: CodeGenerationResult,
  domExtraction: DOMExtractionResult,
  options: AngularGenerationOptions
): {
  code: string;
  imports: string[];
  dependencies: Dependency[];
  filename: string;
} {
  logger.debug('Generating Angular component', { options });

  let { code } = codeResult;

  // Ensure proper Angular decorator
  if (!code.includes('@Component')) {
    code = wrapInAngularComponent(code, options.styling);
  }

  const imports = [
    "import { Component } from '@angular/core';",
  ];

  const dependencies: Dependency[] = [
    { name: '@angular/core', version: '^17.0.0', type: 'production' },
    { name: '@angular/common', version: '^17.0.0', type: 'production' },
  ];

  // Add styling-specific configuration
  const styleConfig = getStyleConfiguration(options.styling);
  code = updateComponentDecorator(code, styleConfig);

  if (options.styling === 'tailwind') {
    dependencies.push({ name: 'tailwindcss', version: '^3.4.0', type: 'development' });
  }

  if (options.styling === 'scss') {
    // SCSS is built into Angular
  }

  // Add accessibility if needed
  if (options.accessibility) {
    code = enhanceAngularAccessibility(code);
  }

  const filename = 'webpage.component.ts';

  logger.debug('Angular component generated', {
    filename,
    codeLength: code.length,
  });

  return {
    code,
    imports,
    dependencies,
    filename,
  };
}

/**
 * Wraps code in Angular @Component decorator
 */
function wrapInAngularComponent(code: string, styling: Styling): string {
  const styleExt = styling === 'scss' ? 'scss' : 'css';

  return `import { Component } from '@angular/core';

@Component({
  selector: 'app-webpage',
  templateUrl: './webpage.component.html',
  styleUrls: ['./webpage.component.${styleExt}']
})
export class WebpageComponent {
  title = 'Webpage Component';

  constructor() {}

  ngOnInit(): void {
    // Component initialization
  }
}`;
}

/**
 * Gets style configuration for decorator
 */
function getStyleConfiguration(styling: Styling): string {
  const ext = styling === 'scss' ? 'scss' : 'css';
  return `styleUrls: ['./webpage.component.${ext}']`;
}

/**
 * Updates @Component decorator with style config
 */
function updateComponentDecorator(code: string, styleConfig: string): string {
  if (code.includes('@Component')) {
    code = code.replace(
      /@Component\s*\(\s*\{[^}]*\}/,
      (match) => {
        if (!match.includes('styleUrls')) {
          return match.replace('}', `,\n  ${styleConfig}\n}`);
        }
        return match;
      }
    );
  }
  return code;
}

/**
 * Enhances Angular template with accessibility
 */
function enhanceAngularAccessibility(code: string): string {
  // Add ARIA roles to common elements
  code = code.replace(/<header(?![^>]*role)/g, '<header role="banner"');
  code = code.replace(/<nav(?![^>]*role)/g, '<nav role="navigation"');
  code = code.replace(/<main(?![^>]*role)/g, '<main role="main"');
  code = code.replace(/<footer(?![^>]*role)/g, '<footer role="contentinfo"');

  return code;
}
