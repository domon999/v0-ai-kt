import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // 定义公开路由（无需认证）
  const publicRoutes = [
    "/",
    "/home",
    "/auth/login",
    "/auth/sign-up",
    "/auth/callback",
    "/auth/verify-email",
    "/auth/reset-password",
    "/auth/admin-login",
  ]

  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))

  // 公开路由和静态资源直接放行
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // 创建 Supabase 客户端
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("[v0] Missing Supabase credentials")
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  try {
    // 获取用户信息
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // 未登录用户访问受保护路由，跳转到登录页
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      url.searchParams.set("redirect", pathname)
      return NextResponse.redirect(url)
    }

    // 检查是否访问管理后台
    if (pathname.startsWith("/glht")) {
      // 获取用户的 profile 信息以检查 is_admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single()

      // 非管理员访问管理后台，跳转到管理员登录页
      if (!profile?.is_admin) {
        const url = request.nextUrl.clone()
        url.pathname = "/auth/admin-login"
        return NextResponse.redirect(url)
      }
    }

    // 已登录用户访问认证页面，根据角色跳转
    if (pathname.startsWith("/auth/login") || pathname.startsWith("/auth/sign-up")) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single()

      const url = request.nextUrl.clone()
      // 管理员跳转到管理后台，普通用户跳转到个人中心
      url.pathname = profile?.is_admin ? "/glht/ybp" : "/wd"
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    console.error("[v0] Middleware auth error:", error)
    // 认证失败，清除会话并跳转到登录页
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (网站图标)
     * - 图片文件 (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
