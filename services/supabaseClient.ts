import { createClient } from '@supabase/supabase-js';
import { getEnvVar } from './env';

// Tenta pegar das variáveis de ambiente.
const supabaseUrl = getEnvVar('SUPABASE_URL');
const supabaseKey = getEnvVar('SUPABASE_KEY');

// Flag para saber se estamos usando credenciais reais
// Consideramos configurado apenas se ambas as variáveis existirem e não forem vazias
export const isSupabaseConfigured = !!supabaseUrl && !!supabaseKey && supabaseUrl !== 'undefined' && supabaseKey !== 'undefined';

// --- MOCK CLIENT IMPLEMENTATION ---
// Used when real Supabase credentials are not provided. 
// Allows the app to work in a "Demo Mode" without crashing.

const createMockClient = () => {
  console.warn("⚠️ AgeLens AI: Credenciais do Supabase não encontradas. Usando cliente Mock em memória.");
  console.warn("⚠️ Os dados serão perdidos ao recarregar a página.");

  // Shared in-memory storage (Table -> Array of objects)
  const mockTables: Record<string, any[]> = {
    generations: [],
    profiles: []
  }; 
  
  let mockSession: any = null;
  const mockListeners: any[] = [];
  const mockStorage: Record<string, string> = {}; // Path -> Blob URL map

  return {
    auth: {
      getSession: async () => ({ data: { session: mockSession }, error: null }),
      
      signInWithPassword: async ({ email }: any) => {
        // Simulate successful login
        mockSession = { 
          user: { 
            id: 'mock-user-id', 
            email, 
            user_metadata: { full_name: email.split('@')[0], avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}` } 
          }, 
          access_token: 'mock-access-token' 
        };
        mockListeners.forEach(cb => cb('SIGNED_IN', mockSession));
        return { data: { user: mockSession.user, session: mockSession }, error: null };
      },

      signUp: async ({ email, options }: any) => {
        // Simulate successful registration
        mockSession = { 
          user: { 
            id: 'mock-user-id', 
            email, 
            user_metadata: options?.data 
          }, 
          access_token: 'mock-access-token' 
        };
        mockListeners.forEach(cb => cb('SIGNED_IN', mockSession));
        return { data: { user: mockSession.user, session: mockSession }, error: null };
      },

      signOut: async () => {
        mockSession = null;
        mockListeners.forEach(cb => cb('SIGNED_OUT', null));
        return { error: null };
      },

      onAuthStateChange: (callback: any) => {
        mockListeners.push(callback);
        // Trigger immediately with current session
        callback(mockSession ? 'SIGNED_IN' : 'SIGNED_OUT', mockSession);
        return { data: { subscription: { unsubscribe: () => { 
            const idx = mockListeners.indexOf(callback);
            if (idx > -1) mockListeners.splice(idx, 1);
        } } } };
      }
    },
    
    // Mock Database Query Builder
    from: (table: string) => {
      // Ensure table exists
      if (!mockTables[table]) mockTables[table] = [];
      
      // State for the query builder
      let currentData = [...mockTables[table]]; // Clone data for querying
      let operation = 'select'; // 'select' | 'delete'
      let deleteFilter: ((row: any) => boolean) | null = null;

      const builder = {
        select: function() { 
          operation = 'select';
          return this; 
        },
        
        delete: function() {
          operation = 'delete';
          return this;
        },

        eq: function(column: string, value: any) {
          if (operation === 'delete') {
            // For delete, we store the filter condition
            deleteFilter = (row: any) => row[column] === value;
          } else {
            // For select, we filter the dataset immediately
            currentData = currentData.filter(item => item[column] === value);
          }
          return this;
        },

        order: function(column: string, { ascending = true } = {}) {
          if (operation === 'select') {
            currentData.sort((a, b) => {
              if (a[column] < b[column]) return ascending ? -1 : 1;
              if (a[column] > b[column]) return ascending ? 1 : -1;
              return 0;
            });
          }
          return this;
        },

        insert: function(row: any) {
          // Insert works differently, it executes immediately in this mock pattern for simplicity,
          // matching the .select().single() pattern often used.
          const newItem = { 
            ...row, 
            id: Math.random().toString(36).substring(7), 
            created_at: new Date().toISOString() 
          };
          mockTables[table].push(newItem);
          
          return { 
            select: () => ({
              single: () => Promise.resolve({ data: newItem, error: null })
            })
          };
        },

        // Enables 'await' keyword usage
        then: function(resolve: Function, reject: Function) {
          if (operation === 'delete') {
            const initialLength = mockTables[table].length;
            if (deleteFilter) {
               mockTables[table] = mockTables[table].filter(row => !deleteFilter!(row));
            }
            resolve({ error: null, count: initialLength - mockTables[table].length });
          } else {
            // Select
            resolve({ data: currentData, error: null });
          }
        }
      };

      return builder;
    },

    // Mock Storage
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, blob: Blob) => {
          // Store Blob as Object URL to allow displaying images in current session
          const blobUrl = URL.createObjectURL(blob);
          mockStorage[path] = blobUrl;
          return { data: { path }, error: null };
        },
        getPublicUrl: (path: string) => {
          // Return the local Blob URL we stored
          return { data: { publicUrl: mockStorage[path] || `https://mock.storage/${path}` } };
        },
        remove: async (paths: string[]) => {
          paths.forEach(p => delete mockStorage[p]);
          return { error: null };
        }
      })
    }
  } as any;
};

// Export either real client or mock client based on config
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseKey) 
  : createMockClient();

// Utilitário para converter Base64 em Blob para upload
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