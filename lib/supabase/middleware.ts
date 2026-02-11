import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Updates the Supabase session in middleware.
 * This function refreshes the user's session and ensures cookies are properly set.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment variable.
  // Always create a new one on each request.
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
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Do not run code between createServerClient and supabase.auth.getUser().
  // A simple mistake could make it very hard to debug issues with users being randomly logged out.

  // IMPORTANT: If you remove getUser() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  const pathname = request.nextUrl.pathname

  // 定义公开路由（无需认证）
  const publicRoutes = [
    '/',
    '/home',
    '/auth/login',
    '/auth/sign-up',
    '/auth/callback',
    '/auth/verify-email',
    '/auth/reset-password',
    '/auth/update-password',
    '/auth/admin-login',
    '/auth/error',
  ]

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  )

  // 静态资源和公开路由直接放行
  if (
    isPublicRoute ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return supabaseResponse
  }

  // 未登录用户访问受保护路由，跳转到登录页
  if (!user && (pathname.startsWith('/wd') || pathname.startsWith('/rw') || pathname.startsWith('/glht'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
