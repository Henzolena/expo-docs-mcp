import express, { Request as ExpressRequest, Response as ExpressResponse } from 'express'; // Aliased imports
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { processQuery } from './utils/queryProcessor';

// Load environment variables
dotenv.config();

const app = express();
const port: number = Number(process.env.PORT) || 3000;

// Middleware
app.use(cors());
app.use(require('express').json()); // Reverted to require('express').json()

// 🔹 POST /query endpoint
app.post('/query', async (req: ExpressRequest, res: ExpressResponse): Promise<void> => { // Used aliased types
  const { query, maxResults }: { query?: string; maxResults?: number } = req.body;

  if (!query) {
    res.status(400).json({ error: 'Query is required' });
    return;
  }

  try {
    const result = await processQuery(query, maxResults || 5);
    res.json(result);
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🔹 GET /health check
app.get('/health', (_req: ExpressRequest, res: ExpressResponse): void => { // Used aliased types
  res.json({ status: 'ok', message: 'Expo Documentation MCP Server is running' });
});

// 🔹 Optional JSON discovery fallback
const mcpConfigPath = path.resolve(__dirname, '../mcp-config.json');
let mcpConfigJson: Record<string, unknown> | null = null;

try {
  const raw = fs.readFileSync(mcpConfigPath, 'utf8');
  mcpConfigJson = JSON.parse(raw);
} catch (err) {
  console.warn('⚠️ mcp-config.json not found or invalid. Static discovery endpoints skipped.');
}

if (mcpConfigJson) {
  const serveJson = (_req: ExpressRequest, res: ExpressResponse): void => { // Added :void return type and braces
    res.json(mcpConfigJson!);
  };
  app.get('/', serveJson);
  app.get('/mcp.json', serveJson);
  app.get('/.well-known/mcp.json', serveJson);
  app.get('/mcp-config.json', serveJson);
  console.log('✅ Serving mcp-config.json at standard discovery paths');
}

// ✅ GET /mcp — Cline-compatible SSE tool definition
app.get('/mcp', (_req: ExpressRequest, res: ExpressResponse): void => { // Used aliased types
  console.log('GET /mcp — streaming tool definition for Cline');

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const tool = {
    schema_version: 'v1',
    name: 'expo-documentation',
    description: 'Provides access to Expo documentation, including API references, guides, and tutorials.',
    authentication: { type: 'none' },
    endpoints: [
      {
        name: 'query',
        description: 'Queries the Expo documentation based on a natural language query.',
        path: '/query',
        method: 'POST',
        request_body: {
          required: true,
          description: 'The query to search for in the Expo documentation.',
          content_type: 'application/json',
          schema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The natural language query to search for in the documentation.'
              },
              maxResults: {
                type: 'integer',
                description: 'The maximum number of results to return. Default is 5.'
              }
            },
            required: ['query']
          }
        },
        response: {
          content_type: 'application/json',
          schema: {
            type: 'object',
            properties: {
              context: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    content: { type: 'string' },
                    metadata: {
                      type: 'object',
                      properties: {
                        source: { type: 'string' },
                        path: { type: 'string' },
                        type: { type: 'string' },
                        title: { type: 'string' },
                        url: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    ]
  };

  res.write(`event: tool\n`);
  res.write(`data: ${JSON.stringify(tool)}\n\n`);
  res.write(`event: end\n`);
  res.write(`data: {}\n\n`);
});

// 🔹 Start the server
app.listen(port, (): void => {
  console.log(`🚀 Expo Documentation MCP Server running on port ${port}`);

  const vectorStorePath: string = process.env.VECTOR_STORE_PATH || './data/vector_store';
  if (!fs.existsSync(vectorStorePath)) {
    fs.mkdirSync(vectorStorePath, { recursive: true });
    console.log(`📁 Created vector store directory at ${vectorStorePath}`);
  }
});
