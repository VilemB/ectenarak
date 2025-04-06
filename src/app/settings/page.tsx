"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deleteUser } from "@/lib/api";
import { LogOut, Loader2, ChevronLeft, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const { user, loading, isAuthenticated, signOut } = useAuth();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);

  // Redirect to home if not authenticated after loading completes
  if (!loading && !isAuthenticated) {
    router.push("/");
    return null;
  }

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
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background/5 to-background/20 pointer-events-none" />
      <div className="relative max-w-2xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-4 mb-12"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full hover:bg-white/5"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">
              Nastavení
            </h1>
            <p className="text-muted-foreground/80 mt-1">
              Spravujte nastavení svého účtu
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-8"
        >
          {/* User Info */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex items-center gap-6 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm hover:bg-white/[0.05] transition-colors"
            >
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xl ring-1 ring-white/10 shadow-lg">
                {user?.name
                  ? user.name.charAt(0).toUpperCase()
                  : user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <p className="text-lg font-medium text-white/90">
                  {user?.name || "Uživatel"}
                </p>
                <p className="text-sm text-white/50">{user?.email}</p>
              </div>
            </motion.div>

            <div className="space-y-4 pt-2">
              {/* Sign Out Button */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <Button
                  variant="outline"
                  onClick={() => signOut()}
                  className="w-full flex items-center gap-2 h-12 bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.08] hover:border-white/[0.08] transition-colors"
                >
                  <LogOut className="h-4 w-4 text-white/70" />
                  <span className="text-white/90">Odhlásit se</span>
                </Button>
              </motion.div>

              {/* Delete Account Button */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="w-full flex items-center gap-2 h-12 bg-red-500/10 hover:bg-red-500/20 border-red-500/20 hover:border-red-500/30 transition-colors"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Mažu...</span>
                    </>
                  ) : deleteConfirmation ? (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Potvrdit smazání</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Smazat účet</span>
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
