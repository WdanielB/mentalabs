import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { REMEMBER_COOKIE, isRemembered, withPersistence } from '../utils/supabase/session'
import { ROLE_ROUTES, normalizeRole, type AppRole } from './lib/auth/role'

// Next 16: "middleware" pasó a llamarse "proxy".
// Responsabilidades:
//  1. Refrescar el token de Supabase y devolverlo en cookies (los Server
//     Components no pueden escribir cookies).
//  2. Comprobación optimista de acceso: sin sesión → /login?next=…,
//     rol equivocado → al panel propio. La autorización real sigue en RLS.

const ROLE_PREFIXES: [string, AppRole][] = [
  ['/paciente', 'paciente'],
  ['/especialista', 'especialista'],
  ['/tutor', 'tutor'],
  ['/admin', 'admin'],
]
const AUTH_PAGES = ['/login', '/registro', '/recuperar']
const SESSION_ONLY = ['/restablecer', '/dashboard']

const matches = (pathname: string, base: string) => pathname === base || pathname.startsWith(base + '/')

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  const remember = isRemembered(request.cookies.get(REMEMBER_COOKIE)?.value)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, withPersistence(options, remember))
          )
          // Evita que un CDN cachee respuestas con cookies de sesión.
          Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v))
        },
      },
    }
  )

  // No poner código entre createServerClient y getClaims: getClaims es quien
  // refresca el token. Valida la firma del JWT (localmente con claves
  // asimétricas), así que no depende de cookies que el cliente pueda falsificar.
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  const role = normalizeRole((claims?.app_metadata as any)?.role)
  const { pathname, search } = request.nextUrl

  // Una redirección debe llevar consigo las cookies refrescadas; si no, el
  // navegador se queda con el token viejo y parece que "se sale" solo.
  const redirect = (path: string) => {
    const res = NextResponse.redirect(new URL(path, request.url))
    response.cookies.getAll().forEach((c) => res.cookies.set(c))
    return res
  }

  const required = ROLE_PREFIXES.find(([base]) => matches(pathname, base))?.[1]

  if (required || SESSION_ONLY.some((p) => matches(pathname, p))) {
    if (!claims) return redirect(`/login?next=${encodeURIComponent(pathname + search)}`)
    if (pathname === '/dashboard') return redirect(role ? ROLE_ROUTES[role] : '/login?error=sin-rol')
    if (required && role !== required) {
      return redirect(role ? ROLE_ROUTES[role] : '/login?error=sin-rol')
    }
  }

  // Con sesión válida no tiene sentido ver login/registro.
  if (claims && role && AUTH_PAGES.some((p) => matches(pathname, p))) {
    return redirect(ROLE_ROUTES[role])
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|auth/confirm|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml)$).*)',
  ],
}
