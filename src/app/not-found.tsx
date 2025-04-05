"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCallback } from "react";

export default function NotFound() {
  const router = useRouter();

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <div className="flex items-center justify-center flex-1 px-4 py-20">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-16">
          <div className="text-[160px] font-bold tracking-tight leading-none select-none">
            <span className="text-[#F0A500] [text-shadow:_0_0_30px_rgba(240,165,0,0.3)]">
              404
            </span>
          </div>
        </div>

        <h1 className="text-4xl font-bold mb-6 text-[#F0A500]">
          Stránka nenalezena
        </h1>

        <p className="text-gray-400 mb-16 text-lg max-w-lg mx-auto">
          Omlouváme se, ale stránka, kterou hledáte, neexistuje nebo byla
          přesunuta.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            size="lg"
            className="group border-[#F0A500] text-[#F0A500] hover:bg-[#F0A500]/10"
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span>Zpět</span>
          </Button>
          <Link href="/" prefetch={false}>
            <Button
              size="lg"
              className="group bg-[#F0A500] hover:bg-[#F0A500]/90 text-[#0E1420]"
            >
              <Home className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              <span>Domů</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
