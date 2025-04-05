"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { deleteUser } from "@/lib/api";
import { LogOut, Loader2, ChevronLeft } from "lucide-react";

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
  const { user, loading, isAuthenticated, signOut } = useAuth();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);

  // Redirect to home if not authenticated after loading completes
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/");
    }
  }, [loading, isAuthenticated, router]);

  const handleDeleteAccount = async () => {
    if (!deleteConfirmation) {
      setDeleteConfirmation(true);
      return;
    }

    setIsDeleting(true);
    try {
      await deleteUser();
      await signOut();
      router.push("/");
      toast.success("Účet byl úspěšně smazán");
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast.error("Nepodařilo se smazat účet");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nastavení</h1>
            <p className="text-muted-foreground">
              Spravujte nastavení svého účtu
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Informace o účtu</CardTitle>
              <CardDescription>Základní informace o vašem účtu</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <UserIllustration
                  name={user.name}
                  email={user.email}
                  size="large"
                />
                <div>
                  <h3 className="font-medium">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card>
            <CardHeader>
              <CardTitle>Zabezpečení</CardTitle>
              <CardDescription>
                Spravujte zabezpečení svého účtu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Odhlásit se</Label>
                  <p className="text-sm text-muted-foreground">
                    Odhlásit se ze všech zařízení
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => signOut()}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Odhlásit se
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone Card */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">
                Nebezpečná zóna
              </CardTitle>
              <CardDescription>Tyto akce nelze vrátit zpět</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Smazat účet</Label>
                    <p className="text-sm text-muted-foreground">
                      Trvale smaže váš účet a všechna data
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mažu...
                      </>
                    ) : deleteConfirmation ? (
                      "Potvrdit smazání"
                    ) : (
                      "Smazat účet"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
