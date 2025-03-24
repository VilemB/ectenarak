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
import {
  LogOut,
  Shield,
  AlertTriangle,
  Loader2,
  User,
  Mail,
  Home,
  ChevronLeft,
  Settings as SettingsIcon,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// User illustration component from NavBar
const UserIllustration = ({
  name,
  email,
  size = "default",
}: {
  name?: string | null;
  email?: string | null;
  size?: "default" | "large";
}) => {
  // Generate a consistent color based on user name or email
  const getColor = (identifier: string) => {
    const colors = [
      "bg-primary/20 text-primary",
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
      "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    ];

    // Simple hash function to get consistent index
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  // Get initials from name or email
  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    } else if (email) {
      return email.charAt(0).toUpperCase();
    }
    return "U";
  };

  const identifier = name || email || "User";
  const colorClass = getColor(identifier);
  const initials = getInitials(name, email);

  const sizeClass = size === "large" ? "w-16 h-16 text-lg" : "w-9 h-9 text-xs";

  return (
    <div
      className={`flex items-center justify-center rounded-full shadow-sm ${sizeClass} ${colorClass}`}
    >
      <span className="font-medium">{initials}</span>
    </div>
  );
};

export default function SettingsPage() {
  const { user, loading, error, isAuthenticated, signOut } = useAuth();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Redirect to home if not authenticated after loading completes
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      toast.error("Přihlaste se pro přístup k nastavení");
      router.push("/");
    }
  }, [loading, isAuthenticated, router]);

  // Handle user deletion
  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      setIsDeleting(true);
      await deleteUser();
      toast.success("Váš účet byl smazán");
      // Sign out the user after successful account deletion
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Nepodařilo se smazat účet");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground">Načítání...</p>
        </motion.div>
      </div>
    );
  }

  // Prevent rendering if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md px-4"
        >
          <Card className="border border-border/40 shadow-sm">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto">
                <Shield className="h-8 w-8 text-red-500 mx-auto mb-2" />
              </div>
              <CardTitle>Nastavení</CardTitle>
              <CardDescription>
                Pro přístup k nastavení účtu se prosím přihlaste
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center pt-2 pb-6">
              <Button onClick={() => router.push("/")} className="px-6">
                <Home className="h-4 w-4 mr-2" /> Zpět na hlavní stránku
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
      <div className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md px-4"
        >
          <Card className="border border-border/40 shadow-sm">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto">
                <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              </div>
              <CardTitle>Chyba</CardTitle>
              <CardDescription className="text-red-500">
                {error.message}
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center pt-2 pb-6">
              <Button onClick={() => router.push("/")} className="px-6">
                <Home className="h-4 w-4 mr-2" /> Zpět na hlavní stránku
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Show content when user is available
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="container max-w-3xl mx-auto py-8 md:py-12 px-4"
    >
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="h-9 w-9 p-0 rounded-full hover:bg-muted/80 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Nastavení účtu</h1>
      </div>

      {/* User Profile Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="mb-8 overflow-hidden border border-border/50 shadow-md">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/5 pt-8 pb-6 px-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent blur-sm"></div>
                <UserIllustration
                  name={user?.name}
                  email={user?.email}
                  size="large"
                />
              </div>
              <div className="text-center sm:text-left space-y-1.5">
                <h2 className="text-xl font-medium">
                  {user?.name || "Uživatel"}
                </h2>
                <p className="text-muted-foreground text-sm">{user?.email}</p>
                <div className="inline-block mt-2 text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 text-primary font-medium border border-primary/10">
                  Čtenářský deník
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Tabs Navigation */}
      <Tabs
        defaultValue="profile"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full mb-8"
      >
        <TabsList className="w-full grid grid-cols-2 mb-6 p-1 bg-muted/50 border border-border/40 rounded-lg">
          <TabsTrigger value="profile" className="rounded-md">
            <User className="h-4 w-4 mr-2" /> Profil
          </TabsTrigger>
          <TabsTrigger value="account" className="rounded-md">
            <SettingsIcon className="h-4 w-4 mr-2" /> Akce účtu
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-0 space-y-4">
          <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-3 border-b border-border/10">
              <CardTitle className="text-lg flex items-center">
                <div className="rounded-full bg-primary/10 p-1.5 mr-3">
                  <User className="h-5 w-5 text-primary" />
                </div>
                Osobní údaje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm flex items-center">
                    <Mail className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />{" "}
                    E-mailová adresa
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-muted/30 pr-10"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Mail className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm flex items-center">
                    <User className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />{" "}
                    Zobrazované jméno
                  </Label>
                  <div className="relative">
                    <Input
                      id="name"
                      value={user?.name || ""}
                      disabled
                      className="bg-muted/30 pr-10"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <User className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="mt-0 space-y-4">
          <Card className="border border-red-100 dark:border-red-900/20 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
            <CardHeader className="pb-3 border-b border-red-100 dark:border-red-900/20">
              <CardTitle className="text-lg flex items-center text-red-500 dark:text-red-400">
                <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-1.5 mr-3">
                  <LogOut className="h-5 w-5 text-red-500 dark:text-red-400" />
                </div>
                Smazání účtu
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                Tato akce trvale odstraní váš účet a všechna související data.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 pb-6">
              {deleteConfirmation ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col"
                >
                  <div className="flex gap-4 items-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 0.1,
                        type: "spring",
                        stiffness: 200,
                      }}
                      className="rounded-full bg-red-100 dark:bg-red-900/30 p-1.5"
                    >
                      <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />
                    </motion.div>
                    <p className="text-sm text-red-500 dark:text-red-400 font-medium">
                      Všechna data budou nenávratně ztracena
                    </p>
                  </div>

                  <div className="flex items-center gap-3 mt-5">
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full"
                    >
                      <Button
                        variant="ghost"
                        onClick={() => setDeleteConfirmation(false)}
                        className="w-full border border-border"
                      >
                        Zrušit
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full"
                    >
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="w-full"
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                            Mazání...
                          </>
                        ) : (
                          "Potvrdit smazání"
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              ) : (
                <motion.div className="flex justify-center">
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <Button
                      variant="destructive"
                      onClick={() => setDeleteConfirmation(true)}
                      className="px-6 group relative overflow-hidden"
                    >
                      <div className="relative z-10 flex items-center">
                        <motion.div
                          animate={{ rotate: [0, 0, 12, 0] }}
                          transition={{
                            repeat: Infinity,
                            repeatDelay: 3,
                            duration: 1,
                          }}
                        >
                          <LogOut className="h-4 w-4 mr-2 text-red-100 dark:text-red-200" />
                        </motion.div>
                        <span>Smazat účet</span>
                      </div>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700"
                        initial={{ x: "100%" }}
                        whileHover={{ x: "0%" }}
                        transition={{ duration: 0.2 }}
                      />
                      <motion.div
                        className="absolute inset-0 opacity-0 bg-gradient-to-r from-red-600 to-red-700 dark:from-red-700 dark:to-red-800"
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                      />
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
