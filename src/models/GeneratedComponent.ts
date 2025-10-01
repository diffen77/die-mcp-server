/**
 * T018: GeneratedComponent model with metadata
 * Represents the output artifact containing component code
 */

import { Framework, Styling } from './ComponentConfig.js';

export interface Dependency {
  name: string;
  version: string;
  type: 'production' | 'development';
}

export interface ComponentMetadata {
  generatedAt: Date;
  generationTime: number; // Time taken in ms
  llavaVersion: string;
  codellamaVersion: string;
  templateVersion: string;
}

export interface GeneratedComponent {
  id: string; // UUID v4 format
  analysisId: string; // References WebpageAnalysis
  framework: Framework; // From ComponentConfig
  styling: Styling; // From ComponentConfig
  code: string; // Generated component code (non-empty)
  imports: string[]; // Required imports (valid import statements)
  dependencies: Dependency[]; // Package dependencies (NPM format)
  metadata: ComponentMetadata; // Generation metadata
  filename?: string; // Suggested filename with extension
  instructions?: string; // Usage instructions
}

/**
 * Validates generated component structure
 */
export function validateGeneratedComponent(
  component: Partial<GeneratedComponent>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!component.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(component.id)) {
    errors.push('id must be a valid UUID v4');
  }

  if (!component.analysisId) {
    errors.push('analysisId is required');
  }

  if (!component.framework) {
    errors.push('framework is required');
  }

  if (!component.styling) {
    errors.push('styling is required');
  }

  if (!component.code || component.code.trim().length === 0) {
    errors.push('code is required and must be non-empty');
  } else {
    // Validate code doesn't contain placeholders
    if (component.code.includes('TODO') || component.code.includes('PLACEHOLDER')) {
      errors.push('code must not contain TODO or PLACEHOLDER markers');
    }

    // Validate code size
    if (component.code.length > 1024 * 1024) {
      // 1MB max
      errors.push('code must not exceed 1MB');
    }
  }

  if (!component.imports || !Array.isArray(component.imports)) {
    errors.push('imports must be an array');
  }

  if (!component.dependencies || !Array.isArray(component.dependencies)) {
    errors.push('dependencies must be an array');
  } else {
    // Validate each dependency
    component.dependencies.forEach((dep, index) => {
      if (!dep.name || typeof dep.name !== 'string') {
        errors.push(`dependency[${index}].name is required and must be a string`);
      }
      if (!dep.version || typeof dep.version !== 'string') {
        errors.push(`dependency[${index}].version is required and must be a string`);
      }
      if (!dep.type || !['production', 'development'].includes(dep.type)) {
        errors.push(`dependency[${index}].type must be 'production' or 'development'`);
      }
    });
  }

  if (!component.metadata) {
    errors.push('metadata is required');
  } else {
    if (!component.metadata.generatedAt || !(component.metadata.generatedAt instanceof Date)) {
      errors.push('metadata.generatedAt must be a Date');
    }
    if (
      typeof component.metadata.generationTime !== 'number' ||
      component.metadata.generationTime < 0
    ) {
      errors.push('metadata.generationTime must be a positive number');
    }
  }

  if (component.filename && !/\.(tsx?|jsx?|vue|svelte|component\.ts)$/.test(component.filename)) {
    errors.push('filename must have a valid component extension');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Creates a dependency object
 */
export function createDependency(
  name: string,
  version: string,
  type: 'production' | 'development' = 'production'
): Dependency {
  return { name, version, type };
}

/**
 * Creates component metadata
 */
export function createMetadata(
  generationTime: number,
  llavaVersion: string = 'llava:7b',
  codellamaVersion: string = 'codellama:13b',
  templateVersion: string = '1.0.0'
): ComponentMetadata {
  return {
    generatedAt: new Date(),
    generationTime,
    llavaVersion,
    codellamaVersion,
    templateVersion,
  };
}
