import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '~/types/database.types'

export function createSupabaseClient() {
  return createBrowserClient<Database>(
    window.ENV.SUPABASE_URL!,
    window.ENV.SUPABASE_ANON_KEY!
  )
}