/**
 * Multilingual Content Formatter for Stock Trading Assistant
 * Supports English and Hindi with mobile-friendly formatting
 */
class MultilingualFormatter {
  constructor() {
    this.initializeTranslations();
    this.initializeFormatters();
  }

  /**
   * Initialize translation mappings
   */
  initializeTranslations() {
    this.translations = {
      en: {
        // Stock Information
        currentPrice: 'Current Price',
        change: 'Change',
        marketCap: 'Market Cap',
        peRatio: 'P/E Ratio',
        eps: 'EPS',
        dayRange: 'Day Range',
        yearRange: '52W Range',
        sector: 'Sector',
        industry: 'Industry',
        volume: 'Volume',
        
        // Market Movers
        topGainers: 'Top Gainers Today',
        topLosers: 'Top Losers Today',
        
        // News
        latestNews: 'Latest Market News',
        newsFor: 'Latest News for',
        publishedOn: 'Published on',
        
        // Educational Content
        whatIs: 'What is',
        explanation: 'Explanation',
        example: 'Example',
        keyPoints: 'Key Points',
        
        // Common Terms
        stock: 'Stock',
        company: 'Company',
        price: 'Price',
        market: 'Market',
        trading: 'Trading',
        investment: 'Investment',
        profit: 'Profit',
        loss: 'Loss',
        
        // Actions
        buy: 'Buy',
        sell: 'Sell',
        hold: 'Hold',
        analyze: 'Analyze',
        
        // Time
        today: 'Today',
        yesterday: 'Yesterday',
        thisWeek: 'This Week',
        thisMonth: 'This Month',
        
        // Status
        positive: 'Positive',
        negative: 'Negative',
        neutral: 'Neutral',
        
        // Currency
        rupees: 'Rupees',
        crores: 'Crores',
        lakhs: 'Lakhs'
      },
      
      hi: {
        // Stock Information
        currentPrice: 'वर्तमान मूल्य',
        change: 'परिवर्तन',
        marketCap: 'बाजार पूंजीकरण',
        peRatio: 'पी/ई अनुपात',
        eps: 'ईपीएस',
        dayRange: 'दिन की सीमा',
        yearRange: '52 सप्ताह की सीमा',
        sector: 'क्षेत्र',
        industry: 'उद्योग',
        volume: 'वॉल्यूम',
        
        // Market Movers
        topGainers: 'आज के टॉप गेनर्स',
        topLosers: 'आज के टॉप लूज़र्स',
        
        // News
        latestNews: 'नवीनतम बाजार समाचार',
        newsFor: 'के लिए नवीनतम समाचार',
        publishedOn: 'प्रकाशित',
        
        // Educational Content
        whatIs: 'क्या है',
        explanation: 'व्याख्या',
        example: 'उदाहरण',
        keyPoints: 'मुख्य बिंदु',
        
        // Common Terms
        stock: 'स्टॉक',
        company: 'कंपनी',
        price: 'मूल्य',
        market: 'बाजार',
        trading: 'ट्रेडिंग',
        investment: 'निवेश',
        profit: 'लाभ',
        loss: 'हानि',
        
        // Actions
        buy: 'खरीदें',
        sell: 'बेचें',
        hold: 'होल्ड करें',
        analyze: 'विश्लेषण करें',
        
        // Time
        today: 'आज',
        yesterday: 'कल',
        thisWeek: 'इस सप्ताह',
        thisMonth: 'इस महीने',
        
        // Status
        positive: 'सकारात्मक',
        negative: 'नकारात्मक',
        neutral: 'तटस्थ',
        
        // Currency
        rupees: 'रुपये',
        crores: 'करोड़',
        lakhs: 'लाख'
      }
    };
  }

  /**
   * Initialize formatting utilities
   */
  initializeFormatters() {
    this.emojis = {
      positive: '📈',
      negative: '📉',
      neutral: '➡️',
      money: '💰',
      chart: '📊',
      company: '🏢',
      news: '📰',
      calendar: '📅',
      time: '⏰',
      fire: '🔥',
      warning: '⚠️',
      info: 'ℹ️',
      star: '⭐',
      rocket: '🚀',
      target: '🎯',
      trophy: '🏆',
      diamond: '💎',
      growth: '📈',
      decline: '📉'
    };

    this.mobileBreakpoints = {
      shortLine: 40,
      mediumLine: 60,
      longLine: 80
    };
  }

  /**
   * Format stock data with multilingual support
   */
  formatStockData(stockData, language = 'en') {
    const t = this.translations[language];
    const changeEmoji = stockData.change >= 0 ? this.emojis.positive : this.emojis.negative;
    const changeStatus = stockData.change >= 0 ? t.positive : t.negative;

    const formatted = `
${this.emojis.company} **${stockData.name} (${stockData.symbol})**

${this.emojis.money} **${t.currentPrice}**: ₹${this.formatNumber(stockData.price)}
${changeEmoji} **${t.change}**: ${this.formatChange(stockData.change)} (${this.formatPercentage(stockData.changesPercentage)}%)

${this.emojis.chart} **${t.marketCap}**: ${this.formatMarketCap(stockData.marketCap, language)}
${this.emojis.info} **${t.peRatio}**: ${this.formatNumber(stockData.pe)}
${this.emojis.target} **${t.eps}**: ₹${this.formatNumber(stockData.eps)}

${this.emojis.chart} **${t.dayRange}**: ₹${this.formatNumber(stockData.dayLow)} - ₹${this.formatNumber(stockData.dayHigh)}
${this.emojis.growth} **${t.yearRange}**: ₹${this.formatNumber(stockData.yearLow)} - ₹${this.formatNumber(stockData.yearHigh)}

${this.emojis.company} **${t.sector}**: ${stockData.sector || 'N/A'}
${this.emojis.info} **${t.industry}**: ${stockData.industry || 'N/A'}`;

    return this.optimizeForMobile(formatted);
  }

  /**
   * Format top movers (gainers/losers)
   */
  formatTopMovers(movers, type, language = 'en') {
    const t = this.translations[language];
    const emoji = type === 'gainers' ? this.emojis.fire : this.emojis.decline;
    const title = type === 'gainers' ? t.topGainers : t.topLosers;

    let formatted = `${emoji} **${title}**\n\n`;

    movers.slice(0, 10).forEach((stock, index) => {
      const changeEmoji = stock.changesPercentage >= 0 ? this.emojis.positive : this.emojis.negative;
      const rank = this.getRankEmoji(index + 1);
      
      formatted += `${rank} **${stock.symbol}** - ${this.truncateText(stock.name, 25)}\n`;
      formatted += `   ${this.emojis.money} ₹${this.formatNumber(stock.price)} ${changeEmoji} ${this.formatPercentage(stock.changesPercentage)}%\n\n`;
    });

    return this.optimizeForMobile(formatted);
  }

  /**
   * Format news articles
   */
  formatNews(news, symbol = null, language = 'en') {
    const t = this.translations[language];
    const title = symbol ? `${t.newsFor} ${symbol}` : t.latestNews;

    let formatted = `${this.emojis.news} **${title}**\n\n`;

    news.slice(0, 5).forEach((article, index) => {
      formatted += `${index + 1}. **${this.truncateText(article.title, 60)}**\n`;
      formatted += `   ${this.emojis.calendar} ${this.formatDate(article.publishedDate, language)}\n`;
      
      if (article.text && article.text.length > 0) {
        formatted += `   ${this.emojis.info} ${this.truncateText(article.text, 120)}...\n`;
      }
      formatted += '\n';
    });

    return this.optimizeForMobile(formatted);
  }

  /**
   * Format stock comparison
   */
  formatStockComparison(stock1, stock2, language = 'en') {
    const t = this.translations[language];
    const change1Emoji = stock1.change >= 0 ? this.emojis.positive : this.emojis.negative;
    const change2Emoji = stock2.change >= 0 ? this.emojis.positive : this.emojis.negative;

    const formatted = `
${this.emojis.target} **${stock1.symbol} vs ${stock2.symbol}**

**${stock1.name} (${stock1.symbol})**
${this.emojis.money} ₹${this.formatNumber(stock1.price)} ${change1Emoji} ${this.formatPercentage(stock1.changesPercentage)}%
${this.emojis.chart} ${t.marketCap}: ${this.formatMarketCap(stock1.marketCap, language)}
${this.emojis.info} ${t.peRatio}: ${this.formatNumber(stock1.pe)}

**${stock2.name} (${stock2.symbol})**
${this.emojis.money} ₹${this.formatNumber(stock2.price)} ${change2Emoji} ${this.formatPercentage(stock2.changesPercentage)}%
${this.emojis.chart} ${t.marketCap}: ${this.formatMarketCap(stock2.marketCap, language)}
${this.emojis.info} ${t.peRatio}: ${this.formatNumber(stock2.pe)}

${this.emojis.trophy} **Quick Analysis**:
• Better Performer: ${this.getBetterPerformer(stock1, stock2)}
• Larger Company: ${this.getLargerCompany(stock1, stock2)}
• Better Value: ${this.getBetterValue(stock1, stock2)}`;

    return this.optimizeForMobile(formatted);
  }

  /**
   * Format educational content
   */
  formatEducationalContent(topic, content, language = 'en') {
    const t = this.translations[language];
    
    const formatted = `
${this.emojis.star} **${t.whatIs} ${topic}**

${this.emojis.info} **${t.explanation}**:
${content.explanation || content}

${content.keyPoints ? `${this.emojis.target} **${t.keyPoints}**:\n${content.keyPoints.map(point => `• ${point}`).join('\n')}` : ''}

${content.example ? `${this.emojis.diamond} **${t.example}**:\n${content.example}` : ''}`;

    return this.optimizeForMobile(formatted);
  }

  /**
   * Utility Methods
   */
  formatNumber(num) {
    if (num === null || num === undefined) return 'N/A';
    return parseFloat(num).toFixed(2);
  }

  formatChange(change) {
    if (change === null || change === undefined) return 'N/A';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${parseFloat(change).toFixed(2)}`;
  }

  formatPercentage(percentage) {
    if (percentage === null || percentage === undefined) return 'N/A';
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${parseFloat(percentage).toFixed(2)}`;
  }

  formatMarketCap(marketCap, language = 'en') {
    if (!marketCap) return 'N/A';
    
    const t = this.translations[language];
    const crores = marketCap / 10000000;
    
    if (crores >= 100000) {
      return `₹${(crores / 100000).toFixed(1)} ${t.lakhs} ${t.crores}`;
    } else if (crores >= 1) {
      return `₹${crores.toFixed(0)} ${t.crores}`;
    } else {
      const lakhs = marketCap / 100000;
      return `₹${lakhs.toFixed(0)} ${t.lakhs}`;
    }
  }

  formatDate(dateString, language = 'en') {
    const date = new Date(dateString);
    if (language === 'hi') {
      return date.toLocaleDateString('hi-IN');
    }
    return date.toLocaleDateString('en-IN');
  }

  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  getRankEmoji(rank) {
    const rankEmojis = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    return rankEmojis[rank - 1] || `${rank}.`;
  }

  getBetterPerformer(stock1, stock2) {
    const perf1 = Math.abs(stock1.changesPercentage || 0);
    const perf2 = Math.abs(stock2.changesPercentage || 0);
    return perf1 > perf2 ? stock1.symbol : stock2.symbol;
  }

  getLargerCompany(stock1, stock2) {
    const cap1 = stock1.marketCap || 0;
    const cap2 = stock2.marketCap || 0;
    return cap1 > cap2 ? stock1.symbol : stock2.symbol;
  }

  getBetterValue(stock1, stock2) {
    const pe1 = stock1.pe || Infinity;
    const pe2 = stock2.pe || Infinity;
    return pe1 < pe2 ? stock1.symbol : stock2.symbol;
  }

  optimizeForMobile(text) {
    // Add proper spacing for mobile readability
    return text
      .replace(/\n\n\n+/g, '\n\n') // Remove excessive line breaks
      .replace(/^\s+/gm, '') // Remove leading spaces
      .trim();
  }

  /**
   * Detect language from user input
   */
  detectLanguage(text) {
    const hindiPattern = /[\u0900-\u097F]/;
    return hindiPattern.test(text) ? 'hi' : 'en';
  }

  /**
   * Get translation for a key
   */
  translate(key, language = 'en') {
    return this.translations[language]?.[key] || this.translations.en[key] || key;
  }
}

module.exports = MultilingualFormatter;
