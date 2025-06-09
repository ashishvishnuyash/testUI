'use server'

const Agent_URL = process.env.Agent_URL

const secrat_key = process.env.Secrat_Key || "0p1MxWQ3CGRfCdHyyObNPt4ie6UHdupv"
const STOCK_API_ENDPOINT = Agent_URL + '/get_report';

export async function StockMarketData(query: string | undefined): Promise<string> {
  if (!query) {
    console.error("[StockMarketData] Received undefined or empty query");
    return "⚠️ Error: No query was provided for the stock market data.";
  }
  
  // console.log(`[StockMarketData] Sending query: "${query}"`);
  
  // ─── Match Postman's exact configuration ──────────────────────────────
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("X-API-Key", secrat_key);
  // myHeaders.append("Accept", "application/json");
  
  const raw = JSON.stringify({
    "query": query
  });

  const requestOptions: RequestInit = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
    // Add Node.js specific options
    keepalive: true,
  };

  try {
    // console.log(`[StockMarketData] Fetching from ${STOCK_API_ENDPOINT}`);
    
    // Add retry logic since network can be unstable
    const maxRetries = 3;
    let lastError: Error = new Error("No attempts made yet");
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // console.log(`[StockMarketData] Attempt ${attempt}/${maxRetries}`);
        
        const res = await fetch(STOCK_API_ENDPOINT, requestOptions);

        if (!res.ok) {
          const errorText = await res.text();
          console.error(`[StockMarketData] Error response: ${errorText}`);
          throw new Error(`HTTP ${res.status} – ${res.statusText}: ${errorText}`);
        }

        // Get response as text first (like Postman), then parse
        const responseText = await res.text();
        // console.log(`[StockMarketData] Raw response: ${responseText}`);
        
        // Try to parse as JSON
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.warn("[StockMarketData] Response is not valid JSON, returning as text");
          return responseText;
        }
        
        if (!data.report) {
          console.warn("[StockMarketData] Response missing 'report' field:", data);
          return responseText; // Return the raw response if format is unexpected
        }
        
        // console.log(`[StockMarketData] Success on attempt ${attempt}`);
        return data.report;
        
      } catch (err: any) {
        lastError = err;
        console.error(`[StockMarketData] Attempt ${attempt} failed:`, err.message);
        
        // Wait before retrying
        if (attempt < maxRetries) {
          const delay = 1000 * attempt; // 1s, 2s, 3s
          // console.log(`[StockMarketData] Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
    
  } catch (err: any) {
    console.error("Stock-API error:", err);
    
    // More specific error handling
    if (err.code === 'UND_ERR_SOCKET') {
      return `⚠️ Network connection error. The stock API server may be temporarily unavailable. Please try again in a moment.`;
    }
    
    if (err.message?.includes('fetch failed')) {
      return `⚠️ Failed to connect to stock API server at ${STOCK_API_ENDPOINT}. Please check your internet connection and try again.`;
    }
    
    return `⚠️ Could not fetch market data: ${err.message ?? "unknown error"}. Server: ${STOCK_API_ENDPOINT}`;
  }
}
export default StockMarketData;