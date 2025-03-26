require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const serverless = require('serverless-http');
const cheerio = require('cheerio');
const { OpenAIClient, AzureKeyCredential } = require('@azure/openai');
const bodyParser = require('body-parser');

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

// Set up OpenAI configuration
const endpoint = process.env.OPENAI_ENDPOINT || 'https://api.openai.com/v1';
const apiVersion = process.env.OPENAI_API_VERSION || '2023-05-15';
const deploymentName = process.env.OPENAI_DEPLOYMENT_NAME || 'gpt-3.5-turbo';

// Determine if we're using Azure or standard OpenAI
const isAzure = endpoint.includes('azure');

let client;
if (isAzure) {
  client = new OpenAIClient(endpoint, new AzureKeyCredential(process.env.OPENAI_API_KEY), { apiVersion });
} else {
  // For standard OpenAI, we'll use the axios client directly
}

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

// Load knowledge base files
const knowledgeBasePath = path.resolve(process.cwd(), 'knowledge_base');
let knowledgeBase = [];

try {
  if (fs.existsSync(knowledgeBasePath)) {
    const files = fs.readdirSync(knowledgeBasePath);
    files.forEach(file => {
      if (file.endsWith('.txt') || file.endsWith('.md')) {
        const content = fs.readFileSync(path.join(knowledgeBasePath, file), 'utf8');
        knowledgeBase.push({
          filename: file,
          content: content
        });
        console.log(`Loaded ${file} from knowledge base directory`);
      }
    });
    console.log(`Loaded ${knowledgeBase.length} files into knowledge base`);
  } else {
    console.log('Knowledge base directory not found');
  }
} catch (error) {
  console.error('Error loading knowledge base:', error);
}

// Define the chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('Received message:', message);
    console.log('Received history length:', history ? history.length : 0);
    
    // Format conversation history for the AI
    const conversation = [
      {
        role: 'system',
        content: `You are DompeAssist, an IT support chatbot for Dompé Pharmaceuticals. 
Use a friendly, helpful tone and provide specific, actionable advice for IT issues.
If you don't know the answer, say so rather than making something up.
For questions about Dompé as a company, its products, or its business, use the information provided in the knowledge base.

IMPORTANT CONTEXT HANDLING:
- Always acknowledge the user's previous messages when they refer to past conversation
- When answering follow-up questions, reference what was discussed earlier
- Maintain conversational continuity by remembering details the user has shared

IMPORTANT FORMATTING INSTRUCTIONS:
- Format your responses using Markdown for better readability
- Use headings (###) for sections
- Use bullet points (*) for lists
- Use bold (**text**) for emphasis
- Use code blocks (\`\`\`) for technical instructions or commands
- Use numbered lists (1. 2. 3.) for step-by-step instructions
- Include formatting in your responses to make them more readable

Current date: ${new Date().toLocaleDateString()}`
      }
    ];

    // Add the knowledge base context
    if (knowledgeBase.length > 0) {
      let knowledgeContext = `Here is the full knowledge base information that you should use to answer questions:\n\n`;
      
      knowledgeBase.forEach(doc => {
        knowledgeContext += `### BEGIN ${doc.filename} ###\n${doc.content}\n### END ${doc.filename} ###\n\n`;
      });
      
      conversation.push({
        role: 'system',
        content: knowledgeContext
      });
    }

    // Add conversation history
    if (history && Array.isArray(history)) {
      // Log each history message for debugging
      history.forEach((msg, index) => {
        if (msg.role && msg.content) {
          console.log(`History message ${index}: ${msg.role} - ${msg.content.substring(0, 50)}...`);
          conversation.push({
            role: msg.role,
            content: msg.content
          });
        }
      });
    }

    // Add the user's current question
    conversation.push({
      role: 'user',
      content: message
    });

    // Get response from OpenAI
    let response;
    if (isAzure) {
      const result = await client.getChatCompletions(deploymentName, conversation);
      response = result.choices[0].message.content;
    } else {
      const result = await axios.post(`${endpoint}/chat/completions`, {
        model: deploymentName,
        messages: conversation,
        temperature: 0.7,
        max_tokens: 1000
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      response = result.data.choices[0].message.content;
    }

    console.log('AI response:', response);
    res.json({ 
      response
    });
  } catch (error) {
    console.error('Error processing chat request:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Add a health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handle production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(process.cwd(), '../frontend/build');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    console.warn('Frontend build directory not found at', distPath);
  }
}

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// For Vercel serverless deployment
module.exports = app; 