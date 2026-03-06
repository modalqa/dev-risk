import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSuperAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentSuperAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, apiKey, baseUrl, model } = await request.json();

    if (!type || !model) {
      return NextResponse.json({ 
        error: 'Provider type and model are required' 
      }, { status: 400 });
    }

    // Test connection based on provider type
    let testResult;
    
    try {
      switch (type) {
        case 'OPENAI':
          testResult = await testOpenAIConnection(apiKey, model);
          break;
        case 'GEMINI':
          testResult = await testGeminiConnection(apiKey, model);
          break;
        case 'OLLAMA':
          testResult = await testOllamaConnection(baseUrl, model, apiKey);
          break;
        default:
          return NextResponse.json({ error: 'Unsupported provider type' }, { status: 400 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Connection successful',
        details: testResult
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      return NextResponse.json({ 
        success: false, 
        message: errorMessage 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('[AI Provider Test]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function testOpenAIConnection(apiKey: string, model: string) {
  if (!apiKey) {
    throw new Error('API key is required for OpenAI');
  }

  const response = await fetch('https://api.openai.com/v1/models', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const modelExists = data.data?.some((m: any) => m.id === model);
  
  if (!modelExists) {
    throw new Error(`Model "${model}" not found in your OpenAI account`);
  }

  return { provider: 'OpenAI', model, status: 'Available' };
}

async function testGeminiConnection(apiKey: string, model: string) {
  if (!apiKey) {
    throw new Error('API key is required for Gemini');
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const modelExists = data.models?.some((m: any) => m.name.includes(model));
  
  if (!modelExists) {
    throw new Error(`Model "${model}" not found in available Gemini models`);
  }

  return { provider: 'Gemini', model, status: 'Available' };
}

async function testOllamaConnection(baseUrl: string | null, model: string, apiKey: string | null) {
  const url = baseUrl || 'http://localhost:11434';
  
  try {
    // Normalize URL - remove trailing slash if present
    const normalizedUrl = url.replace(/\/$/, '');
    
    // Test if Ollama server is running with longer timeout for network requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const headers: any = {
      'Accept': 'application/json',
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    const healthResponse = await fetch(`${normalizedUrl}/api/tags`, {
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!healthResponse.ok) {
      const errorText = await healthResponse.text();
      throw new Error(`Ollama server returned ${healthResponse.status}: ${errorText || 'Unknown error'}`);
    }

    const data = await healthResponse.json();
    
    // Check if model exists in available models
    const availableModels = data.models || [];
    const modelExists = availableModels.some((m: any) => {
      const modelName = typeof m === 'string' ? m : m.name;
      // Support partial match (e.g., 'gemma' matches 'gemma:7b')
      return modelName.includes(model) || model.includes(modelName.split(':')[0]);
    });
    
    if (!modelExists && availableModels.length > 0) {
      throw new Error(`Model "${model}" not found. Available models: ${availableModels.map((m: any) => typeof m === 'string' ? m : m.name).join(', ')}`);
    }

    return { 
      provider: 'Ollama', 
      model, 
      status: 'Connected',
      endpoint: normalizedUrl,
      authType: apiKey ? 'API Key (Cloud/Tunnel)' : 'Local (No API Key)',
      availableModels: availableModels.length,
    };
  } catch (error) {
    if (error instanceof Error) {
      // Handle fetch abort (timeout)
      if (error.name === 'AbortError') {
        throw new Error(`Connection timeout - Ollama server at ${baseUrl || 'http://localhost:11434'} is not responding. Check if the server is running and accessible from your network.`);
      }
      throw error;
    }
    throw new Error('Failed to connect to Ollama server');
  }
}