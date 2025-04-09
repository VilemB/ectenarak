"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { ArrowRight, LogIn } from "lucide-react";

interface LandingNavbarProps {
  scrollY: number;
  scrollToSection: (id: string) => void;
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

export default function LandingNavbar({
  scrollY,
  scrollToSection,
}: LandingNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerButtonRef = useRef<HTMLDivElement>(null);

  // Calculate scroll progress
  useEffect(() => {
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
  }, []);

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

    // Close menu on route changes
    const handleRouteChange = () => {
      setIsMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("popstate", handleRouteChange);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMenuOpen]);

  // Navigate to section with proper handling
  const handleNavClick = (id: string) => {
    setIsMenuOpen(false);

    // Add a slight delay for mobile menu to close before scrolling
    setTimeout(() => {
      scrollToSection(id);
    }, 300);
  };

  const navItems = [
    { id: "features-section", label: "Funkce" },
    { id: "pricing-section", label: "Ceník" },
    { id: "signup-section", label: "Přihlásit se", icon: LogIn },
  ];

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

        <div className="container max-w-full sm:max-w-7xl mx-auto px-2 sm:px-4 md:px-6">
          <div className="flex justify-between items-center py-3 md:py-4">
            {/* Logo */}
            <div className="flex items-center">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
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
              </a>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.slice(0, -1).map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-amber-500 transition-colors"
                  onClick={() => handleNavClick(item.id)}
                >
                  {item.label}
                </Button>
              ))}
              <Button
                variant="default"
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm ml-1 group"
                onClick={() => handleNavClick("signup-section")}
              >
                {navItems[navItems.length - 1].label}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Button>
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
              {navItems.map((item, index) => {
                const Icon = item?.icon;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2, delay: 0.05 * index }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-foreground hover:bg-amber-500/10 hover:text-amber-500 transition-all duration-200 rounded-md py-5 group"
                      onClick={() => handleNavClick(item.id)}
                    >
                      {Icon && (
                        <Icon
                          className={`h-5 w-5 mr-2 sm:mr-3 ${
                            index === navItems.length - 1
                              ? "text-amber-500"
                              : ""
                          }`}
                        />
                      )}
                      <span className="text-sm sm:text-base group-hover:translate-x-0.5 transition-transform">
                        {item.label}
                      </span>
                    </Button>
                  </motion.div>
                );
              })}
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
