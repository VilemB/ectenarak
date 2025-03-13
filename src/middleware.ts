import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // Log the request URL for debugging
  console.log(`Middleware processing: ${request.nextUrl.pathname}`);

  // Only protect specific routes
  const protectedRoutes = ["/settings", "/api/user/delete", "/subscription"];
  const isProtectedRoute = protectedRoutes.some(
    (route) =>
      request.nextUrl.pathname === route ||
      request.nextUrl.pathname.startsWith(route)
  );

  // If it's not a protected route, allow access
  if (!isProtectedRoute) {
    console.log("Not a protected route, allowing access");
    return NextResponse.next();
  }

  // For protected routes, check authentication
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Log token status for debugging
  console.log(`Token exists: ${!!token}`, token);

  // If not authenticated and trying to access a protected route
  if (!token) {
    console.log(
      `Redirecting from ${request.nextUrl.pathname} to login (not authenticated)`
    );
    // Redirect to the login page with the original path as redirect parameter
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // User is authenticated, allow access to protected route
  console.log("User is authenticated, allowing access to protected route");
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (API routes for authentication)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
