import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path'; // Added path import
import { processQuery } from './utils/queryProcessor';

// Load environment variables
dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

// Middleware
app.use(cors());
// Use an inline require for json middleware
app.use(require('express').json());

// MCP endpoint for querying Expo documentation
app.post('/query', async (req: Request, res: Response) => { // Reverted to imported Request, Response
  const { query, maxResults } = req.body;
  
  if (!query) {
    res.status(400).json({ error: 'Query is required' });
    return; // Ensure void return path
  }
  
  try {
    const result = await processQuery(query, maxResults);
    res.json(result);
  } catch (error: any) {
    console.error('Error processing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Simple health check endpoint
app.get('/health', (_req: Request, res: Response) => { // Reverted to imported Request, Response
  res.json({ status: 'ok', message: 'Expo Documentation MCP Server is running' });
});

// Serve mcp-config.json for discovery
const mcpConfigPath = path.resolve(__dirname, '../mcp-config.json');
let mcpConfigContent: string | null = null;
try {
  mcpConfigContent = fs.readFileSync(mcpConfigPath, 'utf8');
} catch (err) {
  console.error("Error reading mcp-config.json:", err);
}

if (mcpConfigContent) {
  const mcpConfigJson = JSON.parse(mcpConfigContent);
  const serveMcpConfig = (_req: Request, res: Response) => {
    res.json(mcpConfigJson);
  };
  app.get('/', serveMcpConfig);
  app.get('/mcp.json', serveMcpConfig);
  app.get('/.well-known/mcp.json', serveMcpConfig);
  app.get('/mcp-config.json', serveMcpConfig);
  console.log(`Serving mcp-config.json at /, /mcp.json, /.well-known/mcp.json, and /mcp-config.json`);
} else {
  console.warn("mcp-config.json could not be loaded. Server discovery endpoints will not be available.");
}


// Start the server
app.listen(port, () => {
  console.log(`Expo Documentation MCP Server running on port ${port}`);
  
  // Make sure the vector store directory exists
  const vectorStorePath = process.env.VECTOR_STORE_PATH || './data/vector_store';
  if (!fs.existsSync(vectorStorePath)) {
    fs.mkdirSync(vectorStorePath, { recursive: true });
    console.log(`Created vector store directory at ${vectorStorePath}`);
  }
});
