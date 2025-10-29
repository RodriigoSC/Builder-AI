require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');
const { createProvider } = require('./providers/aiProvider.js');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Template path
const TEMPLATE_PATH = path.join(__dirname, '../template');

// System context for AI
const SYSTEM_CONTEXT = `Você é um assistente especializado em gerar código React/TypeScript.
Você deve retornar APENAS um JSON válido no formato:
{
  "files": [
    {
      "path": "caminho/do/arquivo.tsx",
      "content": "conteúdo completo do arquivo"
    }
  ],
  "description": "breve descrição do que foi gerado"
}

Regras:
- Use TypeScript com React
- Use Tailwind CSS para estilização
- Siga boas práticas e padrões modernos
- Inclua imports necessários
- Código deve ser funcional e completo
- Use componentes funcionais com hooks`;

// Get AI Provider configuration
function getProviderConfig() {
  const provider = process.env.AI_PROVIDER || 'groq';
  
  // Mapeamento de variáveis de ambiente por provider
  const configs = {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
    },
    claude: {
      apiKey: process.env.CLAUDE_API_KEY,
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022'
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-pro'
    },
    groq: {
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
    },
    ollama: {
      baseUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'llama2'
    },
    cohere: {
      apiKey: process.env.COHERE_API_KEY,
      model: process.env.COHERE_MODEL || 'command'
    },
    mistral: {
      apiKey: process.env.MISTRAL_API_KEY,
      model: process.env.MISTRAL_MODEL || 'mistral-small-latest'
    },
    huggingface: {
      apiKey: process.env.HUGGINGFACE_API_KEY,
      model: process.env.HUGGINGFACE_MODEL || 'mistralai/Mixtral-8x7B-Instruct-v0.1'
    }
  };

  const config = configs[provider];
  
  if (!config) {
    throw new Error(`Provider ${provider} não configurado`);
  }

  // Adiciona configurações comuns
  config.temperature = parseFloat(process.env.AI_TEMPERATURE || '0.7');
  config.maxTokens = parseInt(process.env.AI_MAX_TOKENS || '4000');

  return { provider, config };
}

// POST /generate - Gera código a partir do prompt
app.post('/generate', async (req, res) => {
  try {
    const { prompt, context = '', provider: customProvider } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt é obrigatório' });
    }

    console.log('🤖 Gerando código para prompt:', prompt);

    // Permite override do provider via requisição
    const originalProvider = process.env.AI_PROVIDER;
    if (customProvider) {
      process.env.AI_PROVIDER = customProvider;
    }

    const { provider, config } = getProviderConfig();
    console.log(`📡 Usando provider: ${provider} (${config.model})`);

    const aiProvider = createProvider(provider, config);
    const fullPrompt = `${context}\n\nPrompt: ${prompt}`;
    
    const result = await aiProvider.generate(fullPrompt, SYSTEM_CONTEXT);
    
    // Restaura provider original
    if (customProvider) {
      process.env.AI_PROVIDER = originalProvider;
    }

    // Extract JSON from response
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Resposta da IA não contém JSON válido');
    }

    const generated = JSON.parse(jsonMatch[0]);

    res.json({
      success: true,
      ...generated,
      provider: provider,
      model: result.model,
      usage: result.usage,
      rawResponse: result.content
    });

  } catch (error) {
    console.error('❌ Erro ao gerar código:', error);
    res.status(500).json({
      error: 'Erro ao gerar código',
      message: error.message,
      details: error.response?.data || null
    });
  }
});

// POST /apply - Aplica arquivos gerados no template
app.post('/apply', async (req, res) => {
  try {
    const { files } = req.body;

    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ error: 'Files array é obrigatório' });
    }

    const results = [];

    for (const file of files) {
      const fullPath = path.join(TEMPLATE_PATH, 'src', file.path);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, file.content, 'utf8');
      results.push({ path: file.path, status: 'written' });
      console.log('✅ Arquivo criado:', fullPath);
    }

    res.json({
      success: true,
      message: 'Arquivos aplicados com sucesso',
      results
    });

  } catch (error) {
    console.error('❌ Erro ao aplicar arquivos:', error);
    res.status(500).json({
      error: 'Erro ao aplicar arquivos',
      message: error.message
    });
  }
});

// GET /providers - Lista providers disponíveis
app.get('/providers', (req, res) => {
  const providers = [
    {
      id: 'openai',
      name: 'OpenAI',
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      free: false,
      envVars: ['OPENAI_API_KEY', 'OPENAI_MODEL']
    },
    {
      id: 'claude',
      name: 'Anthropic Claude',
      models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
      free: false,
      envVars: ['CLAUDE_API_KEY', 'CLAUDE_MODEL']
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      models: ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'],
      free: true,
      envVars: ['GEMINI_API_KEY', 'GEMINI_MODEL']
    },
    {
      id: 'groq',
      name: 'Groq',
      models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768', 'llama3-70b-8192'],
      free: true,
      envVars: ['GROQ_API_KEY', 'GROQ_MODEL']
    },
    {
      id: 'ollama',
      name: 'Ollama (Local)',
      models: ['llama2', 'codellama', 'mistral', 'mixtral'],
      free: true,
      local: true,
      envVars: ['OLLAMA_URL', 'OLLAMA_MODEL']
    },
    {
      id: 'cohere',
      name: 'Cohere',
      models: ['command', 'command-light', 'command-nightly'],
      free: false,
      envVars: ['COHERE_API_KEY', 'COHERE_MODEL']
    },
    {
      id: 'mistral',
      name: 'Mistral AI',
      models: ['mistral-small-latest', 'mistral-medium-latest', 'mistral-large-latest'],
      free: false,
      envVars: ['MISTRAL_API_KEY', 'MISTRAL_MODEL']
    },
    {
      id: 'huggingface',
      name: 'Hugging Face',
      models: ['mistralai/Mixtral-8x7B-Instruct-v0.1', 'meta-llama/Llama-2-70b-chat-hf'],
      free: true,
      envVars: ['HUGGINGFACE_API_KEY', 'HUGGINGFACE_MODEL']
    }
  ];

  const current = getProviderConfig();

  res.json({
    success: true,
    providers,
    current: {
      provider: current.provider,
      model: current.config.model,
      configured: !!current.config.apiKey || !!current.config.baseUrl
    }
  });
});

// GET /status - Retorna status do projeto
app.get('/status', async (req, res) => {
  try {
    const srcPath = path.join(TEMPLATE_PATH, 'src');
    
    const getFiles = async (dir, basePath = '') => {
      const items = await fs.readdir(dir);
      const files = [];

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          const subFiles = await getFiles(fullPath, path.join(basePath, item));
          files.push(...subFiles);
        } else {
          files.push(path.join(basePath, item));
        }
      }

      return files;
    };

    const files = await getFiles(srcPath);
    const { provider, config } = getProviderConfig();

    res.json({
      success: true,
      templatePath: TEMPLATE_PATH,
      fileCount: files.length,
      files: files.sort(),
      aiProvider: {
        name: provider,
        model: config.model,
        configured: !!config.apiKey || !!config.baseUrl
      }
    });

  } catch (error) {
    console.error('❌ Erro ao obter status:', error);
    res.status(500).json({
      error: 'Erro ao obter status',
      message: error.message
    });
  }
});

// GET /file/:path - Retorna conteúdo de um arquivo
app.get('/file/*', async (req, res) => {
  try {
    const filePath = req.params[0];
    const fullPath = path.join(TEMPLATE_PATH, 'src', filePath);

    if (!await fs.pathExists(fullPath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const content = await fs.readFile(fullPath, 'utf8');
    res.json({ success: true, path: filePath, content });

  } catch (error) {
    console.error('❌ Erro ao ler arquivo:', error);
    res.status(500).json({
      error: 'Erro ao ler arquivo',
      message: error.message
    });
  }
});

// DELETE /file/:path - Deleta um arquivo
app.delete('/file/*', async (req, res) => {
  try {
    const filePath = req.params[0];
    const fullPath = path.join(TEMPLATE_PATH, 'src', filePath);

    if (!await fs.pathExists(fullPath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    await fs.remove(fullPath);
    res.json({ success: true, message: 'Arquivo deletado com sucesso' });

  } catch (error) {
    console.error('❌ Erro ao deletar arquivo:', error);
    res.status(500).json({
      error: 'Erro ao deletar arquivo',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  try {
    const { provider, config } = getProviderConfig();
    console.log(`\n🚀 Backend rodando em http://localhost:${PORT}`);
    console.log(`📁 Template path: ${TEMPLATE_PATH}`);
    console.log(`🤖 AI Provider: ${provider}`);
    console.log(`🎯 Model: ${config.model}`);
    console.log(`✅ Configurado: ${!!config.apiKey || !!config.baseUrl ? 'Sim' : 'Não'}\n`);
  } catch (error) {
    console.log(`\n🚀 Backend rodando em http://localhost:${PORT}`);
    console.log(`⚠️  AI Provider não configurado: ${error.message}\n`);
  }
});