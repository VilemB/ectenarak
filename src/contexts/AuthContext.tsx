"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, SubscriptionTier, UserSubscription } from "@/types/user";
import { useQueryClient } from "@tanstack/react-query";

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

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // In a real app, this would be an API call to validate the session
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
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
          setUser(parsedUser);
        }
      } catch (error) {
        console.error("Authentication error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string) => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call to authenticate
      // For demo purposes, we'll create a mock user with a free subscription
      const mockUser: User = {
        id: "user_" + Math.random().toString(36).substr(2, 9),
        email,
        name: email.split("@")[0],
        subscription: {
          tier: "free",
          startDate: new Date(),
          isYearly: false,
          aiCreditsRemaining: 3,
          aiCreditsTotal: 3,
          autoRenew: false,
          lastRenewalDate: new Date(),
          nextRenewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await mockApiCall(mockUser);
      setUser(mockUser);
      localStorage.setItem("user", JSON.stringify(mockUser));
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call to invalidate the session
      await mockApiCall(null);
      setUser(null);
      localStorage.removeItem("user");
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, _password: string, name?: string) => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call to create a new user
      const mockUser: User = {
        id: "user_" + Math.random().toString(36).substr(2, 9),
        email,
        name: name || email.split("@")[0],
        subscription: {
          tier: "free",
          startDate: new Date(),
          isYearly: false,
          aiCreditsRemaining: 3,
          aiCreditsTotal: 3,
          autoRenew: false,
          lastRenewalDate: new Date(),
          nextRenewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await mockApiCall(mockUser);
      setUser(mockUser);
      localStorage.setItem("user", JSON.stringify(mockUser));
    } catch (error) {
      console.error("Signup error:", error);
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
      // In a real app, this would be an API call to update the subscription
      const aiCredits = tier === "free" ? 3 : tier === "basic" ? 50 : 100;

      const updatedSubscription: UserSubscription = {
        tier,
        startDate: new Date(),
        isYearly,
        aiCreditsRemaining: aiCredits,
        aiCreditsTotal: aiCredits,
        autoRenew: tier !== "free",
        lastRenewalDate: new Date(),
        nextRenewalDate: new Date(
          Date.now() + (isYearly ? 365 : 30) * 24 * 60 * 60 * 1000
        ),
      };

      const updatedUser = {
        ...user,
        subscription: updatedSubscription,
        updatedAt: new Date(),
      };

      await mockApiCall(updatedUser);
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
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
      // First try to use the credit
      const response = await fetch("/api/subscription/use-credit", {
        method: "PUT",
      });

      // Get the response data
      const creditData = await response.json();

      if (!response.ok) {
        console.error("Failed to use AI credit:", creditData.error);
        return false;
      }

      // Update the user state with the latest data
      if (creditData.success) {
        const updatedUser = {
          ...user,
          subscription: {
            ...user.subscription,
            aiCreditsRemaining: creditData.creditsRemaining,
            aiCreditsTotal: creditData.creditsTotal,
          },
          updatedAt: new Date(),
        };

        // Update state and localStorage
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));

        // Invalidate the credits query to trigger a refetch
        queryClient.invalidateQueries({ queryKey: ["credits"] });
      }

      return true;
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
