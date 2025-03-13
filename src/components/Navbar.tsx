"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  BookOpen,
  Menu,
  Keyboard,
  Settings,
  LogOut,
  LogIn,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface NavbarProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  signOut?: () => void;
  setShowKeyboardShortcuts?: (show: boolean) => void;
}

export default function Navbar({
  user,
  signOut,
  setShowKeyboardShortcuts = () => {},
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();

  const navigateToSettings = () => {
    router.push("/settings");
  };

  const navigateToHome = () => {
    router.push("/");
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 shadow-sm backdrop-blur-md"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.9)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and title */}
          <Link href="/" className="flex items-center group">
            <BookOpen className="h-7 w-7 text-primary mr-3 group-hover:scale-110 transition-transform duration-300" />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
              Čtenářský deník
            </h1>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Home button - only show when user is logged in */}
            {user && (
              <Button
                onClick={navigateToHome}
                variant="ghost"
                className="text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
              >
                <Home className="h-5 w-5 mr-2" />
                Domů
              </Button>
            )}

            {/* Subscription button - only show when user is logged in */}
            {user && (
              <Button
                onClick={() => router.push("/subscription")}
                variant="ghost"
                className="text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
                  />
                </svg>
                Předplatné
              </Button>
            )}

            {/* Keyboard shortcuts button - only show when user is logged in */}
            {user && (
              <Button
                onClick={() => setShowKeyboardShortcuts(true)}
                variant="ghost"
                className="text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                title="Klávesové zkratky"
              >
                <Keyboard className="h-5 w-5 mr-2" />
                Zkratky
              </Button>
            )}

            {/* User login/profile section */}
            {user ? (
              /* User profile dropdown - when logged in */
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex items-center gap-2 text-foreground hover:bg-accent/20 transition-all duration-300 rounded-full pl-3 pr-4 py-1.5",
                    userMenuOpen && "bg-accent/20"
                  )}
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  onBlur={() => setTimeout(() => setUserMenuOpen(false), 100)}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="max-w-[100px] truncate">
                    {user.name || user.email}
                  </span>
                </Button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -5, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 origin-top-right bg-card rounded-lg shadow-lg border border-border/50"
                    >
                      <div className="p-2">
                        <div className="px-3 py-2 border-b border-border/30 mb-1">
                          <p className="text-sm font-medium text-foreground">
                            {user.name || "Uživatel"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-foreground hover:bg-accent/20 hover:text-primary transition-all duration-200 mb-1 rounded-md group"
                          onClick={() => {
                            setUserMenuOpen(false);
                            navigateToSettings();
                          }}
                        >
                          <Settings className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                          <span className="group-hover:translate-x-0.5 transition-transform">
                            Nastavení
                          </span>
                        </Button>

                        {signOut && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-foreground hover:bg-accent/20 hover:text-red-400 transition-all duration-200 rounded-md group"
                            onClick={() => signOut()}
                          >
                            <LogOut className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                            <span className="group-hover:translate-x-0.5 transition-transform">
                              Odhlásit se
                            </span>
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Login button - when not logged in */
              <Button
                onClick={() => router.push("/")}
                variant="outline"
                className="shadow-sm transition-all duration-300 hover:shadow-md hover:bg-primary/10"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Přihlásit se
              </Button>
            )}
          </div>

          {/* Mobile navigation */}
          <div className="md:hidden flex items-center space-x-2">
            {/* User profile button (mobile) - when logged in */}
            {user ? (
              <Button
                variant="ghost"
                size="icon"
                className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-200"
                aria-label="User profile"
                onClick={navigateToSettings}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </Button>
            ) : (
              /* Login button (mobile) - when not logged in */
              <Button
                onClick={() => router.push("/")}
                variant="outline"
                size="icon"
                className="bg-primary/10 text-primary hover:bg-primary/20"
                aria-label="Log in"
              >
                <LogIn className="w-5 h-5" />
              </Button>
            )}

            {/* Mobile menu toggle */}
            <Button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              variant="outline"
              size="icon"
              className={cn(
                "text-foreground hover:bg-secondary/70 bg-secondary/50",
                mobileMenuOpen && "bg-secondary/70"
              )}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden py-3"
            >
              {/* Mobile menu buttons */}
              <div className="flex flex-col space-y-2">
                {/* Mobile menu sections only for logged in users */}
                {user ? (
                  <>
                    {/* Home button (mobile menu) */}
                    <Button
                      onClick={() => {
                        navigateToHome();
                        setMobileMenuOpen(false);
                      }}
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      <Home className="h-4 w-4 mr-2" />
                      Domů
                    </Button>

                    {/* Subscription button (mobile menu) */}
                    <Button
                      onClick={() => {
                        router.push("/subscription");
                        setMobileMenuOpen(false);
                      }}
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
                        />
                      </svg>
                      Předplatné
                    </Button>

                    {/* Keyboard shortcuts button (mobile menu) */}
                    <Button
                      onClick={() => {
                        setShowKeyboardShortcuts(true);
                        setMobileMenuOpen(false);
                      }}
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      <Keyboard className="h-4 w-4 mr-2" />
                      Klávesové zkratky
                    </Button>

                    {/* User section in mobile menu */}
                    <div className="pt-2 border-t border-border/30">
                      <div className="flex items-center px-2 py-2">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium mr-3">
                          {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="flex-1 truncate">
                          <p className="text-sm font-medium text-foreground">
                            {user.name || "Uživatel"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-foreground hover:bg-accent/20 hover:text-primary transition-all duration-200 rounded-md group"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigateToSettings();
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                      <span className="group-hover:translate-x-0.5 transition-transform">
                        Nastavení
                      </span>
                    </Button>

                    {signOut && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => signOut()}
                        className="justify-start text-foreground hover:bg-accent/20 hover:text-red-400 transition-all duration-200 rounded-md group w-full"
                      >
                        <LogOut className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                        <span className="group-hover:translate-x-0.5 transition-transform">
                          Odhlásit se
                        </span>
                      </Button>
                    )}
                  </>
                ) : (
                  /* Login button in mobile menu - when not logged in */
                  <Button
                    onClick={() => {
                      router.push("/");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full shadow-sm transition-colors"
                  >
                    <LogIn className="w-4 h-4 mr-1.5" />
                    Přihlásit se
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
