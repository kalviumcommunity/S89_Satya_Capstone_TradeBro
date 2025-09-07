import { saytrixAPI } from '../services/api';

class AIVoiceProcessor {
  constructor(navigate) {
    this.navigate = navigate;
  }

  async processCommand(transcript) {
    console.log('AI Processing:', transcript);
    
    // Direct local processing for speed
    const result = this.localProcess(transcript);
    if (result.success) {
      return result;
    }
    
    // Try AI if local fails
    try {
      const response = await saytrixAPI.sendMessage(transcript, 'voice_session');
      if (response.success && response.data.action) {
        return this.executeAction(response.data.action, response.data.params);
      }
    } catch (error) {
      console.log('AI processing failed, using local');
    }
    
    return { success: false, message: 'Command not recognized' };
  }

  executeAction(action, params = {}) {
    switch (action) {
      case 'navigate':
        this.navigate(params.path);
        return { success: true, message: `Navigating to ${params.path}` };
      
      case 'search_stock':
        this.navigate(`/stock/${params.symbol}`);
        return { success: true, message: `Showing ${params.symbol} details` };
      
      case 'buy_stock':
        this.navigate('/trading');
        return { success: true, message: 'Opening trading page' };
      
      case 'show_portfolio':
        this.navigate('/portfolio');
        return { success: true, message: 'Opening portfolio' };
      
      default:
        return { success: false, message: 'Command not understood' };
    }
  }

  localProcess(transcript) {
    const lower = transcript.toLowerCase().trim();
    
    // Enhanced navigation commands
    const navCommands = {
      'chart': '/charts',
      'charts': '/charts',
      'charge': '/charts',
      'dashboard': '/dashboard',
      'home': '/dashboard',
      'portfolio': '/portfolio',
      'trading': '/trading',
      'trade': '/trading',
      'orders': '/orders',
      'order': '/orders',
      'history': '/history',
      'trades': '/trades',
      'news': '/news',
      'watchlist': '/watchlist',
      'watch list': '/watchlist',
      'notifications': '/notifications',
      'notification': '/notifications',
      'profile': '/profile',
      'settings': '/settings',
      'setting': '/settings',
      'saytrix': '/saytrix',
      'chat': '/saytrix'
    };
    
    // Enhanced navigation patterns
    const navigationPatterns = [
      /(?:redirect|go|open|take|navigate).*?(?:to|me to)?\s*(charts?|trading?|dashboard|home|portfolio|orders?|history|trades?|watchlist|news|notifications?|profile|settings|saytrix|chat)/i,
      /(charts?|trading?|dashboard|home|portfolio|orders?|history|trades?|watchlist|news|notifications?|profile|settings|saytrix|chat)\s*page/i,
      /show\s*me\s*(charts?|trading?|dashboard|home|portfolio|orders?|history|trades?|watchlist|news|notifications?|profile|settings|saytrix)/i
    ];
    
    // Check navigation patterns first
    for (const pattern of navigationPatterns) {
      const match = lower.match(pattern);
      if (match) {
        const destination = match[1].toLowerCase().replace(/s$/, ''); // Remove trailing 's'
        const path = navCommands[destination] || navCommands[destination + 's'];
        if (path) {
          console.log(`Pattern navigation to ${path}`);
          this.navigate(path);
          return { success: true, message: `Opening ${destination} page` };
        }
      }
    }
    
    // Direct keyword matching
    for (const [keyword, path] of Object.entries(navCommands)) {
      if (lower === keyword || lower.includes(keyword)) {
        console.log(`Direct navigation to ${path}`);
        this.navigate(path);
        return { success: true, message: `Opening ${keyword}` };
      }
    }
    
    // Stock price queries
    const stockPatterns = [
      /(?:price of|show price|get price)\s+([a-z]+)/i,
      /([a-z]+)\s+(?:stock|price|quote)/i,
      /show\s+me\s+([a-z]+)\s+stock/i
    ];
    
    for (const pattern of stockPatterns) {
      const match = lower.match(pattern);
      if (match) {
        const symbol = match[1].toUpperCase();
        this.navigate(`/stock/${symbol}`);
        return { success: true, message: `Showing ${symbol} stock details` };
      }
    }
    
    return { success: false };
  }
}

export default AIVoiceProcessor;