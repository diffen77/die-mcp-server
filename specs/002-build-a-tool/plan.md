
# Implementation Plan: Webpage Component Extractor

**Branch**: `002-build-a-tool` | **Date**: 2025-10-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-build-a-tool/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Build an MCP tool that extracts and recreates individual components from any webpage. The tool accepts a URL and component identifier (CSS selector or semantic description), captures the component visually in isolation, analyzes its design including interactive states, and generates self-contained component code for React or Vue frameworks with CSS, SCSS, or CSS-in-JS styling.

## Technical Context
**Language/Version**: TypeScript/Node.js 20+ (per constitution)
**Primary Dependencies**: Puppeteer 21+, Express.js, MCP SDK, Ollama (LLaVA + CodeLlama), Winston logging
**Storage**: Local file cache (screenshots/analysis results, 1GB max, 24-hour TTL, LRU eviction)
**Testing**: Jest with contract testing for MCP tools
**Target Platform**: Docker containerized server with MCP SSE endpoint
**Project Type**: single - MCP server implementation
**Performance Goals**: <30s total response time (screenshot <5s, LLaVA <10s, CodeLlama <15s)
**Constraints**: 3 concurrent analyses max, <2GB memory usage, offline operation after setup
**Scale/Scope**: Production-ready MCP tool for component extraction

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Local-First Architecture**: Tool operates offline after setup, uses Ollama for AI processing
- [x] **Docker-Based Deployment**: Fully containerized with Docker Compose orchestration
- [x] **MCP Protocol Compliance**: Implements MCP v0.5.0+ with SSE transport for tool definition
- [ ] **Multi-Framework Support**: Currently React/Vue only (not all 4 frameworks) - VIOLATION
- [x] **AI-Powered Analysis**: Uses LLaVA for visual analysis and CodeLlama for generation
- [x] **Performance Standards**: Meets <30s target with proper caching and concurrency limits
- [x] **Production-Ready Output**: Self-contained, error-free code with all imports/types
- [x] **Structured Error Handling**: Follows error format with codes, messages, suggestions
- [x] **Security & Input Validation**: URL validation, sandboxed Puppeteer, no JS execution

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
src/
├── models/
│   ├── ComponentRequest.ts     # MCP tool input validation models
│   ├── ComponentAnalysis.ts    # Analysis result models
│   └── GeneratedCode.ts        # Code generation output models
├── services/
│   ├── puppeteer/
│   │   ├── browser.ts          # Browser instance management
│   │   ├── screenshot.ts       # Component isolation & capture
│   │   └── domExtractor.ts     # DOM structure analysis
│   ├── ollama/
│   │   ├── client.ts           # Ollama API client
│   │   ├── llava.ts            # Visual analysis service
│   │   └── codellama.ts        # Code generation service
│   ├── codeGenerator/
│   │   ├── templates/          # Framework-specific templates
│   │   │   ├── react.ts
│   │   │   └── vue.ts
│   │   ├── styleGenerator.ts   # CSS/SCSS/CSS-in-JS generation
│   │   └── generator.ts        # Main generation orchestrator
│   └── cache/
│       └── cacheManager.ts     # LRU cache for screenshots
├── tools/                       # MCP tool definitions
│   └── extractComponent.ts     # Main MCP tool implementation
└── server.ts                    # Express server with MCP SSE endpoint

tests/
├── contract/
│   └── extractComponent.test.ts # MCP tool contract tests
├── integration/
│   └── e2e.test.ts              # Full pipeline tests
└── unit/
    ├── services/                # Unit tests for services
    └── models/                  # Model validation tests
```

**Structure Decision**: Single project structure selected as this is a focused MCP server implementation without separate frontend/backend components.

## Phase 0: Outline & Research ✓
1. **Research completed for**:
   - Browser automation approach (Puppeteer selected)
   - Component identification strategies (dual CSS + semantic)
   - AI model pipeline (LLaVA → CodeLlama)
   - Style extraction methods (user-configurable)
   - Caching and performance optimization

2. **Key technical decisions documented**:
   - Puppeteer with headless Chrome for reliability
   - LRU cache with 24-hour TTL for performance
   - AST-based code generation templates
   - Graceful degradation for error recovery

3. **All clarifications resolved**:
   - Framework support: React/Vue only
   - Styling formats: CSS, SCSS, CSS-in-JS
   - Authentication: Skip with error message
   - Timeouts: User-configurable, 30s default

**Output**: research.md complete with 10 technical decisions documented

## Phase 1: Design & Contracts ✓
*Prerequisites: research.md complete*

1. **Data model created** → `data-model.md`:
   - ComponentRequest, ComponentAnalysis, GeneratedCode entities
   - Validation rules and state transitions defined
   - Cache and error entities specified

2. **MCP contract generated** → `/contracts/extractComponent.yaml`:
   - OpenAPI 3.0 specification for extractComponent tool
   - Complete request/response schemas
   - Error codes and handling defined

3. **Contract tests created** → `/contracts/extractComponent.test.ts`:
   - 20+ test cases for input validation
   - Output contract verification
   - Performance and quality requirements

4. **Quickstart guide written** → `quickstart.md`:
   - Installation and setup instructions
   - Real-world usage examples
   - Troubleshooting guide

5. **Agent context updated** → `CLAUDE.md`:
   - Added Puppeteer, MCP SDK, Ollama dependencies
   - Updated with cache storage info
   - Recent changes documented

**Output**: All Phase 1 artifacts successfully created

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
The /tasks command will generate approximately 35-40 tasks organized as follows:

1. **Setup & Configuration Tasks** (1-5):
   - Docker Compose configuration
   - Environment setup and validation
   - Ollama model pulling scripts

2. **Model Implementation Tasks** (6-10) [P]:
   - ComponentRequest validation model
   - ComponentAnalysis data structures
   - GeneratedCode output model
   - Error and cache models

3. **Service Layer Tasks** (11-25):
   - Puppeteer browser management service
   - Screenshot capture and isolation service
   - DOM extraction service
   - Ollama client setup
   - LLaVA visual analysis integration
   - CodeLlama generation service
   - Cache manager with LRU eviction
   - Framework template builders (React, Vue)

4. **MCP Tool Implementation** (26-30):
   - Extract component tool definition
   - MCP SSE server endpoint
   - Request validation middleware
   - Response formatting

5. **Testing Tasks** (31-35) [P]:
   - Contract test implementation
   - Integration test suite
   - E2E pipeline tests
   - Performance benchmarks

6. **Documentation & Deployment** (36-40):
   - Docker image build
   - Health check endpoints
   - Logging configuration
   - Production deployment guide

**Ordering Strategy**:
- TDD approach: Contract tests defined before implementation
- Bottom-up: Models → Services → Tools → Server
- Parallel markers [P] for independent file creation
- Critical path: Puppeteer setup → Ollama integration → MCP tool

**Dependencies Identified**:
- Ollama must be running before AI services
- Browser pool must initialize before screenshot service
- Cache manager required by multiple services
- All services needed before MCP tool assembly

**Estimated Output**: 35-40 numbered tasks with clear dependencies and ~10 parallel opportunities

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Only React/Vue support (not all 4) | User explicitly clarified React/Vue only during /clarify phase | Supporting all 4 frameworks would increase template complexity without user benefit - spec explicitly limited scope |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS (with justified violation)
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
