#!/bin/bash

echo "🚀 Configurando AI Builder Base..."

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Backend
echo -e "${BLUE}📦 Instalando dependências do Backend...${NC}"
cd backend
npm install
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ Arquivo .env criado. Configure sua OPENAI_API_KEY!${NC}"
fi
cd ..

# Frontend
echo -e "${BLUE}📦 Instalando dependências do Frontend...${NC}"
cd frontend
npm install
cd ..

# Template
echo -e "${BLUE}📦 Instalando dependências do Template...${NC}"
cd template
npm install

# Criar pastas necessárias
mkdir -p src/components
mkdir -p src/pages
mkdir -p src/services
mkdir -p src/core

cd ..

echo -e "${GREEN}✅ Setup concluído!${NC}"
echo ""
echo -e "${BLUE}Para iniciar o projeto:${NC}"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend && npm run dev"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd frontend && npm run dev"
echo ""
echo "Terminal 3 - Template:"
echo "  cd template && npm run dev"
echo ""
echo -e "${GREEN}Acesse: http://localhost:3000${NC}"