#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting Expo Documentation MCP Server setup...');

// Make sure the Expo repository is cloned
const repoPath = path.resolve(process.cwd(), 'docs-source');
if (!fs.existsSync(repoPath)) {
  console.log('Expo repository not found. Cloning from GitHub...');
  exec('git clone --depth=1 https://github.com/expo/expo.git docs-source', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error cloning repository: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Git stderr: ${stderr}`);
    }
    console.log(`Repository cloned successfully: ${stdout}`);
    buildIndex();
  });
} else {
  console.log('Expo repository already exists.');
  buildIndex();
}

function buildIndex() {
  console.log('Building the documentation index...');
  exec('npm run build-index', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error building index: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Build stderr: ${stderr}`);
    }
    console.log(`Index built successfully: ${stdout}`);
    startServer();
  });
}

function startServer() {
  console.log('Starting the MCP server...');
  exec('npm start', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error starting server: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Server stderr: ${stderr}`);
    }
    console.log(`Server output: ${stdout}`);
  });
}
