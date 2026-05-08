import { createServerClient, type CookieOptions } from '@supabase/auth-helpers-nextjs'
import { NextResponse, type NextRequest } from 'next/server'
import { FREE_TRIAL_CUTOFF } from '@/lib/constants'

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

  // Enforce trial setup for new users only. Legacy users (signed up before
  // FREE_TRIAL_CUTOFF) keep the old free-generation system and are never
  // redirected to /trial-setup — the API routes enforce their per-tool limits.
  if (session && isProtected && !pathname.startsWith('/trial-setup')) {
    const { data: profile } = await supabase
      .from('users')
      .select('subscription_status, created_at')
      .eq('id', session.user.id)
      .single()

    const status = profile?.subscription_status
    const isLegacyUser = !!profile?.created_at && new Date(profile.created_at) < FREE_TRIAL_CUTOFF
    const hasActiveAccess = status === 'trialing' || status === 'pro'

    // Legacy users always pass through — their limits are enforced at the API level
    if (!isLegacyUser && !hasActiveAccess) {
      // /onboarding is the post-payment landing page — exempting it avoids
      // a race condition where the Stripe webhook hasn't updated
      // subscription_status before the user is redirected back from Stripe.
      const isExemptRoute =
        pathname.startsWith('/dashboard/saved') ||
        pathname.startsWith('/dashboard/shared-resources') ||
        pathname.startsWith('/onboarding')
      if (!isExemptRoute) {
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
