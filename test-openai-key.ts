// Test script to verify OpenAI API key
import dotenv from 'dotenv';
import { OpenAIEmbeddings } from '@langchain/openai';

// Load environment variables from .env file
dotenv.config();

async function testOpenAIKey() {
  console.log('Testing OpenAI API key...');
  
  // Check if the API key is set
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('Error: OPENAI_API_KEY is not set in your .env file');
    return;
  }
  
  try {
    // Create an instance of OpenAI embeddings
    const embeddings = new OpenAIEmbeddings();
    
    // Try to embed a simple text to test the API key
    const result = await embeddings.embedQuery("Hello world");
    
    console.log('✅ Success! Your OpenAI API key is working correctly.');
    console.log(`Generated embedding with ${result.length} dimensions.`);
    
  } catch (error: any) {
    console.error('❌ Error testing OpenAI API key:');
    console.error(error.message || error);
    
    if (error.message && error.message.includes('API key')) {
      console.error('\nPlease check that your API key is correct and has not expired.');
    }
  }
}

// Run the test
testOpenAIKey();
