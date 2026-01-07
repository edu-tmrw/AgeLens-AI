// Utilitário para ler variáveis de ambiente de forma segura em diferentes ambientes (Vite, CRA, Next.js)
export const getEnvVar = (key: string): string => {
  // 1. Tenta Vite (import.meta.env)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      const val = import.meta.env[key] || import.meta.env[`VITE_${key}`];
      if (val) return val;
    }
  } catch (e) {
    // Ignora erros
  }

  // 2. Tenta Node/Webpack/CRA (process.env)
  try {
    if (typeof process !== 'undefined' && process.env) {
      const val = process.env[key] || process.env[`REACT_APP_${key}`] || process.env[`NEXT_PUBLIC_${key}`];
      if (val) return val;
    }
  } catch (e) {
    // Ignora erros
  }

  return '';
};