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
// LOGGING ESTRUTURADO
// ========================================
const log = {
  info: (msg) => console.log(`ℹ️  [INFO] ${msg}`),
  success: (msg) => console.log(`✅ [SUCCESS] ${msg}`),
  warning: (msg) => console.warn(`⚠️  [WARNING] ${msg}`),
  error: (msg) => console.error(`❌ [ERROR] ${msg}`),
  debug: (msg) => process.env.NODE_ENV === 'development' && console.log(`🐛 [DEBUG] ${msg}`)
};

// ========================================
// PARSER DE JSON ROBUSTO (CORRIGIDO)
// ========================================
const parseRobustJSON = (jsonString) => {
  try {
    let cleanJsonString = jsonString.trim();
    log.debug('Tentando fazer parse de JSON da IA');

    // 1. Tenta extrair JSON de markdown
    const markdownMatch = cleanJsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch?.[1]) {
      cleanJsonString = markdownMatch[1].trim();
      log.debug('JSON extraído de bloco markdown');
    }

    // 2. Encontra o JSON pelas chaves
    const firstBrace = cleanJsonString.indexOf('{');
    const lastBrace = cleanJsonString.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanJsonString = cleanJsonString.substring(firstBrace, lastBrace + 1);
      log.debug('JSON extraído pelas chaves');
    }

    // 3. Remove caracteres inválidos
    cleanJsonString = cleanJsonString
      .replace(/[\x00-\x1F\x7F]/g, '') // Caracteres de controle
      .replace(/,(\s*[}\]])/g, '$1') // Vírgulas extras
      .trim();

    // 4. Parse
    const parsed = JSON.parse(cleanJsonString);
    log.success('JSON parseado com sucesso');
    return parsed;
  } catch (error) {
    log.error(`Erro no parse JSON: ${error.message}`);
    log.error(`Primeiros 200 chars: ${jsonString.substring(0, 200)}`);
    throw new Error(`Falha no parse do JSON: ${error.message}. A IA retornou formato inválido.`);
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
      log.warning(`Erro ao analisar projeto: ${error.message}`);
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
        log.warning(`Aviso ao ler arquivos: ${readError.message}`);
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
// CACHE DE ANÁLISE
// ========================================
const projectCache = {
  analysis: null,
  timestamp: null,
  ttl: 60000 // 1 minuto
};

const getCachedAnalysis = async () => {
  const now = Date.now();
  if (projectCache.analysis && (now - projectCache.timestamp) < projectCache.ttl) {
    log.debug('Usando análise em cache');
    return projectCache.analysis;
  }
  
  log.debug('Analisando projeto...');
  const analyzer = new ProjectAnalyzer(TEMPLATE_PATH);
  projectCache.analysis = await analyzer.analyzeProject();
  projectCache.timestamp = now;
  return projectCache.analysis;
};

// ========================================
// PROMPT DO PLANEADOR (ARQUITETO) - MELHORADO
// ========================================
const getPlannerSystemContext = (projectAnalysis, userPrompt) => {
  return `Você é um Arquiteto de Software AI sênior. 

**TAREFA**: Analisar o prompt e criar um plano de arquivos a gerar/modificar.

**PROJETO ATUAL**:
${projectAnalysis.summary}
Componentes: ${projectAnalysis.components.join(', ') || 'nenhum'}
Páginas: ${projectAnalysis.pages.join(', ') || 'nenhum'}

**PROMPT DO USUÁRIO**: "${userPrompt}"

**REGRAS CRÍTICAS**:
1. Se for tarefa SIMPLES (1 arquivo): retorne plano com 1 arquivo
2. Se for tarefa COMPLEXA: divida em múltiplos arquivos lógicos
3. Para CADA arquivo defina:
   - path: Caminho completo (ex: "components/Button.tsx")
   - action: "create" OU "modify"
   - prompt: Instrução CLARA para o desenvolvedor

**FORMATO DE RESPOSTA OBRIGATÓRIO**:
Retorne APENAS um bloco de JSON válido, formatado como markdown:

{
  "plan": [
    {
      "path": "components/ExemploComponente.tsx",
      "action": "create",
      "prompt": "Crie um componente React..."
    }
  ],
  "description": "Resumo amigável do plano"
}

**IMPORTANTE**: 
- Responda APENAS com o JSON
- Não adicione texto antes ou depois
- **USE** \`\`\`json e markdown. O JSON DEVE estar dentro de um bloco de código.
- Garanta que o JSON seja válido`;
};

// ========================================
// PROMPT DO EXECUTOR (DESENVOLVEDOR)
// ========================================
const getExecutorSystemContext = (projectAnalysis, task) => {
  
  if (task.action === 'modify') {
    return `Você é um assistente especializado em MODIFICAR código React/TypeScript.

**TAREFA ATUAL**:
Modificar o ficheiro: ${task.path}
Instrução do Arquiteto: "${task.prompt}"

**REGRAS PARA MODIFICAÇÃO**:
1. Modifique o código original para atender à instrução.
2. Retorne o CÓDIGO COMPLETO E ATUALIZADO do ficheiro. Não omita nada.
3. Mantenha os imports, hooks e lógica existentes que não foram alterados.
4. Siga os padrões do projeto (TypeScript, Tailwind).

**FORMATO DE RESPOSTA (JSON)**:
Retorne APENAS um bloco de JSON válido, formatado como markdown:

{
  "files": [
    {
      "path": "${task.path}",
      "content": "conteúdo COMPLETO E MODIFICADO do ficheiro aqui"
    }
  ],
  "description": "Descrição clara do que foi modificado neste ficheiro"
}

**CÓDIGO ORIGINAL DO ARQUIVO (${task.path})**:
\`\`\`typescript
${task.originalContent}
\`\`\`
`;
  }

  return `Você é um assistente especializado em gerar código React/TypeScript de alta qualidade.

**TAREFA ATUAL**:
Criar o ficheiro: ${task.path}
Instrução do Arquiteto: "${task.prompt}"

**REGRAS PARA GERAÇÃO (NOVOS ARQUIVOS)**:
1. Gere o código APENAS para o ficheiro solicitado e com base na instrução.
2. Use TypeScript com React e Tailwind CSS.
3. Siga os padrões do projeto: ${projectAnalysis.summary}
4. Inclua todos os imports necessários.
5. O código deve ser funcional, completo e pronto para uso.
6. Tecnologias disponíveis: ${Array.from(projectAnalysis.technologies).join(', ')}

**FORMATO DE RESPOSTA (JSON)**:
Retorne APENAS um bloco de JSON válido, formatado como markdown:

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
// POST /generate (CORRIGIDO)
// ========================================
app.post('/generate', async (req, res) => {
  try {
    const { prompt, context = '', provider: customProvider, fileToModify } = req.body; 

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt é obrigatório' });
    }

    log.info('Nova requisição de geração');
    log.debug(`Prompt: ${prompt.substring(0, 50)}...`);

    // Configuração do Provider
    const originalProvider = process.env.AI_PROVIDER;
    if (customProvider) process.env.AI_PROVIDER = customProvider;
    const { provider, config } = getProviderConfig();
    const aiProvider = createProvider(provider, config);
    log.info(`Usando provider: ${provider} (${config.model})`);

    // Análise do Projeto (com cache)
    const projectAnalysis = await getCachedAnalysis();
    log.debug(`Projeto: ${projectAnalysis.components.length} componentes`);

    let allGeneratedFiles = [];
    let finalDescription = "";

    // --- FLUXO 1: MODIFICAÇÃO SIMPLES ---
    if (fileToModify) {
      log.info(`FLUXO: Modificação Simples de ${fileToModify}`);
      
      const fullPath = path.join(TEMPLATE_PATH, 'src', fileToModify);
      const safeResolvedPath = path.resolve(fullPath);
      
      if (!safeResolvedPath.startsWith(TEMPLATE_SRC_RESOLVED_PATH)) {
        log.error('Caminho de arquivo inválido');
        return res.status(400).json({ error: 'Caminho de arquivo inválido' });
      }

      if (!await fs.pathExists(fullPath)) {
        log.error(`Arquivo ${fileToModify} não encontrado`);
        return res.status(404).json({ error: `Arquivo ${fileToModify} não encontrado` });
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
      
      // VALIDAÇÃO CRÍTICA
      if (!generated.files || !Array.isArray(generated.files) || generated.files.length === 0) {
        throw new Error('IA não retornou código modificado');
      }
      
      allGeneratedFiles = generated.files;
      finalDescription = generated.description || `Arquivo ${fileToModify} modificado com sucesso`;
      log.success(`Modificação concluída: ${fileToModify}`);

    } else {
      // --- FLUXO 2: GERAÇÃO "AGENTE" ---
      log.info('FLUXO: Geração Agente (Planeador + Executor)');

      // PASSO 1: PLANEADOR
      log.info('Etapa 1/2: Chamando Planeador (Arquiteto)');
      const plannerContext = getPlannerSystemContext(projectAnalysis, prompt);
      const plannerResult = await aiProvider.generate(prompt, plannerContext);
      const planResponse = parseRobustJSON(plannerResult.content);
      
      // VALIDAÇÃO DO PLANO
      if (!planResponse.plan || !Array.isArray(planResponse.plan)) {
        throw new Error('Plano inválido recebido do Arquiteto. Esperado: { plan: [...] }');
      }

      if (planResponse.plan.length === 0) {
        throw new Error('Arquiteto retornou plano vazio. Tente reformular o prompt.');
      }
      
      log.success(`Plano criado: ${planResponse.plan.length} arquivo(s)`);
      log.info(planResponse.description);
      finalDescription = planResponse.description;
      allGeneratedFiles = [];

      // PASSO 2: EXECUTOR
      log.info('Etapa 2/2: Executando Plano');
      let step = 1;
      for (const task of planResponse.plan) {
        log.info(`  ${step}/${planResponse.plan.length}: ${task.action} ${task.path}`);
        
        // Se for modificação, carrega conteúdo original
        if (task.action === 'modify') {
          const fullPath = path.join(TEMPLATE_PATH, 'src', task.path);
          const safeResolvedPath = path.resolve(fullPath);
          
          if (!safeResolvedPath.startsWith(TEMPLATE_SRC_RESOLVED_PATH) || !await fs.pathExists(fullPath)) {
            log.warning(`Arquivo inexistente: ${task.path}. Pulando.`);
            continue;
          }
          task.originalContent = await fs.readFile(fullPath, 'utf8');
        }

        const executorContext = getExecutorSystemContext(projectAnalysis, task);
        const executorResult = await aiProvider.generate(task.prompt, executorContext);
        
        const generated = parseRobustJSON(executorResult.content);
        
        // VALIDAÇÃO DO EXECUTOR
        if (!generated.files || !Array.isArray(generated.files) || generated.files.length === 0) {
          log.warning(`Executor não retornou arquivos para ${task.path}. Pulando.`);
          continue;
        }

        allGeneratedFiles.push(...generated.files);
        log.success(`  ✓ ${task.path}`);
        step++;
      }
      log.success('Plano executado com sucesso!');
    }

    // Restaura provider
    if (customProvider) process.env.AI_PROVIDER = originalProvider;

    // Validação final
    if (!allGeneratedFiles || !Array.isArray(allGeneratedFiles) || allGeneratedFiles.length === 0) {
      throw new Error('Nenhum arquivo foi gerado. Tente reformular o prompt.');
    }

    log.success(`Geração completa: ${allGeneratedFiles.length} arquivo(s)`);

    res.json({
      success: true,
      files: allGeneratedFiles,
      description: finalDescription,
      provider: provider,
      model: config.model,
      usage: null
    });

  } catch (error) {
    log.error(`Erro ao gerar código: ${error.message}`);
    res.status(500).json({
      error: 'Erro ao gerar código',
      message: error.message,
      details: error.response?.data || null
    });
  }
});

// ========================================
// POST /apply - Aplica arquivos
// ========================================
app.post('/apply', async (req, res) => {
  try {
    const { files } = req.body;
    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ error: 'Files array é obrigatório' });
    }

    log.info(`Aplicando ${files.length} arquivo(s)`);

    // GIT (Antes)
    try {
      execSync('git add .', { cwd: TEMPLATE_PATH });
      execSync('git commit -m "AI-BUILDER: Backup antes da geração" --allow-empty', { cwd: TEMPLATE_PATH });
      log.success('Backup Git criado');
    } catch (gitError) {
      log.warning(`GIT: Falha ao criar commit de backup: ${gitError.message}`);
    }

    const results = [];
    for (const file of files) {
      const fullPath = path.join(TEMPLATE_PATH, 'src', file.path);
      
      // Segurança
      const safeResolvedPath = path.resolve(fullPath);
      if (!safeResolvedPath.startsWith(TEMPLATE_SRC_RESOLVED_PATH)) {
        log.warning(`SEGURANÇA: Pulando caminho inválido: ${file.path}`);
        results.push({ path: file.path, status: 'skipped (unsafe)' });
        continue;
      }

      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, file.content, 'utf8');
      results.push({ path: file.path, status: 'written', size: file.content.length });
      log.success(`Escrito: ${file.path}`);
    }

    log.info('Executando script de instalação de dependências (ai:deps)...');
    try {
      // Executa o script 'npm run ai:deps' que está no package.json do template
      execSync('npm run ai:deps', { cwd: TEMPLATE_PATH, stdio: 'inherit' });
      log.success('Dependências instaladas/verificadas com sucesso.');
    } catch (depError) {
      log.warning(`Falha ao instalar dependências: ${depError.message}`);
      // Não quebra a requisição, mas avisa no log
    }

    // GIT (Depois)
    try {
      execSync('git add .', { cwd: TEMPLATE_PATH });
      execSync('git commit -m "AI-BUILDER: Alterações aplicadas"', { cwd: TEMPLATE_PATH });
      log.success('Commit Git criado');
    } catch (gitError) {
      log.warning(`GIT: Falha ao criar commit final: ${gitError.message}`);
    }

    // Invalida cache
    projectCache.analysis = null;

    res.json({ success: true, message: 'Arquivos aplicados e versionados com sucesso', results });

  } catch (error) {
    log.error(`Erro ao aplicar arquivos: ${error.message}`);
    res.status(500).json({ error: 'Erro ao aplicar arquivos', message: error.message });
  }
});

// ========================================
// GET /analyze - Analisa projeto atual
// ========================================
app.get('/analyze', async (req, res) => {
  try {
    const analysis = await getCachedAnalysis();
    res.json({ success: true, ...analysis });
  } catch (error) {
    log.error(`Erro ao analisar projeto: ${error.message}`);
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
    log.error(`Erro ao obter status: ${error.message}`);
    res.status(500).json({ error: 'Erro ao obter status', message: error.message });
  }
});

// ========================================
// GET /file/:path - Retorna arquivo
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
    log.error(`Erro ao ler arquivo: ${error.message}`);
    res.status(500).json({ error: 'Erro ao ler arquivo', message: error.message });
  }
});

// ========================================
// DELETE /file/:path - Deleta arquivo
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
    projectCache.analysis = null; // Invalida cache
    log.success(`Arquivo deletado: ${filePath}`);
    res.json({ success: true, message: 'Arquivo deletado com sucesso' });
  } catch (error) {
    log.error(`Erro ao deletar arquivo: ${error.message}`);
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