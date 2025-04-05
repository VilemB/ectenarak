"use client";

import {
  useSession,
  signIn,
  signOut as nextAuthSignOut,
} from "next-auth/react";
import { useEffect, useState, useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

export function useAuth() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const authContext = useContext(AuthContext);

  useEffect(() => {
    // Update loading state based on session status
    if (status === "loading") {
      setLoading(true);
    } else {
      setLoading(false);
    }

    // If we have a session but no user in our context, update the context
    if (session?.user && !authContext?.user) {
      authContext?.setUser({
        id: session.user.id,
        email: session.user.email || "",
        name: session.user.name || session.user.email?.split("@")[0] || "",
        subscription: {
          tier: "free",
          startDate: new Date(),
          isYearly: false,
          aiCreditsRemaining: 3,
          aiCreditsTotal: 3,
          autoRenew: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }, [session, status, authContext]);

  // Create a wrapper for signOut that can handle parameters or no parameters
  const handleSignOut = async (
    options?: Parameters<typeof nextAuthSignOut>[0]
  ) => {
    // Clear our auth context first
    await authContext?.logout();
    // Then sign out of NextAuth
    return await nextAuthSignOut({
      ...options,
      callbackUrl: "/",
    });
  };

  // Use our auth context user if available, otherwise fall back to session user
  const user =
    authContext?.user ||
    (session?.user
      ? {
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.name || session.user.email?.split("@")[0] || "",
          subscription: {
            tier: "free",
            startDate: new Date(),
            isYearly: false,
            aiCreditsRemaining: 3,
            aiCreditsTotal: 3,
            autoRenew: false,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      : null);

  return {
    user,
    loading: loading || authContext?.isLoading,
    signIn,
    signOut: handleSignOut,
    isAuthenticated: !!user,
    sessionStatus: status,
    // Include any additional methods from our auth context
    ...authContext,
  };
}
