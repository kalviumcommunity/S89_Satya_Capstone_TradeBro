/**
 * AI Configuration for TradeBro Chatbot
 * Includes Temperature, Top-P, Top-K, Stop Sequences, and other model parameters
 */

const aiConfig = {
  // Model Selection
  model: {
    name: 'gemini-pro',
    provider: 'Google',
    version: '1.0'
  },

  // Generation Configuration
  generationConfig: {
    // Temperature: Controls randomness in responses
    // 0.0 = Deterministic, 1.0 = Very creative
    temperature: {
      default: 0.7,
      structured: 0.3,    // Lower for structured output
      creative: 0.9,      // Higher for creative responses
      factual: 0.1        // Very low for factual queries
    },

    // Top-P (Nucleus Sampling): Probability mass for token selection
    // 0.1 = Very focused, 1.0 = Consider all tokens
    topP: {
      default: 0.8,
      focused: 0.6,       // More focused responses
      diverse: 0.95       // More diverse responses
    },

    // Top-K: Number of top tokens to consider
    // Lower values = more focused, Higher values = more diverse
    topK: {
      default: 40,
      focused: 20,        // More focused selection
      diverse: 80         // More diverse selection
    },

    // Maximum output tokens
    maxOutputTokens: {
      default: 2048,
      short: 512,         // For brief responses
      long: 4096,         // For detailed analysis
      structured: 1024    // For structured output
    },

    // Stop sequences to control response termination
    stopSequences: {
      default: ["END_RESPONSE", "STOP"],
      structured: ["END_JSON", "```"],
      conversation: ["Human:", "User:", "Assistant:"],
      analysis: ["CONCLUSION", "SUMMARY"]
    }
  },

  // Context-specific configurations
  contextConfigs: {
    // Stock price queries - factual and precise
    stockQuery: {
      temperature: 0.1,
      topP: 0.6,
      topK: 20,
      maxOutputTokens: 1024,
      stopSequences: ["END_RESPONSE"]
    },

    // Educational content - balanced creativity and accuracy
    educational: {
      temperature: 0.5,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2048,
      stopSequences: ["END_LESSON", "SUMMARY"]
    },

    // Market analysis - analytical and comprehensive
    analysis: {
      temperature: 0.3,
      topP: 0.7,
      topK: 30,
      maxOutputTokens: 3072,
      stopSequences: ["CONCLUSION", "END_ANALYSIS"]
    },

    // Creative content - higher creativity
    creative: {
      temperature: 0.8,
      topP: 0.9,
      topK: 60,
      maxOutputTokens: 2048,
      stopSequences: ["END_STORY", "THE_END"]
    },

    // Structured output - very controlled
    structured: {
      temperature: 0.1,
      topP: 0.5,
      topK: 15,
      maxOutputTokens: 1024,
      stopSequences: ["END_JSON", "```", "}"]
    },

    // Function calling - precise and deterministic
    functionCalling: {
      temperature: 0.05,
      topP: 0.4,
      topK: 10,
      maxOutputTokens: 512,
      stopSequences: ["END_FUNCTION", "COMPLETE"]
    }
  },

  // Prompting technique configurations
  promptingConfigs: {
    zeroShot: {
      temperature: 0.6,
      topP: 0.8,
      topK: 40,
      description: "Direct task execution without examples"
    },

    oneShot: {
      temperature: 0.4,
      topP: 0.7,
      topK: 30,
      description: "Single example-based learning"
    },

    multiShot: {
      temperature: 0.3,
      topP: 0.6,
      topK: 25,
      description: "Multiple example-based learning"
    },

    dynamic: {
      temperature: 0.5,
      topP: 0.8,
      topK: 35,
      description: "Context-adaptive prompt generation"
    },

    chainOfThought: {
      temperature: 0.2,
      topP: 0.7,
      topK: 30,
      description: "Step-by-step reasoning process"
    }
  },

  // Safety and content filtering
  safetySettings: {
    harassment: 'BLOCK_MEDIUM_AND_ABOVE',
    hateSpeech: 'BLOCK_MEDIUM_AND_ABOVE',
    sexuallyExplicit: 'BLOCK_MEDIUM_AND_ABOVE',
    dangerousContent: 'BLOCK_MEDIUM_AND_ABOVE'
  },

  // Token management
  tokenLimits: {
    maxInputTokens: 8192,
    maxOutputTokens: 4096,
    warningThreshold: 6000,
    costPerToken: 0.0001  // Approximate cost in USD
  },

  // Performance settings
  performance: {
    timeout: 30000,        // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000,      // 1 second
    cacheEnabled: true,
    cacheTTL: 300000       // 5 minutes
  }
};

/**
 * Get configuration for specific context
 */
function getConfigForContext(context) {
  const contextType = determineContextType(context);
  const baseConfig = aiConfig.contextConfigs[contextType] || aiConfig.contextConfigs.analysis;
  
  return {
    model: aiConfig.model.name,
    generationConfig: {
      temperature: baseConfig.temperature,
      topP: baseConfig.topP,
      topK: baseConfig.topK,
      maxOutputTokens: baseConfig.maxOutputTokens,
      stopSequences: baseConfig.stopSequences
    },
    safetySettings: Object.entries(aiConfig.safetySettings).map(([category, threshold]) => ({
      category: `HARM_CATEGORY_${category.toUpperCase()}`,
      threshold: `HARM_BLOCK_THRESHOLD_${threshold}`
    }))
  };
}

/**
 * Determine context type from user input and context
 */
function determineContextType(context) {
  if (context.type) return context.type;
  
  const query = context.query?.toLowerCase() || '';
  
  if (query.includes('price') || query.includes('quote')) return 'stockQuery';
  if (query.includes('explain') || query.includes('what is')) return 'educational';
  if (query.includes('analyze') || query.includes('analysis')) return 'analysis';
  if (query.includes('creative') || query.includes('story')) return 'creative';
  if (context.structured) return 'structured';
  if (context.functionCalling) return 'functionCalling';
  
  return 'analysis'; // Default
}

/**
 * Get configuration for prompting technique
 */
function getConfigForTechnique(technique) {
  const techniqueConfig = aiConfig.promptingConfigs[technique] || aiConfig.promptingConfigs.dynamic;
  
  return {
    model: aiConfig.model.name,
    generationConfig: {
      temperature: techniqueConfig.temperature,
      topP: techniqueConfig.topP,
      topK: techniqueConfig.topK,
      maxOutputTokens: aiConfig.generationConfig.maxOutputTokens.default,
      stopSequences: aiConfig.generationConfig.stopSequences.default
    }
  };
}

/**
 * Calculate estimated cost for token usage
 */
function calculateTokenCost(inputTokens, outputTokens) {
  const totalTokens = inputTokens + outputTokens;
  return totalTokens * aiConfig.tokenLimits.costPerToken;
}

/**
 * Validate token limits
 */
function validateTokenLimits(inputTokens, outputTokens = 0) {
  const warnings = [];
  
  if (inputTokens > aiConfig.tokenLimits.maxInputTokens) {
    warnings.push(`Input tokens (${inputTokens}) exceed limit (${aiConfig.tokenLimits.maxInputTokens})`);
  }
  
  if (outputTokens > aiConfig.tokenLimits.maxOutputTokens) {
    warnings.push(`Output tokens (${outputTokens}) exceed limit (${aiConfig.tokenLimits.maxOutputTokens})`);
  }
  
  const totalTokens = inputTokens + outputTokens;
  if (totalTokens > aiConfig.tokenLimits.warningThreshold) {
    warnings.push(`Total tokens (${totalTokens}) approaching limits`);
  }
  
  return {
    valid: warnings.length === 0,
    warnings,
    cost: calculateTokenCost(inputTokens, outputTokens)
  };
}

/**
 * Get optimized configuration based on query complexity
 */
function getOptimizedConfig(query, context = {}) {
  const queryLength = query.length;
  const complexity = determineQueryComplexity(query);
  
  let config = getConfigForContext({ ...context, query });
  
  // Adjust based on complexity
  if (complexity === 'simple') {
    config.generationConfig.temperature *= 0.8;
    config.generationConfig.maxOutputTokens = Math.min(
      config.generationConfig.maxOutputTokens, 
      aiConfig.generationConfig.maxOutputTokens.short
    );
  } else if (complexity === 'complex') {
    config.generationConfig.temperature *= 1.2;
    config.generationConfig.maxOutputTokens = aiConfig.generationConfig.maxOutputTokens.long;
  }
  
  return config;
}

/**
 * Determine query complexity
 */
function determineQueryComplexity(query) {
  const words = query.split(' ').length;
  const hasMultipleQuestions = (query.match(/\?/g) || []).length > 1;
  const hasComparison = /compare|vs|versus|difference/i.test(query);
  const hasAnalysis = /analyze|analysis|explain|detailed/i.test(query);
  
  if (words < 5 && !hasMultipleQuestions) return 'simple';
  if (words > 20 || hasMultipleQuestions || hasComparison || hasAnalysis) return 'complex';
  return 'medium';
}

module.exports = {
  aiConfig,
  getConfigForContext,
  getConfigForTechnique,
  getOptimizedConfig,
  calculateTokenCost,
  validateTokenLimits,
  determineContextType,
  determineQueryComplexity
};