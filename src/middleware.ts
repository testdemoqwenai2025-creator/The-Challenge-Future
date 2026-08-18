// NEXUS Authentication Middleware
// Protects routes based on authentication status and user role/plan

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
  function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Allow access to public routes
    const publicRoutes = ["/", "/about", "/pricing", "/docs"];
    if (publicRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    // Dashboard and authenticated routes
    if (pathname.startsWith("/dashboard")) {
      if (!token) {
        // Redirect to login if not authenticated
        const loginUrl = new URL("/", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Check plan-based access for premium features
      const premiumRoutes = [
        "/dashboard/auto-fill",
        "/dashboard/api-access",
        "/dashboard/team",
        "/dashboard/export",
      ];

      if (premiumRoutes.some((route) => pathname.startsWith(route))) {
        const userPlan = (token as any).plan || "explorer";
        const allowedPlans = ["pro", "team", "enterprise"];

        if (!allowedPlans.includes(userPlan)) {
          return NextResponse.redirect(new URL("/dashboard/upgrade", req.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public routes don't require authentication
        const publicPaths = ["/", "/about", "/pricing", "/docs", "/api/auth"];
        if (publicPaths.some((path) => pathname.startsWith(path))) {
          return true;
        }

        // All other routes require authentication
        return !!token;
      },
    },
    pages: {
      signIn: "/",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (robots.txt, logo.svg, etc.)
     * - API routes that are public
     */
    "/((?!_next/static|_next/image|favicon.ico|logo.svg|robots.txt|api/public).*)",
  ],
};
