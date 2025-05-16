import { queryVectorStore } from './vectorStore';
import { Document, QueryResult } from '../types';
import { OpenAI } from '@langchain/openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Provides mock documents for testing when vector store or API key is not available
 */
function getMockDocuments(query: string): Document[] {
  const mockData: Record<string, Document[]> = {
    default: [
      {
        id: 'mock-doc-1',
        content: 'Expo is a framework and a platform for universal React applications. It is a set of tools and services built around React Native and native platforms that help you develop, build, deploy, and quickly iterate on iOS, Android, and web apps from the same JavaScript/TypeScript codebase.',
        metadata: {
          source: 'mock-data',
          path: '/introduction/index.md',
          type: 'markdown',
          title: 'Introduction to Expo',
          url: 'https://docs.expo.dev/introduction/overview/'
        }
      },
      {
        id: 'mock-doc-2',
        content: 'To install Expo CLI, run `npm install -g expo-cli` or `yarn global add expo-cli`. To create a new Expo project, run `expo init my-project`. This will create a new project directory with a basic structure.',
        metadata: {
          source: 'mock-data',
          path: '/get-started/installation.md',
          type: 'markdown',
          title: 'Installation',
          url: 'https://docs.expo.dev/get-started/installation/'
        }
      }
    ],
    camera: [
      {
        id: 'mock-doc-camera',
        content: 'The Camera module provides a React component that renders a preview of the device\'s front or back camera. The component is designed to be used with `expo-permissions`, which helps you request device permissions for accessing the camera.',
        metadata: {
          source: 'mock-data',
          path: '/versions/latest/sdk/camera.md',
          type: 'markdown',
          title: 'Camera',
          url: 'https://docs.expo.dev/versions/latest/sdk/camera/'
        }
      }
    ]
  };
  
  // Return camera docs if query mentions camera
  if (query.toLowerCase().includes('camera')) {
    return mockData.camera;
  }
  
  return mockData.default;
}

/**
 * Process a query against the Expo documentation
 */
export async function processQuery(query: string, maxResults: number = 5): Promise<QueryResult> {
  console.log(`Processing query: "${query}"`);
  
  try {
    let documents: Document[] = [];
    
    // Check if we have a valid OpenAI API key - if not, return mock data for testing
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      console.log('No valid OpenAI API key found. Returning mock data for testing.');
      documents = getMockDocuments(query);
    } else {
      // Retrieve relevant documents from the vector store
      documents = await queryVectorStore(query, maxResults);
    }
    
    if (documents.length === 0) {
      // Return only the context array, even if empty, to match the schema.
      // The AI client/agent is responsible for interpreting an empty context.
      return {
        context: []
      };
    }
    
    // Here you could add additional processing such as:
    // 1. Reranking the results
    // 2. Generating a summarized answer
    // 3. Adding citations or links to the original documentation
    
    return {
      context: documents,
      // The MCP server returns the contexts only, and lets the AI agent generate the answer
    };
  } catch (error) {
    console.error('Error processing query:', error);
    throw error;
  }
}
