"use client";

import {
  useSession,
  signIn,
  signOut as nextAuthSignOut,
} from "next-auth/react";
import { useEffect, useState, useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

export function useAuth() {
  const { status } = useSession();
  const authContext = useContext(AuthContext);

  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    if (status === "loading" || authContext?.isLoading) {
      setLocalLoading(true);
    } else {
      setLocalLoading(false);
    }
  }, [status, authContext?.isLoading]);

  const handleSignOut = async (
    options?: Parameters<typeof nextAuthSignOut>[0]
  ) => {
    if (authContext?.logout) {
      await authContext.logout();
    }
    return await nextAuthSignOut({
      ...options,
      callbackUrl: "/",
    });
  };

  const user = authContext?.user || null;

  return {
    user: user,
    loading: authContext?.isLoading ?? localLoading,
    isAuthenticated:
      authContext?.isAuthenticated ?? (status === "authenticated" && !!user),
    signIn,
    signOut: handleSignOut,
    sessionStatus: status,
    login: authContext?.login,
    logout: authContext?.logout,
    signup: authContext?.signup,
    refreshCurrentUser: authContext?.refreshCurrentUser,
    useAiCredit: authContext?.useAiCredit,
  };
}
