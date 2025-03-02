"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, UserX, AlertTriangle } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export default function SettingsPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if not logged in
  if (!loading && !user) {
    router.push("/");
    return null;
  }

  const handleDeleteAccount = async () => {
    if (!user) return;

    setDeleteLoading(true);
    setError("");

    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Nepodařilo se smazat účet");
      }

      // Sign out after successful deletion
      await signOut({ callbackUrl: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Něco se pokazilo");
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 px-4 md:px-6">
      <Button
        variant="ghost"
        className="mb-6 flex items-center gap-2 hover:bg-accent/20 transition-all duration-300"
        onClick={() => router.push("/")}
      >
        <ArrowLeft className="h-4 w-4" />
        Zpět na hlavní stránku
      </Button>

      <h1 className="text-3xl font-bold mb-8">Nastavení účtu</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informace o účtu</CardTitle>
            <CardDescription>
              Zde jsou základní informace o vašem účtu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Jméno</Label>
              <div className="p-2 bg-muted/50 rounded-md">
                {user?.name || "Není nastaveno"}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="p-2 bg-muted/50 rounded-md">{user?.email}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/30">
          <CardHeader className="text-destructive">
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Smazání účtu
            </CardTitle>
            <CardDescription className="text-destructive/80">
              Tato akce je nevratná. Smazáním účtu přijdete o všechna svá data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Smazáním účtu budou odstraněny všechny vaše knihy, poznámky a
              další data spojená s vaším účtem. Tuto akci nelze vrátit zpět.
            </p>
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4 flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              variant="destructive"
              className="w-full transition-all duration-300 hover:bg-destructive/90 hover:shadow-md"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Smazat účet
            </Button>
          </CardFooter>
        </Card>
      </div>

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Smazat účet"
        description="Opravdu chcete smazat svůj účet? Tato akce je nevratná a všechna vaše data budou ztracena."
        confirmText="Smazat účet"
        cancelText="Zrušit"
        variant="destructive"
        isLoading={deleteLoading}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}
