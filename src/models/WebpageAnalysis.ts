/**
 * T016: WebpageAnalysis model with TypeScript interfaces
 * Represents the extracted design information from a target webpage
 */

export interface DOMNode {
  tagName: string;
  attributes: Record<string, string>;
  children: DOMNode[];
  textContent?: string;
  styles?: ComputedStyles;
}

export interface ComputedStyles {
  color?: string;
  backgroundColor?: string;
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: string;
  lineHeight?: string;
  margin?: string;
  padding?: string;
  display?: string;
  position?: string;
  width?: string;
  height?: string;
}

export interface Color {
  hex: string; // #RRGGBB format
  rgb: [number, number, number];
  usage: 'primary' | 'secondary' | 'accent' | 'background' | 'text';
  frequency: number; // Occurrence count
}

export interface Typography {
  fontFamily: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: string;
  letterSpacing?: string;
  selector: string; // CSS selector where used
}

export interface FlexProperties {
  direction?: string;
  justify?: string;
  align?: string;
  wrap?: string;
  gap?: string;
}

export interface GridProperties {
  templateColumns?: string;
  templateRows?: string;
  gap?: string;
  autoFlow?: string;
}

export interface Layout {
  selector: string;
  display: string;
  position: string;
  margin: string;
  padding: string;
  width?: string;
  height?: string;
  flexProperties?: FlexProperties;
  gridProperties?: GridProperties;
}

export interface SemanticElement {
  type: 'header' | 'nav' | 'main' | 'section' | 'article' | 'aside' | 'footer';
  selector: string;
  role?: string;
  ariaLabel?: string;
  children: string[]; // Child element selectors
}

export interface PageMetrics {
  domElements: number; // Total DOM element count
  resourceSize: number; // Total resources in bytes
  loadTime: number; // Page load time in ms
  renderTime: number; // First paint time in ms
  viewportWidth: number; // Capture viewport width
  viewportHeight: number; // Capture viewport height
}

export type AnalysisState = 'pending' | 'processing' | 'completed' | 'failed';

export interface WebpageAnalysis {
  id: string; // UUID v4 format
  url: string; // Valid HTTP/HTTPS URL
  timestamp: Date; // ISO 8601 format
  state: AnalysisState;
  screenshot: Buffer; // PNG format, max 10MB
  domStructure: DOMNode; // Hierarchical DOM tree
  colorPalette: Color[]; // Extracted colors (max 20)
  typography: Typography[]; // Font information
  layoutPatterns: Layout[]; // Spacing and alignment
  semanticStructure: SemanticElement[]; // HTML5 semantic elements
  pageMetrics: PageMetrics; // Performance metrics
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Validates a WebpageAnalysis object
 */
export function validateWebpageAnalysis(analysis: Partial<WebpageAnalysis>): boolean {
  if (!analysis.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(analysis.id)) {
    return false;
  }

  if (!analysis.url || !isValidUrl(analysis.url)) {
    return false;
  }

  if (!analysis.timestamp || !(analysis.timestamp instanceof Date)) {
    return false;
  }

  if (!['pending', 'processing', 'completed', 'failed'].includes(analysis.state || '')) {
    return false;
  }

  return true;
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
