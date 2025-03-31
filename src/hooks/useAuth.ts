"use client";

import {
  useSession,
  signIn,
  signOut as nextAuthSignOut,
} from "next-auth/react";
import { useEffect, useState } from "react";

export function useAuth() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Update loading state based on session status
    if (status === "loading") {
      setLoading(true);
    } else {
      setLoading(false);
    }

    // Reset error when session changes
    setError(null);
  }, [session, status]);

  const user = session?.user;

  // Create a wrapper for signOut that can handle parameters or no parameters
  const handleSignOut = async (
    options?: Parameters<typeof nextAuthSignOut>[0]
  ) => {
    // Set the callbackUrl to the home page (landing page) instead of the login page
    return await nextAuthSignOut({
      ...options,
      callbackUrl: "/",
    });
  };

  return {
    user,
    loading,
    error,
    setError,
    signIn,
    signOut: handleSignOut,
    isAuthenticated: !!user,
    sessionStatus: status,
  };
}
