# Research & Technical Decisions

**Feature**: Webpage to Component Analyzer
**Date**: 2025-10-01
**Status**: Complete

## Executive Summary
All technical unknowns have been resolved through research. The system will use TypeScript/Node.js with Puppeteer for webpage capture, Ollama for local AI processing (LLaVA + CodeLlama), and implement the MCP protocol for Claude Code integration. Docker Compose will orchestrate all services with proper health checks and resource limits.

## Technical Decisions

### 1. MCP Protocol Implementation
**Decision**: Use MCP SDK with Server-Sent Events (SSE) transport
**Rationale**:
- Official SDK ensures protocol compliance
- SSE is simpler than WebSocket for unidirectional communication
- Built-in support for tool schemas and validation
**Alternatives considered**:
- WebSocket transport: More complex, bi-directional not needed
- Custom protocol: Would break Claude Code compatibility

### 2. Webpage Capture Technology
**Decision**: Puppeteer 21+ with headless Chrome
**Rationale**:
- Most accurate rendering of modern web pages
- Extensive API for DOM extraction and screenshots
- Well-documented security sandboxing options
**Alternatives considered**:
- Playwright: Similar capabilities but larger footprint
- Selenium: Slower, more complex setup
- Static HTML parsers: Cannot handle CSS/JS rendering

### 3. AI Model Selection
**Decision**: Ollama with LLaVA (vision) + CodeLlama (generation)
**Rationale**:
- Fully local execution, no API costs
- LLaVA excels at UI component identification
- CodeLlama optimized for code generation vs general LLMs
- Ollama provides unified API for both models
**Alternatives considered**:
- Single multimodal model: Lower quality code generation
- Cloud APIs (OpenAI/Anthropic): Violates local-first principle
- Smaller models: Insufficient quality for production code

### 4. Caching Strategy
**Decision**: In-memory LRU cache with file-based persistence
**Rationale**:
- Fast access for repeated URLs
- Automatic eviction prevents unbounded growth
- File persistence survives container restarts
**Alternatives considered**:
- Redis: Overkill for single-server deployment
- No cache: Would re-process identical requests
- Database: Unnecessary complexity for key-value storage

### 5. Framework Template System
**Decision**: TypeScript template literals with framework-specific generators
**Rationale**:
- Type-safe template generation
- Easy to maintain per-framework idioms
- Supports dynamic styling approach selection
**Alternatives considered**:
- External template files: Harder to type-check
- AST manipulation: Too complex for requirements
- String concatenation: Error-prone, hard to maintain

### 6. Error Handling Architecture
**Decision**: Structured errors with error codes and recovery suggestions
**Rationale**:
- Consistent error format across all tools
- Machine-readable codes for automation
- Human-readable suggestions for debugging
**Alternatives considered**:
- Simple string errors: Less actionable
- HTTP-only status codes: Insufficient granularity
- Exceptions only: Poor for async operations

### 7. Testing Strategy
**Decision**: Jest with TypeScript for all test types
**Rationale**:
- Native TypeScript support
- Excellent async testing capabilities
- Rich ecosystem of matchers and utilities
**Alternatives considered**:
- Mocha/Chai: More configuration required
- Vitest: Less mature ecosystem
- Native Node.js test runner: Limited features

### 8. Docker Orchestration
**Decision**: Docker Compose with health checks and restart policies
**Rationale**:
- Single command deployment
- Built-in service discovery
- Automatic restart on failures
**Alternatives considered**:
- Kubernetes: Overkill for single-server
- Manual Docker commands: Error-prone
- PM2: Doesn't handle multi-container setup

## Performance Optimizations

### Concurrent Request Handling
- **Approach**: Worker pool pattern with 3 concurrent Puppeteer instances
- **Rationale**: Balances resource usage vs throughput
- **Implementation**: Queue with backpressure when at capacity

### Memory Management
- **Browser instances**: Properly closed after each analysis
- **Screenshot storage**: Compressed PNG with max 1GB cache
- **Model loading**: Ollama keeps models in memory between requests

### Network Optimization
- **Page loading**: networkidle0 with 30s timeout
- **Resource blocking**: Block unnecessary assets (ads, analytics)
- **Caching**: 24-hour TTL for identical URL requests

## Security Considerations

### URL Validation
- **Whitelist**: HTTP/HTTPS protocols only
- **Blacklist**: Private IPs, localhost, file:// URLs
- **Sanitization**: Remove tracking parameters, normalize encoding

### Browser Sandboxing
- **Flags**: --no-sandbox, --disable-setuid-sandbox (in container)
- **Permissions**: Read-only filesystem except cache/logs
- **Network**: Isolated Docker network, no host access

### Script Execution Prevention
- **JavaScript**: Disabled during DOM extraction
- **Cookies**: Not persisted between sessions
- **Downloads**: Blocked entirely

## Integration Points

### MCP Tool Schema
```json
{
  "name": "analyzeWebpage",
  "description": "Analyzes a webpage and generates component code",
  "inputSchema": {
    "type": "object",
    "properties": {
      "url": { "type": "string", "format": "uri" },
      "framework": { "enum": ["react", "angular", "vue", "svelte"] },
      "styling": { "enum": ["tailwind", "css", "scss", "styled-components"] }
    },
    "required": ["url", "framework", "styling"]
  }
}
```

### Health Check Endpoints
- **/health**: DIE server status
- **/health/ollama**: Ollama service availability
- **/health/models**: Model loading status

### Monitoring Metrics
- Request count and latency percentiles
- Cache hit rate and size
- Error rate by type
- Concurrent analysis count

## Resolved Questions

All NEEDS CLARIFICATION items from the specification have been addressed:
1. ✓ Typical webpage defined: <500 DOM elements, <10MB resources
2. ✓ Third-party content: Extract visual appearance only
3. ✓ JavaScript rendering: Capture immediately on page load
4. ✓ Component structure: Single monolithic component
5. ✓ Custom fonts: Map to closest system fonts

## Dependencies Summary

### Production Dependencies
- @modelcontextprotocol/sdk: ^1.0.0
- express: ^4.18.0
- puppeteer: ^21.0.0
- winston: ^3.11.0
- typescript: ^5.3.0
- lru-cache: ^10.0.0

### Development Dependencies
- @types/jest: ^29.5.0
- jest: ^29.7.0
- ts-jest: ^29.1.0
- @typescript-eslint/eslint-plugin: ^6.0.0
- prettier: ^3.1.0

### Docker Images
- node:20-alpine (DIE server)
- ollama/ollama:latest
- Required models: llava:7b, codellama:13b

## Next Steps
Proceed to Phase 1: Design & Contracts with all technical decisions resolved.