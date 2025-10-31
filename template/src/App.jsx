// src/App.jsx
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { setupLivePreview } from './ai/ai-builder-preview';

// Escolha o loader conforme seu bundler:
// Para Vite:
import { loadAIPagesVite } from './ai/ai-builder-loader.vite';
// Para CRA (descomente se usar CRA):
// import { loadAIPagesCRA } from './ai/ai-builder-loader.cra';

setupLivePreview();

const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div>Carregando preview...</div>
  </div>
);

function App() {
  // use o loader adequado:
  const pages = loadAIPagesVite(); // ou loadAIPagesCRA();

  // Verifica se uma rota raiz ('/') já foi gerada pela IA
  const hasRootPage = pages.some(p => p.path === '/');

  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          {pages.map(({ path, component: Component }) => (
            <Route key={path} path={path} element={<Component />} />
          ))}

          {/* Rota padrão (fallback) SÓ SE a IA não criou uma página / */}
          {!hasRootPage && (
            <Route
              path="/"
              element={
                <div style={{padding:20}}>Canvas padrão: crie uma página com a IA para substituir este conteúdo. (Ex: "crie uma home page")</div>
              }
            />
          )}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;