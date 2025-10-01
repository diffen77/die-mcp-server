# Quickstart Validation Checklist

**Feature**: Webpage to Component Analyzer (DIE MCP Server)
**Version**: 1.0.0
**Date**: 2025-10-01

This checklist validates that the DIE MCP Server implementation meets all requirements from the quickstart guide.

---

## ✅ Prerequisites

- [ ] Docker installed (version 20.10+)
- [ ] Docker Compose installed (version 2.0+)
- [ ] 8GB RAM available
- [ ] 20GB disk space available
- [ ] Internet connection for model downloads

---

## ✅ Installation

### One-Command Setup

- [ ] `git clone` command works
- [ ] `cd die-mcp-server` navigates to project
- [ ] `docker-compose up -d` starts both containers
- [ ] Ollama container starts successfully
- [ ] DIE server container starts successfully
- [ ] Models begin downloading automatically

### Model Download

- [ ] LLaVA model downloads (~4.6GB)
- [ ] CodeLlama model downloads (~7.3GB)
- [ ] Download completes within 10 minutes (with good connection)
- [ ] No errors in `docker logs ollama`

---

## ✅ Verification

### Health Checks

```bash
curl http://localhost:3000/health
```

**Expected**:
- [ ] Returns 200 OK
- [ ] JSON response with `"status": "healthy"`
- [ ] `uptime` field is positive number
- [ ] `version` is "1.0.0"

```bash
curl http://localhost:3000/health/models
```

**Expected**:
- [ ] Returns 200 OK
- [ ] `models.llava.loaded` is `true`
- [ ] `models.codellama.loaded` is `true`
- [ ] Both models have size and version info

---

## ✅ Test Scenarios

### 1. Simple Page Test (example.com)

**Command**:
```bash
# Test via MCP (requires Claude Code integration)
# Or use direct tool call
```

**Expected Results**:
- [ ] Analysis completes successfully
- [ ] Response time < 10 seconds
- [ ] `success` field is `true`
- [ ] Component code is generated
- [ ] Code contains React component structure
- [ ] Code includes Tailwind CSS classes
- [ ] DOM elements count < 50
- [ ] Processing time < 10000ms
- [ ] No TODO or PLACEHOLDER in code

**Component Validation**:
- [ ] Code includes `function` or `const` component
- [ ] Has proper import statements
- [ ] Uses `className=` for Tailwind
- [ ] Compiles without errors (if saved and built)

---

### 2. Complex Page Test (stripe.com)

**Expected Results**:
- [ ] Analysis completes successfully
- [ ] Response time < 30 seconds
- [ ] Component generated for Vue with SCSS
- [ ] DOM elements 50-500
- [ ] Code includes `<template>`, `<script>`, `<style lang="scss">`
- [ ] Color palette has 5+ colors
- [ ] Multiple font families detected

---

### 3. Error Handling Test

**Invalid URL Test**:
```bash
# Test with invalid URL: "not-a-url"
```

**Expected**:
- [ ] `success` is `false`
- [ ] `error.code` is `"INVALID_URL"`
- [ ] Error message mentions "valid"
- [ ] Suggestion field is present

**Localhost Rejection**:
```bash
# Test with URL: "http://localhost:3000"
```

**Expected**:
- [ ] `success` is `false`
- [ ] `error.code` is `"INVALID_URL"`
- [ ] Error mentions localhost not allowed

**Private IP Rejection**:
```bash
# Test with URL: "http://192.168.1.1"
```

**Expected**:
- [ ] `success` is `false`
- [ ] Error code is `"INVALID_URL"`

---

### 4. Caching Test

**First Request**:
```bash
# Analyze https://example.com with React + Tailwind
```

- [ ] Record response time (should be 5-10s)
- [ ] Check cache stats: `curl http://localhost:3000/cache/stats`
- [ ] `entries` should be 1

**Second Request** (same URL + config):
```bash
# Repeat same request
```

- [ ] Response time < 1 second
- [ ] Generated code is identical to first request
- [ ] Cache stats show hit rate increased

**Different Config** (same URL):
```bash
# Analyze same URL but with Vue + CSS
```

- [ ] Creates new cache entry (different key)
- [ ] `entries` should be 2

---

### 5. Framework Variety Test

Test all combinations:

**React + Tailwind**:
- [ ] Generates `.tsx` file
- [ ] Uses `className=`
- [ ] Includes tailwindcss dependency

**React + CSS**:
- [ ] Imports `.css` file
- [ ] Includes CSS module pattern

**React + SCSS**:
- [ ] Imports `.scss` file
- [ ] Includes sass dependency

**React + styled-components**:
- [ ] Imports `styled-components`
- [ ] Uses `styled.` syntax

**Angular + CSS**:
- [ ] Generates `.component.ts` file
- [ ] Has `@Component` decorator
- [ ] Has `styleUrls` property

**Vue + SCSS**:
- [ ] Generates `.vue` file
- [ ] Has `<style lang="scss">`
- [ ] Uses SFC format

**Svelte + CSS**:
- [ ] Generates `.svelte` file
- [ ] Has `<script>` and `<style>` sections

---

## ✅ Monitoring

### Cache Performance

```bash
curl http://localhost:3000/cache/stats
```

**Expected**:
- [ ] Returns cache statistics
- [ ] `size` ≤ `maxSize` (1GB)
- [ ] `hitRate` increases with cache hits
- [ ] `entries` and `evictions` are tracked

### Logs

```bash
docker logs die-server -f
```

**Expected**:
- [ ] Structured logging with timestamps
- [ ] INFO level messages for normal operations
- [ ] No ERROR messages during successful analysis
- [ ] Request/response logging visible

```bash
docker logs ollama -f
```

**Expected**:
- [ ] Model loading messages
- [ ] No errors during model inference
- [ ] Response times logged

---

## ✅ Common Issues Resolution

### Models Not Loading

**Test**:
```bash
docker exec ollama ollama list
```

**Expected**:
- [ ] Shows `llava:7b` in list
- [ ] Shows `codellama:13b` in list

**If missing, manually pull**:
```bash
docker exec ollama ollama pull llava:7b
docker exec ollama ollama pull codellama:13b
```

### Timeout Errors

**Causes**:
- [ ] Page has >500 DOM elements
- [ ] Network connectivity issues
- [ ] Page takes >30s to load

**Resolution**:
- [ ] Verify page is accessible
- [ ] Check DOM element count in error details
- [ ] Try simpler page

### Out of Memory

**Check**:
```bash
docker stats
```

**Expected**:
- [ ] DIE server uses < 2GB
- [ ] Ollama uses < 4GB
- [ ] Total system memory sufficient

**Resolution**:
```bash
curl -X POST http://localhost:3000/cache/clear
```

- [ ] Cache cleared successfully
- [ ] Memory usage decreased

---

## ✅ Performance Validation

### Response Times

| Page Type | Expected Time | Actual Time | Pass/Fail |
|-----------|---------------|-------------|-----------|
| Simple (<50 elements) | 5-10s | ___s | ☐ |
| Medium (50-200) | 10-20s | ___s | ☐ |
| Complex (200-500) | 20-30s | ___s | ☐ |
| Cached (any) | <1s | ___s | ☐ |

### Success Metrics

- [ ] All health checks pass
- [ ] example.com generates valid component
- [ ] Generated code compiles without errors
- [ ] Response time within budget
- [ ] Cache hit rate >50% after 10 requests
- [ ] No memory leaks after 100 requests

---

## ✅ Development Mode

### Local Development (Without Docker)

**Setup**:
```bash
npm install
ollama serve
ollama pull llava:7b
ollama pull codellama:13b
npm run dev
```

**Expected**:
- [ ] Dependencies install successfully
- [ ] Ollama starts on port 11434
- [ ] Dev server starts on port 3000
- [ ] TypeScript compiles successfully

**Tests**:
```bash
npm test
```

**Expected**:
- [ ] Contract tests run (may fail without implementation)
- [ ] Integration tests run (may fail without services)
- [ ] Unit tests pass
- [ ] No TypeScript errors

---

## ✅ Integration with Claude Code

### MCP Configuration

Add to Claude Code settings:
```json
{
  "mcpServers": {
    "die": {
      "command": "docker",
      "args": ["exec", "-i", "die-server", "node", "/app/dist/mcp/server.js"]
    }
  }
}
```

**Expected**:
- [ ] Configuration accepted
- [ ] MCP server shows as connected in Claude
- [ ] Tools list includes "analyzeWebpage"

### Test with Claude

**Prompt**: "Use the analyzeWebpage tool to analyze https://example.com and generate a React component with Tailwind CSS."

**Expected**:
- [ ] Claude calls the tool successfully
- [ ] Returns generated component code
- [ ] Code is formatted and readable
- [ ] Claude can explain the generated code

---

## 📊 Validation Summary

**Date Validated**: _______________
**Validated By**: _______________

| Category | Tests Passed | Tests Failed | Pass Rate |
|----------|--------------|--------------|-----------|
| Prerequisites | ___/5 | ___ | ___% |
| Installation | ___/6 | ___ | ___% |
| Health Checks | ___/8 | ___ | ___% |
| Test Scenarios | ___/30 | ___ | ___% |
| Framework Variety | ___/7 | ___ | ___% |
| Performance | ___/4 | ___ | ___% |
| **TOTAL** | ___/60 | ___ | ___% |

**Overall Status**: ☐ PASS (≥95%) | ☐ FAIL (<95%)

**Notes**:
_______________________________________
_______________________________________
_______________________________________

---

**This checklist should be run**:
- ✅ Before production deployment
- ✅ After major code changes
- ✅ As part of CI/CD pipeline
- ✅ During acceptance testing
