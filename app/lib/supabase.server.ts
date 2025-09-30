import { createServerClient, parse, serialize } from '@supabase/ssr'
import type { Database } from '~/types/database.types'

export function createSupabaseServerClient(request: Request, env?: { SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string }) {
  const cookies = parse(request.headers.get('Cookie') ?? '')
  const headers = new Headers()
  const fallbackEnv = typeof process !== 'undefined' ? process.env : undefined
  const supabaseUrl = env?.SUPABASE_URL || fallbackEnv?.VITE_SUPABASE_URL
  const supabaseAnonKey = env?.SUPABASE_ANON_KEY || fallbackEnv?.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are missing on the server runtime. Set SUPABASE_URL and SUPABASE_ANON_KEY (or VITE_* equivalents).');
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(key) {
          return cookies[key]
        },
        set(key, value, options) {
          headers.append('Set-Cookie', serialize(key, value, options))
        },
        remove(key, options) {
          headers.append('Set-Cookie', serialize(key, '', options))
        },
      },
    }
  )

  return { supabase, headers }
}
