// src/yahooFetcher.ts
import fetch from 'node-fetch';
// @ts-ignore
// If using native fetch in Node 18+ with ES Modules:
// import fetch from 'node:fetch';

// --- Define Interfaces for the expected JSON structure ---
interface YahooChartMeta {
    currency: string;
    symbol: string;
    exchangeName: string;
    instrumentType: string;
    firstTradeDate: number;
    regularMarketTime: number;
    gmtoffset: number;
    timezone: string;
    exchangeTimezoneName: string;
    regularMarketPrice: number;
    chartPreviousClose: number;
    previousClose?: number; // Sometimes this is present
    priceHint: number;
    currentTradingPeriod: {
        pre: any; // Define more accurately if needed
        regular: any;
        post: any;
    };
    dataGranularity: string;
    range: string;
    validRanges: string[];
}

interface YahooQuoteIndicators {
    open?: (number | null)[];
    high?: (number | null)[];
    low?: (number | null)[];
    close?: (number | null)[];
    volume?: (number | null)[];
}

interface YahooEventInfo {
    amount?: number; // For dividends
    date: number;
    numerator?: number;   // For splits
    denominator?: number; // For splits
    splitRatio?: string;  // For splits
    type?: string; // e.g., DIVIDEND, SPLIT
}

// Events are keyed by timestamp string
type YahooEventMap = Record<string, YahooEventInfo>;

interface YahooChartEvents {
    dividends?: YahooEventMap;
    splits?: YahooEventMap;
}

interface YahooChartResult {
    meta: YahooChartMeta;
    timestamp?: number[];
    indicators: {
        quote: YahooQuoteIndicators[];
        adjclose?: { adjclose: (number | null)[] }[]; // For adjusted close
    };
    events?: YahooChartEvents;
}

interface YahooChartError {
    code: string;
    description: string;
}

interface YahooFinanceChartResponse {
    chart: {
        result: YahooChartResult[] | null;
        error: YahooChartError | null;
    };
}

// --- Function to fetch and process data ---
async function fetchYahooChartData(
    ticker: string,
    range: string = "1mo",
    interval: string = "1d"
): Promise<void> {
    const baseUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker.toUpperCase()}`;

    const params = new URLSearchParams({
        region: "US",
        lang: "en-US",
        includePrePost: "false",
        interval: interval,
        useYfid: "true",
        range: range,
        events: "div|split|earn",
    });

    const url = `${baseUrl}?${params.toString()}`;

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };

    console.log(`Fetching data for ${ticker} from: ${url}`);

    try {
        const response = await fetch(url, { headers });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error ${response.status}: ${response.statusText}. Body: ${errorText}`);
        }

        const data = await response.json() as YahooFinanceChartResponse;

        if (data.chart.error) {
            console.error("--- Yahoo Finance API Error ---");
            console.error(`Code: ${data.chart.error.code}`);
            console.error(`Description: ${data.chart.error.description}`);
            return;
        }

        if (!data.chart.result || data.chart.result.length === 0) {
            console.error("No chart data found in the response.");
            // console.log(JSON.stringify(data, null, 2)); // Log full response for debugging
            return;
        }

        const chartData = data.chart.result[0];

        // --- Meta Information ---
        const meta = chartData.meta;
        console.log(`\n--- Meta Information for ${meta.symbol} ---`);
        console.log(`Currency: ${meta.currency}`);
        console.log(`Exchange: ${meta.exchangeName}`);
        console.log(`Timezone: ${meta.timezone}`);
        console.log(`Data Granularity: ${meta.dataGranularity}`);
        console.log(`Range: ${meta.range}`);
        console.log(`Regular Market Price: ${meta.regularMarketPrice}`);
        console.log(`Previous Close: ${meta.chartPreviousClose || meta.previousClose || 'N/A'}`);


        // --- Price Data ---
        const timestamps = chartData.timestamp || [];
        const quotes = chartData.indicators.quote[0] || {}; // First item in quote array

        if (timestamps.length > 0) {
            console.log(`\n--- Price Data (first 5 and last 5 records) ---`);
            const priceRecords = timestamps.map((ts, i) => {
                const date = new Date(ts * 1000); // Timestamps are in seconds
                return {
                    Datetime: date.toISOString(),
                    Open: quotes.open?.[i] ?? null,
                    High: quotes.high?.[i] ?? null,
                    Low: quotes.low?.[i] ?? null,
                    Close: quotes.close?.[i] ?? null,
                    Volume: quotes.volume?.[i] ?? null,
                };
            }).filter(record => record.Close !== null); // Filter out entries without close price (can happen for latest interval)


            if (priceRecords.length > 0) {
                console.log("First 5 records:");
                console.table(priceRecords.slice(0, 5));

                if (priceRecords.length > 10) {
                    console.log("\nLast 5 records:");
                    console.table(priceRecords.slice(-5));
                } else if (priceRecords.length > 5) {
                    console.log("\nLast records:");
                    console.table(priceRecords.slice(5));
                }
            } else {
                 console.log("No valid price records to display.");
            }


        } else {
            console.log("No timestamp data found.");
        }

        // --- Events ---
        const events = chartData.events;
        if (events?.dividends) {
            console.log("\n--- Dividends ---");
            Object.entries(events.dividends).forEach(([ts, divInfo]) => {
                console.log(`Date: ${new Date(parseInt(ts) * 1000).toLocaleDateString()}, Amount: ${divInfo.amount}`);
            });
        }
        if (events?.splits) {
            console.log("\n--- Splits ---");
            Object.entries(events.splits).forEach(([ts, splitInfo]) => {
                console.log(`Date: ${new Date(parseInt(ts) * 1000).toLocaleDateString()}, Ratio: ${splitInfo.splitRatio} (${splitInfo.numerator}:${splitInfo.denominator})`);
            });
        }

    } catch (error) {
        console.error("\n--- An error occurred ---");
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error("An unknown error occurred:", error);
        }
    }
}

// --- Example Usage ---
async function main() {
    await fetchYahooChartData("AAPL");
    console.log("\n" + "=".repeat(50) + "\n");
    await fetchYahooChartData("MSFT", "1wk", "1m");
    console.log("\n" + "=".repeat(50) + "\n");
    // await fetchYahooChartData("NONEXISTENTTICKER"); // Example of an error
}

main().catch(console.error);    