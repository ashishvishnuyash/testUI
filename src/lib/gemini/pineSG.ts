import { GoogleGenerativeAI } from '@google/generative-ai';
// import  as yf from 'yahoo-finance2';
import yahooFinance  from 'yahoo-finance2';

export async function getStockData(stockSymbol: string): Promise<any> {
    // Fetch historical data
    const historicalData = await yahooFinance.historical(stockSymbol, {
        period1: '2023-01-01',
        period2: '2023-12-31',

        interval: '1d'
    });
}