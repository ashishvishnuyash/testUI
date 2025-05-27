import { GoogleGenerativeAI } from '@google/generative-ai';
// import  as yf from 'yahoo-finance2';
import yahooFinance  from 'yahoo-finance2';


// Load environment variables. Ensure this is called once at your application's entry point
// or before calling this function for the first time.
// If your main app already calls dotenv.config(), you can remove or comment the line below.


// --- Configuration ---
const API_KEY = "AIzaSyAe0__ZZUWn6tBb__wfI8tffMmCDwLCeeU";

// Check API key immediately
if (!API_KEY) {
    console.error("FATAL: GEMINI_API_KEY not found in environment variables. AI generation will fail.");
    // In a production app, you might exit or throw here. For a tool,
    // we'll let the function return an error result.
}

// Initialize the Gemini client (do this once)
// Initialize only if API_KEY is present to avoid crashing on startup
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// Choose a model
// Initialize model only if genAI client was successfully initialized
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-2.0-flash" }) : null; // Use a suitable model


// --- Interfaces for Data ---
interface HistoricalData {
    date: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    // *** FIX for Error 1 ***
    // adjClose can be number, null, or undefined according to yf2 types
    adjClose: number | null | undefined;
}

interface NewsArticle {
    uuid: string;
    title: string;
    publisher: string;
    link: string;
    providerPublishTime: number; // Unix timestamp
    type: string;
}

// --- Return Type for the Tool Function ---
interface PineScriptToolResult {
    success: boolean;
    pineScript?: string;
    error?: string;
}

// --- Helper Functions ---

async function fetchHistoricalData(ticker: string, period1: string, period2: string): Promise<HistoricalData[] | null> {
    if (!ticker || !period1 || !period2) {
        console.warn("fetchHistoricalData called with missing parameters.");
        return null; // Require all params
    }
    try {
        console.log(`Fetching data for ${ticker} from ${period1} to ${period2}`);
        // The type assertion here is safer now that HistoricalData interface matches yf2's return type better
        const results = await yahooFinance.historical(ticker, {
            period1: period1, // 'YYYY-MM-DD'
            period2: period2, // 'YYYY-MM-DD'
        }) as HistoricalData[]; // Assert type here
        console.log(`Fetched ${results.length} historical data points.`);
        return results;
    } catch (error: any) {
        console.error(`Error fetching historical data for ${ticker}:`, error.message || error);
        return null;
    }
}

async function fetchNews(ticker: string, limit: number = 5): Promise<NewsArticle[] | null> {
    if (!ticker) {
        console.warn("fetchNews called with missing ticker.");
        return null;
    }
    try {
        console.log(`Fetching news for ${ticker}`);
        // *** FIX for Error 2 ***
        // Use yf.search() for news/search results, not yf.searchQuotes()
        const result = await yahooFinance.search(ticker);
        const news = result.news?.slice(0, limit).map(article => ({
            ...article,
            providerPublishTime: article.providerPublishTime.getTime()
        })) || [];
        console.log(`Fetched ${news.length} news articles.`);
        return news;
    } catch (error: any) {
        console.error(`Error fetching news for ${ticker}:`, error.message || error);
        // Yahoo Finance search can sometimes fail for various reasons (invalid ticker, etc.)
        // Return empty news list or null to signal failure
        return null;
    }
}
function createDataSummary(history: HistoricalData[] | null, news: NewsArticle[] | null): string {
    let summary = "";

    if (history && history.length > 0) {
        // Ensure history is sorted by date in case the library doesn't guarantee it
        const sortedHistory = history.sort((a, b) => a.date.getTime() - b.date.getTime());

        const firstData = sortedHistory[0];
        const lastData = sortedHistory[sortedHistory.length - 1];
        const highPrice = Math.max(...sortedHistory.map(d => d.high));
        const lowPrice = Math.min(...sortedHistory.map(d => d.low));

        summary += `Historical Data Summary (${sortedHistory.length} data points from ${firstData.date.toISOString().split('T')[0]} to ${lastData.date.toISOString().split('T')[0]}):\n`;
        summary += `- Start Close: ${firstData.close.toFixed(2)}\n`;
        summary += `- End Close: ${lastData.close.toFixed(2)}\n`;
        summary += `- Period High: ${highPrice.toFixed(2)}\n`;
        summary += `- Period Low: ${lowPrice.toFixed(2)}\n`;
        summary += `- Recent Volume: ${lastData.volume}\n`;

        // Add simple trend indication
        if (lastData.close > firstData.close * 1.05 && sortedHistory.length > 10) { // Check over a reasonable number of bars
            summary += `- Observed Trend: Strong Uptrend\n`;
        } else if (lastData.close < firstData.close * 0.95 && sortedHistory.length > 10) { // Check over a reasonable number of bars
            summary += `- Observed Trend: Strong Downtrend\n`;
        } else {
            summary += `- Observed Trend: Sideways/Moderate\n`;
        }
         // Consider adding volatility, recent range, etc.
    } else {
        summary += "Historical data could not be fetched or was insufficient for the period.\n";
    }

    if (news && news.length > 0) {
        summary += `\nRecent News Headlines (${news.length} articles):\n`;
        news.forEach(article => {
            // Limit title length to keep summary concise for the prompt
            const title = article.title.length > 100 ? article.title.substring(0, 97) + '...' : article.title;
            summary += `- ${title} (${article.publisher})\n`;
        });
    } else {
        summary += "\nRecent news could not be fetched or was empty.\n";
    }

    return summary.trim(); // Trim trailing whitespace
}


// --- The Main Tool Function ---

/**
 * Generates Pine Script code based on a natural language description,
 * optionally incorporating historical data and news for context.
 *
 * @param description - Natural language description of the desired Pine Script strategy or indicator. (Required)
 * @param ticker - Stock ticker symbol (e.g., "AAPL"). Providing this enables data fetching. (Optional)
 * @param period1 - Start date for historical data in 'YYYY-MM-DD' format. (Required if ticker is provided)
 * @param period2 - End date for historical data in 'YYYY-MM-DD' format. (Required if ticker is provided)
 * @returns A Promise resolving to an object containing success status and the generated script or error message.
 */
export async function generatePineScriptTool(
    description: string,
    ticker?: string,
    period1?: string,
    period2?: string
): Promise<PineScriptToolResult> {

    if (!API_KEY || !genAI || !model) {
        return { success: false, error: "AI service is not initialized. Check GEMINI_API_KEY environment variable." };
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
        return { success: false, error: 'Description is required and must be a non-empty string.' };
    }

    let dataSummary = "";
    // Check if data fetching parameters are sufficiently provided
    const useData = typeof ticker === 'string' && ticker.trim().length > 0 &&
                    typeof period1 === 'string' && period1.trim().length > 0 &&
                    typeof period2 === 'string' && period2.trim().length > 0;

    if (useData) {
        console.log(`Attempting to fetch data for ${ticker} from ${period1} to ${period2}`);
        const history = await fetchHistoricalData(ticker!.trim(), period1!.trim(), period2!.trim()); // Use trimmed values
        const news = await fetchNews(ticker!.trim(), 5); // Fetch top 5 news articles
        dataSummary = createDataSummary(history, news);
        if (!dataSummary.includes("Historical data") && !dataSummary.includes("Recent news")) {
            console.warn("Data summary is unexpectedly empty after fetch and creation.");
             // Decide if you want to proceed without summary or return an error
             dataSummary = ""; // Reset if empty, so it's not included in prompt
        } else {
             console.log("Data Summary generated:\n", dataSummary);
        }
    } else {
        console.log("Generating script without historical data context (ticker/dates not provided or incomplete).");
    }

    // --- Construct the Prompt for Gemini ---
    // Keep the prompt robust and clear about desired output format
    let prompt = `
You are a Pine Script coding expert for TradingView. Your task is to translate a natural language description of a trading strategy or indicator into functional Pine Script code (version 5 preferred).

Adhere to these strict rules for the output:
1.  Generate *only* the Pine Script code. Do NOT include any explanations, introductory or concluding sentences, markdown formatting (like \`\`\`pine\` or \`\`\`), or any extra text outside the Pine Script code itself.
2.  Ensure the code is syntactically correct Pine Script v5.
3.  Include the \`//@version=5\` directive at the very beginning of the script.
4.  Include an \`indicator()\` or \`strategy()\` declaration with a descriptive title derived from the description.
5.  Use appropriate plot(), buy(), sell(), strategy.entry(), strategy.close() calls based on the description.
6.  Add comments *within the code* using \`//\` to explain complex parts or logic, but do not explain the code *outside* of the script.
7.  If the description mentions parameters (like periods, sources, thresholds), include them as input variables using the \`input\` function, making them configurable for the user within TradingView settings. Name inputs clearly.
8.  If the description is ambiguous, very complex, impossible to translate, or clearly not a request for Pine Script (e.g., "write me a poem"), return a single-line Pine Script comment explaining that the request could not be fulfilled, like \`// Could not generate script for this request.\` - still follow the "code only" rule where the comment *is* the entire output.

Here is the description for the Pine Script:
"${description.trim()}"
`;

    // Add data summary to the prompt if provided and not empty
    if (dataSummary) {
        prompt += `\n\nConsider the following summary of historical data and recent news for the asset when generating the script. This information might suggest certain types of indicators, parameters, or logic (e.g., favor trend-following if the summary indicates an uptrend, or use volatility indicators if volatility is mentioned in news). Do NOT hardcode specific *price values* found in the summary. Focus on the *general conditions or trends* suggested by the data summary to influence the Pine Script *logic*:\n---\n${dataSummary}\n---\n`;
    }

    // Add a clear marker for the start of the code, reinforcing the output format rule
    // This often helps the AI start the code immediately
    prompt += "\n//@version=5\n"; // Explicitly request the version directive here as well

    // --- Call the AI Model ---
    try {
        console.log("Calling Gemini API...");
        const result = await model.generateContent(prompt);
        const response = await result.response;
        // Using response.text() is generally the simplest for text-only output models like gemini-pro
        const text = response.text();

        // --- Post-processing and Validation ---
        let pineScriptCode = text ? text.trim() : "";

        // Attempt to remove common AI formatting mistakes (markdown code blocks)
        // These regex are more robust than simple startsWith/endsWith
        pineScriptCode = pineScriptCode.replace(/^```(?:pine)?\s*/, '').replace(/\s*```$/, '').trim();


        // Basic structural validation - check for key Pine Script elements
        const looksLikePineScript = pineScriptCode.length > 20 && // Check minimum length
                                     (pineScriptCode.includes("indicator(") ||
                                      pineScriptCode.includes("strategy(") ||
                                      pineScriptCode.includes("plot(")); // Should contain at least one plot/indicator/strategy

        // Also check for the single-line error comment case
        const isErrorComment = pineScriptCode.startsWith("//") && pineScriptCode.length < 100 && !pineScriptCode.includes('\n'); // Short single line comment

        if (looksLikePineScript || isErrorComment) {
             console.log("Successfully generated response (basic validation passed).");
             return { success: true, pineScript: pineScriptCode };
        } else {
            console.warn("AI response did not pass basic Pine Script validation:", pineScriptCode.substring(0, 500));
            // The AI might have returned an unrelated message or failed internally
            const errorMessage = `AI did not return valid Pine Script code. Response snippet: "${pineScriptCode.substring(0, 200)}..."`;
            return { success: false, error: errorMessage };
        }

    } catch (error: any) {
        console.error("Error during Pine Script generation:", error.message || error);
        // Check for specific API error details
        let errorMessage = "An error occurred during script generation.";
        if (error.response?.error?.message) {
            console.error("Gemini API Error Details:", error.response.error.message);
            errorMessage = `Gemini API Error: ${error.response.error.message}`;
        } else if (error.message) {
             errorMessage = `Generation Error: ${error.message}`;
        }
        return { success: false, error: errorMessage };
    }
}

async function exampleBotHandler(userQuery: string, params?: { ticker?: string; period1?: string; period2?: string }) {
     console.log(`Processing request: "${userQuery}" with params:`, params);

    // Call the tool function
    const result = await generatePineScriptTool(
        userQuery,
        params?.ticker,
        params?.period1,
        params?.period2
    );

    // Handle the result
    if (result.success) {
        console.log("\n--- Generated Pine Script ---");
        console.log(result.pineScript);
        console.log("-----------------------------\n");
        // Send result.pineScript back to the user
    } else {
        console.error("\n--- Script Generation Failed ---");
        console.error("Error:", result.error);
        console.error("------------------------------\n");
        // Send result.error back to the user
    }
}
// --- Example Calls ---
// In a real bot, you'd parse the user's message to get the query and parameters
// exampleBotHandler("a simple 14-period RSI indicator");
// exampleBotHandler("buy when price crosses above the 50 day simple moving average", { ticker: "AAPL", period1: "2023-01-01", period2: "2024-01-01" });
// exampleBotHandler("strategy to sell when news mentions trade war for TSLA", { ticker: "TSLA", period1: "2024-01-01", period2: new Date().toISOString().split('T')[0] });
exampleBotHandler("tell me a joke"); // Should return an error comment
