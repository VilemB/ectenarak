"use client";

import { Github } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="backdrop-blur-sm border-t border-border/40 py-6 sm:py-8 md:py-10 bg-background/80 shadow-[0_-1px_5px_rgba(0,0,0,0.05)] relative z-10 mt-auto"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <Logo showText={false} size="sm" />
              <span className="font-medium">eČtenářák</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {currentYear} Všechna práva vyhrazena
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/terms">Podmínky</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/privacy">Soukromí</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/contact">Kontakt</Link>
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <motion.a
              href="https://github.com/VilemB"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Github className="h-5 w-5" />
              <span className="text-sm hidden sm:inline">GitHub</span>
            </motion.a>
            <motion.div
              className="text-sm text-muted-foreground flex items-center gap-1.5"
              whileHover={{ color: "rgba(255, 255, 255, 0.9)" }}
            >
              Made by Vilém Barnet
            </motion.div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
