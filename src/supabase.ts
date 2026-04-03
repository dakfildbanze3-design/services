import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

let supabase: any;

try {
  supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  // Fallback to a dummy client or let the app handle the error
  supabase = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => {},
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }), order: () => ({ data: [], error: null }), limit: () => ({ data: [], error: null }) }) }),
      insert: async () => ({ data: null, error: null }),
      update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }) }),
      delete: () => ({ eq: () => ({ eq: async () => ({ data: null, error: null }) }) }),
    }),
  };
}

export { supabase };
