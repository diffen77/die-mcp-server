<!--
  Sync Impact Report
  ==================
  Version Change: N/A → 1.0.0 (Initial constitution creation)

  Modified Principles: N/A (initial creation)

  Added Sections:
  - I. Local-First Architecture
  - II. Docker-Based Deployment
  - III. MCP Protocol Compliance
  - IV. Multi-Framework Code Generation
  - V. AI-Powered Analysis
  - VI. Performance Standards
  - VII. Production-Ready Output
  - VIII. Structured Error Handling
  - IX. Security & Input Validation
  - Additional Constraints (Performance & Reliability)
  - Development Workflow (Testing & Quality)

  Removed Sections: N/A (initial creation)

  Templates Status:
  ✅ plan-template.md - Constitution Check section exists and will use this constitution
  ✅ spec-template.md - Compatible with principles (no changes needed)
  ✅ tasks-template.md - Compatible with TDD and quality principles

  Follow-up TODOs:
  - Ratification date set to today (2025-10-01) as initial version
  - Consider adding performance monitoring requirements in future versions
-->

# Design Intelligence Engine (DIE) Constitution

## Core Principles

### I. Local-First Architecture
The system MUST operate completely offline after initial setup with zero external API dependencies. All AI processing, web analysis, and code generation MUST run locally using self-hosted models (Ollama). Internet connectivity is ONLY required for: npm/docker installations, pulling AI models, and accessing target websites for analysis. This principle ensures zero cost per analysis, complete privacy, and independence from third-party services.

**Rationale**: Local execution eliminates API costs, latency, privacy concerns, and dependency on external services. Users maintain full control over their analysis pipeline.

### II. Docker-Based Deployment
The entire system MUST be containerized and orchestrated via Docker Compose with health monitoring for all services. Each service (DIE MCP Server, Ollama, Puppeteer) MUST have health check endpoints and restart policies (unless-stopped). Containers MUST be production-ready with proper resource limits, volume mounts for persistence (cache/, logs/, ollama-data), and internal networking.

**Rationale**: Docker ensures consistent environments across platforms, simplifies deployment to one-command setup, and provides isolation for browser automation security.

### III. MCP Protocol Compliance
The server MUST implement the Model Context Protocol (MCP) v0.5.0+ specification with Server-Sent Events (SSE) transport. All tools MUST follow MCP schema definitions with proper input validation and structured output. The `/sse` endpoint MUST handle MCP connections correctly with `text/event-stream` content type and graceful shutdown handling.

**Rationale**: MCP compliance ensures seamless integration with Claude Code and future AI assistants while maintaining protocol standards.

### IV. Multi-Framework Code Generation
Generated code MUST support React, Angular, Vue, and Svelte with framework-specific best practices and idioms. Each framework template MUST include: proper imports, TypeScript types (when applicable), semantic HTML5, responsive design patterns (mobile-first), and the specified styling framework (Tailwind/CSS/SCSS/styled-components). Code MUST be self-contained, production-ready, and follow official framework style guides.

**Rationale**: Multi-framework support maximizes usefulness across different projects while maintaining quality through framework-specific templates.

### V. AI-Powered Analysis
Visual analysis MUST use LLaVA for UI understanding and CodeLlama for code generation. The analysis pipeline MUST: 1) Extract DOM structure with semantic elements, colors, typography, layout patterns; 2) Capture full-page screenshots (1920x1080 viewport); 3) Send screenshots to LLaVA for component identification and hierarchy analysis; 4) Generate code using CodeLlama with detailed prompts combining visual and structural analysis. AI model configuration MUST be optimized for code generation quality, not speed.

**Rationale**: Combining vision models with code-specialized LLMs produces higher quality output than single-model approaches.

### VI. Performance Standards
The system MUST meet these performance targets: screenshot capture <5s, LLaVA analysis <10s, CodeLlama generation <15s, total response time <30s for simple pages. The server MUST support 3 concurrent analyses and maintain <2GB memory usage under normal load. Caching MUST be implemented for screenshots (24-hour TTL, 1GB max, LRU eviction) to avoid redundant processing.

**Rationale**: Performance constraints ensure the tool remains responsive and practical for real-world usage patterns.

### VII. Production-Ready Output
Generated code MUST compile/run without errors and require minimal modifications (<10% of lines). Code MUST NOT contain: placeholder content, TODO comments, mock data, or unimplemented functions. All components MUST include: necessary imports, proper types, semantic HTML, ARIA labels for accessibility, responsive design, and clean formatting. The output MUST be copy-paste ready for production projects.

**Rationale**: High-quality output reduces friction and makes the tool genuinely useful rather than just a starting point.

### VIII. Structured Error Handling
All errors MUST follow the structured format: `{ error: { code, message, details?, suggestion? } }`. Input validation errors (400) MUST provide clear guidance on valid formats. External service errors (502/504) MUST include retry logic (once) and detailed context. Internal errors (500) MUST be logged with full stack traces while returning user-friendly messages. Every error MUST include actionable recovery suggestions.

**Rationale**: Structured errors with recovery guidance improve debuggability and user experience when things go wrong.

### IX. Security & Input Validation
All URLs MUST be sanitized and validated before processing. Downloaded JavaScript MUST NEVER be executed. Puppeteer MUST run in sandboxed containers with headless mode and security flags (--no-sandbox, --disable-setuid-sandbox). Rate limiting MUST be enforced (10 requests/minute). DOM analysis MUST extract structure without executing scripts. File system access MUST be restricted to designated cache/ and logs/ directories.

**Rationale**: Security controls prevent malicious websites from compromising the analysis server or host system.

## Additional Constraints

### Performance & Reliability
- **Uptime**: 99% when container is running
- **Error rate**: <5% for valid URLs
- **Retry logic**: Auto-retry failed requests once with exponential backoff
- **Graceful degradation**: Return partial results if AI analysis fails but DOM extraction succeeds
- **Browser configuration**: Headless Chrome with networkidle0 wait condition, 30-second timeout
- **Concurrent limits**: Maximum 3 simultaneous analyses to prevent resource exhaustion
- **Memory management**: Browser instances MUST be properly closed after each analysis

### Technology Requirements
- **Runtime**: Node.js 20+ with TypeScript strict mode
- **Framework**: Express.js with structured logging (Winston)
- **Browser**: Puppeteer 21+ with Chromium
- **AI Models**: Ollama with LLaVA (~4GB) and CodeLlama (~4GB)
- **Minimum System**: 8GB RAM, 20GB disk for models and cache
- **GPU**: Optional but recommended for faster AI inference

## Development Workflow

### Testing & Quality Gates
- **TDD Enforcement**: Write failing tests before implementation for all tools
- **Contract Testing**: Each MCP tool MUST have contract tests validating input/output schemas
- **Integration Testing**: End-to-end tests for Puppeteer→DOM→AI→CodeGen pipeline
- **Manual Test Cases**: Verify against real websites (example.com, stripe.com, etc.)
- **Performance Testing**: Validate response times meet <30s target
- **Error Testing**: Verify all error paths return proper structured errors

### Code Quality Standards
- **TypeScript**: Strict mode enabled, no `any` types without justification
- **Linting**: ESLint with recommended rules enforced in pre-commit hooks
- **Formatting**: Prettier with 2-space indentation, 100-character line limit
- **Logging**: Winston with structured logs (JSON format), appropriate log levels
- **Comments**: Document complex AI prompts and DOM analysis logic
- **Modularity**: Separate concerns (services/puppeteer, services/ollama, services/codeGenerator)

### Observability Requirements
- **Health Checks**: `/health` endpoint for DIE server, Ollama API monitoring
- **Structured Logging**: All requests logged with: URL, stack, timing, success/failure
- **Cache Metrics**: Track hit rate, size, evictions
- **Performance Metrics**: Log p50, p95, p99 response times per tool
- **Error Tracking**: Log all errors with full context (URL, stack trace, service state)

## Governance

### Constitution Authority
This constitution supersedes all other development practices and guidelines. When conflicts arise between this document and implementation details, constitutional principles take precedence. All code reviews MUST verify compliance with these principles before approval.

### Amendment Process
1. **Proposal**: Document proposed change with rationale and impact analysis
2. **Version Bump**: Determine semantic version increase (MAJOR/MINOR/PATCH)
3. **Template Sync**: Update all dependent templates (plan, spec, tasks, commands)
4. **Approval**: Review by project maintainers required for MAJOR/MINOR changes
5. **Migration**: Document breaking changes and provide migration guide for MAJOR versions

### Compliance Review
- **Pre-implementation**: Constitution Check section in plan.md MUST pass before Phase 0
- **Post-design**: Re-check after Phase 1 design documents completed
- **Pull Requests**: All PRs reviewed against constitutional principles
- **Complexity Justification**: Deviations from principles MUST be documented in Complexity Tracking table with simpler alternatives explicitly rejected

### Version Management
- **MAJOR**: Backward incompatible changes (e.g., removing MCP support, changing Docker strategy)
- **MINOR**: New principles added (e.g., adding authentication requirement, new framework support)
- **PATCH**: Clarifications, wording improvements, non-semantic fixes

**Version**: 1.0.0 | **Ratified**: 2025-10-01 | **Last Amended**: 2025-10-01
