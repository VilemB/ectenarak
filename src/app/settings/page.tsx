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
import {
  LogOut,
  Shield,
  AlertTriangle,
  Loader2,
  User,
  Lock,
  Bell,
  Mail,
  Home,
} from "lucide-react";

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
    <div className="container max-w-5xl mx-auto py-12 px-4 md:px-6">
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight">Nastavení účtu</h1>
        <div className="h-1 w-20 bg-primary/50 mt-3 rounded-full"></div>
      </div>

      <div className="grid md:grid-cols-[240px_1fr] gap-10">
        {/* Sidebar Navigation */}
        <aside className="space-y-8 md:border-r border-border/20 pr-6 hidden md:block">
          <div className="sticky top-6">
            <div className="flex items-center gap-3 mb-8">
              <div>
                <p className="font-medium">{user?.name || "Uživatel"}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                  {user?.email}
                </p>
              </div>
            </div>

            <nav className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start font-medium text-primary"
              >
                <User className="h-4 w-4 mr-3" /> Profil
              </Button>
              {/* Placeholder for future navigation options */}
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground"
                disabled
              >
                <Lock className="h-4 w-4 mr-3" /> Zabezpečení
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground"
                disabled
              >
                <Bell className="h-4 w-4 mr-3" /> Oznámení
              </Button>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="space-y-12">
          {/* Profile Card - Mobile Only */}
          <div className="flex items-center gap-4 md:hidden">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/80 to-primary/30 flex items-center justify-center text-background font-semibold text-lg shadow-sm">
              {user?.name
                ? user.name.charAt(0).toUpperCase()
                : user?.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{user?.name || "Uživatel"}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          {/* Profile Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Osobní údaje</h2>
              <div className="h-8 px-3 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center">
                Pouze pro čtení
              </div>
            </div>

            <div className="grid gap-8 sm:grid-cols-2">
              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-sm font-medium">
                  E-mailová adresa
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted/30 border-muted/50 pr-10 transition-all focus-visible:ring-1 focus-visible:ring-primary/50"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Používá se pro přihlášení do aplikace
                </p>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="name" className="text-sm font-medium">
                  Zobrazované jméno
                </Label>
                <div className="relative">
                  <Input
                    id="name"
                    value={user?.name || ""}
                    disabled
                    className="bg-muted/30 border-muted/50 pr-10 transition-all focus-visible:ring-1 focus-visible:ring-primary/50"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <User className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Zobrazuje se v aplikaci a u vašich příspěvků
                </p>
              </div>
            </div>
          </section>

          {/* Account Actions */}
          <section className="border-t border-border/20 pt-10 space-y-6">
            <h2 className="text-xl font-semibold">Akce účtu</h2>

            <div className="rounded-xl border border-border/30 overflow-hidden bg-card">
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="rounded-full p-2 bg-red-100 text-red-600 mt-1">
                    <LogOut className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">Smazání účtu</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Tato akce trvale odstraní váš účet a všechna související
                      data. Tuto akci nelze vrátit zpět.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/20 px-5 py-4 border-t border-border/20 flex flex-wrap gap-3 justify-end">
                {deleteConfirmation ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setDeleteConfirmation(false)}
                      className="text-sm"
                    >
                      Zrušit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="text-sm"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                          Mazání účtu...
                        </>
                      ) : (
                        "Potvrdit smazání"
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteConfirmation(true)}
                    className="text-sm"
                  >
                    Smazat účet
                  </Button>
                )}
              </div>
            </div>
          </section>

          {/* Back Link */}
          <div className="border-t border-border/20 pt-6">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="h-4 w-4 mr-2" /> Zpět na hlavní stránku
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
