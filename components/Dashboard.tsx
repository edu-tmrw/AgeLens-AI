import React, { useEffect, useState } from 'react';
import { PlusCircle, Calendar, Download, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { ImageComparisonSlider } from './ImageComparisonSlider';
import { ViewState, HistoryItem, User } from '../types';
import { supabase } from '../services/supabaseClient';
import { getEnvVar } from '../services/env';

interface DashboardProps {
  user: User | null;
  onNavigate: (view: ViewState) => void;
}

// Helper to fix URLs if data was restored from a different project or bucket
const fixStorageUrl = (originalUrl: string): string => {
  if (!originalUrl) return '';
  
  // Current Storage Config
  const SUPABASE_URL = getEnvVar('SUPABASE_URL');
  const CURRENT_BUCKET = '05de1dbb-754c-4412-bce8-b2c3bb671648';

  // If URL is already correct, return it
  if (originalUrl.includes(SUPABASE_URL) && originalUrl.includes(CURRENT_BUCKET)) {
    return originalUrl;
  }

  // If it's a relative path or from an old bucket, try to reconstruct it
  // We assume the file path structure is consistently "userId/filename" or similar at the end
  try {
    const urlParts = originalUrl.split('/public/');
    if (urlParts.length > 1) {
      // urlParts[1] might look like "old-bucket/user123/file.jpg" or just "user123/file.jpg"
      const pathParts = urlParts[1].split('/');
      
      // If the first part is NOT a user ID (assuming UUID length approx 36), it might be the old bucket name
      // We skip the bucket name part if it exists to find the file path
      let filePath = urlParts[1];
      
      // Simple heuristic: if the first segment is not the current bucket, and we have multiple segments, 
      // check if we need to swap the bucket.
      // For safety, let's just find the part that looks like a path.
      // Usually: bucketName/userId/filename
      
      if (pathParts.length >= 2) {
         // Reconstruct using the current project URL and current Bucket
         // We assume the last 2 parts are reliable (userId/filename) or everything after the bucket is.
         // Let's assume the old bucket was part of the path in the 'public' segment.
         
         // Remove the old bucket name from the path if present
         const potentialBucket = pathParts[0];
         // If the first part matches the current bucket, we are good (already handled above).
         // If not, we replace it.
         
         const relativePath = pathParts.slice(1).join('/'); // removes old bucket name
         // HOWEVER, sometimes the URL stored is just public/bucket/file. 
         // Sometimes it's public/file (if bucket is implicit? no).
         
         // SAFEST BET: Use the path as is if it looks like userId/file, otherwise replace bucket.
         // Let's try to just point to the new project + new bucket + everything after the old bucket.
         
         return `${SUPABASE_URL}/storage/v1/object/public/${CURRENT_BUCKET}/${relativePath}`;
      }
    }
  } catch (e) {
    console.warn("Could not fix URL:", originalUrl);
  }

  return originalUrl;
};

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States for Delete Modal
  const [itemToDelete, setItemToDelete] = useState<HistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      
      if (!user) return;

      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .eq('user_id', user.id) // Explicitly filter by user to ensure we hit RLS correctly or filter manually
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedHistory: HistoryItem[] = data.map(item => ({
          id: item.id,
          date: item.created_at,
          // Apply fixStorageUrl to handle migration cases
          originalUrl: fixStorageUrl(item.original_path),
          generatedUrl: fixStorageUrl(item.generated_path),
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

      // 1. Extract paths from URLs to delete from Storage
      // URL format: .../05de1dbb-754c-4412-bce8-b2c3bb671648/userId/filename.ext
      const getPathFromUrl = (url: string) => {
        const marker = '/05de1dbb-754c-4412-bce8-b2c3bb671648/';
        const index = url.indexOf(marker);
        if (index !== -1) {
          return url.substring(index + marker.length);
        }
        // Fallback for older URLs or different buckets
        const parts = url.split('/');
        // Assuming last 2 parts are userId/filename
        if (parts.length >= 2) {
            return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
        }
        return null;
      };

      const originalPath = getPathFromUrl(itemToDelete.originalUrl);
      const generatedPath = getPathFromUrl(itemToDelete.generatedUrl);
      const pathsToDelete = [originalPath, generatedPath].filter((p): p is string => p !== null);

      if (pathsToDelete.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('05de1dbb-754c-4412-bce8-b2c3bb671648')
          .remove(pathsToDelete);
        
        if (storageError) console.error('Erro ao deletar arquivos:', storageError);
      }

      // 2. Delete from Database
      const { error: dbError } = await supabase
        .from('generations')
        .delete()
        .eq('id', itemToDelete.id);

      if (dbError) throw dbError;

      // 3. Update UI
      setHistory(prev => prev.filter(item => item.id !== itemToDelete.id));
      setItemToDelete(null);

    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Não foi possível excluir a imagem. Tente novamente.');
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
                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-700/50">
                    <button 
                      onClick={() => handleDownload(item.generatedUrl, item.id)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      title="Baixar imagem"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setItemToDelete(item)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
              <h3 className="text-lg font-medium text-slate-300">Nenhuma imagem encontrada</h3>
              <p className="text-slate-500 max-w-sm mx-auto mt-2 mb-6">
                Não encontramos transformações para sua conta. Se você restaurou um backup, verifique se está logado na conta correta.
              </p>
              <Button onClick={() => onNavigate('generator')} className="mx-auto">
                Criar nova imagem
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
            
            <p className="text-slate-400 mb-6">
              Tem certeza que deseja excluir esta transformação? Essa ação não pode ser desfeita.
            </p>

            <div className="flex gap-3 justify-end">
              <Button 
                variant="secondary" 
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="w-full"
              >
                Cancelar
              </Button>
              <Button 
                variant="primary" 
                onClick={confirmDelete}
                isLoading={isDeleting}
                className="w-full bg-red-600 hover:bg-red-700 shadow-red-500/20 focus:ring-red-500"
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};