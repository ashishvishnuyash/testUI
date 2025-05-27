"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePineScriptTool = generatePineScriptTool;
var generative_ai_1 = require("@google/generative-ai");
// import  as yf from 'yahoo-finance2';
var yahoo_finance2_1 = require("yahoo-finance2");
// Load environment variables. Ensure this is called once at your application's entry point
// or before calling this function for the first time.
// If your main app already calls dotenv.config(), you can remove or comment the line below.
// --- Configuration ---
var API_KEY = "AIzaSyAe0__ZZUWn6tBb__wfI8tffMmCDwLCeeU";
// Check API key immediately
if (!API_KEY) {
    console.error("FATAL: GEMINI_API_KEY not found in environment variables. AI generation will fail.");
    // In a production app, you might exit or throw here. For a tool,
    // we'll let the function return an error result.
}
// Initialize the Gemini client (do this once)
// Initialize only if API_KEY is present to avoid crashing on startup
var genAI = API_KEY ? new generative_ai_1.GoogleGenerativeAI(API_KEY) : null;
// Choose a model
// Initialize model only if genAI client was successfully initialized
var model = genAI ? genAI.getGenerativeModel({ model: "gemini-2.0-flash" }) : null; // Use a suitable model
// --- Helper Functions ---
function fetchHistoricalData(ticker, period1, period2) {
    return __awaiter(this, void 0, void 0, function () {
        var results, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!ticker || !period1 || !period2) {
                        console.warn("fetchHistoricalData called with missing parameters.");
                        return [2 /*return*/, null]; // Require all params
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    console.log("Fetching data for ".concat(ticker, " from ").concat(period1, " to ").concat(period2));
                    return [4 /*yield*/, yahoo_finance2_1.default.historical(ticker, {
                            period1: period1, // 'YYYY-MM-DD'
                            period2: period2, // 'YYYY-MM-DD'
                        })];
                case 2:
                    results = _a.sent();
                    console.log("Fetched ".concat(results.length, " historical data points."));
                    return [2 /*return*/, results];
                case 3:
                    error_1 = _a.sent();
                    console.error("Error fetching historical data for ".concat(ticker, ":"), error_1.message || error_1);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function fetchNews(ticker_1) {
    return __awaiter(this, arguments, void 0, function (ticker, limit) {
        var result, news, error_2;
        var _a;
        if (limit === void 0) { limit = 5; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!ticker) {
                        console.warn("fetchNews called with missing ticker.");
                        return [2 /*return*/, null];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    console.log("Fetching news for ".concat(ticker));
                    return [4 /*yield*/, yahoo_finance2_1.default.search(ticker)];
                case 2:
                    result = _b.sent();
                    news = ((_a = result.news) === null || _a === void 0 ? void 0 : _a.slice(0, limit).map(function (article) { return (__assign(__assign({}, article), { providerPublishTime: article.providerPublishTime.getTime() })); })) || [];
                    console.log("Fetched ".concat(news.length, " news articles."));
                    return [2 /*return*/, news];
                case 3:
                    error_2 = _b.sent();
                    console.error("Error fetching news for ".concat(ticker, ":"), error_2.message || error_2);
                    // Yahoo Finance search can sometimes fail for various reasons (invalid ticker, etc.)
                    // Return empty news list or null to signal failure
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function createDataSummary(history, news) {
    var summary = "";
    if (history && history.length > 0) {
        // Ensure history is sorted by date in case the library doesn't guarantee it
        var sortedHistory = history.sort(function (a, b) { return a.date.getTime() - b.date.getTime(); });
        var firstData = sortedHistory[0];
        var lastData = sortedHistory[sortedHistory.length - 1];
        var highPrice = Math.max.apply(Math, sortedHistory.map(function (d) { return d.high; }));
        var lowPrice = Math.min.apply(Math, sortedHistory.map(function (d) { return d.low; }));
        summary += "Historical Data Summary (".concat(sortedHistory.length, " data points from ").concat(firstData.date.toISOString().split('T')[0], " to ").concat(lastData.date.toISOString().split('T')[0], "):\n");
        summary += "- Start Close: ".concat(firstData.close.toFixed(2), "\n");
        summary += "- End Close: ".concat(lastData.close.toFixed(2), "\n");
        summary += "- Period High: ".concat(highPrice.toFixed(2), "\n");
        summary += "- Period Low: ".concat(lowPrice.toFixed(2), "\n");
        summary += "- Recent Volume: ".concat(lastData.volume, "\n");
        // Add simple trend indication
        if (lastData.close > firstData.close * 1.05 && sortedHistory.length > 10) { // Check over a reasonable number of bars
            summary += "- Observed Trend: Strong Uptrend\n";
        }
        else if (lastData.close < firstData.close * 0.95 && sortedHistory.length > 10) { // Check over a reasonable number of bars
            summary += "- Observed Trend: Strong Downtrend\n";
        }
        else {
            summary += "- Observed Trend: Sideways/Moderate\n";
        }
        // Consider adding volatility, recent range, etc.
    }
    else {
        summary += "Historical data could not be fetched or was insufficient for the period.\n";
    }
    if (news && news.length > 0) {
        summary += "\nRecent News Headlines (".concat(news.length, " articles):\n");
        news.forEach(function (article) {
            // Limit title length to keep summary concise for the prompt
            var title = article.title.length > 100 ? article.title.substring(0, 97) + '...' : article.title;
            summary += "- ".concat(title, " (").concat(article.publisher, ")\n");
        });
    }
    else {
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
function generatePineScriptTool(description, ticker, period1, period2) {
    return __awaiter(this, void 0, void 0, function () {
        var dataSummary, useData, history_1, news, prompt, result, response, text, pineScriptCode, looksLikePineScript, isErrorComment, errorMessage, error_3, errorMessage;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!API_KEY || !genAI || !model) {
                        return [2 /*return*/, { success: false, error: "AI service is not initialized. Check GEMINI_API_KEY environment variable." }];
                    }
                    if (!description || typeof description !== 'string' || description.trim().length === 0) {
                        return [2 /*return*/, { success: false, error: 'Description is required and must be a non-empty string.' }];
                    }
                    dataSummary = "";
                    useData = typeof ticker === 'string' && ticker.trim().length > 0 &&
                        typeof period1 === 'string' && period1.trim().length > 0 &&
                        typeof period2 === 'string' && period2.trim().length > 0;
                    if (!useData) return [3 /*break*/, 3];
                    console.log("Attempting to fetch data for ".concat(ticker, " from ").concat(period1, " to ").concat(period2));
                    return [4 /*yield*/, fetchHistoricalData(ticker.trim(), period1.trim(), period2.trim())];
                case 1:
                    history_1 = _c.sent();
                    return [4 /*yield*/, fetchNews(ticker.trim(), 5)];
                case 2:
                    news = _c.sent();
                    dataSummary = createDataSummary(history_1, news);
                    if (!dataSummary.includes("Historical data") && !dataSummary.includes("Recent news")) {
                        console.warn("Data summary is unexpectedly empty after fetch and creation.");
                        // Decide if you want to proceed without summary or return an error
                        dataSummary = ""; // Reset if empty, so it's not included in prompt
                    }
                    else {
                        console.log("Data Summary generated:\n", dataSummary);
                    }
                    return [3 /*break*/, 4];
                case 3:
                    console.log("Generating script without historical data context (ticker/dates not provided or incomplete).");
                    _c.label = 4;
                case 4:
                    prompt = "\nYou are a Pine Script coding expert for TradingView. Your task is to translate a natural language description of a trading strategy or indicator into functional Pine Script code (version 5 preferred).\n\nAdhere to these strict rules for the output:\n1.  Generate *only* the Pine Script code. Do NOT include any explanations, introductory or concluding sentences, markdown formatting (like ```pine` or ```), or any extra text outside the Pine Script code itself.\n2.  Ensure the code is syntactically correct Pine Script v5.\n3.  Include the `//@version=5` directive at the very beginning of the script.\n4.  Include an `indicator()` or `strategy()` declaration with a descriptive title derived from the description.\n5.  Use appropriate plot(), buy(), sell(), strategy.entry(), strategy.close() calls based on the description.\n6.  Add comments *within the code* using `//` to explain complex parts or logic, but do not explain the code *outside* of the script.\n7.  If the description mentions parameters (like periods, sources, thresholds), include them as input variables using the `input` function, making them configurable for the user within TradingView settings. Name inputs clearly.\n8.  If the description is ambiguous, very complex, impossible to translate, or clearly not a request for Pine Script (e.g., \"write me a poem\"), return a single-line Pine Script comment explaining that the request could not be fulfilled, like `// Could not generate script for this request.` - still follow the \"code only\" rule where the comment *is* the entire output.\n\nHere is the description for the Pine Script:\n\"".concat(description.trim(), "\"\n");
                    // Add data summary to the prompt if provided and not empty
                    if (dataSummary) {
                        prompt += "\n\nConsider the following summary of historical data and recent news for the asset when generating the script. This information might suggest certain types of indicators, parameters, or logic (e.g., favor trend-following if the summary indicates an uptrend, or use volatility indicators if volatility is mentioned in news). Do NOT hardcode specific *price values* found in the summary. Focus on the *general conditions or trends* suggested by the data summary to influence the Pine Script *logic*:\n---\n".concat(dataSummary, "\n---\n");
                    }
                    // Add a clear marker for the start of the code, reinforcing the output format rule
                    // This often helps the AI start the code immediately
                    prompt += "\n//@version=5\n"; // Explicitly request the version directive here as well
                    _c.label = 5;
                case 5:
                    _c.trys.push([5, 8, , 9]);
                    console.log("Calling Gemini API...");
                    return [4 /*yield*/, model.generateContent(prompt)];
                case 6:
                    result = _c.sent();
                    return [4 /*yield*/, result.response];
                case 7:
                    response = _c.sent();
                    text = response.text();
                    pineScriptCode = text ? text.trim() : "";
                    // Attempt to remove common AI formatting mistakes (markdown code blocks)
                    // These regex are more robust than simple startsWith/endsWith
                    pineScriptCode = pineScriptCode.replace(/^```(?:pine)?\s*/, '').replace(/\s*```$/, '').trim();
                    looksLikePineScript = pineScriptCode.length > 20 && // Check minimum length
                        (pineScriptCode.includes("indicator(") ||
                            pineScriptCode.includes("strategy(") ||
                            pineScriptCode.includes("plot("));
                    isErrorComment = pineScriptCode.startsWith("//") && pineScriptCode.length < 100 && !pineScriptCode.includes('\n');
                    if (looksLikePineScript || isErrorComment) {
                        console.log("Successfully generated response (basic validation passed).");
                        return [2 /*return*/, { success: true, pineScript: pineScriptCode }];
                    }
                    else {
                        console.warn("AI response did not pass basic Pine Script validation:", pineScriptCode.substring(0, 500));
                        errorMessage = "AI did not return valid Pine Script code. Response snippet: \"".concat(pineScriptCode.substring(0, 200), "...\"");
                        return [2 /*return*/, { success: false, error: errorMessage }];
                    }
                    return [3 /*break*/, 9];
                case 8:
                    error_3 = _c.sent();
                    console.error("Error during Pine Script generation:", error_3.message || error_3);
                    errorMessage = "An error occurred during script generation.";
                    if ((_b = (_a = error_3.response) === null || _a === void 0 ? void 0 : _a.error) === null || _b === void 0 ? void 0 : _b.message) {
                        console.error("Gemini API Error Details:", error_3.response.error.message);
                        errorMessage = "Gemini API Error: ".concat(error_3.response.error.message);
                    }
                    else if (error_3.message) {
                        errorMessage = "Generation Error: ".concat(error_3.message);
                    }
                    return [2 /*return*/, { success: false, error: errorMessage }];
                case 9: return [2 /*return*/];
            }
        });
    });
}
function exampleBotHandler(userQuery, params) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Processing request: \"".concat(userQuery, "\" with params:"), params);
                    return [4 /*yield*/, generatePineScriptTool(userQuery, params === null || params === void 0 ? void 0 : params.ticker, params === null || params === void 0 ? void 0 : params.period1, params === null || params === void 0 ? void 0 : params.period2)];
                case 1:
                    result = _a.sent();
                    // Handle the result
                    if (result.success) {
                        console.log("\n--- Generated Pine Script ---");
                        console.log(result.pineScript);
                        console.log("-----------------------------\n");
                        // Send result.pineScript back to the user
                    }
                    else {
                        console.error("\n--- Script Generation Failed ---");
                        console.error("Error:", result.error);
                        console.error("------------------------------\n");
                        // Send result.error back to the user
                    }
                    return [2 /*return*/];
            }
        });
    });
}
// --- Example Calls ---
// In a real bot, you'd parse the user's message to get the query and parameters
// exampleBotHandler("a simple 14-period RSI indicator");
exampleBotHandler("buy when price crosses above the 50 day simple moving average", { ticker: "AAPL", period1: "2023-01-01", period2: "2024-01-01" });
// exampleBotHandler("strategy to sell when news mentions trade war for TSLA", { ticker: "TSLA", period1: "2024-01-01", period2: new Date().toISOString().split('T')[0] });
// exampleBotHandler("tell me a joke"); // Should return an error comment
