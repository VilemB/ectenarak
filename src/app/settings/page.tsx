"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { deleteUser } from "@/lib/api";
import { motion } from "framer-motion";
import { LogOut, Shield, User, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const { user, loading, error, sessionStatus, isAuthenticated, signOut } =
    useAuth();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);

  // Debug information
  useEffect(() => {
    console.log("Settings page loaded");
    console.log("Auth state:", {
      user,
      loading,
      error,
      sessionStatus,
      isAuthenticated,
    });
  }, [user, loading, error, sessionStatus, isAuthenticated]);

  // Redirect to home if not authenticated after loading completes
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log("Not authenticated, redirecting to home");
      toast.error("Please sign in to access settings");
      router.push("/");
    }
  }, [loading, isAuthenticated, router]);

  // Handle user deletion
  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      setIsDeleting(true);
      await deleteUser();
      toast.success("Your account has been deleted");
      // Sign out the user after successful account deletion
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border border-border/50 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">
                Settings
              </CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                Loading your account information...
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
              <div className="animate-pulse flex space-x-4 items-center">
                <div className="rounded-full bg-primary/20 h-12 w-12"></div>
                <div className="space-y-3">
                  <div className="h-2 bg-primary/20 rounded w-32"></div>
                  <div className="h-2 bg-primary/10 rounded w-24"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Prevent rendering if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container max-w-4xl mx-auto py-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border border-border/50 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">
                Settings
              </CardTitle>
              <CardDescription className="text-center text-red-400 flex items-center justify-center">
                <Shield className="h-4 w-4 mr-2" />
                Authentication required
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-6 text-muted-foreground">
              Please sign in to access your account settings.
            </CardContent>
            <CardFooter className="flex justify-center pb-6">
              <Button
                onClick={() => router.push("/")}
                className="px-6 transition-all duration-300 hover:scale-105"
              >
                Return to Home
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container max-w-4xl mx-auto py-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border border-border/50 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">
                Settings
              </CardTitle>
              <CardDescription className="text-center text-red-400 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Error loading your account
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-6 text-red-400">
              {error.message}
            </CardContent>
            <CardFooter className="flex justify-center pb-6">
              <Button
                onClick={() => router.push("/")}
                className="px-6 transition-all duration-300 hover:scale-105"
              >
                Return to Home
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Show content when user is available
  return (
    <div className="container max-w-4xl mx-auto py-10 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border border-border/50 shadow-lg bg-card/80 backdrop-blur-sm overflow-hidden">
          <CardHeader className="space-y-1 border-b border-border/20 pb-7">
            <CardTitle className="text-2xl font-bold">
              Account Settings
            </CardTitle>
            <CardDescription>
              Manage your profile and account preferences
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex items-center gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10"
            >
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl shrink-0">
                {user?.name
                  ? user.name.charAt(0).toUpperCase()
                  : user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1 overflow-hidden">
                <p className="font-medium text-foreground">
                  {user?.name || "User"}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </motion.div>

            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="space-y-2"
              >
                <Label
                  htmlFor="email"
                  className="text-sm font-medium flex items-center"
                >
                  <User className="h-3.5 w-3.5 mr-1.5 text-primary" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-secondary/50 border-border/50 focus:border-primary/50"
                />
                <p className="text-xs text-muted-foreground pl-1">
                  Your login email address
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="space-y-2"
              >
                <Label
                  htmlFor="name"
                  className="text-sm font-medium flex items-center"
                >
                  <User className="h-3.5 w-3.5 mr-1.5 text-primary" />
                  Display Name
                </Label>
                <Input
                  id="name"
                  value={user?.name || ""}
                  disabled
                  className="bg-secondary/50 border-border/50 focus:border-primary/50"
                />
                <p className="text-xs text-muted-foreground pl-1">
                  Your display name in the application
                </p>
              </motion.div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 border-t border-border/20 pt-6">
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="w-full sm:w-auto transition-all duration-300 hover:bg-secondary/80"
            >
              Return to Home
            </Button>

            {deleteConfirmation ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto"
              >
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmation(false)}
                  className="border-red-400/30 text-red-400 hover:bg-red-400/10 transition-all duration-300"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="transition-all duration-300 hover:bg-red-600"
                >
                  {isDeleting ? (
                    <>
                      <span className="animate-pulse">Deleting...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4 mr-2" />
                      Confirm Delete
                    </>
                  )}
                </Button>
              </motion.div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmation(true)}
                className="w-full sm:w-auto border-red-400/30 text-red-400 hover:bg-red-400/10 transition-all duration-300"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
