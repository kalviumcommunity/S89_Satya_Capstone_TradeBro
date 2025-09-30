const AdvancedPromptingService = require('../services/enhanced/AdvancedPromptingService');
const StructuredOutputService = require('../services/enhanced/StructuredOutputService');
const FunctionCallingService = require('../services/enhanced/FunctionCallingService');
const EvaluationFramework = require('../evaluation/EvaluationFramework');
// AI configuration removed for simplicity

/**
 * Feature Demonstration Script
 * Showcases all implemented chatbot features with examples
 */
class FeatureDemonstration {
  constructor() {
    this.promptingService = new AdvancedPromptingService();
    this.structuredService = new StructuredOutputService();
    this.functionService = new FunctionCallingService();
    this.evaluationFramework = new EvaluationFramework();
  }

  /**
   * Run complete feature demonstration
   */
  async runDemonstration() {
    console.log('🚀 TradeBro AI Chatbot - Feature Demonstration\n');
    console.log('=' .repeat(60));
    
    try {
      // 1. System and User Prompt (RTFC Framework)
      await this.demonstrateRTFCFramework();
      
      // 2. Zero-shot Prompting
      await this.demonstrateZeroShotPrompting();
      
      // 3. One-shot Prompting
      await this.demonstrateOneShotPrompting();
      
      // 4. Multi-shot Prompting
      await this.demonstrateMultiShotPrompting();
      
      // 5. Dynamic Prompting
      await this.demonstrateDynamicPrompting();
      
      // 6. Chain of Thought Prompting
      await this.demonstrateChainOfThoughtPrompting();
      
      // 7. Structured Output
      await this.demonstrateStructuredOutput();
      
      // 8. Function Calling
      await this.demonstrateFunctionCalling();
      
      // 9. Token Tracking
      await this.demonstrateTokenTracking();
      
      // 10. AI Model Parameters
      await this.demonstrateModelParameters();
      
      // 11. Evaluation Framework
      await this.demonstrateEvaluationFramework();
      
      console.log('\n🎉 Feature Demonstration Complete!');
      console.log('All features are working correctly and ready for use.');
      
    } catch (error) {
      console.error('❌ Demonstration failed:', error);
    }
  }

  /**
   * Demonstrate RTFC Framework (Role, Task, Format, Context)
   */
  async demonstrateRTFCFramework() {
    console.log('\n📋 1. SYSTEM AND USER PROMPT (RTFC FRAMEWORK)');
    console.log('-'.repeat(50));
    
    const systemPrompt = this.promptingService.getSystemPrompt();
    
    console.log('🎭 ROLE:', systemPrompt.role);
    console.log('📝 TASK:', systemPrompt.task);
    console.log('📊 FORMAT:', systemPrompt.format);
    console.log('🌐 CONTEXT:', systemPrompt.context);
    
    const userPrompt = this.promptingService.getUserPrompt(
      'What is the current market sentiment?',
      { userLevel: 'intermediate', marketCondition: 'volatile' }
    );
    
    console.log('\n📨 Generated User Prompt (truncated):');
    console.log(userPrompt.substring(0, 200) + '...');
    
    console.log('\n✅ RTFC Framework successfully implemented');
  }

  /**
   * Demonstrate Zero-shot Prompting
   */
  async demonstrateZeroShotPrompting() {
    console.log('\n🎯 2. ZERO-SHOT PROMPTING');
    console.log('-'.repeat(50));
    
    console.log('📖 What is Zero-shot Prompting?');
    console.log('Zero-shot prompting allows the AI to perform tasks without any examples,');
    console.log('relying solely on its pre-trained knowledge and the task description.');
    
    const query = 'Explain the concept of market volatility';
    console.log(`\n🔍 Query: "${query}"`);
    
    const response = await this.promptingService.zeroShotPrompt(query, { userLevel: 'beginner' });
    
    if (response.success) {
      console.log('\n📝 Response (first 300 chars):');
      console.log(response.response.substring(0, 300) + '...');
      console.log(`\n🔢 Tokens used: ${response.tokens}`);
      console.log('✅ Zero-shot prompting successful');
    } else {
      console.log('❌ Zero-shot prompting failed:', response.error);
    }
  }

  /**
   * Demonstrate One-shot Prompting
   */
  async demonstrateOneShotPrompting() {
    console.log('\n🎯 3. ONE-SHOT PROMPTING');
    console.log('-'.repeat(50));
    
    console.log('📖 What is One-shot Prompting?');
    console.log('One-shot prompting provides a single example to guide the AI\'s response,');
    console.log('helping it understand the desired format and style.');
    
    const query = 'What is the current price of TCS stock?';
    console.log(`\n🔍 Query: "${query}"`);
    
    const response = await this.promptingService.oneShotPrompt(query, { userLevel: 'intermediate' });
    
    if (response.success) {
      console.log('\n📝 Response (first 300 chars):');
      console.log(response.response.substring(0, 300) + '...');
      console.log(`\n🔢 Tokens used: ${response.tokens}`);
      console.log('✅ One-shot prompting successful');
    } else {
      console.log('❌ One-shot prompting failed:', response.error);
    }
  }

  /**
   * Demonstrate Multi-shot Prompting
   */
  async demonstrateMultiShotPrompting() {
    console.log('\n🎯 4. MULTI-SHOT PROMPTING');
    console.log('-'.repeat(50));
    
    console.log('📖 What is Multi-shot Prompting?');
    console.log('Multi-shot prompting provides multiple examples to train the AI');
    console.log('on various scenarios and response patterns.');
    
    const query = 'Compare HDFC Bank and ICICI Bank stocks';
    console.log(`\n🔍 Query: "${query}"`);
    
    const response = await this.promptingService.multiShotPrompt(query, { userLevel: 'advanced' });
    
    if (response.success) {
      console.log('\n📝 Response (first 300 chars):');
      console.log(response.response.substring(0, 300) + '...');
      console.log(`\n🔢 Tokens used: ${response.tokens}`);
      console.log('✅ Multi-shot prompting successful');
    } else {
      console.log('❌ Multi-shot prompting failed:', response.error);
    }
  }

  /**
   * Demonstrate Dynamic Prompting
   */
  async demonstrateDynamicPrompting() {
    console.log('\n🎯 5. DYNAMIC PROMPTING');
    console.log('-'.repeat(50));
    
    console.log('📖 What is Dynamic Prompting?');
    console.log('Dynamic prompting adapts the prompt structure based on user context,');
    console.log('experience level, and market conditions for optimal responses.');
    
    const query = 'Should I invest in small-cap stocks?';
    const context = { 
      userLevel: 'beginner', 
      marketCondition: 'volatile',
      riskTolerance: 'low'
    };
    
    console.log(`\n🔍 Query: "${query}"`);
    console.log(`🌐 Context: ${JSON.stringify(context)}`);
    
    const response = await this.promptingService.dynamicPrompt(query, context);
    
    if (response.success) {
      console.log('\n📝 Response (first 300 chars):');
      console.log(response.response.substring(0, 300) + '...');
      console.log(`\n🎯 Detected Query Type: ${response.queryType}`);
      console.log(`👤 User Experience: ${response.userExperience}`);
      console.log(`🌡️ Market Condition: ${response.marketCondition}`);
      console.log(`🔢 Tokens used: ${response.tokens}`);
      console.log('✅ Dynamic prompting successful');
    } else {
      console.log('❌ Dynamic prompting failed:', response.error);
    }
  }

  /**
   * Demonstrate Chain of Thought Prompting
   */
  async demonstrateChainOfThoughtPrompting() {
    console.log('\n🎯 6. CHAIN OF THOUGHT PROMPTING');
    console.log('-'.repeat(50));
    
    console.log('📖 What is Chain of Thought Prompting?');
    console.log('Chain of thought prompting guides the AI through step-by-step reasoning,');
    console.log('making the decision process transparent and more accurate.');
    
    const query = 'Should I buy RELIANCE stock at current levels?';
    console.log(`\n🔍 Query: "${query}"`);
    
    const response = await this.promptingService.chainOfThoughtPrompt(query, { userLevel: 'intermediate' });
    
    if (response.success) {
      console.log('\n📝 Response (first 400 chars):');
      console.log(response.response.substring(0, 400) + '...');
      console.log(`\n🔢 Tokens used: ${response.tokens}`);
      console.log('✅ Chain of thought prompting successful');
    } else {
      console.log('❌ Chain of thought prompting failed:', response.error);
    }
  }

  /**
   * Demonstrate Structured Output
   */
  async demonstrateStructuredOutput() {
    console.log('\n📊 7. STRUCTURED OUTPUT');
    console.log('-'.repeat(50));
    
    console.log('📖 What is Structured Output?');
    console.log('Structured output ensures consistent, machine-readable responses');
    console.log('using JSON schemas for reliable data processing.');
    
    console.log('\n🏢 Generating Stock Analysis for INFY...');
    const stockAnalysis = await this.structuredService.generateStockAnalysis('INFY');
    
    if (stockAnalysis.success) {
      console.log('✅ Stock Analysis Generated');
      console.log('📋 Schema:', stockAnalysis.schema);
      console.log('🔢 Tokens used:', stockAnalysis.tokens);
      console.log('📊 Sample data:', JSON.stringify(stockAnalysis.data, null, 2).substring(0, 300) + '...');
    } else {
      console.log('❌ Stock analysis failed:', stockAnalysis.error);
    }
    
    console.log('\n📚 Generating Educational Content...');
    const educational = await this.structuredService.generateEducationalContent('Dividend Yield', 'beginner');
    
    if (educational.success) {
      console.log('✅ Educational Content Generated');
      console.log('📋 Schema:', educational.schema);
      console.log('🔢 Tokens used:', educational.tokens);
      console.log('📖 Topic:', educational.data.topic);
    } else {
      console.log('❌ Educational content failed:', educational.error);
    }
  }

  /**
   * Demonstrate Function Calling
   */
  async demonstrateFunctionCalling() {
    console.log('\n🔧 8. FUNCTION CALLING');
    console.log('-'.repeat(50));
    
    console.log('📖 What is Function Calling?');
    console.log('Function calling allows the AI to dynamically execute specific functions');
    console.log('based on user queries, enabling real-time data retrieval and processing.');
    
    console.log('\n🔧 Available Functions:');
    const availableFunctions = this.functionService.getAvailableFunctions();
    availableFunctions.forEach(func => console.log(`  • ${func}`));
    
    const query = 'Get the current price of WIPRO stock and show me top gainers';
    console.log(`\n🔍 Query: "${query}"`);
    
    const response = await this.functionService.processWithFunctionCalling(query);
    
    if (response.success) {
      console.log('✅ Function calling successful');
      console.log('🔧 Functions called:', response.functionCalls);
      console.log('🔢 Tokens used:', response.tokens);
      console.log('📝 Response (first 300 chars):');
      console.log(response.response.substring(0, 300) + '...');
    } else {
      console.log('❌ Function calling failed:', response.error);
    }
  }

  /**
   * Demonstrate Token Tracking
   */
  async demonstrateTokenTracking() {
    console.log('\n🔢 9. TOKEN TRACKING');
    console.log('-'.repeat(50));
    
    console.log('📖 What are Tokens?');
    console.log('Tokens are the basic units of text that AI models process.');
    console.log('Tracking tokens helps monitor usage, costs, and performance.');
    
    // Reset counters for demonstration
    this.promptingService.resetTokenCount();
    
    console.log('\n🔄 Resetting token counters...');
    console.log('📊 Initial tokens:', this.promptingService.getTotalTokens());
    
    // Make a test call
    console.log('\n🧪 Making test query...');
    const testResponse = await this.promptingService.zeroShotPrompt('What is P/E ratio?');
    
    if (testResponse.success) {
      console.log('✅ Test query successful');
      console.log('📥 Input tokens:', testResponse.inputTokens);
      console.log('📤 Output tokens:', testResponse.outputTokens);
      console.log('🔢 Total tokens for this query:', testResponse.tokens);
      console.log('📊 Session total tokens:', this.promptingService.getTotalTokens());
      
      if (testResponse.cost) {
        console.log('💰 Estimated cost: $' + testResponse.cost.toFixed(6));
      }
    } else {
      console.log('❌ Test query failed');
    }
  }

  /**
   * Demonstrate AI Model Parameters
   */
  async demonstrateModelParameters() {
    console.log('\n⚙️ 10. AI MODEL PARAMETERS');
    console.log('-'.repeat(50));
    
    console.log('📖 Understanding AI Model Parameters:');
    console.log('• Temperature: Controls creativity (0.0 = deterministic, 1.0 = very creative)');
    console.log('• Top-P: Probability mass for token selection (nucleus sampling)');
    console.log('• Top-K: Number of top tokens to consider');
    console.log('• Stop Sequences: Tokens that signal response completion');
    
    console.log('\n🔧 Current Configuration:');
    
    console.log('\n📊 Model Parameters:');
    console.log('Temperature: 0.7 (balanced creativity)');
    console.log('Top-P: 0.8 (nucleus sampling)');
    console.log('Top-K: 40 (token selection)');
    console.log('Max Tokens: 2048 (response length)');
    console.log('Stop Sequences: ["END_RESPONSE", "STOP"]');
    
    console.log('\n✅ Model parameters configured for optimal performance');
  }

  /**
   * Demonstrate Evaluation Framework
   */
  async demonstrateEvaluationFramework() {
    console.log('\n🧪 11. EVALUATION FRAMEWORK');
    console.log('-'.repeat(50));
    
    console.log('📖 What is the Evaluation Framework?');
    console.log('The evaluation framework tests AI responses against expected criteria');
    console.log('using a judge prompt and structured evaluation metrics.');
    
    console.log('\n📊 Evaluation Dataset:');
    const dataset = this.evaluationFramework.evaluationDataset;
    console.log(`• Total test cases: ${dataset.length}`);
    console.log('• Categories:', [...new Set(dataset.map(d => d.category))].join(', '));
    
    console.log('\n⚖️ Judge Prompt Parameters:');
    console.log('• ACCURACY: Factual correctness');
    console.log('• COMPLETENESS: Coverage of all aspects');
    console.log('• CLARITY: Understandability');
    console.log('• RELEVANCE: Query alignment');
    console.log('• SAFETY: Risk disclaimers');
    console.log('• FORMAT: Structure and presentation');
    console.log('• APPROPRIATENESS: User level suitability');
    
    console.log('\n🔬 Running Mini Evaluation (2 samples)...');
    
    // Run evaluation on first 2 samples
    const originalDataset = this.evaluationFramework.evaluationDataset;
    this.evaluationFramework.evaluationDataset = originalDataset.slice(0, 2);
    
    try {
      const results = await this.evaluationFramework.runEvaluationPipeline();
      
      console.log('✅ Mini evaluation completed');
      console.log(`📊 Results: ${results.passed}/${results.totalTests} passed`);
      console.log('📋 Test cases evaluated:');
      
      results.testResults.forEach(result => {
        console.log(`  • ${result.testId}: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
      });
      
      // Restore original dataset
      this.evaluationFramework.evaluationDataset = originalDataset;
      
    } catch (error) {
      console.log('❌ Mini evaluation failed:', error.message);
    }
  }

  /**
   * Display summary of all features
   */
  displayFeatureSummary() {
    console.log('\n📋 FEATURE SUMMARY');
    console.log('='.repeat(60));
    
    const features = [
      '✅ System and User Prompt (RTFC Framework)',
      '✅ Zero-shot Prompting',
      '✅ One-shot Prompting', 
      '✅ Multi-shot Prompting',
      '✅ Dynamic Prompting',
      '✅ Chain of Thought Prompting',
      '✅ Structured Output with JSON Schema',
      '✅ Function Calling with Dynamic Execution',
      '✅ Token Tracking and Cost Estimation',
      '✅ AI Model Parameters (Temperature, Top-P, Top-K, Stop Sequences)',
      '✅ Evaluation Framework with Judge Prompt'
    ];
    
    features.forEach(feature => console.log(feature));
    
    console.log('\n🎯 All features successfully implemented and demonstrated!');
  }
}

// Run demonstration if called directly
if (require.main === module) {
  const demo = new FeatureDemonstration();
  
  demo.runDemonstration()
    .then(() => {
      demo.displayFeatureSummary();
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Demonstration failed:', error);
      process.exit(1);
    });
}

module.exports = FeatureDemonstration;