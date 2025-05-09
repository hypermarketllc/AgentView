import { createClient } from '@supabase/supabase-js';
import createSupabaseAdapter from './supabase-postgres-adapter';

// Declare window.env for TypeScript
declare global {
  interface Window {
    env?: {
      VITE_SUPABASE_URL?: string;
      VITE_SUPABASE_ANON_KEY?: string;
      USE_POSTGRES?: string;
      VITE_USE_POSTGRES?: string;
      [key: string]: string | undefined;
    };
  }
}

// Try to get environment variables from window.env first (for production)
// Fall back to import.meta.env (for development)
const getEnv = (key: string): string | undefined => {
  if (typeof window !== 'undefined' && window.env && window.env[key]) {
    return window.env[key];
  }
  // @ts-ignore - import.meta.env is provided by Vite
  return import.meta.env[key];
};

// Check if we're using PostgreSQL
const usePostgres = getEnv('USE_POSTGRES') === 'true' || getEnv('VITE_USE_POSTGRES') === 'true';

// Determine which client to use
let supabase;

// If using PostgreSQL, create a compatibility layer
if (usePostgres) {
  console.log('Using PostgreSQL instead of Supabase');
  supabase = createSupabaseAdapter();
} else {
  // Use actual Supabase client
  const supabaseUrl = getEnv('VITE_SUPABASE_URL') || '';
  const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
