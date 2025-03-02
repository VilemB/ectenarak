"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Menu,
  Plus,
  X,
  Keyboard,
  Settings,
  LogOut,
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
  signOut: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setShowAddForm: (show: boolean) => void;
  setShowKeyboardShortcuts: (show: boolean) => void;
}

export default function Navbar({
  user,
  signOut,
  searchQuery,
  setSearchQuery,
  setShowAddForm,
  setShowKeyboardShortcuts,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();

  const navigateToSettings = () => {
    console.log("Navigating to settings page");
    router.push("/settings");
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-10 border-b border-border/50 shadow-sm backdrop-blur-md"
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
            {/* Search input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all duration-200 group-focus-within:text-primary">
                <Search className="h-4 w-4 text-primary group-focus-within:text-primary transition-colors duration-200" />
              </div>
              <input
                type="text"
                placeholder="Hledat knihy..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="py-2.5 pl-10 pr-10 block w-full rounded-full border border-border/50 
                text-white placeholder:text-gray-400 
                focus:ring-2 focus:ring-primary focus:border-transparent 
                shadow-sm bg-secondary/70 focus:bg-secondary/90 
                transition-all duration-200
                focus:scale-[1.02] transform-gpu"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-primary hover:text-primary/80 transition-colors duration-200"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear search</span>
                </button>
              )}
            </div>

            {/* Add book button */}
            <Button
              onClick={() => setShowAddForm(true)}
              className="shadow-sm transition-all duration-300 hover:shadow-md hover:bg-primary/90"
            >
              <Plus className="w-5 h-5 mr-2" />
              Přidat knihu
            </Button>

            {/* Keyboard shortcuts button */}
            <Button
              onClick={() => setShowKeyboardShortcuts(true)}
              variant="outline"
              size="icon"
              className="text-primary hover:text-primary/80 hover:bg-primary/10 transition-all duration-200"
              title="Klávesové zkratky"
            >
              <Keyboard className="h-5 w-5" />
            </Button>

            {/* User profile dropdown */}
            {user && (
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
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Mobile navigation */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Add book button (mobile) */}
            <Button
              onClick={() => setShowAddForm(true)}
              variant="outline"
              size="icon"
              className="bg-primary/10 text-primary hover:bg-primary/20"
              aria-label="Add book"
            >
              <Plus className="w-5 h-5" />
            </Button>

            {/* User profile button (mobile) */}
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-200"
                aria-label="User profile"
                onClick={navigateToSettings}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
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
              {/* Mobile search */}
              <div className="relative mb-3 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all duration-200 group-focus-within:text-primary">
                  <Search className="h-4 w-4 text-primary group-focus-within:text-primary transition-colors duration-200" />
                </div>
                <input
                  type="text"
                  placeholder="Hledat knihy..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-white placeholder:text-gray-400 py-2.5 pl-10 pr-10 block w-full rounded-full border border-border/50 focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm bg-secondary/70 focus:bg-secondary/90 transition-all duration-200 focus:scale-[1.02] transform-gpu"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-primary hover:text-primary/80 transition-colors duration-200"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Clear search</span>
                  </button>
                )}
              </div>

              {/* Mobile menu buttons */}
              <div className="flex flex-col space-y-2">
                <Button
                  onClick={() => {
                    setShowAddForm(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Přidat knihu
                </Button>

                <Button
                  onClick={() => {
                    setShowKeyboardShortcuts(true);
                    setMobileMenuOpen(false);
                  }}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Keyboard className="h-4 w-4 mr-2" />
                  Klávesové zkratky
                </Button>

                {/* User section in mobile menu */}
                {user && (
                  <>
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
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
