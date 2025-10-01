/**
 * T027: React component generator
 * Generates React components with various styling options
 */

import { logger } from '../../lib/logger.js';
import { Styling } from '../../models/ComponentConfig.js';
import { Dependency } from '../../models/GeneratedComponent.js';
import { CodeGenerationResult } from '../ollama/codellama.js';
import { DOMExtractionResult } from '../puppeteer/domExtractor.js';

export interface ReactGenerationOptions {
  typescript: boolean;
  styling: Styling;
  responsive: boolean;
  accessibility: boolean;
}

/**
 * Post-processes CodeLlama output for React components
 */
export function generateReactComponent(
  codeResult: CodeGenerationResult,
  domExtraction: DOMExtractionResult,
  options: ReactGenerationOptions
): {
  code: string;
  imports: string[];
  dependencies: Dependency[];
  filename: string;
} {
  logger.debug('Generating React component', { options });

  let { code, imports } = codeResult;

  // Ensure proper React imports
  if (!code.includes('import React')) {
    imports.unshift("import React from 'react';");
  }

  // Add styling-specific imports and dependencies
  const dependencies: Dependency[] = [
    { name: 'react', version: '^18.2.0', type: 'production' },
    { name: 'react-dom', version: '^18.2.0', type: 'production' },
  ];

  switch (options.styling) {
    case 'tailwind':
      imports = ensureTailwindImports(imports);
      dependencies.push({ name: 'tailwindcss', version: '^3.4.0', type: 'development' });
      code = enhanceTailwindClasses(code, options.responsive);
      break;

    case 'css':
      imports = ensureCSSImport(imports);
      code = addCSSModule(code);
      break;

    case 'scss':
      imports = ensureSCSSImport(imports);
      dependencies.push({ name: 'sass', version: '^1.69.0', type: 'development' });
      code = addSCSSModule(code);
      break;

    case 'styled-components':
      imports = ensureStyledComponentsImports(imports);
      dependencies.push({
        name: 'styled-components',
        version: '^6.1.0',
        type: 'production',
      });
      code = convertToStyledComponents(code, domExtraction);
      break;
  }

  // Add TypeScript types if needed
  if (options.typescript) {
    dependencies.push(
      { name: '@types/react', version: '^18.2.0', type: 'development' },
      { name: '@types/react-dom', version: '^18.2.0', type: 'development' }
    );

    if (options.styling === 'styled-components') {
      dependencies.push({
        name: '@types/styled-components',
        version: '^5.1.0',
        type: 'development',
      });
    }

    code = addTypeScriptTypes(code);
  }

  // Add accessibility attributes if needed
  if (options.accessibility) {
    code = enhanceAccessibility(code);
  }

  // Determine filename
  const extension = options.typescript ? '.tsx' : '.jsx';
  const componentName = extractComponentName(code) || 'WebpageComponent';
  const filename = `${componentName}${extension}`;

  // Final code assembly
  const finalCode = assembleReactCode(imports, code);

  logger.debug('React component generated', {
    filename,
    codeLength: finalCode.length,
    dependencies: dependencies.length,
  });

  return {
    code: finalCode,
    imports,
    dependencies,
    filename,
  };
}

/**
 * Ensures Tailwind imports are present
 */
function ensureTailwindImports(imports: string[]): string[] {
  // Tailwind doesn't need explicit imports in component files
  return imports;
}

/**
 * Ensures CSS import is present
 */
function ensureCSSImport(imports: string[]): string[] {
  if (!imports.some((imp) => imp.includes('.css'))) {
    imports.push("import './WebpageComponent.css';");
  }
  return imports;
}

/**
 * Ensures SCSS import is present
 */
function ensureSCSSImport(imports: string[]): string[] {
  if (!imports.some((imp) => imp.includes('.scss'))) {
    imports.push("import './WebpageComponent.scss';");
  }
  return imports;
}

/**
 * Ensures styled-components imports are present
 */
function ensureStyledComponentsImports(imports: string[]): string[] {
  if (!imports.some((imp) => imp.includes('styled-components'))) {
    imports.push("import styled from 'styled-components';");
  }
  return imports;
}

/**
 * Enhances Tailwind classes for responsiveness
 */
function enhanceTailwindClasses(code: string, responsive: boolean): string {
  if (!responsive) return code;

  // Add responsive variants to common patterns
  code = code.replace(/className="([^"]*)"/g, (match, classes) => {
    const enhancedClasses = classes
      .split(' ')
      .map((cls: string) => {
        // Add responsive variants to layout classes
        if (cls.match(/^(flex|grid|block|hidden)/)) {
          return `${cls} md:${cls}`;
        }
        // Add responsive variants to spacing
        if (cls.match(/^(p|m|gap)-/)) {
          return cls; // Already responsive with Tailwind defaults
        }
        return cls;
      })
      .join(' ');

    return `className="${enhancedClasses}"`;
  });

  return code;
}

/**
 * Adds CSS module pattern
 */
function addCSSModule(code: string): string {
  // Convert inline styles or class names to CSS modules
  return code.replace(/className="([^"]*)"/g, (match, classes) => {
    const moduleClasses = classes
      .split(' ')
      .map((cls: string) => `styles.${cls}`)
      .join(' ');
    return `className={${moduleClasses}}`;
  });
}

/**
 * Adds SCSS module pattern
 */
function addSCSSModule(code: string): string {
  return addCSSModule(code); // Same as CSS module
}

/**
 * Converts regular styles to styled-components
 */
function convertToStyledComponents(
  code: string,
  domExtraction: DOMExtractionResult
): string {
  // Extract primary colors
  const primaryColor = domExtraction.colorPalette[0]?.hex || '#000000';
  const backgroundColor = domExtraction.colorPalette.find((c) => c.usage === 'background')?.hex || '#ffffff';

  // Add styled components definitions
  const styledDefs = `
const Container = styled.div\`
  min-height: 100vh;
  background-color: ${backgroundColor};
\`;

const Header = styled.header\`
  padding: 2rem;
  background-color: ${primaryColor};
  color: white;
\`;

const Main = styled.main\`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
\`;

const Footer = styled.footer\`
  padding: 2rem;
  background-color: ${primaryColor};
  color: white;
  margin-top: auto;
\`;
`;

  // Insert styled definitions before component
  const componentMatch = code.match(/(function|const)\s+\w+/);
  if (componentMatch) {
    const insertIndex = code.indexOf(componentMatch[0]);
    code = code.slice(0, insertIndex) + styledDefs + '\n' + code.slice(insertIndex);
  }

  // Replace div elements with styled components
  code = code.replace(/<div className="container"/g, '<Container');
  code = code.replace(/<\/div>/g, (match) => {
    // This is simplified - in production you'd need proper AST transformation
    return match;
  });

  return code;
}

/**
 * Adds TypeScript type annotations
 */
function addTypeScriptTypes(code: string): string {
  // Add React.FC type if not present
  if (code.includes('function') && !code.includes(': React.FC')) {
    code = code.replace(
      /(const|function)\s+(\w+)\s*\(/,
      '$1 $2: React.FC = () => ('
    );
  }

  // Add Props interface if component has props
  if (!code.includes('interface') && !code.includes('type Props')) {
    const propsInterface = `
interface Props {
  className?: string;
}
`;
    const componentMatch = code.match(/(function|const)\s+\w+/);
    if (componentMatch) {
      const insertIndex = code.indexOf(componentMatch[0]);
      code = code.slice(0, insertIndex) + propsInterface + '\n' + code.slice(insertIndex);
    }
  }

  return code;
}

/**
 * Enhances accessibility with ARIA attributes
 */
function enhanceAccessibility(code: string): string {
  // Add role attributes to semantic elements
  code = code.replace(/<header/g, '<header role="banner"');
  code = code.replace(/<nav/g, '<nav role="navigation"');
  code = code.replace(/<main/g, '<main role="main"');
  code = code.replace(/<footer/g, '<footer role="contentinfo"');

  // Add aria-labels to interactive elements
  code = code.replace(/<button(?![^>]*aria-label)/g, '<button aria-label="Action button"');
  code = code.replace(/<a(?![^>]*aria-label)(?=[^>]*href)/g, '<a aria-label="Link"');

  return code;
}

/**
 * Extracts component name from code
 */
function extractComponentName(code: string): string | null {
  const match = code.match(/(?:function|const)\s+([A-Z]\w+)/);
  return match ? match[1] : null;
}

/**
 * Assembles final React code with imports
 */
function assembleReactCode(imports: string[], code: string): string {
  const importSection = imports.join('\n');
  const codeWithoutImports = code
    .split('\n')
    .filter((line) => !line.trim().startsWith('import'))
    .join('\n');

  return `${importSection}\n\n${codeWithoutImports}`;
}
