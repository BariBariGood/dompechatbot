const axios = require('axios');
const cheerio = require('cheerio');

// Test function to scrape DuckDuckGo results
async function testDuckDuckGoScrape(query) {
  try {
    const encodedQuery = encodeURIComponent(query);
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
    
    console.log('Successfully loaded HTML from DuckDuckGo');
    
    // Save the HTML response to a file for inspection
    const fs = require('fs');
    fs.writeFileSync('duckduckgo-response.html', response.data);
    console.log('Saved raw HTML response to duckduckgo-response.html');
    
    // Parse HTML
    const $ = cheerio.load(response.data);
    
    // Extract search results
    const results = [];
    const resultsContainer = $('#links .result');
    
    console.log(`Found ${resultsContainer.length} results`);
    
    // Extract result details
    resultsContainer.each((i, element) => {
      if (i >= 10) return; // Limit to first 10 results
      
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
    console.log(JSON.stringify(results, null, 2));
    
    return results;
  } catch (error) {
    console.error('Error performing web search:', error.message);
    console.error(error.stack);
    return null;
  }
}

// Run the test with a query
const query = process.argv[2] || "Dompé Pharmaceuticals";
console.log(`Testing DuckDuckGo scraping with query: "${query}"`);
testDuckDuckGoScrape(query); 