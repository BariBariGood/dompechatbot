require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const serverless = require('serverless-http');
const cheerio = require('cheerio');

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: ['*'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Knowledge base content
const knowledgeBaseContent = `
# Dompé Pharmaceuticals Knowledge Base

## Company Information
- Dompé is an Italian biopharmaceutical company founded in 1853
- The company focuses on primary care, specialty care, and rare disease treatments
- Headquarters are located in Milan, Italy
- Dompé has international operations in the US, Europe, and other regions

## Leadership Information
- CEO: Sergio Dompé
- CIO: Roberto Dall'Omo
- CFO: Maria Rossi
- Head of HR: Franco Bianchi

## IT Services and Support
- The IT support team is available Monday-Friday, 8AM-6PM
- For urgent IT issues outside working hours, call the emergency support line: +39 02 12345678
- Standard IT support email: itsupport@dompe.com
- Ticketing system: https://helpdesk.dompe.internal

## Common IT Policies
- Password must be changed every 90 days
- Minimum password requirements: 12 characters, mix of uppercase, lowercase, numbers, and special characters
- Two-factor authentication is required for remote access
- Company data should never be stored on personal devices
- VPN must be used when connecting to company resources from outside the office

## Software and Tools
- Email: Microsoft Exchange/Outlook
- Productivity: Microsoft Office 365
- Messaging: Microsoft Teams
- Document Management: SharePoint
- ERP System: SAP
- CRM System: Salesforce
- Video Conferencing: Zoom, Microsoft Teams

## Network Information
- Corporate WiFi: "Dompe-Corp" (requires company credentials)
- Guest WiFi: "Dompe-Guest" (password available from reception)
- VPN Service: Cisco AnyConnect

## IT Security
- Report suspicious emails to security@dompe.com
- All laptops must have encryption enabled
- USB devices are restricted on company computers
- Regular security training is mandatory for all employees
`;

// Additional domain-specific information
const dompeInfoContent = `
@dompe_info.txt

# Dompé Farmaceutici S.p.A. Company Information

Founded in 1853 in Milan, Italy, Dompé Farmaceutici S.p.A. is an Italian biopharmaceutical company focused on innovation in areas of primary care, specialty care, and rare diseases.

## Executive Leadership
- CEO: Sergio Dompé
- CIO: Roberto Dall'Omo
- Chief Scientific Officer: Marcello Allegretti
- Chief Commercial Officer: Eriona Gjinukaj

## Global Presence
- Headquarters: Milan, Italy
- R&D Center: L'Aquila, Italy
- US Headquarters: San Francisco, CA
- European Offices: Spain, Germany, France
- Distribution Networks: Over 40 countries worldwide

## Core Business Areas
1. **Primary Care**: Products addressing common health concerns
2. **Specialty Care**: Treatments for specialist medical areas
3. **Rare Diseases**: Focusing on unmet needs in rare conditions
   - Neurotrophic keratitis (NK)
   - Other ophthalmological conditions

## Key Products
- Oxervate® (cenegermin): First-in-class recombinant human nerve growth factor (rhNGF) for neurotrophic keratitis
- Domperidone: Anti-nausea medication
- Okitask®: Pain and fever relief
- Various OTC products for respiratory care

## R&D Focus
- Biotechnology applications in healthcare
- Pharmaceutical research in:
  - Ophthalmology
  - Diabetes
  - Oncology
  - Organ transplantation
  - COVID-19 treatments

## Technology Platforms
- Drug Delivery Systems
- Recombinant Proteins
- Small Molecules
- Monoclonal Antibodies

## Corporate Values
- Patient-centric approach
- Ethical business practices
- Sustainable development
- Scientific excellence
- Innovation culture

## Social Responsibility Initiatives
- Dompé Foundation for medical research
- Educational programs in healthcare
- Support for healthcare infrastructure in developing regions
- Environmental sustainability commitments

## Recent Achievements
- FDA approval of Oxervate in 2018
- EMA approval for multiple products
- Expansion into US market
- Strategic partnerships with research institutions
`;

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

// Get system prompt
function getSystemPrompt() {
  // Use embedded knowledge base
  let prompt = `You are DompeAssist, an AI assistant for Dompé Pharmaceuticals employees, specializing in IT support.

IMPORTANT CONTEXT:
- All questions from users should be assumed to be about Dompé Pharmaceuticals, an Italian pharmaceutical company, not any other company or entity.
- Dompé Pharmaceuticals is focused on developing innovative treatments for primary care, specialty care, and rare diseases.
- If users ask about "Dompé's mission" or similar questions, they are referring to Dompé Pharmaceuticals' mission, not any other organization.
- When the user's question is vague or could use more context, ASK FOLLOW-UP QUESTIONS to clarify what they need before giving a final answer.
- Don't perform web searches until you fully understand what the user is asking for.

KNOWLEDGE BASE:
${knowledgeBaseContent}

${dompeInfoContent}

CAPABILITIES:
- Provide information about Dompé's IT policies, systems, and common troubleshooting
- Answer questions about basic software and hardware issues
- Assist with account management, password resets, and access requests
- When you don't know the answer, you can search for information on the web
- Format your responses in a clear, structured manner
- Ask follow-up questions when needed to better understand user needs

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
8. When a query is vague, ask a follow-up question to clarify the user's needs

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
    
    // Check if this is likely a question that requires clarification
    const clarificationCheckResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        ...messages,
        { 
          role: "system", 
          content: `Analyze if this user query is vague or would benefit from follow-up questions before answering. 

Pay special attention to IT support or tech troubleshooting queries like "fix my computer", "help with my account", etc. which almost ALWAYS need clarification about specific symptoms or issues.

Examples of vague queries requiring clarification:
- "How do I fix my computer?" (Need to know specific symptoms)
- "I can't connect" (Need to know what they're trying to connect to)
- "How do I reset my password?" (Need to know which system)
- "I need help with my account" (Need to know which account and what issue)
- "My computer is slow" (Need more details about when it's slow)

If the question is clear and specific enough to answer directly, respond with ONLY 'CLEAR'. 
If the question would benefit from follow-up questions to better understand what the user needs, respond with ONLY 'NEEDS_CLARIFICATION'.` 
        }
      ],
      temperature: 0,
      max_tokens: 20
    });
    
    const needsClarification = clarificationCheckResponse.choices[0].message.content.toUpperCase().includes('NEEDS_CLARIFICATION');
    
    // If we need clarification, don't do a search yet
    if (needsClarification) {
      const clarificationResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          ...messages,
          { 
            role: "system", 
            content: `The user's query needs clarification. Instead of giving a complete answer now, ask follow-up questions to better understand what they're looking for.

For tech support questions, ask about:
- Specific symptoms or error messages they're seeing
- When the problem started
- What they've already tried
- The device/software version they're using

For example, if they ask "how do I fix my computer", respond with something like:
"I'd be happy to help you fix your computer. To provide the most relevant assistance, could you please tell me:
1. What specific issues are you experiencing? (slow performance, won't turn on, error messages, etc.)
2. When did you first notice this problem?
3. What have you already tried to resolve it?"

Keep your response conversational but focused on getting the specific information you need to provide a better answer.` 
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      });
      
      return res.json({
        response: clarificationResponse.choices[0].message.content,
        searchResult: null
      });
    }
    
    // Perform web search if needed
    let searchResult = null;
    if (needsSearch) {
      searchResult = await performWebSearch(message);
    }
    
    // Generate full response to user question
    const completionMessages = [...messages];
    
    // If we have search results, include them
    if (searchResult) {
      completionMessages.push({ 
        role: "system", 
        content: `Here is some additional information from a web search that might help answer the question:
        
Source: ${searchResult.source}
Abstract: ${searchResult.abstractText}
URL: ${searchResult.abstractURL}
Related Topics: ${searchResult.relatedTopics.map(topic => `- ${topic.text} (${topic.url})`).join('\n')}

Incorporate this information naturally in your response if relevant, and include the source URL.`
      });
    }
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: completionMessages,
      temperature: 0.7,
    });
    
    res.json({
      response: completion.choices[0].message.content,
      searchResult: searchResult
    });
    
  } catch (error) {
    console.error('Error handling chat:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export the serverless handler
module.exports = serverless(app); 