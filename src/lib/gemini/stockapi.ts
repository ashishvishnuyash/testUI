'use server'

const Agent_URL = process.env.Agent_URL

const secrat_key = process.env.Secrat_Key || "0p1MxWQ3CGRfCdHyyObNPt4ie6UHdupv"
const STOCK_API_ENDPOINT = Agent_URL;

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
        
        const res = await fetch(STOCK_API_ENDPOINT + '/get_report', requestOptions);

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
          console.error(`[StockMarketData] Failed to parse JSON: ${parseError}`);
          return responseText; // Return raw text if JSON parsing fails
        }

        // FastAPI returns JSON like { "report": "..." }
        const report = data?.report || data?.response || responseText;
        return report;
        
      } catch (error) {
        lastError = error as Error;
        console.error(`[StockMarketData] Attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    throw lastError;
    
  } catch (err: any) {
    console.error("Stock-API error:", err);
    return `⚠️ Could not fetch market data (${err.message ?? "unknown error"}).`;
  }
}

export async function PineScripGeneretor(query: string | undefined): Promise<string> {
  if (!query) {
    console.error("[PineScripGeneretor] Received undefined or empty query");
    return "⚠️ Error: No query was provided for Pine Script generation.";
  }
  
  // console.log(`[PineScripGeneretor] Sending query: "${query}"`);
  
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("X-API-Key", secrat_key);
  
  const raw = JSON.stringify({
    "query": query
  });

  const requestOptions: RequestInit = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
    keepalive: true,
  };

  try {
    const maxRetries = 3;
    let lastError: Error = new Error("No attempts made yet");
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(STOCK_API_ENDPOINT + '/generate_pine_script', requestOptions);

        if (!res.ok) {
          const errorText = await res.text();
          console.error(`[PineScripGeneretor] Error response: ${errorText}`);
          throw new Error(`HTTP ${res.status} – ${res.statusText}: ${errorText}`);
        }

        const responseText = await res.text();
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error(`[PineScripGeneretor] Failed to parse JSON: ${parseError}`);
          return responseText;
        }

        const report = data?.report || data?.response || responseText;
        return report;
        
      } catch (error) {
        lastError = error as Error;
        console.error(`[PineScripGeneretor] Attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    throw lastError;
    
  } catch (err: any) {
    console.error("Pine Script API error:", err);
    return `⚠️ Could not generate Pine Script (${err.message ?? "unknown error"}).`;
  }
}

export async function IntradayStockAnalysis(query: string | undefined): Promise<string> {
  if (!query) {
    console.error("[IntradayStockAnalysis] Received undefined or empty query");
    return "⚠️ Error: No query was provided for intraday stock analysis.";
  }
  
  // console.log(`[IntradayStockAnalysis] Sending query: "${query}"`);
  
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("X-API-Key", secrat_key);
  const raw = JSON.stringify({
    "query": query
  });
  const requestOptions: RequestInit = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
    keepalive: true,
  };

  try {
    const maxRetries = 3;
    let lastError: Error = new Error("No attempts made yet");
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(STOCK_API_ENDPOINT + '/intraday_stock_analysis', requestOptions);

        if (!res.ok) {
          const errorText = await res.text();
          console.error(`[IntradayStockAnalysis] Error response: ${errorText}`);
          throw new Error(`HTTP ${res.status} – ${res.statusText}: ${errorText}`);
        }

        const responseText = await res.text();
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error(`[IntradayStockAnalysis] Failed to parse JSON: ${parseError}`);
          return responseText;
        }

        const report = data?.report || data?.response || responseText;
        return report;
        
      } catch (error) {
        lastError = error as Error;
        console.error(`[IntradayStockAnalysis] Attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    throw lastError;
    
  } catch (err: any) {
    console.error("IntradayStockAnalysis ", err);
    return "⚠️ Could not generate intraday stock analysis (" + (err.message ?? "unknown error") + ").";
  }
}

export async function PythonCodeGenerator(query: string | undefined): Promise<string> {
  if (!query) {
    console.error("[PythonCodeGenerator] Received undefined or empty query");
    return "⚠️ Error: No query was provided for Python code generation.";
  }
  
  // console.log(`[PythonCodeGenerator] Sending query: "${query}"`);
  
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("X-API-Key", secrat_key);
  
  const raw = JSON.stringify({
    "query": query
  });

  const requestOptions: RequestInit = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
    keepalive: true,
  };

  try {
    const maxRetries = 3;
    let lastError: Error = new Error("No attempts made yet");
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(STOCK_API_ENDPOINT + '/generate_python_code', requestOptions);

        if (!res.ok) {
          const errorText = await res.text();
          console.error(`[PythonCodeGenerator] Error response: ${errorText}`);
          throw new Error(`HTTP ${res.status} – ${res.statusText}: ${errorText}`);
        }

        const responseText = await res.text();
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error(`[PythonCodeGenerator] Failed to parse JSON: ${parseError}`);
          return responseText;
        }

        const report = data?.report || data?.response || responseText;
        return report;
        
      } catch (error) {
        lastError = error as Error;
        console.error(`[PythonCodeGenerator] Attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    throw lastError;
    
  } catch (err: any) {
    console.error("Python Code Generator error:", err);
    return `⚠️ Could not generate Python code (${err.message ?? "unknown error"}).`;
  }
}


export async function StockMarketQAndA(query: string | undefined): Promise<string> {
  if (!query) {
    console.error("[StockMarketQAndA] Received undefined or empty query");
    return "⚠️ Error: No query was provided for stock market Q&A.";
  }
  
  // console.log(`[StockMarketQAndA] Sending query: "${query}"`); 
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("X-API-Key", secrat_key);
  
  const raw = JSON.stringify({
    "query": query
  });

  const requestOptions: RequestInit = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
    keepalive: true,
  };

  try {
    const maxRetries = 3;
    let lastError: Error = new Error("No attempts made yet");

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(STOCK_API_ENDPOINT + '/stock_market_qa', requestOptions);

        if (!res.ok) {
          const errorText = await res.text();
          console.error(`[StockMarketQAndA] Error response: ${errorText}`);
          throw new Error(`HTTP ${res.status} – ${res.statusText}: ${errorText}`);
        }

        const responseText = await res.text();

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error(`[StockMarketQAndA] Failed to parse JSON: ${parseError}`);
          return responseText;
        }

        const report = data?.report || data?.response || responseText;
        return report;

      } catch (error) {
        lastError = error as Error;
        console.error(`[StockMarketQAndA] Attempt ${attempt} failed:`, error);

        if (attempt === maxRetries) {
          throw lastError;
        }

        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw lastError;

  } catch (err: any) {
    console.error("Stock Market Q&A error:", err);
    return `⚠️ Could not generate stock market Q&A (${err.message ?? "unknown error"}).`;
  }
}