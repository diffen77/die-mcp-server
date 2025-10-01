/**
 * T032: MCP SSE server implementation
 * Main MCP server with Server-Sent Events transport
 */

import express, { Request, Response } from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { logger, httpLogStream } from '../lib/logger.js';
import { analyzeWebpage } from './tools/analyzeWebpage.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { concurrencyLimiter } from '../middleware/concurrencyLimiter.js';
import toolSchemas from './schemas/tools.json' assert { type: 'json' };

const app = express();
const PORT = parseInt(process.env.PORT || '3000');
const START_TIME = Date.now();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Apply rate limiting to all endpoints
app.use(rateLimiter);

// Apply concurrency limiting to analysis endpoints
app.use(concurrencyLimiter);

/**
 * Creates and configures MCP server
 */
function createMCPServer(): Server {
  const server = new Server(
    {
      name: 'die-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register list tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug('ListTools request received');

    return {
      tools: toolSchemas.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  });

  // Register call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    logger.info('CallTool request received', {
      toolName: request.params.name,
    });

    const { name, arguments: args } = request.params;

    if (name === 'analyzeWebpage') {
      try {
        const result = await analyzeWebpage(args as any);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error('Tool execution failed', { toolName: name, error });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: {
                  code: 'INTERNAL_ERROR',
                  message: error instanceof Error ? error.message : String(error),
                },
              }),
            },
          ],
          isError: true,
        };
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: {
              code: 'UNKNOWN_TOOL',
              message: `Unknown tool: ${name}`,
            },
          }),
        },
      ],
      isError: true,
    };
  });

  logger.info('MCP server created and configured');
  return server;
}

/**
 * Health check endpoint
 */
app.get('/health', async (req: Request, res: Response) => {
  const uptime = Math.floor((Date.now() - START_TIME) / 1000);

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime,
    version: '1.0.0',
  });
});

/**
 * Ollama health check endpoint
 */
app.get('/health/ollama', async (req: Request, res: Response) => {
  try {
    const { ollamaClient } = await import('../services/ollama/client.js');
    const health = await ollamaClient.healthCheck();

    if (health.available) {
      res.json({
        service: 'ollama',
        available: true,
        timestamp: new Date().toISOString(),
        responseTime: health.responseTime,
      });
    } else {
      res.status(503).json({
        service: 'ollama',
        available: false,
        timestamp: new Date().toISOString(),
        lastError: health.error,
      });
    }
  } catch (error) {
    logger.error('Ollama health check failed', { error });
    res.status(503).json({
      service: 'ollama',
      available: false,
      timestamp: new Date().toISOString(),
      lastError: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Models health check endpoint
 */
app.get('/health/models', async (req: Request, res: Response) => {
  try {
    const { ollamaClient } = await import('../services/ollama/client.js');
    const models = await ollamaClient.listModels();

    const llava = models.find((m) => m.name.startsWith('llava'));
    const codellama = models.find((m) => m.name.startsWith('codellama'));

    const allLoaded = llava && codellama;

    if (allLoaded) {
      res.json({
        models: {
          llava: {
            loaded: !!llava,
            size: llava?.size,
            version: llava?.name,
          },
          codellama: {
            loaded: !!codellama,
            size: codellama?.size,
            version: codellama?.name,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        models: {
          llava: {
            loaded: !!llava,
          },
          codellama: {
            loaded: !!codellama,
          },
        },
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error('Models health check failed', { error });
    res.status(503).json({
      models: {
        llava: { loaded: false },
        codellama: { loaded: false },
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Cache stats endpoint
 */
app.get('/cache/stats', async (req: Request, res: Response) => {
  try {
    const { cacheManager } = await import('../services/cache/manager.js');
    const stats = cacheManager.getStats();

    res.json({
      entries: stats.entries,
      size: stats.size,
      maxSize: stats.maxSize,
      hitRate: stats.hitRate,
      evictions: stats.evictions,
      oldestEntry: stats.oldestEntry?.toISOString(),
      newestEntry: stats.newestEntry?.toISOString(),
    });
  } catch (error) {
    logger.error('Cache stats failed', { error });
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve cache stats',
      },
    });
  }
});

/**
 * Cache clear endpoint
 */
app.post('/cache/clear', async (req: Request, res: Response) => {
  try {
    const { cacheManager } = await import('../services/cache/manager.js');
    const clearedEntries = cacheManager.clear();

    res.json({
      success: true,
      clearedEntries,
    });
  } catch (error) {
    logger.error('Cache clear failed', { error });
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to clear cache',
      },
    });
  }
});

/**
 * SSE endpoint for MCP communication
 */
app.get('/sse', async (req: Request, res: Response) => {
  logger.info('SSE connection request', { query: req.query });

  try {
    const server = createMCPServer();
    const transport = new SSEServerTransport('/messages', res);

    await server.connect(transport);

    logger.info('MCP SSE connection established');

    // Handle client disconnect
    req.on('close', () => {
      logger.info('SSE connection closed');
      server.close().catch((error) => {
        logger.error('Error closing MCP server', { error });
      });
    });
  } catch (error) {
    logger.error('SSE connection failed', { error });
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to establish SSE connection',
      },
    });
  }
});

/**
 * POST endpoint for messages (required by SSE transport)
 */
app.post('/messages', async (req: Request, res: Response) => {
  logger.debug('Message received', { body: req.body });
  res.status(200).send();
});

/**
 * Root endpoint
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'die-mcp-server',
    version: '1.0.0',
    description: 'Design Intelligence Engine - Webpage to Component Analyzer',
    endpoints: {
      sse: '/sse',
      health: '/health',
      ollamaHealth: '/health/ollama',
      modelsHealth: '/health/models',
      cacheStats: '/cache/stats',
      cacheClear: '/cache/clear (POST)',
    },
  });
});

/**
 * Error handler
 */
app.use((error: Error, req: Request, res: Response, next: Function) => {
  logger.error('Express error', { error, path: req.path });

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: error.message,
    },
  });
});

/**
 * Start server
 */
function startServer(): void {
  app.listen(PORT, () => {
    logger.info(`DIE MCP Server listening on port ${PORT}`, {
      port: PORT,
      env: process.env.NODE_ENV || 'development',
    });
    logger.info('Server endpoints available:', {
      sse: `http://localhost:${PORT}/sse`,
      health: `http://localhost:${PORT}/health`,
    });
  });
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export { app, startServer };
