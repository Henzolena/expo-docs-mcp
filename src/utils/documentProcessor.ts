import fs from 'fs';
import path from 'path';
import recursive from 'recursive-readdir';
import MarkdownIt from 'markdown-it';
import * as cheerio from 'cheerio';
import { Document } from '../types';

const md = new MarkdownIt();

/**
 * Process all documentation files from the Expo repository
 */
export async function processDocuments(repoPath: string): Promise<Document[]> {
  console.log(`Processing documentation files from ${repoPath}...`);
  
  // Find all the relevant files
  const files = await recursive(repoPath, [
    // Exclude files/directories that don't contain useful documentation
    'node_modules',
    '.git',
    'build',
    'dist',
    (file: string, stats: { isFile: () => boolean }) => {
      // Exclude non-documentation files
      const ext = path.extname(file).toLowerCase();
      if (stats.isFile() && !['.md', '.mdx', '.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
        return true;
      }
      return false;
    }
  ]);
  
  console.log(`Found ${files.length} files to process`);
  
  // Process each file based on its type
  const documents: Document[] = [];
  
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const relativePath = path.relative(repoPath, file);
    
    try {
      let content = fs.readFileSync(file, 'utf8');
      
      // Process the file content based on its type
      if (ext === '.md' || ext === '.mdx') {
        documents.push(...processMarkdownFile(content, file, relativePath));
      } else if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
        documents.push(...processSourceFile(content, file, relativePath));
      }
    } catch (error) {
      console.error(`Error processing file ${file}:`, error);
    }
  }
  
  console.log(`Processed ${documents.length} documents`);
  return documents;
}

/**
 * Process a markdown file into one or more documents
 */
function processMarkdownFile(content: string, filePath: string, relativePath: string): Document[] {
  const documents: Document[] = [];
  
  // Parse the markdown content
  const html = md.render(content);
  const $ = cheerio.load(html);
  
  // Extract the title from the first heading if available
  const title = $('h1').first().text() || path.basename(filePath, path.extname(filePath));
  
  // Remove code blocks for cleaner extraction
  $('pre').remove();
  
  // Get the text content
  const textContent = $.root().text().trim();
  
  // Create a document from the markdown file
  documents.push({
    id: relativePath,
    content: textContent,
    metadata: {
      source: 'expo-repository',
      path: filePath,
      type: 'markdown',
      title,
      url: `https://github.com/expo/expo/blob/main/${relativePath}`,
    }
  });
  
  return documents;
}

/**
 * Process a source code file into one or more documents
 */
function processSourceFile(content: string, filePath: string, relativePath: string): Document[] {
  const documents: Document[] = [];
  
  // Extract JSDoc comments and significant code blocks
  const docComments = extractDocComments(content);
  
  if (docComments.length > 0) {
    // Create a document for each significant JSDoc comment block
    docComments.forEach((comment, index) => {
      documents.push({
        id: `${relativePath}-comment-${index}`,
        content: comment,
        metadata: {
          source: 'expo-repository',
          path: filePath,
          type: 'source-code-comment',
          title: `Documentation from ${path.basename(filePath)}`,
          url: `https://github.com/expo/expo/blob/main/${relativePath}`,
        }
      });
    });
  } else {
    // If no doc comments, create a document from the file itself
    documents.push({
      id: relativePath,
      content: extractCodeSummary(content),
      metadata: {
        source: 'expo-repository',
        path: filePath,
        type: 'source-code',
        title: path.basename(filePath),
        url: `https://github.com/expo/expo/blob/main/${relativePath}`,
      }
    });
  }
  
  return documents;
}

/**
 * Extract JSDoc style comments from source code
 */
function extractDocComments(content: string): string[] {
  const commentRegex = /\/\*\*[\s\S]*?\*\//g;
  const comments = content.match(commentRegex) || [];
  
  // Clean up the comments
  return comments
    .map(comment => {
      // Remove the comment markers and asterisks
      return comment
        .replace(/\/\*\*|\*\//g, '')
        .replace(/^\s*\*\s?/gm, '')
        .trim();
    })
    .filter(comment => comment.length > 30); // Only keep substantial comments
}

/**
 * Extract a summary of the code content
 */
function extractCodeSummary(content: string): string {
  // Remove imports and exports for summary
  let summary = content
    .replace(/import\s+.*?from\s+['"].*?['"];?/g, '')
    .replace(/export\s+(default\s+)?/g, '')
    .trim();
  
  // If the summary is too long, truncate it
  const maxLength = 5000;
  if (summary.length > maxLength) {
    summary = summary.substring(0, maxLength) + '...';
  }
  
  return summary;
}
