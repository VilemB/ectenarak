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
import { LogOut, Shield, User, AlertTriangle, Loader2 } from "lucide-react";

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Načítání informací o účtu...</p>
        </div>
      </div>
    );
  }

  // Prevent rendering if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md border border-border/50 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Nastavení
            </CardTitle>
            <CardDescription className="text-center text-red-400 flex items-center justify-center">
              <Shield className="h-4 w-4 mr-2" />
              Vyžadována autentizace
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-6 text-muted-foreground">
            Pro přístup k nastavení účtu se prosím přihlaste.
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <Button
              onClick={() => router.push("/")}
              className="px-6 transition-all duration-300 hover:scale-105"
            >
              Zpět na hlavní stránku
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md border border-border/50 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Nastavení
            </CardTitle>
            <CardDescription className="text-center text-red-400 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Chyba při načítání účtu
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
              Zpět na hlavní stránku
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show content when user is available
  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="w-full bg-card/90 backdrop-blur-sm border border-border/30 rounded-xl shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="px-8 py-6 border-b border-border/10">
          <h2 className="text-2xl font-semibold tracking-tight">
            Nastavení účtu
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5">
            Správa vašeho profilu a předvoleb účtu
          </p>
        </div>

        <div className="p-8 space-y-8">
          {/* Profile Card */}
          <div className="flex items-center gap-5 p-5 rounded-xl bg-primary/5 border border-primary/10 transition-colors hover:bg-primary/8">
            <div className="h-14 w-14 rounded-full bg-background flex items-center justify-center text-primary font-semibold text-xl shadow-sm">
              {user?.name
                ? user.name.charAt(0).toUpperCase()
                : user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1 overflow-hidden">
              <p className="font-medium text-lg text-foreground">
                {user?.name || "Uživatel"}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="flex items-center text-sm font-medium"
              >
                <User className="h-4 w-4 mr-2 text-primary opacity-70" />
                E-mailová adresa
              </Label>
              <Input
                id="email"
                value={user?.email || ""}
                disabled
                className="bg-background/50 border-border/40 transition-colors focus:border-primary/50"
              />
              <p className="text-xs text-muted-foreground mt-1.5 ml-1">
                Váš přihlašovací e-mail
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="flex items-center text-sm font-medium"
              >
                <User className="h-4 w-4 mr-2 text-primary opacity-70" />
                Zobrazované jméno
              </Label>
              <Input
                id="name"
                value={user?.name || ""}
                disabled
                className="bg-background/50 border-border/40 transition-colors focus:border-primary/50"
              />
              <p className="text-xs text-muted-foreground mt-1.5 ml-1">
                Vaše jméno v aplikaci
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 border-t border-border/10 bg-muted/20">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="w-full sm:w-auto hover:bg-secondary/50 transition-colors"
            >
              Zpět na hlavní stránku
            </Button>

            {deleteConfirmation ? (
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmation(false)}
                  className="border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  Zrušit
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="bg-red-500 hover:bg-red-600 transition-colors"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Mazání...
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4 mr-2" />
                      Potvrdit smazání
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmation(true)}
                className="w-full sm:w-auto border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Smazat účet
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
