# Expo Documentation MCP Server

This is a Model Context Protocol (MCP) server for Expo documentation. It provides AI assistants with access to up-to-date Expo documentation, including the API reference, guides, and tutorials.

## What is MCP?

The Model Context Protocol (MCP) is a standard for providing AI models with access to external data and services. This server implements an MCP endpoint that allows AI agents to query Expo documentation.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- OpenAI API key (for embeddings)

### Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd expo-docs-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Copy `.env.example` to `.env` and add your OpenAI API key:
```bash
cp .env.example .env
```

Edit the `.env` file to add your OpenAI API key.

### Building the Documentation Index

Before starting the server, you need to build the documentation index:

```bash
npm run build-index
```

This will process the Expo documentation in the `docs-source` directory and create a vector store for semantic search.

### Starting the Server

Start the server:
```bash
npm start
```

For development mode with automatic reloading:
```bash
npm run dev
```

The server will start on the port specified in your `.env` file (default: 3000).

### Testing the Server

You can test if the server is functioning correctly by running:

```bash
npm test
```

This will check if the server is running and test a sample query.

### Updating the Documentation

To update the documentation to the latest version from the Expo GitHub repository:

```bash
npm run update-docs
```

This will pull the latest changes from the Expo repository and rebuild the index.

## API Endpoints

### `/query` (POST)

Query the Expo documentation.

**Request Body:**
```json
{
  "query": "How do I use the Image component in Expo?",
  "maxResults": 5
}
```

**Response:**
```json
{
  "context": [
    {
      "id": "docs/api/image.md",
      "content": "# Image\n\nA React component for displaying different types of images...",
      "metadata": {
        "source": "expo-repository",
        "path": "/path/to/docs/api/image.md",
        "type": "markdown",
        "title": "Image",
        "url": "https://github.com/expo/expo/blob/main/docs/api/image.md"
      }
    }
  ]
}
```

### `/health` (GET)

Check if the server is running.

**Response:**
```json
{
  "status": "ok",
  "message": "Expo Documentation MCP Server is running"
}
```

## Integrating with AI Assistants

To use this MCP server with AI assistants like Claude or GPT, you'll need to configure the assistant to use the MCP endpoint. The specific configuration depends on the AI platform you're using.

### Example: Using with Claude

1. Configure the MCP endpoint in your Claude developer settings
2. Point to your server's URL (e.g., `http://your-server.com/query`)
3. Use the provided `mcp-config.json` file to define the tool's capabilities

## License

[MIT](LICENSE)
