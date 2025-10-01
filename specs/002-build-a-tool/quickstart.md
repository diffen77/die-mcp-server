# Quick Start Guide: Webpage Component Extractor

## Overview
Extract and recreate any component from a webpage as production-ready React or Vue code using AI-powered visual analysis.

## Prerequisites

1. **Docker & Docker Compose installed**
   ```bash
   docker --version  # 20.10+
   docker-compose --version  # 2.0+
   ```

2. **Node.js 20+ (for development)**
   ```bash
   node --version  # v20.0.0+
   npm --version   # 10.0.0+
   ```

3. **System Requirements**
   - 8GB RAM minimum
   - 20GB disk space (for AI models)
   - GPU optional but recommended

## Installation

### 1. Clone and Setup
```bash
# Clone repository
git clone <repository-url>
cd die-mcp-server

# Install dependencies
npm install

# Pull AI models (one-time setup, ~8GB download)
docker-compose up ollama-setup
```

### 2. Start Services
```bash
# Start all services (DIE server, Ollama, health checks)
docker-compose up -d

# Verify services are running
docker-compose ps
curl http://localhost:3000/health
```

### 3. Connect MCP Client
```bash
# For Claude Code
claude-code connect http://localhost:3000/sse

# Or use any MCP-compatible client
```

## Basic Usage

### Extract Component by CSS Selector

```javascript
// Using MCP client
const result = await mcp.callTool('extractComponent', {
  url: 'https://stripe.com',
  identifier: {
    type: 'selector',
    value: '.pricing-table'
  },
  framework: 'react',
  styling: 'css'
});

console.log(result.componentName); // "PricingTable"
console.log(result.code);          // Full React component
```

### Extract Component Semantically

```javascript
const result = await mcp.callTool('extractComponent', {
  url: 'https://example.com',
  identifier: {
    type: 'semantic',
    value: 'main navigation bar with logo'
  },
  framework: 'vue',
  styling: 'scss'
});
```

## Real-World Examples

### Example 1: Extract Hero Section
```javascript
// Extract a hero section from a landing page
const hero = await mcp.callTool('extractComponent', {
  url: 'https://vercel.com',
  identifier: {
    type: 'selector',
    value: 'section.hero'
  },
  framework: 'react',
  styling: 'css-in-js',
  includeComputedStyles: true
});

// Generated component includes:
// - Responsive layout
// - Interactive elements
// - Optimized images
// - Event handlers
```

### Example 2: Extract Complex Form
```javascript
// Extract a multi-step form
const form = await mcp.callTool('extractComponent', {
  url: 'https://app.example.com/signup',
  identifier: {
    type: 'semantic',
    value: 'registration form with validation'
  },
  framework: 'vue',
  styling: 'scss',
  timeout: 45000  // Longer timeout for complex pages
});
```

### Example 3: Handle Multiple Matches
```javascript
const result = await mcp.callTool('extractComponent', {
  url: 'https://blog.example.com',
  identifier: {
    type: 'selector',
    value: '.card'  // Multiple cards on page
  },
  framework: 'react'
});

if (result.matches && result.matches.length > 1) {
  // User selects from matches
  console.log('Found multiple matches:');
  result.matches.forEach((match, i) => {
    console.log(`${i}: ${match.description} (${match.confidence})`);
  });
}
```

## Configuration Options

### Viewport Customization
```javascript
{
  viewport: {
    width: 1440,   // Laptop screen
    height: 900
  }
}
```

### Style Extraction
```javascript
{
  includeComputedStyles: true,  // All computed CSS
  // OR
  includeComputedStyles: false  // Original styles only
}
```

### Performance Tuning
```javascript
{
  timeout: 15000  // Faster timeout for simple pages
}
```

## Testing Your Setup

### 1. Basic Connectivity Test
```bash
# Test MCP endpoint
curl -X POST http://localhost:3000/sse \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}'
```

### 2. Simple Extraction Test
```javascript
// Test with a simple, fast-loading page
const test = await mcp.callTool('extractComponent', {
  url: 'https://example.com',
  identifier: {
    type: 'selector',
    value: 'h1'
  },
  framework: 'react'
});

assert(test.success === true);
assert(test.componentName === 'PageHeading');
```

### 3. Run Contract Tests
```bash
npm test -- contracts/extractComponent.test.ts
```

## Common Issues & Solutions

### Issue: "AUTH_REQUIRED" Error
**Solution**: The target page requires authentication. Use public pages or pages that don't require login.

### Issue: "COMPONENT_NOT_FOUND" Error
**Solution**:
- Verify the CSS selector is correct
- Try a more specific selector
- Use semantic identification instead

### Issue: Slow Response Times
**Solution**:
- Ensure Docker has enough resources (Settings → Resources)
- Check if Ollama models are loaded: `docker logs ollama`
- Consider using GPU acceleration

### Issue: Styles Look Different
**Solution**:
- Toggle `includeComputedStyles` option
- Check if external fonts/resources are loaded
- Verify viewport size matches target

## Performance Tips

1. **Use Specific Selectors**: More specific = faster extraction
2. **Cache Warming**: Repeated requests to same URL are cached
3. **Optimize Viewport**: Smaller viewport = faster screenshots
4. **Batch Processing**: Process similar pages together for cache benefits

## Advanced Usage

### Custom Framework Templates
```javascript
// Coming soon: Plugin system for custom frameworks
{
  framework: 'custom',
  template: 'path/to/template.js'
}
```

### Bulk Extraction
```javascript
// Extract multiple components efficiently
const components = ['header', 'footer', 'sidebar'];
const results = await Promise.all(
  components.map(selector =>
    mcp.callTool('extractComponent', {
      url: 'https://example.com',
      identifier: { type: 'selector', value: selector },
      framework: 'react'
    })
  )
);
```

## Monitoring & Debugging

### View Logs
```bash
# Server logs
docker logs die-server -f

# AI model logs
docker logs ollama -f
```

### Check Cache Status
```bash
curl http://localhost:3000/cache/metrics
```

### Debug Mode
```javascript
{
  debug: true  // Returns additional analysis metadata
}
```

## Next Steps

1. **Explore the API**: See full [API Documentation](./contracts/extractComponent.yaml)
2. **Run Tests**: Verify your setup with `npm test`
3. **Customize**: Modify templates in `src/services/codeGenerator/templates/`
4. **Contribute**: Submit PRs for new frameworks or improvements

## Support

- **Issues**: GitHub Issues
- **Docs**: [Full Documentation](../README.md)
- **Community**: Discord/Slack (if applicable)

---

*Happy component extracting! 🚀*