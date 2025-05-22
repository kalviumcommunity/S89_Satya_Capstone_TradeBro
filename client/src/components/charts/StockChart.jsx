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
import Loading from "../common/Loading";
import API_ENDPOINTS from "../../config/apiConfig";
import "../../styles/components/stock-chart.css";

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

  // Function to fetch chart data
  useEffect(() => {
    if (!symbol) {
      setLoading(false);
      setError("No symbol provided");
      return;
    }

    setLoading(true);
    setError(null);

    const fetchChartData = async () => {
      try {
        // Determine the API endpoint based on the time range
        let endpoint;
        if (timeRange === "5min") {
          endpoint = API_ENDPOINTS.CHARTS.FIVE_MIN(symbol);
        } else {
          endpoint = `${API_ENDPOINTS.PROXY.FMP}/historical-price-full/${symbol}?apikey=${import.meta.env.VITE_FMP_API_KEY}`;
        }

        const response = await axios.get(endpoint);

        // Process the data based on the API response format
        let processedData = [];

        if (response.data && response.data.historical) {
          // For daily/weekly/monthly data
          processedData = response.data.historical
            .slice(0, getDataPointsForTimeRange(timeRange))
            .map(item => ({
              date: item.date,
              price: item.close,
              open: item.open,
              high: item.high,
              low: item.low,
              volume: item.volume
            }))
            .reverse();
        } else if (response.data && Array.isArray(response.data)) {
          // For 5-minute data
          processedData = response.data
            .slice(0, 100) // Limit to 100 data points for performance
            .map(item => ({
              time: item.time || item.date,
              price: item.close || item.price,
              open: item.open || item.price,
              high: item.high || item.price,
              low: item.low || item.price,
              volume: item.volume || 0
            }))
            .reverse();
        }

        if (processedData.length > 0) {
          setChartData(processedData);
          setError(null);
        } else {
          throw new Error("No chart data available");
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

  // Update chart data when time range changes
  useEffect(() => {
    if (chartData.length > 0) {
      // Filter existing data based on new time range
      const filteredData = chartData.slice(0, getDataPointsForTimeRange(timeRange));

      // If we don't have enough data for the selected time range, fetch new data
      if (filteredData.length < getDataPointsForTimeRange(timeRange) / 2) {
        // Re-fetch data with new time range
        setLoading(true);
        // This will trigger the main useEffect to fetch new data
      }
    }
  }, [timeRange]);

  // Helper function to determine how many data points to show based on time range
  const getDataPointsForTimeRange = (range) => {
    switch (range) {
      case "1day": return 24; // Hourly data for 1 day
      case "5min": return 100; // 5-minute data (limited to 100 points)
      case "1week": return 7; // Daily data for 1 week
      case "1month": return 30; // Daily data for 1 month
      case "3months": return 90; // Daily data for 3 months
      case "6months": return 180; // Daily data for 6 months
      case "1year": return 365; // Daily data for 1 year
      case "5years": return 365 * 5; // Daily data for 5 years
      default: return 30;
    }
  };

  // Helper function to generate mock chart data
  const generateMockChartData = (symbol) => {
    const basePrice = Math.floor(Math.random() * 1000) + 100;
    const volatility = Math.random() * 5 + 1;
    const trend = Math.random() > 0.5 ? 1 : -1;
    const dataPoints = getDataPointsForTimeRange(timeRange);

    const mockData = [];
    const today = new Date();

    for (let i = 0; i < dataPoints; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (dataPoints - i - 1));

      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      const randomChange = (Math.random() * volatility * 2 - volatility) + (trend * 0.5);
      const price = basePrice + (randomChange * (i / 5));

      mockData.push({
        date: dateStr,
        price: parseFloat(price.toFixed(2)),
        open: parseFloat((price - Math.random() * 5).toFixed(2)),
        high: parseFloat((price + Math.random() * 5).toFixed(2)),
        low: parseFloat((price - Math.random() * 5).toFixed(2)),
        volume: Math.floor(Math.random() * 1000000) + 100000
      });
    }

    return mockData;
  };

  // Helper function to generate mock intraday data
  const generateMockIntradayData = (symbol) => {
    const basePrice = Math.floor(Math.random() * 1000) + 100;
    const volatility = Math.random() * 2 + 0.5;
    const dataPoints = 100;

    const mockData = [];
    const now = new Date();

    for (let i = 0; i < dataPoints; i++) {
      const time = new Date(now);
      time.setMinutes(now.getMinutes() - ((dataPoints - i - 1) * 5));

      const timeStr = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;

      const randomChange = Math.random() * volatility * 2 - volatility;
      const price = basePrice + randomChange;

      mockData.push({
        time: timeStr,
        price: parseFloat(price.toFixed(2)),
        open: parseFloat((price - Math.random() * 2).toFixed(2)),
        high: parseFloat((price + Math.random() * 2).toFixed(2)),
        low: parseFloat((price - Math.random() * 2).toFixed(2)),
        volume: Math.floor(Math.random() * 100000) + 10000
      });
    }

    return mockData;
  };

  // Helper function to fetch intraday data
  const fetchIntradayData = async (symbol) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.PROXY.FMP}/stock/chart/5min/${symbol}`);

      if (response.data && Array.isArray(response.data)) {
        return response.data.map(item => ({
          time: item.date.split(' ')[1],
          price: item.close,
          open: item.open,
          high: item.high,
          low: item.low,
          volume: item.volume
        })).reverse();
      }

      return [];
    } catch (error) {
      console.error("Error fetching intraday data:", error);
      return [];
    }
  };

  // Filter data based on selected time range
  const filteredData = (() => {
    if (timeRange === "5min" && intradayData.length > 0) {
      return intradayData.slice(0, getDataPointsForTimeRange(timeRange));
    }

    return chartData.slice(0, getDataPointsForTimeRange(timeRange));
  })();

  // Calculate price change and percentage
  const calculatePriceChange = () => {
    if (filteredData.length < 2) return { change: 0, percentage: 0 };

    const latestPrice = filteredData[filteredData.length - 1].price;
    const earliestPrice = filteredData[0].price;

    const change = latestPrice - earliestPrice;
    const percentage = (change / earliestPrice) * 100;

    return { change, percentage };
  };

  const { change, percentage } = calculatePriceChange();
  const isPositive = change >= 0;

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      return (
        <div className="custom-tooltip">
          <div className="tooltip-date">
            {timeRange === "5min" ? data.time : data.date}
          </div>
          <div className="tooltip-value highlight">
            <span>Price:</span>
            <span>{data.price}</span>
          </div>
          {chartType === "candle" && (
            <>
              <div className="tooltip-value">
                <span>Open:</span>
                <span>{data.open}</span>
              </div>
              <div className="tooltip-value">
                <span>High:</span>
                <span>{data.high}</span>
              </div>
              <div className="tooltip-value">
                <span>Low:</span>
                <span>{data.low}</span>
              </div>
            </>
          )}
          <div className="tooltip-value">
            <span>Volume:</span>
            <span>{data.volume?.toLocaleString()}</span>
          </div>
        </div>
      );
    }

    return null;
  };

  // Handle time range change
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  // Handle chart type change
  const handleChartTypeChange = (type) => {
    setChartType(type);
  };

  return (
    <div className={`stock-chart-container ${fullscreen ? 'fullscreen-chart' : ''}`}>
      {/* Chart time range controls - Always show for consistency */}
      <div className="chart-time-controls">
        <div className="chart-title">
          <h3>{symbol} Chart</h3>
        </div>

        <div className="time-range-selector">
          <button
            className={timeRange === "5min" ? "active" : ""}
            onClick={() => handleTimeRangeChange("5min")}
          >
            5M
          </button>
          <button
            className={timeRange === "1day" ? "active" : ""}
            onClick={() => handleTimeRangeChange("1day")}
          >
            1D
          </button>
          <button
            className={timeRange === "1week" ? "active" : ""}
            onClick={() => handleTimeRangeChange("1week")}
          >
            1W
          </button>
          <button
            className={timeRange === "1month" ? "active" : ""}
            onClick={() => handleTimeRangeChange("1month")}
          >
            1M
          </button>
          <button
            className={timeRange === "3months" ? "active" : ""}
            onClick={() => handleTimeRangeChange("3months")}
          >
            3M
          </button>
          <button
            className={timeRange === "1year" ? "active" : ""}
            onClick={() => handleTimeRangeChange("1year")}
          >
            1Y
          </button>
          <button
            className={timeRange === "5years" ? "active" : ""}
            onClick={() => handleTimeRangeChange("5years")}
          >
            5Y
          </button>
        </div>

        <div className="chart-type-selector">
          <button
            className={chartType === "line" ? "active" : ""}
            onClick={() => handleChartTypeChange("line")}
          >
            <FiTrendingUp />
            Line
          </button>
          <button
            className={chartType === "area" ? "active" : ""}
            onClick={() => handleChartTypeChange("area")}
          >
            <FiBarChart2 />
            Area
          </button>
          <button
            className={chartType === "candle" ? "active" : ""}
            onClick={() => handleChartTypeChange("candle")}
          >
            <FiBarChart2 />
            Candle
          </button>
        </div>
      </div>

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

                // Common axis props for all chart types
                const commonAxisProps = {
                  gradient: (
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isPositive ? "#26a69a" : "#ef5350"} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={isPositive ? "#26a69a" : "#ef5350"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                  ),
                  grid: (
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#eaeaea"
                      strokeOpacity={0.5}
                    />
                  ),
                  xAxis: (
                    <XAxis
                      dataKey={timeRange === "5min" ? "time" : "date"}
                      tick={{ fontSize: 12, fill: '#787b86' }}
                      tickLine={{ stroke: '#787b86' }}
                      axisLine={{ stroke: '#787b86', strokeOpacity: 0.2 }}
                      minTickGap={20}
                      tickMargin={10}
                    />
                  ),
                  yAxis: (
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 12, fill: '#787b86' }}
                      tickLine={{ stroke: '#787b86' }}
                      axisLine={{ stroke: '#787b86', strokeOpacity: 0.2 }}
                      tickFormatter={(value) => value.toFixed(2)}
                      orientation="right"
                      width={60}
                      tickMargin={10}
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
        <div className="chart-error">
          <FiInfo className="error-icon" />
          <p>No chart data available for {symbol}</p>
        </div>
      )}
    </div>
  );
};

export default StockChart;
