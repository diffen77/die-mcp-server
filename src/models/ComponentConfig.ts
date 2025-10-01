/**
 * T017: ComponentConfig model with validation
 * Represents user preferences for code generation
 */

export type Framework = 'react' | 'angular' | 'vue' | 'svelte';
export type Styling = 'tailwind' | 'css' | 'scss' | 'styled-components';

export interface ComponentConfig {
  framework: Framework;
  styling: Styling;
  typescript?: boolean; // Default: true
  responsive?: boolean; // Default: true
  accessibility?: boolean; // Default: true
}

export interface ComponentConfigWithDefaults extends ComponentConfig {
  typescript: boolean;
  responsive: boolean;
  accessibility: boolean;
}

/**
 * Applies default values to a component configuration
 */
export function applyDefaults(config: ComponentConfig): ComponentConfigWithDefaults {
  return {
    framework: config.framework,
    styling: config.styling,
    typescript: config.typescript ?? true,
    responsive: config.responsive ?? true,
    accessibility: config.accessibility ?? true,
  };
}

/**
 * Validates framework value
 */
export function isValidFramework(framework: string): framework is Framework {
  return ['react', 'angular', 'vue', 'svelte'].includes(framework);
}

/**
 * Validates styling value
 */
export function isValidStyling(styling: string): styling is Styling {
  return ['tailwind', 'css', 'scss', 'styled-components'].includes(styling);
}

/**
 * Validates component configuration
 */
export function validateComponentConfig(config: Partial<ComponentConfig>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.framework) {
    errors.push('framework is required');
  } else if (!isValidFramework(config.framework)) {
    errors.push(
      `framework must be one of: react, angular, vue, svelte (got: ${config.framework})`
    );
  }

  if (!config.styling) {
    errors.push('styling is required');
  } else if (!isValidStyling(config.styling)) {
    errors.push(
      `styling must be one of: tailwind, css, scss, styled-components (got: ${config.styling})`
    );
  }

  // Check incompatible combinations
  if (
    config.framework &&
    config.styling &&
    isValidFramework(config.framework) &&
    isValidStyling(config.styling)
  ) {
    if (config.framework !== 'react' && config.styling === 'styled-components') {
      errors.push('styled-components is only compatible with React framework');
    }
  }

  // Validate optional boolean fields
  if (config.typescript !== undefined && typeof config.typescript !== 'boolean') {
    errors.push('typescript must be a boolean');
  }

  if (config.responsive !== undefined && typeof config.responsive !== 'boolean') {
    errors.push('responsive must be a boolean');
  }

  if (config.accessibility !== undefined && typeof config.accessibility !== 'boolean') {
    errors.push('accessibility must be a boolean');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Gets the file extension for a given framework and TypeScript setting
 */
export function getFileExtension(framework: Framework, typescript: boolean): string {
  switch (framework) {
    case 'react':
      return typescript ? '.tsx' : '.jsx';
    case 'angular':
      return '.component.ts';
    case 'vue':
      return '.vue';
    case 'svelte':
      return '.svelte';
    default:
      return '.ts';
  }
}
