import yahooFinance from 'yahoo-finance2';
import type { StockDetails, MarketSummary, MarketMovers } from './types';

/**
 * Fetches comprehensive information for a given stock symbol.
 * @param symbol - The stock symbol (e.g., "AAPL", "MSFT").
 * @returns A Promise resolving to StockDetails or null if an error occurs.
 */
export async function getCompleteStockInformation(
  symbol: string
): Promise<StockDetails | null> {
  try {
    type ModuleType = 'summaryProfile' | 'financialData' | 'recommendationTrend' | 'earningsHistory' | 
      'price' | 'defaultKeyStatistics' | 'calendarEvents' | 'assetProfile';

    const queryOptions = {
      modules: [
        'summaryProfile',
        'financialData',
        'recommendationTrend',
        'earningsHistory',
        'price',
        'defaultKeyStatistics',
        'calendarEvents',
        'assetProfile',
      ] as ModuleType[],
    };

    // Fetch data in parallel
    const [quoteData, summaryData, recommendationsData, insightsData] =
      await Promise.all([
        yahooFinance.quote(symbol).catch(err => {
          console.warn(`Failed to fetch quote for ${symbol}:`, err.message);
          return undefined;
        }),
        yahooFinance.quoteSummary(symbol, queryOptions).catch(err => {
          console.warn(`Failed to fetch quote summary for ${symbol}:`, err.message);
          return undefined;
        }),
        yahooFinance.recommendationsBySymbol(symbol).catch(err => {
          console.warn(`Failed to fetch recommendations for ${symbol}:`, err.message);
          return undefined;
        }),
        yahooFinance.insights(symbol).catch(err => {
          console.warn(`Failed to fetch insights for ${symbol}:`, err.message);
          return undefined;
        }),
      ]);

    if (!quoteData && !summaryData) {
      console.error(`No data could be fetched for symbol ${symbol}`);
      return null;
    }

    const stockDetails: StockDetails = {
      symbol: quoteData?.symbol || summaryData?.price?.symbol || symbol.toUpperCase(),
      quote: quoteData,
      summaryProfile: summaryData?.summaryProfile,
      financialData: summaryData?.financialData,
      recommendationTrend: summaryData?.recommendationTrend,
      earningsHistory: summaryData?.earningsHistory,
      priceData: summaryData?.price,
      keyStatistics: summaryData?.defaultKeyStatistics,
      calendarEvents: summaryData?.calendarEvents,
      // companyOfficers is not available in the current version
      // companyOfficers: summaryData?.companyOfficers,
      assetProfile: summaryData?.assetProfile,
      recommendations: recommendationsData,
      insights: insightsData,
    };

    return stockDetails;
  } catch (error: any) {
    console.error(
      `Error fetching complete stock information for ${symbol}:`,
      error.message
    );
    return null;
  }
}

/**
 * Fetches a summary of the stock market.
 * @param region - The market region (e.g., "US", "GB", "HK"). Defaults to "US".
 * @param majorIndexSymbols - Array of symbols for major indices. Defaults to US indices.
 * @returns A Promise resolving to MarketSummary or null if an error occurs.
 */
export async function getMarketSummaryUpdate(
  region: string = "US",
  majorIndexSymbols: string[] = ["^GSPC", "^IXIC", "^DJI"]
): Promise<MarketSummary | null> {
  try {
    const [trending, ...indexQuotesResults] = await Promise.allSettled([
      yahooFinance.trendingSymbols(region),
      ...majorIndexSymbols.map(symbol => yahooFinance.quote(symbol))
    ]);

    const trendingSymbols = trending.status === 'fulfilled' ? trending.value.quotes : [];
    if (trending.status === 'rejected') {
      console.warn(`Failed to fetch trending symbols for ${region}:`, trending.reason.message);
    }

    const majorIndices = indexQuotesResults
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value);

    return {
      region,
      timestamp: new Date(),
      trendingSymbols,
      majorIndices,
    };
  } catch (error: any) {
    console.error(`Error fetching market summary for ${region}:`, error.message);
    return null;
  }
}

/**
 * Fetches market movers (top gainers, losers, most active).
 * @param region - The market region (e.g., "US", "GB"). Defaults to "US".
 * @param count - Number of results to fetch for each category. Defaults to 5.
 * @returns A Promise resolving to MarketMovers or null if an error occurs.
 */
export async function getMarketMoversUpdate(
  region: string = "US",
  count: number = 5
): Promise<MarketMovers | null> {
  try {
    type ScreenerType = 'day_gainers' | 'day_losers' | 'most_actives';
    
    const screenerIds: Record<string, ScreenerType> = {
      gainers: 'day_gainers',
      losers: 'day_losers',
      mostActive: 'most_actives',
    };

    const [gainersResult, losersResult, mostActiveResult] = await Promise.allSettled([
      yahooFinance.screener({ count, scrIds: screenerIds.gainers }),
      yahooFinance.screener({ count, scrIds: screenerIds.losers }),
      yahooFinance.screener({ count, scrIds: screenerIds.mostActive }),
    ]);

    const getQuotesFromResult = (result: PromiseSettledResult<any>) => {
      if (result.status === 'fulfilled' && result.value.quotes) {
        return result.value.quotes;
      }
      if (result.status === 'rejected') {
        console.warn(`Failed to fetch screener results:`, result.reason.message);
      }
      return [];
    };

    return {
      region,
      timestamp: new Date(),
      gainers: getQuotesFromResult(gainersResult),
      losers: getQuotesFromResult(losersResult),
      mostActive: getQuotesFromResult(mostActiveResult),
    };
  } catch (error: any) {
    console.error(`Error fetching market movers for ${region}:`, error.message);
    return null;
  }
}

