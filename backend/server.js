require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 5001;

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to perform a web search using DuckDuckGo API
async function performWebSearch(query) {
  try {
    // Add company context to all queries that don't already mention Dompé
    const searchQuery = query.toLowerCase().includes('dompe') || query.toLowerCase().includes('dompé') ? 
      query : 
      `${query} Dompé Pharmaceuticals`;
    
    console.log(`Performing web search for: "${searchQuery}"`);
    
    // Scrape DuckDuckGo HTML search results (using the HTML-only version)
    const encodedQuery = encodeURIComponent(searchQuery);
    const searchUrl = `https://duckduckgo.com/html/?q=${encodedQuery}`;
    
    console.log(`Fetching results from: ${searchUrl}`);
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    
    if (response.status !== 200) {
      throw new Error(`DuckDuckGo returned status code ${response.status}`);
    }
    
    // Parse HTML
    const $ = cheerio.load(response.data);
    console.log('Successfully loaded HTML from DuckDuckGo');
    
    // Extract search results
    const results = [];
    const resultsContainer = $('#links .result');
    
    console.log(`Found ${resultsContainer.length} results`);
    
    // Extract result details - refining selectors based on our test
    resultsContainer.each((i, element) => {
      if (i >= 4) return; // Limit to first 4 results
      
      const titleElement = $(element).find('.result__a');
      const snippetElement = $(element).find('.result__snippet');
      const urlElement = $(element).find('.result__url');
      
      const title = titleElement.text().trim();
      const snippet = snippetElement.text().trim();
      const url = titleElement.attr('href');
      const displayUrl = urlElement.text().trim();
      
      // Don't add empty results
      if (title && url) {
        results.push({
          text: title,
          snippet: snippet,
          url: url,
          displayUrl: displayUrl
        });
      }
    });
    
    // Log what we found
    console.log(`Successfully extracted ${results.length} valid results`);
    
    // If we have no results, fall back to a default response
    if (results.length === 0) {
      console.log('No results found, using fallback');
      return {
        source: 'Web Search',
        abstractText: `Limited information found about "${searchQuery}". You may want to try a more specific query.`,
        abstractURL: null,
        relatedTopics: [
          {
            text: "Visit Dompé's official website",
            url: "https://www.dompe.com/en"
          },
          { 
            text: "Search for this topic on Google", 
            url: "https://www.google.com/search?q=" + encodeURIComponent(searchQuery) 
          }
        ]
      };
    }
    
    // Format the results for the chatbot
    return {
      source: 'Web Search',
      abstractText: results[0].snippet || `Search results for "${searchQuery}"`,
      abstractURL: results[0].url,
      relatedTopics: results.map(result => ({
        text: result.text,
        url: result.url
      }))
    };
    
  } catch (error) {
    console.error('Error performing web search:', error.message);
    console.error(error.stack);
    
    // Return a structured error response with only verified working links
    return {
      source: 'error',
      abstractText: `Error searching for "${query}". This might be due to connectivity issues or rate limiting. ${error.message}`,
      abstractURL: null,
      relatedTopics: [
        {
          text: "Visit Dompé's official website",
          url: "https://www.dompe.com/en"
        },
        { 
          text: "Search for this topic on Google", 
          url: "https://www.google.com/search?q=" + encodeURIComponent(query + " Dompé Pharmaceuticals") 
        }
      ]
    };
  }
}

// Load the knowledge base
function loadKnowledgeBase() {
  try {
    let knowledgeBase = '';
    
    // Load primary knowledge base file - check both in backend directory and project root
    const kbPath = path.join(__dirname, 'knowledge_base.txt');
    const kbPathAlt = path.join(__dirname, '..', 'knowledge_base', 'knowledge_base.txt');
    
    if (fs.existsSync(kbPath)) {
      knowledgeBase += fs.readFileSync(kbPath, 'utf8') + '\n\n';
      console.log('Loaded knowledge_base.txt from backend directory');
    } else if (fs.existsSync(kbPathAlt)) {
      knowledgeBase += fs.readFileSync(kbPathAlt, 'utf8') + '\n\n';
      console.log('Loaded knowledge_base.txt from project root knowledge_base directory');
    } else {
      console.log('Primary knowledge base file (knowledge_base.txt) not found in any location.');
    }
    
    // Load additional Dompé info file - check both locations
    const dompeInfoPath = path.join(__dirname, 'dompe_info.txt');
    const dompeInfoPathAlt = path.join(__dirname, '..', 'knowledge_base', 'dompe_info.txt');
    
    if (fs.existsSync(dompeInfoPath)) {
      // Add the @dompe_info.txt annotation before the content
      knowledgeBase += '@dompe_info.txt\n';
      knowledgeBase += fs.readFileSync(dompeInfoPath, 'utf8');
      console.log('Successfully loaded @dompe_info.txt from backend directory.');
    } else if (fs.existsSync(dompeInfoPathAlt)) {
      // Add the @dompe_info.txt annotation before the content
      knowledgeBase += '@dompe_info.txt\n';
      knowledgeBase += fs.readFileSync(dompeInfoPathAlt, 'utf8');
      console.log('Successfully loaded @dompe_info.txt from project root knowledge_base directory.');
    } else {
      console.log('Additional information file (dompe_info.txt) not found in any location.');
    }
    
    if (!knowledgeBase.trim()) {
      console.log('No knowledge base content found. Using system prompt without knowledge base.');
      return '';
    }
    
    return knowledgeBase;
  } catch (error) {
    console.error('Error loading knowledge base:', error);
    return '';
  }
}

// Get system prompt
function getSystemPrompt() {
  // Load knowledge base content
  const knowledgeBaseContent = loadKnowledgeBase();
  
  let prompt = `You are DompeAssist, an AI assistant for Dompé Pharmaceuticals employees, specializing in IT support.

IMPORTANT CONTEXT:
- All questions from users should be assumed to be about Dompé Pharmaceuticals, an Italian pharmaceutical company, not any other company or entity.
- Dompé Pharmaceuticals is focused on developing innovative treatments for primary care, specialty care, and rare diseases.
- If users ask about "Dompé's mission" or similar questions, they are referring to Dompé Pharmaceuticals' mission, not any other organization.

KNOWLEDGE BASE:
${knowledgeBaseContent}

CAPABILITIES:
- Provide information about Dompé's IT policies, systems, and common troubleshooting
- Answer questions about basic software and hardware issues
- Assist with account management, password resets, and access requests
- When you don't know the answer, you can search for information on the web
- Format your responses in a clear, structured manner

LIMITATIONS:
- You cannot access Dompé's internal systems or private data
- You cannot create tickets or directly reset passwords (but can explain how to)
- You should avoid giving medical or pharmaceutical advice
- You must acknowledge when information might be incomplete or when official support is needed

RESPONSE GUIDELINES:
1. Be professional, friendly, and concise
2. For complex issues, suggest contacting the IT department directly
3. When answering based on web search results, incorporate the information naturally while indicating the source
4. If search results are limited or not helpful, acknowledge this and suggest alternatives
5. Always prioritize official Dompé policies and procedures when known
6. For IT troubleshooting, provide step-by-step instructions when possible
7. Use bullet points and clear formatting for better readability

Remember that you're representing Dompé as its IT support assistant.`;

  return prompt;
}

// Handle chat requests
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    
    // First, check if we already know the answer without searching
    const messages = [
      { role: "system", content: getSystemPrompt() },
      ...history,
      { role: "user", content: message }
    ];
    
    // Ask OpenAI if it knows the answer with confidence based on knowledge base
    const initialCheckResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        ...messages,
        { 
          role: "system", 
          content: "Before responding to the user, carefully check if the information requested is present in the KNOWLEDGE BASE section I provided above. If the information is clearly provided in the knowledge base, respond with ONLY 'YES'. If the information is not in the knowledge base or you're uncertain, respond with ONLY 'NO'." 
        }
      ],
      temperature: 0,
      max_tokens: 10
    });
    
    const needsSearch = initialCheckResponse.choices[0].message.content.toUpperCase().includes('NO');
    console.log(`Needs search for "${message}": ${needsSearch}`);
    
    let searchResult = null;
    
    // Only search if we don't know the answer
    if (needsSearch) {
      searchResult = await performWebSearch(message);
      
      // If we have search results, add them to the messages
      if (searchResult) {
        // Convert search result to a string representation for the AI
        let searchInfo = `I performed a web search for this query and found the following information:\n\n`;
        
        if (searchResult.abstractText) {
          searchInfo += `${searchResult.abstractText}\n\n`;
        }
        
        if (searchResult.relatedTopics && searchResult.relatedTopics.length > 0) {
          searchInfo += `Related topics:\n`;
          searchResult.relatedTopics.forEach(topic => {
            searchInfo += `- ${topic.text}\n`;
          });
        }
        
        searchInfo += `\nSource: ${searchResult.source}`;
        
        // Add search information as a system message
        messages.push({ 
          role: "system", 
          content: searchInfo 
        });
      }
    }
    
    // Generate the chat response
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000
    });
    
    const response = completion.choices[0].message.content;
    
    // Send back both the response and search results
    res.json({ 
      response, 
      searchResult: needsSearch ? searchResult : null 
    });
    
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 