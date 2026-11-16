import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://muimcnkuovmhdqnakozr.supabase.co';
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_D4OcWwhk8IY68nBlnhmHvA_NqUsLHiP';
export const SUPABASE_PROJECT_REF = 'muimcnkuovmhdqnakozr';

export const supabaseServer = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Helper to check if a table exists in Supabase
export async function checkSupabaseTable(tableName: string): Promise<boolean> {
  try {
    const { error } = await supabaseServer.from(tableName).select('id').limit(1);
    if (error && error.code === 'PGRST205') {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
