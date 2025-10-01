# DIE MCP Server

**Design Intelligence Engine** - Webpage Component Extractor

An MCP (Model Context Protocol) server that extracts and recreates individual components from any webpage as production-ready React or Vue code using AI-powered visual analysis.

## Features

- 🎯 **Precise Component Extraction**: Target components via CSS selectors or semantic descriptions
- 🎨 **Visual Analysis**: Uses LLaVA to understand component design and hierarchy
- 🤖 **AI Code Generation**: Uses CodeLlama to generate production-ready code
- ⚛️ **Framework Support**: React and Vue components
- 💅 **Multiple Styling Options**: CSS, SCSS, CSS-in-JS
- 📸 **Interactive States**: Captures hover, focus, and active states
- 🚀 **Performance**: <30s response time, intelligent LRU caching
- 🔒 **Secure**: URL validation, sandboxed browser execution
- 🐳 **Docker-Ready**: Full containerization with Docker Compose

## Quick Start

### Prerequisites

- Docker and Docker Compose
- 8GB RAM minimum
- 20GB disk space (for AI models)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/die-mcp-server.git
cd die-mcp-server
```

2. Start the services:
```bash
docker-compose -f docker/docker-compose.yml up -d
```

3. Wait for models to download (~5-10 minutes first time):
```bash
docker logs ollama -f
```

4. Verify installation:
```bash
curl http://localhost:3000/health
```

### Development Setup

For local development without Docker:

1. Install dependencies:
```bash
npm install
```

2. Start Ollama locally and pull models:
```bash
ollama serve
ollama pull llava:7b
ollama pull codellama:13b
```

3. Start development server:
```bash
npm run dev
```

## Usage

### With Claude Code

Add to your MCP settings:

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

Then in Claude:
```
Use the analyzeWebpage tool to analyze https://example.com and generate a React component with Tailwind CSS.
```

### Direct API Usage

```bash
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
        "styling": "tailwind",
        "options": {
          "typescript": true,
          "responsive": true,
          "accessibility": true
        }
      }
    },
    "id": 1
  }'
```

## API Reference

### Health Endpoints

- `GET /health` - Server health status
- `GET /health/ollama` - Ollama service status
- `GET /health/models` - AI model loading status

### Cache Endpoints

- `GET /cache/stats` - Cache statistics
- `POST /cache/clear` - Clear cache

### MCP Endpoint

- `GET /sse` - Server-Sent Events endpoint for MCP communication

## Configuration

Environment variables:

```bash
# Server
PORT=3000
NODE_ENV=production

# Ollama
OLLAMA_HOST=http://ollama:11434

# Cache
CACHE_MAX_SIZE=1073741824  # 1GB
CACHE_MAX_ENTRIES=100

# Rate Limiting
RATE_LIMIT_PER_MINUTE=10
MAX_CONCURRENT_ANALYSES=3

# Analysis
ANALYSIS_TIMEOUT_MS=30000  # 30 seconds
```

## Supported Frameworks

### React
- TypeScript/JavaScript
- Tailwind CSS, CSS, SCSS, styled-components
- Functional components with hooks

### Angular
- TypeScript (required)
- Tailwind CSS, CSS, SCSS
- Component + template + style files

### Vue
- TypeScript/JavaScript
- Tailwind CSS, CSS, SCSS
- Single-file components (SFC)

### Svelte
- TypeScript/JavaScript
- Tailwind CSS, CSS, SCSS
- Single-file components

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Browser   │────▶│  Puppeteer   │────▶│  LLaVA      │
│  (capture)  │     │  (extract)   │     │  (analyze)  │
└─────────────┘     └──────────────┘     └─────────────┘
                                                  │
                                                  ▼
                                          ┌─────────────┐
                                          │  CodeLlama  │
                                          │  (generate) │
                                          └─────────────┘
                                                  │
                                                  ▼
                                          ┌─────────────┐
                                          │  Generator  │
                                          │  (format)   │
                                          └─────────────┘
```

## Performance

Expected performance for typical webpages:

| Page Complexity | DOM Elements | Time      | Cache Hit |
|----------------|--------------|-----------|-----------|
| Simple         | <50          | 5-10s     | <1s       |
| Medium         | 50-200       | 10-20s    | <1s       |
| Complex        | 200-500      | 20-30s    | <1s       |

## Limitations

- Maximum 500 DOM elements per page
- Maximum 10MB page resources
- JavaScript is disabled during DOM extraction (static HTML only)
- One monolithic component per analysis
- Localhost and private IPs are blocked

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
npm run test:coverage
```

### Lint

```bash
npm run lint
npm run lint:fix
```

### Format

```bash
npm run format
npm run format:check
```

## Troubleshooting

### Models not loading

```bash
docker exec ollama ollama pull llava:7b
docker exec ollama ollama pull codellama:13b
```

### Timeout errors

- Increase `ANALYSIS_TIMEOUT_MS`
- Check network connectivity
- Verify page is accessible

### Memory issues

- Ensure 8GB RAM available
- Reduce `MAX_CONCURRENT_ANALYSES`
- Clear cache: `curl -X POST http://localhost:3000/cache/clear`

## License

MIT

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Support

- GitHub Issues: https://github.com/your-org/die-mcp-server/issues
- Documentation: https://docs.your-org.com/die
