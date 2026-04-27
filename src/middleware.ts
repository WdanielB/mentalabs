import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Always call getUser() so the middleware can refresh tokens into the response cookies.
  const { data: { user }, error } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const protectedPaths = ['/paciente', '/especialista', '/tutor', '/admin']
  const isProtected = protectedPaths.some(p => pathname === p || pathname.startsWith(p + '/'))

  if (isProtected && !user) {
    // If there are valid session cookies but getUser() failed transiently (network hiccup,
    // token mid-refresh), let the request through. The client-side guard will revalidate.
    // Only hard-redirect when there are no session cookies at all.
    const hasSessionCookies = request.cookies
      .getAll()
      .some((c) => c.name.startsWith('sb-'))

    if (hasSessionCookies) {
      return supabaseResponse
    }

    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
