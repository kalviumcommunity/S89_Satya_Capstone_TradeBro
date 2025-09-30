const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Advanced Prompting Service implementing various prompting techniques
 * Includes Zero-shot, One-shot, Multi-shot, Dynamic, and Chain of Thought prompting
 */
class AdvancedPromptingService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.tokenCount = 0;
    this.models = {}; // Cache for different model configurations
  }

  /**
   * Get or create model with specific configuration
   */
  getModel(technique, context = {}) {
    const configKey = `${technique}_${JSON.stringify(context)}`;
    
    if (!this.models[configKey]) {
      const config = {
        model: 'gemini-pro',
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 2048,
          stopSequences: ["END_RESPONSE", "STOP"]
        }
      };
      this.models[configKey] = this.genAI.getGenerativeModel(config);
    }
    
    return this.models[configKey];
  }

  /**
   * System and User Prompt using RTFC Framework
   * Role, Task, Format, Context
   */
  getSystemPrompt() {
    return {
      role: "You are TradeBro, an expert AI stock trading assistant with deep knowledge of financial markets, technical analysis, and investment strategies.",
      task: "Provide accurate, actionable stock market insights, real-time data analysis, and educational content to help users make informed investment decisions.",
      format: "Respond in a structured format with clear sections: Summary, Data Analysis, Recommendations, and Risk Assessment. Use emojis for better readability.",
      context: "You have access to real-time market data, news, and historical trends. Always include disclaimers about market risks and encourage users to do their own research."
    };
  }

  getUserPrompt(query, context = {}) {
    const systemPrompt = this.getSystemPrompt();
    return `${systemPrompt.role} ${systemPrompt.task}

${systemPrompt.format}

Context: ${systemPrompt.context}

Additional Context: ${JSON.stringify(context)}

User Query: ${query}

Please provide a comprehensive response following the specified format.`;
  }

  /**
   * Zero-shot Prompting - Direct task execution without examples
   */
  async zeroShotPrompt(query, context = {}) {
    const prompt = `Analyze the following stock market query and provide insights:

Query: ${query}
Context: ${JSON.stringify(context)}

Provide a direct analysis without requiring examples or prior context.`;

    try {
      const model = this.getModel('zeroShot', context);
      const inputTokens = this.getTokenCount(prompt);
      
      // Basic token validation
      if (inputTokens > 8000) {
        console.warn('High token usage:', inputTokens);
      }
      
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      const outputTokens = this.getTokenCount(response);
      
      this.logTokenUsage(prompt, response, 'zero-shot');
      
      return {
        success: true,
        response,
        technique: 'zero-shot',
        tokens: inputTokens + outputTokens,
        inputTokens,
        outputTokens,
        cost: inputTokens * 0.0001
      };
    } catch (error) {
      console.error('Zero-shot prompting error:', error);
      return { success: false, error: error.message, technique: 'zero-shot' };
    }
  }

  /**
   * One-shot Prompting - Single example-based learning
   */
  async oneShotPrompt(query, context = {}) {
    const example = {
      input: "What is the current price of RELIANCE stock?",
      output: `📈 **RELIANCE Industries Ltd (RELIANCE.NS)**

💰 **Current Price**: ₹2,456.75
📊 **Change**: +₹23.45 (+0.96%) ↗️

**Key Metrics:**
• Market Cap: ₹16,58,234 Cr
• P/E Ratio: 24.5
• Day Range: ₹2,433.20 - ₹2,467.80

**Analysis**: RELIANCE shows positive momentum with above-average volume. The stock is trading near its day high, indicating bullish sentiment.

**Risk Assessment**: Moderate risk due to oil price volatility.

*Disclaimer: This is for informational purposes only. Please conduct your own research before investing.*`
    };

    const prompt = `Here's an example of how to respond to stock queries:

Example Input: ${example.input}
Example Output: ${example.output}

Now respond to this query in the same format and style:

Query: ${query}
Context: ${JSON.stringify(context)}`;

    try {
      const model = this.getModel('oneShot', context);
      const inputTokens = this.getTokenCount(prompt);
      
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      const outputTokens = this.getTokenCount(response);
      
      this.logTokenUsage(prompt, response, 'one-shot');
      
      return {
        success: true,
        response,
        technique: 'one-shot',
        tokens: inputTokens + outputTokens,
        inputTokens,
        outputTokens
      };
    } catch (error) {
      console.error('One-shot prompting error:', error);
      return { success: false, error: error.message, technique: 'one-shot' };
    }
  }

  /**
   * Multi-shot Prompting - Multiple example-based learning
   */
  async multiShotPrompt(query, context = {}) {
    const examples = [
      {
        input: "Compare TCS and INFY stocks",
        output: `⚖️ **Stock Comparison: TCS vs INFY**

**TCS (Tata Consultancy Services)**
💰 Price: ₹3,245.60 (+1.2%)
📊 Market Cap: ₹11,78,456 Cr
📈 P/E: 28.4

**INFY (Infosys)**
💰 Price: ₹1,567.80 (+0.8%)
📊 Market Cap: ₹6,45,234 Cr
📈 P/E: 24.2

**Analysis**: TCS shows higher valuation but stronger market position. INFY offers better value with lower P/E ratio.

**Recommendation**: TCS for stability, INFY for value investing.`
      },
      {
        input: "What are today's top gainers?",
        output: `🚀 **Today's Top Gainers**

1. **ADANIPORTS** - ₹756.30 (+4.2%)
2. **BAJFINANCE** - ₹6,789.45 (+3.8%)
3. **HDFCBANK** - ₹1,634.20 (+3.1%)
4. **ICICIBANK** - ₹945.60 (+2.9%)
5. **RELIANCE** - ₹2,456.75 (+2.5%)

**Market Sentiment**: Strong bullish momentum across banking and infrastructure sectors.

**Trading Volume**: Above average, indicating genuine buying interest.`
      },
      {
        input: "Explain what is P/E ratio?",
        output: `📚 **Understanding P/E Ratio**

**Definition**: Price-to-Earnings ratio measures how much investors pay for each rupee of earnings.

**Formula**: P/E = Current Stock Price ÷ Earnings Per Share (EPS)

**Example**: If a stock trades at ₹100 and EPS is ₹5, P/E = 20

**Interpretation**:
• High P/E (>25): Growth expectations, potentially overvalued
• Low P/E (<15): Value opportunity or declining business
• Industry Average: Compare with sector peers

**Use Case**: Helps identify undervalued or overvalued stocks for investment decisions.`
      }
    ];

    const exampleText = examples.map((ex, i) => 
      `Example ${i + 1}:\nInput: ${ex.input}\nOutput: ${ex.output}`
    ).join('\n\n');

    const prompt = `Here are examples of how to respond to different types of stock market queries:

${exampleText}

Now respond to this query following the same format and style:

Query: ${query}
Context: ${JSON.stringify(context)}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      this.logTokenUsage(prompt, response);
      
      return {
        success: true,
        response,
        technique: 'multi-shot',
        tokens: this.getTokenCount(prompt + response)
      };
    } catch (error) {
      console.error('Multi-shot prompting error:', error);
      return { success: false, error: error.message, technique: 'multi-shot' };
    }
  }

  /**
   * Dynamic Prompting - Context-adaptive prompt generation
   */
  async dynamicPrompt(query, context = {}) {
    // Analyze query to determine optimal prompt structure
    const queryType = this.analyzeQueryType(query);
    const userExperience = context.userLevel || 'beginner';
    const marketCondition = context.marketCondition || 'normal';
    
    let dynamicPrompt = this.buildDynamicPrompt(query, queryType, userExperience, marketCondition, context);

    try {
      const result = await this.model.generateContent(dynamicPrompt);
      const response = result.response.text();
      this.logTokenUsage(dynamicPrompt, response);
      
      return {
        success: true,
        response,
        technique: 'dynamic',
        queryType,
        userExperience,
        marketCondition,
        tokens: this.getTokenCount(dynamicPrompt + response)
      };
    } catch (error) {
      console.error('Dynamic prompting error:', error);
      return { success: false, error: error.message, technique: 'dynamic' };
    }
  }

  /**
   * Chain of Thought Prompting - Step-by-step reasoning
   */
  async chainOfThoughtPrompt(query, context = {}) {
    const prompt = `Let's analyze this stock market query step by step:

Query: ${query}
Context: ${JSON.stringify(context)}

Please follow this chain of thought process:

Step 1: Understanding the Query
- What is the user asking for?
- What type of analysis is needed?
- What data points are required?

Step 2: Data Analysis
- Gather relevant market data
- Identify key metrics and indicators
- Consider market context and trends

Step 3: Risk Assessment
- Evaluate potential risks
- Consider market volatility
- Assess investment timeframe

Step 4: Reasoning and Logic
- Apply financial principles
- Compare with historical data
- Consider market sentiment

Step 5: Conclusion and Recommendation
- Synthesize findings
- Provide actionable insights
- Include appropriate disclaimers

Please work through each step clearly and show your reasoning process.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      this.logTokenUsage(prompt, response);
      
      return {
        success: true,
        response,
        technique: 'chain-of-thought',
        tokens: this.getTokenCount(prompt + response)
      };
    } catch (error) {
      console.error('Chain of thought prompting error:', error);
      return { success: false, error: error.message, technique: 'chain-of-thought' };
    }
  }

  /**
   * Analyze query type for dynamic prompting
   */
  analyzeQueryType(query) {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('price') || lowerQuery.includes('quote')) return 'price_query';
    if (lowerQuery.includes('compare') || lowerQuery.includes('vs')) return 'comparison';
    if (lowerQuery.includes('news') || lowerQuery.includes('update')) return 'news';
    if (lowerQuery.includes('explain') || lowerQuery.includes('what is')) return 'educational';
    if (lowerQuery.includes('predict') || lowerQuery.includes('forecast')) return 'prediction';
    if (lowerQuery.includes('buy') || lowerQuery.includes('sell')) return 'trading_advice';
    if (lowerQuery.includes('portfolio') || lowerQuery.includes('investment')) return 'portfolio';
    
    return 'general';
  }

  /**
   * Build dynamic prompt based on context
   */
  buildDynamicPrompt(query, queryType, userExperience, marketCondition, context) {
    let prompt = `As TradeBro, an AI stock trading assistant, analyze this query:\n\n`;
    
    // Add query type specific instructions
    switch (queryType) {
      case 'price_query':
        prompt += `This is a price query. Provide current price, change, key metrics, and brief analysis.\n`;
        break;
      case 'comparison':
        prompt += `This is a comparison query. Compare stocks side-by-side with key metrics and recommendations.\n`;
        break;
      case 'educational':
        prompt += `This is an educational query. Explain concepts clearly with examples and practical applications.\n`;
        break;
      case 'trading_advice':
        prompt += `This is a trading advice query. Provide balanced analysis with clear risk warnings.\n`;
        break;
      default:
        prompt += `Analyze this general query and provide comprehensive insights.\n`;
    }

    // Add user experience level adjustments
    if (userExperience === 'beginner') {
      prompt += `User is a beginner - use simple language, explain technical terms, and provide educational context.\n`;
    } else if (userExperience === 'advanced') {
      prompt += `User is advanced - use technical analysis, detailed metrics, and sophisticated insights.\n`;
    }

    // Add market condition context
    if (marketCondition === 'volatile') {
      prompt += `Market is currently volatile - emphasize risk management and caution.\n`;
    } else if (marketCondition === 'bullish') {
      prompt += `Market is bullish - highlight opportunities while maintaining balanced perspective.\n`;
    } else if (marketCondition === 'bearish') {
      prompt += `Market is bearish - focus on defensive strategies and risk mitigation.\n`;
    }

    prompt += `\nQuery: ${query}\nContext: ${JSON.stringify(context)}\n\nProvide a comprehensive response following the above guidelines.`;
    
    return prompt;
  }

  /**
   * Log token usage for monitoring
   */
  logTokenUsage(prompt, response, technique = 'unknown') {
    const inputTokens = this.getTokenCount(prompt);
    const outputTokens = this.getTokenCount(response);
    const totalTokens = inputTokens + outputTokens;
    
    this.tokenCount += totalTokens;
    
    console.log(`🔢 [${technique.toUpperCase()}] Tokens - Input: ${inputTokens}, Output: ${outputTokens}, Total: ${totalTokens}`);
    console.log(`📊 Session Total: ${this.tokenCount} tokens`);
  }

  /**
   * Estimate token count (approximate)
   */
  getTokenCount(text) {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Get total token usage for session
   */
  getTotalTokens() {
    return this.tokenCount;
  }

  /**
   * Reset token counter
   */
  resetTokenCount() {
    this.tokenCount = 0;
  }
}

module.exports = AdvancedPromptingService;