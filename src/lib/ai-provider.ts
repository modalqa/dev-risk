import { prisma } from '@/lib/prisma';

export type AiProviderType = 'OPENAI' | 'GEMINI' | 'OLLAMA';

export interface AiProvider {
  id: string;
  name: string;
  type: AiProviderType;
  displayName: string;
  isActive: boolean;
  apiKey?: string | null;
  baseUrl?: string | null;
  model: string;
  config?: any;
}

export interface AiResponse {
  content: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export class AiProviderManager {
  private static instance: AiProviderManager;
  private activeProvider: AiProvider | null = null;
  private lastFetch: number = 0;
  private readonly cacheTimeout = 60000; // 1 minute

  private constructor() {}

  static getInstance(): AiProviderManager {
    if (!AiProviderManager.instance) {
      AiProviderManager.instance = new AiProviderManager();
    }
    return AiProviderManager.instance;
  }

  async getActiveProvider(): Promise<AiProvider | null> {
    const now = Date.now();
    
    // Cache provider for 1 minute
    if (this.activeProvider && (now - this.lastFetch) < this.cacheTimeout) {
      return this.activeProvider;
    }

    try {
      const provider = await prisma.aiProvider.findFirst({
        where: { isActive: true }
      });

      this.activeProvider = provider;
      this.lastFetch = now;
      
      return provider;
    } catch (error) {
      console.error('Failed to fetch active AI provider:', error);
      return null;
    }
  }

  async generateCompletion(prompt: string, options?: {
    maxTokens?: number;
    temperature?: number;
  }): Promise<AiResponse> {
    const provider = await this.getActiveProvider();
    
    if (!provider) {
      console.log('[AI Provider Manager] No active AI provider configured');
      throw new Error('No active AI provider configured');
    }

    console.log(`[AI Provider Manager] Using ${provider.type} provider: ${provider.name}`);
    console.log(`[AI Provider Manager] Model: ${provider.model}, Max tokens: ${options?.maxTokens || 'default'}`);

    const startTime = Date.now();
    try {
      let result: AiResponse;
      
      switch (provider.type) {
        case 'OPENAI':
          result = await this.generateOpenAICompletion(provider, prompt, options);
          break;
        case 'GEMINI':
          result = await this.generateGeminiCompletion(provider, prompt, options);
          break;
        case 'OLLAMA':
          result = await this.generateOllamaCompletion(provider, prompt, options);
          break;
        default:
          throw new Error(`Unsupported provider type: ${provider.type}`);
      }

      const duration = Date.now() - startTime;
      console.log(`[AI Provider Manager] ${provider.type} completion successful in ${duration}ms`);
      console.log(`[AI Provider Manager] Response length: ${result.content?.length || 0} chars`);
      if (result.usage) {
        console.log(`[AI Provider Manager] Token usage:`, result.usage);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[AI Provider Manager] ${provider.type} completion failed after ${duration}ms:`, error);
      throw error;
    }
  }

  private async generateOpenAICompletion(
    provider: AiProvider, 
    prompt: string, 
    options?: { maxTokens?: number; temperature?: number }
  ): Promise<AiResponse> {
    if (!provider.apiKey) {
      console.log('[OpenAI Provider] API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    console.log(`[OpenAI Provider] Making request to OpenAI API...`);
    console.log(`[OpenAI Provider] Prompt length: ${prompt.length} characters`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options?.maxTokens || 1000,
        temperature: options?.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.log(`[OpenAI Provider] API error: ${response.status} ${response.statusText}`, error);
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log(`[OpenAI Provider] Response received successfully`);
    console.log(`[OpenAI Provider] Completion: ${data.choices[0]?.message?.content?.length || 0} chars`);
    console.log(`[OpenAI Provider] Tokens used: ${data.usage?.total_tokens || 'unknown'}`);
    
    return {
      content: data.choices[0]?.message?.content || '',
      usage: {
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens,
      }
    };
  }

  private async generateGeminiCompletion(
    provider: AiProvider, 
    prompt: string, 
    options?: { maxTokens?: number; temperature?: number }
  ): Promise<AiResponse> {
    if (!provider.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent?key=${provider.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            maxOutputTokens: options?.maxTokens || 1000,
            temperature: options?.temperature || 0.7,
          }
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount,
        completionTokens: data.usageMetadata?.candidatesTokenCount,
        totalTokens: data.usageMetadata?.totalTokenCount,
      }
    };
  }

  private async generateOllamaCompletion(
    provider: AiProvider, 
    prompt: string, 
    options?: { maxTokens?: number; temperature?: number }
  ): Promise<AiResponse> {
    const baseUrl = (provider.baseUrl || 'http://localhost:11434').replace(/\/$/, '');
    
    console.log(`[Ollama Provider] Quick connection test to ${baseUrl}...`);
    
    // Connection test (30 seconds max — remote Ollama can be slow)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[Ollama Provider] Connection test timeout (30s)');
      controller.abort();
    }, 30000);

    try {
      // Test connection with health check endpoint
      const testResponse = await fetch(`${baseUrl}/api/tags`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!testResponse.ok) {
        console.log(`[Ollama Provider] Server not ready: ${testResponse.status}`);
        throw new Error(`Ollama server not ready (${testResponse.status})`);
      }
      
      console.log(`[Ollama Provider] Server healthy, proceeding with generation...`);
      
      // Actual generation — Ollama takes a long time (model loading + inference)
      // Timeout 180 seconds: large models + long prompts can take >60 seconds
      const genController = new AbortController();
      const genTimeoutId = setTimeout(() => {
        console.log('[Ollama Provider] Generation timeout (180s)');
        genController.abort();
      }, 180000);

      console.log(`[Ollama Provider] Sending generation request (model: ${provider.model}, timeout: 180s)...`);
      const genStart = Date.now();
      
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(provider.apiKey ? { 'Authorization': `Bearer ${provider.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: provider.model,
          prompt: prompt,
          stream: false,
          options: {
            num_predict: options?.maxTokens || 2000,
            temperature: options?.temperature || 0.7,
          }
        }),
        signal: genController.signal,
      });

      clearTimeout(genTimeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.log(`[Ollama Provider] Generation error: ${response.status}`);
        throw new Error(`Ollama generation failed: ${error.error || response.statusText}`);
      }

      const genDuration = Date.now() - genStart;
      console.log(`[Ollama Provider] Generation completed in ${(genDuration / 1000).toFixed(1)}s`);
      const data = await response.json();
      console.log(`[Ollama Provider] Response: ${data.response?.length || 0} chars`);
      
      return {
        content: data.response || '',
        usage: {
          promptTokens: data.prompt_eval_count,
          completionTokens: data.eval_count,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        }
      };
    } catch (error) {
      // Clean up connection timeout
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log(`[Ollama Provider] Fast fail - server not responsive`);
          throw new Error(`Ollama server not responsive at ${baseUrl}`);
        }
        console.log(`[Ollama Provider] Error:`, error.message);
        throw error;
      }
      throw new Error('Ollama processing failed');
    }
  }

  // Clear cache when providers are updated
  clearCache(): void {
    this.activeProvider = null;
    this.lastFetch = 0;
  }
}

// Export singleton instance
export const aiProviderManager = AiProviderManager.getInstance();