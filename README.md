# 🚀 AI Builder Base

Plataforma para gerar aplicações React automaticamente a partir de prompts em linguagem natural.

## 📋 Pré-requisitos

- Node.js 18+ 
- NPM ou Yarn
- Chave API da OpenAI

## 🛠️ Instalação

### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd ai-builder-base
```

### 2. Configure o Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edite o arquivo `.env` e adicione sua chave da OpenAI:
```
OPENAI_API_KEY=sk-...
```

### 3. Configure o Frontend

```bash
cd ../frontend
npm install
```

### 4. Configure o Template

```bash
cd ../template
npm install
```

## 🚀 Execução

Você precisa executar 3 terminais simultaneamente:

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```
Rodará em: `http://localhost:3001`

### Terminal 2 - Frontend (Painel de Controle)
```bash
cd frontend
npm run dev
```
Rodará em: `http://localhost:3000`

### Terminal 3 - Template (Preview)
```bash
cd template
npm run dev
```
Rodará em: `http://localhost:5173`

## 📖 Como Usar

1. Acesse `http://localhost:3000`
2. Digite um prompt descrevendo o que você quer criar:
   - "Crie um componente de card de produto"
   - "Adicione uma página de login com validação"
   - "Crie um formulário de cadastro completo"
3. Clique em **Gerar**
4. Revise o código gerado no editor
5. Clique em **Aplicar** para adicionar ao projeto
6. Veja o resultado em `http://localhost:5173`

## 🏗️ Estrutura do Projeto

```
ai-builder-base/
├── backend/          # API Node.js + OpenAI
│   ├── server.js     # Servidor Express
│   └── .env          # Configurações
├── frontend/         # Painel de controle React
│   └── src/
│       └── App.jsx   # Interface principal
└── template/         # Aplicação base React
    └── src/
        ├── components/  # Componentes gerados
        ├── pages/       # Páginas geradas
        └── App.jsx      # App principal
```

## 🎯 Exemplos de Prompts

### Componentes
- "Crie um botão customizado com variantes primary, secondary e outline"
- "Faça um card de usuário com avatar, nome, email e botão de ação"
- "Componente de navbar responsivo com logo e menu"

### Páginas
- "Crie uma página de dashboard com gráficos e cards de estatísticas"
- "Página de perfil de usuário editável"
- "Landing page com hero section e call to action"

### Formulários
- "Formulário de contato com nome, email e mensagem"
- "Form de cadastro com validação de senha forte"
- "Formulário multi-step para checkout"

### Serviços
- "Service para autenticação com JWT"
- "API client para CRUD de produtos"
- "Hook customizado para fetch de dados"

## 🔧 API Endpoints

### `POST /generate`
Gera código a partir de um prompt
```json
{
  "prompt": "Crie um componente X",
  "context": "informações adicionais"
}
```

### `POST /apply`
Aplica arquivos gerados no template
```json
{
  "files": [
    {
      "path": "components/Button.tsx",
      "content": "código aqui"
    }
  ]
}
```

### `GET /status`
Retorna informações do projeto

### `GET /file/:path`
Retorna conteúdo de um arquivo

### `DELETE /file/:path`
Deleta um arquivo

## 🎨 Tecnologias

### Backend
- Node.js + Express
- OpenAI API (GPT-4)
- fs-extra

### Frontend
- React + Vite
- Tailwind CSS
- Monaco Editor
- Lucide Icons

### Template
- React
- Tailwind CSS
- React Router

## 📝 Notas

- Os arquivos são gerados em `template/src/`
- O template roda independentemente na porta 5173
- Use TypeScript nos prompts para melhor qualidade
- A IA mantém padrões de código consistentes

## 🔐 Segurança

⚠️ **IMPORTANTE**: Nunca commite o arquivo `.env` com sua chave da OpenAI!

## 🚧 Roadmap

- [ ] Versionamento automático (Git)
- [ ] Modo colaborativo
- [ ] Templates alternativos (Next.js, Vue)
- [ ] Validação e testes automáticos
- [ ] Deploy automático
- [ ] Banco de dados de prompts
- [ ] Memória de contexto com embeddings

## 📄 Licença

MIT

## 🤝 Contribuindo

Pull requests são bem-vindos! Para mudanças maiores, abra uma issue primeiro.

---

Feito com ❤️ usando IA