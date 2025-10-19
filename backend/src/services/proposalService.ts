export interface Proposal {
  title: string;
  objective: string;
  features: string[];
  targetAudience: string;
  considerations: string[];
}

export interface ApiError {
  name: string;
  message: string;
  type: 'QUOTA_EXCEEDED' | 'AUTH_ERROR' | 'MODEL_NOT_FOUND' | 'NETWORK_ERROR' | 'VALIDATION_ERROR' | 'UNKNOWN_ERROR';
  retryable: boolean;
  userMessage: string;
}

export interface ProposalResult {
  proposal: Proposal;
  source: 'ai' | 'fallback';
  error?: ApiError;
}

class ProposalServiceError extends Error {
  constructor(
    message: string,
    public type: ApiError['type'],
    public retryable: boolean,
    public userMessage: string
  ) {
    super(message);
    this.name = 'ProposalServiceError';
  }
}

export async function generateProposal(idea: string): Promise<ProposalResult> {
  // Enhanced fallback data with multiple variations
  const getEnhancedFallback = (userIdea: string): Proposal => {
    const truncatedIdea = userIdea.substring(0, 50);
    const ellipsis = userIdea.length > 50 ? '...' : '';
    
    const fallbacks = [
      {
        title: `Strategic Initiative: ${truncatedIdea}${ellipsis}`,
        objective: `This comprehensive project addresses: "${userIdea}". We will deliver an innovative solution combining modern technology with user-centered design to achieve exceptional business outcomes and operational excellence.`,
        features: [
          "Core functionality implementation with comprehensive error handling",
          "Responsive multi-platform user interface design",
          "Scalable cloud-native architecture foundation",
          "Enterprise-grade security and data protection framework",
          "Real-time analytics and performance monitoring capabilities",
          "Seamless third-party API integrations",
          "Automated testing and continuous deployment pipeline",
          "Comprehensive documentation and support materials"
        ],
        targetAudience: "Primary stakeholders including business users, technical teams, administrators, and end-customers requiring efficient, reliable, and scalable solutions.",
        considerations: [
          "Technology stack evaluation and proof-of-concept development",
          "Agile project management with sprint planning and milestone tracking",
          "Resource allocation and cross-functional team coordination",
          "Budget planning with risk-adjusted contingency reserves",
          "Security compliance and regulatory requirements analysis",
          "Performance benchmarking and scalability testing strategy",
          "User acceptance testing and feedback incorporation process",
          "Post-launch support and maintenance planning"
        ]
      },
      {
        title: `Project Catalyst: ${truncatedIdea}${ellipsis}`,
        objective: `Our project focuses on transforming "${userIdea}" into a market-ready solution. This initiative will leverage cutting-edge technology to deliver measurable business outcomes and sustainable competitive advantage.`,
        features: [
          "Advanced feature set with modular, maintainable architecture",
          "Cross-platform compatibility and accessibility compliance",
          "Real-time data processing and analytics dashboard",
          "Automated workflow optimization and process streamlining",
          "Robust integration capabilities with existing enterprise systems",
          "Comprehensive monitoring, logging, and alerting systems",
          "User training materials and knowledge base development",
          "Disaster recovery and business continuity planning"
        ],
        targetAudience: "Business stakeholders, technical implementation teams, end-users across multiple departments, and system administrators requiring comprehensive solutions.",
        considerations: [
          "Detailed technology stack evaluation and selection criteria",
          "Development methodology and project governance framework",
          "Quality assurance strategy and testing automation approach",
          "Phased deployment and rollout planning across environments",
          "Training, documentation, and change management requirements",
          "Performance optimization and capacity planning analysis",
          "Security audit and penetration testing requirements",
          "Long-term maintenance and evolution roadmap"
        ]
      }
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  };

  const validateProposal = (proposal: any): proposal is Proposal => {
    if (typeof proposal !== 'object' || proposal === null) {
      return false;
    }

    const hasTitle = typeof proposal.title === 'string' && proposal.title.length > 0;
    const hasObjective = typeof proposal.objective === 'string' && proposal.objective.length > 0;
    const hasFeatures = Array.isArray(proposal.features) && 
                       proposal.features.length > 0 && 
                       proposal.features.every((f: any) => typeof f === 'string' && f.length > 0);
    const hasAudience = typeof proposal.targetAudience === 'string' && proposal.targetAudience.length > 0;
    const hasConsiderations = Array.isArray(proposal.considerations) && 
                             proposal.considerations.length > 0 && 
                             proposal.considerations.every((c: any) => typeof c === 'string' && c.length > 0);

    return hasTitle && hasObjective && hasFeatures && hasAudience && hasConsiderations;
  };

  const cleanAndParseJSON = (text: string): Proposal => {
    if (!text || typeof text !== 'string') {
      throw new ProposalServiceError(
        'Empty or invalid response text',
        'VALIDATION_ERROR',
        true,
        'AI service returned an invalid response'
      );
    }

    // Remove markdown code blocks and extra whitespace
    let cleaned = text
      .replace(/```json\s*/g, '')
      .replace(/\s*```/g, '')
      .trim();

    // Extract JSON object more robustly
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new ProposalServiceError(
        'No JSON object found in response',
        'VALIDATION_ERROR',
        true,
        'AI response format was unexpected'
      );
    }

    cleaned = jsonMatch[0];

    try {
      const parsed = JSON.parse(cleaned);
      if (validateProposal(parsed)) {
        return parsed;
      }
      throw new ProposalServiceError(
        'Proposal validation failed - missing required fields',
        'VALIDATION_ERROR',
        true,
        'AI response was incomplete or malformed'
      );
    } catch (parseError) {
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
      throw new ProposalServiceError(
        `JSON parsing failed: ${errorMessage}`,
        'VALIDATION_ERROR',
        true,
        'Failed to process AI response format'
      );
    }
  };

  // Main execution
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    
    // Check API key configuration
    if (!apiKey || apiKey === 'your_google_ai_api_key_here') {
      console.warn('API key not configured - using enhanced fallback data');
      return {
        proposal: getEnhancedFallback(idea),
        source: 'fallback'
      };
    }

    // Validate input
    if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
      return {
        proposal: getEnhancedFallback(idea),
        source: 'fallback',
        error: {
          name: 'ValidationError',
          message: 'Invalid input idea',
          type: 'VALIDATION_ERROR',
          retryable: false,
          userMessage: 'Please provide a valid project idea'
        }
      };
    }

    const trimmedIdea = idea.trim();
    if (trimmedIdea.length > 4000) {
      return {
        proposal: getEnhancedFallback(trimmedIdea.substring(0, 4000)),
        source: 'fallback',
        error: {
          name: 'ValidationError',
          message: 'Input too long',
          type: 'VALIDATION_ERROR',
          retryable: false,
          userMessage: 'Project idea is too long. Please keep it under 4000 characters.'
        }
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    // Try multiple models in order of availability
    const models = [
      'gemini-pro',           // Most widely available
      'gemini-1.0-pro',       // Alternative
      'gemini-1.5-flash-latest' // Latest flash model
    ];

    let lastError: Error | null = null;

    for (const model of models) {
      try {
        console.log(`Trying AI model: ${model}`);
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Create a professional project proposal as valid JSON for: "${trimmedIdea}". 
                  Return ONLY JSON without any additional text, markdown, or explanations.
                  Required structure:
                  {
                    "title": "Professional, concise project title",
                    "objective": "Clear one-paragraph objective describing project goals and value",
                    "features": ["Specific feature 1", "Specific feature 2", "Specific feature 3", "Specific feature 4", "Specific feature 5"],
                    "targetAudience": "Description of primary users, stakeholders, and beneficiaries",
                    "considerations": ["Technical consideration", "Resource consideration", "Timeline consideration", "Risk consideration", "Compliance consideration"]
                  }
                  
                  Ensure all fields are populated and features/considerations are actionable and specific.`
                }]
              }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1500,
                topP: 0.8,
                topK: 40
              },
              safetySettings: [
                {
                  category: "HARM_CATEGORY_HARASSMENT",
                  threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                  category: "HARM_CATEGORY_HATE_SPEECH", 
                  threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
              ]
            }),
            signal: controller.signal
          }
        );

        if (response.ok) {
          const data = await response.json();
          
          if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            console.log(`Model ${model} returned empty response`);
            lastError = new Error('Empty response from AI model');
            continue;
          }

          const text = data.candidates[0].content.parts[0].text;
          const proposal = cleanAndParseJSON(text);
          
          console.log(`Successfully generated proposal using model: ${model}`);
          clearTimeout(timeoutId);
          return { proposal, source: 'ai' };

        } else {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: { message: errorText } };
          }

          console.log(`Model ${model} failed with status ${response.status}:`, errorData.error?.message);

          if (response.status === 429) {
            // Quota exceeded - no point trying other models
            console.log('Quota exceeded on all models, using fallback');
            clearTimeout(timeoutId);
            return {
              proposal: getEnhancedFallback(trimmedIdea),
              source: 'fallback',
              error: {
                name: 'QuotaExceededError',
                message: 'API quota exceeded for all models',
                type: 'QUOTA_EXCEEDED',
                retryable: false,
                userMessage: 'AI service quota has been reached for today. Using demo data. The quota resets daily.'
              }
            };
          } else if (response.status === 404) {
            // Model not found - try next one
            lastError = new Error(`Model ${model} not found`);
            continue;
          } else if (response.status === 401 || response.status === 403) {
            // Auth error - no point trying other models
            console.log('Authentication failed, using fallback');
            clearTimeout(timeoutId);
            return {
              proposal: getEnhancedFallback(trimmedIdea),
              source: 'fallback', 
              error: {
                name: 'AuthError',
                message: 'API authentication failed',
                type: 'AUTH_ERROR',
                retryable: false,
                userMessage: 'API authentication failed. Please check your API key configuration.'
              }
            };
          } else {
            // Other error - try next model
            lastError = new Error(`HTTP ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
            continue;
          }
        }

      } catch (fetchError) {
        console.log(`Model ${model} fetch error:`, fetchError instanceof Error ? fetchError.message : 'Unknown error');
        
        if (fetchError instanceof ProposalServiceError) {
          // JSON parsing error from cleanAndParseJSON
          lastError = fetchError;
          continue;
        } else if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          // Timeout - break out of loop
          lastError = new Error('Request timeout across all models');
          break;
        } else {
          // Network error - try next model
          lastError = fetchError instanceof Error ? fetchError : new Error('Unknown fetch error');
          continue;
        }
      }
    }

    // If we get here, all models failed
    clearTimeout(timeoutId);
    console.log('All AI models failed, using enhanced fallback');

    return {
      proposal: getEnhancedFallback(trimmedIdea),
      source: 'fallback',
      error: {
        name: 'AllModelsFailed',
        message: lastError?.message || 'All AI models failed',
        type: 'MODEL_NOT_FOUND',
        retryable: true,
        userMessage: 'AI services are currently unavailable. Using high-quality demo data based on your idea.'
      }
    };
    
  } catch (error) {
    // This catch block handles any unexpected errors in the main try block
    console.error('Unexpected error in proposal generation:', error);
    
    return {
      proposal: getEnhancedFallback(idea),
      source: 'fallback',
      error: {
        name: 'UnexpectedError',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        type: 'UNKNOWN_ERROR',
        retryable: true,
        userMessage: 'An unexpected error occurred. Showing demo proposal based on your idea.'
      }
    };
  }
}