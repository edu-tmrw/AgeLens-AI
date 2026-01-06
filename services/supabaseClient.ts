import { createClient } from '@supabase/supabase-js';

// Função auxiliar para buscar variáveis de ambiente em diferentes bundlers (Vite, CRA, Next.js, etc)
// e evitar erros de referência se 'process' não estiver definido.
const getEnvVar = (key: string): string => {
  // 1. Tenta Vite (import.meta.env)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    const val = import.meta.env[key] || import.meta.env[`VITE_${key}`];
    if (val) return val;
  }

  // 2. Tenta Node/Webpack/CRA (process.env)
  if (typeof process !== 'undefined' && process.env) {
    const val = process.env[key] || process.env[`REACT_APP_${key}`] || process.env[`NEXT_PUBLIC_${key}`];
    if (val) return val;
  }

  return '';
};

const supabaseUrl = getEnvVar('SUPABASE_URL');
const supabaseKey = getEnvVar('SUPABASE_KEY');

// Se as variáveis não existirem, usamos valores placeholder para evitar o crash
// "Uncaught Error: supabaseUrl is required" durante a inicialização.
// As requisições falharão, mas o app abrirá.
const finalUrl = supabaseUrl || 'https://placeholder-project.supabase.co';
const finalKey = supabaseKey || 'placeholder-key';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase não configurado. Defina SUPABASE_URL e SUPABASE_KEY nas variáveis de ambiente.');
}

export const supabase = createClient(finalUrl, finalKey);

// Utilitário para converter Base64 em Blob para upload
export const base64ToBlob = async (base64: string): Promise<Blob> => {
  const res = await fetch(base64);
  return await res.blob();
};