import { createServerClient, type CookieOptions } from '@supabase/auth-helpers-nextjs'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // www -> apex redirects are handled by Vercel domain settings, not middleware.
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Refresh session if expired — required for Server Components
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  // Redirect unauthenticated users away from protected routes
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/generator') ||
    pathname.startsWith('/library')

  if (isProtected && !session) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth pages
  const isAuthPage =
    pathname.startsWith('/auth/login') ||
    pathname.startsWith('/auth/signup')

  if (isAuthPage && session) {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/dashboard'
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  // Enforce trial setup: authenticated users with no active subscription must
  // complete checkout before accessing any dashboard route.
  if (session && isProtected && !pathname.startsWith('/trial-setup')) {
    const { data: profile } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('id', session.user.id)
      .single()

    const status = profile?.subscription_status
    const hasActiveAccess =
      status === 'trialing' || status === 'pro'

    // Cancelled/expired users can still view library (read-only), blocked elsewhere
    const isLibraryRoute = pathname.startsWith('/dashboard/saved') || pathname.startsWith('/dashboard/shared-resources')
    const blockedStatus = status === 'cancelled' || status === 'expired'

    if (!hasActiveAccess && !isLibraryRoute) {
      if (!status || status === 'free') {
        // New user or legacy free user — needs to set up trial
        return NextResponse.redirect(new URL('/trial-setup', request.url))
      }
      if (blockedStatus) {
        return NextResponse.redirect(new URL('/trial-setup', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets
     * - API routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
