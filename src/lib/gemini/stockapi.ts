'use server'
const STOCK_API_ENDPOINT = 'http://localhost:8000/get_report';

export async function StockMarketData(query: string | undefined): Promise<string> {
  if (!query) {
    console.error("[StockMarketData] Received undefined or empty query");
    return "⚠️ Error: No query was provided for the stock market data.";
  }
  
  console.log(`[StockMarketData] Sending query: "${query}"`);
  
  // ─── Build request options ──────────────────────────────
  const requestOptions: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      "query": query
    }),
    redirect: "follow",
  };

  try {
    console.log(`[StockMarketData] Fetching from ${STOCK_API_ENDPOINT}`);
    const res = await fetch(STOCK_API_ENDPOINT, requestOptions);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[StockMarketData] Error response: ${errorText}`);
      throw new Error(`HTTP ${res.status} – ${res.statusText}: ${errorText}`);
    }

    // FastAPI returns JSON like { "report": "..." }
    const data = await res.json();
    
    if (!data.report) {
      console.warn("[StockMarketData] Response missing 'report' field:", data);
      return "Received data from market API but in unexpected format.";
    }
    
    return data.report;
  } catch (err: any) {
    console.error("Stock-API error:", err);
    return `⚠️ Could not fetch market data (${err.message ?? "unknown error"}). Make sure the FastAPI server is running at ${STOCK_API_ENDPOINT}.`;
  }
}

export default StockMarketData;