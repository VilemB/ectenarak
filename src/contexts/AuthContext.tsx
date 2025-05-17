"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { User, SubscriptionTier, UserSubscription } from "@/types/user";
import { useQueryClient } from "@tanstack/react-query";
import { signOut } from "next-auth/react";

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  updateSubscription: (
    tier: SubscriptionTier,
    isYearly: boolean
  ) => Promise<void>;
  useAiCredit: () => Promise<boolean>;
  refreshCurrentUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export { AuthContext };

// Mock function to simulate API calls
const mockApiCall = <T,>(data: T, delay = 500): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, delay);
  });
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const queryClient = useQueryClient();

  const refreshCurrentUser = useCallback(async (): Promise<User | null> => {
    setIsLoading(true);
    try {
      // Replace with your actual API endpoint to get the current user
      const response = await fetch("/api/auth/session/me"); // Example endpoint
      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized, clear user
          setUser(null);
          localStorage.removeItem("user");
          return null;
        }
        throw new Error("Failed to fetch current user");
      }
      const freshUserData: User = await response.json();

      if (freshUserData && freshUserData.id) {
        // Ensure dates are Date objects
        freshUserData.createdAt = new Date(freshUserData.createdAt);
        freshUserData.updatedAt = new Date(freshUserData.updatedAt);
        if (freshUserData.subscription) {
          freshUserData.subscription.startDate = new Date(
            freshUserData.subscription.startDate
          );
          if (freshUserData.subscription.endDate) {
            freshUserData.subscription.endDate = new Date(
              freshUserData.subscription.endDate
            );
          }
          if (freshUserData.subscription.lastRenewalDate) {
            freshUserData.subscription.lastRenewalDate = new Date(
              freshUserData.subscription.lastRenewalDate
            );
          }
          if (freshUserData.subscription.nextRenewalDate) {
            freshUserData.subscription.nextRenewalDate = new Date(
              freshUserData.subscription.nextRenewalDate
            );
          }
        }
        setUser(freshUserData);
        localStorage.setItem("user", JSON.stringify(freshUserData));
        return freshUserData;
      } else {
        setUser(null);
        localStorage.removeItem("user");
        return null;
      }
    } catch (error) {
      console.error("Error refreshing current user:", error);
      // Optionally handle by clearing user or leaving stale
      setUser(null); // Example: clear user on error
      localStorage.removeItem("user");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;
          // Basic validation of stored user structure
          if (parsedUser && parsedUser.id && parsedUser.subscription) {
            // Convert string dates back to Date objects
            parsedUser.createdAt = new Date(parsedUser.createdAt);
            parsedUser.updatedAt = new Date(parsedUser.updatedAt);
            parsedUser.subscription.startDate = new Date(
              parsedUser.subscription.startDate
            );
            if (parsedUser.subscription.endDate) {
              parsedUser.subscription.endDate = new Date(
                parsedUser.subscription.endDate
              );
            }
            if (parsedUser.subscription.lastRenewalDate) {
              parsedUser.subscription.lastRenewalDate = new Date(
                parsedUser.subscription.lastRenewalDate
              );
            }
            if (parsedUser.subscription.nextRenewalDate) {
              parsedUser.subscription.nextRenewalDate = new Date(
                parsedUser.subscription.nextRenewalDate
              );
            }
            setUser(parsedUser);
            // Optionally, trigger a background refresh to ensure data is not too stale
            // refreshCurrentUser(); // Consider the implications of calling this on every mount
          } else {
            // Stored user is invalid, try to refresh from server
            await refreshCurrentUser();
          }
        } else {
          // No user in localStorage, try to get from server (e.g. if httpOnly cookie session exists)
          await refreshCurrentUser();
        }
      } catch (error) {
        console.error("Initial authentication error:", error);
        setUser(null); // Ensure user is null if auth check fails
        localStorage.removeItem("user");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [refreshCurrentUser]);

  const login = async (email: string /*, password?: string */) => {
    // Added password for realism if needed by your backend
    setIsLoading(true);
    try {
      // === Step 1: Call your actual backend login endpoint ===
      // Example:
      // const loginResponse = await fetch("/api/auth/login", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email, password }),
      // });
      // if (!loginResponse.ok) {
      //   const errorData = await loginResponse.json();
      //   throw new Error(errorData.message || "Login failed");
      // }
      // Your backend should have set a session cookie upon successful login.

      // === Step 2: Refresh current user data from the session ===
      const freshUser = await refreshCurrentUser();
      if (!freshUser) {
        // This case implies session wasn't established correctly or /api/auth/session/me failed
        throw new Error(
          "Login successful, but failed to retrieve user session."
        );
      }
      // If refreshCurrentUser is successful, user state and localStorage are updated internally by it.
      console.log("User logged in and session refreshed:", freshUser);
    } catch (error) {
      console.error("Login error:", error);
      // Ensure user state is cleared on login failure that's not handled by refreshCurrentUser
      setUser(null);
      localStorage.removeItem("user");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(async () => {
    try {
      // Optional: Call a backend endpoint to invalidate the session
      // await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      localStorage.removeItem("user");
      await signOut({ redirect: false }); // If using NextAuth.js
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }, []);

  const signup = async (email: string, password?: string, name?: string) => {
    setIsLoading(true);
    try {
      // === Step 1: Call your actual backend signup endpoint ===
      // Example:
      // const signupResponse = await fetch("/api/auth/signup", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email, password, name }),
      // });
      // if (!signupResponse.ok) {
      //   const errorData = await signupResponse.json();
      //   throw new Error(errorData.message || "Signup failed");
      // }
      // Your backend should have created the user and set a session cookie.

      // === Step 2: Refresh current user data from the session ===
      const freshUser = await refreshCurrentUser();
      if (!freshUser) {
        throw new Error(
          "Signup successful, but failed to retrieve user session."
        );
      }
      console.log("User signed up and session refreshed:", freshUser);
    } catch (error) {
      console.error("Signup error:", error);
      setUser(null);
      localStorage.removeItem("user");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateSubscription = async (
    tier: SubscriptionTier,
    isYearly: boolean
  ) => {
    if (!user) throw new Error("User not authenticated");

    setIsLoading(true);
    try {
      // IN A REAL APP:
      // 1. This function might initiate a Stripe checkout session.
      // 2. A Stripe webhook would update your DB.
      // 3. The client (e.g., on a success page) would then call refreshCurrentUser().
      // The MOCK logic below is not how a real subscription update reflecting backend changes would work.
      console.warn(
        "AuthContext.updateSubscription is using MOCK data. For real updates, call refreshCurrentUser() after backend confirmation."
      );
      const aiCredits = tier === "free" ? 3 : tier === "basic" ? 50 : 100;
      const updatedSubscription: UserSubscription = {
        ...user.subscription, // Preserve existing fields if any
        tier,
        // startDate should ideally come from the backend or be the original start date
        isYearly,
        aiCreditsRemaining: aiCredits,
        aiCreditsTotal: aiCredits,
        autoRenew: tier !== "free",
        // lastRenewalDate, nextRenewalDate should come from backend
      };
      const updatedUser = {
        ...user,
        subscription: updatedSubscription,
        updatedAt: new Date(),
      };
      await mockApiCall(updatedUser);
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      // Instead of mock: await refreshCurrentUser();
    } catch (error) {
      console.error("Subscription update error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const useAiCredit = async (): Promise<boolean> => {
    if (!user) throw new Error("User not authenticated");

    try {
      const response = await fetch("/api/subscription/use-credit", {
        method: "PUT",
      });
      const creditData = await response.json();
      if (!response.ok) {
        console.error("Failed to use AI credit:", creditData.error);
        return false;
      }
      if (creditData.success) {
        // Data from API is source of truth for credits
        const updatedUser = {
          ...user,
          subscription: {
            ...user.subscription,
            aiCreditsRemaining: creditData.creditsRemaining,
            aiCreditsTotal: creditData.creditsTotal, // Assuming API returns total as well
          },
          updatedAt: new Date(),
        };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        queryClient.invalidateQueries({ queryKey: ["credits"] }); // Good
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error using AI credit:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        signup,
        updateSubscription,
        useAiCredit,
        refreshCurrentUser, // Expose the refresh function
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
