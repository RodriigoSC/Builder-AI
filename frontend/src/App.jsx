import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Sparkles, Play, Save, Trash2, FileCode, Loader2, Settings, 
  Cpu, Eye, Code, Layout, MessageSquare, History, Rocket,
  FolderTree, GitBranch, Download, Upload, Zap, Terminal,
  RefreshCw, CheckCircle, AlertCircle, ChevronRight, ChevronDown,
  Boxes, Package, Globe, Moon, Sun,
  Wand2
} from 'lucide-react';
import axios from 'axios';

const API_BASE = '/api';

// Templates Prontos
const TEMPLATES = [
  {
    id: 'landing',
    name: 'Landing Page',
    description: 'Landing page moderna com hero, features e CTA',
    icon: Globe,
    prompt: 'Crie uma landing page completa com hero section animado, seção de features com cards, depoimentos e call-to-action. Use gradientes modernos e animações suaves.'
  },
  {
    id: 'dashboard',
    name: 'Dashboard Admin',
    description: 'Dashboard completo com gráficos e tabelas',
    icon: Layout,
    prompt: 'Crie um dashboard administrativo com sidebar, cards de estatísticas, gráficos (use recharts), tabela de dados e sistema de navegação completo.'
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Loja online com carrinho e checkout',
    icon: Package,
    prompt: 'Crie uma página de e-commerce com grid de produtos, filtros, carrinho de compras funcional, modal de detalhes do produto e página de checkout.'
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Portfolio profissional moderno',
    icon: Boxes,
    prompt: 'Crie um portfolio profissional com hero animado, grid de projetos com hover effects, seção sobre mim, skills com barras de progresso e formulário de contato.'
  }
];

// Componentes Rápidos
const QUICK_COMPONENTS = [
  { label: '🎨 Navbar', prompt: 'Crie uma navbar responsiva com logo, links e menu hamburger para mobile' },
  { label: '🃏 Card Grid', prompt: 'Crie um grid responsivo de cards com imagem, título, descrição e botão' },
  { label: '📝 Form', prompt: 'Crie um formulário completo com validação em tempo real e feedback visual' },
  { label: '📊 Dashboard Cards', prompt: 'Crie cards de estatísticas com ícones, valores e gráficos pequenos' },
  { label: '🎭 Hero Section', prompt: 'Crie uma hero section moderna com gradiente, animações e CTA' },
  { label: '💬 Chat UI', prompt: 'Crie uma interface de chat com mensagens, input e indicador de digitação' },
];

function App() {
  // Estados principais
  const [view, setView] = useState('chat'); // 'chat', 'editor', 'preview'
  const [theme, setTheme] = useState('dark');
  const [prompt, setPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modificationTarget, setModificationTarget] = useState(null);
  
  // Estados de arquivos
  const [projectFiles, setProjectFiles] = useState([]);
  const [generatedFiles, setGeneratedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set(['components', 'pages', 'services']));
  
  // Estados de features
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  
  const chatEndRef = useRef(null);
  const previewRef = useRef(null);

  const [notification, setNotification] = useState(null);


  useEffect(() => {
    loadStatus();
    loadHistory();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const loadStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE}/status`);
      setStatus(res.data);
      setProjectFiles(organizeFiles(res.data.files || []));
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    }
  };

  const loadHistory = () => {
    const stored = localStorage.getItem('ai_builder_history');
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  };

  const saveToHistory = (entry) => {
    const newHistory = [entry, ...history].slice(0, 50);
    setHistory(newHistory);
    localStorage.setItem('ai_builder_history', JSON.stringify(newHistory));
  };

  const organizeFiles = (files) => {
    const structure = {
      components: [],
      pages: [],
      services: [],
      other: []
    };

    files.forEach(file => {
      if (file.startsWith('components/')) structure.components.push(file);
      else if (file.startsWith('pages/')) structure.pages.push(file);
      else if (file.startsWith('services/')) structure.services.push(file);
      else structure.other.push(file);
    });

    return structure;
  };
  
  const showNotification = (message, type = 'success') => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 3000);
  };

  const handleGenerate = async (customPrompt = null) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim()) return;

    setLoading(true);
    
    // Adiciona ao chat
    const userMessage = {
      role: 'user',
      content: finalPrompt,
      timestamp: new Date().toISOString()
    };
    setChatHistory(prev => [...prev, userMessage]);

    try {
      // Coleta contexto do projeto
      const context = `
Projeto atual:
- Arquivos existentes: ${projectFiles.components?.length || 0} componentes, ${projectFiles.pages?.length || 0} páginas
- Últimas gerações: ${history.slice(0, 3).map(h => h.prompt).join(', ')}
      `.trim();

      const res = await axios.post(`${API_BASE}/generate`, { 
        prompt: finalPrompt,
        context,
        fileToModify: modificationTarget
      });
      
      if (res.data.files && res.data.files.length > 0) {
        setGeneratedFiles(res.data.files);
        setSelectedFile(res.data.files[0]);
        
        // Adiciona resposta ao chat
        const aiMessage = {
          role: 'assistant',
          content: res.data.description || 'Código gerado com sucesso!',
          files: res.data.files,
          timestamp: new Date().toISOString()
        };
        setChatHistory(prev => [...prev, aiMessage]);

        // Salva no histórico
        saveToHistory({
          prompt: finalPrompt,
          description: res.data.description,
          files: res.data.files,
          timestamp: new Date().toISOString()
        });

        // Muda para view de editor
        if (view === 'chat') {
          setView('editor');
        }
      }
    } catch (error) {
      console.error('Erro ao gerar:', error);
      const errorMessage = {
        role: 'error',
        content: 'Erro: ' + (error.response?.data?.message || error.message),
        timestamp: new Date().toISOString()
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setPrompt('');
      setModificationTarget(null);
    }
  };

  const handleApply = async () => {
    if (generatedFiles.length === 0) return;

    setLoading(true);
    try {
      await axios.post(`${API_BASE}/apply`, { files: generatedFiles });

      showNotification(`✅ ${generatedFiles.length} arquivo(s) aplicado(s)!`, 'success');

      
      // Adiciona confirmação ao chat
      const successMessage = {
        role: 'system',
        content: `✅ ${generatedFiles.length} arquivo(s) aplicado(s) com sucesso!`,
        timestamp: new Date().toISOString()
      };
      setChatHistory(prev => [...prev, successMessage]);

      await loadStatus();
      setGeneratedFiles([]);
      setSelectedFile(null);
      
      // Recarrega preview
      setPreviewKey(prev => prev + 1);
    } catch (error) {
      showNotification('❌ Erro ao aplicar arquivos: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplate = (template) => {
    setShowTemplates(false);
    handleGenerate(template.prompt);
  };

  const handleEditorChange = (value) => {
  if (!selectedFile) return;

   setSelectedFile(prev => ({ ...prev, content: value }));

  setGeneratedFiles(prevFiles => 
    prevFiles.map(file => 
      file.path === selectedFile.path 
        ? { ...file, content: value } 
        : file
    )
  );
};

  const toggleFolder = (folder) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folder)) {
        next.delete(folder);
      } else {
        next.add(folder);
      }
      return next;
    });
  };

  const renderFileTree = () => {
    return (
      <div className="space-y-1">
        {Object.entries(projectFiles).map(([folder, files]) => (
          files.length > 0 && (
            <div key={folder}>
              <button
                onClick={() => toggleFolder(folder)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-slate-700 rounded-lg transition-colors text-slate-300"
              >
                {expandedFolders.has(folder) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <FolderTree className="w-4 h-4" />
                <span className="font-medium">{folder}</span>
                <span className="text-xs text-slate-500">({files.length})</span>
              </button>
              {expandedFolders.has(folder) && (
                <div className="ml-6 space-y-1">
                  {files.map(file => (
                    <div key={file} className="flex items-center gap-1 group">
                      <button
                        onClick={async () => {
                          const res = await axios.get(`${API_BASE}/file/${file}`);
                          setSelectedFile({ path: file, content: res.data.content });
                          if (view === 'chat') setView('editor');
                        }}
                        className="flex-1 flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-slate-700 rounded-lg transition-colors text-slate-400 truncate"
                      >
                        <FileCode className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{file.split('/').pop()}</span>
                      </button>
                      <button
                        onClick={() => {
                          setModificationTarget(file);
                          setView('chat'); // CORREÇÃO: Leva ao chat para digitar a modificação
                        }}
                        className="p-1.5 text-slate-500 rounded-lg hover:bg-blue-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                        title={`Modificar ${file.split('/').pop()}`}
                      >
                        <Wand2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        ))}
      </div>
    );
  };

  const renderChat = () => (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {chatHistory.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-blue-400 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">Olá! Sou seu assistente de código 🚀</h2>
            <p className="text-slate-400 mb-6">
              Descreva o que você quer criar e eu vou gerar o código para você!
            </p>
            
            {/* Quick Templates */}
            <div className="max-w-2xl mx-auto mb-8">
              <p className="text-sm text-slate-400 mb-3">Ou comece com um template:</p>
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map(template => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={template.id}
                      onClick={() => handleTemplate(template)}
                      className="p-4 bg-slate-800 border border-slate-700 rounded-lg hover:border-blue-500 transition-all text-left group"
                    >
                      <Icon className="w-8 h-8 mb-2 text-blue-400 group-hover:scale-110 transition-transform" />
                      <h3 className="font-medium mb-1">{template.name}</h3>
                      <p className="text-xs text-slate-400">{template.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Components */}
            <div className="max-w-2xl mx-auto">
              <p className="text-sm text-slate-400 mb-3">Componentes rápidos:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_COMPONENTS.map((comp, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleGenerate(comp.prompt)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-full text-sm transition-colors"
                  >
                    {comp.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {chatHistory.map((message, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role !== 'user' && (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'error' ? 'bg-red-500' :
                message.role === 'system' ? 'bg-green-500' :
                'bg-blue-500'
              }`}>
                {message.role === 'error' ? <AlertCircle className="w-5 h-5" /> :
                 message.role === 'system' ? <CheckCircle className="w-5 h-5" /> :
                 <Sparkles className="w-5 h-5" />}
              </div>
            )}
            
            <div className={`max-w-2xl ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : message.role === 'error'
                ? 'bg-red-900/50 text-red-200'
                : message.role === 'system'
                ? 'bg-green-900/50 text-green-200'
                : 'bg-slate-800 text-slate-100'
            } rounded-lg p-4`}>
              <p className="whitespace-pre-wrap">{message.content}</p>
              
              {message.files && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <p className="text-xs text-slate-400 mb-2">Arquivos gerados:</p>
                  <div className="flex flex-wrap gap-2">
                    {message.files.map((file, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-slate-700 rounded">
                        {file.path}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                👤
              </div>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-slate-300">Gerando código...</p>
            </div>
          </div>
        )}

        {notification && (
          <div className={`fixed top-20 right-6 px-6 py-3 rounded-lg shadow-lg z-50 ${
            notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          } text-white animate-slide-in`}>
            {notification.message}
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-700 p-4 bg-slate-800/50 backdrop-blur">
        
        {modificationTarget && (
          <div className="mb-2 px-3 py-2 bg-slate-700 rounded-lg flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-blue-400" />
              <span>Modificando: <span className="font-medium text-white">{modificationTarget}</span></span>
            </div>
            <button
              onClick={() => setModificationTarget(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
          </div>
        )}
        
        <div className="flex gap-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            placeholder="Descreva o que você quer criar... (Enter para enviar, Shift+Enter para nova linha)"
            className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows="3"
            disabled={loading}
          />
          <button
            onClick={() => handleGenerate()}
            disabled={loading || !prompt.trim()}
            className="px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Zap className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );

const renderEditor = () => {

    const isGeneratedFile = generatedFiles.some(f => f.path === selectedFile?.path);

    return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-700 bg-slate-800/50 p-4 overflow-y-auto">
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-3 text-slate-300 flex items-center gap-2">
            <FolderTree className="w-4 h-4" />
            Arquivos do Projeto
          </h3>
          {renderFileTree()}
        </div>

        {generatedFiles.length > 0 && (
          <div className="pt-4 border-t border-slate-700">
            <h3 className="text-sm font-medium mb-3 text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Novos Arquivos
            </h3>
            <div className="space-y-1">
              {generatedFiles.map((file, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                    selectedFile?.path === file.path
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <FileCode className="w-4 h-4" />
                  <span className="truncate">{file.path.split('/').pop()}</span>
                </button>
              ))}
            </div>
            <button
              onClick={handleApply}
              disabled={loading}
              className="w-full mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Aplicar Tudo
            </button>
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
          <h3 className="text-sm font-medium text-slate-300">
            {selectedFile?.path || 'Selecione um arquivo'}
          </h3>
          {!isGeneratedFile && selectedFile && (
            <span className="text-xs text-yellow-500">Modo Apenas-Leitura</span>
          )}
          {isGeneratedFile && (
            <span className="text-xs text-green-500">Modo de Edição</span>
          )}
        </div>
        <div className="flex-1">
          <Editor
            theme="vs-dark"
            language="typescript"
            value={selectedFile?.content || '// Selecione um arquivo para visualizar'}

            onChange={handleEditorChange}

            options={{
              readOnly: !isGeneratedFile,
              minimap: { enabled: true },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
      </div>
    </div>
  );
};

  const renderPreview = () => (
    <div className="h-full bg-white">
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b border-slate-300 flex items-center justify-between bg-slate-100">
          <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview ao Vivo (http://localhost:5173)
          </h3>
          <button
            onClick={() => setPreviewKey(prev => prev + 1)}
            className="px-3 py-1 text-xs bg-slate-200 hover:bg-slate-300 rounded text-slate-700 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Recarregar
          </button>
        </div>
        <iframe
          key={previewKey}
          ref={previewRef}
          src="http://localhost:5173"
          className="flex-1 w-full"
          title="Preview"
        />
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur sticky top-0 z-50">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-blue-400" />
                <div>
                  <h1 className="text-xl font-bold">AI Builder Pro</h1>
                  <p className="text-xs text-slate-400">Powered by AI</p>
                </div>
              </div>

              {/* View Switcher -- ALTERADO */}
              <div className="flex gap-1 bg-slate-900 rounded-lg p-1">
                <button
                  onClick={() => setView('chat')}
                  className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                    view === 'chat' ? 'bg-blue-600' : 'hover:bg-slate-800'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat
                </button>
                <button
                  onClick={() => setView('editor')}
                  className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                    view === 'editor' ? 'bg-blue-600' : 'hover:bg-slate-800'
                  }`}
                >
                  <Code className="w-4 h-4" />
                  Editor
                </button>
                <button
                  onClick={() => setView('preview')}
                  className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                    view === 'preview' ? 'bg-blue-600' : 'hover:bg-slate-800'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
              </div>
            </div>
            {/* Fim View Switcher */}

            <div className="flex items-center gap-3">
              {status && (
                <div className="text-sm text-slate-400">
                  📁 {status.fileCount} arquivos
                </div>
              )}
              <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                <History className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content -- ALTERADO */}
      <div className="h-[calc(100vh-73px)]">
        {view === 'chat' && renderChat()}
        
        {view === 'editor' && renderEditor()}
        
        {view === 'preview' && renderPreview()}
      </div>
      {/* Fim Main Content */}
    </div>

    
  );
  
}

export default App;