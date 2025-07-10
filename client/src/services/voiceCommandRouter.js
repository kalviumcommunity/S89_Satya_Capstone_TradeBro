/**
 * Enhanced Voice Command Router with NLP capabilities
 * Handles voice command interpretation and routing for Saytrix
 */

class VoiceCommandRouter {
  constructor() {
    this.commands = new Map();
    this.aliases = new Map();
    this.context = {
      lastCommand: null,
      lastEntity: null,
      conversationHistory: []
    };
    
    this.initializeCommands();
    this.initializeAliases();
  }

  /**
   * Initialize command patterns and handlers
   */
  initializeCommands() {
    // Navigation commands
    this.addCommand('navigation', {
      patterns: [
        /(?:go to|navigate to|open|show me|take me to)\s+(dashboard|home|portfolio|login|signup|market|stocks?|profile)/i,
        /(?:dashboard|home|portfolio|login|signup|market)/i
      ],
      handler: this.handleNavigation.bind(this),
      examples: ['go to dashboard', 'open portfolio', 'take me to login']
    });

    // Stock query commands
    this.addCommand('stock_query', {
      patterns: [
        /(?:show me|get|find|search for|what about|how is|tell me about)\s+([A-Z]{2,6}|[a-zA-Z\s]+)\s*(?:stock|share|price)?/i,
        /(?:price of|stock price for)\s+([A-Z]{2,6}|[a-zA-Z\s]+)/i
      ],
      handler: this.handleStockQuery.bind(this),
      examples: ['show me TCS stock', 'what about Reliance', 'price of INFY']
    });

    // Market data commands
    this.addCommand('market_data', {
      patterns: [
        /(?:how is|what's|show me|get)\s+(?:the\s+)?(nifty|sensex|market|indices?)/i,
        /(?:market status|market update|indices update)/i
      ],
      handler: this.handleMarketData.bind(this),
      examples: ['how is NIFTY doing', 'show me market status', 'what\'s the Sensex']
    });

    // Portfolio commands
    this.addCommand('portfolio', {
      patterns: [
        /(?:show|display|get|what's)\s+(?:my\s+)?portfolio/i,
        /(?:portfolio status|my investments|my holdings)/i,
        /(?:profit|loss|p&l|pnl)/i
      ],
      handler: this.handlePortfolio.bind(this),
      examples: ['show my portfolio', 'portfolio status', 'what\'s my P&L']
    });

    // Trading commands
    this.addCommand('trading', {
      patterns: [
        /(?:buy|sell|trade)\s+([A-Z]{2,6}|[a-zA-Z\s]+)/i,
        /(?:place order|add to portfolio|remove from portfolio)/i
      ],
      handler: this.handleTrading.bind(this),
      examples: ['buy TCS', 'sell Reliance', 'add to portfolio']
    });

    // Help and information commands
    this.addCommand('help', {
      patterns: [
        /(?:help|what can you do|commands|how to use)/i,
        /(?:show commands|list commands|available commands)/i
      ],
      handler: this.handleHelp.bind(this),
      examples: ['help', 'what can you do', 'show commands']
    });

    // Context-aware follow-up commands
    this.addCommand('followup', {
      patterns: [
        /(?:now show me|then show|also show|what about)\s+([A-Z]{2,6}|[a-zA-Z\s]+)/i,
        /(?:compare with|vs|versus)\s+([A-Z]{2,6}|[a-zA-Z\s]+)/i
      ],
      handler: this.handleFollowUp.bind(this),
      examples: ['now show me Reliance', 'compare with HDFC', 'what about Infosys']
    });
  }

  /**
   * Initialize command aliases and synonyms
   */
  initializeAliases() {
    // Stock symbol aliases
    this.aliases.set('tcs', 'TCS');
    this.aliases.set('reliance', 'RELIANCE');
    this.aliases.set('infosys', 'INFY');
    this.aliases.set('hdfc', 'HDFCBANK');
    this.aliases.set('icici', 'ICICIBANK');
    this.aliases.set('wipro', 'WIPRO');
    this.aliases.set('bharti airtel', 'BHARTIARTL');
    this.aliases.set('state bank', 'SBIN');
    this.aliases.set('itc', 'ITC');

    // Navigation aliases
    this.aliases.set('home', 'dashboard');
    this.aliases.set('main', 'dashboard');
    this.aliases.set('stocks', 'market');
    this.aliases.set('shares', 'market');
  }

  /**
   * Add a new command pattern
   */
  addCommand(name, config) {
    this.commands.set(name, config);
  }

  /**
   * Process voice command and route to appropriate handler
   */
  async processCommand(transcript) {
    try {
      console.log('🎤 Processing voice command:', transcript);
      
      // Clean and normalize the transcript
      const cleanTranscript = this.normalizeTranscript(transcript);
      
      // Find matching command
      const matchedCommand = this.findMatchingCommand(cleanTranscript);
      
      if (matchedCommand) {
        console.log('✅ Command matched:', matchedCommand.name);
        
        // Update context
        this.updateContext(matchedCommand.name, cleanTranscript, matchedCommand.entities);
        
        // Execute command handler
        const result = await matchedCommand.config.handler(matchedCommand.entities, cleanTranscript);
        
        return {
          success: true,
          command: matchedCommand.name,
          result,
          transcript: cleanTranscript
        };
      } else {
        console.log('❌ No command matched for:', cleanTranscript);
        return {
          success: false,
          error: 'Command not recognized',
          transcript: cleanTranscript,
          suggestions: this.getSuggestions()
        };
      }
    } catch (error) {
      console.error('❌ Error processing command:', error);
      return {
        success: false,
        error: error.message,
        transcript
      };
    }
  }

  /**
   * Normalize transcript for better matching
   */
  normalizeTranscript(transcript) {
    return transcript
      .toLowerCase()
      .trim()
      .replace(/[.,!?;]/g, '') // Remove punctuation
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Find matching command pattern
   */
  findMatchingCommand(transcript) {
    for (const [name, config] of this.commands) {
      for (const pattern of config.patterns) {
        const match = transcript.match(pattern);
        if (match) {
          return {
            name,
            config,
            match,
            entities: this.extractEntities(match, transcript)
          };
        }
      }
    }
    return null;
  }

  /**
   * Extract entities from matched command
   */
  extractEntities(match, transcript) {
    const entities = {};
    
    // Extract stock symbols or company names
    if (match[1]) {
      const entity = match[1].trim();
      entities.stock = this.resolveAlias(entity);
      entities.originalEntity = entity;
    }
    
    // Extract additional context
    if (transcript.includes('buy')) entities.action = 'buy';
    if (transcript.includes('sell')) entities.action = 'sell';
    if (transcript.includes('compare')) entities.action = 'compare';
    
    return entities;
  }

  /**
   * Resolve aliases to actual symbols
   */
  resolveAlias(entity) {
    const normalized = entity.toLowerCase();
    return this.aliases.get(normalized) || entity.toUpperCase();
  }

  /**
   * Update conversation context
   */
  updateContext(command, transcript, entities) {
    this.context.lastCommand = command;
    this.context.lastEntity = entities.stock || entities.originalEntity;
    this.context.conversationHistory.push({
      command,
      transcript,
      entities,
      timestamp: new Date()
    });
    
    // Keep only last 10 commands in history
    if (this.context.conversationHistory.length > 10) {
      this.context.conversationHistory.shift();
    }
  }

  /**
   * Command Handlers
   */
  async handleNavigation(entities, transcript) {
    const destination = entities.originalEntity || 
                       transcript.match(/(?:dashboard|home|portfolio|login|signup|market|stocks?|profile)/i)?.[0];
    
    if (destination) {
      const route = this.aliases.get(destination.toLowerCase()) || destination.toLowerCase();
      
      // Navigate using React Router
      if (window.navigate) {
        window.navigate(`/${route}`);
      } else if (window.location) {
        window.location.href = `/${route}`;
      }
      
      return {
        action: 'navigate',
        destination: route,
        message: `Navigating to ${destination}`
      };
    }
    
    throw new Error('Navigation destination not specified');
  }

  async handleStockQuery(entities, transcript) {
    const stockSymbol = entities.stock;
    
    if (stockSymbol) {
      // Trigger stock data fetch
      if (window.showStockDetails) {
        window.showStockDetails(stockSymbol);
      }
      
      return {
        action: 'stock_query',
        symbol: stockSymbol,
        message: `Showing details for ${stockSymbol}`
      };
    }
    
    throw new Error('Stock symbol not specified');
  }

  async handleMarketData(entities, transcript) {
    // Navigate to market/dashboard page
    if (window.navigate) {
      window.navigate('/dashboard');
    }
    
    return {
      action: 'market_data',
      message: 'Showing market data and indices'
    };
  }

  async handlePortfolio(entities, transcript) {
    // Navigate to portfolio page
    if (window.navigate) {
      window.navigate('/portfolio');
    }
    
    return {
      action: 'portfolio',
      message: 'Showing your portfolio'
    };
  }

  async handleTrading(entities, transcript) {
    const action = entities.action;
    const stock = entities.stock;

    if (action && stock) {
      // Import trading engine dynamically
      const { default: tradingEngine } = await import('./tradingEngine');

      // Check if user has holdings for sell orders
      const availableActions = tradingEngine.getAvailableActions(stock);

      if (action === 'sell' && !availableActions.canSell) {
        throw new Error(`You don't have any holdings in ${stock} to sell`);
      }

      if (action === 'buy' && !availableActions.canBuy) {
        throw new Error('Insufficient balance to place buy order');
      }

      // Open trading modal with voice command context
      if (window.openTradingModal) {
        window.openTradingModal(stock, action.toUpperCase(), {
          source: 'voice',
          transcript,
          availableActions
        });
      }

      // For quick market orders via voice (optional)
      if (transcript.includes('market order') || transcript.includes('at market')) {
        // Get current price and execute immediately
        if (window.getCurrentStockPrice) {
          const currentPrice = await window.getCurrentStockPrice(stock);
          if (currentPrice) {
            // Default quantity for voice orders (can be customized)
            const defaultQuantity = action === 'buy' ? 1 : Math.min(10, availableActions.maxSellQuantity);

            const result = await tradingEngine.executeTrade(
              stock,
              defaultQuantity,
              currentPrice,
              action.toUpperCase(),
              'MARKET'
            );

            if (result.success) {
              return {
                action: 'trading',
                tradeAction: action,
                symbol: stock,
                executed: true,
                quantity: defaultQuantity,
                price: currentPrice,
                message: `${action.toUpperCase()} order executed: ${defaultQuantity} ${stock} @ ₹${currentPrice.toFixed(2)}`
              };
            } else {
              throw new Error(result.error);
            }
          }
        }
      }

      return {
        action: 'trading',
        tradeAction: action,
        symbol: stock,
        message: `Opening ${action} order for ${stock}`,
        availableActions
      };
    }

    throw new Error('Trading action or stock not specified');
  }

  async handleFollowUp(entities, transcript) {
    const newEntity = entities.stock || entities.originalEntity;
    
    if (this.context.lastCommand === 'stock_query' && newEntity) {
      // Handle follow-up stock query
      return await this.handleStockQuery({ stock: newEntity }, transcript);
    }
    
    throw new Error('Follow-up context not available');
  }

  async handleHelp(entities, transcript) {
    const examples = [];
    for (const [name, config] of this.commands) {
      examples.push(...config.examples);
    }
    
    return {
      action: 'help',
      message: 'Here are some commands you can try',
      examples: examples.slice(0, 6) // Show first 6 examples
    };
  }

  /**
   * Get command suggestions
   */
  getSuggestions() {
    const suggestions = [
      'Try saying "go to dashboard"',
      'Ask "show me TCS stock"',
      'Say "how is NIFTY doing"',
      'Try "show my portfolio"'
    ];
    
    return suggestions;
  }

  /**
   * Get conversation context
   */
  getContext() {
    return this.context;
  }

  /**
   * Clear conversation context
   */
  clearContext() {
    this.context = {
      lastCommand: null,
      lastEntity: null,
      conversationHistory: []
    };
  }
}

// Export singleton instance
export default new VoiceCommandRouter();
