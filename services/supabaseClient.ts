import { createClient } from '@supabase/supabase-js';
import { getEnvVar } from './env';

// Tenta pegar das variáveis de ambiente, se não existir, usa as chaves fornecidas como fallback
const supabaseUrl = getEnvVar('SUPABASE_URL') || 'https://nxxnebudvwakkezsiqyr.supabase.co';
const supabaseKey = getEnvVar('SUPABASE_KEY') || 'sb_publishable_-YwbRk35XtOBS1MTZmkYDw_dkE-Pnb4';

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseKey;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Utilitário para converter Base64 em Blob para upload
// Implementação manual é mais segura que fetch para data URIs em alguns navegadores/ambientes
export const base64ToBlob = async (base64: string): Promise<Blob> => {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
};