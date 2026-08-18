// Multi-Provider AI LLM System
// Supports: OpenAI, Anthropic/Claude, Google Gemini, Alibaba Qwen, Together AI, Groq
// All configured for FREE tier usage where available

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  provider: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
}

export interface LLMProviderConfig {
  name: string;
  apiKeyEnvVar: string;
  models: {
    free: string;      // Free tier model
    standard: string;  // Standard/paid model
    advanced: string;  // Advanced capabilities model
  };
  maxTokens: number;
  rateLimitPerMinute: number;
}

// Provider configurations with FREE tier models prioritized
export const LLM_PROVIDERS: Record<string, LLMProviderConfig> = {
  openai: {
    name: 'OpenAI',
    apiKeyEnvVar: 'OPENAI_API_KEY',
    models: {
      free: 'gpt-4o-mini',       // Affordable, capable (as of 2024)
      standard: 'gpt-4o',         // Balanced performance
      advanced: 'gpt-4-turbo',    // Most capable
    },
    maxTokens: 4096,
    rateLimitPerMinute: 60,
  },
  anthropic: {
    name: 'Anthropic Claude',
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    models: {
      free: 'claude-3-haiku-20240307',   // Fast, affordable
      standard: 'claude-sonnet-20240514', // Balanced
      advanced: 'claude-opus-20240229',   // Most capable
    },
    maxTokens: 4096,
    rateLimitPerMinute: 50,
  },
  gemini: {
    name: 'Google Gemini',
    apiKeyEnvVar: 'GEMINI_API_KEY',
    models: {
      free: 'gemini-1.5-flash',     // Fast, free tier generous
      standard: 'gemini-1.5-pro',   // Enhanced capabilities
      advanced: 'gemini-pro',       // Original pro model
    },
    maxTokens: 8192,
    rateLimitPerMinute: 15, // Free tier limit
  },
  qwen: {
    name: 'Alibaba Qwen (通义千问)',
    apiKeyEnvVar: 'QWEN_API_KEY',
    models: {
      free: 'qwen-turbo',          // Fast, cost-effective
      standard: 'qwen-plus',        // Balanced
      advanced: 'qwen-max',         // Most capable
    },
    maxTokens: 6144,
    rateLimitPerMinute: 20,
  },
  together: {
    name: 'Together AI',
    apiKeyEnvVar: 'TOGETHER_API_KEY',
    models: {
      free: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',   // Open source, fast
      standard: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', // Capable open source
      advanced: 'Qwen/Qwen2.5-72B-Instruct-Turbo',              // Strong open source
    },
    maxTokens: 8192,
    rateLimitPerMinute: 30,
  },
  groq: {
    name: 'Groq',
    apiKeyEnvVar: 'GROQ_API_KEY',
    models: {
      free: 'llama3.1-8b-instant',     // Ultra-fast inference
      standard: 'llama3.1-70b-versatile', // Balanced speed/capability
      advanced: 'mixtral-8x7b-32768',    // Good for complex tasks
    },
    maxTokens: 8192,
    rateLimitPerMinute: 30, // Generous free tier
  },
};

export type LLMProviderName = keyof typeof LLM_PROVIDERS;

// Default provider priority (tries first available)
const PROVIDER_PRIORITY: LLMProviderName[] = [
  'groq',      // Fastest free tier
  'together',  // Good open-source models
  'gemini',    // Generous free tier
  'openai',    // $5 free credit on signup
  'anthropic', // Some free credits
  'qwen',      // Chinese market leader
];

class MultiProviderLLM {
  private activeProviders: Map<LLMProviderName, LLMProviderConfig> = new Map();
  private requestTimestamps: Map<LLMProviderName, number[]> = new Map();

  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize all providers that have API keys configured
   */
  private initializeProviders(): void {
    for (const [key, config] of Object.entries(LLM_PROVIDERS)) {
      const apiKey = process.env[config.apiKeyEnvVar];
      if (apiKey && apiKey.length > 0) {
        this.activeProviders.set(key as LLMProviderName, config);
        console.log(`✅ ${config.name} provider initialized`);
      } else {
        console.log(`⏭️  ${config.name} provider skipped (no API key)`);
      }
    }

    if (this.activeProviders.size === 0) {
      console.warn('⚠️  No LLM providers configured. Using mock mode.');
    }
  }

  /**
   * Check rate limit for a provider
   */
  private checkRateLimit(provider: LLMProviderName): boolean {
    const config = LLM_PROVIDERS[provider];
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    
    let timestamps = this.requestTimestamps.get(provider) || [];
    // Clean old timestamps outside window
    timestamps = timestamps.filter(t => now - t < windowMs);
    
    if (timestamps.length >= config.rateLimitPerMinute) {
      return false;
    }
    
    timestamps.push(now);
    this.requestTimestamps.set(provider, timestamps);
    return true;
  }

  /**
   * Get best available provider based on priority and rate limits
   */
  private getBestAvailableProvider(): { name: LLMProviderName; config: LLMProviderConfig } | null {
    for (const provider of PROVIDER_PRIORITY) {
      if (this.activeProviders.has(provider) && this.checkRateLimit(provider)) {
        return { 
          provider, 
          config: this.activeProviders.get(provider)! 
        };
      }
    }
    return null;
  }

  /**
   * Generate content using the best available provider
   * Falls back to mock mode if no providers available
   */
  async generate(
    messages: LLMMessage[],
    options?: {
      provider?: LLMProviderName;
      modelTier?: 'free' | 'standard' | 'advanced';
      temperature?: number;
      maxTokens?: number;
      jsonMode?: boolean;
    }
  ): Promise<LLMResponse> {
    const startTime = Date.now();

    // Try to use specified provider or find best available
    let targetProvider: { name: LLMProviderName; config: LLMProviderConfig } | null = null;

    if (options?.provider && this.activeProviders.has(options.provider)) {
      if (this.checkRateLimit(options.provider)) {
        targetProvider = {
          provider: options.provider,
          config: this.activeProviders.get(options.provider)!,
        };
      }
    }

    if (!targetProvider) {
      targetProvider = this.getBestAvailableProvider();
    }

    // If no provider available, use mock mode
    if (!targetProvider) {
      return this.generateMockResponse(messages, startTime);
    }

    const { provider, config } = targetProvider;
    const modelTier = options?.modelTier || 'free';
    const model = config.models[modelTier];

    try {
      let response: LLMResponse;

      switch (provider) {
        case 'openai':
          response = await this.callOpenAI(messages, model, options);
          break;
        case 'anthropic':
          response = await this.callAnthropic(messages, model, options);
          break;
        case 'gemini':
          response = await this.callGemini(messages, model, options);
          break;
        case 'qwen':
          response = await this.callQwen(messages, model, options);
          break;
        case 'together':
          response = await this.callTogether(messages, model, options);
          break;
        case 'groq':
          response = await this.callGroq(messages, model, options);
          break;
        default:
          response = this.generateMockResponse(messages, startTime);
      }

      response.latencyMs = Date.now() - startTime;
      return response;

    } catch (error) {
      console.error(`Error calling ${config.name}:`, error);
      
      // Try next provider as fallback
      if (this.activeProviders.size > 1) {
        console.log(`Trying fallback provider...`);
        return this.generate(messages, {
          ...options,
          provider: undefined, // Let it choose next best
        });
      }

      return this.generateMockResponse(messages, startTime);
    }
  }

  // ==================== PROVIDER IMPLEMENTATIONS ====================

  private async callOpenAI(
    messages: LLMMessage[],
    model: string,
    options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean }
  ): Promise<LLMResponse> {
    const apiKey = process.env.OPENAI_API_KEY!;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2048,
        response_format: options?.jsonMode ? { type: 'json_object' } : undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0]?.message?.content || '',
      provider: 'openai',
      model,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
      latencyMs: 0, // Will be set by caller
    };
  }

  private async callAnthropic(
    messages: LLMMessage[],
    model: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<LLMResponse> {
    const apiKey = process.env.ANTHROPIC_API_KEY!;

    // Convert messages to Anthropic format (system prompt separate)
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const chatMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: options?.maxTokens ?? 2048,
        system: systemMessage,
        messages: chatMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: options?.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    return {
      content: data.content[0]?.text || '',
      provider: 'anthropic',
      model,
      usage: data.usage ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      } : undefined,
      latencyMs: 0,
    };
  }

  private async callGemini(
    messages: LLMMessage[],
    model: string,
    options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean }
  ): Promise<LLMResponse> {
    const apiKey = process.env.GEMINI_API_KEY!;

    // Convert OpenAI-format messages to Gemini format
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const systemInstruction = messages.find(m => m.role === 'system')?.content;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        ...(systemInstruction && { systemInstruction: { parts: [{ text: systemInstruction }] } }),
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 2048,
          responseMimeType: options?.jsonMode ? 'application/json' : undefined,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
      provider: 'gemini',
      model,
      usage: data.usageMetadata ? {
        promptTokens: data.usageMetadata.promptTokenCount || 0,
        completionTokens: data.usageMetadata.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata.totalTokenCount || 0,
      } : undefined,
      latencyMs: 0,
    };
  }

  private async callQwen(
    messages: LLMMessage[],
    model: string,
    options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean }
  ): Promise<LLMResponse> {
    const apiKey = process.env.QWEN_API_KEY!;

    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2048,
        response_format: options?.jsonMode ? { type: 'json_object' } : undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Qwen API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0]?.message?.content || '',
      provider: 'qwen',
      model,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
      latencyMs: 0,
    };
  }

  private async callTogether(
    messages: LLMMessage[],
    model: string,
    options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean }
  ): Promise<LLMResponse> {
    const apiKey = process.env.TOGETHER_API_KEY!;

    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2048,
        response_format: options?.jsonMode ? { type: 'json_object' } : undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Together AI error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0]?.message?.content || '',
      provider: 'together',
      model,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
      latencyMs: 0,
    };
  }

  private async callGroq(
    messages: LLMMessage[],
    model: string,
    options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean }
  ): Promise<LLMResponse> {
    const apiKey = process.env.GROQ_API_KEY!;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2048,
        response_format: options?.jsonMode ? { type: 'json_object' } : undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Groq API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0]?.message?.content || '',
      provider: 'groq',
      model,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
      latencyMs: 0,
    };
  }

  /**
   * Generate mock response when no API keys are available
   * Useful for development and testing
   */
  private generateMockResponse(messages: LLMMessage[], startTime: number): LLMResponse {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    
    // Generate contextual mock responses based on the type of request
    const mockContent = this.generateContextualMock(lastUserMessage?.content || '');

    return {
      content: mockContent,
      provider: 'mock',
      model: 'nexus-mock-v1',
      usage: {
        promptTokens: 100,
        completionTokens: 150,
        totalTokens: 250,
      },
      latencyMs: Date.now() - startTime,
    };
  }

  /**
   * Generate contextual mock responses based on input
   */
  private generateContextualMock(input: string): string {
    const lowerInput = input.toLowerCase();

    // Grant application related
    if (lowerInput.includes('abstract') || lowerInput.includes('summary')) {
      return JSON.stringify({
        content: "This innovative project addresses critical challenges in [sector] through novel approaches combining [methodology A] with [technology B]. Our research demonstrates significant potential for [outcome], building on [existing foundation] while introducing groundbreaking advancements in [specific area]. The project leverages interdisciplinary expertise to deliver transformative solutions that will benefit [stakeholders] and establish new benchmarks for [field].",
        confidence: 0.85,
        wordCount: 95,
      });
    }

    if (lowerInput.includes('impact')) {
      return JSON.stringify({
        content: "Economic Impact: Creation of 15 high-skilled jobs in deep-tech sector, projected £2.4M revenue generation within 3 years. Social Impact: Enhanced accessibility to [technology/service] for underserved communities, training programs for 50+ individuals. Environmental Impact: 40% reduction in carbon footprint compared to existing solutions, sustainable supply chain implementation. Knowledge Advancement: 3 peer-reviewed publications, 2 patent applications, open-source contributions to advance field capabilities.",
        confidence: 0.88,
        dimensions: ['Economic', 'Social', 'Environmental', 'Knowledge'],
      });
    }

    if (lowerInput.includes('innovation') || lowerInput.includes('novel')) {
      return JSON.stringify({
        content: "Our approach introduces three key innovations: (1) A proprietary [algorithm/method] that achieves [specific improvement] over state-of-the-art, validated through [evidence]; (2) Novel integration of [technology X] with [domain Y], creating unprecedented capabilities for [application]; (3) Breakthrough in [specific challenge] enabling [previously impossible outcome]. These innovations are protected by [IP strategy] and represent 5+ years of R&D investment.",
        confidence: 0.82,
        noveltyPoints: 3,
      });
    }

    if (lowerInput.includes('market') || lowerInput.includes('commercial')) {
      return JSON.stringify({
        content: "Market Analysis: The global [sector] market is valued at £X.XB (2024), growing at CAGR of XX%. Our target segment ([specific niche]) shows strong demand driven by [trends]. Competitive Landscape: Key players include [competitors], but none offer our unique combination of [advantages]. Go-to-Market Strategy: Phase 1 - Pilot with [early adopters], Phase 2 - Strategic partnerships, Phase 3 - Scale through [channels]. Revenue Model: [SaaS/licensing/consulting] with projected ARR of £X by Year 3.",
        confidence: 0.80,
      });
    }

    if (lowerInput.includes('risk') || lowerInput.includes('mitigation')) {
      return JSON.stringify({
        content: "Risk Assessment: Technical Risk (Medium) - Mitigation through [approach] and expert advisory board. Market Risk (Low-Medium) - Diversified customer strategy and flexible product roadmap. Regulatory Risk (Low) - Proactive engagement with [bodies] and compliance-by-design. Resource Risk (Medium) - Strong cash position and grant funding track record. Each risk is monitored through [KPIs] with monthly review cycles.",
        confidence: 0.83,
        risksIdentified: 5,
      });
    }

    // Generic intelligent response
    return JSON.stringify({
      content: `Based on your request regarding "${input.substring(0, 50)}...", I've generated comprehensive content tailored to your specific requirements. This response incorporates industry best practices, aligns with evaluation criteria, and demonstrates clear value proposition. For production use, configure at least one AI provider API key (OpenAI, Gemini, Groq recommended for free tiers).`,
      confidence: 0.75,
      suggestion: "Configure AI API keys for real LLM-generated content",
    });
  }

  /**
   * Get status of all providers
   */
  getStatus(): Record<string, { available: boolean; name: string }> {
    const status: Record<string, { available: boolean; name: string }> = {};
    
    for (const [key, config] of Object.entries(LLM_PROVIDERS)) {
      status[key] = {
        available: this.activeProviders.has(key as LLMProviderName),
        name: config.name,
      };
    }
    
    return status;
  }

  /**
   * Stream generation (for real-time responses)
   */
  async *generateStream(
    messages: LLMMessage[],
    options?: { provider?: LLMProviderName; modelTier?: 'free' | 'standard' | 'advanced' }
  ): AsyncGenerator<{ token: string; done: boolean }> {
    // Simplified streaming - in production, implement proper SSE for each provider
    const response = await this.generate(messages, options);
    
    // Simulate tokens (in real impl, would stream actual tokens)
    const words = response.content.split(' ');
    for (let i = 0; i < words.length; i++) {
      yield {
        token: words[i] + (i < words.length - 1 ? ' ' : ''),
        done: i === words.length - 1,
      };
      // Small delay to simulate streaming
      await new Promise(resolve => setTimeout(resolve, 20));
    }
  }
}

// Singleton instance
export const ai = new MultiProviderLLM();

// Convenience functions for common use cases
export async function generateGrantAbstract(projectData: any): Promise<LLMResponse> {
  return ai.generate([
    {
      role: 'system',
      content: 'You are an expert grant writer specializing in UK/EU innovation funding. Write compelling, evidence-based abstracts that maximize success rates.',
    },
    {
      role: 'user',
      content: `Generate a compelling grant abstract for this project:\n\n${JSON.stringify(projectData, null, 2)}\n\nFocus on innovation, impact, and feasibility. Keep under 500 words.`,
    },
  ], { temperature: 0.8, modelTier: 'standard' });
}

export async function generateImpactStatement(context: any): Promise<LLMResponse> {
  return ai.generate([
    {
      role: 'system',
      content: 'You are an impact assessment expert for research and innovation funding. Create detailed impact statements covering economic, social, environmental, and knowledge advancement dimensions.',
    },
    {
      role: 'user',
      content: `Generate impact statement for:\n${JSON.stringify(context, null, 2)}`,
    },
  ], { temperature: 0.7, modelTier: 'standard' });
}

export async function analyzeCompanyData(companyInfo: any): Promise<LLMResponse> {
  return ai.generate([
    {
      role: 'system',
      content: 'You are a business intelligence analyst specializing in UK companies and deep-tech sectors. Provide insights on company health, growth potential, and funding readiness.',
    },
    {
      role: 'user',
      content: `Analyze this company data:\n${JSON.stringify(companyInfo, null, 2)}\n\nProvide insights on:\n1. Financial health indicators\n2. Growth potential\n3. Funding readiness\n4. Risk factors\n5. Recommendations`,
    },
  ], { temperature: 0.6, modelTier: 'free' }); // Use free tier for analysis
}

export async function generateGazetteSummary(notices: any[]): Promise<LLMResponse> {
  return ai.generate([
    {
      role: 'system',
      content: 'You are a government gazette monitoring specialist. Summarize relevant notices and identify opportunities or risks.',
    },
    {
      role: 'user',
      content: `Summarize these gazette notices and highlight relevant opportunities:\n${JSON.stringify(notices.slice(0, 10), null, 2)}`,
    },
  ], { temperature: 0.5, modelTier: 'free' }); // Free tier for summarization
}
