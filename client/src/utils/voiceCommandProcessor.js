/**
 * Advanced Voice Command Processor
 * Handles complex voice commands with context and actions
 */

export class VoiceCommandProcessor {
  constructor() {
    this.initializePatterns();
  }

  initializePatterns() {
    this.commandPatterns = [
      // Chart commands - Enhanced for any stock
      {
        pattern: /(?:open|show|display)\s+(?:chart|charts|graph)\s+(?:for|of)\s+([A-Za-z0-9]+)/i,
        action: 'openChart',
        extract: (match) => ({ symbol: this.normalizeSymbol(match[1]) })
      },
      {
        pattern: /(?:chart|charts)\s+(?:for|of)\s+([A-Za-z0-9]+)/i,
        action: 'openChart',
        extract: (match) => ({ symbol: this.normalizeSymbol(match[1]) })
      },
      {
        pattern: /([A-Za-z0-9]+)\s+chart/i,
        action: 'openChart',
        extract: (match) => ({ symbol: this.normalizeSymbol(match[1]) })
      },
      
      // Stock price commands - Enhanced for any stock
      {
        pattern: /(?:what|show|tell)\s+(?:is|me)?\s*(?:the)?\s*(?:price|quote)\s+(?:of|for)\s+([A-Za-z0-9]+)/i,
        action: 'getStockPrice',
        extract: (match) => ({ symbol: this.normalizeSymbol(match[1]) })
      },
      {
        pattern: /([A-Za-z0-9]+)\s+(?:stock\s+)?price/i,
        action: 'getStockPrice',
        extract: (match) => ({ symbol: this.normalizeSymbol(match[1]) })
      },
      {
        pattern: /price\s+(?:of|for)\s+([A-Za-z0-9]+)/i,
        action: 'getStockPrice',
        extract: (match) => ({ symbol: this.normalizeSymbol(match[1]) })
      },
      
      // Buy/Sell commands - Enhanced for any stock
      {
        pattern: /(?:buy|purchase)\s+([A-Za-z0-9]+)(?:\s+stock)?/i,
        action: 'buyStock',
        extract: (match) => ({ symbol: this.normalizeSymbol(match[1]) })
      },
      {
        pattern: /(?:sell)\s+([A-Za-z0-9]+)(?:\s+stock)?/i,
        action: 'sellStock',
        extract: (match) => ({ symbol: this.normalizeSymbol(match[1]) })
      },
      
      // Navigation commands
      {
        pattern: /(?:go\s+to|open|navigate\s+to)\s+(dashboard|portfolio|watchlist|news|trading|charts)/i,
        action: 'navigate',
        extract: (match) => ({ page: match[1].toLowerCase() })
      },
      
      // Market data commands
      {
        pattern: /(?:show|get|display)\s+(?:top\s+)?(gainers|losers|movers)/i,
        action: 'getMarketMovers',
        extract: (match) => ({ type: match[1].toLowerCase() })
      },
      
      // News commands
      {
        pattern: /(?:show|get|latest)\s+(?:market\s+)?news(?:\s+for\s+([A-Za-z]+))?/i,
        action: 'getNews',
        extract: (match) => ({ symbol: match[1]?.toUpperCase() || null })
      },
      
      // Portfolio commands
      {
        pattern: /(?:show|display|open)\s+(?:my\s+)?portfolio/i,
        action: 'showPortfolio',
        extract: () => ({})
      },
      
      // Watchlist commands - Enhanced for any stock
      {
        pattern: /(?:add|put)\s+([A-Za-z0-9]+)\s+(?:to\s+)?(?:watchlist|watch\s+list)/i,
        action: 'addToWatchlist',
        extract: (match) => ({ symbol: this.normalizeSymbol(match[1]) })
      }
    ];
  }

  processCommand(voiceText) {
    console.log('Processing voice command:', voiceText);
    
    for (const pattern of this.commandPatterns) {
      const match = voiceText.match(pattern.pattern);
      if (match) {
        const data = pattern.extract(match);
        console.log('Matched pattern:', pattern.action, data);
        
        return {
          action: pattern.action,
          data: data,
          originalText: voiceText,
          confidence: this.calculateConfidence(match)
        };
      }
    }
    
    // No specific pattern matched, return general query
    return {
      action: 'generalQuery',
      data: { query: voiceText },
      originalText: voiceText,
      confidence: 0.5
    };
  }

  normalizeSymbol(symbol) {
    // Normalize stock symbol - handle common variations
    const symbolMap = {
      'zomato': 'ZOMATO',
      'reliance': 'RELIANCE', 
      'tcs': 'TCS',
      'infosys': 'INFY',
      'hdfc': 'HDFCBANK',
      'icici': 'ICICIBANK',
      'sbi': 'SBIN',
      'wipro': 'WIPRO',
      'bharti': 'BHARTIARTL',
      'airtel': 'BHARTIARTL',
      'maruti': 'MARUTI',
      'titan': 'TITAN',
      'asian': 'ASIANPAINT',
      'bajaj': 'BAJFINANCE',
      'kotak': 'KOTAKBANK',
      'axis': 'AXISBANK'
    };
    
    const normalized = symbol.toLowerCase();
    return symbolMap[normalized] || symbol.toUpperCase();
  }

  calculateConfidence(match) {
    // Simple confidence calculation based on match quality
    const matchLength = match[0].length;
    const totalLength = match.input.length;
    return Math.min(0.9, matchLength / totalLength + 0.3);
  }

  // Execute the processed command
  async executeCommand(command, context) {
    const { action, data } = command;
    
    switch (action) {
      case 'openChart':
        return this.handleChartCommand(data, context);
        
      case 'getStockPrice':
        return this.handleStockPriceCommand(data, context);
        
      case 'buyStock':
        return this.handleBuyCommand(data, context);
        
      case 'sellStock':
        return this.handleSellCommand(data, context);
        
      case 'navigate':
        return this.handleNavigationCommand(data, context);
        
      case 'getMarketMovers':
        return this.handleMarketMoversCommand(data, context);
        
      case 'getNews':
        return this.handleNewsCommand(data, context);
        
      case 'showPortfolio':
        return this.handlePortfolioCommand(data, context);
        
      case 'addToWatchlist':
        return this.handleWatchlistCommand(data, context);
        
      default:
        return this.handleGeneralQuery(data, context);
    }
  }

  async handleChartCommand(data, context) {
    const { symbol } = data;
    
    // Navigate to charts page with symbol
    if (context.navigate) {
      context.navigate(`/charts?symbol=${symbol}`);
    }
    
    // Also send a message to get stock data
    if (context.sendMessage) {
      await context.sendMessage(`Show me ${symbol} chart and price data`);
    }
    
    return {
      success: true,
      message: `Opening ${symbol} chart...`,
      action: 'chart_opened',
      symbol: symbol
    };
  }

  async handleStockPriceCommand(data, context) {
    const { symbol } = data;
    
    if (context.sendMessage) {
      await context.sendMessage(`Get ${symbol} stock price and details`);
    }
    
    return {
      success: true,
      message: `Getting ${symbol} stock price...`,
      action: 'price_requested',
      symbol: symbol
    };
  }

  async handleBuyCommand(data, context) {
    const { symbol } = data;
    
    if (context.sendMessage) {
      await context.sendMessage(`I want to buy ${symbol} stock`);
    }
    
    return {
      success: true,
      message: `Initiating buy order for ${symbol}...`,
      action: 'buy_initiated',
      symbol: symbol
    };
  }

  async handleSellCommand(data, context) {
    const { symbol } = data;
    
    if (context.sendMessage) {
      await context.sendMessage(`I want to sell ${symbol} stock`);
    }
    
    return {
      success: true,
      message: `Initiating sell order for ${symbol}...`,
      action: 'sell_initiated',
      symbol: symbol
    };
  }

  async handleNavigationCommand(data, context) {
    const { page } = data;
    const pageMap = {
      'dashboard': '/dashboard',
      'portfolio': '/portfolio',
      'watchlist': '/watchlist',
      'news': '/news',
      'trading': '/trading',
      'charts': '/charts'
    };
    
    if (context.navigate && pageMap[page]) {
      context.navigate(pageMap[page]);
    }
    
    return {
      success: true,
      message: `Navigating to ${page}...`,
      action: 'navigation',
      page: page
    };
  }

  async handleMarketMoversCommand(data, context) {
    const { type } = data;
    
    if (context.sendMessage) {
      await context.sendMessage(`Show me top ${type} in the market`);
    }
    
    return {
      success: true,
      message: `Getting top ${type}...`,
      action: 'market_movers',
      type: type
    };
  }

  async handleNewsCommand(data, context) {
    const { symbol } = data;
    const query = symbol ? `Latest news for ${symbol}` : 'Latest market news';
    
    if (context.sendMessage) {
      await context.sendMessage(query);
    }
    
    return {
      success: true,
      message: symbol ? `Getting ${symbol} news...` : 'Getting market news...',
      action: 'news_requested',
      symbol: symbol
    };
  }

  async handlePortfolioCommand(data, context) {
    if (context.navigate) {
      context.navigate('/portfolio');
    }
    
    if (context.sendMessage) {
      await context.sendMessage('Show my portfolio performance');
    }
    
    return {
      success: true,
      message: 'Opening your portfolio...',
      action: 'portfolio_opened'
    };
  }

  async handleWatchlistCommand(data, context) {
    const { symbol } = data;
    
    if (context.sendMessage) {
      await context.sendMessage(`Add ${symbol} to my watchlist`);
    }
    
    return {
      success: true,
      message: `Adding ${symbol} to watchlist...`,
      action: 'watchlist_add',
      symbol: symbol
    };
  }

  async handleGeneralQuery(data, context) {
    const { query } = data;
    
    if (context.sendMessage) {
      await context.sendMessage(query);
    }
    
    return {
      success: true,
      message: 'Processing your request...',
      action: 'general_query',
      query: query
    };
  }
}

export default VoiceCommandProcessor;