const AdvancedPromptingService = require('../services/enhanced/AdvancedPromptingService');
const StructuredOutputService = require('../services/enhanced/StructuredOutputService');
const FunctionCallingService = require('../services/enhanced/FunctionCallingService');

/**
 * Evaluation Framework for testing AI chatbot responses
 * Includes dataset, judge prompt, and testing pipeline
 */
class EvaluationFramework {
  constructor() {
    this.promptingService = new AdvancedPromptingService();
    this.structuredService = new StructuredOutputService();
    this.functionService = new FunctionCallingService();
    
    this.evaluationDataset = this.createEvaluationDataset();
    this.judgePrompt = this.createJudgePrompt();
    this.testResults = [];
  }

  /**
   * Create evaluation dataset with 5+ samples
   */
  createEvaluationDataset() {
    return [
      {
        id: 'test_001',
        category: 'stock_price_query',
        input: 'What is the current price of RELIANCE stock?',
        context: { userLevel: 'beginner' },
        expectedOutput: {
          type: 'stock_data',
          shouldInclude: ['current price', 'price change', 'market cap', 'disclaimer'],
          shouldNotInclude: ['buy recommendation', 'sell recommendation'],
          format: 'structured_response',
          sentiment: 'neutral_informative'
        },
        evaluationCriteria: {
          accuracy: 'Must include actual stock data',
          completeness: 'Should include key metrics',
          clarity: 'Easy to understand for beginners',
          safety: 'Must include risk disclaimer'
        }
      },
      
      {
        id: 'test_002',
        category: 'stock_comparison',
        input: 'Compare TCS and INFY stocks for investment',
        context: { userLevel: 'intermediate' },
        expectedOutput: {
          type: 'comparison',
          shouldInclude: ['TCS data', 'INFY data', 'comparison metrics', 'analysis'],
          shouldNotInclude: ['guaranteed returns', 'definitive buy/sell advice'],
          format: 'side_by_side_comparison',
          sentiment: 'analytical_balanced'
        },
        evaluationCriteria: {
          accuracy: 'Correct data for both stocks',
          completeness: 'Comprehensive comparison',
          objectivity: 'Balanced analysis without bias',
          usefulness: 'Actionable insights provided'
        }
      },
      
      {
        id: 'test_003',
        category: 'educational_query',
        input: 'Explain what is P/E ratio and how to use it?',
        context: { userLevel: 'beginner' },
        expectedOutput: {
          type: 'educational',
          shouldInclude: ['definition', 'formula', 'example', 'practical application'],
          shouldNotInclude: ['complex jargon', 'advanced concepts'],
          format: 'educational_structured',
          sentiment: 'educational_friendly'
        },
        evaluationCriteria: {
          clarity: 'Simple language for beginners',
          completeness: 'Covers all aspects of P/E ratio',
          practicality: 'Includes real-world examples',
          engagement: 'Interesting and easy to follow'
        }
      },
      
      {
        id: 'test_004',
        category: 'market_overview',
        input: 'What are today\'s top gainers in the stock market?',
        context: { userLevel: 'intermediate' },
        expectedOutput: {
          type: 'top_movers',
          shouldInclude: ['stock symbols', 'price changes', 'percentage gains', 'volume data'],
          shouldNotInclude: ['outdated data', 'irrelevant stocks'],
          format: 'ranked_list',
          sentiment: 'informative_current'
        },
        evaluationCriteria: {
          timeliness: 'Current market data',
          relevance: 'Actual top gainers',
          completeness: 'Sufficient number of stocks',
          formatting: 'Clear ranking and data presentation'
        }
      },
      
      {
        id: 'test_005',
        category: 'risk_assessment',
        input: 'Is it safe to invest in small-cap stocks during market volatility?',
        context: { userLevel: 'beginner', marketCondition: 'volatile' },
        expectedOutput: {
          type: 'risk_analysis',
          shouldInclude: ['risk factors', 'market volatility impact', 'safety considerations', 'alternatives'],
          shouldNotInclude: ['guaranteed safety', 'definitive yes/no answer'],
          format: 'risk_balanced_analysis',
          sentiment: 'cautious_educational'
        },
        evaluationCriteria: {
          safety: 'Emphasizes risks appropriately',
          balance: 'Presents both sides fairly',
          education: 'Explains concepts clearly',
          responsibility: 'Encourages careful consideration'
        }
      }
    ];
  }

  /**
   * Create judge prompt for evaluating responses
   */
  createJudgePrompt() {
    return `You are an expert AI evaluator specializing in financial chatbot responses. Your task is to evaluate chatbot responses against expected criteria.

Evaluation Parameters:
1. ACCURACY (0-100): How factually correct is the response?
2. COMPLETENESS (0-100): Does it cover all necessary aspects?
3. CLARITY (0-100): How clear and understandable is the response?
4. RELEVANCE (0-100): How well does it address the user's query?
5. SAFETY (0-100): Does it include appropriate disclaimers and risk warnings?
6. FORMAT (0-100): Is the response well-structured and formatted?
7. APPROPRIATENESS (0-100): Is it suitable for the user's experience level?

Scoring Guidelines:
- 90-100: Excellent - Exceeds expectations
- 80-89: Good - Meets expectations well
- 70-79: Satisfactory - Meets basic expectations
- 60-69: Below Average - Some issues present
- 0-59: Poor - Significant problems

Return your evaluation in this JSON format:
{
  "scores": {
    "accuracy": 85,
    "completeness": 90,
    "clarity": 88,
    "relevance": 92,
    "safety": 95,
    "format": 87,
    "appropriateness": 89
  },
  "overall_score": 89.4,
  "strengths": ["Clear explanation", "Good examples"],
  "improvements": ["Could include more details"],
  "pass_fail": "PASS",
  "reasoning": "Response meets criteria well"
}`;
  }

  /**
   * Run complete evaluation pipeline
   */
  async runEvaluationPipeline() {
    console.log('🧪 Starting Evaluation Pipeline...');
    
    const results = {
      timestamp: new Date().toISOString(),
      totalTests: this.evaluationDataset.length,
      passed: 0,
      failed: 0,
      testResults: []
    };

    for (const testCase of this.evaluationDataset) {
      console.log(`\n🔍 Testing: ${testCase.id}`);
      
      try {
        const response = await this.promptingService.zeroShotPrompt(
          testCase.input, 
          testCase.context
        );
        
        const evaluation = await this.evaluateResponse(testCase, response.response);
        
        const testResult = {
          testId: testCase.id,
          category: testCase.category,
          input: testCase.input,
          response: response.response,
          evaluation: evaluation,
          passed: evaluation.pass_fail === 'PASS'
        };
        
        results.testResults.push(testResult);
        
        if (testResult.passed) {
          results.passed++;
          console.log(`✅ ${testCase.id}: PASSED`);
        } else {
          results.failed++;
          console.log(`❌ ${testCase.id}: FAILED`);
        }
        
      } catch (error) {
        console.error(`❌ Error testing ${testCase.id}:`, error);
        results.failed++;
      }
    }
    
    this.testResults = results;
    console.log(`\n📊 Results: ${results.passed}/${results.totalTests} passed`);
    
    return results;
  }

  /**
   * Evaluate individual response
   */
  async evaluateResponse(testCase, response) {
    const evaluationPrompt = `${this.judgePrompt}

Test Case: ${testCase.id}
Input: "${testCase.input}"
Expected: ${JSON.stringify(testCase.expectedOutput)}

Response to Evaluate: "${response}"

Evaluate this response and return JSON assessment.`;

    try {
      const result = await this.promptingService.model.generateContent(evaluationPrompt);
      const evaluationText = result.response.text();
      
      const cleanedResponse = this.cleanJsonResponse(evaluationText);
      return JSON.parse(cleanedResponse);
    } catch (error) {
      return {
        scores: { accuracy: 0, completeness: 0, clarity: 0, relevance: 0, safety: 0, format: 0, appropriateness: 0 },
        overall_score: 0,
        pass_fail: 'FAIL',
        reasoning: 'Evaluation failed'
      };
    }
  }

  cleanJsonResponse(response) {
    let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const firstBrace = cleaned.indexOf('{');
    if (firstBrace > 0) cleaned = cleaned.substring(firstBrace);
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace < cleaned.length - 1) cleaned = cleaned.substring(0, lastBrace + 1);
    return cleaned.trim();
  }

  getTestResults() {
    return this.testResults;
  }
}

module.exports = EvaluationFramework;