/**
 * T030: Svelte component generator
 * Generates Svelte single-file components
 */

import { logger } from '../../lib/logger.js';
import { Styling } from '../../models/ComponentConfig.js';
import { Dependency } from '../../models/GeneratedComponent.js';
import { CodeGenerationResult } from '../ollama/codellama.js';
import { DOMExtractionResult } from '../puppeteer/domExtractor.js';

export interface SvelteGenerationOptions {
  typescript: boolean;
  styling: Styling;
  responsive: boolean;
  accessibility: boolean;
}

/**
 * Generates Svelte component from CodeLlama output
 */
export function generateSvelteComponent(
  codeResult: CodeGenerationResult,
  domExtraction: DOMExtractionResult,
  options: SvelteGenerationOptions
): {
  code: string;
  imports: string[];
  dependencies: Dependency[];
  filename: string;
} {
  logger.debug('Generating Svelte component', { options });

  const { code } = codeResult;

  // Ensure Svelte SFC structure
  const svelteCode = ensureSvelteSFCStructure(code, options);

  const imports: string[] = []; // Svelte SFCs don't need separate imports file

  const dependencies: Dependency[] = [
    { name: 'svelte', version: '^4.2.0', type: 'production' },
  ];

  if (options.styling === 'tailwind') {
    dependencies.push({ name: 'tailwindcss', version: '^3.4.0', type: 'development' });
  }

  if (options.styling === 'scss') {
    dependencies.push({ name: 'sass', version: '^1.69.0', type: 'development' });
  }

  if (options.typescript) {
    dependencies.push(
      { name: 'typescript', version: '^5.3.0', type: 'development' },
      { name: 'svelte-preprocess', version: '^5.1.0', type: 'development' }
    );
  }

  const filename = 'WebpageComponent.svelte';

  logger.debug('Svelte component generated', {
    filename,
    codeLength: svelteCode.length,
  });

  return {
    code: svelteCode,
    imports,
    dependencies,
    filename,
  };
}

/**
 * Ensures proper Svelte SFC structure
 */
function ensureSvelteSFCStructure(code: string, options: SvelteGenerationOptions): string {
  // Check if already has SFC structure
  if (code.includes('<script') && code.includes('<style')) {
    return enhanceSvelteSFC(code, options);
  }

  // Create SFC structure from code
  const script = createScriptSection(options);
  const html = extractHTMLContent(code);
  const style = createStyleSection(options);

  return `${script}

${html}

${style}`;
}

/**
 * Creates script section
 */
function createScriptSection(options: SvelteGenerationOptions): string {
  const lang = options.typescript ? ' lang="ts"' : '';

  return `<script${lang}>
  let title = 'Webpage Component';
</script>`;
}

/**
 * Extracts HTML content
 */
function extractHTMLContent(code: string): string {
  // Try to find existing HTML
  const htmlMatch = code.match(/<div[^>]*>[\s\S]*<\/div>/);
  if (htmlMatch) {
    return htmlMatch[0];
  }

  // Default template
  return `<div class="webpage-container">
  <header>
    <h1>{title}</h1>
  </header>

  <main>
    <p>Content goes here</p>
  </main>

  <footer>
    <p>&copy; 2024</p>
  </footer>
</div>`;
}

/**
 * Creates style section
 */
function createStyleSection(options: SvelteGenerationOptions): string {
  const lang = options.styling === 'scss' ? ' lang="scss"' : '';

  if (options.styling === 'tailwind') {
    return `<style${lang}>
  /* Tailwind utility classes used in template */
</style>`;
  }

  return `<style${lang}>
  .webpage-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  header {
    padding: 2rem;
    background-color: #333;
    color: white;
  }

  main {
    flex: 1;
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }

  footer {
    padding: 2rem;
    background-color: #333;
    color: white;
    text-align: center;
  }

  ${options.responsive ? `
  @media (max-width: 768px) {
    header, main, footer {
      padding: 1rem;
    }
  }
  ` : ''}
</style>`;
}

/**
 * Enhances existing Svelte SFC
 */
function enhanceSvelteSFC(code: string, options: SvelteGenerationOptions): string {
  let enhanced = code;

  // Update script lang if TypeScript
  if (options.typescript && !enhanced.includes('lang="ts"')) {
    enhanced = enhanced.replace(/<script/, '<script lang="ts"');
  }

  // Update style lang if SCSS
  if (options.styling === 'scss' && !enhanced.includes('lang="scss"')) {
    enhanced = enhanced.replace(/<style/, '<style lang="scss"');
  }

  // Add accessibility if needed
  if (options.accessibility) {
    enhanced = enhanceSvelteAccessibility(enhanced);
  }

  return enhanced;
}

/**
 * Enhances Svelte template with accessibility
 */
function enhanceSvelteAccessibility(code: string): string {
  // Add ARIA roles
  code = code.replace(/<header(?![^>]*role)/g, '<header role="banner"');
  code = code.replace(/<nav(?![^>]*role)/g, '<nav role="navigation"');
  code = code.replace(/<main(?![^>]*role)/g, '<main role="main"');
  code = code.replace(/<footer(?![^>]*role)/g, '<footer role="contentinfo"');

  return code;
}
