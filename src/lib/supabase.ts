import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | any;

if (supabaseUrl && supabaseAnonKey) {
  // Real client – use provided credentials
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // ---- Mock implementation ---------------------------------------------------
  const mockAuth = {
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      if (email && password) {
        return { data: { user: { email } }, error: null };
      }
      return { data: null, error: { message: 'Mock auth error', name: 'Error' } };
    },
    async signUp({ email, password }: { email: string; password: string }) {
      if (email && password) {
        return { data: { user: { email } }, error: null };
      }
      return { data: null, error: { message: 'Mock signup error', name: 'Error' } };
    },
    async signOut() {
      return { error: null };
    },
  };

  const mockDb = {
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: [], error: null }),
      update: () => ({ data: [], error: null }),
      delete: () => ({ data: [], error: null }),
    }),
  };

  supabase = { auth: mockAuth, ...mockDb };
}

export { supabase };
