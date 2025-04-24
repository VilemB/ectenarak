"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { ArrowRight, LogIn, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface LandingNavbarProps {
  scrollY: number;
}

// Animated hamburger menu component matching Navbar.tsx
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
      aria-expanded={isOpen}
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

export default function LandingNavbar({ scrollY }: LandingNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerButtonRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Check if we're on the landing page
  const isLandingPage = pathname === "/";

  // Calculate scroll progress (only on landing page)
  useEffect(() => {
    if (!isLandingPage) return;

    const handleScroll = () => {
      const totalScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = Math.min(
        (window.scrollY / totalScroll) * 100,
        100
      );
      setScrollProgress(currentProgress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLandingPage]);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Handle click outside and ESC key to close mobile menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isMenuOpen &&
        mobileMenuRef.current &&
        hamburgerButtonRef.current &&
        !mobileMenuRef.current.contains(e.target as Node) &&
        !hamburgerButtonRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleNavClick = async (id: string) => {
    if (isLandingPage) {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
      // Add a small delay before closing the menu to ensure scroll starts
      setTimeout(() => {
        setIsMenuOpen(false);
      }, 100); // 100ms delay
    } else {
      // If not on landing page, navigate to landing page with hash
      await router.push(`/#${id}`);
      // Wait for the page to load and then scroll to the section
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  };

  if (!isMounted) return null;

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-[100] w-full backdrop-blur-lg bg-background/80 border-b border-border/40 shadow-sm"
      >
        {/* Progress indicator using amber gradient - expands from center */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden">
          <div
            className="absolute inset-x-0 h-full bg-gradient-to-r from-amber-500/40 via-amber-500/80 to-amber-500/40"
            style={{
              width: `${scrollProgress}%`,
              left: `${50 - scrollProgress / 2}%`,
              opacity: scrollY > 10 ? 1 : 0,
              transition: "width 0.3s, left 0.3s, opacity 0.3s",
            }}
          />
        </div>

        <div className="container max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center py-3 md:py-4">
            {/* Logo */}
            <div className="flex items-center">
              <Link
                href="/"
                className="flex items-center space-x-2 text-foreground hover:text-amber-500 transition-colors group"
              >
                <div className="transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:rotate-1">
                  <Logo
                    showText
                    variant="compact"
                    size="md"
                    className="group-hover:drop-shadow-md"
                  />
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {isLandingPage ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-amber-500 transition-colors"
                    onClick={() => handleNavClick("features-section")}
                  >
                    Funkce
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-amber-500 transition-colors"
                    onClick={() => handleNavClick("pricing-section")}
                  >
                    Ceník
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-amber-500 transition-colors"
                    onClick={() => handleNavClick("faq-section")}
                  >
                    FAQ
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm ml-1 group"
                    onClick={() => handleNavClick("signup-section")}
                  >
                    Přihlásit se
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/legal/podminky">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-amber-500 transition-colors"
                    >
                      Podmínky
                    </Button>
                  </Link>
                  <Link href="/legal/soukromi">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-amber-500 transition-colors"
                    >
                      Soukromí
                    </Button>
                  </Link>
                  <Link href="/kontakt">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-amber-500 transition-colors"
                    >
                      Kontakt
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm ml-1 group"
                    >
                      <ArrowLeft className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                      Zpět
                    </Button>
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden" ref={hamburgerButtonRef}>
              <HamburgerMenuButton
                isOpen={isMenuOpen}
                toggle={() => setIsMenuOpen(!isMenuOpen)}
              />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu - exactly matching Navbar.tsx style */}
      <AnimatePresence>
        {isMenuOpen && (
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
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="md:hidden border-t border-border/40 bg-card/95 backdrop-blur-sm overflow-hidden fixed top-[56px] left-0 right-0 z-40 overflow-x-hidden"
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
              {isLandingPage ? (
                <>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-foreground hover:bg-amber-500/10 hover:text-amber-500 transition-all duration-200 rounded-md py-5 group"
                      onClick={() => handleNavClick("features-section")}
                    >
                      <span className="text-sm sm:text-base group-hover:translate-x-0.5 transition-transform">
                        Funkce
                      </span>
                    </Button>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-foreground hover:bg-amber-500/10 hover:text-amber-500 transition-all duration-200 rounded-md py-5 group"
                      onClick={() => handleNavClick("pricing-section")}
                    >
                      <span className="text-sm sm:text-base group-hover:translate-x-0.5 transition-transform">
                        Ceník
                      </span>
                    </Button>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-foreground hover:bg-amber-500/10 hover:text-amber-500 transition-all duration-200 rounded-md py-5 group"
                      onClick={() => handleNavClick("faq-section")}
                    >
                      <span className="text-sm sm:text-base group-hover:translate-x-0.5 transition-transform">
                        FAQ
                      </span>
                    </Button>
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
                      className="w-full justify-start text-foreground hover:bg-amber-500/10 hover:text-amber-500 transition-all duration-200 rounded-md py-5 group"
                      onClick={() => handleNavClick("signup-section")}
                    >
                      <LogIn className="h-5 w-5 mr-2 sm:mr-3 text-amber-500" />
                      <span className="text-sm sm:text-base group-hover:translate-x-0.5 transition-transform">
                        Přihlásit se
                      </span>
                    </Button>
                  </motion.div>
                </>
              ) : (
                <>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link href="/legal/podminky" className="w-full">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-foreground hover:bg-amber-500/10 hover:text-amber-500 transition-all duration-200 rounded-md py-5 group"
                      >
                        <span className="text-sm sm:text-base group-hover:translate-x-0.5 transition-transform">
                          Podmínky
                        </span>
                      </Button>
                    </Link>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                  >
                    <Link href="/legal/soukromi" className="w-full">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-foreground hover:bg-amber-500/10 hover:text-amber-500 transition-all duration-200 rounded-md py-5 group"
                      >
                        <span className="text-sm sm:text-base group-hover:translate-x-0.5 transition-transform">
                          Soukromí
                        </span>
                      </Button>
                    </Link>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                  >
                    <Link href="/kontakt" className="w-full">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-foreground hover:bg-amber-500/10 hover:text-amber-500 transition-all duration-200 rounded-md py-5 group"
                      >
                        <span className="text-sm sm:text-base group-hover:translate-x-0.5 transition-transform">
                          Kontakt
                        </span>
                      </Button>
                    </Link>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2, delay: 0.15 }}
                  >
                    <Link href="/" className="w-full">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-foreground hover:bg-amber-500/10 hover:text-amber-500 transition-all duration-200 rounded-md py-5 group"
                      >
                        <ArrowLeft className="h-5 w-5 mr-2 sm:mr-3 text-amber-500" />
                        <span className="text-sm sm:text-base group-hover:translate-x-0.5 transition-transform">
                          Zpět
                        </span>
                      </Button>
                    </Link>
                  </motion.div>
                </>
              )}
            </motion.div>

            {/* ESC key indicator - only show when menu is active */}
            <div className="absolute bottom-4 right-4 hidden sm:block opacity-70">
              <div className="text-xs px-1.5 py-0.5 bg-zinc-800/50 rounded text-zinc-400 flex items-center gap-1">
                <kbd className="font-mono text-[10px]">ESC</kbd>
                <span className="text-[10px]">zavřít</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
