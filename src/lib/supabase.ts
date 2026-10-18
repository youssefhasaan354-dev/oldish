import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl.startsWith('https://') &&
    supabaseAnonKey.length > 20
  );
};

let _client: SupabaseClient | null = null;
let _clientPromise: Promise<SupabaseClient | null> | null = null;

export const getSupabase = async (): Promise<SupabaseClient | null> => {
  if (!isSupabaseConfigured()) return null;
  if (_client) return _client;
  if (!_clientPromise) {
    _clientPromise = import('@supabase/supabase-js').then(({ createClient }) => {
      _client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      return _client;
    });
  }
  return _clientPromise;
};

// Fallback proxy to prevent any accidental crash if accessed synchronously
export const supabase: any = new Proxy({} as any, {
  get(_target, prop) {
    if (_client) return (_client as any)[prop];
    return () => {
      console.warn(`Supabase accessed synchronously via property "${String(prop)}" before configuration.`);
      return null;
    };
  }
});
