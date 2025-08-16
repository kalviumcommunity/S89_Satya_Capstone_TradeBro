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
    
    // Navigation commands
    const navCommands = {
      'chart': '/charts',
      'charge': '/charts', 
      'charts': '/charts',
      'dashboard': '/dashboard',
      'home': '/dashboard',
      'portfolio': '/portfolio',
      'trading': '/trading',
      'trade': '/trading',
      'orders': '/orders',
      'order': '/orders',
      'history': '/history',
      'news': '/news',
      'watchlist': '/watchlist',
      'notifications': '/notifications',
      'profile': '/profile',
      'settings': '/settings',
      'saytrix': '/saytrix'
    };
    
    // Check for exact matches or contains
    for (const [keyword, path] of Object.entries(navCommands)) {
      if (lower === keyword || lower.includes(keyword)) {
        console.log(`Navigating to ${path}`);
        this.navigate(path);
        return { success: true, message: `Opening ${keyword}` };
      }
    }
    
    // Stock price queries
    if (lower.includes('price') || lower.includes('stock')) {
      const stockMatch = lower.match(/(?:price of|stock|show me)\s+([a-z]+)/i);
      if (stockMatch) {
        const symbol = stockMatch[1].toUpperCase();
        this.navigate(`/stock/${symbol}`);
        return { success: true, message: `Showing ${symbol} price` };
      }
    }
    
    return { success: false };
  }
}

export default AIVoiceProcessor;