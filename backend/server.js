require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');
const { createProvider } = require('./providers/aiProvider.js');
const { execSync } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Paths
const TEMPLATE_PATH = path.join(__dirname, '../template');
const TEMPLATE_SRC_RESOLVED_PATH = path.resolve(TEMPLATE_PATH, 'src');

// ========================================
// FUNÇÃO UTILITÁRIA: PARSER DE JSON ROBUSTO
// (Movido para uma função reutilizável)
// ========================================
const parseRobustJSON = (jsonString) => {
  let cleanJsonString = jsonString;

  const markdownMatch = cleanJsonString.match(/```json\s*([\s\S]*?)\s*```/);
  if (markdownMatch && markdownMatch[1]) {
    cleanJsonString = markdownMatch[1];
  } else {
    const firstBrace = cleanJsonString.indexOf('{');
    const lastBrace = cleanJsonString.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
      console.error('❌ JSON Parser: Chaves {} não encontradas.');
      throw new Error('Resposta da IA não contém JSON válido (chaves não encontradas)');
    }
    cleanJsonString = cleanJsonString.substring(firstBrace, lastBrace + 1);
  }

  if (!cleanJsonString) {
      throw new Error('Falha ao extrair string JSON da resposta da IA.');
  }

  // Remove caracteres de controlo inválidos
  cleanJsonString = cleanJsonString.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  try {
    return JSON.parse(cleanJsonString);
  } catch (error) {
    console.error('❌ JSON Parser: Erro ao fazer parse.', error.message);
    console.log('String JSON com falha:', cleanJsonString);
    throw new Error(`Falha no parse do JSON: ${error.message}`);
  }
};


// ========================================
// SISTEMA DE CONTEXTO INTELIGENTE (ANALISADOR)
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
    try {
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
    } catch (readError) {
      if (readError.code !== 'ENOENT') {
        console.warn('Aviso ao ler arquivos:', readError.message);
      }
    }
    return fileList;
  }

  analyzeFile(filePath, content, analysis) {
    const relativePath = path.relative(path.join(this.templatePath, 'src'), filePath);
    
    if (relativePath.startsWith('components/')) {
      analysis.components.push(relativePath);
    } else if (relativePath.startsWith('pages/')) {
      analysis.pages.push(relativePath);
    } else if (relativePath.startsWith('services/')) {
      analysis.services.push(relativePath);
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
// --- NOVO (Fase 4): PROMPT DO PLANEADOR (ARQUITETO) ---
// ========================================
const getPlannerSystemContext = (projectAnalysis, userPrompt) => {
  return `Você é um Arquiteto de Software AI sênior. Sua tarefa é analisar o prompt do usuário e o estado atual do projeto, e retornar um PLANO JSON detalhado de quais arquivos você precisa criar ou modificar.

PROJETO ATUAL:
${projectAnalysis.summary}
Componentes existentes: ${projectAnalysis.components.join(', ') || 'nenhum'}
Páginas existentes: ${projectAnalysis.pages.join(', ') || 'nenhum'}
Serviços existentes: ${projectAnalysis.services.join(', ') || 'nenhum'}

PROMPT DO USUÁRIO:
"${userPrompt}"

REGRAS:
1. Analise o prompt. Se for uma tarefa simples que envolve apenas UM ficheiro (ex: "crie um botão"), retorne um plano com apenas esse ficheiro.
2. Se for uma tarefa complexa (ex: "crie um CRUD", "adicione autenticação"), divida-a em MÚLTIPLOS ficheiros (páginas, componentes, serviços, etc.).
3. Para CADA ficheiro no plano, defina:
   - "path": O caminho completo do ficheiro (ex: "pages/ProdutosPage.tsx" ou "components/Botao.tsx").
   - "action": "create" (para novos ficheiros) ou "modify" (para ficheiros existentes).
   - "prompt": Um prompt CLARO E DETALHADO para um desenvolvedor júnior (IA) que irá escrever o código APENAS para esse ficheiro.
4. Se "action" for "modify", certifique-se de que o "path" existe no projeto.
5. Seja lógico sobre os caminhos (ex: 'components/', 'pages/', 'services/').

FORMATO DE RESPOSTA OBRIGATÓRIO (APENAS JSON):
Retorne APENAS um JSON válido no seguinte formato:
{
  "plan": [
    {
      "path": "caminho/do/ficheiro.tsx",
      "action": "create" | "modify",
      "prompt": "Instrução específica e detalhada para este ficheiro..."
    }
  ],
  "description": "Descrição amigável do plano para o usuário (ex: 'Planejei criar 2 componentes e 1 página para o seu CRUD.')"
}
`;
};

// ========================================
// PROMPT DO EXECUTOR (DESENVOLVEDOR) (Antigo getEnhancedSystemContext)
// ========================================
const getExecutorSystemContext = (projectAnalysis, task) => {
  
  // --- Lógica de Modificação (Executor) ---
  if (task.action === 'modify') {
    return `Você é um assistente especializado em MODIFICAR código React/TypeScript.

TAREFA ATUAL:
Modificar o ficheiro: ${task.path}
Instrução do Arquiteto: "${task.prompt}"

REGRAS PARA MODIFICAÇÃO:
1. Modifique o código original para atender à instrução.
2. Retorne o CÓDIGO COMPLETO E ATUALIZADO do ficheiro. Não omita nada.
3. Mantenha os imports, hooks e lógica existentes que não foram alterados.
4. Siga os padrões do projeto (TypeScript, Tailwind).

FORMATO DE RESPOSTA (JSON):
Retorne APENAS um JSON válido no formato:
{
  "files": [
    {
      "path": "${task.path}",
      "content": "conteúdo COMPLETO E MODIFICADO do ficheiro aqui"
    }
  ],
  "description": "Descrição clara do que foi modificado neste ficheiro"
}

CÓDIGO ORIGINAL DO ARQUIVO (${task.path}):
\`\`\`typescript
${task.originalContent}
\`\`\`
`;
  }

  // --- Lógica de Criação (Executor) ---
  return `Você é um assistente especializado em gerar código React/TypeScript de alta qualidade.

TAREFA ATUAL:
Criar o ficheiro: ${task.path}
Instrução do Arquiteto: "${task.prompt}"

REGRAS PARA GERAÇÃO (NOVOS ARQUIVOS):
1. Gere o código APENAS para o ficheiro solicitado e com base na instrução.
2. Use TypeScript com React e Tailwind CSS.
3. Siga os padrões do projeto: ${projectAnalysis.summary}
4. Inclua todos os imports necessários.
5. O código deve ser funcional, completo e pronto para uso.
6. Tecnologias disponíveis: ${Array.from(projectAnalysis.technologies).join(', ')}

FORMATO DE RESPOSTA (JSON):
Retorne APENAS um JSON válido no formato:
{
  "files": [
    {
      "path": "${task.path}",
      "content": "conteúdo completo do ficheiro com todos os imports"
    }
  ],
  "description": "Descrição clara do que foi gerado neste ficheiro"
}
`;
};

// Get AI Provider configuration
function getProviderConfig() {
  const provider = process.env.AI_PROVIDER || 'groq';
  
  const configs = {
    openai: { apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL || 'gpt-4o-mini' },
    claude: { apiKey: process.env.CLAUDE_API_KEY, model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022' },
    gemini: { apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL || 'gemini-pro' },
    groq: { apiKey: process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile' },
    ollama: { baseUrl: process.env.OLLAMA_URL || 'http://localhost:11434', model: process.env.OLLAMA_MODEL || 'llama2' },
    cohere: { apiKey: process.env.COHERE_API_KEY, model: process.env.COHERE_MODEL || 'command' },
    mistral: { apiKey: process.env.MISTRAL_API_KEY, model: process.env.MISTRAL_MODEL || 'mistral-small-latest' },
    huggingface: { apiKey: process.env.HUGGINGFACE_API_KEY, model: process.env.HUGGINGFACE_MODEL || 'mistralai/Mixtral-8x7B-Instruct-v0.1' }
  };

  const config = configs[provider];
  
  if (!config) throw new Error(`Provider ${provider} não configurado`);

  config.temperature = parseFloat(process.env.AI_TEMPERATURE || '0.7');
  config.maxTokens = parseInt(process.env.AI_MAX_TOKENS || '8000');

  return { provider, config };
}

// ========================================
// --- ATUALIZADO (Fase 4): POST /generate (Orquestrador) ---
// ========================================
app.post('/generate', async (req, res) => {
  try {
    const { prompt, context = '', provider: customProvider, fileToModify } = req.body; 

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt é obrigatório' });
    }

    // Configuração do Provider
    const originalProvider = process.env.AI_PROVIDER;
    if (customProvider) process.env.AI_PROVIDER = customProvider;
    const { provider, config } = getProviderConfig();
    const aiProvider = createProvider(provider, config);
    console.log(`📡 Usando provider: ${provider} (${config.model})`);

    // Análise do Projeto
    const analyzer = new ProjectAnalyzer(TEMPLATE_PATH);
    const projectAnalysis = await analyzer.analyzeProject();
    console.log('📊 Análise do projeto:', projectAnalysis.summary);

    let allGeneratedFiles = [];
    let finalDescription = "";

    // --- FLUXO 1: MODIFICAÇÃO SIMPLES (Fase 2) ---
    // Se o usuário usou a "varinha mágica", é uma modificação simples.
    // Ignoramos o Planeador para velocidade.
    if (fileToModify) {
      console.log(`🤖 FLUXO: Modificação Simples de ${fileToModify}`);
      
      const fullPath = path.join(TEMPLATE_PATH, 'src', fileToModify);
      const safeResolvedPath = path.resolve(fullPath);
      if (!safeResolvedPath.startsWith(TEMPLATE_SRC_RESOLVED_PATH)) {
        return res.status(400).json({ error: 'Caminho de arquivo inválido' });
      }
      
      const originalContent = await fs.readFile(fullPath, 'utf8');
      
      const task = {
        path: fileToModify,
        action: 'modify',
        prompt: prompt,
        originalContent: originalContent
      };

      const systemContext = getExecutorSystemContext(projectAnalysis, task);
      const result = await aiProvider.generate(prompt, systemContext);
      
      const generated = parseRobustJSON(result.content);
      allGeneratedFiles = generated.files;
      finalDescription = generated.description;

    } else {
      // --- FLUXO 2: GERAÇÃO "AGENTE" (Fase 4) ---
      // (Planeador + Executor)
      console.log(`🤖 FLUXO: Geração "Agente" para: "${prompt}"`);

      // --- PASSO 1: PLANEADOR (ARQUITETO) ---
      console.log('... 1. Chamando o Planeador (Arquiteto)');
      const plannerContext = getPlannerSystemContext(projectAnalysis, prompt);
      const plannerResult = await aiProvider.generate(prompt, plannerContext);
      const planResponse = parseRobustJSON(plannerResult.content);
      
      console.log(`... 2. Plano recebido: ${planResponse.description}`);
      finalDescription = planResponse.description;
      allGeneratedFiles = [];

      // --- PASSO 2: EXECUTOR (DESENVOLVEDOR) ---
      let step = 1;
      for (const task of planResponse.plan) {
        console.log(`... 3.${step}: Executando tarefa: ${task.action} ${task.path}`);
        
        // Se for modificação, precisamos carregar o conteúdo original
        if (task.action === 'modify') {
          const fullPath = path.join(TEMPLATE_PATH, 'src', task.path);
          const safeResolvedPath = path.resolve(fullPath);
          
          if (!safeResolvedPath.startsWith(TEMPLATE_SRC_RESOLVED_PATH) || !await fs.pathExists(fullPath)) {
            console.warn(`⚠️  Planeador tentou modificar ficheiro inexistente: ${task.path}. Pulando.`);
            continue;
          }
          task.originalContent = await fs.readFile(fullPath, 'utf8');
        }

        const executorContext = getExecutorSystemContext(projectAnalysis, task);
        const executorResult = await aiProvider.generate(task.prompt, executorContext);
        
        const generated = parseRobustJSON(executorResult.content);
        allGeneratedFiles.push(...generated.files);
        step++;
      }
      console.log('... 4. Execução do plano concluída.');
    }

    // Restaura provider
    if (customProvider) process.env.AI_PROVIDER = originalProvider;

    // Validação final
    if (!allGeneratedFiles || !Array.isArray(allGeneratedFiles)) {
      throw new Error('Resultado final não contém array de files válido');
    }

    res.json({
      success: true,
      files: allGeneratedFiles,
      description: finalDescription,
      provider: provider,
      model: config.model,
      usage: null // O uso é difícil de agregar, pode ser implementado depois
    });

  } catch (error) {
    console.error('❌ Erro fatal ao gerar código:', error);
    res.status(500).json({
      error: 'Erro ao gerar código',
      message: error.message,
      details: error.response?.data || null
    });
  }
});


// ========================================
// POST /apply - Aplica arquivos (Fase 1 e 3)
// ========================================
app.post('/apply', async (req, res) => {
  try {
    const { files } = req.body;
    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ error: 'Files array é obrigatório' });
    }

    // GIT (Antes)
    try {
      execSync('git add .', { cwd: TEMPLATE_PATH });
      execSync('git commit -m "AI-BUILDER: Backup antes da geração" --allow-empty', { cwd: TEMPLATE_PATH });
    } catch (gitError) {
      console.warn('⚠️  GIT: Falha ao criar commit de backup', gitError.message);
    }

    const results = [];
    for (const file of files) {
      const fullPath = path.join(TEMPLATE_PATH, 'src', file.path);
      
      // Segurança (Fase 3)
      const safeResolvedPath = path.resolve(fullPath);
      if (!safeResolvedPath.startsWith(TEMPLATE_SRC_RESOLVED_PATH)) {
        console.warn(`⚠️  SEGURANÇA: Pulando caminho inválido: ${file.path}`);
        results.push({ path: file.path, status: 'skipped (unsafe)' });
        continue;
      }

      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, file.content, 'utf8');
      results.push({ path: file.path, status: 'written', size: file.content.length });
    }

    // GIT (Depois)
    try {
      execSync('git add .', { cwd: TEMPLATE_PATH });
      execSync('git commit -m "AI-BUILDER: Alterações aplicadas"', { cwd: TEMPLATE_PATH });
    } catch (gitError) {
      console.warn('⚠️  GIT: Falha ao criar commit final', gitError.message);
    }

    res.json({ success: true, message: 'Arquivos aplicados e versionados com sucesso', results });

  } catch (error) {
    console.error('❌ Erro ao aplicar arquivos:', error);
    res.status(500).json({ error: 'Erro ao aplicar arquivos', message: error.message });
  }
});

// ========================================
// GET /analyze - Analisa projeto atual
// ========================================
app.get('/analyze', async (req, res) => {
  try {
    const analyzer = new ProjectAnalyzer(TEMPLATE_PATH);
    const analysis = await analyzer.analyzeProject();
    res.json({ success: true, ...analysis });
  } catch (error) {
    console.error('❌ Erro ao analisar projeto:', error);
    res.status(500).json({ error: 'Erro ao analisar projeto', message: error.message });
  }
});

// ========================================
// GET /providers - Lista providers
// ========================================
app.get('/providers', (req, res) => {
  const providers = [
    { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'], free: false },
    { id: 'claude', name: 'Anthropic Claude', models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'], free: false },
    { id: 'gemini', name: 'Google Gemini', models: ['gemini-pro', 'gemini-1.5-pro'], free: true },
    { id: 'groq', name: 'Groq', models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'], free: true },
    { id: 'ollama', name: 'Ollama (Local)', models: ['llama2', 'codellama', 'mistral'], free: true, local: true }
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
      let items = [];
      try { items = await fs.readdir(dir); } 
      catch (e) {
        if (e.code === 'ENOENT') { await fs.ensureDir(dir); } 
        else { throw e; }
      }
      const files = [];
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
          files.push(...await getFiles(fullPath, path.join(basePath, item)));
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
      aiProvider: { name: provider, model: config.model, configured: !!config.apiKey || !!config.baseUrl }
    });
  } catch (error) {
    console.error('❌ Erro ao obter status:', error);
    res.status(500).json({ error: 'Erro ao obter status', message: error.message });
  }
});

// ========================================
// GET /file/:path - Retorna arquivo (Fase 3)
// ========================================
app.get('/file/*', async (req, res) => {
  try {
    const filePath = req.params[0];
    const fullPath = path.join(TEMPLATE_PATH, 'src', filePath);

    const safeResolvedPath = path.resolve(fullPath);
    if (!safeResolvedPath.startsWith(TEMPLATE_SRC_RESOLVED_PATH)) {
      return res.status(400).json({ error: 'Caminho de arquivo inválido' });
    }
    if (!await fs.pathExists(fullPath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    const content = await fs.readFile(fullPath, 'utf8');
    res.json({ success: true, path: filePath, content });
  } catch (error) {
    console.error('❌ Erro ao ler arquivo:', error);
    res.status(500).json({ error: 'Erro ao ler arquivo', message: error.message });
  }
});

// ========================================
// DELETE /file/:path - Deleta arquivo (Fase 3)
// ========================================
app.delete('/file/*', async (req, res) => {
  try {
    const filePath = req.params[0];
    const fullPath = path.join(TEMPLATE_PATH, 'src', filePath);

    const safeResolvedPath = path.resolve(fullPath);
    if (!safeResolvedPath.startsWith(TEMPLATE_SRC_RESOLVED_PATH)) {
      return res.status(400).json({ error: 'Caminho de arquivo inválido' });
    }
    if (!await fs.pathExists(fullPath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    await fs.remove(fullPath);
    res.json({ success: true, message: 'Arquivo deletado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar arquivo:', error);
    res.status(500).json({ error: 'Erro ao deletar arquivo', message: error.message });
  }
});

// ========================================
// Server Start
// ========================================
app.listen(PORT, () => {
  try {
    fs.ensureDirSync(path.join(TEMPLATE_PATH, 'src'));
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