import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nxxnebudvwakkezsiqyr.supabase.co';
// Utilizando a chave publicável fornecida
const supabaseKey = 'sb_publishable_-YwbRk35XtOBS1MTZmkYDw_dkE-Pnb4';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Utilitário para converter Base64 em Blob para upload
export const base64ToBlob = async (base64: string): Promise<Blob> => {
  const res = await fetch(base64);
  return await res.blob();
};
