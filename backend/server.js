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

// ========================================
// SISTEMA DE CONTEXTO INTELIGENTE
// ========================================
class ProjectAnalyzer {
  constructor(templatePath) {
    this.templatePath = templatePath;
  }

  async analyzeProject() {
    const srcPath = path.join(this.templatePath, 'src');
    const analysis = {
      components: [],
      pages: [],
      services: [],
      imports: new Set(),
      technologies: new Set(['React', 'Tailwind CSS']),
      patterns: [],
      summary: ''
    };

    try {
      const files = await this.getAllFiles(srcPath);
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf8');
        this.analyzeFile(file, content, analysis);
      }

      analysis.imports = Array.from(analysis.imports);
      analysis.technologies = Array.from(analysis.technologies);
      analysis.summary = this.generateSummary(analysis);

      return analysis;
    } catch (error) {
      console.error('Erro ao analisar projeto:', error);
      return analysis;
    }
  }

  async getAllFiles(dir, fileList = []) {
    const files = await fs.readdir(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isDirectory()) {
        await this.getAllFiles(filePath, fileList);
      } else if (file.match(/\.(jsx?|tsx?)$/)) {
        fileList.push(filePath);
      }
    }
    
    return fileList;
  }

  analyzeFile(filePath, content, analysis) {
    const relativePath = path.relative(path.join(this.templatePath, 'src'), filePath);
    
    // Categoriza arquivo
    if (relativePath.startsWith('components/')) {
      analysis.components.push(relativePath);
    } else if (relativePath.startsWith('pages/')) {
      analysis.pages.push(relativePath);
    } else if (relativePath.startsWith('services/')) {
      analysis.services.push(relativePath);
    }

    // Detecta imports
    const importMatches = content.match(/import .+ from ['"](.+)['"]/g);
    if (importMatches) {
      importMatches.forEach(imp => {
        const match = imp.match(/from ['"](.+)['"]/);
        if (match && match[1]) {
          analysis.imports.add(match[1]);
        }
      });
    }

    // Detecta tecnologias
    if (content.includes('react-router')) analysis.technologies.add('React Router');
    if (content.includes('axios')) analysis.technologies.add('Axios');
    if (content.includes('useState') || content.includes('useEffect')) {
      analysis.technologies.add('React Hooks');
    }
    if (content.includes('recharts')) analysis.technologies.add('Recharts');
    if (content.includes('lucide-react')) analysis.technologies.add('Lucide Icons');

    // Detecta padrões
    if (content.includes('interface ') || content.includes('type ')) {
      if (!analysis.patterns.includes('TypeScript')) {
        analysis.patterns.push('TypeScript');
      }
    }
    if (content.includes('className=')) {
      if (!analysis.patterns.includes('Tailwind CSS')) {
        analysis.patterns.push('Tailwind CSS');
      }
    }
  }

  generateSummary(analysis) {
    const parts = [];
    
    parts.push(`O projeto atual possui ${analysis.components.length} componentes, ${analysis.pages.length} páginas e ${analysis.services.length} services.`);
    
    if (analysis.technologies.size > 0) {
      parts.push(`Tecnologias em uso: ${Array.from(analysis.technologies).join(', ')}.`);
    }
    
    if (analysis.components.length > 0) {
      parts.push(`Componentes existentes: ${analysis.components.slice(0, 5).join(', ')}${analysis.components.length > 5 ? '...' : ''}.`);
    }

    return parts.join(' ');
  }
}

// ========================================
// SYSTEM CONTEXT INTELIGENTE
// ========================================
const getEnhancedSystemContext = (projectAnalysis) => {
  return `Você é um assistente especializado em gerar código React/TypeScript de alta qualidade.

ANÁLISE DO PROJETO ATUAL:
${projectAnalysis.summary}

REGRAS PARA GERAÇÃO:
1. Use TypeScript com React sempre que possível
2. Use Tailwind CSS para estilização (classes utility)
3. Siga os padrões já estabelecidos no projeto
4. Use componentes funcionais com hooks
5. Inclua todos os imports necessários
6. O código deve ser funcional, completo e pronto para uso
7. Use nomes descritivos e siga convenções modernas
8. Adicione comentários quando necessário
9. Considere responsividade mobile-first
10. Use animações e transições suaves quando apropriado

TECNOLOGIAS DISPONÍVEIS:
${Array.from(projectAnalysis.technologies).join(', ')}

FORMATO DE RESPOSTA:
Retorne APENAS um JSON válido no seguinte formato:
{
  "files": [
    {
      "path": "caminho/do/arquivo.tsx",
      "content": "conteúdo completo do arquivo com todos os imports"
    }
  ],
  "description": "Descrição clara e amigável do que foi gerado"
}

IMPORTANTE:
- Não truncar ou omitir código
- Incluir imports completos (React, hooks, ícones, etc)
- Usar exports default quando apropriado
- Código deve rodar sem erros`;
};

// Get AI Provider configuration
function getProviderConfig() {
  const provider = process.env.AI_PROVIDER || 'groq';
  
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

  config.temperature = parseFloat(process.env.AI_TEMPERATURE || '0.7');
  config.maxTokens = parseInt(process.env.AI_MAX_TOKENS || '8000'); // Aumentado para 8k

  return { provider, config };
}

// ========================================
// POST /generate - Gera código com contexto inteligente
// ========================================
app.post('/generate', async (req, res) => {
  try {
    const { prompt, context = '', provider: customProvider } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt é obrigatório' });
    }

    console.log('🤖 Gerando código para prompt:', prompt);

    // Analisa o projeto atual
    const analyzer = new ProjectAnalyzer(TEMPLATE_PATH);
    const projectAnalysis = await analyzer.analyzeProject();
    console.log('📊 Análise do projeto:', projectAnalysis.summary);

    // Permite override do provider
    const originalProvider = process.env.AI_PROVIDER;
    if (customProvider) {
      process.env.AI_PROVIDER = customProvider;
    }

    const { provider, config } = getProviderConfig();
    console.log(`📡 Usando provider: ${provider} (${config.model})`);

    const aiProvider = createProvider(provider, config);
    
    // Monta contexto enriquecido
    const enhancedContext = `
${context}

CONTEXTO DO PROJETO:
${projectAnalysis.summary}

Componentes existentes: ${projectAnalysis.components.join(', ') || 'nenhum'}
Páginas existentes: ${projectAnalysis.pages.join(', ') || 'nenhum'}

PROMPT DO USUÁRIO:
${prompt}
    `.trim();
    
    const systemContext = getEnhancedSystemContext(projectAnalysis);
    const result = await aiProvider.generate(enhancedContext, systemContext);
    
    // Restaura provider
    if (customProvider) {
      process.env.AI_PROVIDER = originalProvider;
    }

    // Extract JSON from response
    let jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // Tenta extrair de código markdown
      jsonMatch = result.content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonMatch = [jsonMatch[1]];
      }
    }
    
    if (!jsonMatch) {
      console.error('❌ Resposta da IA não contém JSON válido');
      console.log('Resposta:', result.content.substring(0, 500));
      throw new Error('Resposta da IA não contém JSON válido');
    }

    const generated = JSON.parse(jsonMatch[0]);

    // Valida e enriquece resposta
    if (!generated.files || !Array.isArray(generated.files)) {
      throw new Error('Resposta não contém array de files válido');
    }

    res.json({
      success: true,
      ...generated,
      provider: provider,
      model: result.model,
      usage: result.usage,
      projectContext: {
        componentsCount: projectAnalysis.components.length,
        pagesCount: projectAnalysis.pages.length,
        technologies: projectAnalysis.technologies
      }
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

// ========================================
// POST /apply - Aplica arquivos com validação
// ========================================
app.post('/apply', async (req, res) => {
  try {
    const { files } = req.body;

    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ error: 'Files array é obrigatório' });
    }

    const results = [];

    for (const file of files) {
      const fullPath = path.join(TEMPLATE_PATH, 'src', file.path);
      
      // Backup se arquivo já existe
      if (await fs.pathExists(fullPath)) {
        const backupPath = fullPath + '.backup';
        await fs.copy(fullPath, backupPath);
        console.log('💾 Backup criado:', backupPath);
      }

      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, file.content, 'utf8');
      results.push({ 
        path: file.path, 
        status: 'written',
        size: file.content.length 
      });
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

// ========================================
// GET /analyze - Analisa projeto atual
// ========================================
app.get('/analyze', async (req, res) => {
  try {
    const analyzer = new ProjectAnalyzer(TEMPLATE_PATH);
    const analysis = await analyzer.analyzeProject();

    res.json({
      success: true,
      ...analysis
    });
  } catch (error) {
    console.error('❌ Erro ao analisar projeto:', error);
    res.status(500).json({
      error: 'Erro ao analisar projeto',
      message: error.message
    });
  }
});

// ========================================
// GET /providers - Lista providers
// ========================================
app.get('/providers', (req, res) => {
  const providers = [
    {
      id: 'openai',
      name: 'OpenAI',
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
      free: false
    },
    {
      id: 'claude',
      name: 'Anthropic Claude',
      models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'],
      free: false
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      models: ['gemini-pro', 'gemini-1.5-pro'],
      free: true
    },
    {
      id: 'groq',
      name: 'Groq',
      models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
      free: true
    },
    {
      id: 'ollama',
      name: 'Ollama (Local)',
      models: ['llama2', 'codellama', 'mistral'],
      free: true,
      local: true
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

// ========================================
// GET /status - Status do projeto
// ========================================
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

// ========================================
// GET /file/:path - Retorna arquivo
// ========================================
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

// ========================================
// DELETE /file/:path - Deleta arquivo
// ========================================
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

// ========================================
// Server Start
// ========================================
app.listen(PORT, () => {
  try {
    const { provider, config } = getProviderConfig();
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 AI BUILDER PRO - Backend Turbinado`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`📁 Template: ${TEMPLATE_PATH}`);
    console.log(`🤖 AI Provider: ${provider}`);
    console.log(`🎯 Model: ${config.model}`);
    console.log(`✅ Status: Configurado e pronto!`);
    console.log(`${'='.repeat(60)}\n`);
  } catch (error) {
    console.log(`\n🚀 Backend rodando em http://localhost:${PORT}`);
    console.log(`⚠️  AI Provider não configurado: ${error.message}\n`);
  }
});