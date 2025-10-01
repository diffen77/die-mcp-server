# Product Requirements Document (PRD)
## Design Intelligence Engine (DIE) - MCP Server

---

## 1. Executive Summary

**Product Name:** Design Intelligence Engine (DIE) MCP Server  
**Version:** 1.0.0 (MVP/Phase 1)  
**Target:** Local/Self-hosted MCP server for analyzing web designs and generating stack-specific code  
**Deployment:** Docker container with Ollama integration  

### Purpose
Enable developers to analyze any website's design and generate clean, idiomatic code for their specific tech stack (React, Angular, Vue, etc.) without copying source code. The system uses visual analysis and AI to understand design patterns and recreate them as production-ready components.

---

## 2. Core Objectives

### Primary Goals
1. ✅ Analyze entire webpages and generate stack-specific code
2. ✅ Extract specific components from any website
3. ✅ Analyze multi-step user flows (e.g., checkout, registration)
4. ✅ Generate code that matches the user's project stack and styling framework
5. ✅ Run completely locally with no external API dependencies

### Success Metrics
- Can successfully analyze 90% of modern websites
- Generated code requires minimal modifications (<10% of lines)
- Response time <30 seconds for simple page analysis
- Works offline after initial setup
- Zero cost per analysis (fully local)

---

## 3. Technical Architecture

### System Components

```
┌─────────────────────────────────────────────┐
│  Client: Claude Code                        │
│  └─→ MCP Protocol (SSE)                     │
└──────────────────┬──────────────────────────┘
                   │ HTTP/SSE
┌──────────────────▼──────────────────────────┐
│  DIE MCP Server (Node.js + Express)         │
│  ├─→ MCP SDK (Server Implementation)        │
│  ├─→ Tool Handlers (3 tools)                │
│  ├─→ Puppeteer Service (Screenshots)        │
│  ├─→ DOM Analyzer (Structure extraction)    │
│  └─→ Ollama Service (AI Code Generation)    │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  Ollama Container                           │
│  ├─→ LLaVA (Vision model for UI analysis)  │
│  └─→ CodeLlama (Code generation)           │
└─────────────────────────────────────────────┘
```

### Tech Stack
- **Runtime:** Node.js 20+ with TypeScript
- **Framework:** Express.js
- **MCP Protocol:** @modelcontextprotocol/sdk v0.5.0+
- **Browser Automation:** Puppeteer 21+
- **AI Models:** Ollama (LLaVA + CodeLlama)
- **Containerization:** Docker + Docker Compose
- **Logging:** Winston

---

## 4. Functional Requirements

### 4.1 MCP Server Core

**Must Have:**
- Implement MCP Server with SSE transport
- Expose `/sse` endpoint for MCP connections
- Expose `/health` endpoint for health checks
- Handle graceful shutdown
- Implement structured logging (Winston)
- Cache screenshots to avoid redundant analysis

**Server Configuration:**
- Port: 3000 (configurable via env)
- Transport: Server-Sent Events (SSE)
- Content-Type: text/event-stream
- CORS: Enabled for localhost

### 4.2 Tool 1: analyze_page

**Purpose:** Analyze an entire webpage and generate stack-specific code

**Input Schema:**
```typescript
{
  url: string;           // Required: URL to analyze
  stack: 'react' | 'angular' | 'vue' | 'svelte';  // Required
  styling: 'tailwind' | 'css' | 'scss' | 'styled-components';  // Optional, default: tailwind
}
```

**Workflow:**
1. Validate URL and stack parameters
2. Launch Puppeteer browser (headless)
3. Navigate to URL with `networkidle0` wait condition
4. Take full-page screenshot (1920x1080 viewport)
5. Extract DOM structure:
   - Semantic HTML elements (nav, header, footer, main)
   - Color palette (background, text, primary colors)
   - Typography (font families, sizes)
   - Layout patterns (grid, flexbox detection)
6. Send screenshot to LLaVA for visual analysis:
   - Identify component types (navbar, hero, cards, forms)
   - Understand layout hierarchy
   - Detect spacing patterns
7. Generate code with CodeLlama:
   - Use stack-specific templates
   - Apply styling framework conventions
   - Include TypeScript if stack supports it
   - Add responsive design patterns
8. Return formatted code as text

**Output:**
- Complete component code ready to use
- Includes imports, types, and styling
- Follows framework best practices

**Error Handling:**
- Invalid URL: Return clear error message
- Timeout (>30s): Return partial analysis with timeout note
- Unsupported stack: List supported stacks
- Network errors: Retry once, then fail gracefully

### 4.3 Tool 2: extract_component

**Purpose:** Extract a specific component from a webpage

**Input Schema:**
```typescript
{
  url: string;           // Required: URL containing component
  selector: string;      // Required: CSS selector or semantic description
  stack: 'react' | 'angular' | 'vue' | 'svelte';  // Required
  styling: 'tailwind' | 'css' | 'scss';  // Optional, default: tailwind
}
```

**Workflow:**
1. Navigate to URL with Puppeteer
2. If selector is CSS selector (starts with # . [ or valid tag):
   - Find element with `page.$(selector)`
   - Take screenshot of that element only
3. If selector is semantic description (e.g., "navbar", "pricing table"):
   - Take full page screenshot
   - Use LLaVA to identify component matching description
   - Extract bounding box and re-screenshot that area
4. Analyze component in isolation:
   - Get computed styles
   - Identify interactive states (hover, focus)
   - Detect responsive behavior
5. Generate standalone component code
6. Return formatted code

**Special Cases:**
- Component not found: Return suggestions for similar elements
- Multiple matches: Return all matches and ask user to specify
- Dynamic component: Capture multiple states (default, hover, active)

### 4.4 Tool 3: analyze_flow

**Purpose:** Analyze a multi-step user flow and generate components for each step

**Input Schema:**
```typescript
{
  startUrl: string;      // Required: Starting URL
  steps: Array<{
    name: string;        // Step name (e.g., "Search Form")
    action: 'click' | 'input' | 'scroll' | 'wait';
    selector?: string;   // CSS selector for element
    value?: string;      // Value for input actions
  }>;                    // Required: Array of steps
  stack: 'react' | 'angular' | 'vue';  // Required
}
```

**Workflow:**
1. Start at `startUrl`
2. For each step:
   - Take screenshot of current state
   - Perform action (click, input, scroll)
   - Wait for page to settle (networkidle0)
   - Extract DOM structure
   - Identify what changed
3. Analyze all screenshots with LLaVA:
   - Understand flow progression
   - Identify components per step
   - Detect state changes
4. Generate components for entire flow:
   - One component per step
   - Shared state management logic
   - Navigation/routing code
5. Return all components as structured output

**Output Format:**
```typescript
{
  components: [
    {
      name: "StepName",
      code: "...",
      description: "..."
    }
  ],
  stateManagement: "...",  // Shared state code
  routing: "..."           // Navigation code
}
```

---

## 5. Non-Functional Requirements

### 5.1 Performance
- **Screenshot capture:** <5 seconds
- **AI analysis (LLaVA):** <10 seconds
- **Code generation (CodeLlama):** <15 seconds
- **Total response time:** <30 seconds for simple pages
- **Concurrent requests:** Support 3 concurrent analyses
- **Memory usage:** <2GB under normal load

### 5.2 Reliability
- **Uptime:** 99% when container is running
- **Error rate:** <5% for valid URLs
- **Retry logic:** Auto-retry failed requests once
- **Graceful degradation:** Return partial results if AI fails

### 5.3 Security
- **Input validation:** Sanitize all URLs
- **No code execution:** Never execute downloaded JavaScript
- **Sandboxed browsing:** Puppeteer runs in isolated container
- **Rate limiting:** Max 10 requests per minute (future: authentication)

### 5.4 Scalability (Future)
- **Multi-user support:** Authentication via API keys
- **Load balancing:** Multiple MCP server instances
- **Caching:** Redis for screenshot and analysis cache
- **Metrics:** Prometheus for monitoring

---

## 6. Project Structure

```
die-mcp-server/
├── docker-compose.yml          # Multi-container orchestration
├── Dockerfile                  # DIE server container
├── package.json               # Node.js dependencies
├── tsconfig.json              # TypeScript configuration
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore patterns
├── .dockerignore              # Docker ignore patterns
├── README.md                  # Setup and usage guide
├── src/
│   ├── index.ts              # Main server entry point
│   │                         # - Express app setup
│   │                         # - MCP server initialization
│   │                         # - Health check endpoint
│   │                         # - SSE endpoint
│   ├── server/
│   │   ├── mcpServer.ts      # MCP server configuration
│   │   └── tools.ts          # Tool definitions and schemas
│   ├── tools/
│   │   ├── analyzePage.ts    # Tool 1 implementation
│   │   ├── extractComponent.ts  # Tool 2 implementation
│   │   └── analyzeFlow.ts    # Tool 3 implementation
│   ├── services/
│   │   ├── puppeteer.service.ts   # Browser automation
│   │   │                          # - getBrowser()
│   │   │                          # - takeScreenshot()
│   │   │                          # - analyzeDOM()
│   │   │                          # - extractElement()
│   │   ├── ollama.service.ts      # AI integration
│   │   │                          # - analyzeWithVision()
│   │   │                          # - generateCode()
│   │   └── codeGenerator.service.ts  # Code generation logic
│   │                                 # - Stack-specific templates
│   │                                 # - Code formatting
│   ├── utils/
│   │   ├── domAnalyzer.ts    # DOM structure extraction
│   │   │                     # - extractColors()
│   │   │                     # - extractFonts()
│   │   │                     # - detectLayout()
│   │   ├── logger.ts         # Winston logger setup
│   │   ├── cache.ts          # Simple file-based cache
│   │   └── validators.ts     # Input validation
│   └── types/
│       ├── mcp.types.ts      # MCP-related types
│       ├── analysis.types.ts # Analysis result types
│       └── tool.types.ts     # Tool input/output types
├── cache/                    # Screenshot cache (gitignored)
└── logs/                     # Application logs (gitignored)
```

---

## 7. Implementation Details

### 7.1 Puppeteer Service

**Browser Configuration:**
```typescript
{
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--disable-extensions'
  ]
}
```

**Viewport Settings:**
- Width: 1920px
- Height: 1080px
- DeviceScaleFactor: 1

**Screenshot Options:**
- Type: PNG
- FullPage: true (for analyze_page)
- Encoding: binary (return Buffer)

**Page Load Strategy:**
- WaitUntil: 'networkidle0' (no network activity for 500ms)
- Timeout: 30 seconds
- Retry: Once on timeout

### 7.2 DOM Analysis

**Extract from page.evaluate():**

```typescript
interface DOMAnalysis {
  // Semantic structure
  semantics: {
    hasNav: boolean;
    hasHeader: boolean;
    hasFooter: boolean;
    hasAside: boolean;
    mainContent: string;  // CSS selector of main content
  };
  
  // Visual properties
  colors: {
    background: string[];
    text: string[];
    primary: string[];
    secondary: string[];
  };
  
  // Typography
  typography: {
    fonts: string[];
    headingSizes: number[];
    bodySize: number;
  };
  
  // Layout detection
  layout: {
    type: 'flex' | 'grid' | 'float' | 'absolute';
    direction: 'row' | 'column';
    responsive: boolean;
    breakpoints: number[];
  };
  
  // Components identified
  components: Array<{
    type: string;  // 'navbar' | 'hero' | 'card' | 'form' | etc.
    selector: string;
    position: { x: number; y: number; width: number; height: number };
  }>;
}
```

### 7.3 Ollama Integration

**LLaVA Vision Analysis Prompt:**
```
Analyze this UI screenshot and provide a detailed description:

1. Layout Structure:
   - Overall layout pattern (header, main, footer, sidebar)
   - Grid or flexbox usage
   - Number of columns/sections

2. Components Identified:
   - Navigation elements
   - Content blocks (hero, cards, forms, etc.)
   - Interactive elements (buttons, inputs, links)

3. Visual Design:
   - Color scheme (primary, secondary, accent colors)
   - Typography (heading styles, body text)
   - Spacing patterns (padding, margins, gaps)
   - Visual hierarchy

4. Responsive Indicators:
   - Mobile-friendly elements
   - Likely breakpoints
   - Adaptive components

Provide output as structured JSON.
```

**CodeLlama Generation Prompt Template:**
```
Generate a {stack} component with {styling} styling based on this design analysis:

Visual Analysis:
{llava_output}

DOM Structure:
{dom_analysis}

Requirements:
- Framework: {stack} (React/Angular/Vue/Svelte)
- Styling: {styling} (Tailwind/CSS/SCSS)
- TypeScript: {useTypeScript}
- Semantic HTML5 elements
- Accessible (ARIA labels where needed)
- Responsive design (mobile-first)
- Clean, production-ready code
- No placeholder content or TODOs
- Include necessary imports

Component should be self-contained and ready to use.
Output only the code, no explanations.
```

### 7.4 Code Generation Templates

**React + Tailwind Template Structure:**
```typescript
// imports
import { useState } from 'react';
import { Icon } from 'lucide-react';

// types (if TypeScript)
interface Props {
  // ...
}

// component
export default function ComponentName({ ...props }: Props) {
  // state
  const [state, setState] = useState();
  
  // handlers
  const handleAction = () => { };
  
  // render
  return (
    <div className="tailwind-classes">
      {/* component content */}
    </div>
  );
}
```

**Angular Template Structure:**
```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-component-name',
  template: `
    <div class="component-container">
      <!-- component content -->
    </div>
  `,
  styles: [`
    .component-container {
      /* scoped styles */
    }
  `]
})
export class ComponentNameComponent {
  // component logic
}
```

### 7.5 Caching Strategy

**Cache Key Format:**
```
{url_hash}_{viewport}_{timestamp}.png
```

**Cache Invalidation:**
- TTL: 24 hours
- Max cache size: 1GB
- LRU eviction when full

**Cache Check:**
1. Generate cache key from URL + viewport
2. Check if file exists and is <24h old
3. If yes: return cached screenshot
4. If no: take new screenshot and cache

---

## 8. Docker Configuration

### 8.1 docker-compose.yml Requirements

**Services:**
1. **die-mcp:** Main application
   - Build from Dockerfile
   - Port: 3000
   - Depends on: ollama
   - Restart: unless-stopped
   - Volumes: cache/, logs/
   - Health check: curl /health

2. **ollama:** AI model server
   - Image: ollama/ollama:latest
   - Port: 11434
   - GPU support: NVIDIA (optional but recommended)
   - Restart: unless-stopped
   - Health check: curl /api/tags

**Networks:**
- Internal bridge network for service communication

**Volumes:**
- ollama-data: Persistent model storage
- Local mount: cache/ and logs/

### 8.2 Dockerfile Requirements

**Base Image:** node:20-bullseye-slim

**System Dependencies:**
```
wget curl ca-certificates fonts-liberation
libappindicator3-1 libasound2 libatk-bridge2.0-0
libatk1.0-0 libcairo2 libcups2 libdbus-1-3
libexpat1 libfontconfig1 libgbm1 libglib2.0-0
libgtk-3-0 libnspr4 libnss3 libpango-1.0-0
libx11-6 libx11-xcb1 libxcb1 libxcomposite1
libxcursor1 libxdamage1 libxext6 libxfixes3
libxi6 libxrandr2 libxrender1 libxss1 libxtst6
xdg-utils
```

**Build Steps:**
1. Install system dependencies
2. Copy package files
3. Run `npm ci --production=false`
4. Copy source code
5. Build TypeScript: `npm run build`
6. Create cache/ and logs/ directories
7. Expose port 3000
8. Health check command
9. Start with: `node dist/index.js`

---

## 9. Error Handling

### 9.1 Error Categories

**1. User Input Errors (400)**
- Invalid URL format
- Unsupported stack/styling
- Missing required parameters
- Malformed JSON

**2. External Service Errors (502/504)**
- Website unreachable
- Puppeteer timeout
- Ollama service down
- Network failures

**3. Internal Errors (500)**
- Unexpected exceptions
- Memory overflow
- File system errors

### 9.2 Error Response Format

```typescript
{
  error: {
    code: string;           // ERROR_CODE
    message: string;        // Human-readable message
    details?: any;          // Additional context
    suggestion?: string;    // What user should do
  }
}
```

### 9.3 Error Handling Strategy

**For each tool:**
1. Validate inputs (throw detailed error)
2. Wrap main logic in try-catch
3. Log error with context
4. Return user-friendly error message
5. Include recovery suggestions

**Examples:**
```typescript
// URL validation error
{
  code: 'INVALID_URL',
  message: 'The provided URL is not valid',
  details: { url: 'invalid-url' },
  suggestion: 'Please provide a full URL including protocol (https://)'
}

// Timeout error
{
  code: 'ANALYSIS_TIMEOUT',
  message: 'Analysis took too long and was aborted',
  details: { timeout: 30000, elapsed: 45000 },
  suggestion: 'Try a simpler page or increase timeout in settings'
}

// Ollama error
{
  code: 'AI_SERVICE_ERROR',
  message: 'AI service is not available',
  details: { service: 'ollama', host: 'http://ollama:11434' },
  suggestion: 'Check if Ollama container is running: docker-compose ps'
}
```

---

## 10. Testing Strategy

### 10.1 Unit Tests
- DOM analyzer functions
- URL validators
- Cache logic
- Code template generators

### 10.2 Integration Tests
- Puppeteer screenshot capture
- Ollama API communication
- MCP protocol compliance
- Tool execution end-to-end

### 10.3 Manual Test Cases

**Test 1: Simple Page Analysis**
- Input: `{ url: 'https://example.com', stack: 'react', styling: 'tailwind' }`
- Expected: Valid React component with Tailwind classes
- Pass criteria: Code compiles without errors

**Test 2: Component Extraction**
- Input: `{ url: 'https://stripe.com', selector: 'nav', stack: 'vue' }`
- Expected: Vue navbar component
- Pass criteria: Contains navigation elements

**Test 3: Flow Analysis**
- Input: Registration flow with 3 steps
- Expected: 3 components + state management
- Pass criteria: All steps represented

**Test 4: Error Handling**
- Input: Invalid URL
- Expected: Clear error message
- Pass criteria: No crash, helpful error

---

## 11. Deployment Instructions

### 11.1 Initial Setup

```bash
# 1. Clone/create project
mkdir die-mcp-server && cd die-mcp-server

# 2. Create all files (from PRD structure)

# 3. Install dependencies
npm install

# 4. Build containers
docker-compose build

# 5. Start services
docker-compose up -d

# 6. Pull AI models (will take time)
docker exec die-ollama ollama pull llava
docker exec die-ollama ollama pull codellama

# 7. Verify health
curl http://localhost:3000/health
curl http://localhost:11434/api/tags

# 8. Check logs
docker-compose logs -f
```

### 11.2 Claude Code Configuration

**Config file:** `~/.config/claude-code/mcp_config.json`

```json
{
  "mcpServers": {
    "design-intelligence-engine": {
      "url": "http://localhost:3000/sse",
      "transport": "sse"
    }
  }
}
```

**For remote server:**
```json
{
  "mcpServers": {
    "design-intelligence-engine": {
      "url": "https://your-server.com/sse",
      "transport": "sse"
    }
  }
}
```

### 11.3 Usage in Claude Code

```
User: "Analyze stripe.com/pricing and generate a React component with Tailwind"

Claude Code will:
1. Call MCP tool: analyze_page
2. DIE server processes request
3. Returns generated component code
4. Claude Code presents it to user
```

---

## 12. Future Enhancements (Post-MVP)

### Phase 2
- Multi-user support with authentication
- Rate limiting and usage tracking
- Better caching with Redis
- WebSocket transport (in addition to SSE)
- Component library builder (save favorites)

### Phase 3
- Interactive state capture (hover, focus, animations)
- A/B variant generation
- Responsive design variants (mobile, tablet, desktop)
- Design system extraction
- Figma plugin integration

### Phase 4
- SaaS platform with web UI
- Marketplace for templates
- Collaborative features
- Analytics dashboard
- Premium AI models option

---

## 13. Success Criteria for MVP

✅ **Functional:**
- All 3 tools working end-to-end
- Generates valid code for React, Angular, Vue
- Works with Tailwind, CSS, SCSS
- Runs in Docker container

✅ **Performance:**
- <30s response time for simple pages
- Can handle 3 concurrent requests
- Stable over 24h continuous operation

✅ **Quality:**
- Generated code compiles without errors
- Code follows framework best practices
- Requires <10% manual modification

✅ **Deployment:**
- One-command docker-compose setup
- Works on Linux/Mac/Windows with Docker
- Clear documentation and examples

---

## 14. Implementation Priority

### P0 (Must Have for MVP)
1. MCP server with SSE transport
2. analyze_page tool (full page)
3. Puppeteer screenshot service
4. Basic DOM analyzer
5. Ollama integration (LLaVA + CodeLlama)
6. React + Tailwind code generation
7. Docker configuration
8. Health check endpoint
9. Basic error handling
10. README with setup instructions

### P1 (Should Have)
1. extract_component tool
2. Angular and Vue support
3. SCSS/CSS styling support
4. Structured logging
5. Screenshot caching
6. Input validation
7. Better error messages

### P2 (Nice to Have)
1. analyze_flow tool
2. Svelte support
3. Advanced caching
4. Performance metrics
5. Comprehensive tests

---

## 15. Technical Constraints

### Must Support
- Node.js 20+
- Docker 24+
- Docker Compose 2.0+
- 8GB+ RAM (for Ollama models)
- 20GB+ disk space (for models and cache)

### Browser Compatibility
- Puppeteer supports: Chrome/Chromium only
- Headless mode required

### AI Models
- LLaVA: ~4GB model size
- CodeLlama: ~4GB model size
- Total: ~8GB for both models

### Network
- No external API calls after setup
- Can run completely offline
- Internet needed only for:
  - npm install
  - docker pull
  - ollama pull models
  - Analyzing external websites

---

## 16. Appendix

### A. Example Workflows

**Workflow 1: Building a landing page**
```
1. User sees nice hero section on product hunt
2. In Claude Code: "Extract the hero from producthunt.com"
3. DIE analyzes and generates React component
4. User copies code to their project
5. Tweaks copy and images
6. Done in <2 minutes
```

**Workflow 2: Learning new patterns**
```
1. User wants to understand Stripe's pricing table
2. "Analyze stripe.com/pricing"
3. Gets complete component code
4. Studies the implementation
5. Learns modern CSS Grid techniques
```

### B. Glossary

- **MCP:** Model Context Protocol - protocol for connecting tools to LLMs
- **SSE:** Server-Sent Events - one-way server push over HTTP
- **DIE:** Design Intelligence Engine - this product
- **LLaVA:** Large Language and Vision Assistant - multimodal AI
- **CodeLlama:** Code-specialized version of Llama model
- **Ollama:** Platform for running LLMs locally
- **Puppeteer:** Headless browser automation library
- **Stack:** Target framework (React, Angular, Vue, etc.)
- **Styling:** CSS approach (Tailwind, CSS modules, SCSS, etc.)

### C. References

- MCP SDK Documentation: https://github.com/modelcontextprotocol/sdk
- Puppeteer Docs: https://pptr.dev/
- Ollama Docs: https://ollama.ai/
- Claude Code: https://docs.claude.com/claude-code

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-01  
**Status:** Ready for Implementation  
**Next Review:** After MVP completion