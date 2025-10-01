# DIE MCP Server API Documentation

**Version**: 1.0.0
**Base URL**: `http://localhost:3000`

## Table of Contents

- [Health Endpoints](#health-endpoints)
- [Cache Endpoints](#cache-endpoints)
- [MCP Endpoints](#mcp-endpoints)
- [Error Codes](#error-codes)
- [Rate Limiting](#rate-limiting)

---

## Health Endpoints

### GET /health

Returns the overall health status of the DIE server.

**Response**: `200 OK`

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

**Fields**:
- `status`: `"healthy"` | `"degraded"` | `"unhealthy"`
- `timestamp`: ISO 8601 timestamp
- `uptime`: Server uptime in seconds
- `version`: Server version

---

### GET /health/ollama

Checks if the Ollama service is available.

**Response**: `200 OK` (available) or `503 Service Unavailable`

```json
{
  "service": "ollama",
  "available": true,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "responseTime": 45
}
```

**Fields**:
- `service`: Service name ("ollama")
- `available`: Boolean indicating availability
- `timestamp`: ISO 8601 timestamp
- `responseTime`: Response time in milliseconds (optional)
- `lastError`: Error message if unavailable (optional)

---

### GET /health/models

Checks if AI models (LLaVA and CodeLlama) are loaded.

**Response**: `200 OK` (all loaded) or `503 Service Unavailable`

```json
{
  "models": {
    "llava": {
      "loaded": true,
      "size": 4661211136,
      "version": "llava:7b"
    },
    "codellama": {
      "loaded": true,
      "size": 7365960704,
      "version": "codellama:13b"
    }
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Fields**:
- `models.llava.loaded`: Boolean
- `models.llava.size`: Model size in bytes (optional)
- `models.llava.version`: Model version string (optional)
- `models.codellama.*`: Same structure as llava
- `timestamp`: ISO 8601 timestamp

---

## Cache Endpoints

### GET /cache/stats

Returns cache statistics.

**Response**: `200 OK`

```json
{
  "entries": 25,
  "size": 134217728,
  "maxSize": 1073741824,
  "hitRate": 0.75,
  "evictions": 3,
  "oldestEntry": "2024-01-01T10:00:00.000Z",
  "newestEntry": "2024-01-01T12:00:00.000Z"
}
```

**Fields**:
- `entries`: Number of cached entries
- `size`: Current cache size in bytes
- `maxSize`: Maximum cache size in bytes (1GB)
- `hitRate`: Cache hit rate (0-1)
- `evictions`: Number of entries evicted since start
- `oldestEntry`: Timestamp of oldest entry (optional)
- `newestEntry`: Timestamp of newest entry (optional)

---

### POST /cache/clear

Clears all cache entries.

**Response**: `200 OK`

```json
{
  "success": true,
  "clearedEntries": 25
}
```

**Fields**:
- `success`: Boolean indicating success
- `clearedEntries`: Number of entries cleared

---

## MCP Endpoints

### GET /sse

Server-Sent Events endpoint for MCP communication.

**Query Parameters**:
- `client_id` (optional): Client identifier for connection tracking

**Response**: `200 OK` with `Content-Type: text/event-stream`

Establishes an SSE connection for bidirectional MCP communication.

**Example Connection**:
```javascript
const eventSource = new EventSource('http://localhost:3000/sse?client_id=my-client');

eventSource.onmessage = (event) => {
  console.log('Received:', event.data);
};
```

---

### POST /messages

Internal endpoint for SSE message handling (used by MCP SDK).

**Request Body**: JSON-RPC 2.0 message

**Response**: `200 OK`

---

## MCP Tools

### analyzeWebpage

Analyzes a webpage and generates component code.

**Input Schema**:

```json
{
  "url": "https://example.com",
  "framework": "react",
  "styling": "tailwind",
  "options": {
    "typescript": true,
    "responsive": true,
    "accessibility": true
  }
}
```

**Fields**:
- `url` (required): Valid HTTP/HTTPS URL to analyze
- `framework` (required): `"react"` | `"angular"` | `"vue"` | `"svelte"`
- `styling` (required): `"tailwind"` | `"css"` | `"scss"` | `"styled-components"`
- `options.typescript` (optional): Include TypeScript types (default: `true`)
- `options.responsive` (optional): Mobile-first responsive design (default: `true`)
- `options.accessibility` (optional): Include ARIA labels (default: `true`)

**Success Response**:

```json
{
  "success": true,
  "component": {
    "code": "import React from 'react';\n\nfunction Component() {...}",
    "imports": ["import React from 'react';"],
    "dependencies": {
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "tailwindcss": "^3.4.0"
    },
    "filename": "WebpageComponent.tsx",
    "instructions": "1. Save this component as WebpageComponent.tsx..."
  },
  "analysis": {
    "url": "https://example.com",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "domElements": 42,
    "colors": ["#000000", "#FFFFFF", "#FF5733"],
    "fonts": ["Arial", "Helvetica"],
    "processingTime": 8543
  }
}
```

**Error Response**:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_URL",
    "message": "Invalid URL: Protocol not allowed",
    "details": {
      "url": "ftp://example.com",
      "reason": "Protocol not allowed"
    },
    "suggestion": "Provide a valid HTTP or HTTPS URL..."
  }
}
```

---

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `INVALID_URL` | URL validation failed | 400 |
| `UNREACHABLE_URL` | Cannot access webpage | 400 |
| `TIMEOUT` | Analysis exceeded 30 seconds | 408 |
| `DOM_TOO_LARGE` | More than 500 DOM elements | 413 |
| `RESOURCE_TOO_LARGE` | Page resources exceed 10MB | 413 |
| `UNSUPPORTED_FRAMEWORK` | Invalid framework choice | 400 |
| `UNSUPPORTED_STYLING` | Invalid styling choice | 400 |
| `AI_MODEL_ERROR` | LLaVA or CodeLlama failure | 500 |
| `TEMPLATE_ERROR` | Code generation failed | 500 |
| `VALIDATION_ERROR` | Input validation failed | 400 |
| `RATE_LIMITED` | Rate limit exceeded | 429 |
| `INTERNAL_ERROR` | Unexpected server error | 500 |

---

## Rate Limiting

**Limits**:
- **10 requests per minute** per IP address
- **3 concurrent analyses** maximum

**Headers**:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Time when limit resets (ISO 8601)

**429 Response**:
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded: 10 requests per minute",
    "suggestion": "Wait 45 seconds before retrying",
    "details": {
      "limit": 10,
      "windowMs": 60000,
      "resetIn": 45
    }
  }
}
```

---

## Examples

### cURL Example

```bash
# Health check
curl http://localhost:3000/health

# Cache stats
curl http://localhost:3000/cache/stats

# Clear cache
curl -X POST http://localhost:3000/cache/clear

# MCP tool call (requires MCP SDK)
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

### JavaScript Example

```javascript
// Using MCP SDK
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const client = new Client({
  name: 'my-client',
  version: '1.0.0',
});

await client.connect('http://localhost:3000/sse');

const result = await client.callTool('analyzeWebpage', {
  url: 'https://example.com',
  framework: 'react',
  styling: 'tailwind',
  options: {
    typescript: true,
    responsive: true,
    accessibility: true,
  },
});

console.log(result);
```

---

## Notes

- All timestamps are in ISO 8601 format
- All sizes are in bytes
- Cache uses LRU eviction with 24-hour TTL
- Screenshots are PNG format, max 10MB
- JavaScript is disabled during DOM extraction
- Localhost and private IPs are blocked

---

**For support**: See [README.md](README.md) for troubleshooting and contact information.
