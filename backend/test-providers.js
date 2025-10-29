require('dotenv').config();
const { createProvider } = require('./providers/aiProvider.js');

const SYSTEM_CONTEXT = 'Você é um assistente de IA. Responda de forma concisa.';
const TEST_PROMPT = 'Diga "OK" se você está funcionando corretamente.';

const providers = [
  { name: 'OpenAI', id: 'openai', envKey: 'OPENAI_API_KEY', model: process.env.OPENAI_MODEL },
  { name: 'Claude', id: 'claude', envKey: 'CLAUDE_API_KEY', model: process.env.CLAUDE_MODEL },
  { name: 'Gemini', id: 'gemini', envKey: 'GEMINI_API_KEY', model: process.env.GEMINI_MODEL },
  { name: 'Groq', id: 'groq', envKey: 'GROQ_API_KEY', model: process.env.GROQ_MODEL },
  { name: 'Ollama', id: 'ollama', envKey: 'OLLAMA_URL', model: process.env.OLLAMA_MODEL },
  { name: 'Cohere', id: 'cohere', envKey: 'COHERE_API_KEY', model: process.env.COHERE_MODEL },
  { name: 'Mistral', id: 'mistral', envKey: 'MISTRAL_API_KEY', model: process.env.MISTRAL_MODEL },
  { name: 'HuggingFace', id: 'huggingface', envKey: 'HUGGINGFACE_API_KEY', model: process.env.HUGGINGFACE_MODEL }
];

async function testProvider(provider) {
  const apiKey = process.env[provider.envKey];
  
  if (!apiKey) {
    console.log(`⏭️  ${provider.name}: Não configurado (${provider.envKey} não encontrada)`);
    return false;
  }

  try {
    console.log(`🧪 Testando ${provider.name} (${provider.model || 'modelo padrão'})...`);
    
    const config = {
      apiKey: apiKey,
      model: provider.model,
      baseUrl: provider.id === 'ollama' ? apiKey : undefined,
      temperature: 0.7,
      maxTokens: 100
    };

    const aiProvider = createProvider(provider.id, config);
    const result = await aiProvider.generate(TEST_PROMPT, SYSTEM_CONTEXT);

    console.log(`✅ ${provider.name}: FUNCIONANDO`);
    console.log(`   Modelo: ${result.model}`);
    console.log(`   Resposta: ${result.content.substring(0, 50)}...`);
    console.log(`   Tokens: ${JSON.stringify(result.usage)}\n`);
    
    return true;
  } catch (error) {
    console.log(`❌ ${provider.name}: ERRO`);
    console.log(`   ${error.message}\n`);
    return false;
  }
}

async function main() {
  console.log('\n🚀 AI Builder Base - Teste de Providers\n');
  console.log('=' .repeat(60) + '\n');

  const results = [];

  for (const provider of providers) {
    const success = await testProvider(provider);
    results.push({ name: provider.name, success });
  }

  console.log('=' .repeat(60));
  console.log('\n📊 Resumo dos Testes:\n');

  const working = results.filter(r => r.success);
  const notConfigured = results.filter(r => !r.success);

  console.log(`✅ Funcionando: ${working.length}`);
  working.forEach(r => console.log(`   - ${r.name}`));
  
  console.log(`\n⏭️  Não configurado: ${notConfigured.length}`);
  notConfigured.forEach(r => console.log(`   - ${r.name}`));

  console.log('\n💡 Dica: Configure os providers em backend/.env');
  console.log('📖 Veja: PROVIDERS_GUIDE.md para instruções\n');
}

main().catch(console.error);