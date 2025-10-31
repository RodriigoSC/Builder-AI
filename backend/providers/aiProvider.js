const axios = require('axios');

/**
 * Sistema de Providers de IA
 * Suporta: OpenAI, Claude, Gemini, Groq, Ollama, e outros
 */

class AIProvider {
  constructor(config) {
    this.config = config;
  }

  async generate(prompt, systemContext) {
    throw new Error('Method generate() must be implemented');
  }
}

// ========================================
// OPENAI (GPT-4, GPT-3.5, etc)
// ========================================
class OpenAIProvider extends AIProvider {
  async generate(prompt, systemContext) {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: this.config.apiKey });

    const completion = await openai.chat.completions.create({
      model: this.config.model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemContext },
        { role: 'user', content: prompt }
      ],
      temperature: this.config.temperature || 0.7,
      max_tokens: this.config.maxTokens || 4000
    });

    return {
      content: completion.choices[0].message.content,
      model: completion.model,
      usage: completion.usage
    };
  }
}

// ========================================
// ANTHROPIC (Claude)
// ========================================
class ClaudeProvider extends AIProvider {
  async generate(prompt, systemContext) {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: this.config.model || 'claude-3-5-sonnet-20241022',
        max_tokens: this.config.maxTokens || 4000,
        system: systemContext,
        messages: [
          { role: 'user', content: prompt }
        ]
      },
      {
        headers: {
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );

    return {
      content: response.data.content[0].text,
      model: response.data.model,
      usage: response.data.usage
    };
  }
}

// ========================================
// GOOGLE (Gemini)
// ========================================
class GeminiProvider extends AIProvider {
  async generate(prompt, systemContext) {
    const fullPrompt = `${systemContext}\n\n${prompt}`;
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/${this.config.model || 'gemini-pro'}:generateContent?key=${this.config.apiKey}`,
      {
        contents: [{
          parts: [{ text: fullPrompt }]
        }],
        generationConfig: {
          temperature: this.config.temperature || 0.7,
          maxOutputTokens: this.config.maxTokens || 4000,
        }
      }
    );

    return {
      content: response.data.candidates[0].content.parts[0].text,
      model: this.config.model || 'gemini-pro',
      usage: response.data.usageMetadata
    };
  }
}

// ========================================
// GROQ (Llama, Mixtral, etc)
// ========================================
class GroqProvider extends AIProvider {
  async generate(prompt, systemContext) {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: this.config.model || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemContext },
          { role: 'user', content: prompt }
        ],
        temperature: this.config.temperature || 0.7,
        max_tokens: this.config.maxTokens || 4000
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      content: response.data.choices[0].message.content,
      model: response.data.model,
      usage: response.data.usage
    };
  }
}

// ========================================
// OLLAMA (Local)
// ========================================
class OllamaProvider extends AIProvider {
  async generate(prompt, systemContext) {
    const response = await axios.post(
      `${this.config.baseUrl || 'http://localhost:11434'}/api/generate`,
      {
        model: this.config.model || 'llama2',
        prompt: `${systemContext}\n\n${prompt}`,
        stream: false,
        options: {
          temperature: this.config.temperature || 0.7,
          num_predict: this.config.maxTokens || 4000
        }
      }
    );

    return {
      content: response.data.response,
      model: this.config.model,
      usage: { total_tokens: response.data.eval_count }
    };
  }
}

// ========================================
// COHERE
// ========================================
class CohereProvider extends AIProvider {
  async generate(prompt, systemContext) {
    const response = await axios.post(
      'https://api.cohere.ai/v1/chat',
      {
        model: this.config.model || 'command',
        message: prompt,
        preamble: systemContext,
        temperature: this.config.temperature || 0.7,
        max_tokens: this.config.maxTokens || 4000
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      content: response.data.text,
      model: this.config.model,
      usage: response.data.meta
    };
  }
}

// ========================================
// MISTRAL AI
// ========================================
class MistralProvider extends AIProvider {
  async generate(prompt, systemContext) {
    const response = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      {
        model: this.config.model || 'mistral-small-latest',
        messages: [
          { role: 'system', content: systemContext },
          { role: 'user', content: prompt }
        ],
        temperature: this.config.temperature || 0.7,
        max_tokens: this.config.maxTokens || 4000
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      content: response.data.choices[0].message.content,
      model: response.data.model,
      usage: response.data.usage
    };
  }
}

// ========================================
// HUGGING FACE
// ========================================
class HuggingFaceProvider extends AIProvider {
  async generate(prompt, systemContext) {
    const fullPrompt = `${systemContext}\n\n${prompt}`;
    
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${this.config.model || 'mistralai/Mixtral-8x7B-Instruct-v0.1'}`,
      {
        inputs: fullPrompt,
        parameters: {
          temperature: this.config.temperature || 0.7,
          max_new_tokens: this.config.maxTokens || 4000,
          return_full_text: false
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      content: response.data[0].generated_text,
      model: this.config.model,
      usage: {}
    };
  }
}

// ========================================
// FACTORY - Cria o provider correto
// ========================================
function createProvider(providerName, config) {
  const providers = {
    'openai': OpenAIProvider,
    'claude': ClaudeProvider,
    'anthropic': ClaudeProvider,
    'gemini': GeminiProvider,
    'google': GeminiProvider,
    'groq': GroqProvider,
    'ollama': OllamaProvider,
    'cohere': CohereProvider,
    'mistral': MistralProvider,
    'huggingface': HuggingFaceProvider
  };

  const ProviderClass = providers[providerName.toLowerCase()];
  
  if (!ProviderClass) {
    throw new Error(`Provider '${providerName}' não suportado. Opções: ${Object.keys(providers).join(', ')}`);
  }

  return new ProviderClass(config);
}

module.exports = {
  createProvider,
  OpenAIProvider,
  ClaudeProvider,
  GeminiProvider,
  GroqProvider,
  OllamaProvider,
  CohereProvider,
  MistralProvider,
  HuggingFaceProvider
};