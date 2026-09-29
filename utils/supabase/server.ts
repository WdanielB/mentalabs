import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { REMEMBER_COOKIE, isRemembered, withPersistence } from './session'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          const remember = isRemembered(cookieStore.get(REMEMBER_COOKIE)?.value)
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, withPersistence(options, remember))
            )
          } catch {
            // Server Component — cookies can't be set here, the proxy handles refresh
          }
        },
      },
    }
  )
}
