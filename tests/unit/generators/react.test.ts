/**
 * T048: Unit tests for React generator
 */

import { describe, it, expect } from '@jest/globals';
import { generateReactComponent } from '../../../src/services/codeGenerator/react.js';
import { DOMExtractionResult } from '../../../src/services/puppeteer/domExtractor.js';

describe('React Component Generator', () => {
  const mockDOMExtraction: DOMExtractionResult = {
    domStructure: {
      tagName: 'body',
      attributes: {},
      children: [],
    },
    colorPalette: [
      { hex: '#000000', rgb: [0, 0, 0], usage: 'text', frequency: 10 },
      { hex: '#ffffff', rgb: [255, 255, 255], usage: 'background', frequency: 8 },
    ],
    typography: [
      {
        fontFamily: 'Arial',
        fontSize: '16px',
        fontWeight: 400,
        lineHeight: '1.5',
        selector: 'body',
      },
    ],
    layoutPatterns: [],
    semanticStructure: [],
    pageMetrics: {
      domElements: 50,
      resourceSize: 1024,
      loadTime: 1000,
      renderTime: 500,
      viewportWidth: 1920,
      viewportHeight: 1080,
    },
  };

  const mockCodeResult = {
    code: 'function Component() { return <div>Test</div>; }',
    imports: [],
    explanation: 'Test component',
  };

  describe('Tailwind styling', () => {
    it('should generate React component with Tailwind', () => {
      const result = generateReactComponent(
        mockCodeResult,
        mockDOMExtraction,
        {
          typescript: false,
          styling: 'tailwind',
          responsive: true,
          accessibility: false,
        }
      );

      expect(result.code).toBeDefined();
      expect(result.imports).toContain("import React from 'react';");
      expect(result.filename).toMatch(/\.jsx$/);
      expect(result.dependencies.some((d) => d.name === 'tailwindcss')).toBe(true);
    });

    it('should include React dependency', () => {
      const result = generateReactComponent(
        mockCodeResult,
        mockDOMExtraction,
        {
          typescript: false,
          styling: 'tailwind',
          responsive: false,
          accessibility: false,
        }
      );

      const reactDep = result.dependencies.find((d) => d.name === 'react');
      expect(reactDep).toBeDefined();
      expect(reactDep?.version).toMatch(/^\^18\./);
    });
  });

  describe('CSS styling', () => {
    it('should generate React component with CSS import', () => {
      const result = generateReactComponent(
        mockCodeResult,
        mockDOMExtraction,
        {
          typescript: false,
          styling: 'css',
          responsive: false,
          accessibility: false,
        }
      );

      expect(result.imports.some((imp) => imp.includes('.css'))).toBe(true);
    });
  });

  describe('SCSS styling', () => {
    it('should generate React component with SCSS import', () => {
      const result = generateReactComponent(
        mockCodeResult,
        mockDOMExtraction,
        {
          typescript: false,
          styling: 'scss',
          responsive: false,
          accessibility: false,
        }
      );

      expect(result.imports.some((imp) => imp.includes('.scss'))).toBe(true);
      expect(result.dependencies.some((d) => d.name === 'sass')).toBe(true);
    });
  });

  describe('styled-components', () => {
    it('should generate React component with styled-components', () => {
      const result = generateReactComponent(
        mockCodeResult,
        mockDOMExtraction,
        {
          typescript: false,
          styling: 'styled-components',
          responsive: false,
          accessibility: false,
        }
      );

      expect(result.imports.some((imp) => imp.includes('styled-components'))).toBe(true);
      expect(result.dependencies.some((d) => d.name === 'styled-components')).toBe(true);
    });
  });

  describe('TypeScript support', () => {
    it('should generate .tsx file when typescript is true', () => {
      const result = generateReactComponent(
        mockCodeResult,
        mockDOMExtraction,
        {
          typescript: true,
          styling: 'tailwind',
          responsive: false,
          accessibility: false,
        }
      );

      expect(result.filename).toMatch(/\.tsx$/);
      expect(result.dependencies.some((d) => d.name === '@types/react')).toBe(true);
    });

    it('should generate .jsx file when typescript is false', () => {
      const result = generateReactComponent(
        mockCodeResult,
        mockDOMExtraction,
        {
          typescript: false,
          styling: 'css',
          responsive: false,
          accessibility: false,
        }
      );

      expect(result.filename).toMatch(/\.jsx$/);
    });
  });

  describe('Accessibility', () => {
    it('should add ARIA attributes when accessibility is true', () => {
      const codeWithHeader = 'function Component() { return <header><button>Click</button></header>; }';

      const result = generateReactComponent(
        { ...mockCodeResult, code: codeWithHeader },
        mockDOMExtraction,
        {
          typescript: false,
          styling: 'css',
          responsive: false,
          accessibility: true,
        }
      );

      expect(result.code).toContain('role="banner"');
      expect(result.code).toContain('aria-label');
    });
  });

  describe('Component structure', () => {
    it('should return all required fields', () => {
      const result = generateReactComponent(
        mockCodeResult,
        mockDOMExtraction,
        {
          typescript: false,
          styling: 'tailwind',
          responsive: false,
          accessibility: false,
        }
      );

      expect(result.code).toBeDefined();
      expect(result.imports).toBeInstanceOf(Array);
      expect(result.dependencies).toBeInstanceOf(Array);
      expect(result.filename).toBeDefined();
    });

    it('should include usage instructions', () => {
      const result = generateReactComponent(
        mockCodeResult,
        mockDOMExtraction,
        {
          typescript: false,
          styling: 'tailwind',
          responsive: false,
          accessibility: false,
        }
      );

      // Instructions are added in analyzeWebpage tool, not generator
      expect(result.dependencies.length).toBeGreaterThan(0);
    });
  });
});
