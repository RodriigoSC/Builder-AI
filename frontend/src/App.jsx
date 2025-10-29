import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Sparkles, Play, Save, Trash2, FileCode, Loader2, Settings, Cpu } from 'lucide-react';
import axios from 'axios';

const API_BASE = '/api';

const PRESETS = [
  { label: 'Criar componente', prompt: 'Crie um componente React chamado [NOME]' },
  { label: 'Adicionar formulário', prompt: 'Crie um formulário de [TIPO] com validação' },
  { label: 'Página completa', prompt: 'Crie uma página de [NOME] com navegação e layout' },
  { label: 'API service', prompt: 'Crie um service para integrar com a API de [RECURSO]' },
];

function App() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [description, setDescription] = useState('');
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [showProviderModal, setShowProviderModal] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE}/status`);
      setStatus(res.data);
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setGeneratedFiles([]);
    setSelectedFile(null);
    setDescription('');

    try {
      const res = await axios.post(`${API_BASE}/generate`, { prompt });
      
      if (res.data.files && res.data.files.length > 0) {
        setGeneratedFiles(res.data.files);
        setSelectedFile(res.data.files[0]);
        setDescription(res.data.description || '');
      }
    } catch (error) {
      console.error('Erro ao gerar:', error);
      alert('Erro ao gerar código: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (generatedFiles.length === 0) return;

    setLoading(true);
    try {
      await axios.post(`${API_BASE}/apply`, { files: generatedFiles });
      alert('Arquivos aplicados com sucesso!');
      await loadStatus();
      setGeneratedFiles([]);
      setSelectedFile(null);
      setPrompt('');
    } catch (error) {
      console.error('Erro ao aplicar:', error);
      alert('Erro ao aplicar arquivos: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePreset = (presetPrompt) => {
    setPrompt(presetPrompt);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl font-bold">AI Builder Base</h1>
            </div>
            {status && (
              <div className="text-sm text-slate-400">
                📁 {status.fileCount} arquivos no projeto
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Prompt Section */}
        <div className="mb-8">
          <label className="block text-sm font-medium mb-3 text-slate-300">
            Descreva o que você quer criar:
          </label>
          
          {/* Presets */}
          <div className="flex flex-wrap gap-2 mb-4">
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handlePreset(preset.prompt)}
                className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Prompt Input */}
          <div className="flex gap-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Crie um componente de card de produto com imagem, título, preço e botão de adicionar ao carrinho"
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-none"
              disabled={loading}
            />
            <div className="flex flex-col gap-2">
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Gerar
                  </>
                )}
              </button>
              
              {generatedFiles.length > 0 && (
                <button
                  onClick={handleApply}
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Aplicar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {description && (
          <div className="mb-6 p-4 bg-slate-800 border border-slate-700 rounded-lg">
            <p className="text-slate-300">{description}</p>
          </div>
        )}

        {/* Generated Files */}
        {generatedFiles.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* File List */}
            <div className="lg:col-span-1">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3 text-slate-300">Arquivos Gerados</h3>
                <div className="space-y-1">
                  {generatedFiles.map((file, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedFile(file)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                        selectedFile === file
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      <FileCode className="w-4 h-4" />
                      <span className="truncate">{file.path}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Code Editor */}
            <div className="lg:col-span-3">
              <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-300">
                    {selectedFile?.path || 'Selecione um arquivo'}
                  </h3>
                </div>
                <div className="h-[600px]">
                  <Editor
                    theme="vs-dark"
                    language="typescript"
                    value={selectedFile?.content || '// Selecione um arquivo para visualizar'}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && generatedFiles.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Digite um prompt e clique em "Gerar" para começar</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;