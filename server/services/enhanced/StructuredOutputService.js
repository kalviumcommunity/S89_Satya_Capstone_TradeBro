const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Structured Output Service for consistent AI responses
 * Implements JSON schema validation and structured data formatting
 */
class StructuredOutputService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent structured output
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048
      }
    });
    
    this.schemas = this.initializeSchemas();
  }

  /**
   * Initialize JSON schemas for different response types
   */
  initializeSchemas() {
    return {
      stockAnalysis: {
        type: "object",
        properties: {
          symbol: { type: "string" },
          companyName: { type: "string" },
          currentPrice: { type: "number" },
          priceChange: { type: "number" },
          priceChangePercent: { type: "number" },
          marketCap: { type: "number" },
          peRatio: { type: "number" },
          dayHigh: { type: "number" },
          dayLow: { type: "number" },
          volume: { type: "number" },
          analysis: {
            type: "object",
            properties: {
              sentiment: { type: "string", enum: ["bullish", "bearish", "neutral"] },
              riskLevel: { type: "string", enum: ["low", "medium", "high"] },
              recommendation: { type: "string", enum: ["buy", "sell", "hold"] },
              reasoning: { type: "string" },
              keyFactors: { type: "array", items: { type: "string" } }
            }
          },
          technicalIndicators: {
            type: "object",
            properties: {
              rsi: { type: "number" },
              macd: { type: "string" },
              movingAverage50: { type: "number" },
              movingAverage200: { type: "number" },
              support: { type: "number" },
              resistance: { type: "number" }
            }
          }
        },
        required: ["symbol", "companyName", "currentPrice", "analysis"]
      },

      marketOverview: {
        type: "object",
        properties: {
          marketStatus: { type: "string", enum: ["open", "closed", "pre-market", "after-hours"] },
          majorIndices: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                value: { type: "number" },
                change: { type: "number" },
                changePercent: { type: "number" }
              }
            }
          },
          topGainers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                symbol: { type: "string" },
                price: { type: "number" },
                changePercent: { type: "number" }
              }
            }
          },
          topLosers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                symbol: { type: "string" },
                price: { type: "number" },
                changePercent: { type: "number" }
              }
            }
          },
          marketSentiment: {
            type: "object",
            properties: {
              overall: { type: "string", enum: ["bullish", "bearish", "neutral"] },
              fearGreedIndex: { type: "number" },
              volatilityIndex: { type: "number" },
              summary: { type: "string" }
            }
          }
        }
      },

      educationalContent: {
        type: "object",
        properties: {
          topic: { type: "string" },
          difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
          definition: { type: "string" },
          explanation: { type: "string" },
          examples: { type: "array", items: { type: "string" } },
          keyPoints: { type: "array", items: { type: "string" } },
          relatedTopics: { type: "array", items: { type: "string" } },
          practicalApplication: { type: "string" }
        },
        required: ["topic", "definition", "explanation"]
      },

      tradingSignal: {
        type: "object",
        properties: {
          symbol: { type: "string" },
          signalType: { type: "string", enum: ["buy", "sell", "hold"] },
          confidence: { type: "number", minimum: 0, maximum: 100 },
          entryPrice: { type: "number" },
          targetPrice: { type: "number" },
          stopLoss: { type: "number" },
          timeframe: { type: "string" },
          reasoning: { type: "string" },
          riskReward: { type: "number" },
          technicalFactors: { type: "array", items: { type: "string" } },
          fundamentalFactors: { type: "array", items: { type: "string" } }
        },
        required: ["symbol", "signalType", "confidence", "reasoning"]
      }
    };
  }

  /**
   * Generate structured stock analysis
   */
  async generateStockAnalysis(symbol, marketData = {}) {
    const prompt = `Generate a comprehensive stock analysis for ${symbol} in the following JSON format:

${JSON.stringify(this.schemas.stockAnalysis, null, 2)}

Market Data Available: ${JSON.stringify(marketData)}

Requirements:
1. All numerical values must be actual numbers, not strings
2. Enums must match exactly the specified values
3. Include realistic technical indicator values
4. Provide detailed reasoning for recommendations
5. Ensure all required fields are present

Return ONLY the JSON object, no additional text.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      // Clean and parse JSON response
      const cleanedResponse = this.cleanJsonResponse(response);
      const parsedData = JSON.parse(cleanedResponse);
      
      // Validate against schema
      const validation = this.validateSchema(parsedData, this.schemas.stockAnalysis);
      
      if (!validation.valid) {
        throw new Error(`Schema validation failed: ${validation.errors.join(', ')}`);
      }

      return {
        success: true,
        data: parsedData,
        schema: 'stockAnalysis',
        tokens: this.estimateTokens(prompt + response)
      };
    } catch (error) {
      console.error('Structured output error:', error);
      return {
        success: false,
        error: error.message,
        schema: 'stockAnalysis'
      };
    }
  }

  /**
   * Generate structured market overview
   */
  async generateMarketOverview(marketData = {}) {
    const prompt = `Generate a comprehensive market overview in the following JSON format:

${JSON.stringify(this.schemas.marketOverview, null, 2)}

Current Market Data: ${JSON.stringify(marketData)}

Requirements:
1. Include current major indices (NIFTY, SENSEX, etc.)
2. List top 5 gainers and losers
3. Provide realistic market sentiment analysis
4. All numerical values must be numbers, not strings
5. Market status should reflect current time

Return ONLY the JSON object, no additional text.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      const cleanedResponse = this.cleanJsonResponse(response);
      const parsedData = JSON.parse(cleanedResponse);
      
      const validation = this.validateSchema(parsedData, this.schemas.marketOverview);
      
      if (!validation.valid) {
        throw new Error(`Schema validation failed: ${validation.errors.join(', ')}`);
      }

      return {
        success: true,
        data: parsedData,
        schema: 'marketOverview',
        tokens: this.estimateTokens(prompt + response)
      };
    } catch (error) {
      console.error('Market overview error:', error);
      return {
        success: false,
        error: error.message,
        schema: 'marketOverview'
      };
    }
  }

  /**
   * Generate structured educational content
   */
  async generateEducationalContent(topic, difficulty = 'beginner') {
    const prompt = `Generate educational content about "${topic}" for ${difficulty} level in the following JSON format:

${JSON.stringify(this.schemas.educationalContent, null, 2)}

Requirements:
1. Provide clear, accurate financial education
2. Include practical examples relevant to Indian markets
3. Adjust complexity based on difficulty level
4. Include 3-5 key points and examples
5. Suggest related topics for further learning

Return ONLY the JSON object, no additional text.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      const cleanedResponse = this.cleanJsonResponse(response);
      const parsedData = JSON.parse(cleanedResponse);
      
      const validation = this.validateSchema(parsedData, this.schemas.educationalContent);
      
      if (!validation.valid) {
        throw new Error(`Schema validation failed: ${validation.errors.join(', ')}`);
      }

      return {
        success: true,
        data: parsedData,
        schema: 'educationalContent',
        tokens: this.estimateTokens(prompt + response)
      };
    } catch (error) {
      console.error('Educational content error:', error);
      return {
        success: false,
        error: error.message,
        schema: 'educationalContent'
      };
    }
  }

  /**
   * Generate structured trading signal
   */
  async generateTradingSignal(symbol, analysisData = {}) {
    const prompt = `Generate a trading signal for ${symbol} in the following JSON format:

${JSON.stringify(this.schemas.tradingSignal, null, 2)}

Analysis Data: ${JSON.stringify(analysisData)}

Requirements:
1. Provide realistic entry, target, and stop-loss prices
2. Include confidence level (0-100)
3. Calculate risk-reward ratio
4. List specific technical and fundamental factors
5. Provide clear reasoning for the signal

Return ONLY the JSON object, no additional text.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      const cleanedResponse = this.cleanJsonResponse(response);
      const parsedData = JSON.parse(cleanedResponse);
      
      const validation = this.validateSchema(parsedData, this.schemas.tradingSignal);
      
      if (!validation.valid) {
        throw new Error(`Schema validation failed: ${validation.errors.join(', ')}`);
      }

      return {
        success: true,
        data: parsedData,
        schema: 'tradingSignal',
        tokens: this.estimateTokens(prompt + response)
      };
    } catch (error) {
      console.error('Trading signal error:', error);
      return {
        success: false,
        error: error.message,
        schema: 'tradingSignal'
      };
    }
  }

  /**
   * Clean JSON response from AI model
   */
  cleanJsonResponse(response) {
    // Remove markdown code blocks
    let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Remove any text before the first {
    const firstBrace = cleaned.indexOf('{');
    if (firstBrace > 0) {
      cleaned = cleaned.substring(firstBrace);
    }
    
    // Remove any text after the last }
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace < cleaned.length - 1) {
      cleaned = cleaned.substring(0, lastBrace + 1);
    }
    
    return cleaned.trim();
  }

  /**
   * Validate data against JSON schema
   */
  validateSchema(data, schema) {
    const errors = [];
    
    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data)) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }
    
    // Check property types
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in data) {
          const value = data[key];
          const expectedType = propSchema.type;
          
          if (expectedType === 'number' && typeof value !== 'number') {
            errors.push(`Field ${key} should be a number, got ${typeof value}`);
          } else if (expectedType === 'string' && typeof value !== 'string') {
            errors.push(`Field ${key} should be a string, got ${typeof value}`);
          } else if (expectedType === 'array' && !Array.isArray(value)) {
            errors.push(`Field ${key} should be an array, got ${typeof value}`);
          } else if (expectedType === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
            errors.push(`Field ${key} should be an object, got ${typeof value}`);
          }
          
          // Check enum values
          if (propSchema.enum && !propSchema.enum.includes(value)) {
            errors.push(`Field ${key} should be one of [${propSchema.enum.join(', ')}], got ${value}`);
          }
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Estimate token count
   */
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }

  /**
   * Get available schemas
   */
  getAvailableSchemas() {
    return Object.keys(this.schemas);
  }

  /**
   * Get schema by name
   */
  getSchema(schemaName) {
    return this.schemas[schemaName];
  }
}

module.exports = StructuredOutputService;