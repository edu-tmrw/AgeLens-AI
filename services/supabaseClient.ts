import { createClient } from '@supabase/supabase-js';
import { getEnvVar } from './env';

// Tenta pegar das variáveis de ambiente.
const supabaseUrl = getEnvVar('SUPABASE_URL') || 'https://placeholder.supabase.co';

// Chave placeholder no formato JWT para evitar erros de parser na inicialização do cliente
// (Header.Payload.Signature) - Isso previne crash síncrono da biblioteca supabase-js
const placeholderKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNTE2MjM5MDIyfQ.MOCK_SIGNATURE_FOR_CLIENT_INIT_ONLY';

const supabaseKey = getEnvVar('SUPABASE_KEY') || placeholderKey;

// Flag para saber se estamos usando credenciais reais
export const isSupabaseConfigured = supabaseUrl !== 'https://placeholder.supabase.co' && supabaseKey !== placeholderKey;

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