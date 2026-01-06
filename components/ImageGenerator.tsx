import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Download, RefreshCw, AlertCircle, Wand2, Trash2, Clock, Save, Check, Sparkles, User, Skull, Star } from 'lucide-react';
import { Button } from './Button';
import { ImageComparisonSlider } from './ImageComparisonSlider';
import { generateAgingEffect } from '../services/geminiService';
import { ProcessingStatus, ImageState, HistoryItem, AgingStyle } from '../types';
import { supabase, base64ToBlob } from '../services/supabaseClient';

interface ImageGeneratorProps {
  onSave?: (item: HistoryItem) => void;
  userId?: string;
}

const PROCESSING_MESSAGES = [
  "Analisando traços faciais...",
  "Mapeando estrutura óssea...",
  "Simulando perda de colágeno...",
  "Aplicando linhas de expressão...",
  "Ajustando pigmentação da pele...",
  "Refinando detalhes capilares...",
  "Finalizando renderização..."
];

const AGING_STYLES: { id: AgingStyle; label: string; description: string; icon: React.ReactNode }[] = [
  { 
    id: 'rustico', 
    label: 'Rústico', 
    description: 'Marcas profundas do tempo, pele castigada e visual cansado.',
    icon: <Skull className="w-5 h-5" />
  },
  { 
    id: 'natural', 
    label: 'Natural', 
    description: 'Envelhecimento equilibrado, mantendo seus traços originais.',
    icon: <User className="w-5 h-5" />
  },
  { 
    id: 'elegante', 
    label: 'Elegante', 
    description: 'Sofisticação, pele bem cuidada e um ar de sabedoria.',
    icon: <Star className="w-5 h-5" />
  }
];

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onSave, userId }) => {
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [selectedStyle, setSelectedStyle] = useState<AgingStyle>('natural');
  const [images, setImages] = useState<ImageState>({ original: null, generated: null });
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: number | undefined;
    if (status === ProcessingStatus.PROCESSING) {
      interval = window.setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % PROCESSING_MESSAGES.length);
      }, 2500);
    } else {
      setMessageIndex(0);
    }
    return () => clearInterval(interval);
  }, [status]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem válido (JPEG ou PNG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem é muito grande. O tamanho máximo é 5MB.');
      return;
    }

    setError(null);
    setStatus(ProcessingStatus.UPLOADING);
    setIsSaved(false);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImages({ original: reader.result as string, generated: null });
      setStatus(ProcessingStatus.IDLE);
    };
    reader.readAsDataURL(file);
  };

  const handleProcessImage = async () => {
    if (!images.original) return;

    try {
      setStatus(ProcessingStatus.PROCESSING);
      setError(null);
      setIsSaved(false);
      
      const agedImage = await generateAgingEffect(images.original, selectedStyle);
      
      setImages(prev => ({ ...prev, generated: agedImage }));
      setStatus(ProcessingStatus.SUCCESS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
      setStatus(ProcessingStatus.ERROR);
    }
  };

  const handleReset = () => {
    setImages({ original: null, generated: null });
    setStatus(ProcessingStatus.IDLE);
    setError(null);
    setIsSaved(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = () => {
    if (!images.generated) return;
    const link = document.createElement('a');
    link.href = images.generated;
    link.download = 'agelens-resultado.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveToGallery = async () => {
    if (!images.original || !images.generated || !onSave || !userId) return;

    try {
      setIsSaving(true);
      const timestamp = Date.now();
      
      // 1. Convert Base64 images to Blobs
      const originalBlob = await base64ToBlob(images.original);
      const generatedBlob = await base64ToBlob(images.generated);

      // 2. Upload Original to Supabase Storage
      const originalPath = `${userId}/${timestamp}_original.jpg`;
      const { error: uploadOrigError } = await supabase.storage
        .from('agelens-images')
        .upload(originalPath, originalBlob);

      if (uploadOrigError) throw uploadOrigError;

      // 3. Upload Generated to Supabase Storage
      const generatedPath = `${userId}/${timestamp}_${selectedStyle}.png`;
      const { error: uploadGenError } = await supabase.storage
        .from('agelens-images')
        .upload(generatedPath, generatedBlob);

      if (uploadGenError) throw uploadGenError;

      // 4. Get Public URLs
      const { data: { publicUrl: originalUrl } } = supabase.storage
        .from('agelens-images')
        .getPublicUrl(originalPath);

      const { data: { publicUrl: generatedUrl } } = supabase.storage
        .from('agelens-images')
        .getPublicUrl(generatedPath);

      // 5. Save Record to Database
      const { data, error: dbError } = await supabase
        .from('generations')
        .insert({
          user_id: userId,
          original_path: originalUrl,
          generated_path: generatedUrl,
          style: selectedStyle
        })
        .select()
        .single();

      if (dbError) throw dbError;

      const newItem: HistoryItem = {
        id: data.id,
        date: data.created_at,
        originalUrl: originalUrl,
        generatedUrl: generatedUrl,
        description: `Transformação ${AGING_STYLES.find(s => s.id === selectedStyle)?.label}`,
        style: selectedStyle
      };

      onSave(newItem);
      setIsSaved(true);

    } catch (err: any) {
      console.error(err);
      setError('Erro ao salvar imagem no servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 md:py-12 flex flex-col items-center animate-in fade-in duration-500">
      
      <div className="text-center mb-10 max-w-2xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white tracking-tight">
          Como você quer que o <span className="text-indigo-400">tempo lhe trate?</span>
        </h2>
        <p className="text-slate-400">
          Selecione um estilo e faça upload da sua foto.
        </p>
      </div>

      {error && (
        <div className="w-full max-w-md bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center mb-8 animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" />
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Side: Image Display/Uploader */}
        <div className="flex-1 w-full order-2 lg:order-1">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-1 shadow-2xl overflow-hidden flex flex-col relative">
              <div className="relative aspect-square sm:aspect-[4/3] w-full bg-slate-900/50 rounded-xl overflow-hidden group">
                {images.original ? (
                  <>
                    {images.generated ? (
                      <div className="animate-in fade-in zoom-in-95 duration-700 w-full h-full">
                        <ImageComparisonSlider 
                            beforeImage={images.original} 
                            afterImage={images.generated} 
                            altText="Resultado do envelhecimento"
                            className="absolute inset-0 w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="relative w-full h-full">
                        <img 
                            src={images.original} 
                            alt="Original" 
                            className={`w-full h-full object-cover transition-all duration-700 ${status === ProcessingStatus.PROCESSING ? 'opacity-70 grayscale-[0.3] scale-105' : ''}`} 
                        />
                        {/* Style indicator */}
                        <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-indigo-400 font-semibold uppercase tracking-wider flex items-center gap-2">
                          <Sparkles className="w-3 h-3" />
                          Estilo: {AGING_STYLES.find(s => s.id === selectedStyle)?.label}
                        </div>
                      </div>
                    )}

                    {status === ProcessingStatus.PROCESSING && (
                      <div className="absolute inset-0 z-40 flex flex-col items-center justify-center">
                           <div className="absolute left-0 w-full h-24 bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent z-50 animate-scan-line pointer-events-none">
                              <div className="w-full h-0.5 bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,1)]"></div>
                           </div>
                           
                           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"></div>
                           
                           <div className="relative bg-slate-900/90 p-8 rounded-2xl backdrop-blur-xl border border-slate-700 shadow-2xl flex flex-col items-center max-w-xs w-full z-50">
                              <div className="relative mb-6">
                                <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin" />
                                <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-purple-400 animate-pulse" />
                              </div>
                              
                              <p className="text-white font-semibold text-lg animate-pulse-soft text-center min-h-[3.5rem] flex items-center justify-center leading-snug px-2">
                                {PROCESSING_MESSAGES[messageIndex]}
                              </p>
                              
                              <div className="w-full h-1.5 bg-slate-800 rounded-full mt-6 overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full animate-progress-fake shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                              </div>
                           </div>
                      </div>
                    )}

                    {status === ProcessingStatus.IDLE && !images.generated && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                        <button 
                          onClick={handleReset}
                          className="bg-red-500/80 hover:bg-red-600 text-white p-3 rounded-full backdrop-blur-sm transition-transform hover:scale-110"
                        >
                          <Trash2 className="w-6 h-6" />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div 
                    onClick={triggerFileInput}
                    className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800/50 transition-colors border-2 border-dashed border-slate-700 hover:border-indigo-500/50 p-8 text-center"
                  >
                    <div className="bg-slate-800 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                      <UploadCloud className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-200">Clique para enviar foto</h3>
                    <p className="text-slate-500 text-sm mt-2">JPG ou PNG (Max 5MB)</p>
                  </div>
                )}
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/png, image/jpeg, image/jpg"
                />
              </div>

              <div className="p-4 border-t border-slate-700/50 bg-slate-800/30 flex justify-between items-center">
                <span className="text-sm font-medium text-slate-400">
                  {images.generated ? "Comparar Resultado" : images.original ? "Preview Original" : "Faça o Upload"}
                </span>
                {images.original && status === ProcessingStatus.IDLE && !images.generated && (
                   <button onClick={triggerFileInput} className="text-xs text-indigo-400 hover:text-indigo-300">Trocar foto</button>
                )}
              </div>
          </div>
          
          {/* Actions below the card */}
          <div className="mt-6 flex flex-col gap-4">
            {images.original && !images.generated && (
              <Button 
                onClick={handleProcessImage} 
                isLoading={status === ProcessingStatus.PROCESSING}
                className="w-full py-4 text-lg shadow-indigo-500/25 group overflow-hidden relative"
                icon={<Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
              >
                {status === ProcessingStatus.PROCESSING ? 'Transformando...' : 'Transformar Agora'}
                <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_2s_infinite]"></div>
              </Button>
            )}

            {images.generated && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-in slide-in-from-bottom-4">
                 {onSave && (
                   <Button 
                      variant="primary" 
                      onClick={handleSaveToGallery} 
                      disabled={isSaved || isSaving} 
                      className={isSaved ? "bg-green-600" : ""}
                      isLoading={isSaving}
                   >
                    {isSaved ? "Salvo" : "Salvar"}
                  </Button>
                 )}
                <Button variant="secondary" onClick={handleDownload} icon={<Download className="w-4 h-4" />}>Baixar</Button>
                <Button variant="outline" onClick={handleReset} className="col-span-2 sm:col-span-1">Nova Foto</Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Style Selection */}
        <div className="w-full lg:w-80 flex flex-col gap-4 order-1 lg:order-2">
          {AGING_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => setSelectedStyle(style.id)}
              disabled={status === ProcessingStatus.PROCESSING}
              className={`flex flex-col text-left p-4 rounded-2xl border-2 transition-all duration-200 group relative ${
                selectedStyle === style.id 
                  ? 'bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-500/10' 
                  : 'bg-slate-800/40 border-slate-700 hover:border-slate-600 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${selectedStyle === style.id ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600'}`}>
                  {style.icon}
                </div>
                <div className="flex-1">
                  <h4 className={`font-bold ${selectedStyle === style.id ? 'text-white' : 'text-slate-300'}`}>{style.label}</h4>
                </div>
                {selectedStyle === style.id && (
                  <div className="bg-indigo-500 rounded-full p-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <p className={`text-xs leading-relaxed ${selectedStyle === style.id ? 'text-indigo-200' : 'text-slate-500'}`}>
                {style.description}
              </p>
            </button>
          ))}
          
          <div className="mt-4 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
             <div className="flex items-center gap-2 text-indigo-400 mb-1">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Dica de IA</span>
             </div>
             <p className="text-[11px] text-slate-400">
               Para melhores resultados, escolha fotos frontais e bem iluminadas. A IA NanoBanana preserva sua identidade original.
             </p>
          </div>
        </div>

      </div>
    </div>
  );
};