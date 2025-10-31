import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

function App() {
  const [components, setComponents] = useState([]);
  const [pages, setPages] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Busca todos os componentes e páginas disponíveis
    const loadModules = async () => {
      try {
        // Componentes
        const componentModules = import.meta.glob('./components/**/*.{jsx,tsx}');
        const componentList = Object.keys(componentModules).map(path => ({
          name: path.split('/').pop().replace(/\.(jsx|tsx)$/, ''),
          path: path,
          loader: componentModules[path]
        }));

        // Páginas
        const pageModules = import.meta.glob('./pages/**/*.{jsx,tsx}');
        const pageList = Object.keys(pageModules).map(path => ({
          name: path.split('/').pop().replace(/\.(jsx|tsx)$/, ''),
          path: path,
          route: '/' + path.split('/').pop().replace(/\.(jsx|tsx)$/, '').toLowerCase(),
          loader: pageModules[path]
        }));

        setComponents(componentList);
        setPages(pageList);
      } catch (err) {
        setError(err.message);
      }
    };

    loadModules();
  }, []);

  // Componente de Loading
  const Loading = () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Carregando...</p>
      </div>
    </div>
  );

  // Componente de Erro
  const ErrorDisplay = ({ message }) => (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
        <h2 className="text-2xl font-bold text-red-600 mb-4">❌ Erro</h2>
        <p className="text-gray-700">{message}</p>
      </div>
    </div>
  );

  // Home com lista de componentes
  const Home = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🚀 AI Builder - Template Dinâmico
          </h1>
          <p className="text-xl text-gray-600">
            Componentes e páginas criados por IA
          </p>
        </div>

        {/* Páginas Disponíveis */}
        {pages.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              📄 Páginas Disponíveis
              <span className="text-sm font-normal text-gray-500">({pages.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pages.map((page) => (
                <Link
                  key={page.path}
                  to={page.route}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 border-2 border-transparent hover:border-blue-500 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">📄</span>
                    <span className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors">
                      Ver página →
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {page.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Rota: <code className="bg-gray-100 px-2 py-1 rounded">{page.route}</code>
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Componentes Disponíveis */}
        {components.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              🧩 Componentes Disponíveis
              <span className="text-sm font-normal text-gray-500">({components.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {components.map((component) => {
                const Component = lazy(component.loader);
                return (
                  <div
                    key={component.path}
                    className="bg-white rounded-xl shadow-md p-6 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl">🧩</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Componente
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {component.name}
                    </h3>
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-xs text-gray-500 mb-3">Preview:</p>
                      <Suspense fallback={<div className="text-sm text-gray-400">Carregando...</div>}>
                        <Component />
                      </Suspense>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Nenhum conteúdo */}
        {pages.length === 0 && components.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-6">🤖</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Nenhum componente ou página criado ainda
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Use o AI Builder para gerar componentes e páginas automaticamente.
              Eles aparecerão aqui assim que forem criados!
            </p>
            <div className="bg-blue-50 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-sm text-gray-700">
                <strong>💡 Dica:</strong> Experimente criar um componente como
                "Navbar", "Card" ou uma página como "Dashboard"
              </p>
            </div>
          </div>
        )}

        {/* Rodapé */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>⚡ Powered by AI Builder Pro</p>
        </div>
      </div>
    </div>
  );

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          {pages.map((page) => {
            const PageComponent = lazy(page.loader);
            return (
              <Route
                key={page.path}
                path={page.route}
                element={
                  <div>
                    <nav className="bg-white shadow-sm border-b">
                      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                        <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">
                          ← Voltar
                        </Link>
                        <span className="text-sm text-gray-600">{page.name}</span>
                      </div>
                    </nav>
                    <PageComponent />
                  </div>
                }
              />
            );
          })}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;