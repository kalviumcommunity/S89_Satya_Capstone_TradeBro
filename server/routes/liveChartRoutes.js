const express = require('express');
const axios = require('axios');
const router = express.Router();
const { generateMockChartData, getDataCountForRange } = require('../utils/chartHelpers'); // Import generateMockChartData and getDataCountForRange

// In-memory cache for API responses
const cache = new Map();
const CACHE_DURATION = 60 * 1000; // 60 seconds cache for API responses
const API_THROTTLE_DURATION = 15 * 1000; // 15 seconds between API calls per symbol to avoid hitting rate limits too quickly
const lastApiCalls = new Map(); // Track last API call time per symbol

// Clean up old cache entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_DURATION * 5) { // Keep cache for 5x duration
            cache.delete(key);
            console.log(`🧹 Cleaned up cache entry: ${key}`);
        }
    }

    // Clean up old API call tracking
    for (const [symbol, timestamp] of lastApiCalls.entries()) {
        if (now - timestamp > API_THROTTLE_DURATION * 5) {
            lastApiCalls.delete(symbol);
        }
    }
}, 5 * 60 * 1000); // 5 minutes

// FMP API Configuration - Keys from environment variables only
const FMP_API_KEYS = [
    process.env.FMP_API_KEY,
    process.env.FMP_API_KEY_2,
    process.env.FMP_API_KEY_3,
    process.env.FMP_API_KEY_4
].filter(key => key && key !== 'demo'); // Remove null/undefined/demo keys

let currentKeyIndex = 0;

// Validate that we have at least one API key
if (FMP_API_KEYS.length === 0) {
    console.error('❌ CRITICAL: No valid FMP API keys found in environment variables. Live data will rely on mock data.');
    console.error('Please set FMP_API_KEY, FMP_API_KEY_2, etc., in your .env file.');
}

// Market hours checker for different exchanges (Simplified and more reliable)
const isMarketOpen = (exchange = 'NSE') => {
    try {
        const now = new Date();
        let targetTimeZone = 'America/New_York'; // Default for US markets
        let marketOpenTime = { hour: 9, minute: 30 };
        let marketCloseTime = { hour: 16, minute: 0 }; // 4 PM

        if (exchange.toUpperCase() === 'NSE' || exchange.toUpperCase() === 'BSE') {
            targetTimeZone = 'Asia/Kolkata';
            marketOpenTime = { hour: 9, minute: 15 };
            marketCloseTime = { hour: 15, minute: 30 }; // 3:30 PM
        }

        // Get current time in target timezone
        const options = { 
            timeZone: targetTimeZone, 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit',
            weekday: 'short'
        };
        
        const formatter = new Intl.DateTimeFormat('en-US', options);
        const timeString = formatter.format(now);
        
        // Extract day and time
        const parts = timeString.split(', ');
        const dayOfWeek = parts[0];
        const time = parts[1];
        
        // Market closed on weekends
        if (dayOfWeek === 'Sat' || dayOfWeek === 'Sun') {
            return false;
        }

        const [currentHour, currentMinute] = time.split(':').map(Number);
        const currentTotalMinutes = currentHour * 60 + currentMinute;
        const marketOpenTotalMinutes = marketOpenTime.hour * 60 + marketOpenTime.minute;
        const marketCloseTotalMinutes = marketCloseTime.hour * 60 + marketCloseTime.minute;

        return currentTotalMinutes >= marketOpenTotalMinutes && currentTotalMinutes <= marketCloseTotalMinutes;
    } catch (error) {
        console.error('Error checking market status:', error);
        return false; // Default to closed on error
    }
};


// Get next available API key
const getNextApiKey = () => {
    if (FMP_API_KEYS.length === 0) {
        console.warn("No FMP API keys available, API calls will fail.");
        return null;
    }
    const key = FMP_API_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % FMP_API_KEYS.length;
    return key;
};

// Helper to convert frontend period (e.g., '1D') to a suitable interval for mock data generation
const periodToInterval = (period) => {
    switch (period) {
        case '1D': return '5min';
        case '5D': return '30min';
        case '1M': return '1h';
        case '3M': return '4h';
        case '6M': return '1D';
        case '1Y': return '1D';
        case '5Y': return '1W';
        default: return '1h';
    }
};

// Fetch 1-minute intraday data from FMP API with caching and throttling
const fetchIntradayData = async (symbol, retryCount = 0) => {
    const cacheKey = `intraday_${symbol}`;
    const now = Date.now();

    // Check if we have fresh cached data
    const cachedData = cache.get(cacheKey);
    if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
        console.log(`🔄 Using cached data for ${symbol} (${Math.round((now - cachedData.timestamp) / 1000)}s old)`);
        return cachedData.data;
    }

    // Check throttling
    const lastCallTime = lastApiCalls.get(symbol) || 0;
    if (now - lastCallTime < API_THROTTLE_DURATION) {
        const timeToWait = Math.round((API_THROTTLE_DURATION - (now - lastCallTime)) / 1000);
        console.log(`⏳ API throttled for ${symbol}, ${timeToWait}s remaining. Returning mock/stale cache.`);
        return cachedData?.data || generateMockChartData(symbol, { interval: '1min', count: 60 }); // Fallback to mock
    }

    // If no API keys available, return mock data immediately
    if (FMP_API_KEYS.length === 0) {
        console.log(`🎭 No API keys available, using mock data for ${symbol}`);
        return generateMockChartData(symbol, { interval: '1min', count: 60 });
    }

    const maxRetries = FMP_API_KEYS.length;
    if (retryCount >= maxRetries) {
        console.log(`🎭 All API keys exhausted, using mock data for ${symbol}`);
        return generateMockChartData(symbol, { interval: '1min', count: 60 });
    }

    const apiKey = getNextApiKey();
    if (!apiKey) { // Should not happen if FMP_API_KEYS.length check is accurate
        console.log(`🎭 No API key retrieved, using mock data for ${symbol}`);
        return generateMockChartData(symbol, { interval: '1min', count: 60 });
    }

    try {
        console.log(`📊 Fetching 1-minute data for ${symbol} (Attempt ${retryCount + 1}) with key ending in ${apiKey.slice(-5)}`);

        // Update last API call time
        lastApiCalls.set(symbol, Date.now());

        const response = await axios.get(`https://financialmodelingprep.com/api/v3/historical-chart/1min/${symbol}`, {
            params: {
                apikey: apiKey
            },
            timeout: 10000 // 10 seconds timeout
        });

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            console.log(`✅ Received ${response.data.length} data points for ${symbol}`);
            // Cache the response
            cache.set(cacheKey, {
                data: response.data,
                timestamp: Date.now(),
                isMock: false
            });
            return response.data;
        } else {
            console.log(`⚠️ No data received from API for ${symbol}, using mock data.`);
            const mockData = generateMockChartData(symbol, { interval: '1min', count: 60 });
            cache.set(cacheKey, {
                data: mockData,
                timestamp: Date.now(),
                isMock: true
            });
            return mockData;
        }
    } catch (error) {
        if (error.response?.status === 429 && FMP_API_KEYS.length > 1) {
            console.warn(`⚠️ Rate limit hit for key (index ${currentKeyIndex -1}), trying next key...`);
            return fetchIntradayData(symbol, retryCount + 1); // Retry with next key
        }

        console.warn(`⚠️ API error for ${symbol}:`, error.message);
        console.log(`🎭 Falling back to mock data for ${symbol}`);

        const mockData = generateMockChartData(symbol, { interval: '1min', count: 60 });
        cache.set(cacheKey, {
            data: mockData,
            timestamp: Date.now(),
            isMock: true
        });
        return mockData;
    }
};

// Fetch historical data for various periods
const fetchHistoricalData = async (symbol, period, retryCount = 0) => {
    const cacheKey = `historical_${symbol}_${period}`;
    const now = Date.now();

    // Check if we have fresh cached data
    const cachedData = cache.get(cacheKey);
    if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
        console.log(`🔄 Using cached historical cached data for ${symbol} (${period})`);
        return cachedData.data;
    }

    // Check throttling - apply a longer throttle for historical data
    const lastCallTime = lastApiCalls.get(`${symbol}_${period}`) || 0;
    if (now - lastCallTime < API_THROTTLE_DURATION * 2) { // Longer throttle for historical
        const timeToWait = Math.round((API_THROTTLE_DURATION * 2 - (now - lastCallTime)) / 1000);
        console.log(`⏳ Historical API throttled for ${symbol} (${period}), ${timeToWait}s remaining.`);
        return cachedData?.data || generateMockChartData(symbol, { interval: periodToInterval(period), count: getDataCountForRange(period, periodToInterval(period)) });
    }

    if (FMP_API_KEYS.length === 0) {
        console.log(`🎭 No API keys available, using mock historical data for ${symbol} (${period})`);
        return generateMockChartData(symbol, { interval: periodToInterval(period), count: getDataCountForRange(period, periodToInterval(period)) });
    }

    const maxRetries = FMP_API_KEYS.length;
    if (retryCount >= maxRetries) {
        console.log(`🎭 All API keys exhausted, using mock historical data for ${symbol} (${period})`);
        return generateMockChartData(symbol, { interval: periodToInterval(period), count: getDataCountForRange(period, periodToInterval(period)) });
    }

    const apiKey = getNextApiKey();
    if (!apiKey) {
        console.log(`🎭 No API key retrieved, using mock historical data for ${symbol} (${period})`);
        return generateMockChartData(symbol, { interval: periodToInterval(period), count: getDataCountForRange(period, periodToInterval(period)) });
    }

    let fmpPeriod = period;
    let fmpInterval = '1day'; // Default interval for historical
    let count = 0;

    // FMP historical data endpoint requires specific `serietype` for 1-minute
    // For 1D, FMP's 1min endpoint is used. For others, daily/weekly/monthly
    if (period === '1D') {
        return fetchIntradayData(symbol); // Use 1-minute intraday for 1D
    } else if (period === '5D') {
        fmpPeriod = '5min'; // FMP often expects interval for short historical
        fmpInterval = '5min';
        count = getDataCountForRange(period, '5min');
    } else if (period === '1M') {
        fmpPeriod = '1hour';
        fmpInterval = '1hour';
        count = getDataCountForRange(period, '1h');
    } else if (period === '3M' || period === '6M' || period === '1Y') {
        fmpPeriod = '1day';
        fmpInterval = '1day';
        count = getDataCountForRange(period, '1D');
    } else if (period === '5Y') {
        fmpPeriod = '1week';
        fmpInterval = '1week';
        count = getDataCountForRange(period, '1W');
    }

    try {
        console.log(`📊 Fetching historical data for ${symbol} (${period}, interval: ${fmpInterval}) (Attempt ${retryCount + 1})`);
        lastApiCalls.set(`${symbol}_${period}`, Date.now());

        let url = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}`;
        const params = {
            apikey: apiKey,
            serietype: 'line', // Default to line, FMP handles OHLC for historical-chart
            timeseries: count // Limit number of data points
        };

        // For specific intervals, FMP uses different endpoints or parameters
        if (fmpInterval !== '1day') {
            url = `https://financialmodelingprep.com/api/v3/historical-chart/${fmpInterval}/${symbol}`;
            delete params.serietype; // Not needed for historical-chart endpoint
            delete params.timeseries; // Not directly supported here, use limit in URL
            params.limit = count;
        }

        const response = await axios.get(url, {
            params,
            timeout: 15000
        });

        let data = [];
        if (response.data && response.data.historical) {
            data = response.data.historical;
        } else if (response.data && Array.isArray(response.data)) {
            data = response.data; // For historical-chart/interval endpoints
        }

        if (data.length > 0) {
            console.log(`✅ Received ${data.length} historical data points for ${symbol} (${period})`);
            cache.set(cacheKey, {
                data: data,
                timestamp: Date.now(),
                isMock: false
            });
            return data;
        } else {
            console.log(`⚠️ No historical data received from API for ${symbol} (${period}), using mock data.`);
            const mockData = generateMockChartData(symbol, { interval: periodToInterval(period), count: getDataCountForRange(period, periodToInterval(period)) });
            cache.set(cacheKey, {
                data: mockData,
                timestamp: Date.now(),
                isMock: true
            });
            return mockData;
        }
    } catch (error) {
        if (error.response?.status === 429 && FMP_API_KEYS.length > 1) {
            console.warn(`⚠️ Rate limit hit for key (index ${currentKeyIndex - 1}), trying next key...`);
            return fetchHistoricalData(symbol, period, retryCount + 1);
        }
        console.error(`❌ API error fetching historical data for ${symbol} (${period}):`, error.message);
        console.log(`🎭 Falling back to mock historical data for ${symbol} (${period})`);
        const mockData = generateMockChartData(symbol, { interval: periodToInterval(period), count: getDataCountForRange(period, periodToInterval(period)) });
        cache.set(cacheKey, {
            data: mockData,
            timestamp: Date.now(),
            isMock: true
        });
        return mockData;
    }
};


// Route: Get historical chart data for various periods
router.get('/historical/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const { period = '1D' } = req.query; // Default to 1D

        console.log(`🔄 Historical chart request for ${symbol} (${period})`);

        // Determine exchange from symbol
        let exchange = 'NASDAQ';
        if (symbol.endsWith('.NS')) exchange = 'NSE';
        if (symbol.endsWith('.BO')) exchange = 'BSE';

        const marketOpen = isMarketOpen(exchange);

        // Fetch historical data (real or mock)
        const rawData = await fetchHistoricalData(symbol, period);

        // FMP historical data for '1day' intervals is usually in reverse chronological order
        // Ensure it's sorted oldest to newest for Lightweight Charts
        const formattedData = rawData
            .map(item => ({
                time: Math.floor(new Date(item.date).getTime() / 1000),
                open: parseFloat(item.open),
                high: parseFloat(item.high),
                low: parseFloat(item.low),
                close: parseFloat(item.close),
                volume: parseInt(item.volume || 0)
            }))
            .sort((a, b) => a.time - b.time);

        const latestCandle = formattedData[formattedData.length - 1];

        res.json({
            success: true,
            data: formattedData,
            latest: latestCandle, // Provide latest candle from historical data
            marketOpen,
            exchange,
            symbol,
            period,
            timestamp: Date.now(),
            count: formattedData.length
        });

    } catch (error) {
        console.error(`❌ Error fetching historical data for ${req.params.symbol}:`, error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch historical chart data',
            error: error.message,
            marketOpen: false
        });
    }
});


// Route: Get latest candle data for a symbol
router.get('/latest/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        console.log(`🔄 Latest candle request for ${symbol}`);

        // Fetch 1-minute intraday data to get the latest candle
        const rawData = await fetchIntradayData(symbol);
        
        if (!rawData || rawData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No data available for symbol',
                symbol
            });
        }

        // Get the most recent candle
        const latestCandle = rawData[0]; // FMP returns newest first
        
        const formattedCandle = {
            time: Math.floor(new Date(latestCandle.date).getTime() / 1000),
            open: parseFloat(latestCandle.open),
            high: parseFloat(latestCandle.high),
            low: parseFloat(latestCandle.low),
            close: parseFloat(latestCandle.close),
            volume: parseInt(latestCandle.volume || 0)
        };

        res.json({
            success: true,
            data: formattedCandle,
            symbol,
            timestamp: Date.now()
        });

    } catch (error) {
        console.error(`❌ Error fetching latest candle for ${req.params.symbol}:`, error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch latest candle data',
            error: error.message
        });
    }
});

// Route: Get market status for an exchange
router.get('/market-status/:exchange', async (req, res) => {
    try {
        const { exchange } = req.params;
        console.log(`🔄 Market status request for ${exchange}`);

        const marketOpen = isMarketOpen(exchange);
        
        // Get current time in the exchange's timezone
        let targetTimeZone = 'America/New_York';
        if (exchange.toUpperCase() === 'NSE' || exchange.toUpperCase() === 'BSE') {
            targetTimeZone = 'Asia/Kolkata';
        }

        const now = new Date();
        const exchangeTime = now.toLocaleString('en-US', { timeZone: targetTimeZone });

        res.json({
            success: true,
            data: {
                exchange: exchange.toUpperCase(),
                isOpen: marketOpen,
                exchangeTime,
                timezone: targetTimeZone,
                timestamp: Date.now()
            }
        });

    } catch (error) {
        console.error(`❌ Error fetching market status for ${req.params.exchange}:`, error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch market status',
            error: error.message
        });
    }
});

module.exports = router;