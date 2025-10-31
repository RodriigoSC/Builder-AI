import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Suspense, lazy } from 'react';

// A IA irá adicionar os imports das páginas aqui
// Ex: const Home = lazy(() => import('./pages/Home'));
// Ex: const Dashboard = lazy(() => import('./pages/Dashboard'));


// Componente de Loading para Suspense
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600">Carregando...</p>
    </div>
  </div>
);

// Componente de Rota Padrão (suas "informações padrão")
const DefaultHome = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center p-8 bg-white shadow-lg rounded-xl">
      <div className="text-6xl mb-6">🤖</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        AI Builder Canvas
      </h1>
      <p className="text-gray-600 max-w-md mx-auto">
        Seu canvas está pronto. Use o AI Builder para criar uma página (ex: "Crie uma landing page") para substituir este conteúdo.
      </p>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      {/* A IA pode adicionar componentes globais (ex: Navbar) aqui */}
      {/* Ex: <Navbar /> */}
      
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* A IA irá adicionar as rotas aqui, substituindo a rota padrão */}
          {/* Ex: <Route path="/" element={<Home />} /> */}
          {/* Ex: <Route path="/dashboard" element={<Dashboard />} /> */}
          
          {/* Rota padrão inicial */}
          <Route path="/" element={<DefaultHome />} />

        </Routes>
      </Suspense>
      
      {/* A IA pode adicionar componentes globais (ex: Footer) aqui */}
      {/* Ex: <Footer /> */}
    </BrowserRouter>
  );
}

export default App;