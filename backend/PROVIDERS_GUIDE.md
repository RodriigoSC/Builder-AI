# 🤖 Guia Completo de Providers de IA

Este projeto suporta **8 providers diferentes de IA**! Escolha o que melhor se adequa às suas necessidades.

---

## 📊 Comparação Rápida

| Provider | Custo | Velocidade | Qualidade | Setup |
|----------|-------|------------|-----------|-------|
| **Groq** | 🟢 Grátis | ⚡⚡⚡ | ⭐⭐⭐⭐ | Fácil |
| **Gemini** | 🟢 Grátis | ⚡⚡ | ⭐⭐⭐⭐ | Fácil |
| **Ollama** | 🟢 Grátis | ⚡⚡ | ⭐⭐⭐ | Médio |
| **HuggingFace** | 🟢 Grátis | ⚡ | ⭐⭐⭐ | Fácil |
| **OpenAI** | 🔴 Pago | ⚡⚡ | ⭐⭐⭐⭐⭐ | Fácil |
| **Claude** | 🔴 Pago | ⚡⚡ | ⭐⭐⭐⭐⭐ | Fácil |
| **Cohere** | 🔴 Pago | ⚡⚡ | ⭐⭐⭐⭐ | Fácil |
| **Mistral** | 🔴 Pago | ⚡⚡ | ⭐⭐⭐⭐ | Fácil |

---

## 🟢 Opções GRATUITAS (Recomendadas)

### 1. Groq (⭐ MAIS RECOMENDADO)

**Por que escolher:**
- ✅ 100% gratuito
- ✅ Ultra rápido (mais rápido que GPT-4)
- ✅ Modelos potentes (Llama 3.3 70B)
- ✅ 30 requisições/minuto grátis

**Setup em 2 minutos:**
```bash
# 1. Obter chave
# Acesse: https://console.groq.com/keys
# Clique em "Create API Key"

# 2. Configurar .env
AI_PROVIDER=groq
GROQ_API_KEY=gsk_sua_chave_aqui
GROQ_MODEL=llama-3.3-70b-versatile
```

**Modelos disponíveis:**
- `llama-3.3-70b-versatile` - Recomendado! Rápido e preciso
- `mixtral-8x7b-32768` - Alternativa excelente
- `llama3-70b-8192` - Boa qualidade

---

### 2. Google Gemini

**Por que escolher:**
- ✅ Gratuito (com limites generosos)
- ✅ Integração com Google
- ✅ Boa qualidade

**Setup:**
```bash
# 1. Obter chave
# Acesse: https://makersuite.google.com/app/apikey

# 2. Configurar .env
AI_PROVIDER=gemini
GEMINI_API_KEY=sua_chave_aqui
GEMINI_MODEL=gemini-pro
```

**Modelos:**
- `gemini-pro` - Gratuito
- `gemini-1.5-pro` - Mais avançado
- `gemini-1.5-flash` - Mais rápido

---

### 3. Ollama (Local - Privado)

**Por que escolher:**
- ✅ 100% gratuito e offline
- ✅ Privacidade total
- ✅ Sem limites de uso
- ⚠️ Requer GPU potente

**Setup:**
```bash
# 1. Instalar Ollama
# Linux/Mac:
curl -fsSL https://ollama.ai/install.sh | sh

# Windows:
# Baixe de: https://ollama.ai/download

# 2. Baixar modelo
ollama pull llama2
# ou
ollama pull codellama  # Melhor para código
ollama pull deepseek-coder  # Especializado em código

# 3. Configurar .env
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=codellama
```

**Modelos recomendados:**
- `codellama` - Especializado em código
- `deepseek-coder` - Excelente para programação
- `llama2` - Uso geral
- `mistral` - Rápido e bom

---

### 4. Hugging Face

**Por que escolher:**
- ✅ Gratuito
- ✅ Muitos modelos open source
- ⚠️ Pode ser lento

**Setup:**
```bash
# 1. Obter token
# Acesse: https://huggingface.co/settings/tokens

# 2. Configurar .env
AI_PROVIDER=huggingface
HUGGINGFACE_API_KEY=hf_sua_chave_aqui
HUGGINGFACE_MODEL=mistralai/Mixtral-8x7B-Instruct-v0.1
```

---

## 🔴 Opções PAGAS (Melhor Qualidade)

### 5. OpenAI (GPT-4)

**Por que escolher:**
- ⭐⭐⭐⭐⭐ Melhor qualidade
- ✅ Mais conhecido e testado
- ❌ Caro

**Setup:**
```bash
# 1. Obter chave
# Acesse: https://platform.openai.com/api-keys

# 2. Adicionar créditos
# https://platform.openai.com/account/billing

# 3. Configurar .env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-sua_chave_aqui
OPENAI_MODEL=gpt-4o-mini  # Mais barato
# ou
OPENAI_MODEL=gpt-4o  # Melhor qualidade
```

**Modelos:**
- `gpt-4o-mini` - $0.15/1M tokens (recomendado)
- `gpt-4o` - $5/1M tokens
- `gpt-4-turbo` - $10/1M tokens

---

### 6. Anthropic Claude

**Por que escolher:**
- ⭐⭐⭐⭐⭐ Excelente qualidade
- ✅ Melhor para código complexo
- ✅ Contexto maior

**Setup:**
```bash
# 1. Obter chave
# Acesse: https://console.anthropic.com/

# 2. Configurar .env
AI_PROVIDER=claude
CLAUDE_API_KEY=sk-ant-sua_chave_aqui
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

**Modelos:**
- `claude-3-5-sonnet-20241022` - Recomendado
- `claude-3-opus-20240229` - Mais poderoso
- `claude-3-haiku-20240307` - Mais rápido

---

### 7. Cohere

**Setup:**
```bash
AI_PROVIDER=cohere
COHERE_API_KEY=sua_chave
COHERE_MODEL=command
```

---

### 8. Mistral AI

**Setup:**
```bash
AI_PROVIDER=mistral
MISTRAL_API_KEY=sua_chave
MISTRAL_MODEL=mistral-small-latest
```

---

## 🔧 Configuração Avançada

### Ajustar Temperatura
```bash
# Mais criativo (0.8-1.0)
AI_TEMPERATURE=0.9

# Mais preciso (0.3-0.5)
AI_TEMPERATURE=0.4

# Balanceado (0.7) - padrão
AI_TEMPERATURE=0.7
```

### Ajustar Tokens
```bash
# Respostas maiores
AI_MAX_TOKENS=8000

# Respostas médias (padrão)
AI_MAX_TOKENS=4000

# Respostas curtas (mais barato)
AI_MAX_TOKENS=2000
```

---

## 🎯 Recomendações por Caso de Uso

### Para Começar (Grátis e Fácil)
```bash
AI_PROVIDER=groq
GROQ_API_KEY=...
```

### Para Privacidade (Local)
```bash
AI_PROVIDER=ollama
OLLAMA_MODEL=codellama
```

### Para Melhor Qualidade (Pago)
```bash
AI_PROVIDER=claude
CLAUDE_API_KEY=...
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

### Para Código Complexo (Pago)
```bash
AI_PROVIDER=openai
OPENAI_MODEL=gpt-4o
```

---

## 🔄 Trocar de Provider

Basta editar o `.env`:

```bash
# Estava usando Groq
AI_PROVIDER=groq
GROQ_API_KEY=...

# Mudar para Claude
AI_PROVIDER=claude
CLAUDE_API_KEY=...
```

Reinicie o backend:
```bash
cd backend
npm run dev
```

---

## 🐛 Solução de Problemas

### Erro: "Provider não configurado"
✅ Verifique se a API key está no `.env`
✅ Verifique se o nome do provider está correto

### Erro: "Quota exceeded"
✅ Adicione créditos (OpenAI, Claude)
✅ Ou mude para provider gratuito (Groq, Gemini)

### Erro: "Model not found"
✅ Verifique se o modelo existe para aquele provider
✅ Veja a lista de modelos neste guia

### Ollama não funciona
✅ Certifique-se que Ollama está rodando: `ollama serve`
✅ Verifique se o modelo foi baixado: `ollama list`

---

## 📊 Custos Estimados (Providers Pagos)

Para **1000 gerações** de componentes médios (~500 tokens):

| Provider | Custo Estimado |
|----------|----------------|
| Groq | $0.00 (Grátis) |
| Gemini | $0.00 (Grátis) |
| Ollama | $0.00 (Grátis) |
| GPT-4o-mini | ~$0.15 |
| GPT-4o | ~$5.00 |
| Claude Sonnet | ~$3.00 |

---

## ✅ Checklist de Setup

- [ ] Escolhi o provider
- [ ] Obtive a API key
- [ ] Configurei o `.env`
- [ ] Reiniciei o backend
- [ ] Testei com um prompt simples
- [ ] Funcionou! 🎉

---

**Dica Final:** Comece com **Groq** (grátis e rápido). Se precisar de melhor qualidade, migre para **Claude** ou **GPT-4**.