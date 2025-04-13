import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "./mongodb-client";
import dbConnect from "./mongodb";
import mongoose from "mongoose";

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
    signIn: "/signin",
  },
  secret: process.env.AUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
