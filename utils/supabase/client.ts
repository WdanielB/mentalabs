import { createBrowserClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'
import { REMEMBER_COOKIE, isRemembered, withPersistence } from './session'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Algunas páginas cliente crean el cliente durante el prerender en servidor,
        // donde no existe document: ahí no hay sesión que leer ni escribir.
        getAll() {
          if (typeof document === 'undefined') return []
          return parseCookieHeader(document.cookie).map(({ name, value }) => ({ name, value: value ?? '' }))
        },
        setAll(cookiesToSet) {
          if (typeof document === 'undefined') return
          const remember = isRemembered(
            parseCookieHeader(document.cookie).find((c) => c.name === REMEMBER_COOKIE)?.value
          )
          cookiesToSet.forEach(({ name, value, options }) => {
            document.cookie = serializeCookieHeader(name, value, withPersistence(options, remember) ?? {})
          })
        },
      },
    }
  )
}
