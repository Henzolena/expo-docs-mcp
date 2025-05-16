const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Create the express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Create the server and add routes
async function startServer() {
  // Use ts-node to import TypeScript files
  const queryProcessor = require('./utils/queryProcessor');
  const { processQuery } = queryProcessor;

  // MCP /query endpoint
  app.post('/query', async (req, res) => {
    try {
      const { query, maxResults } = req.body;

      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      const result = await processQuery(query, maxResults || 5);
      return res.json(result);
    } catch (error) {
      console.error('Error processing query:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ✅ Add this: /mcp SSE endpoint for Cline
  app.get('/mcp', (req, res) => {
    console.log('GET /mcp – sending tool definition via SSE');

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

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Expo Documentation MCP Server is running' });
  });

  // Start server
  app.listen(port, () => {
    console.log(`✅ Expo Documentation MCP Server running on port ${port}`);

    // Ensure vector store folder exists
    const vectorStorePath = process.env.VECTOR_STORE_PATH || './data/vector_store';
    if (!fs.existsSync(vectorStorePath)) {
      fs.mkdirSync(vectorStorePath, { recursive: true });
      console.log(`📁 Created vector store directory at ${vectorStorePath}`);
    }
  });
}

// Start the server
startServer().catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
