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
// src/yahooFetcher.ts
var node_fetch_1 = require("node-fetch");
// --- Function to fetch and process data ---
function fetchYahooChartData(ticker_1) {
    return __awaiter(this, arguments, void 0, function (ticker, range, interval) {
        var baseUrl, params, url, headers, response, errorText, data, chartData, meta, timestamps, quotes_1, priceRecords, events, error_1;
        if (range === void 0) { range = "1mo"; }
        if (interval === void 0) { interval = "1d"; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    baseUrl = "https://query1.finance.yahoo.com/v8/finance/chart/".concat(ticker.toUpperCase());
                    params = new URLSearchParams({
                        region: "US",
                        lang: "en-US",
                        includePrePost: "false",
                        interval: interval,
                        useYfid: "true",
                        range: range,
                        events: "div|split|earn",
                    });
                    url = "".concat(baseUrl, "?").concat(params.toString());
                    headers = {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    };
                    console.log("Fetching data for ".concat(ticker, " from: ").concat(url));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, (0, node_fetch_1.default)(url, { headers: headers })];
                case 2:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.text()];
                case 3:
                    errorText = _a.sent();
                    throw new Error("HTTP error ".concat(response.status, ": ").concat(response.statusText, ". Body: ").concat(errorText));
                case 4: return [4 /*yield*/, response.json()];
                case 5:
                    data = _a.sent();
                    if (data.chart.error) {
                        console.error("--- Yahoo Finance API Error ---");
                        console.error("Code: ".concat(data.chart.error.code));
                        console.error("Description: ".concat(data.chart.error.description));
                        return [2 /*return*/];
                    }
                    if (!data.chart.result || data.chart.result.length === 0) {
                        console.error("No chart data found in the response.");
                        // console.log(JSON.stringify(data, null, 2)); // Log full response for debugging
                        return [2 /*return*/];
                    }
                    chartData = data.chart.result[0];
                    meta = chartData.meta;
                    console.log("\n--- Meta Information for ".concat(meta.symbol, " ---"));
                    console.log("Currency: ".concat(meta.currency));
                    console.log("Exchange: ".concat(meta.exchangeName));
                    console.log("Timezone: ".concat(meta.timezone));
                    console.log("Data Granularity: ".concat(meta.dataGranularity));
                    console.log("Range: ".concat(meta.range));
                    console.log("Regular Market Price: ".concat(meta.regularMarketPrice));
                    console.log("Previous Close: ".concat(meta.chartPreviousClose || meta.previousClose || 'N/A'));
                    timestamps = chartData.timestamp || [];
                    quotes_1 = chartData.indicators.quote[0] || {};
                    if (timestamps.length > 0) {
                        console.log("\n--- Price Data (first 5 and last 5 records) ---");
                        priceRecords = timestamps.map(function (ts, i) {
                            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
                            var date = new Date(ts * 1000); // Timestamps are in seconds
                            return {
                                Datetime: date.toISOString(),
                                Open: (_b = (_a = quotes_1.open) === null || _a === void 0 ? void 0 : _a[i]) !== null && _b !== void 0 ? _b : null,
                                High: (_d = (_c = quotes_1.high) === null || _c === void 0 ? void 0 : _c[i]) !== null && _d !== void 0 ? _d : null,
                                Low: (_f = (_e = quotes_1.low) === null || _e === void 0 ? void 0 : _e[i]) !== null && _f !== void 0 ? _f : null,
                                Close: (_h = (_g = quotes_1.close) === null || _g === void 0 ? void 0 : _g[i]) !== null && _h !== void 0 ? _h : null,
                                Volume: (_k = (_j = quotes_1.volume) === null || _j === void 0 ? void 0 : _j[i]) !== null && _k !== void 0 ? _k : null,
                            };
                        }).filter(function (record) { return record.Close !== null; });
                        if (priceRecords.length > 0) {
                            console.log("First 5 records:");
                            console.table(priceRecords.slice(0, 5));
                            if (priceRecords.length > 10) {
                                console.log("\nLast 5 records:");
                                console.table(priceRecords.slice(-5));
                            }
                            else if (priceRecords.length > 5) {
                                console.log("\nLast records:");
                                console.table(priceRecords.slice(5));
                            }
                        }
                        else {
                            console.log("No valid price records to display.");
                        }
                    }
                    else {
                        console.log("No timestamp data found.");
                    }
                    events = chartData.events;
                    if (events === null || events === void 0 ? void 0 : events.dividends) {
                        console.log("\n--- Dividends ---");
                        Object.entries(events.dividends).forEach(function (_a) {
                            var ts = _a[0], divInfo = _a[1];
                            console.log("Date: ".concat(new Date(parseInt(ts) * 1000).toLocaleDateString(), ", Amount: ").concat(divInfo.amount));
                        });
                    }
                    if (events === null || events === void 0 ? void 0 : events.splits) {
                        console.log("\n--- Splits ---");
                        Object.entries(events.splits).forEach(function (_a) {
                            var ts = _a[0], splitInfo = _a[1];
                            console.log("Date: ".concat(new Date(parseInt(ts) * 1000).toLocaleDateString(), ", Ratio: ").concat(splitInfo.splitRatio, " (").concat(splitInfo.numerator, ":").concat(splitInfo.denominator, ")"));
                        });
                    }
                    return [3 /*break*/, 7];
                case 6:
                    error_1 = _a.sent();
                    console.error("\n--- An error occurred ---");
                    if (error_1 instanceof Error) {
                        console.error(error_1.message);
                    }
                    else {
                        console.error("An unknown error occurred:", error_1);
                    }
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// --- Example Usage ---
function main() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetchYahooChartData("AAPL")];
                case 1:
                    _a.sent();
                    console.log("\n" + "=".repeat(50) + "\n");
                    return [4 /*yield*/, fetchYahooChartData("MSFT", "1wk", "1m")];
                case 2:
                    _a.sent();
                    console.log("\n" + "=".repeat(50) + "\n");
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(console.error);
