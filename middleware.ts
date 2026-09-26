import { NextResponse, NextRequest } from "next/server";
import { parse } from "cookie";

export function middleware(request: NextRequest) {
  // Parse cookies from the request header
  const cookies = parse(request.headers.get("cookie") || "");
  const currentUser = cookies.user ? JSON.parse(cookies.user) : null;

  const url = request.nextUrl;

  // If the user is authenticated and tries to access login or signup pages, redirect to home
  if (
    currentUser &&
    (url.pathname.startsWith("/login") || url.pathname.startsWith("/signup"))
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If the user is not authenticated and tries to access protected routes, redirect to login
  const protectedPaths = [
    "/transactions",
    "/pots",
    "/settings",
    "/recurring_bills",
    "/",
    "/budgets",
  ]; // Add any protected paths
  if (
    !currentUser &&
    protectedPaths.some((path) => url.pathname.startsWith(path))
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If no conditions match, allow the request to continue
  return NextResponse.next();
}

// Configure the middleware to match specific routes
export const config = {
  matcher: [
    "/transactions",
    "/pots",
    "/settings",
    "/recurring_bills",
    "/",
    "/budgets",
  ], // Add more protected routes here
};
