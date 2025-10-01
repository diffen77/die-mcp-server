# Quick Start Guide

**Feature**: Webpage to Component Analyzer
**Version**: 1.0.0
**Prerequisites**: Docker, Docker Compose, 8GB RAM, 20GB disk space

## 🚀 One-Command Setup

```bash
# Clone and start the system
git clone https://github.com/your-org/die-mcp-server.git
cd die-mcp-server
docker-compose up -d
```

Wait ~2 minutes for models to download (first run only).

## ✅ Verify Installation

```bash
# Check all services are running
curl http://localhost:3000/health

# Expected response:
# {"status":"healthy","timestamp":"...","uptime":120,"version":"1.0.0"}

# Verify AI models are loaded
curl http://localhost:3000/health/models

# Expected response:
# {"models":{"llava":{"loaded":true},"codellama":{"loaded":true}}}
```

## 🎯 Test the MCP Tool

### Using Claude Code

1. Open Claude Code
2. Add MCP server connection:
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

3. Test with Claude:
```
Use the analyzeWebpage tool to analyze https://example.com and generate a React component with Tailwind CSS.
```

### Using Direct API (for testing)

```bash
# Test webpage analysis
curl -X POST http://localhost:3000/sse \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "analyzeWebpage",
      "arguments": {
        "url": "https://example.com",
        "framework": "react",
        "styling": "tailwind"
      }
    },
    "id": 1
  }'
```

## 📋 Validation Checklist

Run these tests to verify the system works correctly:

### 1. Simple Page Test (example.com)
```javascript
// Expected: React component generated in <10 seconds
const result = await analyzeWebpage({
  url: "https://example.com",
  framework: "react",
  styling: "tailwind"
});

assert(result.success === true);
assert(result.component.code.includes("function Example"));
assert(result.component.code.includes("className="));
assert(result.analysis.domElements < 50);
assert(result.analysis.processingTime < 10000);
```

### 2. Complex Page Test (stripe.com)
```javascript
// Expected: Complete component in <30 seconds
const result = await analyzeWebpage({
  url: "https://stripe.com",
  framework: "vue",
  styling: "scss"
});

assert(result.success === true);
assert(result.component.code.includes("<template>"));
assert(result.component.code.includes("<style lang=\"scss\">"));
assert(result.analysis.domElements < 500);
assert(result.analysis.processingTime < 30000);
```

### 3. Error Handling Test
```javascript
// Test invalid URL
const result = await analyzeWebpage({
  url: "not-a-url",
  framework: "react",
  styling: "css"
});

assert(result.success === false);
assert(result.error.code === "INVALID_URL");
assert(result.error.suggestion.includes("valid HTTP"));
```

### 4. Caching Test
```javascript
// First request
const start1 = Date.now();
const result1 = await analyzeWebpage({
  url: "https://example.com",
  framework: "react",
  styling: "css"
});
const time1 = Date.now() - start1;

// Second request (should be cached)
const start2 = Date.now();
const result2 = await analyzeWebpage({
  url: "https://example.com",
  framework: "react",
  styling: "css"
});
const time2 = Date.now() - start2;

assert(time2 < time1 / 2); // Cached response much faster
assert(result1.component.code === result2.component.code);
```

### 5. Framework Variety Test
```javascript
const frameworks = ["react", "angular", "vue", "svelte"];
const stylings = ["tailwind", "css", "scss", "styled-components"];

for (const framework of frameworks) {
  for (const styling of stylings) {
    // Skip incompatible combinations
    if (framework === "angular" && styling === "styled-components") continue;

    const result = await analyzeWebpage({
      url: "https://example.com",
      framework,
      styling
    });

    assert(result.success === true);
    assert(result.component.filename.match(getExtension(framework)));
    console.log(`✓ ${framework} + ${styling}`);
  }
}
```

## 🔍 Monitoring

### Check Cache Performance
```bash
curl http://localhost:3000/cache/stats

# Expected output:
# {
#   "entries": 5,
#   "size": 52428800,
#   "maxSize": 1073741824,
#   "hitRate": 0.6,
#   "evictions": 0
# }
```

### View Logs
```bash
# DIE server logs
docker logs die-server -f

# Ollama logs
docker logs ollama -f

# All services
docker-compose logs -f
```

## 🚫 Common Issues

### Issue: "Models not loaded"
```bash
# Manually pull models
docker exec ollama ollama pull llava:7b
docker exec ollama ollama pull codellama:13b
```

### Issue: "Timeout on analysis"
- Check if webpage has >500 DOM elements
- Verify network connectivity
- Increase timeout in docker-compose.yml

### Issue: "Out of memory"
- Ensure 8GB RAM available
- Reduce concurrent analyses in config
- Clear cache: `curl -X POST http://localhost:3000/cache/clear`

## 📊 Performance Expectations

| Page Complexity | DOM Elements | Expected Time | Cache Hit Time |
|----------------|--------------|---------------|----------------|
| Simple | <50 | 5-10s | <1s |
| Medium | 50-200 | 10-20s | <1s |
| Complex | 200-500 | 20-30s | <1s |

## 🎓 Example Output

For `https://example.com` with React + Tailwind:

```jsx
import React from 'react';

function ExamplePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Example Domain
        </h1>
      </header>
      <main className="px-8 pb-8">
        <p className="text-gray-700 mb-4">
          This domain is for use in illustrative examples in documents.
        </p>
        <p className="text-gray-700">
          <a href="https://www.iana.org/domains/example"
             className="text-blue-600 hover:underline">
            More information...
          </a>
        </p>
      </main>
    </div>
  );
}

export default ExamplePage;
```

## 🛠️ Development Mode

For local development without Docker:

```bash
# Install dependencies
npm install

# Start Ollama locally
ollama serve

# Pull models
ollama pull llava:7b
ollama pull codellama:13b

# Start dev server
npm run dev

# Run tests
npm test
```

## 📈 Success Metrics

Your installation is successful when:
- ✅ All health checks pass
- ✅ Example.com generates valid React component
- ✅ Generated code compiles without errors
- ✅ Response time <30s for typical pages
- ✅ Cache hit rate >50% after 10 requests
- ✅ No memory leaks after 100 requests

## 🆘 Support

- GitHub Issues: https://github.com/your-org/die-mcp-server/issues
- Documentation: https://docs.your-org.com/die
- Discord: https://discord.gg/your-channel