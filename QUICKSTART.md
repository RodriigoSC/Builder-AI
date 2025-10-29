# ⚡ Quick Start - 5 Minutos

Comece a usar o AI Builder Base em 5 minutos!

## 🎯 Método Mais Rápido (Groq - Grátis)

### 1. Criar Estrutura
```bash
mkdir ai-builder-base
cd ai-builder-base
mkdir backend frontend template
```

### 2. Configurar Backend

Copie os arquivos:
- `backend/package.json`
- `backend/server.js`
- `backend/providers/aiProviders.js` (crie a pasta providers antes)

```bash
cd backend
mkdir providers
# Copie os arquivos acima
npm install
```

### 3. Obter Chave do Groq (30 segundos)

1. Acesse: https://console.groq.com
2. Faça login (Google/GitHub)
3. Vá em: https://console.groq.com/keys
4. Clique em "Create API Key"
5. Copie a chave

### 4. Configurar .env

```bash
cd backend
nano .env  # ou use seu editor
```

Cole:
```bash
AI_PROVIDER=groq
GROQ_API_KEY=gsk_sua_chave_aqui
GROQ_MODEL=llama-3.3-70b-versatile
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=4000
PORT=3001
NODE_ENV=development
```

### 5. Configurar Frontend

```bash
cd ../frontend
# Copie todos os arquivos do frontend
npm install
```

### 6. Configurar Template

```bash
cd ../template
# Copie todos os arquivos do template
npm install

# Criar pastas
mkdir -p src/components src/pages src/services src/core
```

### 7. Executar (3 terminais)

**Terminal 1:**
```bash
cd backend
npm run dev
```

**Terminal 2:**
```bash
cd frontend
npm run dev
```

**Terminal 3:**
```bash
cd template
npm run dev
```

### 8. Testar!

1. Abra: http://localhost:3000
2. Digite: "Crie um botão customizado"
3. Clique em "Gerar"
4. Clique em "Aplicar"
5. Veja em: http://localhost:5173

## 🎉 Pronto!

Você agora tem:
- ✅ Backend com IA funcionando
- ✅ Interface web para gerar código
- ✅ Preview ao vivo da aplicação
- ✅ Tudo 100% GRATUITO com Groq

---

## 🔄 Trocar para Outro Provider

Edite `backend/.env`:

### Gemini (Grátis)
```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=sua_chave
# Chave: https://makersuite.google.com/app/apikey
```

### OpenAI (Pago)
```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-sua_chave
OPENAI_MODEL=gpt-4o-mini
```

### Claude (Pago)
```bash
AI_PROVIDER=claude
CLAUDE_API_KEY=sk-ant-sua_chave
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

### Ollama (Local)
```bash
# Instale primeiro: https://ollama.ai
ollama pull codellama

AI_PROVIDER=ollama
OLLAMA_MODEL=codellama
```

Reinicie o backend!

---

## 📋 Checklist

- [ ] Estrutura de pastas criada
- [ ] Backend instalado
- [ ] Frontend instalado
- [ ] Template instalado
- [ ] Chave da IA configurada
- [ ] 3 servidores rodando
- [ ] Testei um prompt
- [ ] Funcionou! 🎉

---

## 🆘 Problemas?

### Erro: "GROQ_API_KEY não configurada"
✅ Verifique se copiou a chave corretamente no `.env`

### Erro: "Cannot find module"
✅ Execute `npm install` em cada pasta

### Erro: "Port already in use"
✅ Mate o processo ou mude a porta

### Código não aparece no preview
✅ Clique em "Aplicar" primeiro
✅ Recarregue a página do template (F5)

---

## 📚 Próximos Passos

- 📖 Leia o [PROVIDERS_GUIDE.md](PROVIDERS_GUIDE.md) para conhecer todos os providers
- 🧪 Execute `node backend/test-providers.js` para testar
- 🎨 Personalize o template em `template/src/`
- 🚀 Crie aplicações incríveis!

---

**Dúvidas?** Veja o [README.md](README.md) completo.