"use client";

import { Github, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="backdrop-blur-sm border-t border-border py-6"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.8)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0 flex items-center">
            <BookOpen className="h-5 w-5 text-primary mr-2" />
            <p className="text-sm text-muted-foreground">
              &copy; {currentYear} Čtenářský deník. Všechna práva vyhrazena.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <motion.a
              href="https://github.com/VilemB"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Github className="h-5 w-5" />
            </motion.a>
            <motion.span
              className="text-sm text-muted-foreground flex items-center gap-1.5"
              whileHover={{ color: "rgba(255, 255, 255, 0.9)" }}
            >
              Made by Vilém Barnet
            </motion.span>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
