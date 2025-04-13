import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "./mongodb-client";
import dbConnect from "./mongodb";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Extend the Session type to include userId
declare module "next-auth" {
  interface Session {
    userId?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    userEmail?: string;
  }
}

export const authOptions: NextAuthOptions = {
  // @ts-expect-error - Type mismatch between next-auth and @auth/mongodb-adapter
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await dbConnect();
        const users = mongoose.connection.collection("users");

        // Find user by email
        const user = await users.findOne({ email: credentials.email });

        // No user found
        if (!user) {
          return null;
        }

        // Check if user has password (might be a Google-only user)
        if (!user.password) {
          return null;
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        // Update last login
        await users.updateOne(
          { _id: user._id },
          { $set: { lastLoginAt: new Date() } }
        );

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name || user.email.split("@")[0],
          image: user.image || null,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        token.id = user.id;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        // Make sure ID is available in multiple formats for compatibility
        session.user.id = (token.id as string) || token.sub!;
        session.userId = (token.id as string) || token.sub!;

        // Store the email in the session as well as a fallback ID
        if (session.user.email) {
          session.userEmail = session.user.email;
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Check if we have a saved callback URL in localStorage
      // (This won't work on server side, but will help with client side redirects)
      if (typeof window !== "undefined") {
        const savedCallbackUrl = localStorage.getItem("authCallbackUrl");
        if (savedCallbackUrl) {
          localStorage.removeItem("authCallbackUrl");
          return `${baseUrl}${savedCallbackUrl}`;
        }
      }

      // Check if this is a callback from an OAuth provider
      if (url.startsWith(baseUrl)) {
        // Look for intended subscription in session storage
        const intendedSubscription =
          typeof window !== "undefined"
            ? sessionStorage.getItem("intendedSubscription")
            : null;

        if (intendedSubscription) {
          return `${baseUrl}/subscription`;
        }

        // Default redirect to homepage
        return baseUrl;
      }

      // Allow relative URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allow returning to the same site
      if (new URL(url).origin === baseUrl) return url;

      return baseUrl;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await dbConnect();
          const users = mongoose.connection.collection("users");

          // Check if user exists
          const dbUser = await users.findOne({ email: user.email });

          // If not, create a new user with the original structure
          if (!dbUser) {
            const newUser = {
              email: user.email,
              name: user.name,
              image: user.image,
              auth: {
                provider: "google",
                providerId: user.id,
              },
              subscription: {
                tier: "free",
                startDate: new Date(),
                isYearly: false,
                aiCreditsTotal: 3,
                aiCreditsRemaining: 3,
                autoRenew: true,
                lastRenewalDate: new Date(),
                nextRenewalDate: new Date(
                  new Date().setMonth(new Date().getMonth() + 1)
                ),
              },
              createdAt: new Date(),
              updatedAt: new Date(),
              lastLoginAt: new Date(),
              books: [],
            };

            await users.insertOne(newUser);
            console.log("Created new user:", user.email);
          }
          // If user exists but doesn't have providerId, update it
          else if (!dbUser.auth?.providerId) {
            await users.updateOne(
              { _id: dbUser._id },
              {
                $set: {
                  auth: {
                    ...dbUser.auth,
                    provider: "google",
                    providerId: user.id,
                  },
                  lastLoginAt: new Date(),
                },
              }
            );
          }
          // Update last login time
          else {
            await users.updateOne(
              { _id: dbUser._id },
              { $set: { lastLoginAt: new Date() } }
            );
          }
        } catch (error) {
          console.error("Error during Google sign in:", error);
          return false;
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/",
    signOut: "/",
    error: "/",
    verifyRequest: "/",
    newUser: "/",
  },
  secret: process.env.AUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
