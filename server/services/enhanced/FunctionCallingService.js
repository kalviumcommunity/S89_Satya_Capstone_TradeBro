const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

/**
 * Function Calling Service for dynamic function execution
 * Implements AI-driven function selection and execution
 */
class FunctionCallingService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.1, // Very low temperature for precise function calling
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024
      }
    });
    
    this.availableFunctions = this.initializeFunctions();
    this.functionCallHistory = [];
  }

  /**
   * Initialize available functions with their schemas
   */
  initializeFunctions() {
    return {
      getStockPrice: {
        name: 'getStockPrice',
        description: 'Get current stock price and basic information for a given symbol',
        parameters: {
          type: 'object',
          properties: {
            symbol: {
              type: 'string',
              description: 'Stock symbol (e.g., RELIANCE, TCS, INFY)'
            }
          },
          required: ['symbol']
        },
        function: this.getStockPrice.bind(this)
      },

      getTopMovers: {
        name: 'getTopMovers',
        description: 'Get top gaining or losing stocks in the market',
        parameters: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['gainers', 'losers'],
              description: 'Type of movers to fetch'
            },
            limit: {
              type: 'number',
              description: 'Number of stocks to return (default: 10)',
              default: 10
            }
          },
          required: ['type']
        },
        function: this.getTopMovers.bind(this)
      },

      getMarketNews: {
        name: 'getMarketNews',
        description: 'Get latest market news and updates',
        parameters: {
          type: 'object',
          properties: {
            symbol: {
              type: 'string',
              description: 'Optional stock symbol for specific news'
            },
            limit: {
              type: 'number',
              description: 'Number of news articles to return (default: 5)',
              default: 5
            }
          }
        },
        function: this.getMarketNews.bind(this)
      },

      compareStocks: {
        name: 'compareStocks',
        description: 'Compare two or more stocks side by side',
        parameters: {
          type: 'object',
          properties: {
            symbols: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of stock symbols to compare'
            }
          },
          required: ['symbols']
        },
        function: this.compareStocks.bind(this)
      },

      calculatePortfolioMetrics: {
        name: 'calculatePortfolioMetrics',
        description: 'Calculate portfolio performance metrics',
        parameters: {
          type: 'object',
          properties: {
            holdings: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  symbol: { type: 'string' },
                  quantity: { type: 'number' },
                  avgPrice: { type: 'number' }
                }
              },
              description: 'Array of portfolio holdings'
            }
          },
          required: ['holdings']
        },
        function: this.calculatePortfolioMetrics.bind(this)
      },

      getTechnicalIndicators: {
        name: 'getTechnicalIndicators',
        description: 'Get technical analysis indicators for a stock',
        parameters: {
          type: 'object',
          properties: {
            symbol: {
              type: 'string',
              description: 'Stock symbol for technical analysis'
            },
            indicators: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of indicators to calculate (RSI, MACD, SMA, EMA)',
              default: ['RSI', 'MACD', 'SMA_50', 'SMA_200']
            }
          },
          required: ['symbol']
        },
        function: this.getTechnicalIndicators.bind(this)
      },

      searchStocks: {
        name: 'searchStocks',
        description: 'Search for stocks by name or symbol',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (company name or symbol)'
            },
            limit: {
              type: 'number',
              description: 'Number of results to return (default: 10)',
              default: 10
            }
          },
          required: ['query']
        },
        function: this.searchStocks.bind(this)
      }
    };
  }

  /**
   * Main function calling interface
   */
  async processWithFunctionCalling(userQuery, context = {}) {
    try {
      console.log(`🔧 Processing query with function calling: "${userQuery}"`);

      // Determine which functions to call
      const functionCalls = await this.determineFunctionCalls(userQuery, context);
      
      if (functionCalls.length === 0) {
        return {
          success: false,
          message: "No suitable functions found for this query",
          type: 'no_functions'
        };
      }

      // Execute functions
      const results = await this.executeFunctions(functionCalls);
      
      // Generate response using function results
      const response = await this.generateResponseWithResults(userQuery, results);
      
      // Log function call history
      this.logFunctionCall(userQuery, functionCalls, results);

      return {
        success: true,
        response: response.text,
        functionCalls: functionCalls.map(fc => fc.name),
        results: results,
        tokens: response.tokens
      };

    } catch (error) {
      console.error('Function calling error:', error);
      return {
        success: false,
        error: error.message,
        type: 'function_calling_error'
      };
    }
  }

  /**
   * Determine which functions to call based on user query
   */
  async determineFunctionCalls(userQuery, context) {
    const functionsDescription = Object.values(this.availableFunctions)
      .map(func => `${func.name}: ${func.description}`)
      .join('\n');

    const prompt = `Analyze this user query and determine which functions should be called:

Query: "${userQuery}"
Context: ${JSON.stringify(context)}

Available Functions:
${functionsDescription}

For each function that should be called, provide the function name and parameters in this JSON format:
{
  "functions": [
    {
      "name": "functionName",
      "parameters": { "param1": "value1", "param2": "value2" }
    }
  ]
}

Only include functions that are directly relevant to answering the user's query.
If no functions are needed, return: {"functions": []}

Return ONLY the JSON object, no additional text.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      const cleanedResponse = this.cleanJsonResponse(response);
      const parsed = JSON.parse(cleanedResponse);
      
      return parsed.functions || [];
    } catch (error) {
      console.error('Error determining function calls:', error);
      return [];
    }
  }

  /**
   * Execute multiple functions
   */
  async executeFunctions(functionCalls) {
    const results = [];
    
    for (const call of functionCalls) {
      try {
        const func = this.availableFunctions[call.name];
        if (func) {
          console.log(`🔧 Executing function: ${call.name} with params:`, call.parameters);
          const result = await func.function(call.parameters);
          results.push({
            function: call.name,
            parameters: call.parameters,
            result: result,
            success: true
          });
        } else {
          results.push({
            function: call.name,
            parameters: call.parameters,
            error: 'Function not found',
            success: false
          });
        }
      } catch (error) {
        console.error(`Error executing ${call.name}:`, error);
        results.push({
          function: call.name,
          parameters: call.parameters,
          error: error.message,
          success: false
        });
      }
    }
    
    return results;
  }

  /**
   * Generate response using function results
   */
  async generateResponseWithResults(userQuery, functionResults) {
    const resultsText = functionResults
      .map(result => `Function: ${result.function}\nResult: ${JSON.stringify(result.result || result.error)}`)
      .join('\n\n');

    const prompt = `User asked: "${userQuery}"

Function execution results:
${resultsText}

Based on these function results, provide a comprehensive and user-friendly response to the user's query. 
Format the response with appropriate emojis, clear structure, and actionable insights.
Include relevant disclaimers for financial advice.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      return {
        text: response,
        tokens: this.estimateTokens(prompt + response)
      };
    } catch (error) {
      console.error('Error generating response with results:', error);
      return {
        text: 'Error generating response from function results',
        tokens: 0
      };
    }
  }

  // Function implementations

  /**
   * Get stock price function
   */
  async getStockPrice(params) {
    try {
      const { symbol } = params;
      const baseUrl = process.env.API_BASE_URL || 'https://s89-satya-capstone-tradebro.onrender.com';
      const response = await axios.get(`${baseUrl}/api/proxy/stock-batch?symbols=${symbol}`, {
        timeout: 5000
      });
      
      if (response.data && response.data.length > 0) {
        return response.data[0];
      }
      return null;
    } catch (error) {
      throw new Error(`Failed to get stock price for ${params.symbol}: ${error.message}`);
    }
  }

  /**
   * Get top movers function
   */
  async getTopMovers(params) {
    try {
      const { type, limit = 10 } = params;
      const baseUrl = process.env.API_BASE_URL || 'https://s89-satya-capstone-tradebro.onrender.com';
      const response = await axios.get(`${baseUrl}/api/proxy/top-${type}`, {
        timeout: 5000
      });
      
      return response.data ? response.data.slice(0, limit) : [];
    } catch (error) {
      throw new Error(`Failed to get top ${params.type}: ${error.message}`);
    }
  }

  /**
   * Get market news function
   */
  async getMarketNews(params) {
    try {
      const { symbol, limit = 5 } = params;
      const baseUrl = process.env.API_BASE_URL || 'https://s89-satya-capstone-tradebro.onrender.com';
      let url = `${baseUrl}/api/proxy/market-news`;
      if (symbol) {
        url += `?symbol=${symbol}`;
      }
      
      const response = await axios.get(url, { timeout: 5000 });
      return response.data ? response.data.slice(0, limit) : [];
    } catch (error) {
      throw new Error(`Failed to get market news: ${error.message}`);
    }
  }

  /**
   * Compare stocks function
   */
  async compareStocks(params) {
    try {
      const { symbols } = params;
      const stockData = [];
      
      for (const symbol of symbols) {
        const data = await this.getStockPrice({ symbol });
        if (data) {
          stockData.push(data);
        }
      }
      
      return stockData;
    } catch (error) {
      throw new Error(`Failed to compare stocks: ${error.message}`);
    }
  }

  /**
   * Calculate portfolio metrics function
   */
  async calculatePortfolioMetrics(params) {
    try {
      const { holdings } = params;
      let totalValue = 0;
      let totalInvestment = 0;
      const detailedHoldings = [];
      
      for (const holding of holdings) {
        const stockData = await this.getStockPrice({ symbol: holding.symbol });
        if (stockData) {
          const currentValue = stockData.price * holding.quantity;
          const investedValue = holding.avgPrice * holding.quantity;
          const pnl = currentValue - investedValue;
          const pnlPercent = (pnl / investedValue) * 100;
          
          totalValue += currentValue;
          totalInvestment += investedValue;
          
          detailedHoldings.push({
            ...holding,
            currentPrice: stockData.price,
            currentValue,
            investedValue,
            pnl,
            pnlPercent
          });
        }
      }
      
      const totalPnl = totalValue - totalInvestment;
      const totalPnlPercent = (totalPnl / totalInvestment) * 100;
      
      return {
        totalValue,
        totalInvestment,
        totalPnl,
        totalPnlPercent,
        holdings: detailedHoldings
      };
    } catch (error) {
      throw new Error(`Failed to calculate portfolio metrics: ${error.message}`);
    }
  }

  /**
   * Get technical indicators function
   */
  async getTechnicalIndicators(params) {
    try {
      const { symbol, indicators = ['RSI', 'MACD', 'SMA_50', 'SMA_200'] } = params;
      
      // Mock technical indicators (in real implementation, use technical analysis library)
      const mockIndicators = {
        RSI: Math.random() * 100,
        MACD: Math.random() > 0.5 ? 'bullish' : 'bearish',
        SMA_50: Math.random() * 3000 + 1000,
        SMA_200: Math.random() * 3000 + 1000,
        EMA_12: Math.random() * 3000 + 1000,
        EMA_26: Math.random() * 3000 + 1000
      };
      
      const result = {};
      indicators.forEach(indicator => {
        if (mockIndicators[indicator] !== undefined) {
          result[indicator] = mockIndicators[indicator];
        }
      });
      
      return result;
    } catch (error) {
      throw new Error(`Failed to get technical indicators: ${error.message}`);
    }
  }

  /**
   * Search stocks function
   */
  async searchStocks(params) {
    try {
      const { query, limit = 10 } = params;
      
      // Mock stock search (in real implementation, use stock search API)
      const mockResults = [
        { symbol: 'RELIANCE', name: 'Reliance Industries Ltd' },
        { symbol: 'TCS', name: 'Tata Consultancy Services' },
        { symbol: 'INFY', name: 'Infosys Ltd' },
        { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd' },
        { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd' }
      ].filter(stock => 
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, limit);
      
      return mockResults;
    } catch (error) {
      throw new Error(`Failed to search stocks: ${error.message}`);
    }
  }

  /**
   * Clean JSON response
   */
  cleanJsonResponse(response) {
    let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const firstBrace = cleaned.indexOf('{');
    if (firstBrace > 0) {
      cleaned = cleaned.substring(firstBrace);
    }
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace < cleaned.length - 1) {
      cleaned = cleaned.substring(0, lastBrace + 1);
    }
    return cleaned.trim();
  }

  /**
   * Log function call for monitoring
   */
  logFunctionCall(query, functionCalls, results) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      query,
      functionCalls: functionCalls.map(fc => fc.name),
      success: results.every(r => r.success),
      executionTime: Date.now()
    };
    
    this.functionCallHistory.push(logEntry);
    console.log('🔧 Function call logged:', logEntry);
  }

  /**
   * Get function call history
   */
  getFunctionCallHistory() {
    return this.functionCallHistory;
  }

  /**
   * Get available functions list
   */
  getAvailableFunctions() {
    return Object.keys(this.availableFunctions);
  }

  /**
   * Estimate token count
   */
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }
}

module.exports = FunctionCallingService;