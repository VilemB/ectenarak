"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
} from "react";
// SubscriptionTier, UserSubscription might be needed if updateSubscription is re-implemented
// import { User, SubscriptionTier, UserSubscription } from "@/types/user";
import { User } from "@/types/user"; // Assuming User type matches NextAuth session user
import {
  useSession,
  signIn,
  signOut as nextAuthSignOut,
} from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null; // User type from your app, ensure it aligns with NextAuth session.user
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<void>; // Credentials login
  logout: () => Promise<void>;
  signup: (email: string, password?: string, name?: string) => Promise<void>; // Credentials signup
  // updateSubscription: (tier: SubscriptionTier, isYearly: boolean) => Promise<void>; // This needs careful thought with NextAuth
  useAiCredit: () => Promise<boolean>; // Keep if it calls a separate API and updates local state correctly
  refreshCurrentUser: () => Promise<void>; // Will now use NextAuth's session update
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export { AuthContext };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { data: session, status, update: updateNextAuthSession } = useSession();
  const queryClient = useQueryClient();

  // Derive user, isLoading, isAuthenticated from NextAuth's useSession
  const user = session?.user as User | null; // Cast session.user to your User type
  const baseIsLoading = status === "loading";
  const isAuthenticated = status === "authenticated" && !!user;

  // Local loading state specifically for the signup process initial API call
  const [isSignupLoading, setIsSignupLoading] = React.useState(false);

  useEffect(() => {
    console.log("[AuthContext from NextAuth] Session Status:", status);
    if (status === "authenticated" && session?.user) {
      console.log(
        "[AuthContext from NextAuth] User from session:",
        JSON.stringify(session.user, null, 2)
      );
      // If your session.user from NextAuth doesn't have all fields (e.g. full subscription),
      // your NextAuth session callback in authOptions needs to be adjusted to add them from DB.
    } else if (status === "unauthenticated") {
      console.log("[AuthContext from NextAuth] User is unauthenticated.");
    }
  }, [session, status]);

  const refreshCurrentUser = useCallback(async () => {
    console.log("[AuthContext] Attempting to refresh NextAuth session...");
    await updateNextAuthSession(); // This tells NextAuth to refetch its session
    // The updated session will flow through the `useSession` hook
  }, [updateNextAuthSession]);

  const login = async (email: string, password?: string) => {
    console.log("[AuthContext] Attempting login via NextAuth signIn...");
    try {
      const result = await signIn("credentials", {
        redirect: false, // Handle redirect manually or based on result
        email,
        password,
      });
      if (result?.error) {
        console.error("[AuthContext] NextAuth signIn error:", result.error);
        throw new Error(result.error);
      }
      if (result?.ok) {
        console.log(
          "[AuthContext] NextAuth signIn successful. Session will be updated by useSession."
        );
        // No need to call refreshCurrentUser here if session callback is right,
        // but can call it if you want to force an immediate update post-signIn action.
        // await refreshCurrentUser();
      } else {
        throw new Error(
          "Login failed. Please check your credentials or try again."
        );
      }
    } catch (error) {
      console.error("[AuthContext] Login function error:", error);
      throw error; // Re-throw for the form to handle
    }
  };

  const logout = useCallback(async () => {
    console.log("[AuthContext] Logging out via NextAuth signOut...");
    await nextAuthSignOut({ redirect: false }); // Or specify a redirect path, e.g., { callbackUrl: "/login" }
    queryClient.clear(); // Optional: clear react-query cache on logout
  }, [queryClient]);

  // This is the internal signup logic, not directly exposed via context anymore
  const internalSignup = async (
    email: string,
    password?: string,
    name?: string
  ) => {
    // Step 1: Call your backend API to create the user
    const response = await fetch("/api/auth/register", {
      // Example: your user registration endpoint
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Signup failed on backend");
    }
    console.log(
      "[AuthContext] Backend signup successful. Now attempting NextAuth login..."
    );
    // Step 2: Log the user in using NextAuth to establish the session
    await login(email, password); // Use the login function to establish NextAuth session
  };

  // This is the function exposed via context, with loading state management
  const signupWithLoading = async (
    email: string,
    password?: string,
    name?: string
  ) => {
    setIsSignupLoading(true);
    try {
      await internalSignup(email, password, name);
    } catch (error) {
      console.error("[AuthContext] Signup process error:", error);
      throw error; // Re-throw for UI to handle
    } finally {
      setIsSignupLoading(false);
    }
  };

  // `updateSubscription` is tricky. If Stripe webhook updates DB,
  // then `refreshCurrentUser` (which calls `updateNextAuthSession`)
  // should be called from the UI (e.g., on a success page) to get the new session.
  // This function might not be needed here if UI triggers refresh.
  // const updateSubscription = async (tier: SubscriptionTier, isYearly: boolean) => { ... };

  const useAiCredit = async (): Promise<boolean> => {
    // This function seems to call a specific API and then update parts of the user subscription locally.
    // This is risky if it desyncs from the true NextAuth session.
    // Ideal: /api/subscription/use-credit updates DB, then client calls refreshCurrentUser.
    if (!user || !user.subscription) {
      console.error(
        "[AuthContext] useAiCredit: User or subscription not available."
      );
      return false;
    }

    try {
      const response = await fetch("/api/subscription/use-credit", {
        method: "PUT", // Assuming your API uses PUT for this
      });
      const creditData = await response.json();
      if (!response.ok) {
        console.error(
          "[AuthContext] Failed to use AI credit:",
          creditData.error
        );
        return false;
      }
      if (creditData.success) {
        console.log(
          "[AuthContext] AI Credit used successfully via API. Forcing session refresh."
        );
        // IMPORTANT: After backend confirms credit use & DB update,
        // refresh the entire NextAuth session to get the true state.
        await refreshCurrentUser();
        queryClient.invalidateQueries({ queryKey: ["credits"] });
        return true;
      }
      console.warn(
        "[AuthContext] useAiCredit API call did not indicate success."
      );
      return false;
    } catch (error) {
      console.error("[AuthContext] Error in useAiCredit:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: baseIsLoading || isSignupLoading, // Combine NextAuth loading with signup loading
        isAuthenticated,
        login,
        logout,
        signup: signupWithLoading, // Use the wrapped signup
        // updateSubscription, // Re-evaluate if needed
        useAiCredit,
        refreshCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
