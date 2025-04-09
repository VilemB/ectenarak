"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Keyboard,
  Settings,
  LogOut,
  Home,
  ChevronDown,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

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

// User illustration component
const UserIllustration = ({
  name,
  email,
}: {
  name?: string | null;
  email?: string | null;
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

  return (
    <div
      className={`flex items-center justify-center rounded-full w-8 h-8 ${colorClass}`}
    >
      <span className="text-xs font-medium">{initials}</span>
    </div>
  );
};

// Animated hamburger menu component
const HamburgerMenuButton = ({
  isOpen,
  toggle,
}: {
  isOpen: boolean;
  toggle: () => void;
}) => {
  return (
    <button
      className="flex items-center justify-center w-10 h-10 relative focus:outline-none rounded-full transition-colors hover:bg-amber-500/10 group"
      onClick={toggle}
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      <div className="flex flex-col justify-center items-center w-6 h-6 relative">
        <span
          className={`w-full h-0.5 rounded-full bg-current block transition-all duration-300 ease-out ${
            isOpen ? "absolute rotate-45" : "-translate-y-1.5"
          }`}
        ></span>
        <span
          className={`w-full h-0.5 rounded-full bg-current block transition-all duration-200 ease-out ${
            isOpen ? "opacity-0" : "opacity-100"
          }`}
        ></span>
        <span
          className={`w-full h-0.5 rounded-full bg-current block transition-all duration-300 ease-out ${
            isOpen ? "absolute -rotate-45" : "translate-y-1.5"
          }`}
        ></span>
      </div>
      <span className="absolute inset-0 rounded-full transition-colors group-hover:text-amber-500"></span>
    </button>
  );
};

export default function Navbar({
  user,
  signOut,
  setShowKeyboardShortcuts = () => {},
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when route changes
  useEffect(() => {
    const handleRouteChange = () => {
      setMobileMenuOpen(false);
      setUserMenuOpen(false);
    };

    window.addEventListener("popstate", handleRouteChange);
    return () => {
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, []);

  // Handle click outside to close user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuOpen &&
        userMenuRef.current &&
        userButtonRef.current &&
        !userMenuRef.current.contains(event.target as Node) &&
        !userButtonRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && userMenuOpen) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [userMenuOpen]);

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
      transition={{ duration: 0.5 }}
      className="fixed top-0 z-50 w-full backdrop-blur-lg bg-background/80 border-b border-border/40 shadow-sm"
    >
      {/* Amber accent line at bottom of navbar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500/40 via-amber-500/80 to-amber-500/40 w-full"></div>

      <div className="container max-w-full sm:max-w-7xl mx-auto px-2 sm:px-4 md:px-6">
        <div className="flex justify-between items-center py-3 md:py-4">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center space-x-2 text-foreground hover:text-amber-500 transition-colors group"
            >
              <div className="transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:rotate-1">
                <Logo
                  showText
                  variant="compact"
                  size="sm"
                  className="group-hover:drop-shadow-md"
                />
              </div>
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-amber-500 transition-colors"
              onClick={navigateToHome}
            >
              <Home className="h-4 w-4 mr-2" />
              Domů
            </Button>

            <Link href="/subscription">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-amber-500"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Předplatné
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-amber-500"
              onClick={() => setShowKeyboardShortcuts(true)}
            >
              <Keyboard className="h-4 w-4 mr-2" />
              Zkratky
            </Button>

            {user && (
              <div className="relative ml-2">
                <Button
                  ref={userButtonRef}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex items-center space-x-1 text-muted-foreground hover:text-amber-500",
                    userMenuOpen &&
                      "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  )}
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center">
                    <UserIllustration name={user.name} email={user.email} />
                  </div>
                  <span className="ml-2 hidden sm:inline-block">
                    {user.name || user.email?.split("@")[0] || "Uživatel"}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      userMenuOpen ? "rotate-180" : "rotate-0"
                    )}
                  />
                </Button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      ref={userMenuRef}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border border-border/50 overflow-hidden z-50"
                    >
                      {/* Amber accent line at top of dropdown */}
                      <div className="h-0.5 bg-amber-500/70 w-full"></div>

                      {/* ESC key indicator */}
                      <div className="absolute top-2 right-2">
                        <div className="text-xs px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-500 dark:text-zinc-400 flex items-center gap-1 opacity-70">
                          <kbd className="font-mono text-[10px]">ESC</kbd>
                        </div>
                      </div>

                      <div className="p-2 flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-foreground hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition-all duration-200 rounded-md group"
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
                            className="w-full justify-start text-foreground hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 rounded-md group"
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
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <HamburgerMenuButton
              isOpen={mobileMenuOpen}
              toggle={() => setMobileMenuOpen(!mobileMenuOpen)}
            />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: 1,
              height: "auto",
            }}
            exit={{
              opacity: 0,
              height: 0,
            }}
            transition={{
              duration: 0.3,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="md:hidden border-t border-border/40 bg-card/95 backdrop-blur-sm fixed top-[56px] left-0 right-0 z-40 overflow-x-hidden"
          >
            {/* Full width amber decoration at top of mobile menu */}
            <div className="h-0.5 bg-gradient-to-r from-amber-500/40 via-amber-500/80 to-amber-500/40 w-full"></div>

            <motion.div
              className="container max-w-full sm:max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: {
                  delay: 0.1,
                  staggerChildren: 0.05,
                },
              }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-foreground hover:bg-amber-500/10 hover:text-amber-500 transition-all duration-200 rounded-md py-5"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigateToHome();
                  }}
                >
                  <Home className="h-5 w-5 mr-2 sm:mr-3" />
                  <span className="text-sm sm:text-base">Domů</span>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, delay: 0.05 }}
              >
                <Link href="/subscription" className="w-full">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-foreground hover:bg-amber-500/10 hover:text-amber-500 transition-all duration-200 rounded-md py-5"
                    onClick={() => {
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Wallet className="h-5 w-5 mr-2 sm:mr-3" />
                    <span className="text-sm sm:text-base">Předplatné</span>
                  </Button>
                </Link>
              </motion.div>

              {user && (
                <>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                    className="pt-3 mt-2 border-t border-border/40"
                  >
                    <div className="flex items-center space-x-3 px-2 py-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center">
                        <UserIllustration name={user.name} email={user.email} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {user.name || user.email?.split("@")[0] || "Uživatel"}
                        </p>
                        {user.email && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2, delay: 0.15 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-foreground hover:bg-amber-500/10 hover:text-amber-500 transition-all duration-200 rounded-md py-5"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigateToSettings();
                      }}
                    >
                      <Settings className="h-5 w-5 mr-2 sm:mr-3" />
                      <span className="text-sm sm:text-base">Nastavení</span>
                    </Button>
                  </motion.div>

                  {signOut && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2, delay: 0.2 }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-foreground hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 rounded-md py-5"
                        onClick={() => signOut()}
                      >
                        <LogOut className="h-5 w-5 mr-2 sm:mr-3" />
                        <span className="text-sm sm:text-base">
                          Odhlásit se
                        </span>
                      </Button>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
