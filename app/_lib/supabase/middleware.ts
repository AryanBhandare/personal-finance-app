import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

const AUTH_PAGES = ["/login", "/signup"];

// Refreshes the session cookie on every request and redirects based on
// whether the user is signed in.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers ?? {}).forEach(([key, value]) =>
          response.headers.set(key, value),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const onAuthPage = AUTH_PAGES.some((p) => path.startsWith(p));

  if (!user && !onAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (user && onAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}
