// Note: Install fuse.js with: npm install fuse.js
// For now, we'll implement a lightweight fuzzy search alternative
// const Fuse = require('fuse.js');

/**
 * Enhanced Stock Symbol Extractor with fuzzy matching and typo tolerance
 * Supports Indian and international stocks with company name mapping
 */
class StockSymbolExtractor {
  constructor() {
    this.initializeCompanyMappings();
    this.initializeFuzzySearch();
  }

  /**
   * Initialize comprehensive company name to symbol mappings
   */
  initializeCompanyMappings() {
    this.companyMappings = {
      // Major Indian Companies
      'reliance': 'RELIANCE',
      'reliance industries': 'RELIANCE',
      'ril': 'RELIANCE',
      'tcs': 'TCS',
      'tata consultancy': 'TCS',
      'tata consultancy services': 'TCS',
      'infosys': 'INFY',
      'infy': 'INFY',
      'hdfc bank': 'HDFCBANK',
      'hdfc': 'HDFCBANK',
      'icici bank': 'ICICIBANK',
      'icici': 'ICICIBANK',
      'state bank': 'SBIN',
      'sbi': 'SBIN',
      'state bank of india': 'SBIN',
      'itc': 'ITC',
      'larsen': 'LT',
      'larsen and toubro': 'LT',
      'l&t': 'LT',
      'bharti airtel': 'BHARTIARTL',
      'airtel': 'BHARTIARTL',
      'asian paints': 'ASIANPAINT',
      'asian paint': 'ASIANPAINT',
      'wipro': 'WIPRO',
      'hcl': 'HCLTECH',
      'hcl technologies': 'HCLTECH',
      'tech mahindra': 'TECHM',
      'mahindra tech': 'TECHM',
      'maruti': 'MARUTI',
      'maruti suzuki': 'MARUTI',
      'tata motors': 'TATAMOTORS',
      'mahindra': 'M&M',
      'bajaj finance': 'BAJFINANCE',
      'bajaj': 'BAJFINANCE',
      'kotak': 'KOTAKBANK',
      'kotak bank': 'KOTAKBANK',
      'axis bank': 'AXISBANK',
      'axis': 'AXISBANK',
      'yes bank': 'YESBANK',
      'indusind': 'INDUSINDBK',
      'adani': 'ADANIPORTS',
      'adani ports': 'ADANIPORTS',
      'sun pharma': 'SUNPHARMA',
      'sun pharmaceutical': 'SUNPHARMA',
      'dr reddy': 'DRREDDY',
      'dr reddys': 'DRREDDY',
      'cipla': 'CIPLA',
      'lupin': 'LUPIN',
      'biocon': 'BIOCON',
      'titan': 'TITAN',
      'tanishq': 'TITAN',
      'nestle': 'NESTLEIND',
      'nestle india': 'NESTLEIND',
      'hindustan unilever': 'HINDUNILVR',
      'hul': 'HINDUNILVR',
      'unilever': 'HINDUNILVR',
      'britannia': 'BRITANNIA',
      'dabur': 'DABUR',
      'marico': 'MARICO',
      'colgate': 'COLPAL',
      'pidilite': 'PIDILITIND',
      'berger': 'BERGEPAINT',
      'berger paints': 'BERGEPAINT',
      'ultratech': 'ULTRACEMCO',
      'ultratech cement': 'ULTRACEMCO',
      'acc cement': 'ACC',
      'acc': 'ACC',
      'ambuja': 'AMBUJACEM',
      'ambuja cement': 'AMBUJACEM',
      'grasim': 'GRASIM',
      'jsw': 'JSWSTEEL',
      'jsw steel': 'JSWSTEEL',
      'tata steel': 'TATASTEEL',
      'sail': 'SAIL',
      'hindalco': 'HINDALCO',
      'vedanta': 'VEDL',
      'coal india': 'COALINDIA',
      'ongc': 'ONGC',
      'ioc': 'IOC',
      'indian oil': 'IOC',
      'bpcl': 'BPCL',
      'bharat petroleum': 'BPCL',
      'hpcl': 'HPCL',
      'hindustan petroleum': 'HPCL',
      'gail': 'GAIL',
      'ntpc': 'NTPC',
      'power grid': 'POWERGRID',
      'powergrid': 'POWERGRID',
      'bhel': 'BHEL',
      'lic': 'LICI',
      'life insurance corporation': 'LICI',
      'sbi life': 'SBILIFE',
      'hdfc life': 'HDFCLIFE',
      'icici prudential': 'ICICIPRULI',
      'hero motocorp': 'HEROMOTOCO',
      'hero': 'HEROMOTOCO',
      'bajaj auto': 'BAJAJ-AUTO',
      'tvs motor': 'TVSMOTOR',
      'tvs': 'TVSMOTOR',
      'eicher': 'EICHERMOT',
      'royal enfield': 'EICHERMOT',
      'ashok leyland': 'ASHOKLEY',
      'tata consumer': 'TATACONSUM',
      'godrej consumer': 'GODREJCP',
      'godrej': 'GODREJCP',
      'emami': 'EMAMILTD',
      'jubilant': 'JUBLFOOD',
      'dominos': 'JUBLFOOD',
      'zomato': 'ZOMATO',
      'swiggy': 'SWIGGY',
      'paytm': 'PAYTM',
      'nykaa': 'NYKAA',
      'policybazaar': 'PB',
      
      // International Companies (commonly searched)
      'apple': 'AAPL',
      'microsoft': 'MSFT',
      'google': 'GOOGL',
      'alphabet': 'GOOGL',
      'amazon': 'AMZN',
      'tesla': 'TSLA',
      'meta': 'META',
      'facebook': 'META',
      'netflix': 'NFLX',
      'nvidia': 'NVDA',
      'intel': 'INTC',
      'amd': 'AMD',
      'oracle': 'ORCL',
      'salesforce': 'CRM',
      'adobe': 'ADBE',
      'paypal': 'PYPL',
      'visa': 'V',
      'mastercard': 'MA',
      'coca cola': 'KO',
      'pepsi': 'PEP',
      'mcdonalds': 'MCD',
      'starbucks': 'SBUX',
      'walmart': 'WMT',
      'disney': 'DIS',
      'boeing': 'BA',
      'general electric': 'GE',
      'johnson and johnson': 'JNJ',
      'pfizer': 'PFE',
      'moderna': 'MRNA'
    };

    // Create reverse mapping for fuzzy search
    this.symbolToCompany = {};
    Object.entries(this.companyMappings).forEach(([company, symbol]) => {
      if (!this.symbolToCompany[symbol]) {
        this.symbolToCompany[symbol] = [];
      }
      this.symbolToCompany[symbol].push(company);
    });
  }

  /**
   * Initialize fuzzy search (lightweight implementation)
   */
  initializeFuzzySearch() {
    // Prepare data for fuzzy search
    this.searchData = Object.keys(this.companyMappings).map(company => ({
      name: company,
      symbol: this.companyMappings[company]
    }));

    // Lightweight fuzzy search implementation
    this.fuzzySearch = (query, data, threshold = 0.4) => {
      const results = [];
      const queryLower = query.toLowerCase();

      for (const item of data) {
        const score = this.calculateSimilarity(queryLower, item.name.toLowerCase());
        if (score >= threshold) {
          results.push({ item, score: 1 - score }); // Invert score for consistency
        }
      }

      return results.sort((a, b) => a.score - b.score);
    };
  }

  /**
   * Extract stock symbol from user message with enhanced matching
   * @param {string} userMessage - User's input message
   * @param {Array} regexMatch - Optional regex match results
   * @returns {string|null} - Extracted stock symbol or null
   */
  extractSymbol(userMessage, regexMatch = null) {
    // Try regex match first
    const regexSymbol = this.extractFromRegex(userMessage, regexMatch);
    if (regexSymbol) {
      return regexSymbol;
    }

    // Try direct symbol pattern matching
    const directSymbol = this.extractDirectSymbol(userMessage);
    if (directSymbol) {
      return directSymbol;
    }

    // Try company name mapping with fuzzy search
    const fuzzySymbol = this.extractWithFuzzySearch(userMessage);
    if (fuzzySymbol) {
      return fuzzySymbol;
    }

    // Try partial matching for common abbreviations
    const partialSymbol = this.extractPartialMatch(userMessage);
    if (partialSymbol) {
      return partialSymbol;
    }

    return null;
  }

  /**
   * Extract symbol from regex match
   */
  extractFromRegex(userMessage, match) {
    if (match && match[1]) {
      let symbol = match[1].trim().toUpperCase();
      // Clean common words
      symbol = symbol.replace(/\b(STOCK|SHARE|COMPANY|DATA|PRICE|INFO|ABOUT|TELL|SHOW|GIVE)\b/g, '').trim();
      
      if (this.isValidSymbol(symbol)) {
        return symbol;
      }
    }
    return null;
  }

  /**
   * Extract direct stock symbols from message
   */
  extractDirectSymbol(userMessage) {
    // Look for stock symbol patterns
    const symbolPatterns = [
      /\b([A-Z]{2,10})\b/g,  // 2-10 uppercase letters
      /\b([A-Z]+\.[A-Z]{2,3})\b/g,  // Symbol with exchange suffix (e.g., RELIANCE.NS)
      /\b([A-Z]+-[A-Z]+)\b/g  // Hyphenated symbols (e.g., BAJAJ-AUTO)
    ];

    for (const pattern of symbolPatterns) {
      const matches = userMessage.match(pattern);
      if (matches) {
        for (const match of matches) {
          const cleanSymbol = match.trim().toUpperCase();
          if (this.isValidSymbol(cleanSymbol) && !this.isCommonWord(cleanSymbol)) {
            return cleanSymbol;
          }
        }
      }
    }
    return null;
  }

  /**
   * Extract symbol using fuzzy search for company names
   */
  extractWithFuzzySearch(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    // First try exact matches
    for (const [company, symbol] of Object.entries(this.companyMappings)) {
      if (lowerMessage.includes(company)) {
        return symbol;
      }
    }

    // Then try fuzzy matching
    const words = lowerMessage.split(/\s+/);
    const phrases = this.generatePhrases(words);

    for (const phrase of phrases) {
      const results = this.fuzzySearch(phrase, this.searchData, 0.6);
      if (results.length > 0 && results[0].score < 0.3) { // Good match
        return results[0].item.symbol;
      }
    }

    return null;
  }

  /**
   * Generate phrases of different lengths for fuzzy matching
   */
  generatePhrases(words) {
    const phrases = [];
    
    // Single words
    phrases.push(...words);
    
    // Two-word combinations
    for (let i = 0; i < words.length - 1; i++) {
      phrases.push(`${words[i]} ${words[i + 1]}`);
    }
    
    // Three-word combinations
    for (let i = 0; i < words.length - 2; i++) {
      phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    }
    
    return phrases.filter(phrase => phrase.length > 2);
  }

  /**
   * Extract using partial matching for abbreviations
   */
  extractPartialMatch(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Common abbreviations and partial matches
    const partialMappings = {
      'rel': 'RELIANCE',
      'hdfc': 'HDFCBANK',
      'icici': 'ICICIBANK',
      'sbi': 'SBIN',
      'bharti': 'BHARTIARTL',
      'asian': 'ASIANPAINT',
      'tata': 'TCS', // Default to TCS for Tata
      'bajaj': 'BAJFINANCE',
      'axis': 'AXISBANK',
      'kotak': 'KOTAKBANK',
      'adani': 'ADANIPORTS',
      'sun': 'SUNPHARMA',
      'titan': 'TITAN',
      'nestle': 'NESTLEIND',
      'hul': 'HINDUNILVR',
      'ultra': 'ULTRACEMCO',
      'jsw': 'JSWSTEEL',
      'vedanta': 'VEDL',
      'coal': 'COALINDIA',
      'ntpc': 'NTPC',
      'power': 'POWERGRID',
      'hero': 'HEROMOTOCO',
      'tvs': 'TVSMOTOR',
      'ashok': 'ASHOKLEY'
    };

    for (const [partial, symbol] of Object.entries(partialMappings)) {
      if (lowerMessage.includes(partial)) {
        return symbol;
      }
    }

    return null;
  }

  /**
   * Check if a string is a valid stock symbol
   */
  isValidSymbol(symbol) {
    return symbol && 
           symbol.length >= 2 && 
           symbol.length <= 15 && 
           /^[A-Z0-9.-]+$/.test(symbol);
  }

  /**
   * Check if a word is a common English word (not a stock symbol)
   */
  isCommonWord(word) {
    const commonWords = [
      'STOCK', 'SHARE', 'COMPANY', 'DATA', 'PRICE', 'INFO', 'ABOUT', 
      'TELL', 'SHOW', 'GIVE', 'WHAT', 'THE', 'IS', 'ARE', 'AND', 
      'OR', 'BUT', 'FOR', 'WITH', 'TO', 'FROM', 'BY', 'AT', 'IN', 
      'ON', 'OF', 'TODAY', 'NOW', 'CURRENT', 'LATEST', 'NEWS', 
      'MARKET', 'TRADING', 'INVEST', 'BUY', 'SELL', 'HOLD'
    ];
    return commonWords.includes(word);
  }

  /**
   * Get suggestions for partial input
   */
  getSuggestions(input, limit = 5) {
    if (!input || input.length < 2) {
      return [];
    }

    const results = this.fuzzySearch(input.toLowerCase(), this.searchData, 0.5);
    return results
      .slice(0, limit)
      .map(result => ({
        company: result.item.name,
        symbol: result.item.symbol,
        score: result.score
      }));
  }

  /**
   * Check if symbol is likely an Indian stock
   */
  isIndianStock(symbol) {
    const indianSymbols = [
      'TCS', 'RELIANCE', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'ITC',
      'LT', 'BHARTIARTL', 'ASIANPAINT', 'WIPRO', 'MARUTI', 'BAJFINANCE',
      'KOTAKBANK', 'HINDUNILVR', 'AXISBANK', 'ULTRACEMCO', 'NESTLEIND',
      'POWERGRID', 'NTPC', 'TECHM', 'SUNPHARMA', 'TITAN', 'DRREDDY',
      'ZOMATO', 'SWIGGY', 'PAYTM', 'NYKAA'
    ];

    const cleanSymbol = symbol.replace(/\.(NS|BO|NSE)$/, '').toUpperCase();
    return indianSymbols.includes(cleanSymbol);
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   */
  calculateSimilarity(str1, str2) {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : 1 - (matrix[len1][len2] / maxLen);
  }
}

module.exports = StockSymbolExtractor;
