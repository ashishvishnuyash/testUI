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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompleteStockInformation = getCompleteStockInformation;
exports.getMarketSummaryUpdate = getMarketSummaryUpdate;
exports.getMarketMoversUpdate = getMarketMoversUpdate;
var yahoo_finance2_1 = require("yahoo-finance2");
/**
 * Fetches comprehensive information for a given stock symbol.
 * @param symbol - The stock symbol (e.g., "AAPL", "MSFT").
 * @returns A Promise resolving to StockDetails or null if an error occurs.
 */
function getCompleteStockInformation(symbol) {
    return __awaiter(this, void 0, void 0, function () {
        var queryOptions, _a, quoteData, summaryData, recommendationsData, insightsData, stockDetails, error_1;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    queryOptions = {
                        modules: [
                            'summaryProfile',
                            'financialData',
                            'recommendationTrend',
                            'earningsHistory',
                            'price',
                            'defaultKeyStatistics',
                            'calendarEvents',
                            'assetProfile',
                        ],
                    };
                    return [4 /*yield*/, Promise.all([
                            yahoo_finance2_1.default.quote(symbol).catch(function (err) {
                                console.warn("Failed to fetch quote for ".concat(symbol, ":"), err.message);
                                return undefined;
                            }),
                            yahoo_finance2_1.default.quoteSummary(symbol, queryOptions).catch(function (err) {
                                console.warn("Failed to fetch quote summary for ".concat(symbol, ":"), err.message);
                                return undefined;
                            }),
                            yahoo_finance2_1.default.recommendationsBySymbol(symbol).catch(function (err) {
                                console.warn("Failed to fetch recommendations for ".concat(symbol, ":"), err.message);
                                return undefined;
                            }),
                            yahoo_finance2_1.default.insights(symbol).catch(function (err) {
                                console.warn("Failed to fetch insights for ".concat(symbol, ":"), err.message);
                                return undefined;
                            }),
                        ])];
                case 1:
                    _a = _c.sent(), quoteData = _a[0], summaryData = _a[1], recommendationsData = _a[2], insightsData = _a[3];
                    if (!quoteData && !summaryData) {
                        console.error("No data could be fetched for symbol ".concat(symbol));
                        return [2 /*return*/, null];
                    }
                    stockDetails = {
                        symbol: (quoteData === null || quoteData === void 0 ? void 0 : quoteData.symbol) || ((_b = summaryData === null || summaryData === void 0 ? void 0 : summaryData.price) === null || _b === void 0 ? void 0 : _b.symbol) || symbol.toUpperCase(),
                        quote: quoteData,
                        summaryProfile: summaryData === null || summaryData === void 0 ? void 0 : summaryData.summaryProfile,
                        financialData: summaryData === null || summaryData === void 0 ? void 0 : summaryData.financialData,
                        recommendationTrend: summaryData === null || summaryData === void 0 ? void 0 : summaryData.recommendationTrend,
                        earningsHistory: summaryData === null || summaryData === void 0 ? void 0 : summaryData.earningsHistory,
                        priceData: summaryData === null || summaryData === void 0 ? void 0 : summaryData.price,
                        keyStatistics: summaryData === null || summaryData === void 0 ? void 0 : summaryData.defaultKeyStatistics,
                        calendarEvents: summaryData === null || summaryData === void 0 ? void 0 : summaryData.calendarEvents,
                        // companyOfficers is not available in the current version
                        // companyOfficers: summaryData?.companyOfficers,
                        assetProfile: summaryData === null || summaryData === void 0 ? void 0 : summaryData.assetProfile,
                        recommendations: recommendationsData,
                        insights: insightsData,
                    };
                    return [2 /*return*/, stockDetails];
                case 2:
                    error_1 = _c.sent();
                    console.error("Error fetching complete stock information for ".concat(symbol, ":"), error_1.message);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Fetches a summary of the stock market.
 * @param region - The market region (e.g., "US", "GB", "HK"). Defaults to "US".
 * @param majorIndexSymbols - Array of symbols for major indices. Defaults to US indices.
 * @returns A Promise resolving to MarketSummary or null if an error occurs.
 */
function getMarketSummaryUpdate() {
    return __awaiter(this, arguments, void 0, function (region, majorIndexSymbols) {
        var _a, trending, indexQuotesResults, trendingSymbols, majorIndices, error_2;
        if (region === void 0) { region = "US"; }
        if (majorIndexSymbols === void 0) { majorIndexSymbols = ["^GSPC", "^IXIC", "^DJI"]; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, Promise.allSettled(__spreadArray([
                            yahoo_finance2_1.default.trendingSymbols(region)
                        ], majorIndexSymbols.map(function (symbol) { return yahoo_finance2_1.default.quote(symbol); }), true))];
                case 1:
                    _a = _b.sent(), trending = _a[0], indexQuotesResults = _a.slice(1);
                    trendingSymbols = trending.status === 'fulfilled' ? trending.value.quotes : [];
                    if (trending.status === 'rejected') {
                        console.warn("Failed to fetch trending symbols for ".concat(region, ":"), trending.reason.message);
                    }
                    majorIndices = indexQuotesResults
                        .filter(function (result) { return result.status === 'fulfilled'; })
                        .map(function (result) { return result.value; });
                    return [2 /*return*/, {
                            region: region,
                            timestamp: new Date(),
                            trendingSymbols: trendingSymbols,
                            majorIndices: majorIndices,
                        }];
                case 2:
                    error_2 = _b.sent();
                    console.error("Error fetching market summary for ".concat(region, ":"), error_2.message);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Fetches market movers (top gainers, losers, most active).
 * @param region - The market region (e.g., "US", "GB"). Defaults to "US".
 * @param count - Number of results to fetch for each category. Defaults to 5.
 * @returns A Promise resolving to MarketMovers or null if an error occurs.
 */
function getMarketMoversUpdate() {
    return __awaiter(this, arguments, void 0, function (region, count) {
        var screenerIds, _a, gainersResult, losersResult, mostActiveResult, getQuotesFromResult, error_3;
        if (region === void 0) { region = "US"; }
        if (count === void 0) { count = 5; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    screenerIds = {
                        gainers: 'day_gainers',
                        losers: 'day_losers',
                        mostActive: 'most_actives',
                    };
                    return [4 /*yield*/, Promise.allSettled([
                            yahoo_finance2_1.default.screener({ count: count, scrIds: screenerIds.gainers }),
                            yahoo_finance2_1.default.screener({ count: count, scrIds: screenerIds.losers }),
                            yahoo_finance2_1.default.screener({ count: count, scrIds: screenerIds.mostActive }),
                        ])];
                case 1:
                    _a = _b.sent(), gainersResult = _a[0], losersResult = _a[1], mostActiveResult = _a[2];
                    getQuotesFromResult = function (result) {
                        if (result.status === 'fulfilled' && result.value.quotes) {
                            return result.value.quotes;
                        }
                        if (result.status === 'rejected') {
                            console.warn("Failed to fetch screener results:", result.reason.message);
                        }
                        return [];
                    };
                    return [2 /*return*/, {
                            region: region,
                            timestamp: new Date(),
                            gainers: getQuotesFromResult(gainersResult),
                            losers: getQuotesFromResult(losersResult),
                            mostActive: getQuotesFromResult(mostActiveResult),
                        }];
                case 2:
                    error_3 = _b.sent();
                    console.error("Error fetching market movers for ".concat(region, ":"), error_3.message);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
