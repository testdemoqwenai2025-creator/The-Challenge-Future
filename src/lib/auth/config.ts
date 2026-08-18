import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { UserRole, UserPlan } from "@/lib/auth/types";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  providers: [
    // Credentials provider (email/password)
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        // Find user by email
        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        // If no user found with this email
        if (!user || !user.password) {
          // For demo purposes - auto-create user on first login
          // In production, you'd want proper signup flow
          const hashedPassword = await bcrypt.hash(credentials.password, 12);
          
          const newUser = await db.user.create({
            data: {
              email: credentials.email,
              name: credentials.email.split("@")[0],
              password: hashedPassword,
              role: UserRole.FOUNDER,
              plan: UserPlan.EXPLORER,
            },
          });

          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
            plan: newUser.plan,
          };
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          plan: user.plan,
          organization: user.organization ?? undefined,
        };
      },
    }),
    
    // Google OAuth (enabled if credentials present)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    // GitHub OAuth (enabled if credentials present)
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || UserRole.FOUNDER;
        token.plan = (user as any).plan || UserPlan.EXPLORER;
        token.organization = (user as any).organization;
      }

      // Handle session update (e.g., plan upgrade)
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).plan = token.plan;
        (session.user as any).organization = token.organization;
      }
      return session;
    },
    async signIn({ user, account }) {
      // Allow all sign-ins for now
      // You can add custom logic here (e.g., only allow certain domains)
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      // Log new user creation or send welcome email
      console.log(`New user created: ${user.email}`);
    },
  },
  debug: process.env.NODE_ENV === "development",
};

// Helper function to get server-side session
export async function getServerSession() {
  const { getServerSession: getNextAuthSession } = await import("next-auth");
  return getNextAuthSession(authOptions);
}
