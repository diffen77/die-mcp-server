# die-mcp-server Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-01

## Active Technologies
- TypeScript/Node.js 20+ with strict mode + Express.js, Puppeteer 21+, MCP SDK, Winston logging (001-build-a-tool)
- TypeScript/Node.js 20+ (per constitution) + Puppeteer 21+, Express.js, MCP SDK, Ollama (LLaVA + CodeLlama), Winston logging (002-build-a-tool)
- Local file cache (screenshots/analysis results, 1GB max, 24-hour TTL, LRU eviction) (002-build-a-tool)

## Project Structure
```
src/
tests/
```

## Commands
npm test; npm run lint

## Code Style
TypeScript/Node.js 20+ with strict mode: Follow standard conventions

## Recent Changes
- 002-build-a-tool: Added TypeScript/Node.js 20+ (per constitution) + Puppeteer 21+, Express.js, MCP SDK, Ollama (LLaVA + CodeLlama), Winston logging
- 001-build-a-tool: Added TypeScript/Node.js 20+ with strict mode + Express.js, Puppeteer 21+, MCP SDK, Winston logging

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
