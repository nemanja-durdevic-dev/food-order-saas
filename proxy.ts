import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.pathname;
  const role = user?.app_metadata?.role;

  // Staff only on /staff routes
  if (role === "staff") {
    if (url.startsWith("/staff")) {
      if (url === "/staff/login") {
        return NextResponse.redirect(new URL("/staff/orders", request.url));
      }
      return supabaseResponse;
    }
    return NextResponse.redirect(new URL("/staff/orders", request.url));
  }

  // Not staff — protect staff routes from unauthenticated access.
  // /admin handles owner authentication and membership checks on the page.
  if (url.startsWith("/staff") && url !== "/staff/login") {
    return NextResponse.redirect(new URL("/staff/login", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/staff", "/staff/:path*", "/admin/:path*", "/order", "/order/:path*", "/orders"],
};
