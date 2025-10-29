@echo off
echo 🚀 Configurando AI Builder Base...

REM Backend
echo 📦 Instalando dependências do Backend...
cd backend
call npm install
if not exist .env (
    copy .env.example .env
    echo ✅ Arquivo .env criado. Configure sua OPENAI_API_KEY!
)
cd ..

REM Frontend
echo 📦 Instalando dependências do Frontend...
cd frontend
call npm install
cd ..

REM Template
echo 📦 Instalando dependências do Template...
cd template
call npm install

REM Criar pastas necessárias
if not exist src\components mkdir src\components
if not exist src\pages mkdir src\pages
if not exist src\services mkdir src\services
if not exist src\core mkdir src\core

cd ..

echo.
echo ✅ Setup concluído!
echo.
echo Para iniciar o projeto:
echo.
echo Terminal 1 - Backend:
echo   cd backend ^&^& npm run dev
echo.
echo Terminal 2 - Frontend:
echo   cd frontend ^&^& npm run dev
echo.
echo Terminal 3 - Template:
echo   cd template ^&^& npm run dev
echo.
echo Acesse: http://localhost:3000
pause