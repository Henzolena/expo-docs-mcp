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

  // MCP endpoint
  app.post('/query', async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }
      
      const result = await processQuery(query);
      return res.json(result);
    } catch (error) {
      console.error('Error processing query:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Simple health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Expo Documentation MCP Server is running' });
  });

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
}

// Start the server
startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
