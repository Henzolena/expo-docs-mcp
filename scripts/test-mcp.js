#!/usr/bin/env node

/**
 * Simple test script for the Expo Documentation MCP Server
 * 
 * This script checks if the server is running by querying the health endpoint
 * and tests a simple query to verify the server is functioning properly.
 */

// Use dynamic import for node-fetch to support both ESM and CommonJS
const fetchModule = async () => {
  return (await import('node-fetch')).default;
};

async function testMCPServer() {
  const fetch = await fetchModule();
  console.log('🧪 Testing Expo Documentation MCP Server...');
  
  const serverUrl = process.env.MCP_SERVER_URL || 'http://localhost:3000';
  
  try {
    // Test health endpoint
    console.log('\n1. 🩺 Checking server health...');
    const healthResponse = await fetch(`${serverUrl}/health`);
    
    if (!healthResponse.ok) {
      throw new Error(`Health check failed with status: ${healthResponse.status}`);
    }
    
    const healthData = await healthResponse.json();
    console.log('✅ Server health check: ', healthData);
    
    // Test query endpoint
    console.log('\n2. 🔍 Testing query capabilities...');
    const queryResponse = await fetch(`${serverUrl}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'How do I install Expo?' })
    });
    
    if (!queryResponse.ok) {
      throw new Error(`Query test failed with status: ${queryResponse.status}`);
    }
    
    const queryData = await queryResponse.json();
    console.log(`✅ Query successful! Received ${queryData.context?.length || 0} context items.`);
    
    // Print sample context if available
    if (queryData.context && queryData.context.length > 0) {
      const sample = queryData.context[0];
      console.log('\n📄 Sample content:');
      console.log(`ID: ${sample.id}`);
      console.log(`Source: ${sample.metadata.source}`);
      if (sample.metadata.title) console.log(`Title: ${sample.metadata.title}`);
      console.log(`Preview: ${sample.content.substring(0, 100)}...`);
    }
    
    console.log('\n✅ All tests passed! MCP server is functioning correctly.');
    
  } catch (error) {
    console.error('\n❌ Error testing MCP server:', error.message);
    console.error('Make sure the server is running with: npm start');
    process.exit(1);
  }
}

testMCPServer();
