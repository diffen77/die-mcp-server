# Tasks: Webpage to Component Analyzer

**Input**: Design documents from `/specs/001-build-a-tool/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

## Phase 3.1: Setup
- [X] T001 Create TypeScript project structure with src/, tests/, docker/ directories
- [X] T002 Initialize Node.js 20+ project with package.json and TypeScript configuration
- [X] T003 [P] Configure ESLint, Prettier, and Jest testing framework
- [X] T004 [P] Create Docker configuration files (Dockerfile.die, Dockerfile.ollama, docker-compose.yml)
- [X] T005 [P] Setup Winston logger configuration in src/lib/logger.ts

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [X] T006 [P] MCP tool contract test for analyzeWebpage in tests/contract/mcp/analyzeWebpage.test.ts
- [X] T007 [P] Health endpoint contract test for /health in tests/contract/api/health.test.ts
- [X] T008 [P] Ollama health endpoint test for /health/ollama in tests/contract/api/ollamaHealth.test.ts
- [X] T009 [P] Models health endpoint test for /health/models in tests/contract/api/modelsHealth.test.ts
- [X] T010 [P] Cache stats endpoint test for /cache/stats in tests/contract/api/cacheStats.test.ts
- [X] T011 [P] Integration test for simple page (example.com) in tests/integration/pipeline.test.ts
- [X] T012 [P] Integration test for complex page (stripe.com) in tests/integration/complexPage.test.ts
- [X] T013 [P] Integration test for error handling (invalid URL) in tests/integration/errorHandling.test.ts
- [X] T014 [P] Integration test for caching behavior in tests/integration/caching.test.ts
- [X] T015 [P] Framework variety test (all combinations) in tests/integration/frameworks.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [X] T016 [P] Create WebpageAnalysis model with TypeScript interfaces in src/models/WebpageAnalysis.ts
- [X] T017 [P] Create ComponentConfig model with validation in src/models/ComponentConfig.ts
- [X] T018 [P] Create GeneratedComponent model with metadata in src/models/GeneratedComponent.ts
- [X] T019 [P] Implement structured error definitions in src/lib/errors.ts
- [X] T020 [P] Implement URL validation utilities in src/lib/validation.ts
- [X] T021 [P] Create browser lifecycle management in src/services/puppeteer/browser.ts
- [X] T022 [P] Implement screenshot capture service in src/services/puppeteer/capture.ts
- [X] T023 [P] Implement DOM extraction service (JavaScript disabled, HTML only) in src/services/puppeteer/domExtractor.ts
- [X] T024 [P] Create Ollama API client in src/services/ollama/client.ts
- [X] T025 [P] Implement LLaVA visual analysis service in src/services/ollama/llava.ts
- [X] T026 [P] Implement CodeLlama generation service in src/services/ollama/codellama.ts
- [X] T027 [P] Create React component generator in src/services/codeGenerator/react.ts
- [X] T028 [P] Create Angular component generator in src/services/codeGenerator/angular.ts
- [X] T029 [P] Create Vue component generator in src/services/codeGenerator/vue.ts
- [X] T030 [P] Create Svelte component generator in src/services/codeGenerator/svelte.ts
- [X] T031 [P] Implement LRU cache manager in src/services/cache/manager.ts
- [X] T032 Create MCP SSE server implementation in src/mcp/server.ts
- [X] T033 Implement analyzeWebpage MCP tool in src/mcp/tools/analyzeWebpage.ts
- [X] T034 Create MCP tool schemas in src/mcp/schemas/tools.json

## Phase 3.4: Integration
- [X] T035 Wire up Puppeteer services to main pipeline
- [X] T036 Connect Ollama services for AI analysis
- [X] T037 Integrate code generators with template system in src/services/codeGenerator/templates/
- [X] T038 Connect cache manager to analysis pipeline
- [X] T039 Implement health check endpoints (/health, /health/ollama, /health/models)
- [X] T040 Implement cache management endpoints (/cache/stats, /cache/clear)
- [X] T041 Add rate limiting middleware (10 req/min)
- [X] T042 Implement concurrent request handling (max 3)
- [X] T043 Add structured logging to all services
- [X] T044 Configure Docker health checks and restart policies

## Phase 3.5: Polish
- [X] T045 [P] Unit tests for URL validation in tests/unit/validation.test.ts
- [X] T046 [P] Unit tests for error handling in tests/unit/errors.test.ts
- [X] T047 [P] Unit tests for cache manager in tests/unit/cache.test.ts
- [X] T048 [P] Unit tests for each framework generator in tests/unit/generators/
- [X] T049 Performance test for <30s response time in tests/performance/timing.test.ts
- [X] T050 Memory leak test for 100 requests in tests/performance/memory.test.ts
- [X] T051 [P] Create API documentation from OpenAPI spec
- [X] T052 [P] Update README with setup and usage instructions
- [X] T053 Run quickstart.md validation checklist
- [X] T054 Optimize Docker images for size and security
- [X] T055 Final integration test of complete system

## Dependencies
- Setup (T001-T005) blocks all other tasks
- Tests (T006-T015) must complete before implementation (T016-T034)
- Models (T016-T020) can run parallel, block services
- Services (T021-T031) can run parallel, block integration
- MCP implementation (T032-T034) blocks integration
- Integration (T035-T044) blocks polish
- Polish tasks (T045-T055) can mostly run in parallel

## Parallel Example
```bash
# After setup, launch all contract tests together:
Task: "MCP tool contract test for analyzeWebpage in tests/contract/mcp/analyzeWebpage.test.ts"
Task: "Health endpoint contract test for /health in tests/contract/api/health.test.ts"
Task: "Ollama health endpoint test for /health/ollama in tests/contract/api/ollamaHealth.test.ts"
Task: "Models health endpoint test for /health/models in tests/contract/api/modelsHealth.test.ts"
Task: "Cache stats endpoint test for /cache/stats in tests/contract/api/cacheStats.test.ts"

# After tests, launch all models together:
Task: "Create WebpageAnalysis model with TypeScript interfaces in src/models/WebpageAnalysis.ts"
Task: "Create ComponentConfig model with validation in src/models/ComponentConfig.ts"
Task: "Create GeneratedComponent model with metadata in src/models/GeneratedComponent.ts"

# Launch all service implementations together:
Task: "Create browser lifecycle management in src/services/puppeteer/browser.ts"
Task: "Implement screenshot capture service in src/services/puppeteer/capture.ts"
Task: "Implement DOM extraction service in src/services/puppeteer/domExtractor.ts"
Task: "Create Ollama API client in src/services/ollama/client.ts"
Task: "Implement LLaVA visual analysis service in src/services/ollama/llava.ts"
Task: "Implement CodeLlama generation service in src/services/ollama/codellama.ts"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts
- Total tasks: 55
- Estimated completion: 2-3 days with parallel execution

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - mcp-tools.json → T006 (analyzeWebpage test)
   - api-spec.yaml → T007-T010 (health/cache endpoints)

2. **From Data Model**:
   - WebpageAnalysis → T016
   - ComponentConfig → T017
   - GeneratedComponent → T018

3. **From User Stories**:
   - Simple page test → T011
   - Complex page test → T012
   - Error handling → T013
   - Caching test → T014
   - Framework variety → T015

4. **Ordering**:
   - Setup → Tests → Models → Services → Integration → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests (T006-T010)
- [x] All entities have model tasks (T016-T018)
- [x] All tests come before implementation
- [x] Parallel tasks truly independent
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] All quickstart scenarios covered (T011-T015)
- [x] All health endpoints implemented (T039)
- [x] Performance requirements tested (T049-T050)