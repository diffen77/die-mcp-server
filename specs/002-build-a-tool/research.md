# Research & Technical Decisions

**Feature**: Webpage Component Extractor
**Date**: 2025-10-01
**Status**: Complete

## Executive Summary

Research completed for building an MCP tool that extracts and recreates components from webpages using Puppeteer for browser automation, Ollama (LLaVA + CodeLlama) for AI analysis, and framework-specific templates for code generation.

## Technical Decisions

### 1. Browser Automation Strategy
**Decision**: Puppeteer with headless Chrome
**Rationale**:
- Native integration with Node.js/TypeScript
- Robust API for DOM manipulation and screenshot capture
- Supports intercepting network requests for resource optimization
- Can capture computed styles and interactive states
**Alternatives Considered**:
- Playwright: More cross-browser but unnecessary complexity for this use case
- Selenium: Older, slower, requires separate driver management

### 2. Component Identification Approach
**Decision**: Dual strategy - CSS selectors + semantic matching via LLaVA
**Rationale**:
- CSS selectors provide precise, developer-friendly targeting
- LLaVA enables natural language component identification ("navigation bar", "pricing table")
- Combination covers both technical and non-technical user needs
**Alternatives Considered**:
- Pure DOM traversal: Too rigid, misses visual context
- Only AI-based: Too slow and potentially inaccurate for precise selections

### 3. Visual Analysis Pipeline
**Decision**: Screenshot → LLaVA analysis → CodeLlama generation
**Rationale**:
- LLaVA excels at understanding visual UI patterns and hierarchy
- CodeLlama specializes in generating syntactically correct code
- Two-model approach leverages strengths of each
**Alternatives Considered**:
- Single multimodal model: No model currently matches specialized performance
- Rule-based extraction: Cannot handle modern dynamic UIs effectively

### 4. Style Extraction Method
**Decision**: User-configurable between computed and original styles
**Rationale**:
- Computed styles ensure visual fidelity but may include unnecessary properties
- Original styles preserve author intent but may miss inherited properties
- User choice based on their specific needs
**Alternatives Considered**:
- Always computed: Too verbose, includes browser defaults
- Always original: Misses critical inherited styles

### 5. Interactive State Capture
**Decision**: Programmatic state triggering with Puppeteer
**Rationale**:
- Can systematically trigger :hover, :focus, :active states
- Captures actual browser-rendered states, not theoretical CSS
- Ensures generated components match original behavior
**Alternatives Considered**:
- CSS parsing only: Misses JavaScript-driven interactions
- Manual state recording: Too complex for end users

### 6. Code Generation Templates
**Decision**: AST-based templates with framework-specific builders
**Rationale**:
- Ensures syntactically valid output
- Easily maintainable and extensible
- Can handle complex component structures
**Alternatives Considered**:
- String concatenation: Error-prone, hard to maintain
- AI-only generation: Inconsistent formatting and patterns

### 7. Caching Strategy
**Decision**: LRU cache with 24-hour TTL for screenshots
**Rationale**:
- Reduces redundant page loads and analysis
- 24-hour TTL balances freshness vs performance
- LRU ensures bounded memory usage (1GB max)
**Alternatives Considered**:
- No caching: Wasteful for repeated analyses
- Permanent cache: Stale data, unbounded growth

### 8. Error Recovery
**Decision**: Graceful degradation with partial results
**Rationale**:
- Returns DOM-based extraction even if AI analysis fails
- Provides actionable error messages with recovery suggestions
- Maintains service availability under degraded conditions
**Alternatives Considered**:
- Fail fast: Poor user experience
- Silent fallbacks: Users unaware of degraded results

### 9. MCP Tool Interface
**Decision**: Single `extractComponent` tool with structured parameters
**Rationale**:
- Simple, focused interface aligned with MCP best practices
- Clear parameter validation and error responses
- Extensible via optional parameters
**Alternatives Considered**:
- Multiple tools (analyze, generate, etc.): Overly complex for users
- REST API only: Loses MCP integration benefits

### 10. Performance Optimization
**Decision**: Parallel AI processing with timeout enforcement
**Rationale**:
- LLaVA and initial CodeLlama prompting can run concurrently
- Strict timeouts prevent runaway requests
- Meets <30s total response time requirement
**Alternatives Considered**:
- Sequential processing: Too slow for interactive use
- No timeouts: Risk of hung requests

## Implementation Priorities

1. **Phase 1 Priority**: MCP tool contract and validation
2. **Phase 2 Priority**: Puppeteer pipeline for reliable screenshot capture
3. **Phase 3 Priority**: AI integration with proper error handling
4. **Phase 4 Priority**: Framework-specific template generation
5. **Phase 5 Priority**: Caching and performance optimization

## Risk Mitigation

| Risk | Mitigation Strategy |
|------|-------------------|
| Ollama models not available | Fail with clear setup instructions |
| Complex SPAs with heavy JS | Wait for network idle, increase timeout |
| Authentication-required pages | Return clear error per spec clarification |
| Resource-intensive pages | Enforce memory limits, kill hung browsers |
| Inaccurate AI analysis | Provide fallback to DOM extraction |

## Dependencies Validation

All dependencies validated for compatibility:
- Puppeteer 21+ ✓ (works with Node.js 20+)
- MCP SDK ✓ (TypeScript support confirmed)
- Ollama ✓ (REST API accessible from Node.js)
- Express.js ✓ (SSE support for MCP)
- Winston ✓ (Structured logging confirmed)

## Next Steps

Proceed to Phase 1: Design & Contracts with:
- MCP tool contract definition
- Data model documentation
- Contract test generation
- Quickstart guide creation

---

*All NEEDS CLARIFICATION items from spec have been resolved through research and user clarifications.*