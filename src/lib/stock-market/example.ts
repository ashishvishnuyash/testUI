import {
  getCompleteStockInformation,
  getMarketSummaryUpdate,
  getMarketMoversUpdate
} from './market-data';

async function main() {
  console.log("--- Fetching Complete Stock Information for AAPL ---");
  const appleStockInfo = await getCompleteStockInformation("AAPL");
  if (appleStockInfo) {
    console.log("Symbol:", appleStockInfo.symbol);
    console.log("Current Price:", appleStockInfo.quote?.regularMarketPrice);
    console.log("Company Name:", appleStockInfo.quote?.longName || appleStockInfo.priceData?.longName || appleStockInfo.quote?.shortName);
    console.log("Industry:", appleStockInfo.assetProfile?.industry);
    // console.log("Full Apple Info:", JSON.stringify(appleStockInfo, null, 2)); // For full details
  } else {
    console.log("Could not fetch AAPL stock info.");
  }

  console.log("\n--- Fetching Market Summary (US) ---");
  const usMarketSummary = await getMarketSummaryUpdate("US");
  if (usMarketSummary) {
    console.log("Region:", usMarketSummary.region);
    console.log("Timestamp:", usMarketSummary.timestamp.toISOString());
    console.log(
      "Trending Symbols (first 3):",
      usMarketSummary.trendingSymbols.slice(0, 3).map(t => t.symbol)
    );
    console.log(
      "Major Indices:",
      usMarketSummary.majorIndices.map(i => ({
        name: i.longName || i.shortName,
        price: i.regularMarketPrice,
        change: i.regularMarketChangePercent?.toFixed(2) + "%",
      }))
    );
  } else {
    console.log("Could not fetch US market summary.");
  }

  console.log("\n--- Fetching Market Movers (US) ---");
  const usMarketMovers = await getMarketMoversUpdate("US", 3); // Top 3
  if (usMarketMovers) {
    console.log("Region:", usMarketMovers.region);
    console.log("Timestamp:", usMarketMovers.timestamp.toISOString());
    console.log(
      "Top Gainers:",
      usMarketMovers.gainers.map(g => ({
        symbol: g.symbol,
        price: g.regularMarketPrice,
        change: g.regularMarketChangePercent?.toFixed(2) + "%",
      }))
    );
    console.log(
      "Top Losers:",
      usMarketMovers.losers.map(l => ({
        symbol: l.symbol,
        price: l.regularMarketPrice,
        change: l.regularMarketChangePercent?.toFixed(2) + "%",
      }))
    );
    console.log(
      "Most Active:",
      usMarketMovers.mostActive.map(a => ({
        symbol: a.symbol,
        price: a.regularMarketPrice,
        volume: a.regularMarketVolume,
      }))
    );
  } else {
    console.log("Could not fetch US market movers.");
  }

  // Example for a different region
  console.log("\n--- Fetching Market Summary (GB) ---");
  const gbMarketSummary = await getMarketSummaryUpdate("GB", ["^FTSE", "^FTMC"]); // FTSE 100, FTSE 250
  if (gbMarketSummary) {
    console.log("Region:", gbMarketSummary.region);
    console.log("Timestamp:", gbMarketSummary.timestamp.toISOString());
    console.log(
      "Trending Symbols (first 3):",
      gbMarketSummary.trendingSymbols.slice(0, 3).map(t => t.symbol)
    );
  } else {
    console.log("Could not fetch GB market summary.");
  }
}

// Run the main function
main().catch(console.error);
