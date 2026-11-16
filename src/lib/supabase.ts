import { createClient } from '@supabase/supabase-js';

// Supabase Project Credentials configured from user input
export const SUPABASE_PROJECT_REF = 'muimcnkuovmhdqnakozr';
export const SUPABASE_URL = 'https://muimcnkuovmhdqnakozr.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_D4OcWwhk8IY68nBlnhmHvA_NqUsLHiP';
export const SUPABASE_DASHBOARD_URL = 'https://supabase.com/dashboard/project/muimcnkuovmhdqnakozr';

// Create and export the singleton Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
});

// Helper to test if connection to Supabase is active
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  tablesFound?: string[];
  missingTables?: string[];
}> {
  try {
    const requiredTables = [
      'users',
      'equipment',
      'work_orders',
      'parts_inventory',
      'maintenance_reports',
      'maintenance_checklists',
      'notifications',
      'audit_logs',
    ];

    const found: string[] = [];
    const missing: string[] = [];

    for (const table of requiredTables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error && error.code === 'PGRST205') {
        missing.push(table);
      } else {
        found.push(table);
      }
    }

    if (missing.length === 0) {
      return {
        connected: true,
        message: 'Connected to Supabase. All application tables verified.',
        tablesFound: found,
      };
    } else if (found.length > 0) {
      return {
        connected: true,
        message: `Connected to Supabase. ${found.length} tables found, ${missing.length} tables require setup.`,
        tablesFound: found,
        missingTables: missing,
      };
    } else {
      return {
        connected: true,
        message: 'Connected to Supabase endpoint, but tables have not been created yet in the SQL Editor.',
        missingTables: missing,
      };
    }
  } catch (err: any) {
    return {
      connected: false,
      message: err.message || 'Failed to reach Supabase project.',
    };
  }
}
