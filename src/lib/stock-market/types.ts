// Basic quote type with essential fields
export interface Quote {
  symbol: string;
  shortName?: string | null;
  longName?: string | null;
  regularMarketPrice?: number | null;
  regularMarketChange?: number | null;
  regularMarketChangePercent?: number | null;
  regularMarketVolume?: number | null;
  marketCap?: number | null;
  currency?: string | null;
  maxAge?: number;
}

// Summary result types
export interface QuoteSummaryResult {
  summaryProfile?: {
    address1?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    phone?: string;
    website?: string;
    industry?: string;
    sector?: string;
    description?: string;
  };
  financialData?: {
    currentPrice?: number;
    targetHighPrice?: number;
    targetLowPrice?: number;
    targetMeanPrice?: number;
    recommendationMean?: number;
    recommendationKey?: string;
    grossProfits?: number;
    totalRevenue?: number;
    operatingCashflow?: number;
  };
  recommendationTrend?: {
    trend?: {
      period: string;
      strongBuy: number;
      buy: number;
      hold: number;
      sell: number;
      strongSell: number;
    }[];
  };
  earningsHistory?: {
    maxAge: number;
    history: {
      maxAge: number;
      period: string;
      epsActual: number | null;
      epsEstimate: number | null;
      epsDifference: number | null;
      surprisePercent: number | null;
      quarter: Date | null;
    }[];
  };
  price?: {
    regularMarketPrice?: number | null;
    regularMarketChange?: number | null;
    regularMarketChangePercent?: number | null;
    regularMarketVolume?: number | null;
    marketCap?: number | null;
    currency?: string | null;
    shortName?: string | null;
    longName?: string | null;
    maxAge?: number;
  };
  defaultKeyStatistics?: {
    enterpriseValue?: number;
    forwardPE?: number;
    profitMargins?: number;
    beta?: number;
    bookValue?: number;
    priceToBook?: number;
    earningsQuarterlyGrowth?: number;
  };
  calendarEvents?: {
    earnings?: {
      earningsDate?: Date[];
      earningsAverage?: number;
      earningsLow?: number;
      earningsHigh?: number;
    };
  };
  assetProfile?: {
    fullTimeEmployees?: number;
    industry?: string;
    sector?: string;
    description?: string;
  };
}

export interface TrendingSymbol {
  symbol: string;
}

export interface RecommendationsBySymbolResult {
  recommendedSymbols: Array<{
    symbol: string;
    score: number;
  }>;
}

export interface InsightsResult {
  symbol: string;
  instrumentInfo?: {
    keyTechnicals?: {
      support?: number;
      resistance?: number;
      stopLoss?: number;
      provider: string;
    };
    technicalEvents?: {
      sector?: string;
      provider: string;
      shortTermOutlook?: {
        direction?: 'Neutral' | 'Bearish' | 'Bullish';
        score?: number;
        scoreDescription?: string;
      };
      intermediateTermOutlook?: {
        direction?: 'Neutral' | 'Bearish' | 'Bullish';
        score?: number;
        scoreDescription?: string;
      };
      longTermOutlook?: {
        direction?: 'Neutral' | 'Bearish' | 'Bullish';
        score?: number;
        scoreDescription?: string;
      };
    };
    valuation?: {
      description?: string;
      rating?: string;
      targetPrice?: number;
    };
  };
}

export interface StockDetails {
  symbol: string;
  quote?: Quote;
  summaryProfile?: QuoteSummaryResult['summaryProfile'];
  financialData?: QuoteSummaryResult['financialData'];
  recommendationTrend?: QuoteSummaryResult['recommendationTrend'];
  earningsHistory?: QuoteSummaryResult['earningsHistory'];
  priceData?: QuoteSummaryResult['price'];
  keyStatistics?: QuoteSummaryResult['defaultKeyStatistics'];
  calendarEvents?: QuoteSummaryResult['calendarEvents'];
  assetProfile?: QuoteSummaryResult['assetProfile'];
  recommendations?: RecommendationsBySymbolResult;
  insights?: InsightsResult;
}

export interface MarketSummary {
  region: string;
  timestamp: Date;
  trendingSymbols: TrendingSymbol[];
  majorIndices: Quote[];
}

export interface MarketMovers {
  region: string;
  timestamp: Date;
  gainers: Quote[];
  losers: Quote[];
  mostActive: Quote[];
}
