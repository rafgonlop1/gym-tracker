import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '~/types/database.types'

export function createSupabaseClient() {
  if (typeof window === 'undefined') {
    throw new Error('createSupabaseClient is only available in the browser runtime');
  }

  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.ENV || {};

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase environment variables are missing. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are defined.');
  }

  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}
