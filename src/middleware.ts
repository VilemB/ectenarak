import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Define the path to your login page
const LOGIN_PAGE_PATH = "/login";

// Define protected routes, separating frontend pages and API endpoints
const protectedFrontendRoutes = [
  "/settings",
  "/subscription",
  // Add other user-specific frontend pages here if needed
];

const protectedApiRoutes = [
  "/api/user", // Protect user-related actions like delete
  "/api/subscription", // Protect subscription management
  "/api/books", // Protect all book-related actions (list, create, get one, update, delete)
  "/api/generate-summary", // Protect AI summary generation
  "/api/generate-author-summary", // Protect AI author summary generation
  "/api/use-credit", // Protect credit usage endpoint
  // Add other sensitive API routes here
];

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`Middleware processing: ${pathname}`);

  // Check if the route is protected
  const isProtectedFrontendRoute = protectedFrontendRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isProtectedApiRoute = protectedApiRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // If it's not a protected route, allow the request to proceed
  if (!isProtectedFrontendRoute && !isProtectedApiRoute) {
    console.log(`Route ${pathname} is not protected.`);
    return NextResponse.next();
  }

  // Check for authentication token
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  // If user is not authenticated
  if (!token) {
    console.log(`User not authenticated for protected route: ${pathname}`);

    if (isProtectedApiRoute) {
      // For protected API routes, return 401 Unauthorized
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    if (isProtectedFrontendRoute) {
      // For protected frontend routes, redirect to the login page
      // Include the original requested page as a callback URL for redirection after login
      const loginUrl = new URL(LOGIN_PAGE_PATH, request.url);
      loginUrl.searchParams.set("callbackUrl", request.nextUrl.href);
      console.log(`Redirecting to login: ${loginUrl.toString()}`);
      return NextResponse.redirect(loginUrl);
    }

    // Fallback if route type isn't handled (should not happen with current logic)
    return NextResponse.next();
  }

  // User is authenticated, allow access to the protected route
  console.log(`User authenticated, allowing access to: ${pathname}`);
  return NextResponse.next();
}

// Updated matcher configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (API routes for NextAuth authentication itself)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - login (the login page itself to avoid redirect loops)
     * - And common public assets/files
     */
    "/((?!api/auth|_next/static|_next/image|login|favicon.ico|manifest.json|robots.txt|sitemap.xml|og-image.jpg|browserconfig.xml|.*\.png$|.*\.svg$).*)",
  ],
};
