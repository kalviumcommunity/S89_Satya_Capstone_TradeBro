/**
 * Educational Content Provider for Stock Trading Assistant
 * Provides multilingual educational content about financial concepts
 */
class EducationalContentProvider {
  constructor() {
    this.initializeContent();
  }

  /**
   * Initialize educational content in multiple languages
   */
  initializeContent() {
    this.content = {
      en: {
        'pe ratio': {
          title: 'Price-to-Earnings (P/E) Ratio',
          explanation: 'The P/E ratio measures how much investors are willing to pay for each rupee of earnings. It\'s calculated by dividing the stock price by earnings per share (EPS).',
          formula: 'P/E Ratio = Stock Price ÷ Earnings Per Share',
          keyPoints: [
            'Higher P/E suggests investors expect higher earnings growth',
            'Lower P/E might indicate undervalued stock or poor prospects',
            'Compare P/E ratios within the same industry',
            'Average P/E for Indian markets is around 20-25'
          ],
          example: 'If TCS trades at ₹3,500 and has EPS of ₹140, its P/E ratio is 25 (3500÷140). This means investors pay ₹25 for every ₹1 of earnings.',
          relatedTerms: ['EPS', 'Market Cap', 'Valuation']
        },

        'market cap': {
          title: 'Market Capitalization',
          explanation: 'Market cap is the total value of a company\'s shares in the stock market. It represents what investors think the company is worth.',
          formula: 'Market Cap = Share Price × Total Number of Shares',
          keyPoints: [
            'Large Cap: Above ₹20,000 crores (stable, established companies)',
            'Mid Cap: ₹5,000-20,000 crores (growth potential with moderate risk)',
            'Small Cap: Below ₹5,000 crores (high growth potential, higher risk)',
            'Market cap determines company size and investment category'
          ],
          example: 'If Reliance has 6.77 billion shares trading at ₹2,500 each, its market cap is ₹16.9 lakh crores, making it a large-cap stock.',
          relatedTerms: ['Share Price', 'Outstanding Shares', 'Company Valuation']
        },

        'eps': {
          title: 'Earnings Per Share (EPS)',
          explanation: 'EPS shows how much profit a company makes for each share. It\'s a key indicator of company profitability and is used to calculate P/E ratio.',
          formula: 'EPS = Net Income ÷ Total Outstanding Shares',
          keyPoints: [
            'Higher EPS generally indicates better profitability',
            'Compare EPS growth over multiple quarters/years',
            'Used in P/E ratio calculation for valuation',
            'Diluted EPS considers potential share dilution'
          ],
          example: 'If Infosys reports net income of ₹6,000 crores with 4.2 billion shares outstanding, EPS = ₹6,000 crores ÷ 4.2 billion = ₹142.86 per share.',
          relatedTerms: ['Net Income', 'P/E Ratio', 'Profitability']
        },

        'dividend': {
          title: 'Dividend',
          explanation: 'Dividends are cash payments made by companies to shareholders from their profits. It\'s a way for investors to earn regular income from their investments.',
          formula: 'Dividend Yield = Annual Dividend Per Share ÷ Stock Price × 100',
          keyPoints: [
            'Not all companies pay dividends (growth companies often reinvest)',
            'Dividend yield shows annual dividend as percentage of stock price',
            'Regular dividend payments indicate financial stability',
            'Dividend income is taxable in India'
          ],
          example: 'If HDFC Bank pays ₹15 annual dividend and trades at ₹1,500, dividend yield = (15÷1500)×100 = 1%.',
          relatedTerms: ['Dividend Yield', 'Payout Ratio', 'Income Investing']
        }
      },

      hi: {
        'pe ratio': {
          title: 'मूल्य-आय अनुपात (P/E Ratio)',
          explanation: 'P/E अनुपात बताता है कि निवेशक कंपनी की हर रुपये की कमाई के लिए कितना भुगतान करने को तैयार हैं। यह शेयर की कीमत को प्रति शेयर आय (EPS) से भाग देकर निकाला जाता है।',
          formula: 'P/E अनुपात = शेयर की कीमत ÷ प्रति शेयर आय',
          keyPoints: [
            'उच्च P/E का मतलब निवेशकों को भविष्य में अधिक कमाई की उम्मीद है',
            'कम P/E का मतलब शेयर सस्ता हो सकता है या कंपनी की संभावनाएं कम हैं',
            'समान उद्योग की कंपनियों के P/E की तुलना करें',
            'भारतीय बाजार में औसत P/E लगभग 20-25 होता है'
          ],
          example: 'यदि TCS ₹3,500 पर ट्रेड कर रहा है और इसका EPS ₹140 है, तो P/E अनुपात 25 है (3500÷140)। इसका मतलब निवेशक हर ₹1 की कमाई के लिए ₹25 दे रहे हैं।',
          relatedTerms: ['EPS', 'बाजार पूंजीकरण', 'मूल्यांकन']
        },

        'market cap': {
          title: 'बाजार पूंजीकरण (Market Cap)',
          explanation: 'मार्केट कैप शेयर बाजार में कंपनी के सभी शेयरों का कुल मूल्य है। यह दिखाता है कि निवेशकों के अनुसार कंपनी की कुल कीमत क्या है।',
          formula: 'मार्केट कैप = शेयर की कीमत × कुल शेयरों की संख्या',
          keyPoints: [
            'लार्ज कैप: ₹20,000 करोड़ से अधिक (स्थिर, स्थापित कंपनियां)',
            'मिड कैप: ₹5,000-20,000 करोड़ (विकास की संभावना, मध्यम जोखिम)',
            'स्मॉल कैप: ₹5,000 करोड़ से कम (उच्च विकास संभावना, अधिक जोखिम)',
            'मार्केट कैप से कंपनी का आकार और निवेश श्रेणी पता चलती है'
          ],
          example: 'यदि रिलायंस के 6.77 अरब शेयर हैं और हर शेयर ₹2,500 पर ट्रेड कर रहा है, तो मार्केट कैप ₹16.9 लाख करोड़ है, जो इसे लार्ज-कैप स्टॉक बनाता है।',
          relatedTerms: ['शेयर की कीमत', 'बकाया शेयर', 'कंपनी मूल्यांकन']
        }
      }
    };

    // Common financial terms that can be explained
    this.supportedTerms = [
      'pe ratio', 'p/e ratio', 'price to earnings',
      'market cap', 'market capitalization',
      'eps', 'earnings per share',
      'dividend', 'dividend yield',
      'beta', 'volatility',
      'volume', 'trading volume'
    ];
  }

  /**
   * Get educational content for a topic
   */
  getContent(topic, language = 'en') {
    try {
      const normalizedTopic = this.normalizeTopic(topic);
      const content = this.content[language]?.[normalizedTopic];
      
      if (content) {
        return {
          found: true,
          content: content,
          language: language,
          topic: normalizedTopic
        };
      }

      // Try English if Hindi content not found
      if (language === 'hi') {
        const englishContent = this.content.en[normalizedTopic];
        if (englishContent) {
          return {
            found: true,
            content: englishContent,
            language: 'en',
            topic: normalizedTopic,
            note: 'Content available in English only'
          };
        }
      }

      // Return suggestions for similar topics
      const suggestions = this.getSuggestions(normalizedTopic, language);
      return {
        found: false,
        suggestions: suggestions,
        message: language === 'hi' ? 
          'इस विषय पर जानकारी उपलब्ध नहीं है। कृपया अन्य विषय चुनें।' :
          'Content not available for this topic. Please try another topic.'
      };
    } catch (error) {
      console.error('Error getting educational content:', error);
      return {
        found: false,
        error: 'Error retrieving content',
        suggestions: this.getPopularTopics(language)
      };
    }
  }

  /**
   * Normalize topic for consistent lookup
   */
  normalizeTopic(topic) {
    return topic
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\b(what is|explain|define|meaning of)\b/g, '')
      .trim();
  }

  /**
   * Get suggestions for similar topics
   */
  getSuggestions(topic, language = 'en') {
    const availableTopics = Object.keys(this.content[language] || this.content.en);
    const suggestions = [];

    // Simple fuzzy matching
    for (const availableTopic of availableTopics) {
      if (this.calculateSimilarity(topic, availableTopic) > 0.3) {
        suggestions.push(availableTopic);
      }
    }

    // If no similar topics found, return popular topics
    if (suggestions.length === 0) {
      return this.getPopularTopics(language);
    }

    return suggestions.slice(0, 5);
  }

  /**
   * Calculate similarity between two strings
   */
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Get popular/recommended topics
   */
  getPopularTopics(language = 'en') {
    const popularTopics = language === 'hi' ? [
      'pe ratio',
      'market cap',
      'eps',
      'dividend'
    ] : [
      'pe ratio',
      'market cap',
      'eps',
      'dividend'
    ];

    return popularTopics.filter(topic => 
      this.content[language]?.[topic] || this.content.en[topic]
    );
  }

  /**
   * Check if topic is supported
   */
  isTopicSupported(topic) {
    const normalizedTopic = this.normalizeTopic(topic);
    return this.supportedTerms.some(term => 
      normalizedTopic.includes(term) || term.includes(normalizedTopic)
    );
  }

  /**
   * Get all available topics for a language
   */
  getAvailableTopics(language = 'en') {
    const topics = Object.keys(this.content[language] || this.content.en);
    return topics.map(topic => ({
      topic,
      title: this.content[language]?.[topic]?.title || this.content.en[topic]?.title
    }));
  }
}

module.exports = EducationalContentProvider;
