"use strict";
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
var yahoo_finance2_1 = require("yahoo-finance2");
var market_data_1 = require("./market-data");
/**
 * Test script for Yahoo Finance data retrieval
 * Run with: npx ts-node src/lib/stock-market/test.ts
 */
function runTests() {
    return __awaiter(this, void 0, void 0, function () {
        var quote, endDate, startDate, historicalData, marketSummary, searchResults, stockDetails, trendingTickers, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🔍 Starting Yahoo Finance API tests...\n');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, , 9]);
                    // Test 1: Basic Quote
                    console.log('Test 1: Fetching basic quote for AAPL');
                    return [4 /*yield*/, yahoo_finance2_1.default.quote('AAPL')];
                case 2:
                    quote = _a.sent();
                    console.log('Basic Quote Result:', JSON.stringify(quote, null, 2));
                    console.log('✅ Basic quote test completed\n');
                    // Test 2: Historical Data
                    console.log('Test 2: Fetching historical data for MSFT (last 10 days)');
                    endDate = new Date();
                    startDate = new Date();
                    startDate.setDate(startDate.getDate() - 10);
                    return [4 /*yield*/, yahoo_finance2_1.default.historical('MSFT', {
                            period1: startDate,
                            period2: endDate,
                            interval: '1d'
                        })];
                case 3:
                    historicalData = _a.sent();
                    console.log("Historical Data: Retrieved ".concat(historicalData.length, " records"));
                    console.log('Sample record:', JSON.stringify(historicalData[0], null, 2));
                    console.log('✅ Historical data test completed\n');
                    // Test 3: Market Summary
                    console.log('Test 3: Fetching market summary');
                    return [4 /*yield*/, yahoo_finance2_1.default.quoteSummary('^GSPC', {
                            modules: ['price', 'summaryDetail']
                        })];
                case 4:
                    marketSummary = _a.sent();
                    console.log('Market Summary:', JSON.stringify(marketSummary, null, 2));
                    console.log('✅ Market summary test completed\n');
                    // Test 4: Search for Symbols
                    console.log('Test 4: Searching for "Tesla"');
                    return [4 /*yield*/, yahoo_finance2_1.default.search('Tesla')];
                case 5:
                    searchResults = _a.sent();
                    console.log('Search Results:', JSON.stringify(searchResults, null, 2));
                    console.log('✅ Search test completed\n');
                    // Test 5: Using our custom getCompleteStockInformation function
                    console.log('Test 5: Using custom getCompleteStockInformation for GOOGL');
                    return [4 /*yield*/, (0, market_data_1.getCompleteStockInformation)('GOOGL')];
                case 6:
                    stockDetails = _a.sent();
                    console.log('Complete Stock Information:', JSON.stringify(stockDetails, null, 2));
                    console.log('✅ Complete stock information test completed\n');
                    // Test 6: Trending Tickers
                    console.log('Test 6: Fetching trending tickers');
                    return [4 /*yield*/, yahoo_finance2_1.default.trendingSymbols('US')];
                case 7:
                    trendingTickers = _a.sent();
                    console.log('Trending Tickers:', JSON.stringify(trendingTickers, null, 2));
                    console.log('✅ Trending tickers test completed\n');
                    console.log('🎉 All tests completed successfully!');
                    return [3 /*break*/, 9];
                case 8:
                    error_1 = _a.sent();
                    console.error('❌ Error during tests:', error_1);
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/];
            }
        });
    });
}
// Run the tests
runTests();
