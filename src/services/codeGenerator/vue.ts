/**
 * T029: Vue component generator
 * Generates Vue 3 single-file components
 */

import { logger } from '../../lib/logger.js';
import { Styling } from '../../models/ComponentConfig.js';
import { Dependency } from '../../models/GeneratedComponent.js';
import { CodeGenerationResult } from '../ollama/codellama.js';
import { DOMExtractionResult } from '../puppeteer/domExtractor.js';

export interface VueGenerationOptions {
  typescript: boolean;
  styling: Styling;
  responsive: boolean;
  accessibility: boolean;
}

/**
 * Generates Vue component from CodeLlama output
 */
export function generateVueComponent(
  codeResult: CodeGenerationResult,
  domExtraction: DOMExtractionResult,
  options: VueGenerationOptions
): {
  code: string;
  imports: string[];
  dependencies: Dependency[];
  filename: string;
} {
  logger.debug('Generating Vue component', { options });

  const { code } = codeResult;

  // Ensure Vue SFC structure
  const vueCode = ensureVueSFCStructure(code, options);

  const imports: string[] = []; // Vue SFCs don't need separate imports file

  const dependencies: Dependency[] = [
    { name: 'vue', version: '^3.3.0', type: 'production' },
  ];

  if (options.styling === 'tailwind') {
    dependencies.push({ name: 'tailwindcss', version: '^3.4.0', type: 'development' });
  }

  if (options.styling === 'scss') {
    dependencies.push({ name: 'sass', version: '^1.69.0', type: 'development' });
  }

  if (options.typescript) {
    dependencies.push({ name: 'typescript', version: '^5.3.0', type: 'development' });
  }

  const filename = 'WebpageComponent.vue';

  logger.debug('Vue component generated', {
    filename,
    codeLength: vueCode.length,
  });

  return {
    code: vueCode,
    imports,
    dependencies,
    filename,
  };
}

/**
 * Ensures proper Vue SFC structure
 */
function ensureVueSFCStructure(code: string, options: VueGenerationOptions): string {
  // Check if already has SFC structure
  if (code.includes('<template>') && code.includes('<script>')) {
    return enhanceVueSFC(code, options);
  }

  // Create SFC structure from code
  const template = extractHTMLTemplate(code);
  const script = extractScriptContent(code, options);
  const style = createStyleSection(options);

  return `<template>
${template}
</template>

<script${options.typescript ? ' lang="ts"' : ''}>
${script}
</script>

<style${options.styling === 'scss' ? ' lang="scss"' : ''}${options.styling !== 'tailwind' ? ' scoped' : ''}>
${style}
</style>`;
}

/**
 * Extracts HTML template from code
 */
function extractHTMLTemplate(code: string): string {
  // Try to find template section
  const templateMatch = code.match(/<template>([\s\S]*?)<\/template>/);
  if (templateMatch) {
    return templateMatch[1].trim();
  }

  // Try to extract JSX/HTML-like content
  const htmlMatch = code.match(/<div[^>]*>[\s\S]*<\/div>/);
  if (htmlMatch) {
    return `  ${htmlMatch[0]}`;
  }

  // Default template
  return `  <div class="webpage-container">
    <header>
      <h1>{{ title }}</h1>
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
 * Extracts or creates script content
 */
function extractScriptContent(code: string, options: VueGenerationOptions): string {
  const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/);
  if (scriptMatch) {
    return scriptMatch[1].trim();
  }

  // Create default Vue 3 Composition API script
  if (options.typescript) {
    return `import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'WebpageComponent',
  setup() {
    const title = ref('Webpage Component');

    return {
      title,
    };
  },
});`;
  }

  return `import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'WebpageComponent',
  setup() {
    const title = ref('Webpage Component');

    return {
      title,
    };
  },
});`;
}

/**
 * Creates style section
 */
function createStyleSection(options: VueGenerationOptions): string {
  if (options.styling === 'tailwind') {
    return `/* Tailwind utility classes used in template */`;
  }

  return `.webpage-container {
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
}`;
}

/**
 * Enhances existing Vue SFC
 */
function enhanceVueSFC(code: string, options: VueGenerationOptions): string {
  let enhanced = code;

  // Update script lang if TypeScript
  if (options.typescript && !enhanced.includes('lang="ts"')) {
    enhanced = enhanced.replace(/<script/, '<script lang="ts"');
  }

  // Update style lang if SCSS
  if (options.styling === 'scss' && !enhanced.includes('lang="scss"')) {
    enhanced = enhanced.replace(/<style/, '<style lang="scss"');
  }

  // Add scoped if not Tailwind
  if (options.styling !== 'tailwind' && !enhanced.includes('scoped')) {
    enhanced = enhanced.replace(/<style([^>]*)>/, '<style$1 scoped>');
  }

  // Add accessibility if needed
  if (options.accessibility) {
    enhanced = enhanceVueAccessibility(enhanced);
  }

  return enhanced;
}

/**
 * Enhances Vue template with accessibility
 */
function enhanceVueAccessibility(code: string): string {
  // Add ARIA roles
  code = code.replace(/<header(?![^>]*role)/g, '<header role="banner"');
  code = code.replace(/<nav(?![^>]*role)/g, '<nav role="navigation"');
  code = code.replace(/<main(?![^>]*role)/g, '<main role="main"');
  code = code.replace(/<footer(?![^>]*role)/g, '<footer role="contentinfo"');

  return code;
}
