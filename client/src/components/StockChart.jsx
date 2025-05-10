import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Area,
  ComposedChart
} from "recharts";
import axios from "axios";
import { FiCalendar, FiAlertCircle, FiTrendingUp, FiTrendingDown, FiInfo } from "react-icons/fi";
import Loading from "./Loading";
import API_ENDPOINTS from "../config/apiConfig";
import "../styles/StockChart.css";

const StockChart = ({ symbol, timeRange: propTimeRange, chartType: propChartType, fullscreen = false }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(propTimeRange || "1week"); // Use prop if provided
  const [intradayData, setIntradayData] = useState([]);
  const [chartType, setChartType] = useState(propChartType || "line"); // Use prop if provided
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipInfo, setTooltipInfo] = useState({ x: 0, y: 0, content: "" });

  // Update internal state when props change
  useEffect(() => {
    if (propTimeRange) {
      setTimeRange(propTimeRange);
    }
  }, [propTimeRange]);

  useEffect(() => {
    if (propChartType) {
      setChartType(propChartType);
    }
  }, [propChartType]);

  useEffect(() => {
    const fetchChartData = async () => {
      if (!symbol) return;

      try {
        setLoading(true);
        setError(null);

        // Use our proxy server to get historical data
        const response = await axios.get(
          API_ENDPOINTS.PROXY.HISTORICAL_PRICE(symbol)
        );

        if (response.data && response.data.historical) {
          // Process the data
          const historicalData = response.data.historical.reverse(); // Reverse to get chronological order

          // Format the data for the chart
          const formattedData = historicalData.map(item => ({
            date: new Date(item.date).toLocaleDateString(),
            price: item.close,
            open: item.open,
            high: item.high,
            low: item.low,
            volume: item.volume,
            timestamp: new Date(item.date).getTime()
          }));

          setChartData(formattedData);
        } else {
          setError("No historical data found for this stock");
        }
      } catch (err) {
        console.error("Error fetching chart data:", err);

        // Generate mock data as fallback
        const mockData = generateMockChartData(symbol);
        if (mockData.length > 0) {
          setChartData(mockData);
          setError(null);
        } else {
          setError("Failed to fetch chart data. Using simulated data instead.");
        }
      } finally {
        setLoading(false);
      }

      // Fetch intraday data for 5-minute candles
      const fetchIntraday = async () => {
        try {
          const intradayData = await fetchIntradayData(symbol);
          setIntradayData(intradayData);
        } catch (error) {
          console.error("Error fetching intraday data:", error);
          // Fallback to mock data
          const intradayMockData = generateMockIntradayData(symbol);
          setIntradayData(intradayMockData);
        }
      };

      fetchIntraday();
    };

    fetchChartData();
  }, [symbol]);

  // Generate mock chart data
  const generateMockChartData = (symbol) => {
    try {
      // Use a hash of the symbol to generate a consistent base price for the same symbol
      const symbolHash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const basePrice = (symbolHash % 4000) + 100; // Between 100 and 4100

      const today = new Date();
      const data = [];

      // Determine if this stock has an overall positive or negative trend
      const isPositiveTrend = symbolHash % 2 === 0;

      // Generate data for the past 365 days for a full year of data
      for (let i = 365; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);

        // Generate a random daily price movement (-1.5% to +1.5%)
        const randomChange = (Math.random() * 3 - 1.5) / 100;

        // Add some trend based on the overall trend direction
        const trendFactor = isPositiveTrend ? 0.05 : -0.05;

        // Add some seasonality (higher in middle of year)
        const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        const seasonality = Math.sin(dayOfYear / 365 * Math.PI * 2) * 0.0005;

        // Add some market cycles (longer term patterns)
        const marketCycle = Math.sin(i / 120 * Math.PI) * 0.001;

        // Combine all factors
        const changePercent = randomChange + (trendFactor / 100) + seasonality + marketCycle;

        // Calculate the price for this day
        const prevPrice = data.length > 0 ? data[data.length - 1].price : basePrice;
        const price = Math.max(prevPrice * (1 + changePercent), 0.01); // Ensure price doesn't go negative

        // Generate realistic open, high, low values
        const volatility = (symbolHash % 10) / 1000 + 0.005; // Between 0.5% and 1.5%
        const open = price * (1 + (Math.random() * 2 - 1) * volatility);
        const highLowRange = price * volatility * 2;
        const high = Math.max(price, open) + (Math.random() * highLowRange);
        const low = Math.min(price, open) - (Math.random() * highLowRange);

        // Generate volume with some correlation to price movement
        const priceChange = data.length > 0 ? Math.abs(price - data[data.length - 1].price) : 0;
        const volumeBase = 100000 + (symbolHash % 10) * 100000; // Base volume varies by stock
        const volumeMultiplier = 1 + (priceChange / price) * 100; // Higher volume on bigger price moves
        const volume = Math.floor(volumeBase * volumeMultiplier * (0.5 + Math.random()));

        // Format the data for the chart
        data.push({
          date: date.toLocaleDateString(),
          price: parseFloat(price.toFixed(2)),
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          volume: volume,
          timestamp: date.getTime()
        });
      }

      return data;
    } catch (error) {
      console.error("Error generating mock data:", error);
      return [];
    }
  };

  // Fetch 5-minute intraday candle data from API
  const fetchIntradayData = async (symbol) => {
    try {
      console.log(`Fetching 5-minute chart data for ${symbol}`);
      const response = await axios.get(API_ENDPOINTS.CHARTS.FIVE_MIN(symbol));

      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        // Format the data for the chart
        return response.data.data.map(candle => ({
          date: new Date(candle.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          time: new Date(candle.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          price: candle.close,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          volume: candle.volume,
          timestamp: candle.time
        }));
      } else {
        console.error("Invalid 5-minute chart data format:", response.data);
        throw new Error("Invalid data format");
      }
    } catch (error) {
      console.error(`Error fetching 5-minute chart data for ${symbol}:`, error);

      // Fallback to generating mock data
      return generateMockIntradayData(symbol);
    }
  };

  // Generate mock 5-minute intraday candle data as fallback
  const generateMockIntradayData = (symbol) => {
    try {
      // Use a hash of the symbol to generate a consistent base price for the same symbol
      const symbolHash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const basePrice = (symbolHash % 4000) + 100; // Between 100 and 4100

      const data = [];
      const now = new Date();
      const marketOpen = new Date();
      marketOpen.setHours(9, 30, 0, 0); // Market opens at 9:30 AM

      // If current time is before market open, use yesterday's data
      if (now.getHours() < 9 || (now.getHours() === 9 && now.getMinutes() < 30)) {
        marketOpen.setDate(marketOpen.getDate() - 1);
      }

      // If it's weekend, adjust to Friday
      const day = marketOpen.getDay();
      if (day === 0) { // Sunday
        marketOpen.setDate(marketOpen.getDate() - 2);
      } else if (day === 6) { // Saturday
        marketOpen.setDate(marketOpen.getDate() - 1);
      }

      // Determine if this stock has an overall positive or negative trend for the day
      const isPositiveTrend = (symbolHash + marketOpen.getDate()) % 2 === 0;

      // Generate data for every 5 minutes from market open (9:30 AM) to market close (4:00 PM)
      // That's 78 5-minute candles per day (6.5 hours * 12 candles per hour)
      let prevPrice = basePrice;
      let prevHigh = basePrice;
      let prevLow = basePrice;

      for (let i = 0; i < 78; i++) {
        const timestamp = new Date(marketOpen);
        timestamp.setMinutes(marketOpen.getMinutes() + (i * 5));

        // Generate a random price movement (-0.5% to +0.5%)
        const randomChange = (Math.random() * 1 - 0.5) / 100;

        // Add some trend based on the overall trend direction
        const trendFactor = isPositiveTrend ? 0.02 : -0.02;

        // Add some time-of-day pattern (more volatile at open and close)
        const timeOfDay = i / 78; // 0 to 1 representing time from open to close
        const timePattern = 0.0005 * Math.sin((timeOfDay - 0.5) * Math.PI * 2);

        // Combine all factors
        const changePercent = randomChange + (trendFactor / 100) + timePattern;

        // Calculate the closing price for this candle
        const close = Math.max(prevPrice * (1 + changePercent), 0.01);

        // Generate realistic open, high, low values
        const volatility = (symbolHash % 10) / 1000 + 0.002; // Between 0.2% and 1.2%
        const open = prevPrice; // Open at previous close

        // High and low should be relative to both open and close
        const highLowRange = Math.max(open, close) * volatility;
        const high = Math.max(open, close) + (Math.random() * highLowRange);
        const low = Math.min(open, close) - (Math.random() * highLowRange);

        // Generate volume with some correlation to price movement
        const priceChange = Math.abs(close - prevPrice);
        const volumeBase = 10000 + (symbolHash % 10) * 10000; // Base volume varies by stock
        const volumeMultiplier = 1 + (priceChange / close) * 100; // Higher volume on bigger price moves

        // Volume is higher at market open and close
        const timeVolumeFactor = 1 + Math.sin((1 - Math.abs(timeOfDay - 0.5) * 2) * Math.PI) * 0.5;
        const volume = Math.floor(volumeBase * volumeMultiplier * timeVolumeFactor * (0.5 + Math.random()));

        // Format time as HH:MM
        const hours = timestamp.getHours().toString().padStart(2, '0');
        const minutes = timestamp.getMinutes().toString().padStart(2, '0');
        const timeLabel = `${hours}:${minutes}`;

        // Format the data for the chart
        data.push({
          date: timeLabel,
          time: timeLabel,
          price: parseFloat(close.toFixed(2)),
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          volume: volume,
          timestamp: timestamp.getTime()
        });

        // Update previous values for next iteration
        prevPrice = close;
        prevHigh = high;
        prevLow = low;
      }

      return data;
    } catch (error) {
      console.error("Error generating intraday data:", error);
      return [];
    }
  };

  // Filter data based on selected time range
  const getFilteredData = () => {
    if (timeRange === "5min") {
      // Return 5-minute candle data
      return intradayData;
    }

    if (!chartData.length) return [];

    const now = new Date().getTime();
    let filteredData = [];

    switch (timeRange) {
      case "1day":
        // Last 24 hours
        filteredData = chartData.filter(
          item => item.timestamp >= now - 24 * 60 * 60 * 1000
        );
        break;
      case "1week":
        // Last 7 days
        filteredData = chartData.filter(
          item => item.timestamp >= now - 7 * 24 * 60 * 60 * 1000
        );
        break;
      case "1month":
        // Last 30 days
        filteredData = chartData.filter(
          item => item.timestamp >= now - 30 * 24 * 60 * 60 * 1000
        );
        break;
      case "3months":
        // Last 90 days
        filteredData = chartData.filter(
          item => item.timestamp >= now - 90 * 24 * 60 * 60 * 1000
        );
        break;
      case "1year":
        // Last 365 days
        filteredData = chartData.filter(
          item => item.timestamp >= now - 365 * 24 * 60 * 60 * 1000
        );
        break;
      case "all":
      default:
        filteredData = chartData;
        break;
    }

    // If we don't have enough data for the selected range, return all available data
    return filteredData.length > 0 ? filteredData : chartData;
  };

  const filteredData = getFilteredData();

  // Calculate price change percentage
  const calculatePriceChange = () => {
    if (filteredData.length < 2) return { change: 0, percentage: 0 };

    const firstPrice = filteredData[0].price;
    const lastPrice = filteredData[filteredData.length - 1].price;
    const change = lastPrice - firstPrice;
    const percentage = (change / firstPrice) * 100;

    return { change, percentage };
  };

  const { change, percentage } = calculatePriceChange();
  const isPositive = change >= 0;

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const isPositiveChange = payload[0].payload.open
        ? payload[0].value >= payload[0].payload.open
        : true;

      return (
        <div className="custom-tooltip">
          <div className="tooltip-header">
            <span className="tooltip-date">{label}</span>
            <span className={`tooltip-change ${isPositiveChange ? 'positive' : 'negative'}`}>
              {isPositiveChange ? <i className="fas fa-caret-up"></i> : <i className="fas fa-caret-down"></i>}
            </span>
          </div>

          <div className="tooltip-price">
            <span className="value">₹{payload[0].value.toLocaleString()}</span>
          </div>

          <div className="tooltip-details">
            {payload[0].payload.open && (
              <div className="tooltip-row">
                <span className="label">
                  <i className="tooltip-icon far fa-circle"></i> Open
                </span>
                <span className="value">₹{payload[0].payload.open.toLocaleString()}</span>
              </div>
            )}
            {payload[0].payload.high && (
              <div className="tooltip-row">
                <span className="label">
                  <i className="tooltip-icon fas fa-arrow-up" style={{ color: '#26a69a' }}></i> High
                </span>
                <span className="value high">₹{payload[0].payload.high.toLocaleString()}</span>
              </div>
            )}
            {payload[0].payload.low && (
              <div className="tooltip-row">
                <span className="label">
                  <i className="tooltip-icon fas fa-arrow-down" style={{ color: '#ef5350' }}></i> Low
                </span>
                <span className="value low">₹{payload[0].payload.low.toLocaleString()}</span>
              </div>
            )}
            {payload[0].payload.volume && (
              <div className="tooltip-row">
                <span className="label">
                  <i className="tooltip-icon fas fa-exchange-alt"></i> Volume
                </span>
                <span className="value">{payload[0].payload.volume.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`stock-chart-container ${fullscreen ? 'fullscreen-chart' : ''}`}>
      {/* Chart time range controls - Always show for consistency */}
      <div className="chart-time-controls">
        <div className="chart-title">
          <h3>{symbol} Chart</h3>
        </div>
      </div>

      {/* Chart controls */}
      <div className="tradingview-controls">
        <button title="Line Chart" onClick={() => setChartType("line")}>
          <i className="fas fa-chart-line"></i>
        </button>
        <button title="Area Chart" onClick={() => setChartType("area")}>
          <i className="fas fa-chart-area"></i>
        </button>
        <button title="Candlestick Chart" onClick={() => setChartType("candle")}>
          <i className="fas fa-chart-bar"></i>
        </button>
        <button title="Toggle Fullscreen" onClick={() => setFullscreen(!fullscreen)}>
          <i className={`fas ${fullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
        </button>
      </div>

      {/* Info tooltip for chart data - Only show if not in fullscreen mode */}
      {!fullscreen && (
        <div className="chart-info-container">
          <div
            className="chart-info-icon"
            onMouseEnter={(e) => {
              setTooltipInfo({
                x: e.clientX,
                y: e.clientY,
                content: "Chart data may be simulated if real-time data is unavailable. Hover over chart points for detailed information."
              });
              setShowTooltip(true);
            }}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <FiInfo />
          </div>
          {showTooltip && (
            <div
              className="chart-info-tooltip"
              style={{
                top: tooltipInfo.y - 70,
                left: tooltipInfo.x - 150
              }}
            >
              {tooltipInfo.content}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="chart-loading">
          <Loading size="medium" text="Loading chart data..." />
        </div>
      ) : error ? (
        <div className="chart-error">
          <FiAlertCircle className="error-icon" />
          <p>{error}</p>
        </div>
      ) : filteredData.length > 0 ? (
        <>
          <div className="chart-summary">
            <div className={`price-change ${isPositive ? "positive" : "negative"}`}>
              {isPositive ? <i className="fas fa-caret-up"></i> : <i className="fas fa-caret-down"></i>}
              <span>{isPositive ? "+" : ""}{change.toFixed(2)}</span>
              <span className="percentage">({isPositive ? "+" : ""}{percentage.toFixed(2)}%)</span>
            </div>
            <div className="date-range">
              <i className="far fa-calendar-alt"></i>
              <span>
                {timeRange === "5min"
                  ? `${filteredData[0].time} - ${filteredData[filteredData.length - 1].time}`
                  : `${filteredData[0].date} - ${filteredData[filteredData.length - 1].date}`
                }
              </span>
            </div>
          </div>

          <div className={`chart-container ${fullscreen ? 'fullscreen-chart-container' : ''}`}>
            {/* Chart logo */}
            <div className="tradingview-logo">
              <i className="fas fa-chart-line"></i>
              <span>TradeBro Charts</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
{(() => {
                // Render different chart types based on chartType prop
                const commonProps = {
                  data: filteredData,
                  margin: { top: 10, right: 60, left: 0, bottom: 30 } /* TradingView-like margins */
                };

                const commonAxisProps = {
                  xAxis: (
                    <XAxis
                      dataKey={timeRange === "5min" ? "time" : "date"}
                      tick={{ fill: '#787b86', fontSize: 11, fontWeight: 400 }} /* TradingView style */
                      height={30}
                      tickFormatter={(value, index) => {
                        // Show fewer ticks like TradingView
                        const divisor = timeRange === "5min" ? 8 : 6;
                        return index % Math.ceil(filteredData.length / divisor) === 0 ? value : '';
                      }}
                      axisLine={{ stroke: '#e0e3eb', strokeWidth: 1 }}
                      tickLine={{ stroke: '#e0e3eb', strokeWidth: 1 }}
                      padding={{ left: 5, right: 5 }}
                    />
                  ),
                  yAxis: (
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fill: '#787b86', fontSize: 11, fontWeight: 400 }} /* TradingView style */
                      width={60}
                      tickFormatter={(value) => `₹${value.toLocaleString()}`}
                      axisLine={{ stroke: '#e0e3eb', strokeWidth: 1 }}
                      tickLine={{ stroke: '#e0e3eb', strokeWidth: 1 }}
                      padding={{ top: 10, bottom: 10 }}
                      allowDecimals={false}
                      tickCount={6}
                      orientation="right" /* TradingView typically has Y-axis on right */
                    />
                  ),
                  grid: (
                    <CartesianGrid
                      strokeDasharray={null}
                      stroke="#f0f3fa" /* TradingView grid color */
                      opacity={0.7}
                      horizontal={true}
                      vertical={true}
                    />
                  ),
                  tooltip: (
                    <Tooltip
                      content={<CustomTooltip />}
                      wrapperStyle={{ zIndex: 1000 }}
                      cursor={{ strokeWidth: 2 }} /* Make cursor more visible */
                      animationDuration={300}
                      animationEasing="ease-out"
                    />
                  ),
                  legend: (
                    <Legend
                      verticalAlign="top"
                      height={30}
                      wrapperStyle={{
                        paddingTop: '5px',
                        fontSize: '11px',
                        fontWeight: 400
                      }}
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => <span style={{ color: '#787b86', padding: '2px 4px' }}>{value}</span>}
                    />
                  ),
                  referenceLine: (
                    <ReferenceLine
                      y={filteredData[0].price}
                      stroke="#787b86"
                      strokeDasharray="3 3"
                      strokeWidth={1}
                      ifOverflow="extendDomain"
                    />
                  ),
                  gradient: (
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isPositive ? "#26a69a" : "#ef5350"} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={isPositive ? "#26a69a" : "#ef5350"} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  )
                };

                // Candlestick chart (using ComposedChart with reference lines)
                if (chartType === "candle") {
                  return (
                    <ComposedChart {...commonProps}>
                      {commonAxisProps.grid}
                      {commonAxisProps.gradient}
                      {commonAxisProps.xAxis}
                      {commonAxisProps.yAxis}
                      {commonAxisProps.tooltip}
                      {commonAxisProps.legend}
                      {commonAxisProps.referenceLine}

                      {/* High-Low lines */}
                      {filteredData.map((item, index) => (
                        <ReferenceLine
                          key={`hl-${index}`}
                          segment={[
                            { x: timeRange === "5min" ? item.time : item.date, y: item.low },
                            { x: timeRange === "5min" ? item.time : item.date, y: item.high }
                          ]}
                          stroke={item.open < item.price ? "var(--success-color)" : "var(--error-color)"}
                          strokeWidth={1}
                        />
                      ))}

                      {/* Open-Close rectangles */}
                      {filteredData.map((item, index) => (
                        <ReferenceLine
                          key={`oc-${index}`}
                          segment={[
                            { x: timeRange === "5min" ? item.time : item.date, y: item.open },
                            { x: timeRange === "5min" ? item.time : item.date, y: item.price }
                          ]}
                          stroke={item.open < item.price ? "var(--success-color)" : "var(--error-color)"}
                          strokeWidth={5}
                        />
                      ))}

                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke={isPositive ? "#26a69a" : "#ef5350"} /* TradingView colors */
                        strokeWidth={2}
                        dot={false}
                        activeDot={{
                          r: 4,
                          fill: isPositive ? "#26a69a" : "#ef5350",
                          stroke: "#fff",
                          strokeWidth: 2
                        }}
                        name="Close"
                        animationDuration={800}
                        isAnimationActive={true}
                        connectNulls={true}
                      />
                    </ComposedChart>
                  );
                }

                // Area chart
                else if (chartType === "area") {
                  return (
                    <ComposedChart {...commonProps}>
                      {commonAxisProps.grid}
                      {commonAxisProps.gradient}
                      {commonAxisProps.xAxis}
                      {commonAxisProps.yAxis}
                      {commonAxisProps.tooltip}
                      {commonAxisProps.legend}
                      {commonAxisProps.referenceLine}

                      <Area
                        type="monotone"
                        dataKey="price"
                        fill="url(#colorPrice)"
                        stroke={isPositive ? "#26a69a" : "#ef5350"} /* TradingView colors */
                        fillOpacity={0.5}
                        strokeWidth={1.5}
                        name="Price"
                        dot={false}
                        activeDot={{
                          r: 4,
                          fill: isPositive ? "#26a69a" : "#ef5350",
                          stroke: "#fff",
                          strokeWidth: 2
                        }}
                        animationDuration={800}
                        isAnimationActive={true}
                      />
                    </ComposedChart>
                  );
                }

                // Line chart (default)
                else {
                  return (
                    <ComposedChart {...commonProps}>
                      {commonAxisProps.grid}
                      {commonAxisProps.gradient}
                      {commonAxisProps.xAxis}
                      {commonAxisProps.yAxis}
                      {commonAxisProps.tooltip}
                      {commonAxisProps.legend}
                      {commonAxisProps.referenceLine}

                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke={isPositive ? "#26a69a" : "#ef5350"} /* TradingView colors */
                        strokeWidth={2}
                        dot={false}
                        activeDot={{
                          r: 4,
                          fill: isPositive ? "#26a69a" : "#ef5350",
                          stroke: "#fff",
                          strokeWidth: 2
                        }}
                        name="Price"
                        animationDuration={800}
                        isAnimationActive={true}
                        connectNulls={true}
                      />
                    </ComposedChart>
                  );
                }
              })()}
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="no-data">
          <FiAlertCircle className="error-icon" />
          <p>No chart data available for the selected time range</p>
          <button
            onClick={() => setTimeRange("1week")}
            className="retry-button"
          >
            Try 1 Week View
          </button>
        </div>
      )}
    </div>
  );
};

export default StockChart;
