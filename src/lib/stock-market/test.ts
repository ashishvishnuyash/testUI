import yahooFinance from 'yahoo-finance2';
import { getCompleteStockInformation } from './market-data';
import { StockDetails, MarketSummary, MarketMovers } from './types';

/**
 * Test script for Yahoo Finance data retrieval
 * Run with: npx ts-node src/lib/stock-market/test.ts
 */
async function runTests() {
  console.log('🔍 Starting Yahoo Finance API tests...\n');

  try {
    // Test 1: Basic Quote
    console.log('Test 1: Fetching basic quote for AAPL');
    const quote = await yahooFinance.quote('AAPL');
    console.log('Basic Quote Result:', JSON.stringify(quote, null, 2));
    console.log('✅ Basic quote test completed\n');

    // Test 2: Historical Data
    console.log('Test 2: Fetching historical data for MSFT (last 10 days)');
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 10);
    
    const historicalData = await yahooFinance.historical('MSFT', {
      period1: startDate,
      period2: endDate,
      interval: '1d'
    });
    console.log(`Historical Data: Retrieved ${historicalData.length} records`);
    console.log('Sample record:', JSON.stringify(historicalData[0], null, 2));
    console.log('✅ Historical data test completed\n');

    // Test 3: Market Summary
    console.log('Test 3: Fetching market summary');
    const marketSummary = await yahooFinance.quoteSummary('^GSPC', {
      modules: ['price', 'summaryDetail']
    });
    console.log('Market Summary:', JSON.stringify(marketSummary, null, 2));
    console.log('✅ Market summary test completed\n');

    // Test 4: Search for Symbols
    console.log('Test 4: Searching for "Tesla"');
    const searchResults = await yahooFinance.search('Tesla');
    console.log('Search Results:', JSON.stringify(searchResults, null, 2));
    console.log('✅ Search test completed\n');

    // Test 5: Using our custom getCompleteStockInformation function
    console.log('Test 5: Using custom getCompleteStockInformation for GOOGL');
    const stockDetails = await getCompleteStockInformation('GOOGL');
    console.log('Complete Stock Information:', JSON.stringify(stockDetails, null, 2));
    console.log('✅ Complete stock information test completed\n');

    // Test 6: Trending Tickers
    console.log('Test 6: Fetching trending tickers');
    const trendingTickers = await yahooFinance.trendingSymbols('US');
    console.log('Trending Tickers:', JSON.stringify(trendingTickers, null, 2));
    console.log('✅ Trending tickers test completed\n');

    console.log('🎉 All tests completed successfully!');
  } catch (error) {
    console.error('❌ Error during tests:', error);
  }
}

// Run the tests
runTests();
