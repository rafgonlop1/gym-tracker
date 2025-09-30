import { createServerClient, parse, serialize } from '@supabase/ssr'
import type { Database } from '~/types/database.types'

export function createSupabaseServerClient(request: Request, env?: { SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string }) {
  const cookies = parse(request.headers.get('Cookie') ?? '')
  const headers = new Headers()
  const fallbackEnv = typeof process !== 'undefined' ? process.env : undefined

  const supabase = createServerClient<Database>(
    env?.SUPABASE_URL || fallbackEnv?.VITE_SUPABASE_URL!,
    env?.SUPABASE_ANON_KEY || fallbackEnv?.VITE_SUPABASE_ANON_KEY!,
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
