"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center flex-1 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-12"
          >
            <div className="text-[180px] font-bold tracking-tight leading-none">
              <span className="text-[#F0A500] [text-shadow:_0_0_30px_rgba(240,165,0,0.3)]">
                404
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold mb-4 text-[#F0A500]"
          >
            Stránka nenalezena
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400 mb-12 text-lg"
          >
            Omlouváme se, ale stránka, kterou hledáte, neexistuje nebo byla
            přesunuta.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              variant="outline"
              size="lg"
              className="group border-[#F0A500] text-[#F0A500] hover:bg-[#F0A500]/10"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Zpět
            </Button>
            <Link href="/">
              <Button
                size="lg"
                className="group bg-[#F0A500] hover:bg-[#F0A500]/90 text-[#0E1420]"
              >
                <Home className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Domů
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
