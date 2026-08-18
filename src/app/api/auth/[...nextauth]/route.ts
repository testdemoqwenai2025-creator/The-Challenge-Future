// NextAuth.js API Route Handler
// Note: This route is disabled for static export (GitHub Pages preview)
// It will only work in server mode (Vercel, standalone server)

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/config";

const handler = NextAuth(authOptions);

// Dynamic route - only works in server mode
// For static export, this file is ignored
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export { handler as GET, handler as POST };
