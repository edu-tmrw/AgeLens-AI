import React, { useEffect, useState } from 'react';
import { PlusCircle, Calendar, Download, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { ImageComparisonSlider } from './ImageComparisonSlider';
import { ViewState, HistoryItem } from '../types';
import { supabase } from '../services/supabaseClient';

interface DashboardProps {
  onNavigate: (view: ViewState) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States for Delete Modal
  const [itemToDelete, setItemToDelete] = useState<HistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedHistory: HistoryItem[] = data.map(item => ({
          id: item.id,
          date: item.created_at,
          originalUrl: item.original_path,
          generatedUrl: item.generated_path,
          description: `Transformação ${item.style ? item.style.charAt(0).toUpperCase() + item.style.slice(1) : ''}`,
          style: item.style
        }));
        setHistory(formattedHistory);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (url: string, id: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `agelens-result-${id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Erro no download:", error);
      window.open(url, '_blank');
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setIsDeleting(true);

      // 1. PRIMEIRO: Remover registro do Banco de Dados
      // Isso garante que se falhar (por permissão RLS, etc), não apagamos as imagens
      const { error: dbError } = await supabase
        .from('generations')
        .delete()
        .eq('id', itemToDelete.id);

      if (dbError) {
        throw new Error(`Erro ao excluir do banco: ${dbError.message}`);
      }

      // 2. SEGUNDO: Remover arquivos do Storage
      // Extração de caminhos
      const getPathFromUrl = (url: string) => {
        try {
          const urlObj = new URL(url);
          const pathParts = urlObj.pathname.split('/');
          const bucketIndex = pathParts.indexOf('agelens-images');
          
          if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
            return decodeURIComponent(pathParts.slice(bucketIndex + 1).join('/'));
          }
          return null;
        } catch (e) {
          console.error("Erro ao processar URL para exclusão:", e);
          return null;
        }
      };

      const originalPath = getPathFromUrl(itemToDelete.originalUrl);
      const generatedPath = getPathFromUrl(itemToDelete.generatedUrl);
      const pathsToDelete = [originalPath, generatedPath].filter((p): p is string => p !== null);

      if (pathsToDelete.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('agelens-images')
          .remove(pathsToDelete);
        
        if (storageError) {
          // Apenas logamos o erro de storage, pois o registro principal já foi removido
          console.error('Aviso: Registro excluído, mas falha ao limpar arquivos do storage:', storageError);
        }
      }

      // 3. Atualizar a UI
      setHistory(prev => prev.filter(item => item.id !== itemToDelete.id));
      setItemToDelete(null);

    } catch (error: any) {
      console.error('Erro fatal ao excluir:', error);
      alert(`Não foi possível excluir a imagem: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Minha Galeria</h2>
          <p className="text-slate-400 mt-1">Gerencie suas transformações salvas.</p>
        </div>
        <Button 
          onClick={() => onNavigate('generator')}
          icon={<PlusCircle className="w-5 h-5" />}
        >
          Nova Transformação
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-slate-500">Carregando suas lembranças...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((item) => (
            <div key={item.id} className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-all group shadow-lg flex flex-col">
              {/* Image Container with 1:1 Aspect Ratio */}
              <div className="aspect-square relative w-full bg-slate-900/50">
                 <ImageComparisonSlider 
                   beforeImage={item.originalUrl}
                   afterImage={item.generatedUrl}
                   altText={item.description}
                   className="w-full h-full"
                 />
              </div>
              
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-slate-200">{item.description}</h3>
                  </div>
                  
                  <div className="flex items-center text-slate-500 text-xs mt-1">
                    <Calendar className="w-3 h-3 mr-1.5" />
                    {new Date(item.date).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-slate-700/50">
                    <button 
                      onClick={() => handleDownload(item.generatedUrl, item.id)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors group/btn"
                      title="Baixar imagem"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setItemToDelete(item)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors group/btn"
                      title="Excluir"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                </div>
              </div>
            </div>
          ))}

          {/* Empty State placeholder */}
          {history.length === 0 && (
            <div className="col-span-full py-20 text-center bg-slate-800/30 border border-dashed border-slate-700 rounded-2xl">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4">
                <PlusCircle className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-300">Nenhuma imagem ainda</h3>
              <p className="text-slate-500 max-w-sm mx-auto mt-2 mb-6">
                Você ainda não realizou nenhuma transformação. Comece agora para ver o resultado!
              </p>
              <Button onClick={() => onNavigate('generator')} className="mx-auto">
                Criar primeira imagem
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <div className="p-2 bg-red-500/10 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Excluir imagem?</h3>
            </div>
            
            <p className="text-slate-400 mb-6 text-sm leading-relaxed">
              Tem certeza que deseja excluir esta transformação? <br/>
              Essa ação removerá os arquivos e não pode ser desfeita.
            </p>

            <div className="flex gap-3 justify-end">
              <Button 
                variant="secondary" 
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                variant="primary" 
                onClick={confirmDelete}
                isLoading={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 shadow-red-500/20 focus:ring-red-500 border-transparent"
              >
                Sim, excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};