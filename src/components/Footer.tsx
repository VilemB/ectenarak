"use client";

import { Github } from "lucide-react";
import { motion } from "framer-motion";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="w-full bg-white border-t border-gray-100"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>© {currentYear}</span>
            <span>•</span>
            <span>Čtenářský deník</span>
            <span>•</span>
            <div className="flex items-center gap-1">Made by Vilém Barnet</div>
          </div>

          <div className="flex items-center gap-4">
            <motion.a
              href="https://github.com/VilemB"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Github className="h-5 w-5" />
            </motion.a>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
